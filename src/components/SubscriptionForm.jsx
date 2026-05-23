import { useState, useEffect } from "react";
import TemplateAutocomplete from "./TemplateAutocomplete";
import PricingTierSelector from "./PricingTierSelector";
import SeatsInput from "./SeatsInput";

const CATEGORIES = [
  { value: "productivity",  label: "Productivity" },
  { value: "entertainment", label: "Entertainment" },
  { value: "dev_tools",     label: "Dev Tools" },
  { value: "marketing",     label: "Marketing" },
  { value: "storage",       label: "Storage" },
  { value: "other",         label: "Other" },
];

const CURRENCIES = [
  { value: "KES", label: "KES — Kenyan Shilling" },
  { value: "USD", label: "USD — US Dollar" },
  { value: "EUR", label: "EUR — Euro" },
  { value: "GBP", label: "GBP — British Pound" },
  { value: "UGX", label: "UGX — Ugandan Shilling" },
  { value: "TZS", label: "TZS — Tanzanian Shilling" },
];

const BILLING_CYCLES = [
  { value: "monthly", label: "Monthly" },
  { value: "annual",  label: "Annual" },
  { value: "weekly",  label: "Weekly" },
  { value: "daily",   label: "Daily" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const empty = {
  name:          "",
  amount:        "",
  currency:      "KES",
  billing_cycle: "monthly",
  category:      "other",
};

function toForm(sub) {
  if (!sub) return empty;
  return {
    name:          sub.name          ?? "",
    amount:        sub.amount != null ? String(sub.amount) : "",
    currency:      sub.currency      ?? "KES",
    billing_cycle: sub.billing_cycle ?? "monthly",
    category:      sub.category      ?? "other",
  };
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function SubscriptionForm({
  initial = null,
  onSave,
  onCancel,
  saving = false,
  error = null,
  budgetWarning = null,
}) {
  const isEdit = Boolean(initial);
  const [fields, setFields] = useState(() => toForm(initial));
  const [touched, setTouched] = useState({});
  const [localErrors, setLocalErrors] = useState({});
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedTier, setSelectedTier] = useState(null);
  const [seats, setSeats] = useState(initial?.seats || 1);

  // Sync when parent swaps the edit target
  useEffect(() => {
    setFields(toForm(initial));
    setTouched({});
    setLocalErrors({});
    setSelectedTemplate(null);
    setSelectedTier(null);
    setSeats(initial?.seats || 1);
  }, [initial?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Template selection ────────────────────────────────────────────────────

  function handleTemplateSelect(template) {
    setSelectedTemplate(template);
    setSelectedTier(null);
    setSeats(1);
    setFields({
      name: template.service_name,
      amount: String(template.amount),
      currency: template.currency,
      billing_cycle: template.billing_cycle || "monthly",
      category: template.category || "other",
    });
    setTouched({});
    setLocalErrors({});
  }

  function handleTierSelect(tier) {
    setSelectedTier(tier);
    setFields((f) => ({
      ...f,
      amount: String(tier.price || tier.amount),
    }));
  }

  // ── Field change ──────────────────────────────────────────────────────────

  function handleChange(e) {
    const { name, value } = e.target;
    setFields((f) => ({ ...f, [name]: value }));
    setTouched((t) => ({ ...t, [name]: true }));
    // Clear local error on change
    if (localErrors[name]) setLocalErrors((e) => { const n = { ...e }; delete n[name]; return n; });
  }

  // ── Client-side validation ────────────────────────────────────────────────

  function validate() {
    const errs = {};
    if (!fields.name.trim())               errs.name   = "Name is required";
    const amt = parseFloat(fields.amount);
    if (isNaN(amt) || amt <= 0)            errs.amount = "Enter a positive amount";
    return errs;
  }

  // ── Submit ───────────────────────────────────

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setLocalErrors(errs);
      setTouched({ name: true, amount: true });
      return;
    }
    onSave({
      name:          fields.name.trim(),
      amount:        parseFloat(fields.amount),
      currency:      fields.currency,
      billing_cycle: fields.billing_cycle,
      category:      fields.category,
      seats:         selectedTemplate?.per_seat_pricing ? seats : 1,
    });
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const fieldError = (key) =>
    touched[key] && localErrors[key] ? (
      <span className="field-error">{localErrors[key]}</span>
    ) : null;

  return (
    <div className="form-card" role="dialog" aria-labelledby="form-title">
      <h2 id="form-title" className="form-title">
        {isEdit ? `Edit — ${initial.name}` : "Add Subscription"}
      </h2>

      {budgetWarning && (
        <div className="form-alert form-alert--warn" role="alert">
          ⚠ {budgetWarning}
        </div>
      )}

      {error && (
        <div className="form-alert form-alert--error" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        {/* Template autocomplete - only show when creating new */}
        {!isEdit && (
          <div className="mb-5">
            <TemplateAutocomplete onSelect={handleTemplateSelect} />
          </div>
        )}

        {/* Pricing tier selector - show when template has tiers */}
        {selectedTemplate?.pricing_tiers && selectedTemplate.pricing_tiers.length > 0 && (
          <div className="mb-5">
            <PricingTierSelector
              tiers={selectedTemplate.pricing_tiers}
              selected={selectedTier}
              onSelect={handleTierSelect}
              currency={fields.currency}
            />
          </div>
        )}

        {/* Seats input - show for per-seat pricing */}
        {selectedTemplate?.per_seat_pricing && (
          <div className="mb-5">
            <SeatsInput
              value={seats}
              onChange={setSeats}
              pricePerSeat={parseFloat(fields.amount) || 0}
              currency={fields.currency}
            />
          </div>
        )}

        <div className="form-grid">

          {/* Name */}
          <div className="field field--full">
            <label htmlFor="f-name" className="field-label">Service name</label>
            <input
              id="f-name"
              name="name"
              type="text"
              className={`field-input ${localErrors.name && touched.name ? "field-input--error" : ""}`}
              value={fields.name}
              onChange={handleChange}
              placeholder="e.g. GitHub Copilot"
              autoFocus={!isEdit}
              maxLength={120}
            />
            {fieldError("name")}
          </div>

          {/* Amount + Currency (side by side) */}
          <div className="field">
            <label htmlFor="f-amount" className="field-label">Price</label>
            <input
              id="f-amount"
              name="amount"
              type="number"
              step="0.01"
              min="0.01"
              className={`field-input ${localErrors.amount && touched.amount ? "field-input--error" : ""}`}
              value={fields.amount}
              onChange={handleChange}
              placeholder="0.00"
            />
            {fieldError("amount")}
          </div>

          <div className="field">
            <label htmlFor="f-currency" className="field-label">Currency</label>
            <select
              id="f-currency"
              name="currency"
              className="field-select"
              value={fields.currency}
              onChange={handleChange}
            >
              {CURRENCIES.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          {/* Billing cycle */}
          <div className="field">
            <label htmlFor="f-cycle" className="field-label">Billing cycle</label>
            <select
              id="f-cycle"
              name="billing_cycle"
              className="field-select"
              value={fields.billing_cycle}
              onChange={handleChange}
            >
              {BILLING_CYCLES.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div className="field">
            <label htmlFor="f-category" className="field-label">Category</label>
            <select
              id="f-category"
              name="category"
              className="field-select"
              value={fields.category}
              onChange={handleChange}
            >
              {CATEGORIES.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

        </div>

        {/* Actions */}
        <div className="form-actions">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onCancel}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving}
          >
            {saving ? "Saving…" : isEdit ? "Save changes" : "Add subscription"}
          </button>
        </div>
      </form>
    </div>
  );
}
