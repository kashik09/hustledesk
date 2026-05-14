export default function CurrencyCard({ label, value }) {
  return (
    <div style={{
      border: "1px solid #ccc",
      padding: "10px",
      margin: "5px"
    }}>
      <h3>{label}</h3>
      <p>{value}</p>
    </div>
  );
}