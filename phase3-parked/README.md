# Phase 3 — Parked Work

This folder holds work-in-progress for Phase 3 that was scoped
out of the Phase 2 Friday MVP. Files here are NOT wired into the
app — they're version-controlled drafts to pick up later.

## Contributors
- @farhiyamohamed — Subscription template catalog + autocomplete
  + currency picker + settings page (originally PR #16, see
  https://github.com/kashik09/hustledesk/pull/16)

## Files
- `components/SubscriptionAutocomplete.jsx` — autocomplete for
  /api/templates lookup. Needs: rename export, fix circular import,
  style with Tailwind.
- `components/CurrencyPicker.jsx` — shared currency dropdown.
  Needs: Tailwind styling.
- `pages/Settings.jsx` — home_currency settings page. Needs:
  real backend call (currently console.log), Tailwind styling.
- `server/routes/templates.py` — public GET endpoint for catalog.
  Needs: blueprint registration + url_prefix check.
- `server/seeds/seed_templates.py` — idempotent seeder. Needs:
  field name verification (country vs country_code).
- `server/seeds/templates.json` — seed data (2 sample entries).

## When Phase 3 starts
1. Move files out of /phase3-parked/ into proper locations
2. Fix issues noted above
3. Wire SubscriptionTemplate model into the UI (autocomplete on
   /subscriptions/new)
4. Add catalog seed run to deploy pipeline
