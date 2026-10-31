import assert from "node:assert/strict";

function intlPrice(amount, currency, rates, multiplier, bufferPercent) {
  const rate = rates[currency];
  if (!Number.isFinite(amount) || amount < 0 || !Number.isFinite(rate) || rate <= 0) return null;
  const adjusted = amount * multiplier * (1 + bufferPercent / 100) * rate;
  const step = ["KWD", "OMR", "BHD"].includes(currency) ? 0.5 : 1;
  return Math.round(adjusted / step) * step;
}

assert.equal(intlPrice(1999, "AED", { AED: 0.013 }, 10, 3), 268);
assert.equal(intlPrice(1999, "KWD", { KWD: 0.0042 }, 10, 3), 86.5);
assert.equal(intlPrice(4500, "GBP", { GBP: 0.0028 }, 10, 0), 126);
assert.equal(intlPrice(100, "ZZZ", {}, 10, 3), null);
console.log("intl price checks passed");
