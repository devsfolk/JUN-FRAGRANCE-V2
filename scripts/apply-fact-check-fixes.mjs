/**
 * scripts/apply-fact-check-fixes.mjs
 *
 * One-off script to update product descriptions, category men, and faq page SEO.
 * Backs up affected rows, validates length limits, and applies updates.
 *
 * Usage:
 *   node scripts/apply-fact-check-fixes.mjs --dry-run
 *   node scripts/apply-fact-check-fixes.mjs --apply
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { WebSocket } from "ws";

if (typeof globalThis.WebSocket === "undefined") {
  globalThis.WebSocket = WebSocket;
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const BACKUP_DIR = resolve(ROOT, "backups");

const APPLY = process.argv.includes("--apply");

function loadEnv() {
  const envPath = resolve(ROOT, ".env.local");
  if (!existsSync(envPath)) return {};
  const content = readFileSync(envPath, "utf8");
  const env = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    else if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
    env[key] = val;
  }
  return env;
}

const env = loadEnv();
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function wordCount(str) {
  if (!str) return 0;
  return str.trim().split(/\s+/).filter(Boolean).length;
}

// Exact planned product updates
const PRODUCT_UPDATES = {
  "aventus-crown": {
    description: "Aventus Crown is for men who want a scent with presence. The name carries a regal, confident mood, and it suits dinners, weddings and nights out more than a quiet day at work.\n\nSpray on the neck and wrists. It gives men an assured, sharp feel for festive occasions and formal evening gatherings. Bottle size is 50 ml and the price is Rs. 1,999. A 7-day return policy applies."
  },
  "black-atlas": {
    description: "Black Atlas leans dark and serious. The name suggests depth, stone and night air, and that fits an evening scent more than a quick daytime spray. It is unisex, so it works for whoever grabs it first.\n\nDress it up for dinners and events, or keep it for cooler weather. It offers a quiet, composed presence for late gatherings and cooler nights. Order the 50 ml bottle for Rs. 1,999 on WhatsApp.",
    seo_description: "Black Atlas is a unisex perfume with a deep, shadowy mood. 50 ml, Rs. 1,999. Order on WhatsApp across Pakistan."
  },
  "bleu-exclusif": {
    seo_description: "Bleu Exclusif is a unisex 50 ml perfume for Rs. 1,999 in Pakistan. Message us on WhatsApp to order."
  },
  "deep-sea": {
    description: "Deep Sea is a unisex perfume with a watery, open feel suggested by its name. It is the kind of scent that fits a humid Karachi evening, a beach drive or a day outdoors.\n\nIf you prefer fresh over sweet, this is worth a look. Spray lightly at first, then add more if you want it stronger. A 50 ml bottle is Rs. 1,999.",
    seo_description: "Deep Sea is a unisex perfume with a cool, watery feel. 50 ml, Rs. 1,999. Order on WhatsApp across Pakistan."
  },
  "ember-veil": {
    description: "Ember Veil has a warm, slow, slightly mysterious mood, like a fire dying down in a dark room. It leans soft and glowing rather than sharp.\n\nUnisex, so it can be worn by anyone and shared at home. It fits evenings, winter weddings and quiet dinners better than a hot afternoon. Its glowing, subdued character makes it a comforting choice for cool nights and intimate gatherings. One 50 ml bottle costs Rs. 1,999."
  },
  "flora-royale": {
    description: "Flora Royale is a women's perfume with a floral mood and a slightly formal finish. It is the kind of scent that goes with a pressed shalwar kameez, a mehndi or a bright lunch rather than a gym bag.\n\nSpray on the wrists and behind the ears, and keep the bottle away from sunlight. It offers women a refined, celebratory feel for daytime events and family occasions. The 50 ml size costs Rs. 1,999.",
    seo_description: "Flora Royale is a women's perfume with a floral feel. 50 ml, Rs. 1,999. Order on WhatsApp across Pakistan."
  },
  "golden-extrait": {
    description: "Golden Extrait has a warm and rich mood, the kind you associate with gold jewellery and festive evenings. It is unisex, so there is no reason to read the label by gender.\n\nThe mood is full, glowing and a little luxurious. Its radiant warmth makes it a natural evening selection for celebratory gatherings and shared special moments. It makes a good gift, and a 50 ml bottle costs Rs. 1,999.",
    seo_description: "Golden Extrait is a unisex perfume with a warm, rich mood. 50 ml, Rs. 1,999. Order on WhatsApp across Pakistan."
  },
  "guilty-elixir": {
    description: "Guilty Elixir is a unisex perfume with a dark, playful mood. The name hints at a late night and a little mischief, so it suits evenings, parties and dinners with friends better than a quiet morning.\n\nThe bold, spirited character gives whoever wears it a confident edge for nights out. It brings a lively presence to weekend dinners and social gatherings. Each bottle is 50 ml and costs Rs. 1,999."
  },
  "imperial-spice": {
    description: "Imperial Spice has a warm, spicy mood, and the name leaves little doubt about that. It is unisex, a good fit for cooler evenings, Eid gatherings and winter weddings.\n\nWarm scents tend to feel heavy in strong heat, so use fewer sprays in summer. It gives both men and women a stately, inviting presence suited for festive nights and formal celebrations. One 50 ml bottle is Rs. 1,999.",
    seo_description: "Imperial Spice is a unisex perfume with a warm, spicy mood. 50 ml, Rs. 1,999. Order on WhatsApp across Pakistan."
  },
  "kirki-royale-for-women": {
    description: "Kirki Royale (For Women) is the women's bottle of a pair. A men's version is sold separately, so check you are picking the right one. The name suggests something polished and a little formal, which suits weddings, dinners and festive days.\n\nSpray on wrists and behind the ears and let it settle. It provides women a graceful, dressed-up feel for family functions and celebratory occasions. It comes in 50 ml for Rs. 1,999."
  },
  "libre-essence": {
    short_description: "A unisex 50 ml perfume for easy everyday wear. Rs. 1,999, ordered directly on WhatsApp.",
    seo_description: "Libre Essence is a unisex 50 ml perfume for Rs. 1,999. Order on WhatsApp across Pakistan for easy everyday wear."
  },
  "lost-kingdom": {
    seo_description: "Lost Kingdom is a unisex perfume with an aquatic mood. 50 ml for Rs. 1,999. Order on WhatsApp across Pakistan."
  },
  "office-rizz": {
    seo_description: "Office Rizz is a men's perfume with citrus, woody and musky amber notes. 50 ml, Rs. 1,999. Order on WhatsApp in Pakistan."
  },
  "prism-22": {
    seo_description: "Prism 22 is a women's 50 ml perfume at Rs. 1,999. Order on WhatsApp across Pakistan."
  },
  "regal-oud": {
    description: "Regal Oud is a unisex perfume whose name points to oud, a scent many Pakistani buyers already know from attar and incense. Expect a deep, woody and dignified mood rather than something fresh and sporty.\n\nIt suits Eid, weddings, Jumma and other occasions where you want to smell proper. Two or three sprays on the skin go a long way. A 50 ml bottle costs Rs. 1,999."
  },
  "stronger-oud": {
    description: "Stronger Oud is for people who like oud-style perfumes with some force behind them. The name signals a bold mood, so treat it as an evening or occasion scent.\n\nIt is unisex, and a good pick for couples or friends who share a dresser. Begin with two sprays and add more only if you want it louder. One bottle is 50 ml and costs Rs. 1,999."
  },
  "velvet-bloom": {
    description: "Velvet Bloom is a women's perfume with a soft, floral mood. The name pairs something smooth with something blooming, and that is the feel to expect: gentle, rounded and easy to like.\n\nIt suits daily wear, family functions and gifting. Choose it if you prefer flowers to fruit or smoke. It provides women a graceful, pleasant impression suited for everyday wear and shared family gatherings. A 50 ml bottle is Rs. 1,999.",
    seo_description: "Velvet Bloom is a women's perfume with a soft, floral mood. 50 ml, Rs. 1,999. Order on WhatsApp across Pakistan."
  },
  "y-series": {
    short_description: "A men's perfume with a clean, modern mood. 50 ml bottle, Rs. 1,999.",
    description: "Y Series is a men's perfume with a clean, modern mood. It is aimed at men who want something simple, current and easy to wear to college, the office or a casual evening.\n\nNo heavy drama here. It is a sensible first bottle if you are new to perfume. It offers a neat, versatile impression that fits daily office hours, classes and informal nights out. You get 50 ml for Rs. 1,999.",
    seo_description: "Y Series is a men's perfume in 50 ml for Rs. 1,999. Order on WhatsApp across Pakistan for clean daily wear."
  },
  "zen-miyaki": {
    short_description: "A men's perfume with a calm, clean mood. 50 ml bottle, Rs. 1,999.",
    description: "Zen Miyaki is a men's perfume with a calm, clean mood. The name points to stillness and tidy simplicity, so it suits quiet mornings, Fridays, long study days and relaxed meetings.\n\nIt is the sort of scent that smells neat without announcing itself. If you like to keep things simple, start here. It provides men a tidy, understated impression that wears comfortably through warm days and relaxed hours. A 50 ml bottle is Rs. 1,999."
  }
};

const CATEGORY_UPDATES = {
  "men": {
    seo_description: "Shop men's perfumes in Pakistan: 50 ml bottles at Rs. 1,999, any 3 for Rs. 4,500. Browse fresh, woody and evening scents to order on WhatsApp."
  }
};

const PAGE_SEO_UPDATES = {
  "faq": {
    seo_description: "Frequently asked questions about ordering Jun.fragrance perfumes on WhatsApp, bottle sizes, 7-day returns, exchanges and perfume storage."
  }
};

async function main() {
  console.log(`MODE: ${APPLY ? "=== APPLYING CHANGES ===" : "=== DRY RUN (VALIDATE ONLY) ==="}`);

  // 1. Fetch current data
  const { data: currentProducts, error: pErr } = await supabase.from("jf_products").select("*").order("slug");
  if (pErr) throw pErr;
  const { data: currentCategories, error: cErr } = await supabase.from("jf_categories").select("*");
  if (cErr) throw cErr;
  const { data: currentPagesSeo, error: psErr } = await supabase.from("jf_pages_seo").select("*");
  if (psErr) throw psErr;

  // 2. Backup affected rows
  if (!existsSync(BACKUP_DIR)) mkdirSync(BACKUP_DIR, { recursive: true });
  const backupFile = resolve(BACKUP_DIR, `fact-check-backup-${Date.now()}.json`);
  const backupData = {
    timestamp: new Date().toISOString(),
    products: currentProducts.filter(p => PRODUCT_UPDATES[p.slug]),
    categories: currentCategories.filter(c => CATEGORY_UPDATES[c.slug]),
    pages_seo: currentPagesSeo.filter(ps => PAGE_SEO_UPDATES[ps.page_key]),
  };
  writeFileSync(backupFile, JSON.stringify(backupData, null, 2), "utf8");
  console.log(`Backup of affected rows saved to: ${backupFile}`);

  // 3. Validation & Before/After display
  console.log("\n==================== BEFORE / AFTER REPORT ====================");

  let validationErrors = [];

  // Products
  for (const [slug, fields] of Object.entries(PRODUCT_UPDATES)) {
    const curr = currentProducts.find(p => p.slug === slug);
    if (!curr) {
      validationErrors.push(`Product not found: ${slug}`);
      continue;
    }
    console.log(`\nPRODUCT [${slug}]:`);
    for (const [field, newVal] of Object.entries(fields)) {
      const oldVal = curr[field];
      console.log(`  FIELD: ${field}`);
      console.log(`    BEFORE: "${oldVal}"`);
      console.log(`    AFTER:  "${newVal}"`);

      // Validation
      if (field === "description") {
        const wc = wordCount(newVal);
        if (wc < 60 || wc > 90) {
          validationErrors.push(`[${slug}] description word count ${wc} is not between 60 and 90 words!`);
        } else {
          console.log(`    -> Word count: ${wc} (VALID: 60-90)`);
        }
      }
      if (field === "short_description") {
        if (newVal.length > 140) {
          validationErrors.push(`[${slug}] short_description length ${newVal.length} > 140!`);
        } else {
          console.log(`    -> Length: ${newVal.length} chars (VALID: <= 140)`);
        }
      }
      if (field === "seo_description") {
        if (newVal.length > 155) {
          validationErrors.push(`[${slug}] seo_description length ${newVal.length} > 155!`);
        }
        if (!newVal.includes("Pakistan")) validationErrors.push(`[${slug}] seo_description missing 'Pakistan'!`);
        if (!newVal.includes("Rs. 1,999")) validationErrors.push(`[${slug}] seo_description missing 'Rs. 1,999'!`);
        if (!newVal.includes("WhatsApp")) validationErrors.push(`[${slug}] seo_description missing 'WhatsApp'!`);
        console.log(`    -> Length: ${newVal.length} chars, contains Pakistan/Rs. 1,999/WhatsApp`);
      }
    }
  }

  // Categories
  for (const [slug, fields] of Object.entries(CATEGORY_UPDATES)) {
    const curr = currentCategories.find(c => c.slug === slug);
    console.log(`\nCATEGORY [${slug}]:`);
    for (const [field, newVal] of Object.entries(fields)) {
      const oldVal = curr[field];
      console.log(`  FIELD: ${field}`);
      console.log(`    BEFORE: "${oldVal}"`);
      console.log(`    AFTER:  "${newVal}"`);
      if (field === "seo_description" && newVal.length > 155) {
        validationErrors.push(`[category:${slug}] seo_description length ${newVal.length} > 155!`);
      }
    }
  }

  // Page SEO
  for (const [page_key, fields] of Object.entries(PAGE_SEO_UPDATES)) {
    const curr = currentPagesSeo.find(ps => ps.page_key === page_key);
    console.log(`\nPAGE_SEO [${page_key}]:`);
    for (const [field, newVal] of Object.entries(fields)) {
      const oldVal = curr[field];
      console.log(`  FIELD: ${field}`);
      console.log(`    BEFORE: "${oldVal}"`);
      console.log(`    AFTER:  "${newVal}"`);
      if (field === "seo_description" && newVal.length > 155) {
        validationErrors.push(`[page_seo:${page_key}] seo_description length ${newVal.length} > 155!`);
      }
    }
  }

  if (validationErrors.length > 0) {
    console.error("\nVALIDATION FAILED:");
    validationErrors.forEach(e => console.error(" - " + e));
    process.exit(1);
  }

  console.log("\nALL VALIDATIONS PASSED!");

  if (!APPLY) {
    console.log("\nDry run completed successfully. To apply to database, run with --apply.");
    return;
  }

  // 4. Apply to database
  console.log("\nApplying updates to Supabase...");

  for (const [slug, fields] of Object.entries(PRODUCT_UPDATES)) {
    const { error } = await supabase.from("jf_products").update(fields).eq("slug", slug);
    if (error) throw new Error(`Failed to update product ${slug}: ${error.message}`);
    console.log(`  ✓ Updated jf_products: ${slug}`);
  }

  for (const [slug, fields] of Object.entries(CATEGORY_UPDATES)) {
    const { error } = await supabase.from("jf_categories").update(fields).eq("slug", slug);
    if (error) throw new Error(`Failed to update category ${slug}: ${error.message}`);
    console.log(`  ✓ Updated jf_categories: ${slug}`);
  }

  for (const [page_key, fields] of Object.entries(PAGE_SEO_UPDATES)) {
    const { error } = await supabase.from("jf_pages_seo").update(fields).eq("page_key", page_key);
    if (error) throw new Error(`Failed to update jf_pages_seo ${page_key}: ${error.message}`);
    console.log(`  ✓ Updated jf_pages_seo: ${page_key}`);
  }

  // 5. Also sync to seo-content/ json files so repo is in sync
  const productsJsonPath = resolve(ROOT, "seo-content", "products.json");
  if (existsSync(productsJsonPath)) {
    const pJson = JSON.parse(readFileSync(productsJsonPath, "utf8"));
    for (const item of pJson) {
      if (PRODUCT_UPDATES[item.slug]) {
        Object.assign(item, PRODUCT_UPDATES[item.slug]);
      }
    }
    writeFileSync(productsJsonPath, JSON.stringify(pJson, null, 2), "utf8");
    console.log("  ✓ Updated seo-content/products.json");
  }

  const catJsonPath = resolve(ROOT, "seo-content", "categories.json");
  if (existsSync(catJsonPath)) {
    const cJson = JSON.parse(readFileSync(catJsonPath, "utf8"));
    for (const item of cJson) {
      if (CATEGORY_UPDATES[item.slug]) {
        Object.assign(item, CATEGORY_UPDATES[item.slug]);
      }
    }
    writeFileSync(catJsonPath, JSON.stringify(cJson, null, 2), "utf8");
    console.log("  ✓ Updated seo-content/categories.json");
  }

  const pagesJsonPath = resolve(ROOT, "seo-content", "pages-seo.json");
  if (existsSync(pagesJsonPath)) {
    const psJson = JSON.parse(readFileSync(pagesJsonPath, "utf8"));
    for (const item of psJson) {
      if (PAGE_SEO_UPDATES[item.page_key]) {
        Object.assign(item, PAGE_SEO_UPDATES[item.page_key]);
      }
    }
    writeFileSync(pagesJsonPath, JSON.stringify(psJson, null, 2), "utf8");
    console.log("  ✓ Updated seo-content/pages-seo.json");
  }

  console.log("\nDATABASE AND REPO SYNC COMPLETE!");
}

main().catch(console.error);
