import { useState, useEffect, useCallback, useRef } from "react";
import SubscriptionForm from "../components/SubscriptionForm";
import SubscriptionList from "../components/SubscriptionList";
import useRates from "../hooks/useRates";
import "../subscriptions.css";
import { useAuth } from "../contexts/AuthContext";

// ─── API helpers ────────────────────────────────────────────────────────────

const API_URL = import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? "https://hustledesk-api-9qwl.onrender.com/api" : "http://localhost:5000/api");
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

  // search / filter / sort state
  const [searchInput, setSearchInput] = useState("");   // raw input (instant)
  const [search, setSearch]           = useState("");   // debounced value sent to API
  const [currency, setCurrency]       = useState("");   // e.g. "USD"
  const [cycle, setCycle]             = useState("");   // e.g. "monthly"
  const [sortBy, setSortBy]           = useState("date");  // name | amount | date
  const [sortDir, setSortDir]         = useState("desc");  // asc | desc
  const debounceRef                   = useRef(null);

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
      if (filter)   params.set("category",      filter);
      if (search)   params.set("q",             search);
      if (currency) params.set("currency",      currency);
      if (cycle)    params.set("billing_cycle", cycle);
      params.set("sort_by",  sortBy);
      params.set("sort_dir", sortDir);
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
  }, [page, filter, search, currency, cycle, sortBy, sortDir]);

  useEffect(() => {
    fetchSubs();
  }, [fetchSubs]);

  // ── Search debounce ──────────────────────────────────────────────────────

  function handleSearchChange(e) {
    const val = e.target.value;
    setSearchInput(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(val);
      setPage(1);
    }, 300);
  }

  function clearSearch() {
    setSearchInput("");
    setSearch("");
    setPage(1);
  }

  // ── Filter setters (always reset to page 1) ──────────────────────────────

  function handleCurrencyChange(e) {
    setCurrency(e.target.value);
    setPage(1);
  }

  function handleCycleChange(e) {
    setCycle(e.target.value);
    setPage(1);
  }

  // ── Sort toggle ──────────────────────────────────────────────────────────

  function handleSort(field) {
    if (sortBy === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortDir("asc");
    }
    setPage(1);
  }

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
    <>
      <style>{`
        .subs-toolbar {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          align-items: center;
          margin-bottom: 16px;
        }
        .subs-search-wrap {
          position: relative;
          flex: 1;
          min-width: 180px;
          max-width: 280px;
        }
        .subs-search-icon {
          position: absolute;
          left: 10px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted, #9ca3af);
          pointer-events: none;
          display: flex;
        }
        .subs-search-input {
          width: 100%;
          height: 34px;
          padding: 0 28px 0 32px;
          border-radius: 8px;
          border: 1px solid var(--border, #e5e7eb);
          background: var(--input-bg, #fff);
          color: var(--text, #111827);
          font-family: inherit;
          font-size: 13.5px;
          outline: none;
          transition: border-color 150ms;
        }
        .subs-search-input::placeholder { color: var(--text-muted, #9ca3af); }
        .subs-search-input:focus { border-color: var(--accent, #4f6ef7); }
        .subs-search-clear {
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: var(--text-muted, #9ca3af);
          cursor: pointer;
          padding: 2px;
          display: flex;
          align-items: center;
          border-radius: 4px;
          transition: color 150ms;
        }
        .subs-search-clear:hover { color: var(--text, #111827); }
        .subs-select {
          height: 34px;
          padding: 0 28px 0 10px;
          border-radius: 8px;
          border: 1px solid var(--border, #e5e7eb);
          background: var(--input-bg, #fff);
          color: var(--text, #111827);
          font-family: inherit;
          font-size: 13px;
          outline: none;
          cursor: pointer;
          appearance: none;
          -webkit-appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 8px center;
          transition: border-color 150ms;
          min-width: 130px;
        }
        .subs-select:focus { border-color: var(--accent, #4f6ef7); }
        .subs-select option { background: var(--input-bg, #fff); }
        .subs-sort-group {
          display: flex;
          gap: 2px;
          border: 1px solid var(--border, #e5e7eb);
          border-radius: 8px;
          padding: 3px;
          background: var(--input-bg, #fff);
          margin-left: auto;
        }
        .subs-sort-btn {
          height: 26px;
          padding: 0 10px;
          border-radius: 5px;
          border: none;
          background: transparent;
          color: var(--text-muted, #6b7280);
          font-family: inherit;
          font-size: 12.5px;
          font-weight: 500;
          cursor: pointer;
          white-space: nowrap;
          transition: background 150ms, color 150ms;
        }
        .subs-sort-btn:hover { color: var(--text, #111827); }
        .subs-sort-btn.subs-sort-active {
          background: var(--accent-soft, #eff2fe);
          color: var(--accent, #4f6ef7);
        }
      `}</style>
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

      {/* ── Search / filter / sort toolbar ── */}
      <div className="subs-toolbar">
        <div className="subs-search-wrap">
          <span className="subs-search-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          </span>
          <input
            className="subs-search-input"
            type="text"
            placeholder="Search by name…"
            value={searchInput}
            onChange={handleSearchChange}
            aria-label="Search subscriptions by name"
          />
          {searchInput && (
            <button className="subs-search-clear" onClick={clearSearch} aria-label="Clear search">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          )}
        </div>

        <select
          className="subs-select"
          value={currency}
          onChange={handleCurrencyChange}
          aria-label="Filter by currency"
        >
          <option value="">All currencies</option>
          {["USD","EUR","GBP","KES","UGX","TZS"].map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <select
          className="subs-select"
          value={cycle}
          onChange={handleCycleChange}
          aria-label="Filter by billing cycle"
        >
          <option value="">All cycles</option>
          {["monthly","annual","weekly","daily"].map((c) => (
            <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
          ))}
        </select>

        <div className="subs-sort-group" role="group" aria-label="Sort by">
          {[
            { key: "name",   label: "Name"   },
            { key: "amount", label: "Amount" },
            { key: "date",   label: "Date"   },
          ].map(({ key, label }) => (
            <button
              key={key}
              className={`subs-sort-btn${sortBy === key ? " subs-sort-active" : ""}`}
              onClick={() => handleSort(key)}
              aria-pressed={sortBy === key}
            >
              {label}
              {sortBy === key ? (sortDir === "asc" ? " ↑" : " ↓") : ""}
            </button>
          ))}
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
    </>
  );
}