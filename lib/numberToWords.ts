const ONES = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
  "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
  "Seventeen", "Eighteen", "Nineteen",
];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

const CURRENCY_WORDS: Record<string, string> = {
  BDT: "Taka",
  USD: "Dollar",
  EUR: "Euro",
  INR: "Rupee",
  GBP: "Pound",
};

function belowThousand(n: number): string {
  if (n === 0) return "";
  if (n < 20) return ONES[n];
  if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? " " + ONES[n % 10] : "");
  return ONES[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + belowThousand(n % 100) : "");
}

function convert(n: number): string {
  if (n === 0) return "Zero";
  const parts: string[] = [];
  if (n >= 10_000_000) { parts.push(belowThousand(Math.floor(n / 10_000_000)) + " Crore"); n %= 10_000_000; }
  if (n >= 100_000)    { parts.push(belowThousand(Math.floor(n / 100_000))    + " Lakh");  n %= 100_000; }
  if (n >= 1_000)      { parts.push(belowThousand(Math.floor(n / 1_000))      + " Thousand"); n %= 1_000; }
  if (n > 0)           { parts.push(belowThousand(n)); }
  return parts.join(" ");
}

export function numberToWords(amount: number, currency = "BDT"): string {
  if (!isFinite(amount) || amount < 0) return "";
  const whole = Math.floor(amount);
  const fraction = Math.round((amount - whole) * 100);
  const currencyLabel = CURRENCY_WORDS[currency] ?? currency;

  let result = convert(whole) + " " + currencyLabel;
  if (fraction > 0) result += " And " + convert(fraction) + " Paisa";
  return result + " Only/-";
}
