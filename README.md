# 🎂 WISHBAKE - Two Independent Repositories Setup

This project is organized into two completely decoupled repositories:

1. **`wishbake_backend/`** (Backend Repository)
   - Python FastAPI REST API
   - PostgreSQL Database Integration (SQLAlchemy ORM)
   - Mail-OTP Verification
   - Self-contained with its own `.env`, `.gitignore`, `requirements.txt`, and `Dockerfile`.

2. **`wishbake_frontend/`** (Frontend Repository)
   - Vite Single Page Application (Three.js 3D Customizer, Cart, Auth Modal)
   - Self-contained with its own `.env`, `.gitignore`, `package.json`, and `vercel.json`.

---

## 🐍 1. `wishbake_backend` Deployment & Run Guide

### Run Locally:
```bash
cd wishbake_backend
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

### Environment Settings (`wishbake_backend/.env`):
- `DATABASE_URL`: PostgreSQL connection string (e.g. `postgresql://user:pass@host:5432/wishbake_db`). If left blank, it automatically uses local SQLite `wishbake.db`.
- `CORS_ORIGINS`: Comma-separated allowed frontend URLs (e.g. `https://wishbake.vercel.app,http://localhost:5173`).
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`: SMTP configuration for Mail-OTP.

---

## ⚡ 2. `wishbake_frontend` Deployment & Run Guide

### Run Locally:
```bash
cd wishbake_frontend
npm install
npm run dev
```

### Environment Settings (`wishbake_frontend/.env`):
- `VITE_API_URL`: URL of your backend API (e.g. `http://127.0.0.1:8000` for local dev, or `https://wishbake-api.onrender.com` on Vercel).

### Deploy to Vercel:
Push `wishbake_frontend` to its own GitHub repository, import into Vercel, set `VITE_API_URL` under Environment Variables, and deploy!
