import hashlib
import hmac
import secrets
import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.db_models import CartDB, OrderDB, SessionDB, UserDB
from backend.models import OrderResponse, UpdateProfileRequest, UserProfile, SavedAddress

router = APIRouter(prefix="/api/auth", tags=["Accounts"])

class Credentials(BaseModel):
    email: str = Field(min_length=3, max_length=255)
    password: str = Field(min_length=8, max_length=128)
    name: Optional[str] = Field(default=None, max_length=120)

def _hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 310_000)
    return f"pbkdf2_sha256${salt.hex()}${digest.hex()}"

def _check_password(password: str, stored: str) -> bool:
    try:
        algorithm, salt, expected = stored.split("$")
        if algorithm != "pbkdf2_sha256":
            return False
        actual = hashlib.pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(salt), 310_000).hex()
        return hmac.compare_digest(actual, expected)
    except (ValueError, TypeError):
        return False

def _profile(user: UserDB) -> UserProfile:
    return UserProfile(user_id=user.id, email=user.email, name=user.name, phone=user.phone,
        addresses=[SavedAddress(**address) for address in (user.addresses or [])],
        created_at=user.created_at, is_verified=True)

def get_current_user_from_token(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)) -> Optional[UserProfile]:
    parts = (authorization or "").split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return None
    session = db.query(SessionDB).filter(SessionDB.token == parts[1]).first()
    user = db.query(UserDB).filter(UserDB.email == session.email).first() if session else None
    return _profile(user) if user else None

def require_auth(user: Optional[UserProfile] = Depends(get_current_user_from_token)) -> UserProfile:
    if not user:
        raise HTTPException(status_code=401, detail="Please sign in to continue.")
    return user

def _issue_session(user: UserDB, db: Session):
    token = secrets.token_urlsafe(48)
    db.add(SessionDB(token=token, email=user.email))
    db.commit()
    return {"success": True, "token": token, "user": _profile(user)}

@router.post("/signup")
def signup(req: Credentials, db: Session = Depends(get_db)):
    email = req.email.strip().lower()
    if "@" not in email or "." not in email.rsplit("@", 1)[-1]:
        raise HTTPException(status_code=422, detail="Enter a valid email address.")
    if db.query(UserDB).filter(UserDB.email == email).first():
        raise HTTPException(status_code=409, detail="An account with this email already exists.")
    user = UserDB(id=f"USR-{uuid.uuid4().hex[:12].upper()}", email=email,
        name=(req.name or email.split("@")[0]).strip(), addresses=[], is_verified=True,
        password_hash=_hash_password(req.password), created_at=datetime.utcnow().isoformat() + "Z")
    db.add(user)
    db.flush()
    db.add(CartDB(user_id=user.id, items=[]))
    return _issue_session(user, db)

@router.post("/login")
def login(req: Credentials, db: Session = Depends(get_db)):
    user = db.query(UserDB).filter(UserDB.email == req.email.strip().lower()).first()
    if not user or not user.password_hash or not _check_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Email or password is incorrect.")
    return _issue_session(user, db)

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
def update_profile(req: UpdateProfileRequest, user: UserProfile = Depends(require_auth), db: Session = Depends(get_db)):
    record = db.query(UserDB).filter(UserDB.id == user.user_id).first()
    if req.name is not None: record.name = req.name.strip()
    if req.phone is not None: record.phone = req.phone.strip()
    if req.addresses is not None: record.addresses = [a.model_dump() for a in req.addresses]
    db.commit(); db.refresh(record)
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
        cart = CartDB(user_id=user.user_id, items=items); db.add(cart)
    else:
        cart.items = items
        cart.updated_at = datetime.utcnow().isoformat() + "Z"
    db.commit()
    return {"items": items}

@router.get("/orders", response_model=list[OrderResponse])
def get_user_orders(user: UserProfile = Depends(require_auth), db: Session = Depends(get_db)):
    orders = db.query(OrderDB).filter(OrderDB.user_id == user.user_id).order_by(OrderDB.created_at.desc()).all()
    return [OrderResponse(order_id=o.order_id, customer_name=o.customer_name, customer_email=o.customer_email,
        customer_phone=o.customer_phone, delivery_address=o.delivery_address, delivery_date=o.delivery_date,
        delivery_time_slot=o.delivery_time_slot, recipient_name=o.recipient_name, special_instructions=o.special_instructions,
        total_amount=o.total_amount, delivery_fee=o.delivery_fee, currency="INR", status=o.status,
        created_at=o.created_at, items=o.items or []) for o in orders]
