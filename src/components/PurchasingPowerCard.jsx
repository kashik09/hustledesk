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
        What does <span className="font-semibold">${usdAmount}</span> feel like in
        Nairobi today?
      </p>

      <div className="bg-amber-50 rounded-xl p-4 mb-5">
        <p className="text-3xl font-bold text-amber-700">
          KES {Math.round(kesValue).toLocaleString()}
        </p>
      </div>

      <div className="space-y-3">
        {purchasingPower.map((entry, index) => {
          const quantity = Math.floor(kesValue / entry.price);

          return (
            <div
              key={index}
              className="flex justify-between items-center border-b border-stone-100 pb-2"
            >
              <span className="text-stone-700">{entry.item}</span>
              <div className="text-right">
                <span className="font-semibold text-stone-900">~{quantity}</span>
                <span className="text-xs text-stone-400 ml-2">
                  @ KES {entry.price.toLocaleString()}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-stone-400 mt-4 text-center">
        Based on current rate: 1 USD = KES {rate?.toFixed(2)}
      </p>
    </div>
  );
};

export default PurchasingPowerCard;
