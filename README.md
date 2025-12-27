# Nyord (Banking App)

Nyord is a full-stack banking-style application with a FastAPI backend and a React (Vite) frontend. It includes customer flows (accounts, transfers, loans, cards, fixed deposits, QR payments) and an admin panel for approvals and oversight, plus real-time events via WebSockets.

## Features

### Authentication & Roles
- JWT-based authentication (`/auth/register`, `/auth/login`, `/auth/me`).
- Roles: `customer` and `admin`.
- Customer accounts start in `pending` state and require admin approval to login.

### KYC & User Profile
- KYC-style user fields captured on registration (ID type/number, occupation, income, emergency contact, etc.).
- Profile read/update endpoints.
- Password change endpoint.

### Accounts
- Create new bank accounts (requires KYC approval, then admin approval).
- List accounts, list only approved accounts, view balances.
- Transfer between a user’s own accounts.

### Transfers & Transactions
- Initiate account-to-account transfers with a `PENDING → SUCCESS/FAILED` flow.
- Transaction history for the current user.
- Background processing using Celery with DB row locking (`with_for_update`) for safer balance updates.
- Low-balance event publishing when balance drops below a threshold.

### QR Payments
- Generate QR codes for users and for each approved account (UPI-style).
- Decode QR contents (URL-based) to extract recipient/account details.
- QR-initiated transfers via `/transactions/qr-transfer`.
- QR images include a centered Nyord logo with high error correction.
  - Logo file: `frontend/public/logo.png`

### Fixed Deposits
- Create fixed deposits linked to a specific account (balance deducted).
- Renewal creates a new FD and marks the old one as renewed.
- Early cancellation with penalty rules.
- Maturity amount calculated using monthly compounding.

### Loans
- Apply for loans (Home/Personal/Auto) with EMI calculation.
- Pay loans and track outstanding balance and next due date.
- Real-time loan-related events published to the WebSocket event exchange.

### Cards
- Request cards (Standard/Gold/Platinum/Premium) with approval workflow.
- PIN verification, PIN change, block/unblock card.
- Card-to-account transfer (requires active card + correct PIN).

### Notifications
- Persisted notifications (create/list/stats/mark-read/delete).
- Admin broadcast notifications to all customers.
- Real-time notification delivery via WebSocket.
- Push notification subscription endpoints exist (currently stored in-memory and “test” is simulated).

### Admin Panel
- System stats for admin dashboard (users, accounts, balances, transactions, pending approvals).
- Manage users (list/create/update/delete).
- Approvals workflows:
  - KYC approve/reject
  - Account approve/reject
  - Card/loan/FD approval flows (implemented in admin router)

### Real-time Events
- WebSocket endpoint (`/ws`) with optional token-based user association.
- RabbitMQ fanout exchange (`ws_events`) used to broadcast events.
- Backend starts a RabbitMQ listener thread on app startup to relay events to WebSocket clients.

## Tech Stack

### Backend
- Python + FastAPI
- SQLAlchemy ORM
- PostgreSQL (via `psycopg2-binary`)
- JWT auth (`python-jose`)
- Celery for background jobs
- RabbitMQ messaging (`pika`)
- WebSockets (FastAPI + `websockets`)
- QR generation (`qrcode`, `Pillow`)

### Frontend
- React + Vite
- React Router
- Tailwind CSS
- Charting: Recharts + Chart.js
- QR: `qr-scanner` and `@zxing/library`
- UI utilities: Radix UI, lucide-react
- Service worker registration (client-side)

## Repo Layout

- `backend/` – FastAPI app, routers, models, Celery tasks, RabbitMQ integration
- `frontend/` – React (Vite) client
- `docs/` – implementation notes and documentation
- `create_admin.py`, `create_customer.py` – helper scripts for bootstrap

## Setup (Local Development)

### Prerequisites
- Python 3.10+ recommended
- Node.js 18+ recommended
- PostgreSQL
- RabbitMQ

### 1) Configure environment variables
The backend loads environment variables via `.env`.

Required:
- `DATABASE_URL` (SQLAlchemy URL)
- `JWT_SECRET`
- `JWT_ALGORITHM` (default: `HS256`)
- `ACCESS_TOKEN_EXPIRE_MINUTES`

Optional:
- `CORS_ORIGINS` (comma-separated)
- `ALLOW_ALL_ORIGINS` (`true`/`false`)

Example `.env`:

```env
DATABASE_URL=postgresql+psycopg2://postgres:postgres@localhost:5432/nyord
JWT_SECRET=dev-secret-change-me
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
CORS_ORIGINS=http://localhost:3000
ALLOW_ALL_ORIGINS=false
```

### 2) Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r ../requirements.txt

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- API docs: `http://localhost:8000/docs`

### 3) RabbitMQ + Celery (background processing)
This project uses RabbitMQ both as:
- Celery broker
- WebSocket event bus (`ws_events` exchange)

Start a worker:

```bash
cd backend
source .venv/bin/activate
celery -A app.tasks worker -l info -Q celery
```

Start Celery beat (for scheduled tasks like `auto_debit_loan_emi`):

```bash
cd backend
source .venv/bin/activate
celery -A app.celery_app beat -l info
```

### 4) Frontend

```bash
cd frontend
npm install
npm run dev
```

The dev server runs on `http://localhost:3000`.

## Bootstrapping an Admin

Options in this repo:
- API endpoint: `POST /admin/setup-admin` (only works if no admin exists).
- CLI script: `python create_admin.py` (interactive) or scripts under `backend/`.

## Notes / Known Behaviors
- Some QR endpoints currently embed `http://localhost:3000` as the frontend base URL.
- Push notifications are currently stored in-memory (non-persistent) and the “test” endpoint is simulated.
- `Base.metadata.create_all(...)` runs on backend startup; use a real migration workflow for production.

## License
See `LICENSE`.
