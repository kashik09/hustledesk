import { useState, useEffect, useCallback } from "react";
import SubscriptionForm from "../components/SubscriptionForm";
import SubscriptionList from "../components/SubscriptionList";
import useRates from "../hooks/useRates";
import "../subscriptions.css";
import { useAuth } from "../contexts/AuthContext";

// ─── API helpers ────────────────────────────────────────────────────────────

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const API = `${API_URL}/subscriptions`;

async function apiFetch(path, options = {}) {
  const token = localStorage.getItem("hd_token");
  const res = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw Object.assign(new Error(err.message || "Request failed"), { status: res.status, body: err });
  }
  return res.status === 204 ? null : res.json();
}

// ─── Constants ──────────────────────────────────────────────────────────────

const CATEGORY_LABELS = {
  productivity:  "Productivity",
  entertainment: "Entertainment",
  dev_tools:     "Dev Tools",
  marketing:     "Marketing",
  storage:       "Storage",
  other:         "Other",
};

const CATEGORY_COLORS = {
  productivity:  "#4ade80",
  entertainment: "#f97316",
  dev_tools:     "#60a5fa",
  marketing:     "#e879f9",
  storage:       "#facc15",
  other:         "#94a3b8",
};

// ─── Component ──────────────────────────────────────────────────────────────

export default function Subscriptions() {
  const { user } = useAuth();
  const { rates } = useRates("USD", "KES");

  // list state
  const [subs, setSubs]           = useState([]);
  const [meta, setMeta]           = useState({ page: 1, pages: 1, total: 0 });
  const [page, setPage]           = useState(1);
  const [filter, setFilter]       = useState(""); // category filter
  const [loading, setLoading]     = useState(false);
  const [listError, setListError] = useState(null);

  // form state
  const [showForm, setShowForm]   = useState(false);
  const [editTarget, setEditTarget] = useState(null);   // sub being edited
  const [formError, setFormError] = useState(null);
  const [saving, setSaving]       = useState(false);

  // budget
  const budgetKes = user?.budget_kes ?? 0;

  // ── KES conversion helper ────────────────────────────────────────────────
  // TODO: Phase 3 — server should return amount_kes directly for accuracy
  function monthlyKes(sub) {
    const monthMultiplier = {
      monthly: 1,
      annual: 1 / 12,
      weekly: 4.345,
      daily: 30.44,
    }[sub.billing_cycle] || 1;

    // Get rate for this currency to KES
    let rate = 1;
    if (sub.currency === "KES") {
      rate = 1;
    } else if (sub.currency === "USD") {
      rate = rates?.KES || 130; // fallback
    } else {
      // For EUR, GBP, UGX, TZS — convert via USD as intermediate
      // TODO: Phase 3 — proper cross-rate calculation
      const toUsd = rates?.[sub.currency] ? 1 / rates[sub.currency] : 1;
      rate = toUsd * (rates?.KES || 130);
    }

    return Number(sub.amount) * monthMultiplier * rate;
  }

  // ── Fetch subscriptions ──────────────────────────────────────────────────

  const fetchSubs = useCallback(async () => {
    setLoading(true);
    setListError(null);
    try {
      const params = new URLSearchParams({ page, per_page: 10 });
      if (filter) params.set("category", filter);
      const data = await apiFetch(`${API}?${params}`);
      setSubs(data.items);
      setMeta({
        page: data.page,
        pages: data.total_pages,
        total: data.total,
      });
    } catch (err) {
      setListError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, filter]);

  useEffect(() => {
    fetchSubs();
  }, [fetchSubs]);

  // ── Derived totals ───────────────────────────────────────────────────────

  const totalMonthlyKes = subs.reduce((acc, s) => acc + monthlyKes(s), 0);

  const categoryTotals = subs.reduce((acc, s) => {
    const cat = s.category;
    acc[cat] = (acc[cat] ?? 0) + monthlyKes(s);
    return acc;
  }, {});

  const budgetPct   = budgetKes > 0 ? Math.min((totalMonthlyKes / budgetKes) * 100, 100) : 0;
  const budgetColor = budgetPct >= 100 ? "#ef4444" : budgetPct >= 75 ? "#f97316" : "#4ade80";

  // ── CRUD handlers ────────────────────────────────────────────────────────

  async function handleSave(payload) {
    setSaving(true);
    setFormError(null);
    try {
      if (editTarget) {
        const updated = await apiFetch(`${API}/${editTarget.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        setSubs((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      } else {
        await apiFetch(API, { method: "POST", body: JSON.stringify(payload) });
        if (page !== 1) setPage(1);
        else await fetchSubs();
      }
      setShowForm(false);
      setEditTarget(null);
    } catch (err) {
      setFormError(
        err.body?.description?.errors?.join(", ") ?? err.body?.error ?? err.message
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    try {
      await apiFetch(`${API}/${id}`, { method: "DELETE" });
      setSubs((prev) => prev.filter((s) => s.id !== id));
      setMeta((m) => ({ ...m, total: m.total - 1 }));
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  }

  function handleEdit(sub) {
    setEditTarget(sub);
    setShowForm(true);
    setFormError(null);
  }

  function handleAddNew() {
    setEditTarget(null);
    setShowForm(true);
    setFormError(null);
  }

  function handleCancel() {
    setShowForm(false);
    setEditTarget(null);
    setFormError(null);
  }

  /* TODO: PHASE 3 - implement /api/subscriptions/export
  async function handleExport() {
    const token = localStorage.getItem("hd_token");
    const res = await fetch(`${API}/export`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) { alert("Export failed"); return; }
    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = res.headers.get("Content-Disposition")?.match(/filename="(.+)"/)?.[1] ?? "subscriptions.csv";
    a.click();
    URL.revokeObjectURL(url);
  }
  */

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="subscriptions-page">

      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">My Subscriptions</h1>
          <p className="page-subtitle">
            {meta.total} subscription{meta.total !== 1 ? "s" : ""} tracked
          </p>
        </div>
        <div className="header-actions">
          {/* TODO: PHASE 3 - implement /api/subscriptions/export
          <button className="btn btn-ghost" onClick={handleExport}>
            ↓ Export CSV
          </button>
          */}
          <button className="btn btn-primary" onClick={handleAddNew}>
            + Add Subscription
          </button>
        </div>
      </div>

      {/* ── Budget bar ── */}
      {budgetKes > 0 && (
        <div className="budget-card">
          <div className="budget-row">
            <span className="budget-label">Monthly budget</span>
            <span className="budget-amounts">
              <strong style={{ color: budgetColor }}>
                KES {Math.round(totalMonthlyKes).toLocaleString()}
              </strong>
              {" / "}
              KES {budgetKes.toLocaleString()}
            </span>
          </div>
          <div className="budget-track">
            <div
              className="budget-fill"
              style={{ width: `${budgetPct}%`, background: budgetColor }}
            />
          </div>
          {budgetPct >= 100 && (
            <p className="budget-warning">⚠ Over budget this month</p>
          )}
        </div>
      )}

      {/* ── Category breakdown ── */}
      {Object.keys(categoryTotals).length > 0 && (
        <div className="category-chips">
          {Object.entries(categoryTotals).map(([cat, kes]) => (
            <button
              key={cat}
              className={`category-chip ${filter === cat ? "active" : ""}`}
              style={{ "--chip-color": CATEGORY_COLORS[cat] }}
              onClick={() => setFilter(filter === cat ? "" : cat)}
            >
              <span className="chip-dot" />
              {CATEGORY_LABELS[cat]}
              <span className="chip-amount">
                KES {Math.round(kes).toLocaleString()}
              </span>
            </button>
          ))}
          {filter && (
            <button className="chip-clear" onClick={() => setFilter("")}>
              ✕ Clear filter
            </button>
          )}
        </div>
      )}

      {/* ── Form (add / edit) ── */}
      {showForm && (
        <SubscriptionForm
          initial={editTarget}
          onSave={handleSave}
          onCancel={handleCancel}
          saving={saving}
          error={formError}
          budgetWarning={
            !editTarget && budgetKes > 0 && totalMonthlyKes >= budgetKes
              ? `Adding this will exceed your KES ${budgetKes.toLocaleString()} budget.`
              : null
          }
        />
      )}

      {/* ── List ── */}
      {listError ? (
        <p className="error-message">{listError}</p>
      ) : (
        <SubscriptionList
          subscriptions={subs}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {/* ── Pagination ── */}
      {meta.pages > 1 && (
        <div className="pagination">
          <button
            className="btn btn-ghost"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            ← Prev
          </button>
          <span className="page-indicator">
            {page} / {meta.pages}
          </span>
          <button
            className="btn btn-ghost"
            disabled={page >= meta.pages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
