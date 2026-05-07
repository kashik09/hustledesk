import { useEffect, useState } from "react";

/**
 * useHistoricalRates
 * Fetches real historical USD → KES rates from exchangerate.host
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
        const url = `https://api.exchangerate.host/timeseries?start_date=${fmt(startDate)}&end_date=${fmt(endDate)}&base=${from}&symbols=${to}`;

        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch historical rates");

        const json = await res.json();

        if (!json.success || !json.rates) {
          throw new Error("Invalid response from API");
        }

        setData({ rates: json.rates });
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
