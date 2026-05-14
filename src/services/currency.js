export const getRates = async () => {
  const res = await fetch("https://api.exchangerate.host/latest");
  return res.json();
};

export const convertCurrency = (amount, rate) => {
  return amount * rate;
};