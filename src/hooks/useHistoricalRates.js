import { useEffect, useState } from "react";

/**
 * useHistoricalRates
 * Fetches historical USD → KES rates from Frankfurter API
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

        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - days);

        const fmt = (d) => d.toISOString().split("T")[0];
        const url = `https://api.frankfurter.app/${fmt(startDate)}..${fmt(endDate)}?from=${from}&to=${to}`;

        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch historical rates");

        const json = await res.json();
        setData(json);
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
