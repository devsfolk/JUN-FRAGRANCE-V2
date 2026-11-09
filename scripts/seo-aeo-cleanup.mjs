import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envText = await fs.readFile(path.join(root, ".env.local"), "utf8");
const env = Object.fromEntries(envText.split(/\r?\n/).filter((line) => line && !line.trim().startsWith("#")).map((line) => {
  const splitAt = line.indexOf("=");
  return [line.slice(0, splitAt), line.slice(splitAt + 1).replace(/^['"]|['"]$/g, "")];
}));
const base = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!base || !key) throw new Error("Supabase credentials are unavailable in .env.local");

const apply = process.argv.includes("--apply");
if (!apply && !process.argv.includes("--dry-run")) throw new Error("Choose --dry-run or --apply");
const headers = { apikey: key, authorization: `Bearer ${key}`, "content-type": "application/json" };

async function getRows(table, select = "*") {
  const response = await fetch(`${base}/rest/v1/${table}?select=${encodeURIComponent(select)}`, { headers });
  if (!response.ok) throw new Error(`Read ${table} failed: ${response.status} ${await response.text()}`);
  return response.json();
}

async function updateRow(table, keyName, keyValue, values) {
  const url = `${base}/rest/v1/${table}?${keyName}=eq.${encodeURIComponent(keyValue)}`;
  const response = await fetch(url, { method: "PATCH", headers: { ...headers, Prefer: "return=representation" }, body: JSON.stringify(values) });
  if (!response.ok) throw new Error(`Update ${table} failed: ${response.status} ${await response.text()}`);
  return response.json();
}

const changes = [];
function add(table, keyName, keyValue, before, after) {
  changes.push({ table, keyName, keyValue, before, after });
}

const categorySeo = {
  men: "Shop men's perfumes in Pakistan: 50 ml at Rs. 1,999. Browse fresh, woody and evening scents; order on WhatsApp.",
  women: "Shop women's perfumes in Pakistan: 50 ml at Rs. 1,999. Browse the collection and order on WhatsApp.",
  unisex: "Shop unisex perfumes in Pakistan: 50 ml at Rs. 1,999. Browse the collection and order on WhatsApp.",
};
const categories = await getRows("jf_categories", "id,slug,name,description,seo_title,seo_description");
for (const row of categories) {
  const seo_description = categorySeo[row.slug];
  if (seo_description && row.seo_description !== seo_description) add("jf_categories", "id", row.id, row, { ...row, seo_description });
}

const pages = await getRows("jf_pages_seo", "*");
const pageUpdates = {
  home: {
    seo_description: "Buy 50 ml perfumes for men, women and unisex at Rs. 1,999 each. Any 3 perfumes from the whole collection (men, women or unisex) for Rs. 4,500. Order on WhatsApp across Pakistan.",
  },
  bundle: {
    seo_title: "Any 3 Perfumes, Whole Collection, Rs. 4,500",
    seo_description: "Pick any 3 perfumes from the whole collection (men, women or unisex) for Rs. 4,500. Build the bundle and send it on WhatsApp.",
  },
  delivery: {
    page_key: "delivery",
    seo_title: "Perfume Delivery Across Pakistan",
    seo_description: "See perfume delivery charges, timing and ordering details across Pakistan.",
    og_image_url: null,
  },
};
for (const [page_key, values] of Object.entries(pageUpdates)) {
  const row = pages.find((item) => item.page_key === page_key);
  if (row) {
    if (Object.entries(values).some(([field, value]) => row[field] !== value)) add("jf_pages_seo", "page_key", page_key, row, { ...row, ...values });
  } else if (page_key === "delivery") add("jf_pages_seo", "page_key", page_key, null, values);
}

const replacements = {
  "make-perfume-last-longer-pakistan-summer": [["and any three perfumes on the [bundle page](/bundle) cost Rs. 4,500.", "Any 3 perfumes from the whole collection (men, women or unisex) are Rs. 4,500 on the [bundle page](/bundle)."]],
  "what-inspired-by-perfume-means": [
    ["Any three cost Rs. 4,500.", "Any 3 perfumes from the whole collection (men, women or unisex) are Rs. 4,500 on the bundle page."],
    [", or build a [bundle](/bundle) of three for Rs. 4,500 so you can compare scents side by side", ""],
  ],
  "mens-perfume-for-office-and-daily-wear": [["Any three perfumes cost Rs. 4,500 on the [bundle page](/bundle). Bought separately, three bottles at Rs. 1,999 each would cost Rs. 5,997.", ""]],
  "perfume-under-rs-2000-gift-guide-pakistan": [
    ["Any three perfumes cost Rs. 4,500 together, which works out to Rs. 1,500 each.", "Any 3 perfumes from the whole collection (men, women or unisex) are Rs. 4,500 on the bundle page."],
    ["Three perfumes for Rs. 4,500 can cover a brother, a sister and a friend.", "Any 3 perfumes from the whole collection (men, women or unisex) are Rs. 4,500 on the bundle page."],
  ],
  "womens-perfume-fresh-floral-or-sweet": [["Any three perfumes cost Rs. 4,500 on the [bundle page](/bundle), and you can browse every option on the [women's perfume page](/category/women).", "You can browse the collection on the [women's perfume page](/category/women)."]],
  "how-to-order-perfume-on-whatsapp": [["Three perfumes cost Rs. 4,500 together. If you want that price, the easiest way is the [bundle page](/bundle), where you pick any three perfumes and build your own bundle.", "Any 3 perfumes from the whole collection (men, women or unisex) are Rs. 4,500 on the [bundle page](/bundle), where you can build your own bundle."]],
  "how-to-choose-your-first-perfume": [
    ["When you are ready for more, any three perfumes cost Rs. 4,500 on the [bundle page](/bundle).", "When you are ready for more, any 3 perfumes from the whole collection (men, women or unisex) are Rs. 4,500 on the [bundle page](/bundle)."],
    ["Three perfumes for Rs. 4,500 gives you room to match the scent to the day.", "Any 3 perfumes from the whole collection (men, women or unisex) are Rs. 4,500 on the bundle page."],
  ],
  "how-to-store-perfume": [["Our [bundle page](/bundle) lets you pick any three perfumes for Rs. 4,500, which is an easy way to build a small rotation.", "Our [bundle page](/bundle) lets you pick any 3 perfumes from the whole collection (men, women or unisex) for Rs. 4,500, which is an easy way to build a small rotation."]],
  "perfume-gift-ideas-him-her-under-2000": [["A three-bottle bundle is a separate option priced at Rs. 4,500, so it does not fit a Rs. 2,000 total budget.", "Any 3 perfumes from the whole collection (men, women or unisex) are Rs. 4,500 on the bundle page."]],
  "build-three-perfume-bundle-day-evening-special-occasion": [["The bundle page lists any three perfumes for Rs. 4,500.", "The bundle page lists any 3 perfumes from the whole collection (men, women or unisex) for Rs. 4,500."]],
  "impression-perfume-pakistan-meaning": [
    ["with any three available for Rs. 4,500 through the [bundle page](/bundle).", "Any 3 perfumes from the whole collection (men, women or unisex) are Rs. 4,500 through the [bundle page](/bundle)."],
    [", Any 3 perfumes from the whole collection (men, women or unisex) are Rs. 4,500 through the [bundle page](/bundle).", ". Any 3 perfumes from the whole collection (men, women or unisex) are Rs. 4,500 through the [bundle page](/bundle)."],
  ],
  "perfume-dupe-pakistan-honest-comparison": [["; any three are Rs. 4,500 through the [bundle page](/bundle).", ". Any 3 perfumes from the whole collection (men, women or unisex) are Rs. 4,500 through the [bundle page](/bundle)."]],
  "affordable-perfume-pakistan-under-2000": [["Any three perfumes cost Rs. 4,500 through the [bundle page](/bundle).", "Any 3 perfumes from the whole collection (men, women or unisex) are Rs. 4,500 through the [bundle page](/bundle)."]],
  "perfume-in-karachi-humid-heat": [["Any three are Rs. 4,500 on the [bundle page](/bundle).", ""]],
  "perfume-in-lahore-heat-smog-weddings": [["any three are Rs. 4,500 on the [bundle page](/bundle).", ""]],
  "perfume-in-islamabad-rawalpindi-office-seasons": [["Any three cost Rs. 4,500 through the bundle option.", ""]],
  "perfume-for-your-city-and-season-pakistan": [[", and any three at Rs. 4,500.", "."]],
};
replacements["mens-perfume-for-office-and-daily-wear"].push(["Every perfume is a 50 ml bottle at Rs. 1,999. Any three perfumes cost Rs. 4,500.", "Every perfume is a 50 ml bottle at Rs. 1,999."]);
replacements["womens-perfume-fresh-floral-or-sweet"].push(["Every perfume is a 50 ml bottle at Rs. 1,999. Any three perfumes cost Rs. 4,500.", "Every perfume is a 50 ml bottle at Rs. 1,999."]);
replacements["perfume-under-rs-2000-gift-guide-pakistan"].push(["Any three perfumes cost Rs. 4,500 on the bundle page, instead of Rs. 5,997 if bought separately.", "Any 3 perfumes from the whole collection (men, women or unisex) are Rs. 4,500 on the bundle page."]);
replacements["perfume-gift-ideas-him-her-under-2000"].push(["No. The bundle total is Rs. 4,500, so it is a separate option for a larger budget.", "No. Any 3 perfumes from the whole collection (men, women or unisex) are Rs. 4,500 on the bundle page."]);
replacements["build-three-perfume-bundle-day-evening-special-occasion"].push(["Any three perfumes cost Rs. 4,500 on the bundle page.", "Any 3 perfumes from the whole collection (men, women or unisex) are Rs. 4,500 on the bundle page."]);
const blogPosts = await getRows("jf_blog_posts", "id,slug,title,excerpt,content,faq,seo_title,seo_description");
const projectedPosts = [];
function transformNested(value, swaps, changedRef) {
  if (typeof value === "string") {
    let next = value;
    for (const [before, after] of swaps) {
      if (next.includes(before)) {
        next = next.replaceAll(before, after);
        changedRef.value = true;
      }
    }
    return next;
  }
  if (Array.isArray(value)) return value.map((item) => transformNested(item, swaps, changedRef));
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([field, item]) => [field, transformNested(item, swaps, changedRef)]));
  return value;
}
for (const row of blogPosts) {
  const swaps = replacements[row.slug];
  if (!swaps) { projectedPosts.push(row); continue; }
  const next = { ...row };
  const changedRef = { value: false };
  for (const field of ["excerpt", "content", "faq", "seo_title", "seo_description"]) {
    next[field] = transformNested(next[field], swaps, changedRef);
  }
  projectedPosts.push(next);
  if (changedRef.value) add("jf_blog_posts", "id", row.id, row, next);
}

const products = await getRows("jf_products", "id,slug,title,short_description,description,seo_title,seo_description");
const flaggedProducts = products.filter((row) => [row.short_description, row.description, row.seo_description].some((text) => typeof text === "string" && /no notes|notes are not|not listed|rather than naming|we keep the description|general mood|ask for product information|message us on whatsapp and ask/i.test(text)));
if (flaggedProducts.length) throw new Error(`Unexpected product cleanup patterns found: ${flaggedProducts.map((row) => row.slug).join(", ")}`);

const residual = [];
function findResidual(value, location) {
  if (typeof value === "string" && /(?:Rs\.?\s*4\s*,?\s*500|4500)/i.test(value) && !/any\s*3 perfumes? from the whole collection|whole collection.{0,40}(men|women|unisex)/i.test(value)) residual.push(location);
  else if (Array.isArray(value)) value.forEach((item, index) => findResidual(item, `${location}[${index}]`));
  else if (value && typeof value === "object") for (const [field, item] of Object.entries(value)) findResidual(item, `${location}.${field}`);
}
for (const row of projectedPosts) findResidual({ excerpt: row.excerpt, content: row.content, faq: row.faq, seo_title: row.seo_title, seo_description: row.seo_description }, row.slug);
if (residual.length) throw new Error(`Unscoped bundle statements remain after planned changes: ${residual.join(", ")}`);

console.log(`Mode: ${apply ? "APPLY" : "DRY RUN"}`);
function changedText(before, after) {
  if (before === null) return { before: null, after };
  if (typeof before === "string" && typeof after === "string") {
    let start = 0;
    while (start < before.length && start < after.length && before[start] === after[start]) start += 1;
    let endBefore = before.length;
    let endAfter = after.length;
    while (endBefore > start && endAfter > start && before[endBefore - 1] === after[endAfter - 1]) { endBefore -= 1; endAfter -= 1; }
    return { before: before.slice(start, endBefore), after: after.slice(start, endAfter) };
  }
  if (Array.isArray(before) && Array.isArray(after)) return after.flatMap((item, index) => JSON.stringify(before[index]) === JSON.stringify(item) ? [] : changedText(before[index], item));
  if (before && after && typeof before === "object" && typeof after === "object") return Object.keys(after).flatMap((field) => JSON.stringify(before[field]) === JSON.stringify(after[field]) ? [] : changedText(before[field], after[field]));
  return { before, after };
}
for (const change of changes) {
  console.log(JSON.stringify({ table: change.table, key: change.keyValue, beforeAfter: changedText(change.before, change.after) }));
}
console.log(`Rows to change: ${changes.length}`);

if (apply) {
  const backupDir = path.join(root, "backups");
  await fs.mkdir(backupDir, { recursive: true });
  const backupPath = path.join(backupDir, `seo-aeo-cleanup-${new Date().toISOString().replaceAll(":", "-")}.json`);
  await fs.writeFile(backupPath, JSON.stringify(changes.map(({ table, keyValue, before }) => ({ table, key: keyValue, before })), null, 2), "utf8");
  console.log(`Backup saved: ${path.relative(root, backupPath)}`);
  for (const change of changes) {
    if (change.table === "jf_pages_seo" && change.before === null) {
      const response = await fetch(`${base}/rest/v1/jf_pages_seo?on_conflict=page_key`, { method: "POST", headers: { ...headers, Prefer: "resolution=merge-duplicates,return=representation" }, body: JSON.stringify(change.after) });
      if (!response.ok) throw new Error(`Insert delivery SEO row failed: ${response.status} ${await response.text()}`);
    } else {
      const patch = Object.fromEntries(Object.entries(change.after).filter(([field, value]) => change.before?.[field] !== value));
      await updateRow(change.table, change.keyName, change.keyValue, patch);
    }
  }
  console.log("Applied all planned database changes.");
}
