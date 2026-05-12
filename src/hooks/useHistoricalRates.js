import { useEffect, useState } from "react";

/**
 * useHistoricalRates
 * Provides historical rate data for trend visualization
 *
 * NOTE: Free APIs (Frankfurter, exchangerate.host) don't support KES historical data.
 * This hook generates SIMULATED historical data based on the current live rate.
 * The simulation uses seeded randomness for consistency across page loads.
 *
 * Phase 2 TODO: Replace with backend API that stores daily rate snapshots.
 *
 * @param {string} from - Base currency (default: "USD")
 * @param {string} to - Target currency (default: "KES")
 * @param {number} days - Number of days to generate (default: 30)
 *
 * Returns: { data, loading, error, isSimulated }
 *
 * @example
 * const { data, loading, isSimulated } = useHistoricalRates("USD", "KES", 30);
 * // data.rates = { "2024-01-01": { KES: 129.5 }, ... }
 * // isSimulated = true (indicates data is not from real historical API)
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

        // Fetch current live rate as baseline
        const res = await fetch(`https://open.er-api.com/v6/latest/${from}`);
        if (!res.ok) throw new Error("Failed to fetch rates");

        const json = await res.json();
        const currentRate = json.rates?.[to];

        if (!currentRate) throw new Error(`${to} rate not available`);

        // Generate simulated historical data
        // Uses seeded pseudo-random for consistency
        const rates = {};
        const baseVariance = currentRate * 0.015; // 1.5% variance range

        for (let i = days; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split("T")[0];

          // Seeded random based on date for reproducibility
          const seed = date.getDate() + date.getMonth() * 31 + date.getFullYear();
          const pseudoRandom = Math.abs(Math.sin(seed * 9999)) % 1;

          // Slight trend + daily variance
          const trendOffset = (i / days) * baseVariance * 0.3;
          const dailyVariance = (pseudoRandom - 0.5) * baseVariance * 2;

          rates[dateStr] = { [to]: currentRate - trendOffset + dailyVariance };
        }

        setData({
          rates,
          base: from,
          target: to,
          currentRate,
          generatedAt: new Date().toISOString(),
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [from, to, days]);

  return {
    data,
    loading,
    error,
    isSimulated: true, // Flag to indicate this is not real historical data
  };
}
