import os
import logging
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

load_dotenv(dotenv_path=Path(__file__).resolve().parent / ".env")

logger = logging.getLogger("wishbake.db")
logging.basicConfig(level=logging.INFO)

DATABASE_URL = os.getenv("DATABASE_URL", "").strip()

if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

if not DATABASE_URL.startswith("postgresql://"):
    raise RuntimeError("Set DATABASE_URL in backend/.env to the Neon PostgreSQL connection URL.")

def create_db_engine(db_url: str):
    return create_engine(db_url, pool_pre_ping=True, echo=False)

engine = create_db_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    """FastAPI Dependency for database sessions."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Initialize database tables and seed catalog if empty with resilient fallback."""
    global engine, SessionLocal

    from backend.db_models import CakeDB
    from backend.data import PRESET_CAKES

    try:
        logger.info("Connecting to configured Neon/PostgreSQL database.")
            
        Base.metadata.create_all(bind=engine)
        # create_all does not add fields to existing tables; keep this tiny additive
        # migration for installs that predate account-owned orders and payment tracking.
        inspector = inspect(engine)
        additions = {
            "users": {"password_hash": "VARCHAR(255)"},
            "otps": {
                "password_hash": "VARCHAR(255)",
                "locked_until": "DOUBLE PRECISION",
            },
            "orders": {
                "user_id": "VARCHAR(50)",
                "delivery_fee": "FLOAT NOT NULL DEFAULT 149",
                "payment_method": "VARCHAR(20) NOT NULL DEFAULT 'COD'",
                "payment_status": "VARCHAR(20) NOT NULL DEFAULT 'PENDING'",
            },
        }
        with engine.begin() as connection:
            for table, columns in additions.items():
                existing = {column["name"] for column in inspector.get_columns(table)}
                for name, definition in columns.items():
                    if name not in existing:
                        connection.execute(text(f"ALTER TABLE {table} ADD COLUMN {name} {definition}"))

            otp_columns = {column["name"]: column for column in inspector.get_columns("otps")}
            otp_code_col = otp_columns.get("otp_code")
            otp_code_len = getattr(otp_code_col["type"], "length", None) if otp_code_col else None
            if otp_code_len is not None and otp_code_len < 255:
                connection.execute(text("ALTER TABLE otps ALTER COLUMN otp_code TYPE VARCHAR(255)"))
    except Exception as e:
        raise RuntimeError("Configured PostgreSQL database is unavailable; refusing to use local SQLite.") from e

    # Seed and sync initial cakes catalog so category/metadata updates apply to existing DB rows
    db = SessionLocal()
    try:
        existing_cakes = {c.id: c for c in db.query(CakeDB).all()}
        for cake in PRESET_CAKES:
            db_cake = existing_cakes.get(cake["id"])
            if db_cake is None:
                db.add(CakeDB(
                    id=cake["id"],
                    title=cake["title"],
                    category=cake["category"],
                    price=cake["price"],
                    description=cake["description"],
                    image=cake["image"],
                    images=cake.get("images", []),
                    badge=cake.get("badge"),
                    servings=cake.get("servings", "8-10"),
                    weight_lbs=cake.get("weight_lbs", 1.0),
                    rating=cake.get("rating", 5.0),
                    reviews=cake.get("reviews", 100)
                ))
            else:
                db_cake.title = cake["title"]
                db_cake.category = cake["category"]
                db_cake.price = cake["price"]
                db_cake.description = cake["description"]
                db_cake.image = cake["image"]
                db_cake.images = cake.get("images", [])
                db_cake.badge = cake.get("badge")
                db_cake.servings = cake.get("servings", "8-10")
                db_cake.weight_lbs = cake.get("weight_lbs", 1.0)
                db_cake.rating = cake.get("rating", 5.0)
                db_cake.reviews = cake.get("reviews", 100)
        db.commit()
        logger.info("Catalog synced successfully (%d cakes).", len(PRESET_CAKES))
    except Exception as e:
        logger.error(f"Failed to seed/sync catalog: {e}")
        db.rollback()
    finally:
        db.close()
