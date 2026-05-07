import purchasingPower from "../data/purchasingPower.json";

const PurchasingPowerCard = ({ rate }) => {
  const usdAmount = 50;
  const kesValue = usdAmount * rate;

  return (
    <div className="bg-white shadow-lg rounded-2xl p-6">
      <h2 className="text-2xl font-bold text-stone-800 mb-2">
        Purchasing Power
      </h2>

      <p className="text-stone-600 mb-4">
        What does <span className="font-semibold">$50</span> feel like in
        Nairobi today?
      </p>

      <div className="bg-amber-50 rounded-xl p-4 mb-5">
        <p className="text-3xl font-bold text-amber-700">
          KES {Math.round(kesValue).toLocaleString()}
        </p>
      </div>

      <div className="space-y-3">
        {purchasingPower.map((entry, index) => (
          <div
            key={index}
            className="flex justify-between items-center border-b border-stone-100 pb-2"
          >
            <span className="text-stone-700">{entry.item}</span>

            <span className="font-semibold text-stone-900">
              ~{entry.amount}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PurchasingPowerCard;