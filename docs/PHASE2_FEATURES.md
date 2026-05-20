# HustleDesk Phase 2 Features — Presentation Guide

## Project Overview

**HustleDesk** is an FX subscription tracking toolkit for Kenyan freelancers. It helps users track their SaaS subscriptions across multiple currencies and see the true cost in Kenyan Shillings (KES).

**Tech Stack:**
- Frontend: React 19 + Vite + Tailwind CSS
- Backend: Flask + SQLAlchemy + PostgreSQL
- Auth: JWT (JSON Web Tokens)
- Deployment: Vercel (frontend) + Render (backend)

---

## Phase 2 Features Added

### 1. User Authentication System

**What it does:**
- Users can create accounts with email and password
- Users can log in and receive a JWT token
- Protected routes require authentication
- Users can log out (client-side token removal)

**Backend Endpoints:**
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/signup` | POST | Create new user account |
| `/api/auth/login` | POST | Authenticate and get JWT token |
| `/api/auth/me` | GET | Get current user profile (requires auth) |
| `/api/auth/logout` | POST | Log out (stateless, client removes token) |

**Technical Implementation:**
- Passwords hashed with bcrypt (never stored in plain text)
- JWT tokens expire after 15 minutes for security
- User model includes: email, password_hash, home_currency, budget_kes
- Email validation with regex pattern matching

**Frontend Components:**
- `AuthContext.jsx` — React Context for global auth state
- `Login.jsx` — Login form with email/password
- `Signup.jsx` — Registration form with currency selector
- `ProtectedRoute.jsx` — Route wrapper that redirects unauthenticated users

**Security Features:**
- JWT stored in localStorage as `hd_token`
- Authorization header: `Bearer <token>`
- Protected routes check token validity on mount
- Password minimum 6 characters

---

### 2. Subscription CRUD System

**What it does:**
- Users can create, read, update, and delete their subscriptions
- Each subscription belongs to ONE user (ownership enforcement)
- Supports multiple currencies (KES, USD, EUR, GBP, UGX, TZS)
- Categorization: productivity, entertainment, dev_tools, marketing, storage, other
- Billing cycles: monthly, annual, weekly, daily

**Backend Endpoints:**
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/subscriptions` | GET | List user's subscriptions (paginated) |
| `/api/subscriptions` | POST | Create new subscription |
| `/api/subscriptions/<id>` | GET | Get single subscription |
| `/api/subscriptions/<id>` | PUT | Update subscription |
| `/api/subscriptions/<id>` | DELETE | Delete subscription |

**Pagination:**
- Query params: `page` (default 1), `per_page` (default 20, max 100)
- Response includes: items, page, per_page, total, total_pages

**Ownership Enforcement:**
- User A cannot see User B's subscriptions
- Attempting to access another user's subscription returns 404 (not 403, to avoid leaking existence)
- All queries filter by `user_id` from JWT token

**Validation Rules:**
- `name`: required, max 100 characters
- `amount`: required, must be positive number
- `currency`: must be one of KES, USD, EUR, GBP, UGX, TZS
- `billing_cycle`: must be one of monthly, annual, weekly, daily
- `category`: must be one of productivity, entertainment, dev_tools, marketing, storage, other

**Frontend Components:**
- `Subscriptions.jsx` — Main page with list, form, and filters
- `SubscriptionForm.jsx` — Create/edit form with validation
- `SubscriptionList.jsx` — Displays subscriptions with category badges

---

### 3. Database Models

**User Model:**
```python
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    home_currency = db.Column(db.String(3), default="KES")
    budget_kes = db.Column(db.Numeric(12, 2), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
```

**Subscription Model:**
```python
class Subscription(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    amount = db.Column(db.Numeric(12, 2), nullable=False)
    currency = db.Column(db.String(3), nullable=False)
    billing_cycle = db.Column(db.String(20), default="monthly")
    category = db.Column(db.String(40), default="other")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, onupdate=datetime.utcnow)
```

**RateSnapshot Model (for future FX history):**
```python
class RateSnapshot(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    from_currency = db.Column(db.String(3), nullable=False)
    to_currency = db.Column(db.String(3), nullable=False)
    rate = db.Column(db.Numeric(18, 8), nullable=False)
    captured_at = db.Column(db.DateTime, nullable=False)
```

**SubscriptionTemplate Model (for autocomplete catalog):**
```python
class SubscriptionTemplate(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    service_name = db.Column(db.String(100), nullable=False)
    plan_name = db.Column(db.String(50))
    country_code = db.Column(db.String(2))
    currency = db.Column(db.String(3))
    amount = db.Column(db.Numeric(12, 2))
    category = db.Column(db.String(40))
```

---

### 4. Multi-Currency Support

**Supported Currencies:**
| Code | Name | Region |
|------|------|--------|
| KES | Kenyan Shilling | Kenya |
| UGX | Ugandan Shilling | Uganda |
| TZS | Tanzanian Shilling | Tanzania |
| USD | US Dollar | International |
| EUR | Euro | Europe |
| GBP | British Pound | UK |

**How it works:**
- Each subscription stores its original currency (source of truth)
- User sets their "home currency" (default KES)
- Frontend uses `useRates` hook to fetch live exchange rates
- KES equivalent calculated client-side for display

**Exchange Rate Source:**
- Open Exchange Rates API (free tier)
- Rates cached and refreshed periodically
- Fallback values if API unavailable

---

### 5. Frontend-Backend Integration

**API Client (`src/lib/api.js`):**
- Centralized fetch wrapper
- Automatically attaches JWT token to requests
- Handles error responses consistently
- Methods: get, post, put, patch, delete

**Auth Flow:**
1. User submits login form
2. Frontend calls POST `/api/auth/login`
3. Backend validates credentials, returns JWT
4. Frontend stores token in localStorage
5. All subsequent requests include `Authorization: Bearer <token>`
6. On app load, frontend calls GET `/api/auth/me` to validate token

**Protected Routes:**
- Dashboard, Subscriptions, Trends pages require auth
- `ProtectedRoute` component checks `isAuthenticated` from AuthContext
- Unauthenticated users redirected to `/login`

---

### 6. UI/UX Features

**Login/Signup Pages:**
- Clean card-based design
- Password visibility toggle (eye icon)
- Form validation with error messages
- Loading states during submission
- Link to switch between login/signup

**Subscriptions Page:**
- Category chips with color coding
- Budget progress bar (if user has budget set)
- Add/Edit subscription modal
- Confirm delete pattern (click delete → confirm/cancel)
- Pagination controls
- Empty state with helpful message

**Responsive Design:**
- Mobile-friendly layouts
- Tailwind CSS utilities
- Consistent color scheme (stone/orange theme)

---

### 7. Project Structure

```
hustledesk/
├── server/                    # Flask backend
│   ├── app.py                # App factory
│   ├── config.py             # Environment configs
│   ├── extensions.py         # Flask extensions
│   ├── models/               # SQLAlchemy models
│   │   ├── user.py
│   │   ├── subscription.py
│   │   ├── rate_snapshot.py
│   │   └── subscription_template.py
│   └── routes/               # API blueprints
│       ├── auth.py           # Auth endpoints
│       └── subscriptions.py  # CRUD endpoints
├── src/                      # React frontend
│   ├── components/           # Reusable components
│   ├── contexts/             # React contexts
│   ├── hooks/                # Custom hooks
│   ├── lib/                  # Utilities
│   └── pages/                # Page components
├── requirements.txt          # Python dependencies
├── package.json              # Node dependencies
├── render.yaml               # Render deployment config
└── vercel.json               # Vercel deployment config
```

---

### 8. Deployment Architecture

**Frontend (Vercel):**
- Automatic deploys from GitHub main branch
- Vite build → static files in `dist/`
- URL: `https://hustledesk.vercel.app`

**Backend (Render):**
- Web service running Gunicorn
- PostgreSQL database (free tier)
- Environment variables for secrets
- URL: `https://hustledesk-api.onrender.com`

**Environment Variables:**
| Variable | Purpose |
|----------|---------|
| `JWT_SECRET_KEY` | Signs JWT tokens |
| `DATABASE_URL` | PostgreSQL connection string |
| `FLASK_ENV` | production/development |
| `CORS_ORIGINS` | Allowed frontend URLs |

---

## Key Accomplishments

1. **Secure Authentication** — JWT-based auth with password hashing
2. **Full CRUD Operations** — Create, read, update, delete subscriptions
3. **Multi-User Support** — Each user's data is isolated
4. **Multi-Currency** — 6 currencies with live exchange rates
5. **Responsive UI** — Works on desktop and mobile
6. **Production Deployment** — Separate frontend/backend hosting

---

## Demo Flow

1. **Signup** — Create account with email, password, home currency
2. **Login** — Authenticate and receive JWT
3. **Dashboard** — View exchange rates (from Phase 1)
4. **Subscriptions** — Add Netflix (USD), Spotify (KES), etc.
5. **Edit** — Change subscription amount or category
6. **Delete** — Remove a subscription
7. **Logout** — Clear session

---

## Team Contributions

| Member | Package | Contribution |
|--------|---------|--------------|
| Person 1 (Kashi) | A | Project lead, auth backend, subscriptions backend |
| Person 2 (Elvis) | B | Subscriptions frontend UI |
| Person 3 (Farhiya) | D | Catalog templates (parked for Phase 3) |
| Person 4 (Abdala) | C | Trends page |
| Person 5 (Maggie) | E | API hooks |

---

## Phase 3 Preview (Not in MVP)

- Subscription template autocomplete
- CSV export
- Server-side KES conversion (amount_kes field)
- Rate history charts
- Budget alerts
