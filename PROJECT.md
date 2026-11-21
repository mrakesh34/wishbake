# WISHBAKE Project Guide

WISHBAKE is a premium online cake shop for Bhubaneswar, Odisha. Customers browse the catalog, customize cakes in a Three.js studio, save a cart and account, and place INR orders for local delivery.

## Current structure

- `frontend/`: Vanilla JavaScript + Vite single-page storefront.
- `backend/`: FastAPI API, SQLAlchemy models, and Neon PostgreSQL connection.
- `backend/.env`: Local secrets. Set `DATABASE_URL` to the Neon connection URL; never commit this file or print its value.
- `frontend/.env`: Optional `VITE_API_URL`; local development uses the Vite `/api` proxy.

## Run locally

From the repository root, in separate terminals:

```powershell
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload --reload-dir backend
cd frontend
npm install
npm run dev
```

The API is at `http://127.0.0.1:8000`; API docs are at `/docs`; Vite is at `http://127.0.0.1:5173`.

## Current features

- Catalog, cake detail pages, customizer pricing, 3D preview, cart and checkout.
- Email/password account signup and login. Passwords are stored as PBKDF2 hashes; API sessions are persisted in the database.
- User profiles, saved addresses, carts, and orders are database-backed. Signed-in carts sync to the account. Guest checkout remains available, but guest carts are not synced across devices.
- Neon/PostgreSQL is required through `backend/.env` → `DATABASE_URL`. The app fails startup if it is missing or if the database is unavailable; it must not use SQLite.
- Prices and order currency are INR. The current catalog/options values are retained as rupee amounts; local-market price validation is a later task. The launch delivery area is Bhubaneswar, Odisha; address validation is deferred.
- Payment gateway is undecided (Razorpay or Cashfree). Orders currently do not collect payment.
- No admin/staff portal in this phase.

## API overview

- `GET /health`
- `GET /api/cakes`, `GET /api/cakes/{id}`, `GET /api/customizer/options`
- `POST /api/customizer/price`
- `POST /api/auth/signup`, `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout`
- `GET|PUT /api/auth/cart`
- `PUT /api/auth/profile`, `GET /api/auth/orders`
- `POST /api/orders`, `GET /api/orders/{id}` (authenticated owner only)

## Planned work

1. Set and verify the real Neon `DATABASE_URL`, then create/upgrade schema safely.
2. Verify account, cart, order persistence and server-side authoritative pricing.
3. Improve guest cart persistence and merge it into an account after sign-in.
4. Define local delivery fee, lead time, and order status rules for Bhubaneswar.
5. Choose Razorpay or Cashfree and implement payment creation, verification, and webhook handling.
6. Add production hardening (rate limits, password reset, secure cookie/token policy, migrations, backups), responsive/accessibility review, and deployment documentation.

## Important decisions

- Target currency: INR.
- Delivery area: Bhubaneswar, Odisha; no address validation for now.
- Authentication: email and password; no email OTP for now.
- Payment: not selected yet.
- Admin/staff tools: postponed.
