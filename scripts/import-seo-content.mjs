/**
 * scripts/import-seo-content.mjs
 *
 * One-time idempotent script that imports SEO content from seo-content/ into
 * the Supabase database and updates static .tsx pages in-source.
 *
 * Usage:
 *   node scripts/import-seo-content.mjs            # live run
 *   node scripts/import-seo-content.mjs --dry-run  # validate only, no writes
 *
 * Reads credentials from .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * The service-role client is created ONLY inside this script.
 * Never import or use the service-role key from src/.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { WebSocket } from "ws";

// Polyfill WebSocket for Node 20 (no native WebSocket)
if (typeof globalThis.WebSocket === "undefined") {
  globalThis.WebSocket = WebSocket;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const SEO_DIR = resolve(ROOT, "seo-content");
const BACKUP_DIR = resolve(ROOT, "backups");

const DRY_RUN = process.argv.includes("--dry-run");

/** Load .env.local manually (no dotenv dependency needed) */
function loadEnv() {
  const envPath = resolve(ROOT, ".env.local");
  if (!existsSync(envPath)) {
    console.error("ERROR: .env.local not found. Add it to the project root.");
    process.exit(1);
  }
  const lines = readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = val;
  }
}

function requireEnv(...keys) {
  const missing = keys.filter((k) => !process.env[k]);
  if (missing.length) {
    console.error(`ERROR: Missing required env keys: ${missing.join(", ")}`);
    console.error("Add them to .env.local before running this script.");
    process.exit(1);
  }
}

function readJson(filename) {
  return JSON.parse(readFileSync(resolve(SEO_DIR, filename), "utf-8"));
}

function ensureDir(dir) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function writeBackup(name, data) {
  ensureDir(BACKUP_DIR);
  const file = resolve(BACKUP_DIR, name);
  writeFileSync(file, JSON.stringify(data, null, 2), "utf-8");
  console.log(`  ✓ Backup written → backups/${name}`);
}

// ─── Validation ─────────────────────────────────────────────────────────────

const LIMITS = {
  seo_title: 45,
  seo_description: 155,
  short_description: 140,
  category_description: 160,
};

function validateProducts(products) {
  const errors = [];
  for (const p of products) {
    if (!p.slug) { errors.push(`Product missing slug`); continue; }
    if (p.seo_title && p.seo_title.length > LIMITS.seo_title)
      errors.push(`[product:${p.slug}] seo_title ${p.seo_title.length} > ${LIMITS.seo_title}: "${p.seo_title}"`);
    if (p.seo_description && p.seo_description.length > LIMITS.seo_description)
      errors.push(`[product:${p.slug}] seo_description ${p.seo_description.length} > ${LIMITS.seo_description}`);
    if (p.short_description && p.short_description.length > LIMITS.short_description)
      errors.push(`[product:${p.slug}] short_description ${p.short_description.length} > ${LIMITS.short_description}: "${p.short_description}"`);
  }
  return errors;
}

function validateCategories(cats) {
  const errors = [];
  for (const c of cats) {
    if (!c.slug) { errors.push(`Category missing slug`); continue; }
    if (c.seo_title && c.seo_title.length > LIMITS.seo_title)
      errors.push(`[category:${c.slug}] seo_title ${c.seo_title.length} > ${LIMITS.seo_title}: "${c.seo_title}"`);
    if (c.seo_description && c.seo_description.length > LIMITS.seo_description)
      errors.push(`[category:${c.slug}] seo_description ${c.seo_description.length} > ${LIMITS.seo_description}`);
    if (c.description && c.description.length > LIMITS.category_description)
      errors.push(`[category:${c.slug}] description ${c.description.length} > ${LIMITS.category_description}`);
  }
  return errors;
}

function validatePagesSeo(pages) {
  const errors = [];
  for (const p of pages) {
    if (!p.page_key) { errors.push(`Page SEO entry missing page_key`); continue; }
    if (p.seo_title && p.seo_title.length > LIMITS.seo_title)
      errors.push(`[page:${p.page_key}] seo_title ${p.seo_title.length} > ${LIMITS.seo_title}: "${p.seo_title}"`);
    if (p.seo_description && p.seo_description.length > LIMITS.seo_description)
      errors.push(`[page:${p.page_key}] seo_description ${p.seo_description.length} > ${LIMITS.seo_description}`);
  }
  return errors;
}

// ─── Blog post parser ────────────────────────────────────────────────────────

/**
 * Parse posts.txt with format:
 *   === POST ===
 *   title: ...
 *   slug: ...
 *   show_on: journal | home | category:men | category:women | category:unisex
 *   excerpt: ...
 *   seo_title: ...
 *   seo_description: ...
 *   --- content ---
 *   <markdown>
 *   --- faq ---
 *   Q: ...
 *   A: ...
 *   === END ===
 */
function parsePosts(txt) {
  const posts = [];
  const blocks = txt.split(/^=== POST ===/m).slice(1);
  for (const block of blocks) {
    const endIdx = block.indexOf("=== END ===");
    const body = endIdx === -1 ? block : block.slice(0, endIdx);

    const contentSplit = body.split(/^--- content ---/m);
    const headerPart = contentSplit[0];
    const rest = contentSplit[1] || "";

    const faqSplit = rest.split(/^--- faq ---/m);
    const contentPart = faqSplit[0].trim();
    const faqPart = faqSplit[1] || "";

    // Parse header fields
    const lines = headerPart.split("\n");
    const fields = {};
    for (const line of lines) {
      const m = line.match(/^(\w[\w_]*):\s*(.+)$/);
      if (m) fields[m[1]] = m[2].trim();
    }

    if (!fields.slug) continue;

    // Parse FAQ pairs
    const faqItems = [];
    const faqLines = faqPart.trim().split("\n");
    let curQ = null;
    for (const fl of faqLines) {
      if (fl.startsWith("Q:")) {
        curQ = fl.slice(2).trim();
      } else if (fl.startsWith("A:") && curQ) {
        faqItems.push({ question: curQ, answer: fl.slice(2).trim() });
        curQ = null;
      }
    }

    posts.push({
      title: fields.title || "",
      slug: fields.slug,
      show_on_page: fields.show_on || "journal",
      excerpt: fields.excerpt || "",
      seo_title: fields.seo_title || "",
      seo_description: fields.seo_description || "",
      content: contentPart,
      faq: faqItems,
    });
  }
  return posts;
}

// ─── Database operations ─────────────────────────────────────────────────────

async function importProducts(supabase, products) {
  // Fetch existing slugs
  const { data: existing, error: fetchErr } = await supabase
    .from("jf_products")
    .select("slug, id, title, short_description, description, seo_title, seo_description");
  if (fetchErr) throw new Error(`Fetch products: ${fetchErr.message}`);

  const existingMap = Object.fromEntries(existing.map((r) => [r.slug, r]));
  const notFound = [];
  const toUpdate = [];

  for (const p of products) {
    if (!existingMap[p.slug]) {
      notFound.push(p.slug);
      continue;
    }
    toUpdate.push({ slug: p.slug, ...p });
  }

  if (notFound.length) {
    console.warn(`  ⚠ Products not found in DB (no-op): ${notFound.join(", ")}`);
  }

  if (DRY_RUN) {
    console.log(`  [DRY-RUN] Would update ${toUpdate.length} products.`);
    return { updated: toUpdate.length, notFound };
  }

  let updated = 0;
  for (const p of toUpdate) {
    const payload = {};
    if (p.short_description) payload.short_description = p.short_description;
    if (p.description) payload.description = p.description;
    if (p.seo_title) payload.seo_title = p.seo_title;
    if (p.seo_description) payload.seo_description = p.seo_description;
    if (!Object.keys(payload).length) continue;

    const { error } = await supabase
      .from("jf_products")
      .update(payload)
      .eq("slug", p.slug);
    if (error) throw new Error(`Update product ${p.slug}: ${error.message}`);
    updated++;
  }

  return { updated, notFound };
}

async function importCategories(supabase, categories) {
  const { data: existing, error } = await supabase
    .from("jf_categories")
    .select("slug, id, description, seo_title, seo_description");
  if (error) throw new Error(`Fetch categories: ${error.message}`);

  const existingMap = Object.fromEntries(existing.map((r) => [r.slug, r]));
  const notFound = [];
  const toUpdate = [];

  for (const c of categories) {
    if (!existingMap[c.slug]) {
      notFound.push(c.slug);
      continue;
    }
    toUpdate.push(c);
  }

  if (notFound.length) {
    console.warn(`  ⚠ Categories not found in DB (no-op): ${notFound.join(", ")}`);
  }

  if (DRY_RUN) {
    console.log(`  [DRY-RUN] Would update ${toUpdate.length} categories.`);
    return { updated: toUpdate.length, notFound };
  }

  let updated = 0;
  for (const c of toUpdate) {
    const payload = {};
    if (c.description) payload.description = c.description;
    if (c.seo_title) payload.seo_title = c.seo_title;
    if (c.seo_description) payload.seo_description = c.seo_description;
    if (!Object.keys(payload).length) continue;

    const { error: upErr } = await supabase
      .from("jf_categories")
      .update(payload)
      .eq("slug", c.slug);
    if (upErr) throw new Error(`Update category ${c.slug}: ${upErr.message}`);
    updated++;
  }
  return { updated, notFound };
}

async function importPagesSeo(supabase, pages) {
  if (DRY_RUN) {
    console.log(`  [DRY-RUN] Would upsert ${pages.length} page SEO entries.`);
    return { upserted: pages.length };
  }

  let upserted = 0;
  for (const p of pages) {
    const payload = {
      page_key: p.page_key,
      ...(p.seo_title ? { seo_title: p.seo_title } : {}),
      ...(p.seo_description ? { seo_description: p.seo_description } : {}),
    };
    const { error } = await supabase
      .from("jf_pages_seo")
      .upsert(payload, { onConflict: "page_key" });
    if (error) throw new Error(`Upsert page_seo ${p.page_key}: ${error.message}`);
    upserted++;
  }
  return { upserted };
}

async function importBlogPosts(supabase, posts) {
  if (DRY_RUN) {
    console.log(`  [DRY-RUN] Would upsert ${posts.length} blog posts.`);
    return { upserted: posts.length };
  }

  let upserted = 0;
  for (const p of posts) {
    const payload = {
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt,
      content: p.content,
      faq: p.faq,
      seo_title: p.seo_title,
      seo_description: p.seo_description,
      show_on_page: p.show_on_page,
    };
    const { error } = await supabase
      .from("jf_blog_posts")
      .upsert(payload, { onConflict: "slug" });
    if (error) throw new Error(`Upsert blog post ${p.slug}: ${error.message}`);
    upserted++;
  }
  return { upserted };
}

// ─── Static page updaters ────────────────────────────────────────────────────

/**
 * Update FAQ_ITEMS in src/app/(public)/faq/page.tsx
 * Replaces the hardcoded array while preserving surrounding JSX.
 */
function updateFaqPage(faqItems) {
  const faqPath = resolve(ROOT, "src/app/(public)/faq/page.tsx");
  // Normalize CRLF → LF for reliable string matching
  const src = readFileSync(faqPath, "utf-8").replace(/\r\n/g, "\n");

  // Build replacement array literal
  const itemsLiteral =
    "[\n" +
    faqItems
      .map((item) => {
        const q = item.question.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
        const a = item.answer.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
        return `  {\n    question: "${q}",\n    answer: "${a}",\n  },`;
      })
      .join("\n") +
    "\n]";

  // Replace between "const FAQ_ITEMS = [" ... "];"
  const startToken = "const FAQ_ITEMS = [";
  const startIdx = src.indexOf(startToken);
  if (startIdx === -1) throw new Error("FAQ_ITEMS not found in faq/page.tsx");

  // Find the matching closing "];" by bracket depth
  let depth = 0;
  let i = startIdx + startToken.length - 1; // at the '['
  const start = i;
  while (i < src.length) {
    if (src[i] === "[") depth++;
    else if (src[i] === "]") {
      depth--;
      if (depth === 0) break;
    }
    i++;
  }
  // i is at ']', look for ';'
  const endIdx = src.indexOf(";", i);
  if (endIdx === -1) throw new Error("Could not find end of FAQ_ITEMS");

  const newSrc =
    src.slice(0, startIdx) +
    "const FAQ_ITEMS = " +
    itemsLiteral +
    src.slice(endIdx + 1);

  if (!DRY_RUN) {
    writeFileSync(faqPath, newSrc, "utf-8");
    console.log("  ✓ Updated src/app/(public)/faq/page.tsx (FAQ_ITEMS)");
  } else {
    console.log("  [DRY-RUN] Would update faq/page.tsx with", faqItems.length, "items.");
  }
}

/**
 * Rewrite the About page body content.
 * The new content is injected into the main body sections, keeping the
 * structural JSX (nav, h1, trust points, WhatsApp CTA) intact.
 * We replace the brand narrative paragraph and "Our Promise" section.
 */
function updateAboutPage(aboutMd) {
  const aboutPath = resolve(ROOT, "src/app/(public)/about/page.tsx");
  // Normalize CRLF → LF for reliable string matching
  const src = readFileSync(aboutPath, "utf-8").replace(/\r\n/g, "\n");

  // We'll update the brand narrative <p> and the "Our Promise" section content.
  // The about.md has sections: Who we are, What we sell, "inspired by", How ordering works,
  // Delivery & returns, Talk to us.

  // Extract paragraph from "Who we are" section (first block of text)
  const whoWeAreMatch = aboutMd.match(/## Who we are\s*\n+([\s\S]+?)(?=\n##)/);
  const whoWeAreParagraphs = whoWeAreMatch
    ? whoWeAreMatch[1].trim().split("\n\n").map((p) => p.trim()).filter(Boolean)
    : [];

  // Extract "What we sell" section
  const whatWeSellMatch = aboutMd.match(/## What we sell\s*\n+([\s\S]+?)(?=\n##)/);
  const whatWeSellParagraphs = whatWeSellMatch
    ? whatWeSellMatch[1].trim().split("\n\n").map((p) => p.trim()).filter(Boolean)
    : [];

  // Extract "inspired by" section
  const inspiredByMatch = aboutMd.match(/## What "inspired by" means\s*\n+([\s\S]+?)(?=\n##)/);
  const inspiredByParagraphs = inspiredByMatch
    ? inspiredByMatch[1].trim().split("\n\n").map((p) => p.trim()).filter(Boolean)
    : [];

  // Build the new brand narrative paragraph from "Who we are" first paragraph
  const narrative = whoWeAreParagraphs[0] || "";
  const escapedNarrative = narrative.replace(/'/g, "&apos;");

  // Build the promise body from what we sell + inspired-by note
  const promiseBody = whatWeSellParagraphs.join(" ") || "";
  const escapedPromise = promiseBody.replace(/'/g, "&apos;");
  const trademarkNote = inspiredByParagraphs[0]
    ? inspiredByParagraphs[0].replace(/'/g, "&apos;")
    : "";

  // Replace the brand narrative <p>
  const narrativeStart = src.indexOf("{/* Brand narrative */}");
  const narrativeEnd = src.indexOf("{/* Our Promise */}", narrativeStart);
  if (narrativeStart === -1 || narrativeEnd === -1) {
    console.warn("  ⚠ Could not locate brand narrative block in about/page.tsx — skipping");
    return;
  }

  const newNarrativeBlock = `{/* Brand narrative */}
        <p className="mt-6 max-w-3xl font-serif text-xl font-normal leading-relaxed text-bone/90 sm:text-2xl md:text-3xl md:leading-[1.4]">
          ${escapedNarrative}
        </p>\n\n        `;

  // Replace the "Our Promise" content
  const ourPromiseStart = src.indexOf("{/* Our Promise */}");
  const ourPromiseEnd = src.indexOf("{/* Four Trust Points */}", ourPromiseStart);
  if (ourPromiseStart === -1 || ourPromiseEnd === -1) {
    console.warn("  ⚠ Could not locate Our Promise block in about/page.tsx — skipping");
    return;
  }

  const newPromiseBlock = `{/* Our Promise */}
        <div className="mt-10 rounded-2xl border border-white/10 bg-ink-2/60 p-7">
          <h2 className="font-serif text-xl font-medium text-bone sm:text-2xl">Our Promise</h2>
          <p className="mt-3 text-sm leading-relaxed text-bone/75 sm:text-base">
            ${escapedPromise}
          </p>
          <p className="mt-3 text-xs text-mute">
            ${trademarkNote}
          </p>
        </div>\n\n        `;

  const step1 =
    src.slice(0, narrativeStart) +
    newNarrativeBlock +
    src.slice(narrativeEnd);

  const ourPromiseStart2 = step1.indexOf("{/* Our Promise */}");
  const ourPromiseEnd2 = step1.indexOf("{/* Four Trust Points */}", ourPromiseStart2);

  const step2 =
    step1.slice(0, ourPromiseStart2) +
    newPromiseBlock +
    step1.slice(ourPromiseEnd2);

  if (!DRY_RUN) {
    writeFileSync(aboutPath, step2, "utf-8");
    console.log("  ✓ Updated src/app/(public)/about/page.tsx (narrative + promise)");
  } else {
    console.log("  [DRY-RUN] Would update about/page.tsx.");
  }
}

/**
 * Rewrite terms-and-conditions/page.tsx using content from terms.md
 */
function updateTermsPage(termsMd) {
  const termsPath = resolve(ROOT, "src/app/(public)/terms-and-conditions/page.tsx");
  // Normalize CRLF → LF for reliable string matching
  const src = readFileSync(termsPath, "utf-8").replace(/\r\n/g, "\n");

  const today = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const sections = parseMdSections(termsMd);

  const sectionJsx = sections
    .map(({ heading, paragraphs }, idx) => {
      const num = idx + 1;
      const escapedHeading = heading.replace(/&/g, "&amp;").replace(/'/g, "&apos;");
      const paraJsx = paragraphs
        .map((p) => {
          const escaped = p.replace(/&/g, "&amp;").replace(/'/g, "&apos;");
          return `            <p className="mt-3">${escaped}</p>`;
        })
        .join("\n");
      return `
          <section>
            <h2 className="mb-2 font-serif text-xl font-medium text-bone">${num}. ${escapedHeading}</h2>
${paraJsx}
          </section>`;
    })
    .join("\n");

  // Anchor on prose-custom div
  const proseMarker = `<div className="prose-custom`;
  const proseStart = src.indexOf(proseMarker);
  // Find closing </div> that ends the prose-custom block (before </Container>)
  const containerClose = src.indexOf("</Container>", proseStart);
  const proseEnd = src.lastIndexOf("</div>", containerClose);
  if (proseStart === -1 || proseEnd === -1 || containerClose === -1) {
    console.warn("  ⚠ Could not locate prose-custom div in terms page — skipping");
    return;
  }

  const lastUpdatedIdx = src.indexOf("const LAST_UPDATED");
  const lastUpdatedLineEnd = src.indexOf("\n", lastUpdatedIdx) + 1;

  const newContent =
    src.slice(0, lastUpdatedIdx) +
    `const LAST_UPDATED = "${today}";\n` +
    src.slice(lastUpdatedLineEnd, proseStart) +
    `<div className="prose-custom mt-10 space-y-8 text-sm leading-relaxed text-bone/80">\n${sectionJsx}\n        </div>` +
    src.slice(proseEnd + "</div>".length);

  if (!DRY_RUN) {
    writeFileSync(termsPath, newContent, "utf-8");
    console.log("  ✓ Updated src/app/(public)/terms-and-conditions/page.tsx");
  } else {
    console.log("  [DRY-RUN] Would update terms-and-conditions/page.tsx.");
  }
}

/**
 * Rewrite privacy-policy/page.tsx using content from privacy.md
 */
function updatePrivacyPage(privacyMd) {
  const privacyPath = resolve(ROOT, "src/app/(public)/privacy-policy/page.tsx");
  // Normalize CRLF → LF for reliable string matching
  const src = readFileSync(privacyPath, "utf-8").replace(/\r\n/g, "\n");

  const today = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const sections = parseMdSections(privacyMd);

  const sectionJsx = sections
    .map(({ heading, paragraphs }, idx) => {
      const num = idx + 1;
      const escapedHeading = heading.replace(/&/g, "&amp;").replace(/'/g, "&apos;");
      const paraJsx = paragraphs
        .map((p) => {
          const escaped = p.replace(/&/g, "&amp;").replace(/'/g, "&apos;");
          return `            <p className="mt-3">${escaped}</p>`;
        })
        .join("\n");
      return `
          <section>
            <h2 className="mb-2 font-serif text-xl font-medium text-bone">${num}. ${escapedHeading}</h2>
${paraJsx}
          </section>`;
    })
    .join("\n");

  // Anchor on the main content div before </Container>
  const contentMarker = `<div className="mt-10 space-y-8`;
  const contentStart = src.indexOf(contentMarker);
  const containerClose = src.indexOf("</Container>", contentStart);
  const contentEnd = src.lastIndexOf("</div>", containerClose);
  if (contentStart === -1 || contentEnd === -1 || containerClose === -1) {
    console.warn("  ⚠ Could not locate content div in privacy page — skipping");
    return;
  }

  const lastUpdatedIdx = src.indexOf("const LAST_UPDATED");
  const lastUpdatedLineEnd = src.indexOf("\n", lastUpdatedIdx) + 1;

  const newContent =
    src.slice(0, lastUpdatedIdx) +
    `const LAST_UPDATED = "${today}";\n` +
    src.slice(lastUpdatedLineEnd, contentStart) +
    `<div className="mt-10 space-y-8 text-sm leading-relaxed text-bone/80">\n${sectionJsx}\n        </div>` +
    src.slice(contentEnd + "</div>".length);

  if (!DRY_RUN) {
    writeFileSync(privacyPath, newContent, "utf-8");
    console.log("  ✓ Updated src/app/(public)/privacy-policy/page.tsx");
  } else {
    console.log("  [DRY-RUN] Would update privacy-policy/page.tsx.");
  }
}

/** Parse a markdown file into [{heading, paragraphs}] for ## sections */
function parseMdSections(md) {
  // Remove front-matter like "Last updated: {{DATE}}"
  const clean = md.replace(/^Last updated:.+\n/, "").trim();
  const sections = [];
  const parts = clean.split(/^## /m).slice(1);
  for (const part of parts) {
    const nlIdx = part.indexOf("\n");
    const heading = part.slice(0, nlIdx).trim();
    const body = part.slice(nlIdx + 1).trim();
    // Split into paragraphs (separated by blank lines), skip subheadings
    const paragraphs = body
      .split(/\n\n+/)
      .map((p) => p.replace(/^#+\s+/gm, "").trim())
      .filter((p) => p.length > 0);
    sections.push({ heading, paragraphs });
  }
  return sections;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n=== SEO Content Import ${DRY_RUN ? "(DRY-RUN)" : "(LIVE)"} ===\n`);

  // 1. Load env
  loadEnv();
  requireEnv("NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY");

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );

  // 2. Load source files
  console.log("Loading source files...");
  const products = readJson("products.json");
  const categories = readJson("categories.json");
  const pagesSeo = readJson("pages-seo.json");
  const faqItems = readJson("faq.json");
  const postsTxt = readFileSync(resolve(SEO_DIR, "posts.txt"), "utf-8");
  const aboutMd = readFileSync(resolve(SEO_DIR, "about.md"), "utf-8");
  const termsMd = readFileSync(resolve(SEO_DIR, "terms.md"), "utf-8");
  const privacyMd = readFileSync(resolve(SEO_DIR, "privacy.md"), "utf-8");
  const posts = parsePosts(postsTxt);
  console.log(
    `  Loaded: ${products.length} products, ${categories.length} categories, ` +
    `${pagesSeo.length} page SEO, ${faqItems.length} FAQ items, ${posts.length} blog posts`
  );

  // 3. Validate
  console.log("\nValidating character limits...");
  const errors = [
    ...validateProducts(products),
    ...validateCategories(categories),
    ...validatePagesSeo(pagesSeo),
  ];
  if (errors.length) {
    console.error("\nVALIDATION FAILED — fix these before importing:\n");
    errors.forEach((e) => console.error("  ✗", e));
    process.exit(1);
  }
  console.log("  ✓ All validations passed.");

  // 4. Backup current DB data
  if (!DRY_RUN) {
    console.log("\nBacking up current database values...");

    const { data: dbProducts } = await supabase
      .from("jf_products")
      .select("slug, short_description, description, seo_title, seo_description");
    writeBackup("products-before-import.json", dbProducts || []);

    const { data: dbCategories } = await supabase
      .from("jf_categories")
      .select("slug, description, seo_title, seo_description");
    writeBackup("categories-before-import.json", dbCategories || []);

    const { data: dbPagesSeo } = await supabase
      .from("jf_pages_seo")
      .select("page_key, seo_title, seo_description");
    writeBackup("pages-seo-before-import.json", dbPagesSeo || []);

    const { data: dbPosts } = await supabase
      .from("jf_blog_posts")
      .select("slug, title, excerpt, seo_title, seo_description");
    writeBackup("blog-posts-before-import.json", dbPosts || []);
  }

  // 5. Import products
  console.log("\n→ Importing products...");
  const prodResult = await importProducts(supabase, products);
  console.log(`  Products updated: ${prodResult.updated}, not found: ${prodResult.notFound.length}`);

  // 6. Import categories
  console.log("\n→ Importing categories...");
  const catResult = await importCategories(supabase, categories);
  console.log(`  Categories updated: ${catResult.updated}, not found: ${catResult.notFound.length}`);

  // 7. Import page SEO
  console.log("\n→ Importing page SEO...");
  const pagesResult = await importPagesSeo(supabase, pagesSeo);
  console.log(`  Page SEO upserted: ${pagesResult.upserted}`);

  // 8. Import blog posts
  console.log("\n→ Importing blog posts...");
  const postsResult = await importBlogPosts(supabase, posts);
  console.log(`  Blog posts upserted: ${postsResult.upserted}`);

  // 9. Update static source pages
  console.log("\n→ Updating static pages...");
  updateFaqPage(faqItems);
  updateAboutPage(aboutMd);
  updateTermsPage(termsMd);
  updatePrivacyPage(privacyMd);

  // 10. Summary
  console.log("\n=== Done ===");
  console.log(`Products updated: ${prodResult.updated}`);
  if (prodResult.notFound.length)
    console.log(`  ⚠ Products not in DB: ${prodResult.notFound.join(", ")}`);
  console.log(`Categories updated: ${catResult.updated}`);
  if (catResult.notFound.length)
    console.log(`  ⚠ Categories not in DB: ${catResult.notFound.join(", ")}`);
  console.log(`Page SEO upserted: ${pagesResult.upserted}`);
  console.log(`Blog posts upserted: ${postsResult.upserted}`);
  if (DRY_RUN) console.log("\n(All writes skipped — DRY-RUN mode)");
}

main().catch((err) => {
  console.error("\nFATAL:", err.message);
  process.exit(1);
});
