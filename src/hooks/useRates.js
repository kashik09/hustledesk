import { useEffect, useState } from "react";

/**
 * useRates
 * Fetches live USD → KES exchange rate
 * Returns: { data, loading, error }
 */

export default function useRates() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRates = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(
          "https://open.er-api.com/v6/latest/USD"
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

    fetchRates();
  }, []);

  return { data, loading, error };
}