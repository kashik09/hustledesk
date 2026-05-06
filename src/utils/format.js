export function formatCurrency(amount, currency = "KES") {
  if (!amount && amount !== 0) return "-";

  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}
