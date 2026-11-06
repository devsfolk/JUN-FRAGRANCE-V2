import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import sharp from "sharp";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const backupDir = resolve(root, "backups");
const mode = process.argv[2];

if (mode !== "--dry-run" && mode !== "--apply") {
  throw new Error("Usage: node scripts/cleanup-product-copy.mjs --dry-run|--apply");
}

const additionsBySlug = {
  "arctic-frost": [
    "That calm, understated mood can carry through long days, from casual plans to your everyday routine.",
    "Sharing the bottle at home is another option for the same relaxed routine.",
  ],
  "imperial-spice": [
    "That warm, bold mood fits cooler evening plans, Eid gatherings and winter weddings.",
    "The same character suits festive nights more than hot-weather afternoons.",
  ],
  "lost-kingdom": [
    "Its open mood is suited to warm afternoons, long commutes and summer weddings.",
    "The unisex bottle can also be shared at home by anyone who prefers an open mood on warm-weather days.",
  ],
  "prism-22": [
    "That confident, modern mood suits university days, shopping trips and daytime events, giving it a place among daytime plans.",
    "Choose it for a university day, a shopping trip or a daytime event when that mood fits the occasion.",
  ],
  "regal-oud": [
    "That deep, dignified mood suits weddings, formal celebrations and other occasions when a composed feel matches the setting.",
    "Choose this unisex perfume for a wedding or formal event when that composed mood fits your plans.",
  ],
  "velvet-bloom": [
    "Soft, gentle character suits daily wear, family functions and gifts for someone who prefers an understated mood.",
    "Keep it in mind for routine days or family gatherings when a calm, gentle mood fits the occasion.",
  ],
  "y-series": [
    "Its simple, modern mood fits everyday settings such as college, work and casual evenings.",
  ],
  "zen-miyaki": [
    "That calm, reserved mood fits quiet mornings and study days when an unhurried pace suits your plans.",
    "Relaxed meetings are another occasion for the same measured feel, alongside a quiet start or a day of study.",
  ],
  "jf-myself": [
    "Its clean notes, smoked wood and amber suit work hours as well as a family gathering.",
    "Those same notes fit both day-to-day work plans and family occasions.",
  ],
  "no-4-the-signature": [
    "Its rich bergamot, dark oud and sweet patchouli suit evenings, cooler weather and formal occasions.",
  ],
};

const metaCommentary = /\bno notes\b|\bnotes? (?:are|is) not\b|\bnot listed\b|\brather than naming\b|\bwe keep the description\b|\bwe describe only\b|\bwe do not add\b|\bwe do not describe\b|\bdescription stays\b|\bdescription is kept\b|\bgeneral mood\b|\b(?:general|broad)[^.!?]{0,50}\bmood\b|\bbroad description\b|\bask for (?:any further )?product information\b|\bask us what information is available\b|\bmessage us on WhatsApp and ask\b|\bname alone is not\b|\bname should not be used to infer\b|\bnote names are provided\b|\bwithout adding further scent descriptions\b|\bthe product page gives the full list\b|\bdetailed note list is not available\b|\bthe description (?:is|stays|keeps) brief\b/i;
const wordCount = (value) => value.trim().split(/\s+/).filter(Boolean).length;

function loadEnv() {
  const envFile = resolve(root, ".env.local");
  if (!existsSync(envFile)) throw new Error(".env.local was not found.");
  for (const line of readFileSync(envFile, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator < 0) continue;
    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[key] ||= value;
  }
}

function stripMetaCommentary(value, field) {
  if (!value) return { value, removed: [] };
  const sentences = value.split(/(?<=[.!?])\s+(?=[A-Z"'0-9])/);
  const removed = sentences.filter((sentence) => metaCommentary.test(sentence)).map((sentence) => sentence.trim());
  if (removed.length === 0) return { value, removed };
  const kept = sentences.filter((sentence) => !metaCommentary.test(sentence)).map((sentence) => sentence.trim()).filter(Boolean);
  return { value: kept.join(" "), removed: removed.map((sentence) => `${field}: ${sentence}`) };
}

function requireValidProduct(product) {
  const descWords = wordCount(product.description ?? "");
  if (descWords < 60 || descWords > 90) {
    throw new Error(`[${product.slug}] description is ${descWords} words; expected 60 to 90.`);
  }
  if ((product.short_description ?? "").length > 140) {
    throw new Error(`[${product.slug}] short_description exceeds 140 characters.`);
  }
  const seo = product.seo_description ?? "";
  if (seo.length > 155 || !["Pakistan", "Rs. 1,999", "WhatsApp"].every((term) => seo.includes(term))) {
    throw new Error(`[${product.slug}] seo_description must be <=155 characters and contain Pakistan, Rs. 1,999, and WhatsApp.`);
  }
  for (const field of ["short_description", "description", "seo_description"]) {
    if (metaCommentary.test(product[field] ?? "")) {
      throw new Error(`[${product.slug}] ${field} still contains customer-facing meta commentary.`);
    }
  }
}

function printChanges(changes) {
  const rows = changes.flatMap(({ before, after, removed }) =>
    ["short_description", "description", "seo_description"]
      .filter((field) => before[field] !== after[field])
      .map((field) => ({
        slug: before.slug,
        field,
        removed_sentence: removed.filter((sentence) => sentence.startsWith(`${field}: `)).join("\n"),
        before: before[field] ?? "",
        after: after[field] ?? "",
      })),
  );
  console.table(rows);
}

loadEnv();
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceRoleKey) throw new Error("Supabase URL or service-role key is missing from .env.local.");
const restBase = `${supabaseUrl.replace(/\/$/, "")}/rest/v1`;
const storageBase = `${supabaseUrl.replace(/\/$/, "")}/storage/v1`;

async function restRequest(path, init = {}) {
  const response = await fetch(`${restBase}/${path}`, {
    ...init,
    headers: {
      apikey: serviceRoleKey,
      authorization: `Bearer ${serviceRoleKey}`,
      "content-type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const body = await response.text();
  if (!response.ok) throw new Error(`Supabase request failed (${response.status}): ${body}`);
  return body ? JSON.parse(body) : null;
}

async function getProducts() {
  const query = new URLSearchParams({
    select: "id,slug,title,short_description,description,seo_description,seo_title,is_active",
    order: "slug.asc",
  });
  return restRequest(`jf_products?${query}`);
}

async function getFaviconSetting() {
  const query = new URLSearchParams({ select: "key,value", key: "eq.site_favicon" });
  const rows = await restRequest(`jf_settings?${query}`);
  return rows[0] ?? null;
}

const products = await getProducts();
const originalProducts = products.map((product) => ({ ...product }));
const changes = [];
for (const product of products) {
  const before = { ...product };
  const removed = [];
  for (const field of ["short_description", "description", "seo_description"]) {
    const cleaned = stripMetaCommentary(product[field], field);
    product[field] = cleaned.value;
    removed.push(...cleaned.removed);
  }
  if (wordCount(product.description ?? "") < 60) {
    const additions = additionsBySlug[product.slug];
    if (!additions?.length) {
      throw new Error(`[${product.slug}] needs more than 60 words after cleanup, but no product-specific extension is defined.`);
    }
    product.description = `${product.description.trim()} ${additions.join(" ")}`.trim();
  }
  requireValidProduct(product);
  if (["short_description", "description", "seo_description"].some((field) => product[field] !== before[field])) {
    changes.push({ before, after: product, removed });
  }
}

const setting = await getFaviconSetting();
if (!setting || !setting.value?.url) throw new Error("The current site_favicon setting was not found.");
const faviconUrl = setting.value.url;
const faviconResponse = await fetch(faviconUrl, { cache: "no-store" });
if (!faviconResponse.ok) throw new Error(`Could not read the current favicon (${faviconResponse.status}).`);
const faviconBytes = Buffer.from(await faviconResponse.arrayBuffer());
const faviconMetadata = await sharp(faviconBytes).metadata();
if (!faviconMetadata.width || !faviconMetadata.height) throw new Error("Could not read the current favicon dimensions.");
const resizedFavicon = await sharp(faviconBytes)
  .resize(192, 192, { fit: "cover", position: "centre" })
  .png()
  .toBuffer();
const resizedMetadata = await sharp(resizedFavicon).metadata();

console.log(`Mode: ${mode}; products scanned: ${products.length}; changed products: ${changes.length}`);
printChanges(changes);
console.log(`Favicon dry-run: ${faviconMetadata.width}x${faviconMetadata.height} PNG -> ${resizedMetadata.width}x${resizedMetadata.height} PNG; setting URL will be replaced after backup.`);

if (mode === "--dry-run") {
  console.log("Dry run only; no database or storage rows were written and no backup was created.");
  process.exit(0);
}

mkdirSync(backupDir, { recursive: true });
const timestamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
const backupPath = resolve(backupDir, `content-cleanup-${timestamp}.json`);
writeFileSync(backupPath, JSON.stringify({ products: originalProducts, faviconSetting: setting }, null, 2), "utf8");
console.log(`Backed up ${originalProducts.length} product rows and the favicon setting to backups/${backupPath.split(/[\\/]/).pop()}`);

const objectPath = `favicon/${Date.now()}-${randomUUID()}.png`;
const uploadResponse = await fetch(`${storageBase}/object/jf-media/${objectPath}`, {
  method: "POST",
  headers: {
    apikey: serviceRoleKey,
    authorization: `Bearer ${serviceRoleKey}`,
    "content-type": "image/png",
    "x-upsert": "false",
  },
  body: resizedFavicon,
});
if (!uploadResponse.ok) throw new Error(`Favicon upload failed (${uploadResponse.status}): ${await uploadResponse.text()}`);
const nextFaviconUrl = `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/jf-media/${objectPath}`;
const settingQuery = new URLSearchParams({ key: "eq.site_favicon" });
await restRequest(`jf_settings?${settingQuery}`, {
  method: "PATCH",
  headers: { Prefer: "return=minimal" },
  body: JSON.stringify({ value: { url: nextFaviconUrl } }),
});

for (const { after } of changes) {
  const query = new URLSearchParams({ id: `eq.${after.id}` });
  const update = {
    short_description: after.short_description,
    description: after.description,
    seo_description: after.seo_description,
  };
  await restRequest(`jf_products?${query}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify(update),
  });
}

const verifiedProducts = await getProducts();
const verifiedById = new Map(verifiedProducts.map((product) => [product.id, product]));
const originalById = new Map(originalProducts.map((product) => [product.id, product]));
for (const { after } of changes) {
  const actual = verifiedById.get(after.id);
  if (!actual || ["short_description", "description", "seo_description"].some((field) => actual[field] !== after[field])) {
    throw new Error(`Post-update text verification failed for ${after.slug}.`);
  }
  if (actual.seo_title !== originalById.get(after.id)?.seo_title) {
    throw new Error(`Post-update verification found an unintended SEO title change for ${after.slug}.`);
  }
  requireValidProduct(actual);
}
const verifiedSetting = await getFaviconSetting();
if (verifiedSetting?.value?.url !== nextFaviconUrl) throw new Error("Post-update favicon setting verification failed.");
const hostedIcon = await fetch(nextFaviconUrl, { cache: "no-store" });
const hostedMetadata = await sharp(Buffer.from(await hostedIcon.arrayBuffer())).metadata();
if (!hostedIcon.ok || hostedMetadata.width !== 192 || hostedMetadata.height !== 192 || hostedMetadata.format !== "png") {
  throw new Error("The uploaded favicon failed 192x192 PNG verification.");
}

printChanges(changes.map(({ before, removed, after }) => ({ before, after: verifiedById.get(after.id), removed })));
console.log(`Verified favicon setting points to a ${hostedMetadata.width}x${hostedMetadata.height} PNG.`);
