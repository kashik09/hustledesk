import { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import useRates from "../hooks/useRates";
import RateCard from "../components/RateCard";
import PurchasingPowerCard from "../components/PurchasingPowerCard";
import LoadingSkeleton from "../components/LoadingSkeleton";
import api from "../lib/api";

export default function Dashboard() {
  const { data: rateData, loading: rateLoading, error: rateError, rates } = useRates();
  const kesRate = rateData?.rates?.KES;

  const [subscriptions, setSubscriptions] = useState([]);
  const [subsLoading, setSubsLoading] = useState(true);

  useEffect(() => {
    async function fetchSubs() {
      try {
        const data = await api.get("/subscriptions?per_page=100");
        setSubscriptions(data.items || []);
      } catch (err) {
        console.error("Failed to fetch subscriptions:", err);
        setSubscriptions([]);
      } finally {
        setSubsLoading(false);
      }
    }
    fetchSubs();
  }, []);

  const { totalKes, subCount } = useMemo(() => {
    if (!subscriptions || subscriptions.length === 0 || !rates) {
      return { totalKes: 0, subCount: 0 };
    }

    // Convert each subscription to KES based on its currency
    const kesSum = subscriptions.reduce((sum, sub) => {
      const amount = Number(sub.amount) || 0;
      const currency = sub.currency || "USD";

      if (currency === "KES") {
        return sum + amount;
      }

      // Convert to KES: amount * (KES rate / currency rate)
      const currencyRate = rates[currency] || 1;
      const amountInKes = amount * (kesRate / currencyRate);
      return sum + amountInKes;
    }, 0);

    return { totalKes: kesSum, subCount: subscriptions.length };
  }, [subscriptions, rates, kesRate]);

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-stone-800">Dashboard</h1>
        <p className="text-stone-500 mt-1">
          Track USD/KES rates and see what your money is worth
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <RateCard rate={kesRate} loading={rateLoading} error={rateError} />
        {rateLoading ? (
          <LoadingSkeleton />
        ) : (
          <PurchasingPowerCard rate={kesRate || 0} />
        )}
      </div>

      <div className="bg-white border border-stone-200 rounded-2xl p-6 mb-8 shadow-sm">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-bold text-stone-800">Monthly Subs Overview</h2>
          <Link to="/subscriptions" className="text-sm font-medium text-amber-600 hover:text-amber-700">
            Manage &rarr;
          </Link>
        </div>

        {subsLoading || rateLoading ? (
          <LoadingSkeleton lines={2} />
        ) : subCount > 0 ? (
          <div className="flex flex-col sm:flex-row gap-6 sm:gap-12 items-start sm:items-center">
            <div>
              <p className="text-sm text-stone-500 uppercase tracking-wide mb-1">Monthly Total</p>
              <p className="text-3xl font-bold text-orange-600">KES {totalKes.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            <div className="sm:ml-auto">
              <span className="inline-flex items-center justify-center px-3 py-1 bg-stone-100 text-stone-600 text-sm font-medium rounded-full border border-stone-200">
                {subCount} Active {subCount === 1 ? 'Sub' : 'Subs'}
              </span>
            </div>
          </div>
        ) : (
          <div className="py-4 text-stone-500 text-sm">
            No active subscriptions found.{" "}
            <Link to="/subscriptions" className="text-amber-600 hover:underline">
              Add your first subscription
            </Link>{" "}
            to start tracking costs.
          </div>
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Link
          to="/subscriptions"
          className="bg-white border border-stone-200 rounded-xl p-5 hover:border-amber-400 hover:shadow-md transition-all group"
        >
          <h3 className="font-semibold text-stone-800 group-hover:text-amber-600 transition-colors">
            Subscription Tracker
          </h3>
          <p className="text-stone-500 text-sm mt-1">
            See how much your USD subscriptions cost in KES
          </p>
        </Link>
        <Link
          to="/trends"
          className="bg-white border border-stone-200 rounded-xl p-5 hover:border-amber-400 hover:shadow-md transition-all group"
        >
          <h3 className="font-semibold text-stone-800 group-hover:text-amber-600 transition-colors">
            30-Day Trends
          </h3>
          <p className="text-stone-500 text-sm mt-1">
            Check if now is a good time to convert
          </p>
        </Link>
      </div>
    </main>
  );
}