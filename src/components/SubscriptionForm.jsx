import { useState, useEffect } from "react";

const CATEGORIES = [
  { value: "productivity",  label: "Productivity" },
  { value: "entertainment", label: "Entertainment" },
  { value: "dev_tools",     label: "Dev Tools" },
  { value: "marketing",     label: "Marketing" },
  { value: "storage",       label: "Storage" },
  { value: "other",         label: "Other" },
];

const CURRENCIES = [
  { value: "USD", label: "USD — US Dollar" },
  { value: "EUR", label: "EUR — Euro" },
  { value: "GBP", label: "GBP — British Pound" },
  { value: "AUD", label: "AUD — Australian Dollar" },
  { value: "CAD", label: "CAD — Canadian Dollar" },
  { value: "JPY", label: "JPY — Japanese Yen" },
  { value: "SGD", label: "SGD — Singapore Dollar" },
  { value: "INR", label: "INR — Indian Rupee" },
];

const BILLING_CYCLES = [
  { value: "monthly",  label: "Monthly" },
  { value: "yearly",   label: "Yearly" },
  { value: "weekly",   label: "Weekly" },
  { value: "one_time", label: "One-time" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const empty = {
  name:          "",
  amount:        "",
  currency:      "USD",
  billing_cycle: "monthly",
  category:      "other",
};

function toForm(sub) {
  if (!sub) return empty;
  return {
    name:          sub.name          ?? "",
    amount:        sub.amount != null ? String(sub.amount) : "",
    currency:      sub.currency      ?? "USD",
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

  // Sync when parent swaps the edit target
  useEffect(() => {
    setFields(toForm(initial));
    setTouched({});
    setLocalErrors({});
  }, [initial?.id]); // eslint-disable-line react-hooks/exhaustive-deps

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