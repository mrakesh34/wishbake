from typing import List, Optional
from pydantic import BaseModel, Field, EmailStr

class CustomizerSelection(BaseModel):
    tiers: int = Field(default=1, ge=1, le=3)
    shape: str = Field(default="round") # round, square, hexagon, heart
    size: str = Field(default="1lb") # 0.5lb, 1lb, 2lb, 3lb, 5lb
    base_frosting: str = Field(default="smooth") # smooth, semi-naked, textured, ruffled, fondant
    sponge_flavor: str = Field(default="vanilla")
    filling_flavor: str = Field(default="cream")
    icing_color: str = Field(default="#ff85a2")
    piping_style: str = Field(default="pearl") # none, pearl, shell, rosette, mehndi
    toppings: List[str] = Field(default_factory=list)
    inscription: Optional[str] = Field(default=None)

class PriceCalculationRequest(BaseModel):
    selection: CustomizerSelection

class PriceCalculationResponse(BaseModel):
    base_price: float
    tiers_extra: float
    toppings_extra: float
    inscription_extra: float
    total_price: float
    currency: str = "INR"
    weight_lbs: float
    weight_kg: float
    estimated_servings: int

class OrderItem(BaseModel):
    item_type: str # "custom" or "preset"
    cake_id: Optional[str] = None
    title: str
    quantity: int = Field(default=1, ge=1)
    unit_price: float
    selection: Optional[CustomizerSelection] = None

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
    items: List[OrderItem]

class OrderResponse(BaseModel):
    order_id: str
    customer_name: str
    customer_email: Optional[str] = None
    customer_phone: Optional[str] = None
    total_amount: float
    currency: str = "INR"
    status: str
    created_at: str
    delivery_date: str
    delivery_time_slot: Optional[str] = None
    delivery_address: str
    items: List[OrderItem]

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
    message: str
    expires_in_seconds: int = 300
    dev_otp: Optional[str] = None # Provided in local development for quick trial

class VerifyOtpRequest(BaseModel):
    email: str
    otp: str
    name: Optional[str] = None

class UpdateProfileRequest(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    addresses: Optional[List[SavedAddress]] = None

class AuthResponse(BaseModel):
    success: bool
    token: str
    user: UserProfile
    message: str
