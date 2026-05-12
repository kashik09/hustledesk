import { useEffect, useState } from "react";

/**
 * Fetch live exchange rates
 * useRates("USD""GBP" etc)
 */

export default function useRates(baseCurrency = "USD") {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRates = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(
          `https://open.er-api.com/v6/latest/${baseCurrency}`
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
  }, [baseCurrency]);

  return { data, loading, error };
}