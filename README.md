
#  HustleDesk

A full-stack subscription tracking and currency intelligence platform.

---

#  Overview

HustleDesk helps users:
- Track subscriptions across services (Netflix, Spotify, etc.)
- View spending in multiple currencies
- Use smart templates to quickly add subscriptions
- Analyze rate changes and currency impact

---

# System Architecture

## Backend (Flask)
- Flask API (app factory pattern)
- SQLAlchemy ORM
- Flask-Migrate (database migrations)
- Flask-JWT-Extended (authentication)
- Flask-CORS (frontend integration)

## Frontend (React)
- React hooks-based architecture
- Context-based authentication
- Modular reusable components
- API-driven UI (no mock data)

---

# 👥 Team Responsibilities

## Person 2 — Authentication
- JWT login/signup system
- Protected routes
- AuthContext (frontend state)
- bcrypt password hashing

---

## Person 3 — Subscriptions Core
- Subscription CRUD API
- Ownership enforcement
- Categories system
- CSV export endpoint

---

## Person 4 — FX Rates Engine
- Live currency rate fetching
- Rate snapshots database
- Multi-currency conversion logic
- Historical rate tracking

---

## Person 5 — Templates & UI Polish 
- Subscription templates system
- Autocomplete search (Netflix, Spotify, etc.)
- Shared CurrencyPicker component
- Settings page (home currency)
- UI skeleton loaders & error handling
- README + documentation polish

---

#  Features

##  Authentication
- Signup / Login
- JWT-based sessions
- Protected routes

---

##  Subscriptions
- Create / edit / delete subscriptions
- Category tagging:
  - productivity
  - entertainment
  - dev_tools
  - marketing
  - storage
  - other

---

##  Smart Templates
- Search subscriptions by service name
- Auto-fill form fields:
  - service name
  - plan
  - price
  - currency
  - category
- Country-based filtering

---

##  Currency System
Supported currencies:
- USD
- EUR
- GBP
- KES
- UGX
- TZS

Features:
- CurrencyPicker reusable component
- Cross-currency conversion logic (backend)
- Home currency setting per user

---

##  Settings
- Set preferred home currency
- Future integration with backend `/me` endpoint

---

##  Rates System
- Live FX rate fetching
- Historical snapshots
- Mid-market rate calculation
- Rate provenance display

---

#  API Endpoints

## Auth