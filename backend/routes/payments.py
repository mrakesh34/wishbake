import json
import logging
import os
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from backend.database import SessionLocal, get_db
from backend.db_models import OrderDB, WebhookEventDB
from backend.models import (
    OnlinePaymentConfigResponse,
    OrderResponse,
    PaymentStatusResponse,
    PaymentVerifyRequest,
    UserProfile,
    serialize_order_response,
)
from backend.routes.auth import require_auth
from backend.services.payment_gateway import (
    PaymentGatewayAPIError,
    PaymentGatewayConfigError,
    get_checkout_sdk_meta,
    get_gateway_config,
    is_allowed_webhook_ip,
    reconcile_order_with_gateway,
    verify_webhook_signature,
)

logger = logging.getLogger("wishbake.payments")
router = APIRouter(prefix="/api/payments/online", tags=["Online Payments"])


def _get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for", "")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _reconcile_order_background(order_id: str) -> None:
    """Verify and reconcile order status in a fresh DB session after returning 200 to the gateway."""
    db = SessionLocal()
    try:
        order = db.query(OrderDB).filter(OrderDB.order_id == order_id).first()
        if not order or order.payment_method == "COD":
            return
        reconcile_order_with_gateway(db, order)
    except Exception as exc:
        logger.error("Background webhook reconciliation failed for order %s: %s", order_id, type(exc).__name__)
        db.rollback()
    finally:
        db.close()


@router.get("/config", response_model=OnlinePaymentConfigResponse)
def get_public_payment_config():
    """Return non-secret online payment mode and checkout SDK metadata."""
    sdk_meta = get_checkout_sdk_meta()
    try:
        cfg = get_gateway_config(require_configured=False)
        return OnlinePaymentConfigResponse(
            configured=cfg.is_configured,
            mode=cfg.mode,
            api_version=cfg.api_version,
            sdk_url=sdk_meta["sdk_url"],
            sdk_global=sdk_meta["sdk_global"],
        )
    except PaymentGatewayConfigError:
        return OnlinePaymentConfigResponse(
            configured=False,
            mode="production",
            api_version="2026-01-01",
            sdk_url=sdk_meta["sdk_url"],
            sdk_global=sdk_meta["sdk_global"],
        )


@router.post("/verify", response_model=PaymentStatusResponse)
def verify_online_payment(
    req: PaymentVerifyRequest,
    user: UserProfile = Depends(require_auth),
    db: Session = Depends(get_db),
):
    """Authoritatively verify an online payment order against the payment gateway."""
    order = db.query(OrderDB).filter(OrderDB.order_id == req.order_id.strip()).first()
    if not order or order.user_id != user.user_id:
        raise HTTPException(status_code=404, detail="Order not found.")
    if order.payment_method == "COD":
        raise HTTPException(status_code=400, detail="This order does not use Online Payment.")

    try:
        updated_order, gateway_state = reconcile_order_with_gateway(db, order)
    except PaymentGatewayConfigError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except PaymentGatewayAPIError as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc

    return PaymentStatusResponse(
        order=serialize_order_response(updated_order),
        order_status=gateway_state["order_status"],
        payment_status=gateway_state["payment_status"],
        payment_message=gateway_state.get("payment_message"),
        error_code=gateway_state.get("error_code"),
        error_reason=gateway_state.get("error_reason"),
    )


@router.post("/retry/{order_id}", response_model=OrderResponse)
def retry_online_payment(
    order_id: str,
    user: UserProfile = Depends(require_auth),
    db: Session = Depends(get_db),
):
    """Return an active payment session for an unpaid online order, or report if already paid/expired."""
    order = db.query(OrderDB).filter(OrderDB.order_id == order_id.strip()).first()
    if not order or order.user_id != user.user_id:
        raise HTTPException(status_code=404, detail="Order not found.")
    if order.payment_method == "COD":
        raise HTTPException(status_code=400, detail="Only online payment orders can be retried.")

    try:
        updated_order, gateway_state = reconcile_order_with_gateway(db, order)
    except PaymentGatewayConfigError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except PaymentGatewayAPIError as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc

    if updated_order.payment_status == "PAID":
        return serialize_order_response(updated_order)

    if gateway_state["order_status"] != "ACTIVE" or not updated_order.payment_session_id:
        raise HTTPException(
            status_code=409,
            detail="This payment session has expired. Please place a new order from your bag.",
        )

    return serialize_order_response(updated_order)


@router.post("/webhook")
async def payment_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """Receive, cryptographically verify, deduplicate, and process payment webhooks."""
    try:
        cfg = get_gateway_config(require_configured=True)
    except PaymentGatewayConfigError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    enforce_ip = (
        os.getenv("PAYMENT_GATEWAY_ENFORCE_WEBHOOK_IP")
        or os.getenv("CASHFREE_ENFORCE_WEBHOOK_IP")
        or "false"
    ).strip().lower() in {"1", "true", "yes"}
    if enforce_ip:
        client_ip = _get_client_ip(request)
        if not is_allowed_webhook_ip(client_ip):
            logger.warning("Rejected payment webhook from unwhitelisted IP %s", client_ip)
            raise HTTPException(status_code=403, detail="Forbidden webhook source IP.")

    raw_body = await request.body()
    signature = request.headers.get("x-webhook-signature")
    timestamp = request.headers.get("x-webhook-timestamp")
    tolerance = int(
        (
            os.getenv("PAYMENT_GATEWAY_WEBHOOK_TOLERANCE_SECONDS")
            or os.getenv("CASHFREE_WEBHOOK_TOLERANCE_SECONDS")
            or "300"
        )
    )

    valid, reason = verify_webhook_signature(
        signature=signature,
        timestamp=timestamp,
        raw_body=raw_body,
        secret_key=cfg.secret_key,
        tolerance_seconds=tolerance,
    )
    if not valid:
        logger.warning("Payment webhook verification failed: %s", reason)
        status_code = 400 if "Missing" in reason else 401
        raise HTTPException(status_code=status_code, detail=reason)

    try:
        payload = json.loads(raw_body.decode("utf-8"))
        if not isinstance(payload, dict):
            raise ValueError("Webhook payload must be a JSON object.")
    except (UnicodeDecodeError, ValueError, json.JSONDecodeError) as exc:
        raise HTTPException(status_code=400, detail="Invalid JSON webhook payload.") from exc

    event_type = str(payload.get("type") or "UNKNOWN")
    data = payload.get("data") if isinstance(payload.get("data"), dict) else {}
    order_data = data.get("order") if isinstance(data.get("order"), dict) else {}
    payment_data = data.get("payment") if isinstance(data.get("payment"), dict) else {}

    order_id = order_data.get("order_id")
    gateway_payment_id: Optional[str] = (
        str(payment_data["cf_payment_id"]) if payment_data.get("cf_payment_id") is not None else None
    )

    if not order_id:
        return {"status": "ok"}

    idempotency_key = (
        request.headers.get("x-idempotency-key")
        or f"{event_type}:{gateway_payment_id or 'none'}:{order_id}"
    )

    existing = db.query(WebhookEventDB).filter(WebhookEventDB.idempotency_key == idempotency_key).first()
    if existing:
        return {"status": "already_processed"}

    try:
        db.add(
            WebhookEventDB(
                idempotency_key=idempotency_key,
                order_id=str(order_id),
                event_type=event_type,
                cf_payment_id=gateway_payment_id,
                processed_at=datetime.utcnow().isoformat() + "Z",
            )
        )
        db.commit()
    except IntegrityError:
        db.rollback()
        return {"status": "already_processed"}

    if event_type in {
        "PAYMENT_SUCCESS_WEBHOOK",
        "PAYMENT_FAILED_WEBHOOK",
        "PAYMENT_USER_DROPPED_WEBHOOK",
    }:
        background_tasks.add_task(_reconcile_order_background, str(order_id))

    return {"status": "ok"}
