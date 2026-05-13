# Rate & Currency Methodology

> This document explains HustleDesk's approach to multi-currency
> subscriptions and exchange rate handling. Written in response to
> three questions raised during Phase 1 review.

## Q1: What if a subscription is priced in KSH (or any non-USD currency)?

Phase 1 hardcoded USD as the input currency. Phase 2 fixes this with
three layers:

**Layer 1 — `currency` field on Subscription**
Every subscription stores its original billing currency as an ISO 4217
code. Supported currencies: USD, EUR, GBP, KES, UGX, TZS.
See: `server/models/subscription.py`

**Layer 2 — `home_currency` on User**
Each user picks their home currency (defaults to KES). All dashboard
totals normalize to this currency, regardless of what the sub is
billed in.
See: `server/models/user.py`

**Layer 3 — `SubscriptionTemplate` catalog**
A 128-row catalog of known sub prices across 33 services in 6
countries (KE, UG, TZ, RW, US, GB). When a user types "Netflix...",
autocomplete suggests Netflix-KE (KES) vs Netflix-US (USD) as
separate entries with correct pricing.
See: `server/models/subscription_template.py` and
`server/seeds/templates.json`

## Q2: What about rate fluctuation?

Phase 1 used pseudo-random "fake" historical data because no free API
supports KES history. Phase 2 fixes this by storing our own snapshots
over time.

**`RateSnapshot` model — global FX log**
Every backend request that converts a currency writes today's rate to
the table (if not already captured today). Over time, we accumulate
real historical data per currency pair.

Schema: `(from_currency, to_currency, rate, source, captured_at)`
with 8-decimal precision for FX accuracy.

The Trends page queries this table directly — no more synthetic data.
See: `server/models/rate_snapshot.py`

**Cross-rate math (any-to-any conversion)**
Free APIs only return USD-pegged rates. To convert UGX → KES, we use:

```
rate_UGX_to_KES = rates.KES / rates.UGX
```

This means we fetch one set of rates per day (USD-base) and compute
any pair on the fly. Audit trail in the snapshot table.

## Q3: How does the rate work?

Rate provenance is surfaced everywhere a converted figure appears:

**On the dashboard RateCard:**
- Source name: "Open Exchange Rates" (open.er-api.com)
- Captured timestamp: "Updated 2:14pm today"
- Tooltip explaining "mid-market rate"
See: `src/components/RateCard.jsx`

**In API responses:**
Every conversion endpoint returns:

```json
{
  "converted": 351.35,
  "rate": 0.0351,
  "source": "open.er-api.com",
  "captured_at": "2026-05-12T14:14:00Z"
}
```

See: `server/routes/rates.py`

**API choice rationale**
Originally used Frankfurter (Phase 1) — switched to open.er-api.com
because Frankfurter doesn't support KES, UGX, TZS, or RWF. New
provider supports all 6 currencies we ship in Phase 2.
