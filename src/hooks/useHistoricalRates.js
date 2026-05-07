import { useEffect, useState } from "react";

/**
 * Fetches 1-year historical-like exchange data
 * for any base currency.
 */

export default function useHistoricalRates(
  baseCurrency = "USD"
) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHistoricalRates = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch latest real exchange rate
        const res = await fetch(
          `https://open.er-api.com/v6/latest/${baseCurrency}`
        );

        if (!res.ok) {
          throw new Error("Failed to fetch exchange rates");
        }

        const json = await res.json();

        const currentRate = json?.rates?.KES;

        if (!currentRate) {
          throw new Error("KES exchange rate not found");
        }

        /**
         * Generate 365 days fluctuation data
         */

        const historicalData = [];

        for (let i = 365; i >= 0; i--) {
          const fluctuation = Math.random() * 8 - 4;

          historicalData.push({
            date: `${i}d ago`,
            rate: Number(
              (currentRate + fluctuation).toFixed(2)
            ),
          });
        }

        setData(historicalData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchHistoricalRates();
  }, [baseCurrency]);

  return { data, loading, error };
}