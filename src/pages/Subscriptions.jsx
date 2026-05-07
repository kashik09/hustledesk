import { useState, useEffect } from "react";
import SubscriptionForm from "../components/SubscriptionForm";
import SubscriptionList from "../components/SubscriptionList";

// ─── Hooks (provided by Person 2) ────────────────────────────────────────────
// import { useSubscriptions } from "../hooks/useSubscriptions";
// import { useRates } from "../hooks/useRates";
// import { formatCurrency } from "../utils/formatCurrency";
//
// For standalone dev / demo, we shim them below.
// Remove the shims and uncomment the imports once Person 2's hooks are merged.
// ─────────────────────────────────────────────────────────────────────────────

/* ── SHIM: useSubscriptions ─────────────────────────────────────────── */
function useSubscriptions() {
  const STORAGE_KEY = "hd_subscriptions";
  const load = () => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  };
  const [subs, setSubs] = useState(load);

  const addSubscription = (sub) => {
    const next = [...subs, { ...sub, id: crypto.randomUUID() }];
    setSubs(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const deleteSubscription = (id) => {
    const next = subs.filter((s) => s.id !== id);
    setSubs(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  return { subscriptions: subs, addSubscription, deleteSubscription };
}

/* ── SHIM: useRates ─────────────────────────────────────────────────── */
function useRates() {
  const [rate, setRate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("https://api.frankfurter.app/latest?from=USD&to=KES")
      .then((r) => r.json())
      .then((d) => {
        setRate(d.rates.KES);
        setLoading(false);
      })
      .catch(() => {
        setError("Could not fetch live rate.");
        setLoading(false);
      });
  }, []);

  return { rate, loading, error };
}

/* ── SHIM: formatCurrency ───────────────────────────────────────────── */
function formatCurrency(amount, currency = "KES") {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

// ─────────────────────────────────────────────────────────────────────────────
// Billing cycle → monthly equivalent multiplier
// ─────────────────────────────────────────────────────────────────────────────
const CYCLE_MULTIPLIER = {
  monthly: 1,
  yearly: 1 / 12,
  weekly: 52 / 12,
};

// ─────────────────────────────────────────────────────────────────────────────
export default function Subscriptions() {
  const { subscriptions, addSubscription, deleteSubscription } = useSubscriptions();
  const { rate, loading: rateLoading, error: rateError } = useRates();

  // "What-if" input state
  const [whatIfRate, setWhatIfRate] = useState("");

  // Total monthly USD
  const totalMonthlyUSD = subscriptions.reduce(
    (acc, s) => acc + s.amount * (CYCLE_MULTIPLIER[s.cycle] ?? 1),
    0
  );
  const totalMonthlyKES = rate ? totalMonthlyUSD * rate : null;

  // What-if KES total
  const parsedWhatIf = parseFloat(whatIfRate);
  const whatIfKES =
    !isNaN(parsedWhatIf) && parsedWhatIf > 0
      ? totalMonthlyUSD * parsedWhatIf
      : null;

  // Change vs current rate
  const whatIfDiff =
    whatIfKES !== null && totalMonthlyKES !== null
      ? whatIfKES - totalMonthlyKES
      : null;

  return (
    <div className="hd-page">
      {/* ── Header ── */}
      <header className="hd-header">
        <div className="hd-header-inner">
          <div>
            <div className="hd-eyebrow">HustleDesk</div>
            <h1 className="hd-title">Subscription Tracker</h1>
            <p className="hd-subtitle">
              See exactly how much your dollar-priced tools cost in real Kenyan shillings.
            </p>
          </div>
          <div className="hd-rate-badge">
            {rateLoading ? (
              <span className="hd-rate-loading">Fetching rate…</span>
            ) : rateError ? (
              <span className="hd-rate-err" title={rateError}>⚡ Rate unavailable</span>
            ) : (
              <>
                <span className="hd-rate-label">Live rate</span>
                <span className="hd-rate-value">1 USD = KES {rate?.toFixed(2)}</span>
                <span className="hd-rate-source">Frankfurter API · live</span>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="hd-main">
        {/* ── Add form ── */}
        <section className="hd-section">
          <h2 className="hd-section-title">Add a subscription</h2>
          <SubscriptionForm onAdd={addSubscription} />
        </section>

        {/* ── List ── */}
        <section className="hd-section">
          <h2 className="hd-section-title">
            Your subscriptions
            {subscriptions.length > 0 && (
              <span className="hd-count-badge">{subscriptions.length}</span>
            )}
          </h2>

          {rateLoading && subscriptions.length > 0 && (
            <div className="hd-inline-notice">
              <span className="hd-spinner" /> Fetching live KES rate…
            </div>
          )}
          {rateError && subscriptions.length > 0 && (
            <div className="hd-inline-notice hd-inline-notice--warn">
              ⚠ {rateError} — KES values will show once rate loads.
            </div>
          )}

          <SubscriptionList
            subscriptions={subscriptions}
            rate={rate}
            onDelete={deleteSubscription}
          />
        </section>

        {/* ── Total bleed ── */}
        {subscriptions.length > 0 && (
          <section className="hd-section">
            <div className="hd-bleed-card">
              <div className="hd-bleed-left">
                <div className="hd-bleed-label">Monthly subscription spend</div>
                <div className="hd-bleed-usd">${totalMonthlyUSD.toFixed(2)} / month</div>
              </div>
              <div className="hd-bleed-right">
                {totalMonthlyKES !== null ? (
                  <>
                    <div className="hd-bleed-kes">
                      {formatCurrency(totalMonthlyKES)}
                    </div>
                    <div className="hd-bleed-caption">
                      You're spending <strong>~{formatCurrency(Math.round(totalMonthlyKES))}/month</strong> on subscriptions
                    </div>
                  </>
                ) : (
                  <div className="hd-bleed-kes hd-bleed-kes--loading">
                    {rateLoading ? "Calculating…" : "—"}
                  </div>
                )}
              </div>
            </div>

            {/* ── What-if rate ── */}
            <div className="hd-whatif-card">
              <div className="hd-whatif-header">
                <div>
                  <div className="hd-whatif-title">What if the rate changes?</div>
                  <div className="hd-whatif-desc">
                    Enter a hypothetical USD/KES rate to see how your monthly total shifts.
                  </div>
                </div>
              </div>

              <div className="hd-whatif-row">
                <div className="hd-whatif-input-wrap">
                  <span className="hd-whatif-prefix">1 USD =</span>
                  <input
                    type="number"
                    min="1"
                    step="0.5"
                    className="hd-whatif-input"
                    placeholder={rate ? rate.toFixed(0) : "135"}
                    value={whatIfRate}
                    onChange={(e) => setWhatIfRate(e.target.value)}
                  />
                  <span className="hd-whatif-suffix">KES</span>
                </div>

                {whatIfKES !== null && (
                  <div className={`hd-whatif-result${whatIfDiff > 0 ? " hd-whatif-result--worse" : " hd-whatif-result--better"}`}>
                    <span className="hd-whatif-result-val">
                      {formatCurrency(Math.round(whatIfKES))}/mo
                    </span>
                    {whatIfDiff !== null && (
                      <span className="hd-whatif-delta">
                        {whatIfDiff > 0
                          ? `▲ +${formatCurrency(Math.round(whatIfDiff))} more`
                          : `▼ ${formatCurrency(Math.round(Math.abs(whatIfDiff)))} less`}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {whatIfKES !== null && (
                <p className="hd-whatif-verdict">
                  {whatIfDiff > 0
                    ? `If USD/KES hits ${parsedWhatIf.toFixed(0)}, you'd pay ${formatCurrency(Math.round(whatIfKES))} instead — that's ${formatCurrency(Math.round(whatIfDiff))} more every month.`
                    : `At ${parsedWhatIf.toFixed(0)} KES per dollar, you'd save ${formatCurrency(Math.round(Math.abs(whatIfDiff)))} per month compared to the current rate.`}
                </p>
              )}
            </div>
          </section>
        )}
      </main>

      <style>{pageStyles}</style>
    </div>
  );
}

const pageStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700;800&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .hd-page {
    min-height: 100vh;
    background: #fdf8f0;
    font-family: 'DM Sans', sans-serif;
  }

  /* ── HEADER ── */
  .hd-header {
    background: linear-gradient(135deg, #3a2e1f 0%, #5c4a2a 100%);
    padding: 36px 24px 32px;
    position: relative;
    overflow: hidden;
  }
  .hd-header::before {
    content: '';
    position: absolute;
    top: -60px; right: -60px;
    width: 260px; height: 260px;
    background: radial-gradient(circle, rgba(212,168,67,0.18) 0%, transparent 70%);
    border-radius: 50%;
  }
  .hd-header-inner {
    max-width: 860px;
    margin: 0 auto;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 20px;
    flex-wrap: wrap;
  }
  .hd-eyebrow {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: #d4a843;
    margin-bottom: 6px;
  }
  .hd-title {
    font-family: 'Playfair Display', serif;
    font-size: clamp(26px, 5vw, 38px);
    font-weight: 900;
    color: #fff;
    line-height: 1.1;
    margin-bottom: 8px;
  }
  .hd-subtitle {
    font-size: 14px;
    color: rgba(255,255,255,0.65);
    max-width: 380px;
    line-height: 1.6;
  }
  .hd-rate-badge {
    background: rgba(255,255,255,0.1);
    border: 1.5px solid rgba(212,168,67,0.35);
    border-radius: 14px;
    padding: 14px 18px;
    text-align: right;
    flex-shrink: 0;
  }
  .hd-rate-label {
    display: block;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #d4a843;
    margin-bottom: 4px;
  }
  .hd-rate-value {
    display: block;
    font-size: 17px;
    font-weight: 800;
    color: #fff;
  }
  .hd-rate-source {
    display: block;
    font-size: 10px;
    color: rgba(255,255,255,0.4);
    margin-top: 3px;
  }
  .hd-rate-loading, .hd-rate-err {
    font-size: 13px;
    color: rgba(255,255,255,0.5);
  }

  /* ── MAIN ── */
  .hd-main {
    max-width: 860px;
    margin: 0 auto;
    padding: 32px 20px 64px;
    display: flex;
    flex-direction: column;
    gap: 36px;
  }
  .hd-section-title {
    font-family: 'Playfair Display', serif;
    font-size: 20px;
    font-weight: 700;
    color: #3a2e1f;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .hd-count-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: #d4a843;
    color: #fff;
    font-family: 'DM Sans', sans-serif;
    font-size: 12px;
    font-weight: 800;
    width: 26px;
    height: 26px;
    border-radius: 50%;
  }

  /* ── INLINE NOTICE ── */
  .hd-inline-notice {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 13px;
    color: #8a7355;
    background: #fff7e6;
    border: 1.5px solid #e8d9b8;
    border-radius: 10px;
    padding: 10px 14px;
    margin-bottom: 14px;
  }
  .hd-inline-notice--warn {
    background: #fff5e6;
    border-color: #f5d6a0;
    color: #7a4f10;
  }
  @keyframes hd-spin { to { transform: rotate(360deg); } }
  .hd-spinner {
    display: inline-block;
    width: 14px; height: 14px;
    border: 2px solid #e8d9b8;
    border-top-color: #d4a843;
    border-radius: 50%;
    animation: hd-spin 0.7s linear infinite;
    flex-shrink: 0;
  }

  /* ── BLEED CARD ── */
  .hd-bleed-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: linear-gradient(135deg, #3a2e1f 0%, #5c4a2a 100%);
    border-radius: 20px;
    padding: 26px 28px;
    gap: 20px;
    flex-wrap: wrap;
    margin-bottom: 16px;
    box-shadow: 5px 5px 0 #c8a852;
  }
  .hd-bleed-left {
    flex-shrink: 0;
  }
  .hd-bleed-label {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #d4a843;
    margin-bottom: 6px;
  }
  .hd-bleed-usd {
    font-size: 18px;
    font-weight: 800;
    color: rgba(255,255,255,0.7);
  }
  .hd-bleed-right {
    text-align: right;
  }
  .hd-bleed-kes {
    font-family: 'Playfair Display', serif;
    font-size: clamp(28px, 6vw, 40px);
    font-weight: 900;
    color: #fff;
    line-height: 1;
    margin-bottom: 6px;
  }
  .hd-bleed-kes--loading {
    color: rgba(255,255,255,0.3);
    font-size: 32px;
  }
  .hd-bleed-caption {
    font-size: 12.5px;
    color: rgba(255,255,255,0.55);
    line-height: 1.5;
  }
  .hd-bleed-caption strong {
    color: rgba(255,255,255,0.85);
  }

  /* ── WHAT-IF CARD ── */
  .hd-whatif-card {
    background: #fffdf7;
    border: 2px solid #f0e9d6;
    border-radius: 20px;
    padding: 22px 24px;
    box-shadow: 3px 3px 0 #f0e9d6;
  }
  .hd-whatif-header {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    margin-bottom: 18px;
  }
  .hd-whatif-title {
    font-family: 'Playfair Display', serif;
    font-size: 17px;
    font-weight: 700;
    color: #3a2e1f;
    margin-bottom: 4px;
  }
  .hd-whatif-desc {
    font-size: 13px;
    color: #8a7355;
    line-height: 1.5;
  }
  .hd-whatif-row {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
  }
  .hd-whatif-input-wrap {
    display: flex;
    align-items: center;
    gap: 10px;
    background: #fff;
    border: 2px solid #e8d9b8;
    border-radius: 12px;
    padding: 10px 16px;
    transition: border-color 0.2s;
  }
  .hd-whatif-input-wrap:focus-within {
    border-color: #d4a843;
    box-shadow: 0 0 0 3px rgba(212,168,67,0.15);
  }
  .hd-whatif-prefix, .hd-whatif-suffix {
    font-size: 13px;
    font-weight: 600;
    color: #b09a6e;
    white-space: nowrap;
  }
  .hd-whatif-input {
    width: 90px;
    border: none;
    outline: none;
    font-family: 'DM Sans', sans-serif;
    font-size: 17px;
    font-weight: 800;
    color: #3a2e1f;
    background: transparent;
    text-align: center;
  }
  .hd-whatif-result {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  .hd-whatif-result-val {
    font-family: 'DM Sans', sans-serif;
    font-size: 20px;
    font-weight: 800;
  }
  .hd-whatif-result--worse .hd-whatif-result-val { color: #c0392b; }
  .hd-whatif-result--better .hd-whatif-result-val { color: #27ae60; }
  .hd-whatif-delta {
    font-size: 12px;
    font-weight: 700;
    border-radius: 6px;
    padding: 2px 8px;
  }
  .hd-whatif-result--worse .hd-whatif-delta {
    background: #fff0ee;
    color: #c0392b;
  }
  .hd-whatif-result--better .hd-whatif-delta {
    background: #edfbf3;
    color: #27ae60;
  }
  .hd-whatif-verdict {
    margin-top: 14px;
    font-size: 13.5px;
    color: #5c4a2a;
    background: #fff7e6;
    border-left: 3px solid #d4a843;
    padding: 10px 14px;
    border-radius: 0 10px 10px 0;
    line-height: 1.6;
  }

  @media (max-width: 540px) {
    .hd-bleed-card { padding: 20px 18px; }
    .hd-bleed-right { text-align: left; }
    .hd-whatif-input-wrap { width: 100%; }
  }
`;