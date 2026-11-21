from datetime import datetime
from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, Text, JSON
from wishbake_backend.database import Base

class UserDB(Base):
    __tablename__ = "users"

    id = Column(String(50), primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    addresses = Column(JSON, default=list) # Array of saved delivery addresses
    is_verified = Column(Boolean, default=True)
    created_at = Column(String(50), default=lambda: datetime.utcnow().isoformat() + "Z")

class OtpDB(Base):
    __tablename__ = "otps"

    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(255), index=True, nullable=False)
    otp_code = Column(String(10), nullable=False)
    expires_at = Column(Float, nullable=False)
    created_time = Column(Float, nullable=False)
    attempts = Column(Integer, default=0)
    name = Column(String(255), nullable=True)

class SessionDB(Base):
    __tablename__ = "sessions"

    token = Column(String(255), primary_key=True, index=True)
    email = Column(String(255), index=True, nullable=False)
    created_at = Column(String(50), default=lambda: datetime.utcnow().isoformat() + "Z")

class OrderDB(Base):
    __tablename__ = "orders"

    order_id = Column(String(50), primary_key=True, index=True)
    customer_name = Column(String(255), nullable=False)
    customer_email = Column(String(255), index=True, nullable=False)
    customer_phone = Column(String(50), nullable=False)
    delivery_address = Column(Text, nullable=False)
    delivery_date = Column(String(50), nullable=False)
    delivery_time_slot = Column(String(50), nullable=True)
    recipient_name = Column(String(255), nullable=True)
    special_instructions = Column(Text, nullable=True)
    total_amount = Column(Float, nullable=False)
    currency = Column(String(10), default="INR")
    status = Column(String(50), default="CONFIRMED")
    created_at = Column(String(50), default=lambda: datetime.utcnow().isoformat() + "Z")
    items = Column(JSON, default=list)

class CakeDB(Base):
    __tablename__ = "cakes"

    id = Column(String(100), primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    category = Column(String(100), index=True, nullable=False)
    price = Column(Float, nullable=False)
    description = Column(Text, nullable=False)
    image = Column(String(500), nullable=False)
    images = Column(JSON, default=list)
    badge = Column(String(50), nullable=True)
    servings = Column(String(50), default="8-10")
    weight_lbs = Column(Float, default=1.0)
    rating = Column(Float, default=5.0)
    reviews = Column(Integer, default=100)
