export default function PricingTierSelector({ tiers, selected, onSelect, currency = "USD" }) {
  if (!tiers || tiers.length === 0) return null;

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-stone-600">
        Select pricing tier
      </label>
      <div className="flex flex-wrap gap-2">
        {tiers.map((tier) => {
          const isSelected = selected?.name === tier.name;
          return (
            <button
              key={tier.name}
              type="button"
              onClick={() => onSelect(tier)}
              className={`px-4 py-2.5 rounded-lg border-2 transition-all ${
                isSelected
                  ? "border-orange-500 bg-orange-50 text-orange-700"
                  : "border-stone-200 bg-white text-stone-700 hover:border-orange-300"
              }`}
            >
              <span className="font-medium">{tier.name}</span>
              <span className="block text-sm mt-0.5">
                {currency} {tier.price || tier.amount}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
