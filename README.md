# HustleDesk

HustleDesk is a React-based FX toolkit designed for Kenyan freelancers, remote workers, and small business owners.

It helps users:
- Track USD to KES exchange rates
- Understand purchasing power locally
- Monitor subscription costs
- Analyze historical currency trends

---

## Features

- Live USD → KES exchange rates
- Purchasing power insights
- Subscription tracker
- 30-day historical trends
- Responsive mobile-first UI

---

## Tech Stack

- React
- Vite
- Tailwind CSS
- React Router
- Frankfurter API
- Recharts

---

## API Used

Frankfurter API

Endpoints:
- https://api.frankfurter.app/latest?from=USD&to=KES
- https://api.frankfurter.app/{date1}..{date2}?from=USD&to=KES

---

## Setup Instructions

```bash
git clone https://github.com/kashik09/hustledesk.git

cd hustledesk

npm install

npm run dev
```

---

## Architecture & Design Decisions

HustleDesk Phase 2 introduces a Flask + PostgreSQL backend, user
authentication, multi-currency support (East Africa + USD/EUR/GBP),
and a server-owned rate history system.

For details on currency handling, rate snapshots, and FX methodology,
see [docs/RATE_METHODOLOGY.md](docs/RATE_METHODOLOGY.md).

## Data Model

Four resources:
- `User` — auth + home currency + budget
- `Subscription` — user-owned, multi-currency
- `RateSnapshot` — global FX history log
- `SubscriptionTemplate` — public catalog (128 rows, 33 services)

---

## Challenges

- Handling async loading states
- Designing responsive charts
- Managing shared team workflow using Git branches

---

## Known Bugs

- Historical chart may briefly flash during loading
- Exchange rates depend on API availability

---

## Deployment

Project deployed on Netlify
](https://hustledeskke.netlify.app/)
