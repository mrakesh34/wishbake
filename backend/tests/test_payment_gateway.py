import base64
import hashlib
import hmac
import json
import os
import time
import unittest
from datetime import datetime, timedelta, timezone
from unittest.mock import patch

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

os.environ.setdefault("DATABASE_URL", "postgresql://user:pass@localhost:5432/wishbake_test")

from backend.database import Base, get_db  # noqa: E402
from backend.db_models import CartDB, OrderDB, SessionDB, UserDB  # noqa: E402
from backend.main import app  # noqa: E402
from backend.routes import payments as payments_route  # noqa: E402
from backend.services.payment_gateway import (  # noqa: E402
    PaymentGatewayConfigError,
    get_gateway_config,
    sanitize_gateway_phone,
    verify_webhook_signature,
)

IST = timezone(timedelta(hours=5, minutes=30))


class FakeResponse:
    def __init__(self, status_code: int, payload, headers: dict | None = None):
        self.status_code = status_code
        self._payload = payload
        self.headers = headers or {}

    def json(self):
        return self._payload


def make_fake_httpx_client_cls(handler):
    class FakeHttpxClient:
        def __init__(self, *args, **kwargs):
            pass

        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc, tb):
            return False

        def request(self, method, url, headers=None, json=None):
            return handler(method, url, headers=headers, json=json)

    return FakeHttpxClient


def sign_gateway_webhook(timestamp: str, raw_body: bytes, secret: str) -> str:
    digest = hmac.new(secret.encode("utf-8"), timestamp.encode("utf-8") + raw_body, hashlib.sha256).digest()
    return base64.b64encode(digest).decode("utf-8")


class OnlinePaymentIntegrationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.test_engine = create_engine(
            "sqlite://",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        cls.TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=cls.test_engine)
        Base.metadata.create_all(bind=cls.test_engine)

    def setUp(self):
        Base.metadata.drop_all(bind=self.test_engine)
        Base.metadata.create_all(bind=self.test_engine)

        def override_get_db():
            db = self.TestingSessionLocal()
            try:
                yield db
            finally:
                db.close()

        app.dependency_overrides[get_db] = override_get_db
        self._orig_payments_session_local = payments_route.SessionLocal
        payments_route.SessionLocal = self.TestingSessionLocal
        self.client = TestClient(app)

        db = self.TestingSessionLocal()
        try:
            db.add(UserDB(id="user-1", email="priya@example.com", name="Priya", is_verified=True))
            db.add(UserDB(id="user-2", email="other@example.com", name="Other", is_verified=True))
            db.add(SessionDB(token="tok-1", email="priya@example.com"))
            db.add(SessionDB(token="tok-2", email="other@example.com"))
            db.add(CartDB(user_id="user-1", items=[{"item_type": "preset", "cake_id": "cake-kesar-pista", "quantity": 1}]))
            db.commit()
        finally:
            db.close()

        self.tomorrow = (datetime.now(IST).date() + timedelta(days=2)).strftime("%Y-%m-%d")
        self.sample_order_payload = {
            "customer_name": "Priya Mohanty",
            "customer_email": "priya@example.com",
            "customer_phone": "+91 9876543210",
            "flat_house_no": "Plot 42, Kalinga Residency",
            "street_locality": "Janpath Road, Saheed Nagar",
            "landmark": "Esplanade One",
            "city": "Bhubaneswar",
            "state": "Odisha",
            "pincode": "751007",
            "delivery_date": self.tomorrow,
            "delivery_time_slot": "afternoon",
            "payment_method": "ONLINE",
            "items": [
                {
                    "item_type": "preset",
                    "cake_id": "cake-kesar-pista",
                    "size": "1lb",
                    "title": "Tampered Client Title",
                    "quantity": 1,
                    "unit_price": 1.0,
                }
            ],
        }

    def tearDown(self):
        app.dependency_overrides.clear()
        payments_route.SessionLocal = self._orig_payments_session_local

    def test_config_supports_both_sandbox_and_production_and_blocks_mismatch(self):
        env_both = {
            "CASHFREE_ENV": "sandbox",
            "CASHFREE_SANDBOX_APP_ID": "TEST123456",
            "CASHFREE_SANDBOX_SECRET_KEY": "gw_ma_test_secret",
            "CASHFREE_LIVE_APP_ID": "PROD999999",
            "CASHFREE_LIVE_SECRET_KEY": "gw_ma_prod_secret",
        }
        with patch.dict(os.environ, env_both, clear=False):
            sb_cfg = get_gateway_config()
            self.assertEqual(sb_cfg.mode, "sandbox")
            self.assertIn("sandbox", sb_cfg.base_url)
            self.assertEqual(sb_cfg.app_id, "TEST123456")

        with patch.dict(os.environ, {**env_both, "CASHFREE_ENV": "live"}, clear=False):
            prod_cfg = get_gateway_config()
            self.assertEqual(prod_cfg.mode, "production")
            self.assertIn("api.", prod_cfg.base_url)
            self.assertEqual(prod_cfg.app_id, "PROD999999")

        mismatch_env = {
            "CASHFREE_ENV": "production",
            "CASHFREE_APP_ID": "TEST_ACCIDENTAL",
            "CASHFREE_SECRET_KEY": "gw_ma_test_secret",
            "CASHFREE_LIVE_APP_ID": "",
            "CASHFREE_LIVE_SECRET_KEY": "",
        }
        with patch.dict(os.environ, mismatch_env, clear=False):
            with self.assertRaises(PaymentGatewayConfigError):
                get_gateway_config()

    def test_public_config_endpoint_never_leaks_secrets(self):
        env = {
            "CASHFREE_ENV": "test",
            "CASHFREE_APP_ID": "TEST_APP_ABC",
            "CASHFREE_SECRET_KEY": "gw_test_super_secret",
        }
        with patch.dict(os.environ, env, clear=False):
            res = self.client.get("/api/payments/online/config")
            self.assertEqual(res.status_code, 200)
            body = res.json()
            self.assertEqual(body["mode"], "sandbox")
            self.assertTrue(body["configured"])
            self.assertTrue(body["sdk_url"].startswith("https://"))
            self.assertTrue(bool(body["sdk_global"]))
            self.assertNotIn("TEST_APP_ABC", res.text)
            self.assertNotIn("super_secret", res.text)

    def test_sanitize_phone(self):
        self.assertEqual(sanitize_gateway_phone("+91 9876543210"), "9876543210")

    def test_cod_order_still_confirms_and_clears_cart(self):
        cod_payload = {**self.sample_order_payload, "payment_method": "COD"}
        res = self.client.post(
            "/api/orders",
            headers={"Authorization": "Bearer tok-1"},
            json=cod_payload,
        )
        self.assertEqual(res.status_code, 200, res.text)
        data = res.json()
        self.assertEqual(data["status"], "CONFIRMED")
        self.assertEqual(data["payment_status"], "PENDING")
        self.assertEqual(data["total_amount"], 1948.0)

        db = self.TestingSessionLocal()
        try:
            cart = db.query(CartDB).filter(CartDB.user_id == "user-1").first()
            self.assertEqual(cart.items, [])
        finally:
            db.close()

    def test_online_order_creates_session_uses_server_price_and_preserves_cart(self):
        captured = {}

        def fake_request(method, url, headers=None, json=None):
            captured["method"] = method
            captured["url"] = url
            captured["headers"] = headers
            captured["json"] = json
            return FakeResponse(
                200,
                {
                    "cf_order_id": "2149460581",
                    "order_id": json["order_id"],
                    "order_status": "ACTIVE",
                    "payment_session_id": "session_test_abc123",
                },
            )

        env = {
            "CASHFREE_ENV": "sandbox",
            "CASHFREE_APP_ID": "TEST_APP",
            "CASHFREE_SECRET_KEY": "gw_test_secret",
            "FRONTEND_URL": "https://wishbake.vercel.app",
            "BACKEND_URL": "https://wishbake-api.onrender.com",
        }
        with patch.dict(os.environ, env, clear=False), patch(
            "backend.services.payment_gateway.httpx.Client",
            new=make_fake_httpx_client_cls(fake_request),
        ):
            res = self.client.post(
                "/api/orders",
                headers={"Authorization": "Bearer tok-1"},
                json=self.sample_order_payload,
            )

        self.assertEqual(res.status_code, 200, res.text)
        data = res.json()
        self.assertEqual(data["total_amount"], 1948.0)
        self.assertEqual(data["status"], "AWAITING_PAYMENT")
        self.assertEqual(data["payment_status"], "PENDING")
        self.assertEqual(data["payment_method"], "ONLINE")
        self.assertEqual(data["payment_session_id"], "session_test_abc123")
        self.assertEqual(data["gateway_mode"], "sandbox")

        self.assertEqual(captured["headers"]["x-api-version"], "2026-01-01")
        self.assertEqual(captured["json"]["order_amount"], 1948.0)
        self.assertEqual(captured["json"]["customer_details"]["customer_phone"], "9876543210")
        self.assertEqual(captured["json"]["order_meta"]["return_url"], "https://wishbake.vercel.app/payment-return")
        self.assertEqual(
            captured["json"]["order_meta"]["notify_url"],
            "https://wishbake-api.onrender.com/api/payments/online/webhook",
        )

        db = self.TestingSessionLocal()
        try:
            cart = db.query(CartDB).filter(CartDB.user_id == "user-1").first()
            self.assertEqual(len(cart.items), 1)
        finally:
            db.close()

    def test_verify_and_retry_payment_security_and_idempotency(self):
        db = self.TestingSessionLocal()
        try:
            db.add(
                OrderDB(
                    order_id="WISH-VERIFY01",
                    customer_name="Priya",
                    customer_email="priya@example.com",
                    customer_phone="+91 9876543210",
                    delivery_address="Saheed Nagar",
                    delivery_date=self.tomorrow,
                    total_amount=1948.0,
                    delivery_fee=149.0,
                    payment_method="ONLINE",
                    payment_status="PENDING",
                    payment_gateway_env="sandbox",
                    payment_session_id="session_123",
                    status="AWAITING_PAYMENT",
                    items=[],
                    user_id="user-1",
                )
            )
            db.commit()
        finally:
            db.close()

        env = {
            "CASHFREE_ENV": "sandbox",
            "CASHFREE_APP_ID": "TEST_APP",
            "CASHFREE_SECRET_KEY": "gw_test_secret",
        }

        with patch.dict(os.environ, env, clear=False):
            idor_res = self.client.post(
                "/api/payments/online/verify",
                headers={"Authorization": "Bearer tok-2"},
                json={"order_id": "WISH-VERIFY01"},
            )
            self.assertEqual(idor_res.status_code, 404)

        def fake_active(method, url, headers=None, json=None):
            if url.endswith("/payments"):
                return FakeResponse(200, [{"cf_payment_id": "111", "payment_status": "USER_DROPPED"}])
            return FakeResponse(200, {"cf_order_id": "222", "order_status": "ACTIVE", "order_amount": 1948.0, "order_currency": "INR"})

        with patch.dict(os.environ, env, clear=False), patch(
            "backend.services.payment_gateway.httpx.Client",
            new=make_fake_httpx_client_cls(fake_active),
        ):
            retry_res = self.client.post(
                "/api/payments/online/retry/WISH-VERIFY01",
                headers={"Authorization": "Bearer tok-1"},
            )
            self.assertEqual(retry_res.status_code, 200)
            self.assertEqual(retry_res.json()["payment_session_id"], "session_123")

        def fake_tampered(method, url, headers=None, json=None):
            if url.endswith("/payments"):
                return FakeResponse(200, [{"cf_payment_id": "999", "payment_status": "SUCCESS"}])
            return FakeResponse(200, {"cf_order_id": "222", "order_status": "PAID", "order_amount": 1.0, "order_currency": "INR"})

        with patch.dict(os.environ, env, clear=False), patch(
            "backend.services.payment_gateway.httpx.Client",
            new=make_fake_httpx_client_cls(fake_tampered),
        ):
            tamper_res = self.client.post(
                "/api/payments/online/verify",
                headers={"Authorization": "Bearer tok-1"},
                json={"order_id": "WISH-VERIFY01"},
            )
            self.assertEqual(tamper_res.status_code, 400)

        def fake_paid(method, url, headers=None, json=None):
            if url.endswith("/payments"):
                return FakeResponse(
                    200,
                    [{
                        "cf_payment_id": "1453002795",
                        "payment_status": "SUCCESS",
                        "bank_reference": "UTR998877",
                        "payment_time": "2026-11-26T19:55:00+05:30",
                    }],
                )
            return FakeResponse(
                200,
                {"cf_order_id": "2149460581", "order_status": "PAID", "order_amount": 1948.0, "order_currency": "INR"},
            )

        with patch.dict(os.environ, env, clear=False), patch(
            "backend.services.payment_gateway.httpx.Client",
            new=make_fake_httpx_client_cls(fake_paid),
        ):
            ok_res = self.client.post(
                "/api/payments/online/verify",
                headers={"Authorization": "Bearer tok-1"},
                json={"order_id": "WISH-VERIFY01"},
            )
            self.assertEqual(ok_res.status_code, 200, ok_res.text)
            payload = ok_res.json()
            self.assertEqual(payload["order_status"], "PAID")
            self.assertEqual(payload["order"]["status"], "CONFIRMED")
            self.assertEqual(payload["order"]["payment_status"], "PAID")
            self.assertEqual(payload["order"]["gateway_payment_id"], "1453002795")

            ok_res_2 = self.client.post(
                "/api/payments/online/verify",
                headers={"Authorization": "Bearer tok-1"},
                json={"order_id": "WISH-VERIFY01"},
            )
            self.assertEqual(ok_res_2.status_code, 200)
            self.assertEqual(ok_res_2.json()["order"]["payment_status"], "PAID")

        db = self.TestingSessionLocal()
        try:
            cart = db.query(CartDB).filter(CartDB.user_id == "user-1").first()
            self.assertEqual(cart.items, [])
        finally:
            db.close()

    def test_webhook_signature_raw_body_replay_and_idempotency(self):
        secret = "gw_test_webhook_secret"
        db = self.TestingSessionLocal()
        try:
            db.add(
                OrderDB(
                    order_id="WISH-HOOK01",
                    customer_name="Priya",
                    customer_email="priya@example.com",
                    customer_phone="+91 9876543210",
                    delivery_address="Saheed Nagar",
                    delivery_date=self.tomorrow,
                    total_amount=1948.0,
                    delivery_fee=149.0,
                    payment_method="ONLINE",
                    payment_status="PENDING",
                    payment_gateway_env="sandbox",
                    status="AWAITING_PAYMENT",
                    items=[],
                    user_id="user-1",
                )
            )
            db.commit()
        finally:
            db.close()

        raw_body = (
            b'{"data":{"order":{"order_id":"WISH-HOOK01","order_amount":1948.00,"order_currency":"INR"},'
            b'"payment":{"cf_payment_id":"555000111","payment_status":"SUCCESS"}},"type":"PAYMENT_SUCCESS_WEBHOOK"}'
        )
        ts_ms = str(int(time.time() * 1000))
        sig = sign_gateway_webhook(ts_ms, raw_body, secret)

        env = {
            "CASHFREE_ENV": "sandbox",
            "CASHFREE_APP_ID": "TEST_APP",
            "CASHFREE_SECRET_KEY": secret,
        }

        def fake_paid(method, url, headers=None, json=None):
            if url.endswith("/payments"):
                return FakeResponse(200, [{"cf_payment_id": "555000111", "payment_status": "SUCCESS"}])
            return FakeResponse(200, {"cf_order_id": "777", "order_status": "PAID", "order_amount": 1948.0, "order_currency": "INR"})

        with patch.dict(os.environ, env, clear=False), patch(
            "backend.services.payment_gateway.httpx.Client",
            new=make_fake_httpx_client_cls(fake_paid),
        ):
            r_missing = self.client.post("/api/payments/online/webhook", content=raw_body)
            self.assertEqual(r_missing.status_code, 400)

            r_bad_sig = self.client.post(
                "/api/payments/online/webhook",
                content=raw_body,
                headers={"x-webhook-timestamp": ts_ms, "x-webhook-signature": "bad=="},
            )
            self.assertEqual(r_bad_sig.status_code, 401)

            stale_ts = str(int((time.time() - 600) * 1000))
            stale_sig = sign_gateway_webhook(stale_ts, raw_body, secret)
            r_stale = self.client.post(
                "/api/payments/online/webhook",
                content=raw_body,
                headers={"x-webhook-timestamp": stale_ts, "x-webhook-signature": stale_sig},
            )
            self.assertEqual(r_stale.status_code, 401)

            r_ok = self.client.post(
                "/api/payments/online/webhook",
                content=raw_body,
                headers={
                    "x-webhook-timestamp": ts_ms,
                    "x-webhook-signature": sig,
                    "x-idempotency-key": "idem-hook-1",
                },
            )
            self.assertEqual(r_ok.status_code, 200)
            self.assertEqual(r_ok.json()["status"], "ok")

            r_dup = self.client.post(
                "/api/payments/online/webhook",
                content=raw_body,
                headers={
                    "x-webhook-timestamp": ts_ms,
                    "x-webhook-signature": sig,
                    "x-idempotency-key": "idem-hook-1",
                },
            )
            self.assertEqual(r_dup.status_code, 200)
            self.assertEqual(r_dup.json()["status"], "already_processed")

        db = self.TestingSessionLocal()
        try:
            order = db.query(OrderDB).filter(OrderDB.order_id == "WISH-HOOK01").first()
            self.assertEqual(order.payment_status, "PAID")
            self.assertEqual(order.status, "CONFIRMED")
            cart = db.query(CartDB).filter(CartDB.user_id == "user-1").first()
            self.assertEqual(cart.items, [])
        finally:
            db.close()

    def test_verify_signature_rejects_reformatted_json(self):
        secret = "gw_test_secret"
        raw_body = b'{"order_amount":170.00}'
        ts = str(int(time.time() * 1000))
        sig = sign_gateway_webhook(ts, raw_body, secret)
        re_serialized = json.dumps(json.loads(raw_body.decode())).encode("utf-8")
        ok, _ = verify_webhook_signature(
            signature=sig, timestamp=ts, raw_body=re_serialized, secret_key=secret
        )
        self.assertFalse(ok)

    def test_signup_otp_has_no_dev_otp_fallback(self):
        with patch.dict(os.environ, {"BREVO_API_KEY": "", "BREVO_SENDER_EMAIL": ""}, clear=False):
            res = self.client.post(
                "/api/auth/signup",
                json={"email": "new@example.com", "password": "Password123!", "name": "Priya"},
            )
            self.assertEqual(res.status_code, 503)
            self.assertNotIn("dev_otp", res.text)


if __name__ == "__main__":
    unittest.main()
