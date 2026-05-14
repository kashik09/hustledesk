import { useState } from "react";
import SubscriptionAutocomplete from "./SubscriptionAutocomplete";

const PRESET_SUBS = [
  { name: "Netflix", amount: 15.49 },
  { name: "ChatGPT Plus", amount: 20 },
  { name: "Spotify", amount: 9.99 },
  { name: "Adobe CC", amount: 54.99 },
  { name: "GitHub Pro", amount: 4 },
  { name: "Canva Pro", amount: 12.99 },
];

export default function SubscriptionForm({ onAdd }) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [cycle, setCycle] = useState("monthly");
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const [success, setSuccess] = useState(false);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Give your subscription a name.");
      triggerShake();
      return;
    }
    const parsed = parseFloat(amount);
    if (!amount || isNaN(parsed) || parsed <= 0) {
      setError("Enter a valid USD amount greater than 0.");
      triggerShake();
      return;
    }

    onAdd({ name: name.trim(), amount: parsed, cycle });
    setName("");
    setAmount("");
    setCycle("monthly");
    setSuccess(true);
    setTimeout(() => setSuccess(false), 1800);
  };

  const fillPreset = (preset) => {
    setName(preset.name);
    setAmount(String(preset.amount));
    setError("");
  };

  return (
    <div className="hd-form-card">
      {/* Preset chips */}
      <div className="hd-presets-label">Quick-fill a common app</div>
      <div className="hd-presets">
        {PRESET_SUBS.map((p) => (
          <button
            key={p.name}
            type="button"
            className="hd-preset-chip"
            onClick={() => fillPreset(p)}
          >
            {p.name}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className={`hd-form-grid${shake ? " hd-shake" : ""}`}>
          {/* Name */}
          <div className="hd-field hd-field--wide">
            <label htmlFor="sub-name" className="hd-label">
              Service name
            </label>
            <input
              id="sub-name"
              type="text"
              className="hd-input"
              placeholder="e.g. Figma, Notion, Zoom…"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Amount */}
          <div className="hd-field">
            <label htmlFor="sub-amount" className="hd-label">
              Cost (USD)
            </label>
            <div className="hd-input-prefix-wrap">
              <span className="hd-input-prefix">$</span>
              <input
                id="sub-amount"
                type="number"
                step="0.01"
                min="0.01"
                className="hd-input hd-input--prefixed"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>

          {/* Billing cycle */}
          <div className="hd-field">
            <label htmlFor="sub-cycle" className="hd-label">
              Billed
            </label>
            <select
              id="sub-cycle"
              className="hd-input hd-select"
              value={cycle}
              onChange={(e) => setCycle(e.target.value)}
            >
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
        </div>

        {error && <p className="hd-form-error">⚠ {error}</p>}

        <button type="submit" className={`hd-btn-add${success ? " hd-btn-add--success" : ""}`}>
          {success ? "✓ Added!" : "+ Add Subscription"}
        </button>
      </form>

      <style>{`
        .hd-form-card {
          background: #fffdf7;
          border: 2px solid #f0e9d6;
          border-radius: 20px;
          padding: 28px 28px 22px;
          box-shadow: 4px 4px 0 #f0e9d6;
        }
        .hd-presets-label {
          font-family: 'DM Sans', sans-serif;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #b09a6e;
          margin-bottom: 10px;
        }
        .hd-presets {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 22px;
        }
        .hd-preset-chip {
          font-family: 'DM Sans', sans-serif;
          font-size: 12.5px;
          font-weight: 500;
          background: #fff7e6;
          border: 1.5px solid #e8d9b8;
          color: #7a5c28;
          border-radius: 30px;
          padding: 5px 14px;
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s, transform 0.1s;
        }
        .hd-preset-chip:hover {
          background: #ffefc2;
          border-color: #d4a843;
          transform: translateY(-1px);
        }
        .hd-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 14px;
          margin-bottom: 14px;
        }
        @media (max-width: 640px) {
          .hd-form-grid {
            grid-template-columns: 1fr;
          }
        }
        .hd-field--wide {
          grid-column: span 1;
        }
        @media (min-width: 641px) {
          .hd-field--wide {
            grid-column: 1 / -1;
          }
          .hd-form-grid {
            grid-template-columns: 2fr 1fr 1fr;
          }
          .hd-field--wide {
            grid-column: auto;
          }
        }
        .hd-label {
          display: block;
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.05em;
          color: #8a7355;
          margin-bottom: 6px;
          text-transform: uppercase;
        }
        .hd-input {
          width: 100%;
          box-sizing: border-box;
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          background: #fff;
          border: 2px solid #e8d9b8;
          border-radius: 10px;
          padding: 10px 14px;
          color: #3a2e1f;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .hd-input:focus {
          border-color: #d4a843;
          box-shadow: 0 0 0 3px rgba(212,168,67,0.15);
        }
        .hd-input-prefix-wrap {
          position: relative;
        }
        .hd-input-prefix {
          position: absolute;
          left: 13px;
          top: 50%;
          transform: translateY(-50%);
          font-family: 'DM Sans', sans-serif;
          font-weight: 700;
          font-size: 14px;
          color: #b09a6e;
          pointer-events: none;
        }
        .hd-input--prefixed {
          padding-left: 26px;
        }
        .hd-select {
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23b09a6e' stroke-width='2' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
          padding-right: 32px;
          cursor: pointer;
        }
        .hd-form-error {
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          color: #c0392b;
          background: #fff5f5;
          border: 1.5px solid #f5c6c2;
          border-radius: 8px;
          padding: 8px 14px;
          margin-bottom: 14px;
        }
        .hd-btn-add {
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          font-weight: 700;
          background: #d4a843;
          color: #fff;
          border: none;
          border-radius: 12px;
          padding: 13px 28px;
          cursor: pointer;
          transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
          box-shadow: 3px 3px 0 #b8892a;
          letter-spacing: 0.02em;
        }
        .hd-btn-add:hover {
          background: #c49a38;
          transform: translateY(-2px);
          box-shadow: 4px 5px 0 #9a7320;
        }
        .hd-btn-add:active {
          transform: translateY(0);
          box-shadow: 1px 1px 0 #9a7320;
        }
        .hd-btn-add--success {
          background: #27ae60 !important;
          box-shadow: 3px 3px 0 #1e8449 !important;
        }
        @keyframes hd-shake-anim {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
        .hd-shake {
          animation: hd-shake-anim 0.45s ease;
        }
      `}</style>
    </div>
  );
}
