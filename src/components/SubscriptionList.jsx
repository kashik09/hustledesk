import { useState } from "react";

const CATEGORY_META = {
  productivity:  { label: "Productivity",  color: "#4ade80", bg: "rgba(74,222,128,.12)" },
  entertainment: { label: "Entertainment", color: "#f97316", bg: "rgba(249,115,22,.12)" },
  dev_tools:     { label: "Dev Tools",     color: "#60a5fa", bg: "rgba(96,165,250,.12)" },
  marketing:     { label: "Marketing",     color: "#e879f9", bg: "rgba(232,121,249,.12)" },
  storage:       { label: "Storage",       color: "#facc15", bg: "rgba(250,204,21,.12)" },
  other:         { label: "Other",         color: "#94a3b8", bg: "rgba(148,163,184,.12)" },
};

const CYCLE_LABELS = {
  monthly: "/mo",
  annual:  "/yr",
  weekly:  "/wk",
  daily:   "/day",
};

// ─── Single row ──────────────────────────────────────────────────────────────

function SubscriptionRow({ sub, onEdit, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const cat   = CATEGORY_META[sub.category] ?? CATEGORY_META.other;
  const cycle = CYCLE_LABELS[sub.billing_cycle] ?? "";

  return (
    <li className="sub-row">
      {/* Left: name + badges */}
      <div className="sub-main">
        <span className="sub-name">{sub.name}</span>
        <div className="sub-badges">
          <span
            className="badge badge--category"
            style={{ color: cat.color, background: cat.bg }}
          >
            {cat.label}
          </span>
          <span className="badge badge--currency">{sub.currency}</span>
        </div>
      </div>

      {/* Right: price + actions */}
      <div className="sub-right">
        <div className="sub-price">
          <span className="price-original">
            {sub.currency} {parseFloat(sub.amount).toFixed(2)}{cycle}
          </span>
        </div>

        <div className="sub-actions">
          <button
            className="icon-btn icon-btn--edit"
            onClick={() => onEdit(sub)}
            title="Edit subscription"
            aria-label={`Edit ${sub.name}`}
          >
            ✎
          </button>

          {confirmDelete ? (
            <>
              <button
                className="icon-btn icon-btn--confirm"
                onClick={() => onDelete(sub.id)}
                aria-label="Confirm delete"
              >
                ✓
              </button>
              <button
                className="icon-btn icon-btn--cancel"
                onClick={() => setConfirmDelete(false)}
                aria-label="Cancel delete"
              >
                ✕
              </button>
            </>
          ) : (
            <button
              className="icon-btn icon-btn--delete"
              onClick={() => setConfirmDelete(true)}
              title="Delete subscription"
              aria-label={`Delete ${sub.name}`}
            >
              ⌫
            </button>
          )}
        </div>
      </div>
    </li>
  );
}

// ─── Skeleton loader ─────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <li className="sub-row sub-row--skeleton" aria-hidden="true">
      <div className="skeleton skeleton--name" />
      <div className="skeleton skeleton--badge" />
      <div className="skeleton skeleton--price" />
    </li>
  );
}

// ─── Main list component ─────────────────────────────────────────────────────

export default function SubscriptionList({
  subscriptions = [],
  loading = false,
  onEdit,
  onDelete,
}) {
  if (loading) {
    return (
      <ul className="sub-list" aria-label="Loading subscriptions">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonRow key={i} />
        ))}
      </ul>
    );
  }

  if (!subscriptions.length) {
    return (
      <div className="sub-empty">
        <span className="sub-empty-icon">📭</span>
        <p className="sub-empty-text">No subscriptions yet.</p>
        <p className="sub-empty-hint">Hit "Add Subscription" to track your first one.</p>
      </div>
    );
  }

  return (
    <ul className="sub-list" aria-label="Your subscriptions">
      {subscriptions.map((sub) => (
        <SubscriptionRow
          key={sub.id}
          sub={sub}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );
}
