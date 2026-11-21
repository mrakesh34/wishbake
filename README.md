# WISHBAKE

Premium custom-cake storefront for delivery in Bhubaneswar, Odisha. Customers can browse cakes, customize a cake in 3D, keep an account-backed cart, and place INR orders. The payment provider is intentionally undecided; orders are currently recorded without payment.

## Start locally

1. Set `DATABASE_URL` in `backend/.env` to the Neon PostgreSQL connection string. Never commit or share this secret.
2. Start the API from the repository root:

   ```powershell
   python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload --reload-dir backend
   ```

3. Start the storefront in another terminal:

   ```powershell
   cd frontend
   npm install
   npm run dev
   ```

Storefront: http://127.0.0.1:5173/ · API docs: http://127.0.0.1:8000/docs · Health: http://127.0.0.1:8000/health

See [PROJECT.md](PROJECT.md) for architecture, API routes, decisions, and the next implementation phases.
