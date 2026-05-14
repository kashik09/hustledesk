# HustleDesk

FX subscription tracking toolkit for Kenyan freelancers. Track SaaS subscriptions across multiple currencies and see the true cost in Kenyan Shillings (KES).

## Live Demo

- **Frontend:** https://hustledesk.vercel.app
- **Backend API:** https://hustledesk-api-9qwl.onrender.com

---

## Features

- User authentication (signup/login with JWT)
- Subscription CRUD with ownership enforcement
- Multi-currency support (KES, USD, EUR, GBP, UGX, TZS)
- Live exchange rates with KES conversion
- Budget tracking with progress bar
- Category filtering and pagination
- 30-day historical trends
- Responsive mobile-first UI

---

## Tech Stack

**Frontend:**
- React 19 + Vite
- Tailwind CSS
- React Router
- Recharts
- Lucide Icons

**Backend:**
- Flask + SQLAlchemy
- PostgreSQL
- Flask-JWT-Extended
- Flask-Bcrypt
- Gunicorn

**APIs:**
- Open Exchange Rates (live FX)
- Frankfurter API (historical data)

---

## Setup Instructions

### Frontend

```bash
git clone https://github.com/kashik09/hustledesk.git
cd hustledesk
npm install
npm run dev
```

### Backend

```bash
pip install -r requirements.txt
flask run
```

### Environment Variables

**Frontend (.env):**
```
VITE_API_URL=http://localhost:5000/api
```

**Backend (.env):**
```
DATABASE_URL=postgresql://...
JWT_SECRET_KEY=your-secret
FLASK_ENV=development
CORS_ORIGINS=http://localhost:5173
```

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/auth/signup` | POST | Create account |
| `/api/auth/login` | POST | Get JWT token |
| `/api/auth/me` | GET | Current user profile |
| `/api/subscriptions` | GET | List subscriptions (paginated) |
| `/api/subscriptions` | POST | Create subscription |
| `/api/subscriptions/:id` | PUT | Update subscription |
| `/api/subscriptions/:id` | DELETE | Delete subscription |

---

## Data Models

- **User** — email, password_hash, home_currency, budget_kes
- **Subscription** — name, amount, currency, billing_cycle, category, user_id
- **RateSnapshot** — FX history log
- **SubscriptionTemplate** — public catalog for autocomplete

---

## Deployment

| Service | Platform |
|---------|----------|
| Frontend | Vercel |
| Backend | Render |
| Database | Render PostgreSQL |

---

## Team

| Member | Role |
|--------|------|
| Kashi | Project lead, backend |
| Elvis | Subscriptions frontend |
| Farhiya | Catalog templates |
| Abdala | Trends page |
| Maggie | API hooks |
