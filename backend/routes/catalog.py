from fastapi import APIRouter, Query, Depends
from typing import Optional
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.db_models import CakeDB
from backend.data import BHUBANESWAR_PINCODES, PRESET_CAKES, CUSTOMIZER_OPTIONS, CATALOG_CATEGORIES

router = APIRouter(prefix="/api", tags=["Catalog"])

@router.get("/cakes")
def get_cakes(category: Optional[str] = Query(None), search: Optional[str] = Query(None), db: Session = Depends(get_db)):
    total_db_cakes = db.query(CakeDB).count()

    if total_db_cakes == 0:
        # In-memory fallback only when database table has zero cakes
        filtered = PRESET_CAKES
        if category and category.strip().lower() != "all":
            cat_clean = category.strip().lower()
            filtered = [c for c in filtered if c["category"].lower() == cat_clean]
        if search and search.strip():
            q = search.strip().lower()
            filtered = [
                c for c in filtered
                if q in c["title"].lower() or q in c["description"].lower() or q in c["category"].lower()
            ]
        return {"status": "success", "count": len(filtered), "data": filtered}

    query = db.query(CakeDB)
    if category and category.strip().lower() != "all":
        query = query.filter(CakeDB.category.ilike(category.strip()))
    if search and search.strip():
        pattern = f"%{search.strip()}%"
        query = query.filter(
            (CakeDB.title.ilike(pattern))
            | (CakeDB.description.ilike(pattern))
            | (CakeDB.category.ilike(pattern))
        )

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

    return {"status": "success", "count": len(cakes_list), "data": cakes_list}

@router.get("/categories")
def get_categories(db: Session = Depends(get_db)):
    db_cakes = db.query(CakeDB).all()
    source = [{"category": c.category} for c in db_cakes] if db_cakes else PRESET_CAKES
    counts = {}
    for item in source:
        cat = item["category"]
        counts[cat] = counts.get(cat, 0) + 1

    ordered = [
        {"name": cat, "count": counts[cat]}
        for cat in CATALOG_CATEGORIES
        if cat in counts
    ]
    for cat, count in counts.items():
        if cat not in CATALOG_CATEGORIES:
            ordered.append({"name": cat, "count": count})

    return {"status": "success", "total": len(source), "data": ordered}

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

@router.get("/delivery/pincodes")
def get_serviceable_pincodes():
    return {
        "status": "success",
        "city": "Bhubaneswar",
        "state": "Odisha",
        "count": len(BHUBANESWAR_PINCODES),
        "data": BHUBANESWAR_PINCODES,
    }
