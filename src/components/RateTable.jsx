export default function RateTable({ rates }) {
  return (
    <table border="1" cellPadding="10">
      <thead>
        <tr>
          <th>Currency</th>
          <th>Rate</th>
        </tr>
      </thead>

      <tbody>
        {Object.entries(rates).map(([currency, value]) => (
          <tr key={currency}>
            <td>{currency}</td>
            <td>{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}