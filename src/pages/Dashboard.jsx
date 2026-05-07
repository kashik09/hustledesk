import useRates from "../hooks/useRates";
import RateCard from "../components/RateCard";
import PurchasingPowerCard from "../components/PurchasingPowerCard";
import LoadingSkeleton from "../components/LoadingSkeleton";

export default function Dashboard() {
  const { data, loading, error } = useRates();
  const rate = data?.rates?.KES;

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-stone-800">Dashboard</h1>
        <p className="text-stone-500 mt-1">
          Track USD/KES rates and see what your money is worth
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <RateCard rate={rate} loading={loading} error={error} />
        {loading ? (
          <LoadingSkeleton />
        ) : (
          <PurchasingPowerCard rate={rate || 129} />
        )}
      </div>
    </main>
  );
}
