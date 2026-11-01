import assert from "node:assert/strict";
import { readFile, mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";
import ts from "typescript";

const temporary = await mkdtemp(join(tmpdir(), "jf-intl-checks-"));
try {
  for (const [source, output] of [["src/lib/site/intl-pricing.ts", "intl-pricing.js"], ["src/lib/site/intl-order-message.ts", "intl-order-message.js"]]) {
    const input = await readFile(join(process.cwd(), source), "utf8");
    const compiled = ts.transpileModule(input, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } });
    await writeFile(join(temporary, output), compiled.outputText);
  }
  const require = createRequire(import.meta.url);
  const { intlPrice, formatMoney } = require(join(temporary, "intl-pricing.js"));
  const { buildInternationalOrderMessage, giftOrderLines, convertOrderAmounts, createInternationalOrderMessage } = require(join(temporary, "intl-order-message.js"));
  assert.equal(intlPrice(1999, "AED", { AED: 0.013 }, 10, 3), 268);
  assert.equal(intlPrice(1999, "KWD", { KWD: 0.0042 }, 10, 3), 86.5);
  assert.equal(formatMoney(268, "AED"), "AED 268.00");
  const message = buildInternationalOrderMessage({ country: "UAE", currency: "AED", lines: [{ title: "Perfume", quantity: 1, localAmount: 268 }], subtotal: 268, delivery: 100, gift: { gift: true, message: "Happy birthday", recipient: "Sam" }, includesCard: true });
  for (const line of ["Delivery country: UAE | Currency: AED", "Subtotal:", "Delivery:", "Total (estimate):", "Import duties and taxes of your country, if any, are paid by the receiver.", "GIFT: yes.", "Gift message: Happy birthday", "Recipient name: Sam", "Recipient address:", "Buyer name:"]) assert.ok(message.includes(line), `Missing ${line}`);
  assert.ok(message.length <= 1800);
  const longMessage = buildInternationalOrderMessage({ country: "United Arab Emirates", currency: "AED", lines: Array.from({ length: 20 }, (_, i) => ({ title: `Long fragrance title ${i} `.repeat(15), quantity: 10, localAmount: 123456 })), subtotal: 2_469_120, delivery: 9876, gift: { gift: true, message: "A very long card message. ".repeat(8), recipient: "A very long recipient name that is limited" }, includesCard: true });
  assert.ok(longMessage.length <= 1800);
  assert.ok(longMessage.includes("Final amount, payment method and delivery time are confirmed on WhatsApp."));
  assert.ok(longMessage.includes("Import duties and taxes of your country, if any, are paid by the receiver."));
  let requestSizes = [];
  const converted = await convertOrderAmounts(Array.from({ length: 22 }, (_, i) => i), async (amounts) => { requestSizes.push(amounts.length); return amounts; });
  assert.deepEqual(requestSizes, [20, 2]);
  assert.equal(converted.length, 22);
  assert.deepEqual(giftOrderLines({ gift: true, message: "hidden", recipient: "" }, false), ["GIFT: yes. Please do not show any prices on the parcel or on any paperwork inside it.", "Recipient address:", "Buyer name:"]);
  const giftedOrder = await createInternationalOrderMessage({ country: "UAE", currency: "AED", items: [{ title: "Perfume", quantity: 1, pkrAmount: 2000 }], shippingPkr: 500, quoteMany: async (amounts) => amounts.map((amount) => amount / 100), gift: { gift: true, message: "", recipient: "Amina" }, includesCard: false, giftWrapPricePkr: 300 });
  assert.ok(giftedOrder?.includes("Gift packaging x1"));
  assert.ok(giftedOrder?.includes("Recipient name: Amina"));
  assert.ok(giftedOrder?.includes("Total (estimate): AED 28.00"));
  console.log("international price and order-message checks passed");
} finally {
  await rm(temporary, { recursive: true, force: true });
}
