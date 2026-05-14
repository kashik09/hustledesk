export default function CurrencyPicker({ value, onChange }) {
    const currencies = ["USD", "EUR", "GBP", "KES", "UGX", "TZS"];
  
    return (
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {currencies.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
    );
  }