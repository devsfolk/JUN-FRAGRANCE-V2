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

const article = {
  title: "How to choose the best perfume in Pakistan for your budget, weather and occasion: a buyer's checklist",
  slug: "best-perfume-pakistan-buyers-checklist",
  excerpt: "A practical checklist for comparing perfume price, product details, delivery timing, weather and the occasion you have in mind.",
  seo_title: "How to Choose the Best Perfume in Pakistan",
  seo_description: "Compare perfume prices in Pakistan, then choose by budget, weather and occasion. Orders are placed on WhatsApp.",
  content: `You are choosing a perfume for a day that starts with errands and ends at a family gathering. You have a budget, a weather forecast and several product pages open, but no simple way to compare them. Start with the price and bottle size, then check what each product page actually says and whether its delivery timing fits your plans. A short checklist keeps the choice tied to your own needs.

## Set a budget that matches how you plan to order

One perfume costs Rs. 1,999 for 50 ml. Any 3 perfumes from the whole collection (men, women or unisex) are Rs. 4,500. Those are the two prices to compare when deciding whether to choose one bottle or use the bundle page.

### Start with the single-bottle price

If you are choosing one perfume, begin with the listed price and size. The [perfume price list](/perfume-price-list) puts active products in one place so you can compare their names, gender labels, notes where supplied, size and price. Open a product page for the details of that particular perfume. Keep your comparison on the actual information shown there instead of inferring details from a name or a photograph.

### Consider a bundle only when three choices suit you

The bundle price applies to any 3 perfumes from the whole collection, including men, women or unisex selections. It is Rs. 4,500 on the [bundle page](/bundle). Think through all three choices before using that option. A single bottle may be a better fit when you only want one perfume or have not settled on the other selections. The useful comparison is the total you plan to order, not an imagined per-bottle amount.

## Match the occasion to the product details

Write down where you expect to wear the perfume: a workday, an outing or a family occasion. Then read the product page and compare its listed details with the setting you have in mind. If notes are shown, use them as one part of your decision. If you are unsure what a description means for your plans, ask about that product on WhatsApp before ordering.

### Choose for the setting you will actually be in

Consider how formal or relaxed the occasion is, how long you will be away and whether you will share a close space with other people. These are prompts for your own choice, not a promise that a perfume will behave the same way in every room or on every wearer. Start with the product information, and do not assume that one general label answers every question.

## Include weather in your comparison without guessing

Weather is part of the situation you are planning for, but a season or city name does not tell you everything about a product. Note whether your plans are mostly indoors or outdoors and what conditions you expect. Use the product details that are actually available, and ask on WhatsApp if something important is unclear. Avoid treating a broad description as a guarantee about how a perfume will smell or feel in your particular setting.

This is also a reason to keep your shortlist small. Compare a few options that fit your budget and occasion, then check the product pages side by side. The [shop](/shop) lets you browse the active collection; the linked price list makes it easier to return to the bottle sizes and prices while you decide.

## Check delivery before planning around an event

Delivery is across Pakistan in 3 to 5 days, between 12 PM and 9 PM. It is free in Karachi and costs Rs. 200 to 250 elsewhere. Check the [delivery details](/delivery) against your plans, especially when the perfume is for a specific occasion. Orders are placed on WhatsApp, where delivery details can be confirmed.

## Use this final buyer's checklist

Before you order, make sure you can answer these questions in plain terms:

### What is the exact order I want?

Decide whether you want one 50 ml perfume at Rs. 1,999 or any 3 from the whole collection at Rs. 4,500. If choosing three, select each one from the full collection rather than assuming the bundle belongs to a single gender category.

### What information am I relying on?

Use the listed product details, size and price. Ask on WhatsApp about anything that matters to your decision but is not clear on the page. Do not turn a general description into a claim about a specific note or result.

### Does the timing and policy suit my plans?

Allow for delivery across Pakistan in 3 to 5 days, between 12 PM and 9 PM, and confirm the details on WhatsApp. A 7-day return policy applies, with conditions confirmed on WhatsApp. Decide with those stated terms in mind before placing your order.

## An honest limitation

A checklist cannot tell you exactly how a perfume will smell to you or in the place where you plan to wear it. Product notes and descriptions can help you compare the information available, but they are not a personal experience of wearing the perfume. If a detail affects your choice, ask on WhatsApp before ordering and make your decision from the answer you receive.`,
  faq: [
    { question: "What is the price of one perfume?", answer: "One perfume costs Rs. 1,999 for 50 ml." },
    { question: "Can I choose three perfumes from different categories?", answer: "Yes. Any 3 perfumes from the whole collection (men, women or unisex) are Rs. 4,500." },
    { question: "How long does delivery take and what does it cost?", answer: "Delivery across Pakistan takes 3 to 5 days between 12 PM and 9 PM. It is free in Karachi and costs Rs. 200 to 250 elsewhere." },
    { question: "What is the return policy?", answer: "There is a 7-day return policy, with conditions confirmed on WhatsApp." },
  ],
  cover_image_url: null,
  status: "published",
  published_at: "2026-11-26T01:10:00.000Z",
  show_on_page: "journal",
};

async function getRows(table, query) {
  const response = await fetch(`${base}/rest/v1/${table}?${query}`, { headers });
  if (!response.ok) throw new Error(`Read ${table} failed: ${response.status} ${await response.text()}`);
  return response.json();
}

function tokens(text) {
  return text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim().split(/\s+/).filter(Boolean);
}

function shingles(text, size = 6) {
  const words = tokens(text);
  const out = new Set();
  for (let index = 0; index <= words.length - size; index += 1) out.add(words.slice(index, index + size).join(" "));
  return out;
}

const existingPosts = await getRows("jf_blog_posts", "select=slug,title,excerpt,content,faq,seo_title,seo_description");
if (existingPosts.some((post) => post.slug === article.slug)) throw new Error(`Post slug already exists: ${article.slug}`);
const articleWordCount = tokens(article.content).length;
const headingLevels = [...article.content.matchAll(/^#+/gm)].map((match) => match[0].length);
if (articleWordCount < 700 || articleWordCount > 1000) throw new Error(`Article word count outside 700–1000: ${articleWordCount}`);
if (headingLevels.some((level) => level < 2 || level > 3)) throw new Error("Article headings must use only H2 and H3");
if (article.faq.length < 3 || article.faq.length > 4) throw new Error(`FAQ count outside 3–4: ${article.faq.length}`);
const requiredLinks = ["/perfume-price-list", "/bundle", "/shop"];
if (requiredLinks.some((href) => !article.content.includes(`](${href})`))) throw new Error("A required internal link is missing");
const existingShingles = new Set();
for (const post of existingPosts) {
  const fullText = [post.title, post.excerpt, post.content, post.seo_title, post.seo_description, ...(Array.isArray(post.faq) ? post.faq.flatMap((item) => [item.question, item.answer]) : [])].filter(Boolean).join(" ");
  for (const shingle of shingles(fullText)) existingShingles.add(shingle);
}
const articleShingles = shingles([article.title, article.excerpt, article.content, ...article.faq.flatMap((item) => [item.question, item.answer])].join(" "));
const overlapCount = [...articleShingles].filter((shingle) => existingShingles.has(shingle)).length;
const overlapPercent = articleShingles.size ? overlapCount / articleShingles.size * 100 : 0;
if (overlapPercent >= 10) throw new Error(`Six-word-shingle overlap is ${overlapPercent.toFixed(2)}%; required below 10%`);

const pageSeoRows = await getRows("jf_pages_seo", "select=page_key,seo_title,seo_description,og_image_url");
const pageSeoExists = pageSeoRows.find((row) => row.page_key === "price-list");
if (pageSeoExists) throw new Error("price-list SEO row already exists; refusing to alter existing page SEO");
const pageSeo = {
  page_key: "price-list",
  seo_title: "Perfume Price List in Pakistan, 50 ml",
  seo_description: "Perfume prices in Pakistan: Rs. 1,999 for 50 ml. Browse the full list and order on WhatsApp.",
  og_image_url: null,
};

console.log(`Mode: ${apply ? "APPLY" : "DRY RUN"}`);
console.log(JSON.stringify({ table: "jf_pages_seo", key: "price-list", before: null, after: pageSeo }));
console.log(JSON.stringify({ table: "jf_blog_posts", key: article.slug, before: null, after: { title: article.title, status: article.status, published_at: article.published_at, faq: article.faq.length, content_words: articleWordCount } }));
console.log(JSON.stringify({ existing_posts: existingPosts.length, active_products: (await getRows("jf_products", "select=id&is_active=eq.true")).length, unique_six_word_shingles: articleShingles.size, shared_six_word_shingles: overlapCount, overlap_percent: Number(overlapPercent.toFixed(2)), heading_levels: [...new Set(headingLevels)] }));

if (apply) {
  const backupDir = path.join(root, "backups");
  await fs.mkdir(backupDir, { recursive: true });
  const backupPath = path.join(backupDir, `price-list-blog-${new Date().toISOString().replaceAll(":", "-")}.json`);
  await fs.writeFile(backupPath, JSON.stringify({ jf_pages_seo: { page_key: "price-list", before: null }, jf_blog_posts: { slug: article.slug, before: null } }, null, 2), "utf8");
  console.log(`Backup saved: ${path.relative(root, backupPath)}`);
  for (const [table, row] of [["jf_pages_seo", pageSeo], ["jf_blog_posts", article]]) {
    const response = await fetch(`${base}/rest/v1/${table}`, { method: "POST", headers: { ...headers, Prefer: "return=representation" }, body: JSON.stringify(row) });
    if (!response.ok) throw new Error(`Insert ${table} failed: ${response.status} ${await response.text()}`);
    const saved = await response.json();
    console.log(JSON.stringify({ table, after: table === "jf_pages_seo" ? saved[0] : { slug: saved[0].slug, status: saved[0].status, published_at: saved[0].published_at, title: saved[0].title } }));
  }
}
