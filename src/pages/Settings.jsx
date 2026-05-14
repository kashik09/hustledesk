import { useState } from "react";
import CurrencyPicker from "../components/CurrencyPicker";

export default function Settings() {
  const [homeCurrency, setHomeCurrency] = useState("USD");

  const handleSave = () => {
    // later connected to Person 2 backend (/me update)
    console.log("Saved currency:", homeCurrency);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Settings</h2>

      <div style={{ marginTop: "20px" }}>
        <h3>Home Currency</h3>

        <CurrencyPicker
          value={homeCurrency}
          onChange={setHomeCurrency}
        />

        <button onClick={handleSave} style={{ marginTop: "10px" }}>
          Save Settings
        </button>
      </div>
    </div>
  );
}