import os
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv(dotenv_path=Path(__file__).resolve().parent / ".env", override=True)

from backend.database import init_db, engine
from backend.routes.catalog import router as catalog_router
from backend.routes.orders import router as orders_router
from backend.routes.auth import router as auth_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize PostgreSQL / SQLite database tables and seed catalog on startup
    init_db()
    yield

app = FastAPI(
    title="WISHBAKE Backend API",
    description="REST API for WISHBAKE storefront, custom cake pricing, accounts, carts, and orders.",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS for decoupled frontend deployment
allowed_origins_env = os.getenv("CORS_ORIGINS", "http://127.0.0.1:5173,http://localhost:5173")
allowed_origins = [origin.strip() for origin in allowed_origins_env.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials="*" not in allowed_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(catalog_router)
app.include_router(orders_router)
app.include_router(auth_router)

@app.get("/health")
def health_check():
    db_status = "healthy"
    try:
        with engine.connect() as conn:
            pass
    except Exception as e:
        db_status = f"degraded ({str(e)})"

    return {
        "status": "healthy",
        "service": "WISHBAKE Backend API",
        "database": db_status,
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("backend.main:app", host="0.0.0.0", port=port, reload=True)
