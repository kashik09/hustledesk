import { Link } from "react-router-dom";
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

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <RateCard rate={rate} loading={loading} error={error} />
        {loading ? (
          <LoadingSkeleton />
        ) : (
          <PurchasingPowerCard rate={rate || 129} />
        )}
      </div>

      {/* Quick links */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Link
          to="/subscriptions"
          className="bg-white border border-stone-200 rounded-xl p-5 hover:border-amber-400 hover:shadow-md transition-all"
        >
          <h3 className="font-semibold text-stone-800">Subscription Tracker</h3>
          <p className="text-stone-500 text-sm mt-1">
            See how much your USD subscriptions cost in KES
          </p>
        </Link>
        <Link
          to="/trends"
          className="bg-white border border-stone-200 rounded-xl p-5 hover:border-amber-400 hover:shadow-md transition-all"
        >
          <h3 className="font-semibold text-stone-800">30-Day Trends</h3>
          <p className="text-stone-500 text-sm mt-1">
            Check if now is a good time to convert
          </p>
        </Link>
      </div>
    </main>
  );
}
