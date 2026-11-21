import time
import secrets
import re
import uuid
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Header, BackgroundTasks, Depends
from sqlalchemy.orm import Session

from wishbake_backend.database import get_db
from wishbake_backend.db_models import UserDB, OtpDB, SessionDB, OrderDB
from wishbake_backend.models import (
    SendOtpRequest, SendOtpResponse,
    VerifyOtpRequest, AuthResponse,
    UserProfile, UpdateProfileRequest, SavedAddress,
    OrderResponse
)
from wishbake_backend.services.email_service import (
    send_otp_email_sync, is_smtp_configured
)

router = APIRouter(prefix="/api/auth", tags=["User Authentication & OTP"])

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")
OTP_EXPIRY_SECONDS = 300  # 5 minutes
MAX_OTP_ATTEMPTS = 5

def normalize_email(email: str) -> str:
    return email.strip().lower()

def get_current_user_from_token(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)) -> Optional[UserProfile]:
    """Helper dependency to extract authenticated user from Authorization header using PostgreSQL."""
    if not authorization:
        return None
    
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return None
    
    token = parts[1]
    session_record = db.query(SessionDB).filter(SessionDB.token == token).first()
    if not session_record:
        return None
    
    user_record = db.query(UserDB).filter(UserDB.email == session_record.email).first()
    if not user_record:
        return None
    
    return UserProfile(
        user_id=user_record.id,
        email=user_record.email,
        name=user_record.name,
        phone=user_record.phone,
        addresses=[SavedAddress(**a) for a in (user_record.addresses or [])],
        created_at=user_record.created_at,
        is_verified=user_record.is_verified
    )

def require_auth(user: Optional[UserProfile] = Depends(get_current_user_from_token)) -> UserProfile:
    """Dependency enforcing authentication."""
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Authentication required. Please sign in with your email OTP."
        )
    return user

@router.post("/send-otp", response_model=SendOtpResponse)
async def send_otp(req: SendOtpRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Generate and dispatch a 6-digit OTP stored in PostgreSQL."""
    email = normalize_email(req.email)
    if not email or not EMAIL_REGEX.match(email):
        raise HTTPException(status_code=400, detail="Please enter a valid email address.")

    now = time.time()
    existing = db.query(OtpDB).filter(OtpDB.email == email).order_by(OtpDB.id.desc()).first()
    if existing and (now - existing.created_time) < 15:
        raise HTTPException(
            status_code=429,
            detail="Please wait 15 seconds before requesting another verification code."
        )

    # Clean old OTPs for this email
    db.query(OtpDB).filter(OtpDB.email == email).delete()

    otp_code = f"{secrets.randbelow(900000) + 100000}"
    expires_at = now + OTP_EXPIRY_SECONDS

    new_otp = OtpDB(
        email=email,
        otp_code=otp_code,
        expires_at=expires_at,
        created_time=now,
        attempts=0,
        name=req.name.strip() if req.name else None
    )
    db.add(new_otp)
    db.commit()

    background_tasks.add_task(send_otp_email_sync, email, otp_code, req.name)

    dev_otp = otp_code if not is_smtp_configured() else None

    return SendOtpResponse(
        success=True,
        message=f"Verification code sent to {email}",
        expires_in_seconds=OTP_EXPIRY_SECONDS,
        dev_otp=dev_otp
    )

@router.post("/verify-otp", response_model=AuthResponse)
def verify_otp(req: VerifyOtpRequest, db: Session = Depends(get_db)):
    """Validate the 6-digit OTP against PostgreSQL and issue a session token."""
    email = normalize_email(req.email)
    otp_input = req.otp.strip()

    stored_otp = db.query(OtpDB).filter(OtpDB.email == email).order_by(OtpDB.id.desc()).first()
    if not stored_otp:
        raise HTTPException(
            status_code=400,
            detail="No verification code found for this email. Please click 'Send Code'."
        )

    now = time.time()
    if now > stored_otp.expires_at:
        db.delete(stored_otp)
        db.commit()
        raise HTTPException(
            status_code=400,
            detail="Verification code has expired. Please request a new code."
        )

    stored_otp.attempts += 1
    if stored_otp.attempts > MAX_OTP_ATTEMPTS:
        db.delete(stored_otp)
        db.commit()
        raise HTTPException(
            status_code=400,
            detail="Too many incorrect attempts. Please request a new verification code."
        )

    if stored_otp.otp_code != otp_input:
        db.commit()
        remaining = MAX_OTP_ATTEMPTS - stored_otp.attempts
        raise HTTPException(
            status_code=400,
            detail=f"Invalid verification code. {remaining} attempt(s) remaining."
        )

    user_name = req.name or stored_otp.name
    db.delete(stored_otp)

    # Get or create user
    user_record = db.query(UserDB).filter(UserDB.email == email).first()
    if not user_record:
        user_id = f"USR-{uuid.uuid4().hex[:8].upper()}"
        user_record = UserDB(
            id=user_id,
            email=email,
            name=user_name or email.split("@")[0].capitalize(),
            phone=None,
            addresses=[],
            is_verified=True,
            created_at=datetime.utcnow().isoformat() + "Z"
        )
        db.add(user_record)
    else:
        if user_name and not user_record.name:
            user_record.name = user_name

    # Create session token
    token = f"wb_tok_{secrets.token_urlsafe(32)}"
    session_record = SessionDB(token=token, email=email)
    db.add(session_record)
    db.commit()
    db.refresh(user_record)

    user_profile = UserProfile(
        user_id=user_record.id,
        email=user_record.email,
        name=user_record.name,
        phone=user_record.phone,
        addresses=[SavedAddress(**a) for a in (user_record.addresses or [])],
        created_at=user_record.created_at,
        is_verified=user_record.is_verified
    )

    return AuthResponse(
        success=True,
        token=token,
        user=user_profile,
        message="Authentication successful! Welcome to WISHBAKE."
    )

@router.get("/me", response_model=UserProfile)
def get_current_user_profile(user: UserProfile = Depends(require_auth)):
    """Get currently logged-in user profile."""
    return user

@router.post("/logout")
def logout(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    """Invalidate session in PostgreSQL."""
    if authorization:
        parts = authorization.split()
        if len(parts) == 2 and parts[0].lower() == "bearer":
            token = parts[1]
            db.query(SessionDB).filter(SessionDB.token == token).delete()
            db.commit()
    return {"success": True, "message": "Signed out successfully."}

@router.put("/profile", response_model=UserProfile)
def update_user_profile(req: UpdateProfileRequest, user: UserProfile = Depends(require_auth), db: Session = Depends(get_db)):
    """Update profile in PostgreSQL."""
    user_record = db.query(UserDB).filter(UserDB.email == user.email).first()
    if not user_record:
        raise HTTPException(status_code=404, detail="User not found.")

    if req.name is not None:
        user_record.name = req.name.strip()
    if req.phone is not None:
        user_record.phone = req.phone.strip()
    if req.addresses is not None:
        user_record.addresses = [addr.model_dump() for addr in req.addresses]

    db.commit()
    db.refresh(user_record)

    return UserProfile(
        user_id=user_record.id,
        email=user_record.email,
        name=user_record.name,
        phone=user_record.phone,
        addresses=[SavedAddress(**a) for a in (user_record.addresses or [])],
        created_at=user_record.created_at,
        is_verified=user_record.is_verified
    )

@router.get("/orders", response_model=List[OrderResponse])
def get_user_orders(user: UserProfile = Depends(require_auth), db: Session = Depends(get_db)):
    """Fetch user's order history from PostgreSQL."""
    orders = db.query(OrderDB).filter(OrderDB.customer_email == user.email).order_by(OrderDB.created_at.desc()).all()
    return [
        OrderResponse(
            order_id=o.order_id,
            customer_name=o.customer_name,
            customer_email=o.customer_email,
            customer_phone=o.customer_phone,
            delivery_address=o.delivery_address,
            delivery_date=o.delivery_date,
            delivery_time_slot=o.delivery_time_slot,
            recipient_name=o.recipient_name,
            special_instructions=o.special_instructions,
            total_amount=o.total_amount,
            currency=o.currency,
            status=o.status,
            created_at=o.created_at,
            items=o.items or []
        )
        for o in orders
    ]
