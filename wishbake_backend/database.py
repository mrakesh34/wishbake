import os
import logging
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

load_dotenv()

logger = logging.getLogger("wishbake.db")
logging.basicConfig(level=logging.INFO)

DATABASE_URL = os.getenv("DATABASE_URL", "").strip()

if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

def create_db_engine(db_url: str):
    if not db_url or db_url.startswith("sqlite"):
        return create_engine("sqlite:///./wishbake.db", connect_args={"check_same_thread": False}, echo=False)
    return create_engine(db_url, pool_pre_ping=True, echo=False)

active_url = DATABASE_URL if DATABASE_URL else "sqlite:///./wishbake.db"
engine = create_db_engine(active_url)
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

    from wishbake_backend.db_models import CakeDB
    from wishbake_backend.data import PRESET_CAKES

    try:
        if DATABASE_URL and not DATABASE_URL.startswith("sqlite"):
            logger.info(f"Connecting to PostgreSQL database: {DATABASE_URL.split('@')[-1] if '@' in DATABASE_URL else DATABASE_URL}")
        else:
            logger.info("Using local SQLite database: wishbake.db")
            
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        logger.warning(f"⚠️ Could not connect to configured PostgreSQL database ({e}). Falling back to local SQLite: wishbake.db")
        engine = create_db_engine("sqlite:///./wishbake.db")
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        Base.metadata.create_all(bind=engine)

    # Seed initial cakes catalog if empty
    db = SessionLocal()
    try:
        cake_count = db.query(CakeDB).count()
        if cake_count == 0:
            logger.info("Seeding initial Artisanal Bakery Catalog into database...")
            for cake in PRESET_CAKES:
                db_cake = CakeDB(
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
                )
                db.add(db_cake)
            db.commit()
            logger.info("Catalog seeded successfully!")
    except Exception as e:
        logger.error(f"Failed to seed catalog: {e}")
        db.rollback()
    finally:
        db.close()
