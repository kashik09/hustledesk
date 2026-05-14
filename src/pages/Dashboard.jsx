import { useEffect, useState } from "react";
import { getRates } from "../services/currency";
import { useAuth } from "../contexts/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();
  const [rates, setRates] = useState(null);

  useEffect(() => {
    const loadRates = async () => {
      const data = await getRates();
      setRates(data);
    };

    loadRates();
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h1>HustleDesk Dashboard 🚀</h1>

      {user && <p>Welcome: {user.email}</p>}

      <h2>Live Exchange Rates</h2>

      {!rates ? (
        <p>Loading rates...</p>
      ) : (
        <div>
          <p>Base: {rates.base}</p>
          <p>USD: {rates.rates?.USD}</p>
          <p>EUR: {rates.rates?.EUR}</p>
          <p>KES: {rates.rates?.KES}</p>
        </div>
      )}
    </div>
  );
}