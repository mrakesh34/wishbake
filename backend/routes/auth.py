import hashlib
import hmac
import math
import os
import re
import secrets
import time
import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.db_models import CartDB, EmailDispatchLogDB, OrderDB, OtpDB, SessionDB, UserDB
from backend.models import (
    AuthResponse,
    EMAIL_REGEX,
    OrderResponse,
    ResendOtpRequest,
    SavedAddress,
    SendOtpResponse,
    UpdateProfileRequest,
    UserProfile,
    VerifyOtpRequest,
    serialize_order_response,
)
from backend.services.email_service import EmailDeliveryError, send_otp_email

router = APIRouter(prefix="/api/auth", tags=["Accounts"])

OTP_EXPIRY_SECONDS = int(os.getenv("OTP_EXPIRY_SECONDS", "600"))
MAX_OTP_ATTEMPTS = int(os.getenv("MAX_OTP_ATTEMPTS", "5"))
OTP_LOCKOUT_SECONDS = int(os.getenv("OTP_LOCKOUT_SECONDS", "900"))
OTP_RESEND_COOLDOWN_SECONDS = int(os.getenv("OTP_RESEND_COOLDOWN_SECONDS", "60"))
MAX_OTP_SENDS_PER_EMAIL_HOUR = int(os.getenv("MAX_OTP_SENDS_PER_EMAIL_HOUR", "4"))
MAX_OTP_SENDS_PER_EMAIL_DAY = int(os.getenv("MAX_OTP_SENDS_PER_EMAIL_DAY", "8"))
MAX_OTP_SENDS_PER_IP_HOUR = int(os.getenv("MAX_OTP_SENDS_PER_IP_HOUR", "15"))
BREVO_DAILY_QUOTA_CAP = int(os.getenv("BREVO_DAILY_QUOTA_CAP", "250"))
OTP_CODE_REGEX = re.compile(r"^\d{6}$")


class Credentials(BaseModel):
    email: str = Field(min_length=3, max_length=255)
    password: str = Field(min_length=8, max_length=128)
    name: Optional[str] = Field(default=None, max_length=120)


def _normalize_email(raw_email: str) -> str:
    return (raw_email or "").strip().lower()


def _validate_email_or_422(raw_email: str) -> str:
    email = _normalize_email(raw_email)
    if not email or len(email) > 255 or not EMAIL_REGEX.match(email):
        raise HTTPException(status_code=422, detail="Enter a valid email address.")
    return email


def _get_client_ip(request: Optional[Request]) -> str:
    if not request:
        return "unknown"
    forwarded_for = (request.headers.get("x-forwarded-for") or "").strip()
    if forwarded_for:
        first_ip = forwarded_for.split(",")[0].strip()
        if first_ip:
            return first_ip[:64]
    if request.client and request.client.host:
        return request.client.host[:64]
    return "unknown"


def _format_wait_duration(seconds: int) -> str:
    if seconds >= 60:
        minutes = math.ceil(seconds / 60)
        return f"{minutes} minute{'s' if minutes != 1 else ''}"
    return f"{seconds} second{'s' if seconds != 1 else ''}"


def _hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 310_000)
    return f"pbkdf2_sha256${salt.hex()}${digest.hex()}"


def _check_password(password: str, stored: str) -> bool:
    try:
        algorithm, salt, expected = stored.split("$")
        if algorithm != "pbkdf2_sha256":
            return False
        actual = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), bytes.fromhex(salt), 310_000).hex()
        return hmac.compare_digest(actual, expected)
    except (ValueError, TypeError):
        return False


def _derive_otp_key(salt: bytes) -> bytes:
    pepper = os.getenv("OTP_SECRET", "").strip().encode("utf-8")
    return hashlib.sha256(pepper + salt).digest() if pepper else salt


def _hash_otp(email: str, otp: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hmac.new(
        _derive_otp_key(salt),
        f"{email}:{otp}".encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
    return f"hmac_sha256${salt.hex()}${digest}"


def _verify_otp_hash(email: str, otp_input: str, stored_hash: str) -> bool:
    try:
        algorithm, salt_hex, expected = (stored_hash or "").split("$", 2)
        if algorithm != "hmac_sha256":
            return False
        salt = bytes.fromhex(salt_hex)
        actual = hmac.new(
            _derive_otp_key(salt),
            f"{email}:{otp_input}".encode("utf-8"),
            hashlib.sha256,
        ).hexdigest()
        return hmac.compare_digest(actual, expected)
    except (ValueError, TypeError):
        return False


def _profile(user: UserDB) -> UserProfile:
    return UserProfile(
        user_id=user.id,
        email=user.email,
        name=user.name,
        phone=user.phone,
        addresses=[SavedAddress(**address) for address in (user.addresses or [])],
        created_at=user.created_at,
        is_verified=bool(user.is_verified),
    )


def get_current_user_from_token(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
) -> Optional[UserProfile]:
    parts = (authorization or "").split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return None
    session = db.query(SessionDB).filter(SessionDB.token == parts[1]).first()
    user = db.query(UserDB).filter(UserDB.email == session.email).first() if session else None
    if not user or not user.is_verified:
        return None
    return _profile(user)


def require_auth(user: Optional[UserProfile] = Depends(get_current_user_from_token)) -> UserProfile:
    if not user:
        raise HTTPException(status_code=401, detail="Please sign in to continue.")
    return user


def _issue_session(user: UserDB, db: Session, message: str = "Signed in successfully."):
    token = secrets.token_urlsafe(48)
    db.add(SessionDB(token=token, email=user.email))
    db.commit()
    return {"success": True, "token": token, "user": _profile(user), "message": message}


def _enforce_otp_send_limits(email: str, client_ip: str, db: Session, now: float) -> Optional[OtpDB]:
    # Keep dispatch log bounded to a rolling 48-hour retention window.
    db.query(EmailDispatchLogDB).filter(EmailDispatchLogDB.created_time < (now - 172800)).delete()

    existing = (
        db.query(OtpDB)
        .filter(OtpDB.email == email)
        .order_by(OtpDB.id.desc())
        .with_for_update()
        .first()
    )

    if existing and existing.locked_until and now < existing.locked_until:
        retry_after = max(1, int(math.ceil(existing.locked_until - now)))
        raise HTTPException(
            status_code=429,
            detail=f"Too many incorrect attempts. Please wait {_format_wait_duration(retry_after)} before requesting a new verification code.",
            headers={"Retry-After": str(retry_after)},
        )

    if existing and (now - existing.created_time) < OTP_RESEND_COOLDOWN_SECONDS:
        retry_after = max(1, int(math.ceil(OTP_RESEND_COOLDOWN_SECONDS - (now - existing.created_time))))
        raise HTTPException(
            status_code=429,
            detail=f"Please wait {retry_after} second{'s' if retry_after != 1 else ''} before requesting another verification code.",
            headers={"Retry-After": str(retry_after)},
        )

    day_ago = now - 86400
    hour_ago = now - 3600

    global_daily_sends = (
        db.query(EmailDispatchLogDB)
        .filter(EmailDispatchLogDB.created_time >= day_ago)
        .count()
    )
    if global_daily_sends >= BREVO_DAILY_QUOTA_CAP:
        raise HTTPException(
            status_code=503,
            detail="Email verification is temporarily at today's safety quota. Please try again later.",
        )

    email_hourly_sends = (
        db.query(EmailDispatchLogDB)
        .filter(EmailDispatchLogDB.email == email, EmailDispatchLogDB.created_time >= hour_ago)
        .count()
    )
    if email_hourly_sends >= MAX_OTP_SENDS_PER_EMAIL_HOUR:
        raise HTTPException(
            status_code=429,
            detail="Too many verification codes requested for this email. Please wait an hour and try again.",
        )

    email_daily_sends = (
        db.query(EmailDispatchLogDB)
        .filter(EmailDispatchLogDB.email == email, EmailDispatchLogDB.created_time >= day_ago)
        .count()
    )
    if email_daily_sends >= MAX_OTP_SENDS_PER_EMAIL_DAY:
        raise HTTPException(
            status_code=429,
            detail="Daily verification limit reached for this email address. Please try again tomorrow.",
        )

    if client_ip != "unknown":
        ip_hourly_sends = (
            db.query(EmailDispatchLogDB)
            .filter(EmailDispatchLogDB.client_ip == client_ip, EmailDispatchLogDB.created_time >= hour_ago)
            .count()
        )
        if ip_hourly_sends >= MAX_OTP_SENDS_PER_IP_HOUR:
            raise HTTPException(
                status_code=429,
                detail="Too many verification requests from your network. Please wait before trying again.",
            )

    return existing


async def _dispatch_signup_otp(
    *,
    email: str,
    name: Optional[str],
    password_hash: str,
    client_ip: str,
    db: Session,
    now: float,
) -> SendOtpResponse:
    otp_code = f"{secrets.randbelow(1_000_000):06d}"
    otp_hash = _hash_otp(email, otp_code)

    db.query(OtpDB).filter(OtpDB.email == email).delete()
    db.add(
        OtpDB(
            email=email,
            otp_code=otp_hash,
            expires_at=now + OTP_EXPIRY_SECONDS,
            created_time=now,
            attempts=0,
            locked_until=None,
            name=name,
            password_hash=password_hash,
        )
    )
    db.add(
        EmailDispatchLogDB(
            email=email,
            client_ip=client_ip,
            purpose="signup_otp",
            created_time=now,
        )
    )
    db.flush()

    try:
        await send_otp_email(
            to_email=email,
            otp=otp_code,
            user_name=name,
            expiry_minutes=max(1, OTP_EXPIRY_SECONDS // 60),
        )
    except EmailDeliveryError as exc:
        db.rollback()
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    db.commit()

    return SendOtpResponse(
        success=True,
        verification_required=True,
        email=email,
        message=f"A 6-digit verification code has been sent to {email}.",
        expires_in_seconds=OTP_EXPIRY_SECONDS,
        resend_cooldown_seconds=OTP_RESEND_COOLDOWN_SECONDS,
    )


@router.post("/signup", response_model=SendOtpResponse)
async def signup(req: Credentials, request: Request, db: Session = Depends(get_db)):
    email = _validate_email_or_422(req.email)
    clean_name = re.sub(r"\s+", " ", (req.name or "").strip())
    if req.name is not None and len(clean_name) < 2:
        raise HTTPException(status_code=422, detail="Enter your full name (at least 2 characters).")
    pending_name = clean_name or email.split("@")[0]

    existing_user = db.query(UserDB).filter(UserDB.email == email).first()
    if existing_user and existing_user.is_verified:
        raise HTTPException(status_code=409, detail="An account with this email already exists.")

    now = time.time()
    client_ip = _get_client_ip(request)
    _enforce_otp_send_limits(email, client_ip, db, now)

    return await _dispatch_signup_otp(
        email=email,
        name=pending_name,
        password_hash=_hash_password(req.password),
        client_ip=client_ip,
        db=db,
        now=now,
    )


@router.post("/resend-otp", response_model=SendOtpResponse)
async def resend_signup_otp(req: ResendOtpRequest, request: Request, db: Session = Depends(get_db)):
    email = _validate_email_or_422(req.email)

    existing_user = db.query(UserDB).filter(UserDB.email == email).first()
    if existing_user and existing_user.is_verified:
        raise HTTPException(status_code=409, detail="This email is already verified. Please sign in.")

    now = time.time()
    client_ip = _get_client_ip(request)
    existing_otp = _enforce_otp_send_limits(email, client_ip, db, now)

    if not existing_otp or not existing_otp.password_hash:
        raise HTTPException(
            status_code=400,
            detail="No pending sign-up found for this email. Please complete the sign-up form first.",
        )

    return await _dispatch_signup_otp(
        email=email,
        name=existing_otp.name,
        password_hash=existing_otp.password_hash,
        client_ip=client_ip,
        db=db,
        now=now,
    )


@router.post("/verify-otp", response_model=AuthResponse)
def verify_signup_otp(req: VerifyOtpRequest, db: Session = Depends(get_db)):
    email = _validate_email_or_422(req.email)
    otp_input = re.sub(r"\s+", "", req.otp or "")
    if not OTP_CODE_REGEX.match(otp_input):
        raise HTTPException(status_code=422, detail="Enter the 6-digit verification code.")

    stored_otp = (
        db.query(OtpDB)
        .filter(OtpDB.email == email)
        .order_by(OtpDB.id.desc())
        .with_for_update()
        .first()
    )
    if not stored_otp:
        raise HTTPException(
            status_code=400,
            detail="No verification code found for this email. Please sign up again.",
        )

    now = time.time()
    if stored_otp.locked_until and now < stored_otp.locked_until:
        retry_after = max(1, int(math.ceil(stored_otp.locked_until - now)))
        raise HTTPException(
            status_code=429,
            detail=f"Too many incorrect attempts. Please wait {_format_wait_duration(retry_after)} before requesting a new verification code.",
            headers={"Retry-After": str(retry_after)},
        )

    if stored_otp.attempts >= MAX_OTP_ATTEMPTS:
        raise HTTPException(
            status_code=400,
            detail="This verification code was locked after too many incorrect attempts. Please request a new code.",
        )

    if now > stored_otp.expires_at:
        raise HTTPException(
            status_code=400,
            detail="Verification code has expired. Please request a new code.",
        )

    if not _verify_otp_hash(email, otp_input, stored_otp.otp_code):
        stored_otp.attempts += 1
        if stored_otp.attempts >= MAX_OTP_ATTEMPTS:
            stored_otp.locked_until = now + OTP_LOCKOUT_SECONDS
            db.commit()
            raise HTTPException(
                status_code=429,
                detail=f"Too many incorrect attempts. Verification locked for {_format_wait_duration(OTP_LOCKOUT_SECONDS)}.",
                headers={"Retry-After": str(OTP_LOCKOUT_SECONDS)},
            )
        remaining = MAX_OTP_ATTEMPTS - stored_otp.attempts
        db.commit()
        raise HTTPException(
            status_code=400,
            detail=f"Invalid verification code. {remaining} attempt{'s' if remaining != 1 else ''} remaining.",
        )

    existing_user = db.query(UserDB).filter(UserDB.email == email).first()
    if existing_user and existing_user.is_verified:
        db.query(OtpDB).filter(OtpDB.email == email).delete()
        db.commit()
        raise HTTPException(status_code=409, detail="An account with this email already exists. Please sign in.")

    resolved_name = (stored_otp.name or (req.name or "").strip() or email.split("@")[0]).strip()
    if existing_user:
        existing_user.is_verified = True
        existing_user.name = resolved_name
        if stored_otp.password_hash:
            existing_user.password_hash = stored_otp.password_hash
        if not db.query(CartDB).filter(CartDB.user_id == existing_user.id).first():
            db.add(CartDB(user_id=existing_user.id, items=[]))
        user = existing_user
    else:
        if not stored_otp.password_hash:
            raise HTTPException(
                status_code=400,
                detail="Pending sign-up session is incomplete. Please fill out the sign-up form again.",
            )
        user = UserDB(
            id=f"USR-{uuid.uuid4().hex[:12].upper()}",
            email=email,
            name=resolved_name,
            addresses=[],
            is_verified=True,
            password_hash=stored_otp.password_hash,
            created_at=datetime.utcnow().isoformat() + "Z",
        )
        db.add(user)
        db.flush()
        db.add(CartDB(user_id=user.id, items=[]))

    db.query(OtpDB).filter(OtpDB.email == email).delete()
    return _issue_session(user, db, message="Email verified and account created.")


@router.post("/login")
def login(req: Credentials, db: Session = Depends(get_db)):
    email = _validate_email_or_422(req.email)
    user = db.query(UserDB).filter(UserDB.email == email).first()
    if not user or not user.password_hash or not _check_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Email or password is incorrect.")
    if not user.is_verified:
        raise HTTPException(
            status_code=403,
            detail="Please verify your email address through sign-up before signing in.",
        )
    return _issue_session(user, db, message="Signed in successfully.")


@router.get("/me", response_model=UserProfile)
def get_me(user: UserProfile = Depends(require_auth)):
    return user


@router.post("/logout")
def logout(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    parts = (authorization or "").split()
    if len(parts) == 2 and parts[0].lower() == "bearer":
        db.query(SessionDB).filter(SessionDB.token == parts[1]).delete()
        db.commit()
    return {"success": True}


@router.put("/profile", response_model=UserProfile)
def update_profile(
    req: UpdateProfileRequest,
    user: UserProfile = Depends(require_auth),
    db: Session = Depends(get_db),
):
    record = db.query(UserDB).filter(UserDB.id == user.user_id).first()
    if req.name is not None:
        record.name = req.name.strip()
    if req.phone is not None:
        record.phone = req.phone.strip()
    if req.addresses is not None:
        record.addresses = [a.model_dump() for a in req.addresses]
    db.commit()
    db.refresh(record)
    return _profile(record)


@router.get("/cart")
def get_cart(user: UserProfile = Depends(require_auth), db: Session = Depends(get_db)):
    cart = db.query(CartDB).filter(CartDB.user_id == user.user_id).first()
    return {"items": cart.items if cart else []}


@router.put("/cart")
def save_cart(payload: dict, user: UserProfile = Depends(require_auth), db: Session = Depends(get_db)):
    items = payload.get("items", [])
    if not isinstance(items, list) or len(items) > 100:
        raise HTTPException(status_code=422, detail="Cart must be a list of up to 100 items.")
    cart = db.query(CartDB).filter(CartDB.user_id == user.user_id).first()
    if not cart:
        cart = CartDB(user_id=user.user_id, items=items)
        db.add(cart)
    else:
        cart.items = items
        cart.updated_at = datetime.utcnow().isoformat() + "Z"
    db.commit()
    return {"items": items}


@router.get("/orders", response_model=list[OrderResponse])
def get_user_orders(user: UserProfile = Depends(require_auth), db: Session = Depends(get_db)):
    orders = db.query(OrderDB).filter(OrderDB.user_id == user.user_id).order_by(OrderDB.created_at.desc()).all()
    return [serialize_order_response(o) for o in orders]
