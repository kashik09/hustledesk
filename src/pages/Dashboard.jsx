import useRates from "../hooks/useRates";
import { formatCurrency } from "../utils/format";

export default function Dashboard() {
  const { data, loading, error } = useRates();

  if (loading) {
    return <p className="p-6">Loading rates...</p>;
  }

  if (error) {
    return <p className="p-6 text-red-500">Error: {error}</p>;
  }

  const rate = data?.rates?.KES;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">HustleDesk</h1>

      <div className="bg-orange-100 p-4 rounded-xl">
        <p className="text-gray-600">USD → KES Live Rate</p>
        <p className="text-3xl font-bold">
          {formatCurrency(rate, "KES")}
        </p>
      </div>
    </div>
  );
}