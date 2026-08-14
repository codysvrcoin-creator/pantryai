export function formatMoney(amount: number, currency: string = "EUR") {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    const symbol = currency === "EUR" ? "€" : currency;
    return `${symbol}${amount}`;
  }
}
