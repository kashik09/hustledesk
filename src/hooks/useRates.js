import { useEffect, useState, useMemo } from "react";

/**
 * useRates
 * Fetches live exchange rates from Open Exchange Rates API
 * Returns: { data, rates, rate, loading, error, refetch }
 *
 * @param {string} base - Base currency (default: "USD")
 * @param {string} target - Target currency for quick access (default: "KES")
 *
 * @example
 * const { rate, loading, error } = useRates("USD", "KES");
 * // rate = 129.50 (direct KES value)
 *
 * const { rates } = useRates("USD");
 * // rates = { KES: 129.50, TZS: 2500, UGX: 3700, ... }
 */
export default function useRates(base = "USD", target = "KES") {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRates = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(
        `https://open.er-api.com/v6/latest/${base}`
      );

      if (!res.ok) {
        throw new Error("Failed to fetch rates");
      }

      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
  }, [base]);

  // All rates object
  const rates = useMemo(() => data?.rates || {}, [data]);

  // Direct access to target currency rate
  const rate = useMemo(() => data?.rates?.[target] || null, [data, target]);

  // Last updated timestamp
  const lastUpdated = useMemo(() => data?.time_last_update_utc || null, [data]);

  return {
    data,       // Full API response
    rates,      // All rates object { KES: 129.5, TZS: 2500, ... }
    rate,       // Direct target currency rate (number)
    loading,
    error,
    lastUpdated,
    refetch: fetchRates,
  };
}
