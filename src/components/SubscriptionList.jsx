const CYCLE_MULTIPLIER = {
  monthly: 1,
  yearly: 1 / 12,
  weekly: 52 / 12,
};

const CYCLE_LABEL = {
  monthly: "/mo",
  yearly: "/yr",
  weekly: "/wk",
};


export default function SubscriptionList({ subscriptions = [], rate, onDelete }) {
  if (subscriptions.length === 0) {
    return (
      <div className="hd-empty">
        <div className="hd-empty-title">No subscriptions yet</div>
        <div className="hd-empty-sub">Add your first one above and see how much it really costs in KES.</div>
        <style>{emptyStyles}</style>
      </div>
    );
  }

  const handleDelete = (sub) => {
    const confirmed = window.confirm(
      `Remove "${sub.name}" (${CYCLE_LABEL[sub.cycle] === "/mo" ? "monthly" : sub.cycle}) from your tracker?`
    );
    if (confirmed) onDelete(sub.id);
  };

  return (
    <div className="hd-list">
      {subscriptions.map((sub, i) => {
        const monthlyUSD = sub.amount * CYCLE_MULTIPLIER[sub.cycle];
        const monthlyKES = rate ? monthlyUSD * rate : null;

        return (
          <div
            key={sub.id}
            className="hd-list-item"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            {/* Left: info */}
            <div className="hd-item-left">
              <div>
                <div className="hd-item-name">{sub.name}</div>
                <div className="hd-item-meta">
                  ${sub.amount.toFixed(2)}{CYCLE_LABEL[sub.cycle]}
                  <span className="hd-cycle-badge">{sub.cycle}</span>
                </div>
              </div>
            </div>

            {/* Right: KES + delete */}
            <div className="hd-item-right">
              <div className="hd-item-kes">
                {monthlyKES !== null ? (
                  <>
                    <span className="hd-kes-value">KES {Math.round(monthlyKES).toLocaleString()}</span>
                    <span className="hd-kes-label">/month</span>
                  </>
                ) : (
                  <span className="hd-kes-loading">—</span>
                )}
              </div>
              <button
                className="hd-delete-btn"
                onClick={() => handleDelete(sub)}
                title={`Remove ${sub.name}`}
                aria-label={`Delete ${sub.name}`}
              >
                ✕
              </button>
            </div>
          </div>
        );
      })}

      <style>{listStyles}</style>
    </div>
  );
}

const emptyStyles = `
  .hd-empty {
    text-align: center;
    padding: 52px 24px;
    background: #fffdf7;
    border: 2px dashed #e0d0b0;
    border-radius: 20px;
    color: #b09a6e;
  }
  .hd-empty-title {
    font-family: 'Playfair Display', serif;
    font-size: 20px;
    font-weight: 700;
    color: #5c4a2a;
    margin-bottom: 8px;
  }
  .hd-empty-sub {
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    max-width: 320px;
    margin: 0 auto;
    color: #8a7355;
    line-height: 1.6;
  }
`;

const listStyles = `
  .hd-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  @keyframes hd-slide-in {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .hd-list-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #fffdf7;
    border: 2px solid #f0e9d6;
    border-radius: 14px;
    padding: 14px 18px;
    transition: border-color 0.18s, box-shadow 0.18s, transform 0.15s;
    animation: hd-slide-in 0.35s ease both;
    box-shadow: 2px 2px 0 #f0e9d6;
  }
  .hd-list-item:hover {
    border-color: #d4a843;
    box-shadow: 3px 3px 0 #e8d9b8;
    transform: translateY(-1px);
  }
  .hd-item-left {
    display: flex;
    align-items: center;
    gap: 14px;
    min-width: 0;
  }
  .hd-item-name {
    font-family: 'DM Sans', sans-serif;
    font-size: 15px;
    font-weight: 700;
    color: #3a2e1f;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 180px;
  }
  .hd-item-meta {
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    color: #8a7355;
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 2px;
  }
  .hd-cycle-badge {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    background: #fff0cc;
    color: #7a5c28;
    border-radius: 20px;
    padding: 2px 8px;
    border: 1px solid #e8d9b8;
  }
  .hd-item-right {
    display: flex;
    align-items: center;
    gap: 14px;
    flex-shrink: 0;
  }
  .hd-item-kes {
    text-align: right;
  }
  .hd-kes-value {
    display: block;
    font-family: 'DM Sans', sans-serif;
    font-size: 16px;
    font-weight: 800;
    color: #3a2e1f;
  }
  .hd-kes-label {
    font-family: 'DM Sans', sans-serif;
    font-size: 11px;
    color: #b09a6e;
  }
  .hd-kes-loading {
    font-size: 18px;
    color: #d4c8a8;
  }
  .hd-delete-btn {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    border: 1.5px solid #f0e0d0;
    background: #fff5f0;
    color: #c0392b;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s, transform 0.1s;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .hd-delete-btn:hover {
    background: #c0392b;
    border-color: #c0392b;
    color: #fff;
    transform: scale(1.1);
  }
  @media (max-width: 480px) {
    .hd-item-name { max-width: 110px; }
    .hd-kes-value { font-size: 14px; }
    .hd-list-item { padding: 12px 13px; }
  }
`;