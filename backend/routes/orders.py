import uuid
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, HTTPException, Header, Depends
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.db_models import CakeDB, OrderDB, UserDB
from backend.routes.auth import get_current_user_from_token
from backend.models import (
    PriceCalculationRequest, PriceCalculationResponse,
    CreateOrderRequest, OrderResponse
)
from backend.data import CUSTOMIZER_OPTIONS, PRESET_CAKES

router = APIRouter(prefix="/api", tags=["Orders & Pricing"])
DELIVERY_FEE_INR = 149.0

def calculate_price_for_selection(selection) -> PriceCalculationResponse:
    # Find base size cost
    size_cost = 899.0
    weight_lbs = 1.0
    weight_kg = 0.45
    servings = 8
    for sz in CUSTOMIZER_OPTIONS["sizes"]:
        if sz["id"] == selection.size:
            size_cost = sz["base_cost"]
            weight_lbs = sz["weight_lbs"]
            weight_kg = sz["weight_kg"]
            servings = sz["servings"]
            break

    # Tier multiplier and tier extra
    tier_mult = 1.0
    tier_extra = 0.0
    for t in CUSTOMIZER_OPTIONS["tiers"]:
        if t["count"] == selection.tiers:
            tier_mult = t["multiplier"]
            tier_extra = t["extra_cost"]
            break

    # Shape extra
    shape_extra = 0.0
    for sh in CUSTOMIZER_OPTIONS["shapes"]:
        if sh["id"] == selection.shape:
            shape_extra = sh["extra_cost"]
            break

    # Base frosting extra
    frosting_extra = 0.0
    for f in CUSTOMIZER_OPTIONS["base_frosting"]:
        if f["id"] == selection.base_frosting:
            frosting_extra = f["extra_cost"]
            break

    # Filling extra
    filling_extra = 0.0
    for fl in CUSTOMIZER_OPTIONS["filling_flavors"]:
        if fl["id"] == selection.filling_flavor:
            filling_extra = fl.get("extra_cost", 0.0)
            break

    # Piping style extra
    piping_extra = 0.0
    for p in CUSTOMIZER_OPTIONS["piping_styles"]:
        if p["id"] == selection.piping_style:
            piping_extra = p.get("extra_cost", 0.0)
            break

    base_price = round((size_cost + shape_extra + frosting_extra + filling_extra + piping_extra) * tier_mult, 2)
    
    toppings_extra = 0.0
    topping_price_map = {t["id"]: t["price"] for t in CUSTOMIZER_OPTIONS["toppings"]}
    for top in selection.toppings:
        if top in topping_price_map:
            toppings_extra += topping_price_map[top]

    inscription_extra = 99.0 if (selection.inscription and selection.inscription.strip()) else 0.0
    total_price = round(base_price + tier_extra + toppings_extra + inscription_extra, 2)
    
    total_weight_lbs = round(weight_lbs * (1.0 + (selection.tiers - 1) * 0.7), 1)
    total_weight_kg = round(weight_kg * (1.0 + (selection.tiers - 1) * 0.7), 2)
    total_servings = int(servings * (1.0 + (selection.tiers - 1) * 0.8))

    return PriceCalculationResponse(
        base_price=base_price,
        tiers_extra=tier_extra,
        toppings_extra=toppings_extra,
        inscription_extra=inscription_extra,
        total_price=total_price,
        currency="INR",
        weight_lbs=total_weight_lbs,
        weight_kg=total_weight_kg,
        estimated_servings=total_servings
    )

@router.post("/customizer/price", response_model=PriceCalculationResponse)
def calculate_customizer_price(req: PriceCalculationRequest):
    return calculate_price_for_selection(req.selection)

@router.post("/orders", response_model=OrderResponse)
def create_order(req: CreateOrderRequest, db: Session = Depends(get_db), user=Depends(get_current_user_from_token)):
    if not user:
        raise HTTPException(status_code=401, detail="Sign in before placing an order.")
    order_id = f"WISH-{uuid.uuid4().hex[:8].upper()}"
    persisted_items = []
    items_subtotal = 0.0
    for item in req.items:
        stored_item = item.model_dump()
        if item.item_type == "preset":
            cake = db.query(CakeDB).filter(CakeDB.id == item.cake_id).first()
            preset = next((cake_data for cake_data in PRESET_CAKES if cake_data["id"] == item.cake_id), None)
            if not cake and not preset:
                raise HTTPException(status_code=422, detail=f"Cake '{item.cake_id}' is unavailable.")
            stored_item["title"] = cake.title if cake else preset["title"]
            stored_item["unit_price"] = float(cake.price if cake else preset["price"])
        elif item.item_type == "custom":
            if not item.selection:
                raise HTTPException(status_code=422, detail="Custom cake items need a cake selection.")
            priced = calculate_price_for_selection(item.selection)
            stored_item["title"] = "Custom Cake"
            stored_item["unit_price"] = priced.total_price
        else:
            raise HTTPException(status_code=422, detail="Unsupported order item type.")
        items_subtotal += stored_item["unit_price"] * item.quantity
        persisted_items.append(stored_item)
    total_amount = round(items_subtotal + DELIVERY_FEE_INR, 2)
    
    address_parts = [req.flat_house_no, req.street_locality]
    if req.landmark:
        address_parts.append(f"Near {req.landmark}")
    address_parts.append(f"{req.city}, {req.state} - {req.pincode}")
    delivery_address = ", ".join(address_parts)
    
    email_clean = user.email
    
    order_record = OrderDB(
        order_id=order_id,
        customer_name=req.customer_name,
        customer_email=email_clean,
        customer_phone=req.customer_phone,
        delivery_address=delivery_address,
        delivery_date=req.delivery_date,
        delivery_time_slot=req.delivery_time_slot,
        recipient_name=req.recipient_name,
        special_instructions=req.special_instructions,
        total_amount=round(total_amount, 2),
        delivery_fee=DELIVERY_FEE_INR,
        currency="INR",
        status="CONFIRMED",
        created_at=datetime.utcnow().isoformat() + "Z",
        items=persisted_items,
        user_id=user.user_id
    )
    
    db.add(order_record)

    # If customer is registered in PostgreSQL, update saved address if empty
    user = db.query(UserDB).filter(UserDB.id == user.user_id).first()
    if user:
        if not user.phone:
            user.phone = req.customer_phone
        if not user.addresses:
            user.addresses = [{
                "id": "addr-1",
                "label": "Home",
                "flat_house_no": req.flat_house_no,
                "street_locality": req.street_locality,
                "landmark": req.landmark,
                "city": req.city,
                "state": req.state,
                "pincode": req.pincode,
                "is_default": True
            }]

    db.commit()
    db.refresh(order_record)

    return OrderResponse(
        order_id=order_record.order_id,
        customer_name=order_record.customer_name,
        customer_email=order_record.customer_email,
        customer_phone=order_record.customer_phone,
        delivery_address=order_record.delivery_address,
        delivery_date=order_record.delivery_date,
        delivery_time_slot=order_record.delivery_time_slot,
        recipient_name=order_record.recipient_name,
        special_instructions=order_record.special_instructions,
        total_amount=order_record.total_amount,
        delivery_fee=order_record.delivery_fee,
        currency=order_record.currency,
        status=order_record.status,
        created_at=order_record.created_at,
        items=order_record.items or []
    )

@router.get("/orders/{order_id}", response_model=OrderResponse)
def get_order(order_id: str, db: Session = Depends(get_db), user=Depends(get_current_user_from_token)):
    order = db.query(OrderDB).filter(OrderDB.order_id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if not user or order.user_id != user.user_id:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return OrderResponse(
        order_id=order.order_id,
        customer_name=order.customer_name,
        customer_email=order.customer_email,
        customer_phone=order.customer_phone,
        delivery_address=order.delivery_address,
        delivery_date=order.delivery_date,
        delivery_time_slot=order.delivery_time_slot,
        recipient_name=order.recipient_name,
        special_instructions=order.special_instructions,
        total_amount=order.total_amount,
        delivery_fee=order.delivery_fee,
        currency=order.currency,
        status=order.status,
        created_at=order.created_at,
        items=order.items or []
    )
