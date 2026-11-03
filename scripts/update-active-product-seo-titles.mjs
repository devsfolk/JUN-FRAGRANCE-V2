import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const backupDir = resolve(root, "backups");
const maxTitleLength = 45;
const mode = process.argv[2];

if (mode !== "--dry-run" && mode !== "--apply") {
  throw new Error("Usage: node scripts/update-active-product-seo-titles.mjs --dry-run|--apply");
}

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

function makeSeoTitle(productTitle) {
  const name = productTitle.trim().replace(/\s+/g, " ");
  const preferred = `${name} Perfume Price in Pakistan`;
  if (preferred.length <= maxTitleLength) return preferred;

  const shorter = `${name} Price in Pakistan`;
  if (shorter.length <= maxTitleLength) return shorter;

  const suffix = " Price in Pakistan";
  const nameBudget = maxTitleLength - suffix.length;
  const words = name.split(" ");
  let shortened = "";
  for (const word of words) {
    const candidate = shortened ? `${shortened} ${word}` : word;
    if (candidate.length > nameBudget) break;
    shortened = candidate;
  }
  if (!shortened) shortened = name.slice(0, nameBudget).trimEnd().replace(/[\s.,-]+$/g, "");
  const result = `${shortened}${suffix}`;
  if (result.length > maxTitleLength || !result.includes("Price in Pakistan")) {
    throw new Error(`Could not create a clean SEO title for: ${productTitle}`);
  }
  return result;
}

function validateDescription(product) {
  const description = product.seo_description ?? "";
  const required = ["Pakistan", "Rs. 1,999", "WhatsApp"];
  const missing = required.filter((text) => !description.includes(text));
  if (description.length > 155 || missing.length) {
    throw new Error(
      `[${product.slug}] seo_description must be <=155 characters and contain Pakistan, Rs. 1,999, and WhatsApp; current value: ${JSON.stringify(description)}`,
    );
  }
}

function printTable(products, afterById) {
  console.table(products.map((product) => ({
    slug: product.slug,
    before: product.seo_title ?? "",
    after: afterById.get(product.id) ?? product.seo_title ?? "",
    description: product.seo_description ?? "",
  })));
}

loadEnv();
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceRoleKey) throw new Error("Supabase URL or service-role key is missing from .env.local.");

async function restRequest(path, init = {}) {
  const response = await fetch(`${url.replace(/\/$/, "")}/rest/v1/${path}`, {
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

async function getActiveProducts() {
  const query = new URLSearchParams({
    select: "id,title,slug,seo_title,seo_description,is_active",
    is_active: "eq.true",
    order: "title.asc",
  });
  return restRequest(`jf_products?${query}`);
}

const products = await getActiveProducts();

for (const product of products ?? []) validateDescription(product);
const updates = (products ?? []).map((product) => ({
  product,
  seo_title: makeSeoTitle(product.title),
}));
const afterById = new Map(updates.map(({ product, seo_title }) => [product.id, seo_title]));

console.log(`Mode: ${mode}; active products: ${updates.length}`);
printTable(products ?? [], afterById);

if (mode === "--dry-run") {
  console.log("Dry run only; no database rows or backups were written.");
  process.exit(0);
}

const changed = updates.filter(({ product, seo_title }) => product.seo_title !== seo_title);
if (changed.length) {
  mkdirSync(backupDir, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const backupPath = resolve(backupDir, `product-seo-titles-${timestamp}.json`);
  writeFileSync(backupPath, JSON.stringify(products, null, 2), "utf8");
  console.log(`Backed up ${products.length} active product rows to backups/${backupPath.split(/[\\/]/).pop()}`);

  for (const { product, seo_title } of changed) {
    const query = new URLSearchParams({ id: `eq.${product.id}`, is_active: "eq.true" });
    await restRequest(`jf_products?${query}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ seo_title }),
    });
  }
}

const afterProducts = await getActiveProducts();
const verified = new Map(afterProducts.map((product) => [product.id, product.seo_title ?? ""]));
if (updates.some(({ product, seo_title }) => verified.get(product.id) !== seo_title)) {
  throw new Error("Post-update verification found a product title that did not match its target.");
}
console.log("Verified database after values:");
printTable(products ?? [], verified);
