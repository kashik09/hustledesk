import { useEffect, useState } from "react";

/**
 * useHistoricalRates
 * Generates mock historical data since free APIs don't support KES history
 */
export default function useHistoricalRates(from = "USD", to = "KES", days = 30) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get current rate first
        const res = await fetch("https://open.er-api.com/v6/latest/USD");
        if (!res.ok) throw new Error("Failed to fetch rates");

        const json = await res.json();
        const currentRate = json.rates?.KES || 129;

        // Generate 30 days of mock historical data with realistic variance
        const rates = {};
        for (let i = days; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split("T")[0];
          // Add some variance (±2%)
          const variance = (Math.random() - 0.5) * 0.04 * currentRate;
          rates[dateStr] = { [to]: currentRate + variance };
        }

        setData({ rates });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [from, to, days]);

  return { data, loading, error };
}
