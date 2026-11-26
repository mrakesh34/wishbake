import base64
import hashlib
import hmac
import logging
import os
import re
import time
import uuid
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

import httpx
from sqlalchemy.orm import Session

from backend.db_models import CartDB, OrderDB

logger = logging.getLogger("wishbake.payments")

IST = timezone(timedelta(hours=5, minutes=30))
PRODUCTION_MODE = "production"
_PRODUCTION_BASE_URL = "https://" + "api.cashfree.com/pg"
_CHECKOUT_SCRIPT_URL = "https://" + "sdk.cashfree.com/js/v3/cashfree.js"
_CHECKOUT_GLOBAL_NAME = "Cash" + "free"
DEFAULT_API_VERSION = "2026-01-01"
PRODUCTION_WEBHOOK_IPS = {"52.66.101.190", "3.109.102.144", "18.60.134.245", "18.60.183.142"}
MAX_GATEWAY_ORDER_INR = 1_000_000.0


class PaymentGatewayConfigError(RuntimeError):
    """Raised when payment gateway environment or credential settings are missing or invalid."""


class PaymentGatewayAPIError(RuntimeError):
    """Raised when payment gateway API calls fail or return an error status."""

    def __init__(self, message: str, status_code: int = 502, error_code: Optional[str] = None):
        super().__init__(message)
        self.status_code = status_code
        self.error_code = error_code


@dataclass(frozen=True)
class GatewayConfig:
    mode: str
    base_url: str
    app_id: str
    secret_key: str
    api_version: str

    @property
    def is_configured(self) -> bool:
        return bool(self.app_id and self.secret_key)


def _env_first(*names: str, default: str = "") -> str:
    for name in names:
        val = os.getenv(name, "").strip()
        if val:
            return val
    return default


def normalize_gateway_mode(raw_mode: Optional[str] = None) -> str:
    """Validate payment gateway mode, allowing only live/production."""
    value = (raw_mode or _env_first("PAYMENT_GATEWAY_ENV", "CASHFREE_ENV")).strip().lower()
    if value in {"sandbox", "test", "staging", "dev", "development"}:
        raise PaymentGatewayConfigError(
            "Sandbox/test payment mode is disabled; only live/production mode is supported."
        )
    return PRODUCTION_MODE


def _resolve_production_credentials() -> tuple[str, str]:
    live_id = _env_first("PAYMENT_GATEWAY_LIVE_APP_ID", "CASHFREE_LIVE_APP_ID", "CASHFREE_PROD_APP_ID")
    live_secret = _env_first(
        "PAYMENT_GATEWAY_LIVE_SECRET_KEY",
        "CASHFREE_LIVE_SECRET_KEY",
        "CASHFREE_PROD_SECRET_KEY",
    )
    if live_id and live_secret:
        return live_id, live_secret

    return (
        _env_first("PAYMENT_GATEWAY_APP_ID", "CASHFREE_APP_ID"),
        _env_first("PAYMENT_GATEWAY_SECRET_KEY", "CASHFREE_SECRET_KEY"),
    )


def _validate_production_credentials(app_id: str, secret_key: str) -> None:
    if not app_id or not secret_key:
        return
    upper_id = app_id.upper()
    lower_secret = secret_key.lower()
    if upper_id.startswith("TEST") or "_test_" in lower_secret:
        raise PaymentGatewayConfigError(
            "Live/production credentials are required; test/sandbox credentials are not accepted."
        )


def get_gateway_config(mode_override: Optional[str] = None, require_configured: bool = True) -> GatewayConfig:
    """Build and validate live/production online payment gateway configuration from environment variables."""
    mode = normalize_gateway_mode(mode_override)
    app_id, secret_key = _resolve_production_credentials()
    api_version = _env_first("PAYMENT_GATEWAY_API_VERSION", "CASHFREE_API_VERSION", default=DEFAULT_API_VERSION)

    _validate_production_credentials(app_id, secret_key)

    cfg = GatewayConfig(
        mode=mode,
        base_url=_PRODUCTION_BASE_URL,
        app_id=app_id,
        secret_key=secret_key,
        api_version=api_version,
    )
    if require_configured and not cfg.is_configured:
        raise PaymentGatewayConfigError(
            "Online payment gateway is currently unavailable. Please try Cash on Delivery."
        )
    return cfg


def get_checkout_sdk_meta() -> dict[str, str]:
    """Return client SDK script URL and global constructor name from server config."""
    return {
        "sdk_url": _CHECKOUT_SCRIPT_URL,
        "sdk_global": _CHECKOUT_GLOBAL_NAME,
    }


def sanitize_gateway_phone(phone: str) -> str:
    """Convert stored phone strings like '+91 9876543210' to 10-digit format."""
    digits = re.sub(r"\D", "", phone or "")
    if len(digits) >= 10:
        return digits[-10:]
    return digits


def get_frontend_return_url() -> str:
    """Resolve the server-trusted return_url without using any client-controlled header."""
    configured = os.getenv("FRONTEND_URL", "").strip().rstrip("/")
    if not configured:
        cors_env = os.getenv("CORS_ORIGINS", "")
        candidates = [
            origin.strip().rstrip("/")
            for origin in cors_env.split(",")
            if origin.strip() and origin.strip() != "*"
        ]
        https_candidate = next((c for c in candidates if c.startswith("https://")), None)
        configured = https_candidate or (candidates[0] if candidates else "http://127.0.0.1:5173")
    return f"{configured}/payment-return"


def get_webhook_notify_url() -> Optional[str]:
    """Resolve HTTPS notify_url when BACKEND_URL is configured for public HTTPS traffic."""
    backend_url = os.getenv("BACKEND_URL", "").strip().rstrip("/")
    if backend_url.startswith("https://"):
        return f"{backend_url}/api/payments/online/webhook"
    return None


def _build_headers(cfg: GatewayConfig, idempotency_key: Optional[str] = None) -> dict[str, str]:
    headers = {
        "Content-Type": "application/json",
        "Connection": "keep-alive",
        "x-api-version": cfg.api_version,
        "x-client-id": cfg.app_id,
        "x-client-secret": cfg.secret_key,
        "x-request-id": str(uuid.uuid4()),
    }
    if idempotency_key:
        headers["x-idempotency-key"] = idempotency_key
    return headers


def _check_response_headers(response: httpx.Response) -> None:
    deprecated_at = response.headers.get("x-deprecated-at")
    if deprecated_at:
        logger.warning("Payment gateway API deprecation warning: x-deprecated-at=%s", deprecated_at)


def _extract_gateway_error(response: httpx.Response) -> tuple[str, Optional[str]]:
    try:
        payload = response.json()
        if isinstance(payload, dict):
            code = payload.get("code")
            msg = payload.get("message") or "Online payment gateway request failed."
            return str(msg), str(code) if code else None
    except Exception:
        pass
    return f"Payment gateway returned HTTP {response.status_code}.", None


def _gateway_request(
    method: str,
    path: str,
    cfg: GatewayConfig,
    json_body: Optional[dict[str, Any]] = None,
    idempotency_key: Optional[str] = None,
) -> Any:
    url = f"{cfg.base_url}{path}"
    headers = _build_headers(cfg, idempotency_key=idempotency_key)
    try:
        with httpx.Client(timeout=15.0) as client:
            response = client.request(method, url, headers=headers, json=json_body)
    except httpx.TimeoutException as exc:
        logger.error("Payment gateway timeout on %s %s", method, path)
        raise PaymentGatewayAPIError("Payment gateway timed out. Please try again.", status_code=504) from exc
    except httpx.RequestError as exc:
        logger.error("Payment gateway network error on %s %s: %s", method, path, type(exc).__name__)
        raise PaymentGatewayAPIError("Unable to reach the online payment gateway.", status_code=502) from exc

    _check_response_headers(response)

    if response.status_code >= 400:
        msg, code = _extract_gateway_error(response)
        logger.warning("Payment gateway error %s on %s %s (code=%s)", response.status_code, method, path, code)
        mapped_status = 502 if response.status_code >= 500 else 400
        raise PaymentGatewayAPIError(msg, status_code=mapped_status, error_code=code)

    return response.json()


def create_gateway_order(
    *,
    order: OrderDB,
    customer_id: str,
    cfg: GatewayConfig,
) -> dict[str, Any]:
    """Create an online payment order and return the gateway payload including payment_session_id."""
    amount = round(float(order.total_amount), 2)
    if amount <= 0 or amount > MAX_GATEWAY_ORDER_INR:
        raise PaymentGatewayAPIError("Order amount is outside the allowed INR limit.", status_code=422)

    phone = sanitize_gateway_phone(order.customer_phone)
    if len(phone) != 10:
        raise PaymentGatewayAPIError("A valid 10-digit Indian phone number is required for online checkout.", status_code=422)

    order_meta: dict[str, Any] = {
        "return_url": get_frontend_return_url(),
    }
    notify_url = get_webhook_notify_url()
    if notify_url:
        order_meta["notify_url"] = notify_url

    expiry_dt = (datetime.now(IST) + timedelta(minutes=30)).isoformat(timespec="seconds")

    payload = {
        "order_id": order.order_id,
        "order_amount": amount,
        "order_currency": "INR",
        "customer_details": {
            "customer_id": customer_id,
            "customer_name": order.customer_name,
            "customer_email": order.customer_email,
            "customer_phone": phone,
        },
        "order_meta": order_meta,
        "order_expiry_time": expiry_dt,
        "order_note": f"WISHBAKE order {order.order_id}",
    }

    return _gateway_request("POST", "/orders", cfg, json_body=payload, idempotency_key=order.order_id)


def fetch_gateway_order(order_id: str, mode_override: Optional[str] = None) -> dict[str, Any]:
    cfg = get_gateway_config(mode_override=mode_override, require_configured=True)
    return _gateway_request("GET", f"/orders/{order_id}", cfg)


def fetch_gateway_payments(order_id: str, mode_override: Optional[str] = None) -> list[dict[str, Any]]:
    cfg = get_gateway_config(mode_override=mode_override, require_configured=True)
    data = _gateway_request("GET", f"/orders/{order_id}/payments", cfg)
    return data if isinstance(data, list) else []


def verify_webhook_signature(
    *,
    signature: Optional[str],
    timestamp: Optional[str],
    raw_body: bytes,
    secret_key: str,
    tolerance_seconds: int = 300,
) -> tuple[bool, str]:
    """Verify gateway webhook signature using timestamp + raw body bytes and constant-time compare."""
    if not signature or not timestamp:
        return False, "Missing webhook signature or timestamp headers."
    if not secret_key:
        return False, "Gateway secret key is not configured."

    if tolerance_seconds > 0:
        try:
            raw_ts = float(timestamp)
            ts_seconds = raw_ts / 1000.0 if raw_ts > 1e12 else raw_ts
        except (TypeError, ValueError):
            return False, "Malformed webhook timestamp."
        if abs(time.time() - ts_seconds) > tolerance_seconds:
            return False, "Stale webhook timestamp."

    signed_payload = timestamp.encode("utf-8") + raw_body
    digest = hmac.new(secret_key.encode("utf-8"), signed_payload, hashlib.sha256).digest()
    expected_signature = base64.b64encode(digest).decode("utf-8")

    if not hmac.compare_digest(expected_signature, signature.strip()):
        return False, "Invalid webhook signature."

    return True, "ok"


def is_allowed_webhook_ip(client_ip: str) -> bool:
    return client_ip in PRODUCTION_WEBHOOK_IPS


def _select_latest_payment(payments: list[dict[str, Any]]) -> Optional[dict[str, Any]]:
    if not payments:
        return None
    success_payment = next((p for p in payments if p.get("payment_status") == "SUCCESS"), None)
    if success_payment:
        return success_payment
    return payments[0]


def reconcile_order_with_gateway(db: Session, order: OrderDB) -> tuple[OrderDB, dict[str, Any]]:
    """
    Re-fetch authoritative order and payment state from the payment gateway and update OrderDB + CartDB idempotently.
    Never transitions a PAID order back to pending/failed.
    """
    gw_order = fetch_gateway_order(order.order_id)
    payments = fetch_gateway_payments(order.order_id)

    gw_order_status = str(gw_order.get("order_status") or "ACTIVE").upper()
    gw_order_id = gw_order.get("cf_order_id")
    if gw_order_id is not None:
        order.cf_order_id = str(gw_order_id)

    latest_payment = _select_latest_payment(payments)
    payment_status = str((latest_payment or {}).get("payment_status") or "NOT_ATTEMPTED").upper()
    error_details = (latest_payment or {}).get("error_details") or {}
    error_code = error_details.get("error_code")
    error_reason = error_details.get("error_reason")
    display_message = (
        (latest_payment or {}).get("payment_message")
        or error_details.get("error_description")
    )

    if latest_payment:
        if latest_payment.get("cf_payment_id") is not None:
            order.cf_payment_id = str(latest_payment["cf_payment_id"])
        if latest_payment.get("bank_reference"):
            order.payment_reference = str(latest_payment["bank_reference"])

    if order.payment_status == "PAID":
        db.commit()
        db.refresh(order)
        return order, {
            "order_status": "PAID",
            "payment_status": "SUCCESS",
            "payment_message": order.payment_message,
            "error_code": None,
            "error_reason": None,
        }

    if gw_order_status == "PAID":
        gw_amount = float(gw_order.get("order_amount") or 0)
        gw_currency = str(gw_order.get("order_currency") or "").upper()
        expected_amount = round(float(order.total_amount), 2)

        if gw_currency != "INR" or abs(gw_amount - expected_amount) > 0.01:
            logger.error(
                "Amount/currency mismatch on order %s: expected %.2f INR, got %.2f %s",
                order.order_id,
                expected_amount,
                gw_amount,
                gw_currency,
            )
            order.payment_status = "FAILED"
            order.payment_message = "Payment amount mismatch detected during verification."
            db.commit()
            db.refresh(order)
            raise PaymentGatewayAPIError("Payment amount verification mismatch.", status_code=400, error_code="amount_mismatch")

        order.payment_status = "PAID"
        order.status = "CONFIRMED"
        order.payment_message = str(display_message or "Payment verified.")[:255]
        order.paid_at = (latest_payment or {}).get("payment_time") or (datetime.utcnow().isoformat() + "Z")

        if order.user_id:
            cart = db.query(CartDB).filter(CartDB.user_id == order.user_id).first()
            if cart and cart.items:
                cart.items = []
                cart.updated_at = datetime.utcnow().isoformat() + "Z"

        db.commit()
        db.refresh(order)
        return order, {
            "order_status": "PAID",
            "payment_status": "SUCCESS",
            "payment_message": order.payment_message,
            "error_code": None,
            "error_reason": None,
        }

    if gw_order_status in {"EXPIRED", "TERMINATED"}:
        order.payment_status = "FAILED"
        order.status = "CANCELLED"
        order.payment_message = str(display_message or "Payment session expired.")[:255]
    elif payment_status in {"FAILED", "CANCELLED", "VOID"}:
        order.payment_status = "FAILED"
        order.status = "AWAITING_PAYMENT"
        order.payment_message = str(display_message or "Payment could not be completed.")[:255]
    else:
        order.payment_status = "PENDING"
        order.status = "AWAITING_PAYMENT"
        if display_message:
            order.payment_message = str(display_message)[:255]

    db.commit()
    db.refresh(order)
    return order, {
        "order_status": gw_order_status,
        "payment_status": payment_status,
        "payment_message": order.payment_message,
        "error_code": error_code,
        "error_reason": error_reason,
    }
