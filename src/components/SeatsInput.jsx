export default function SeatsInput({ value, onChange, pricePerSeat, currency = "USD" }) {
  const total = pricePerSeat ? pricePerSeat * value : null;

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-stone-600">
        Number of seats
      </label>
      <div className="flex items-center gap-4">
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => onChange(Math.max(1, value - 1))}
            className="w-10 h-10 rounded-l-lg border border-stone-300 bg-stone-50 text-stone-600 hover:bg-stone-100 transition font-bold text-lg"
          >
            -
          </button>
          <input
            type="number"
            min="1"
            value={value}
            onChange={(e) => onChange(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-16 h-10 border-y border-stone-300 text-center font-medium text-stone-800 outline-none focus:ring-2 focus:ring-orange-400"
          />
          <button
            type="button"
            onClick={() => onChange(value + 1)}
            className="w-10 h-10 rounded-r-lg border border-stone-300 bg-stone-50 text-stone-600 hover:bg-stone-100 transition font-bold text-lg"
          >
            +
          </button>
        </div>

        {total !== null && (
          <div className="text-stone-600 text-sm">
            <span className="text-stone-400">Total:</span>{" "}
            <span className="font-semibold text-orange-600">
              {currency} {total.toFixed(2)}
            </span>
            <span className="text-stone-400 ml-1">
              ({currency} {pricePerSeat}/seat)
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
