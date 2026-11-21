from fastapi import APIRouter, Query, Depends
from typing import Optional, List
from sqlalchemy.orm import Session

from wishbake_backend.database import get_db
from wishbake_backend.db_models import CakeDB
from wishbake_backend.data import PRESET_CAKES, CUSTOMIZER_OPTIONS

router = APIRouter(prefix="/api", tags=["Catalog"])

@router.get("/cakes")
def get_cakes(category: Optional[str] = Query(None), search: Optional[str] = Query(None), db: Session = Depends(get_db)):
    query = db.query(CakeDB)
    if category and category.lower() != "all":
        query = query.filter(CakeDB.category.ilike(category))
    if search:
        query = query.filter((CakeDB.title.ilike(f"%{search}%")) | (CakeDB.description.ilike(f"%{search}%")))
    
    db_cakes = query.all()
    cakes_list = [
        {
            "id": c.id,
            "title": c.title,
            "category": c.category,
            "price": c.price,
            "description": c.description,
            "image": c.image,
            "images": c.images or [],
            "badge": c.badge,
            "servings": c.servings,
            "weight_lbs": c.weight_lbs,
            "rating": c.rating,
            "reviews": c.reviews
        }
        for c in db_cakes
    ]
    
    # Fallback to in-memory if DB is empty
    if not cakes_list:
        cakes_list = PRESET_CAKES

    return {"status": "success", "count": len(cakes_list), "data": cakes_list}

@router.get("/cakes/{cake_id}")
def get_cake_detail(cake_id: str, db: Session = Depends(get_db)):
    cake = db.query(CakeDB).filter(CakeDB.id == cake_id).first()
    if cake:
        return {
            "status": "success",
            "data": {
                "id": cake.id,
                "title": cake.title,
                "category": cake.category,
                "price": cake.price,
                "description": cake.description,
                "image": cake.image,
                "images": cake.images or [],
                "badge": cake.badge,
                "servings": cake.servings,
                "weight_lbs": cake.weight_lbs,
                "rating": cake.rating,
                "reviews": cake.reviews
            }
        }
    
    # Fallback check
    for c in PRESET_CAKES:
        if c["id"] == cake_id:
            return {"status": "success", "data": c}

    return {"status": "error", "message": "Cake not found"}

@router.get("/customizer/options")
def get_customizer_options():
    return {"status": "success", "data": CUSTOMIZER_OPTIONS}
