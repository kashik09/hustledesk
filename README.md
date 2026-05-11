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
https://curious-scone-0223cd.netlify.app/
