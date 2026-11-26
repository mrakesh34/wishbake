import re
from datetime import datetime, timedelta, timezone
from typing import List, Literal, Optional
from pydantic import BaseModel, Field, field_validator

from backend.data import BHUBANESWAR_PINCODES, CUSTOMIZER_OPTIONS, PRESET_SIZE_MULTIPLIERS

IST = timezone(timedelta(hours=5, minutes=30))
PHONE_REGEX = re.compile(r"^(?:\+91[\-\s]?)?([6-9]\d{9})$")
EMAIL_REGEX = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
PINCODE_REGEX = re.compile(r"^\d{6}$")
ALLOWED_TIME_SLOTS = {slot["id"] for slot in CUSTOMIZER_OPTIONS["delivery_time_slots"]}
SERVICEABLE_CITIES = {
    "bhubaneswar": "Bhubaneswar",
    "bbsr": "Bhubaneswar",
    "jatni": "Jatni",
    "khordha": "Khordha",
    "khurda": "Khordha",
    "balianta": "Balianta",
    "balakati": "Balakati",
}
SERVICEABLE_STATES = {"odisha": "Odisha", "orissa": "Odisha"}


def validate_indian_phone(value: str) -> str:
    cleaned = re.sub(r"\s+", "", (value or "").strip())
    match = PHONE_REGEX.match(cleaned)
    if not match:
        raise ValueError("Enter a valid 10-digit Indian mobile number (e.g. +91 9876543210).")
    return f"+91 {match.group(1)}"


def validate_address_line(value: str, label: str, min_len: int, max_len: int) -> str:
    text = re.sub(r"\s+", " ", (value or "").strip())
    if len(text) < min_len or len(text) > max_len or not any(ch.isalnum() for ch in text):
        raise ValueError(f"{label} must be between {min_len} and {max_len} characters.")
    return text


def validate_serviceable_city(value: str) -> str:
    text = re.sub(r"\s+", " ", (value or "").strip())
    key = text.lower()
    if key not in SERVICEABLE_CITIES:
        raise ValueError("WISHBAKE currently delivers only in Bhubaneswar and nearby metro localities.")
    return SERVICEABLE_CITIES[key]


def validate_serviceable_state(value: str) -> str:
    text = re.sub(r"\s+", " ", (value or "").strip())
    key = text.lower()
    if key not in SERVICEABLE_STATES:
        raise ValueError("Delivery is currently available only in Odisha.")
    return SERVICEABLE_STATES[key]


def validate_bhubaneswar_pincode(value: str) -> str:
    pin = (value or "").strip()
    if not PINCODE_REGEX.match(pin):
        raise ValueError("Enter a valid 6-digit PIN code.")
    if pin not in BHUBANESWAR_PINCODES:
        raise ValueError(
            f"PIN code {pin} is outside our current Bhubaneswar delivery zone (751001–751032 & nearby areas)."
        )
    return pin

class CustomizerSelection(BaseModel):
    tiers: int = Field(default=1, ge=1, le=5)
    shape: str = Field(default="round") # round, square, hexagon, heart
    size: str = Field(default="1lb") # 0.5lb, 1lb, 2lb, 3lb, 5lb, 8lb, 10lb, 15lb
    base_frosting: str = Field(default="smooth") # smooth, semi-naked, textured, ruffled, fondant, mirror_glaze
    sponge_flavor: str = Field(default="vanilla")
    filling_flavor: str = Field(default="cream")
    icing_color: str = Field(default="#d4838f")
    piping_style: str = Field(default="pearl") # none, pearl, shell, rosette, mehndi, drip
    toppings: List[str] = Field(default_factory=list)
    addons: List[str] = Field(default_factory=list)
    inscription: Optional[str] = Field(default=None)
    inscription_color: str = Field(default="#542137")

class PriceCalculationRequest(BaseModel):
    selection: CustomizerSelection

class PriceCalculationResponse(BaseModel):
    base_price: float
    tiers_extra: float
    toppings_extra: float
    addons_extra: float = 0.0
    inscription_extra: float
    total_price: float
    currency: str = "INR"
    weight_lbs: float
    weight_kg: float
    estimated_servings: int

class OrderItem(BaseModel):
    item_type: str # "custom" or "preset"
    cake_id: Optional[str] = None
    size: Optional[str] = Field(default="1lb")
    title: str
    quantity: int = Field(default=1, ge=1, le=50)
    unit_price: float
    selection: Optional[CustomizerSelection] = None

    @field_validator("size")
    @classmethod
    def check_size(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return "1lb"
        s = v.strip()
        if s and s not in PRESET_SIZE_MULTIPLIERS:
            return s
        return s or "1lb"

class CreateOrderRequest(BaseModel):
    customer_name: str
    customer_email: str
    customer_phone: str
    # Indian address fields
    flat_house_no: str = Field(description="Flat/House No., Building Name")
    street_locality: str = Field(description="Street, Area/Locality")
    landmark: Optional[str] = Field(default=None, description="Near landmark")
    city: str
    state: str
    pincode: str = Field(description="6-digit PIN code")
    # Delivery details
    delivery_date: str
    delivery_time_slot: Optional[str] = Field(default="afternoon", description="morning, afternoon, evening, night")
    recipient_name: Optional[str] = Field(default=None, description="Name of the person receiving the cake")
    special_instructions: Optional[str] = None
    payment_method: Literal["COD", "ONLINE"] = "COD"
    items: List[OrderItem] = Field(min_length=1)

    @field_validator("customer_name")
    @classmethod
    def check_customer_name(cls, v: str) -> str:
        return validate_address_line(v, "Full name", 2, 120)

    @field_validator("customer_email")
    @classmethod
    def check_customer_email(cls, v: str) -> str:
        email = (v or "").strip().lower()
        if not EMAIL_REGEX.match(email):
            raise ValueError("Enter a valid email address.")
        return email

    @field_validator("customer_phone")
    @classmethod
    def check_phone(cls, v: str) -> str:
        return validate_indian_phone(v)

    @field_validator("flat_house_no")
    @classmethod
    def check_flat(cls, v: str) -> str:
        return validate_address_line(v, "Flat / House No., Building", 3, 120)

    @field_validator("street_locality")
    @classmethod
    def check_street(cls, v: str) -> str:
        return validate_address_line(v, "Street / Area / Locality", 4, 160)

    @field_validator("landmark")
    @classmethod
    def check_landmark(cls, v: Optional[str]) -> Optional[str]:
        if not v or not v.strip():
            return None
        cleaned = re.sub(r"\s+", " ", v.strip())
        if len(cleaned) > 120:
            raise ValueError("Landmark must be 120 characters or fewer.")
        return cleaned

    @field_validator("city")
    @classmethod
    def check_city(cls, v: str) -> str:
        return validate_serviceable_city(v)

    @field_validator("state")
    @classmethod
    def check_state(cls, v: str) -> str:
        return validate_serviceable_state(v)

    @field_validator("pincode")
    @classmethod
    def check_pincode(cls, v: str) -> str:
        return validate_bhubaneswar_pincode(v)

    @field_validator("delivery_date")
    @classmethod
    def check_delivery_date(cls, v: str) -> str:
        raw = (v or "").strip()
        try:
            chosen = datetime.strptime(raw, "%Y-%m-%d").date()
        except ValueError as exc:
            raise ValueError("Choose a valid delivery date (YYYY-MM-DD).") from exc
        today_ist = datetime.now(IST).date()
        min_date = today_ist + timedelta(days=1)
        max_date = today_ist + timedelta(days=90)
        if chosen < min_date:
            raise ValueError("Delivery date must be at least 1 day in advance.")
        if chosen > max_date:
            raise ValueError("Delivery date can be scheduled up to 90 days ahead.")
        return raw

    @field_validator("delivery_time_slot")
    @classmethod
    def check_time_slot(cls, v: Optional[str]) -> str:
        slot = (v or "afternoon").strip().lower()
        if slot not in ALLOWED_TIME_SLOTS:
            raise ValueError("Select a valid delivery time slot.")
        return slot

class OrderResponse(BaseModel):
    order_id: str
    customer_name: str
    customer_email: Optional[str] = None
    customer_phone: Optional[str] = None
    total_amount: float
    delivery_fee: float = 149.0
    payment_method: str = "COD"
    payment_status: str = "PENDING"
    gateway_order_id: Optional[str] = None
    payment_session_id: Optional[str] = None
    gateway_payment_id: Optional[str] = None
    payment_gateway_env: Optional[str] = None
    gateway_mode: Optional[str] = None
    payment_message: Optional[str] = None
    paid_at: Optional[str] = None
    currency: str = "INR"
    status: str
    created_at: str
    delivery_date: str
    delivery_time_slot: Optional[str] = None
    delivery_address: str
    items: List[OrderItem]

class OnlinePaymentConfigResponse(BaseModel):
    configured: bool
    mode: Literal["sandbox", "production"]
    api_version: str
    sdk_url: str
    sdk_global: str

class PaymentVerifyRequest(BaseModel):
    order_id: str = Field(min_length=3, max_length=64)

class PaymentStatusResponse(BaseModel):
    order: OrderResponse
    order_status: str
    payment_status: str
    payment_message: Optional[str] = None
    error_code: Optional[str] = None
    error_reason: Optional[str] = None


def serialize_order_response(order, gateway_mode: Optional[str] = None) -> OrderResponse:
    """Convert an OrderDB ORM row into the API OrderResponse contract."""
    normalized_method = "COD" if order.payment_method == "COD" else "ONLINE"
    return OrderResponse(
        order_id=order.order_id,
        customer_name=order.customer_name,
        customer_email=order.customer_email,
        customer_phone=order.customer_phone,
        delivery_address=order.delivery_address,
        delivery_date=order.delivery_date,
        delivery_time_slot=order.delivery_time_slot,
        total_amount=order.total_amount,
        delivery_fee=order.delivery_fee,
        payment_method=normalized_method,
        payment_status=order.payment_status,
        gateway_order_id=order.cf_order_id,
        payment_session_id=order.payment_session_id,
        gateway_payment_id=order.cf_payment_id,
        payment_gateway_env=order.payment_gateway_env,
        gateway_mode=gateway_mode or order.payment_gateway_env,
        payment_message=order.payment_message,
        paid_at=order.paid_at,
        currency=order.currency or "INR",
        status=order.status,
        created_at=order.created_at,
        items=order.items or [],
    )

# --- Authentication & User Models ---

class SavedAddress(BaseModel):
    id: Optional[str] = None
    label: str = "Home" # Home, Office, Other
    flat_house_no: str
    street_locality: str
    landmark: Optional[str] = None
    city: str
    state: str
    pincode: str
    is_default: bool = False

class ValidatedSavedAddress(SavedAddress):
    @field_validator("label")
    @classmethod
    def check_label(cls, v: str) -> str:
        cleaned = re.sub(r"\s+", " ", (v or "Home").strip())
        return (cleaned[:30] or "Home")

    @field_validator("flat_house_no")
    @classmethod
    def check_flat(cls, v: str) -> str:
        return validate_address_line(v, "Flat / House No., Building", 3, 120)

    @field_validator("street_locality")
    @classmethod
    def check_street(cls, v: str) -> str:
        return validate_address_line(v, "Street / Area / Locality", 4, 160)

    @field_validator("landmark")
    @classmethod
    def check_landmark(cls, v: Optional[str]) -> Optional[str]:
        if not v or not v.strip():
            return None
        cleaned = re.sub(r"\s+", " ", v.strip())
        if len(cleaned) > 120:
            raise ValueError("Landmark must be 120 characters or fewer.")
        return cleaned

    @field_validator("city")
    @classmethod
    def check_city(cls, v: str) -> str:
        return validate_serviceable_city(v)

    @field_validator("state")
    @classmethod
    def check_state(cls, v: str) -> str:
        return validate_serviceable_state(v)

    @field_validator("pincode")
    @classmethod
    def check_pincode(cls, v: str) -> str:
        return validate_bhubaneswar_pincode(v)

class UserProfile(BaseModel):
    user_id: str
    email: str
    name: Optional[str] = None
    phone: Optional[str] = None
    addresses: List[SavedAddress] = Field(default_factory=list)
    created_at: str
    is_verified: bool = True

class SendOtpRequest(BaseModel):
    email: str
    name: Optional[str] = None

class SendOtpResponse(BaseModel):
    success: bool
    verification_required: bool = True
    email: str
    message: str
    expires_in_seconds: int = 600
    resend_cooldown_seconds: int = 60

class ResendOtpRequest(BaseModel):
    email: str = Field(min_length=3, max_length=255)

class VerifyOtpRequest(BaseModel):
    email: str = Field(min_length=3, max_length=255)
    otp: str = Field(min_length=6, max_length=12)
    name: Optional[str] = None

class UpdateProfileRequest(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    addresses: Optional[List[ValidatedSavedAddress]] = None

    @field_validator("name")
    @classmethod
    def check_name(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        cleaned = re.sub(r"\s+", " ", v.strip())
        if cleaned and (len(cleaned) < 2 or len(cleaned) > 120):
            raise ValueError("Full name must be between 2 and 120 characters.")
        return cleaned

    @field_validator("phone")
    @classmethod
    def check_phone(cls, v: Optional[str]) -> Optional[str]:
        if v is None or not v.strip():
            return None if v is None else ""
        return validate_indian_phone(v)

class AuthResponse(BaseModel):
    success: bool
    token: str
    user: UserProfile
    message: str
