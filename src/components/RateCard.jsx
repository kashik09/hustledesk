export default function RateCard({ rate, loading, error }) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-md p-6 animate-pulse">
        <div className="h-4 bg-stone-200 rounded w-1/3 mb-3"></div>
        <div className="h-10 bg-stone-200 rounded w-2/3"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
        <p className="text-red-600 font-medium">Could not load rate</p>
        <p className="text-red-500 text-sm mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-md p-6 border border-stone-100">
      <p className="text-stone-500 text-sm mb-1">USD → KES Live Rate</p>
      <p className="text-4xl font-bold text-stone-800">
        KES {rate?.toFixed(2)}
      </p>
      <p className="text-stone-400 text-xs mt-2">per 1 USD</p>
    </div>
  );
}
