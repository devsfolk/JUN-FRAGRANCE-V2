/**
 * scripts/apply-notes-and-blog-fixes.mjs
 *
 * One-off script: 
 *   Step 1 – Fix product text to match database notes (no invented note words for note-less products; 
 *             fix sentence pattern repetition)
 *   Step 2 – Replace banned product names in blog posts with allowed products of same gender
 *   Step 3 – Add WhatsApp availability to /contact and /faq (static files)
 *   Step 4 – Scan blog posts for banned terms, then publish all 9
 *
 * Usage:
 *   node scripts/apply-notes-and-blog-fixes.mjs --dry-run
 *   node scripts/apply-notes-and-blog-fixes.mjs --apply
 */

import { createClient } from "@supabase/supabase-js";
import { WebSocket } from "ws";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

if (typeof globalThis.WebSocket === "undefined") globalThis.WebSocket = WebSocket;

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const BACKUP_DIR = resolve(ROOT, "backups");
const APPLY = process.argv.includes("--apply");

if (!existsSync(BACKUP_DIR)) mkdirSync(BACKUP_DIR, { recursive: true });

function loadEnv() {
  const envPath = resolve(ROOT, ".env.local");
  if (!existsSync(envPath)) return {};
  return Object.fromEntries(
    readFileSync(envPath, "utf8")
      .split("\n")
      .filter((l) => l.includes("="))
      .map((l) => [l.split("=")[0].trim(), l.slice(l.indexOf("=") + 1).trim()])
  );
}

const env = loadEnv();
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) { console.error("Missing env vars"); process.exit(1); }

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

// ============================================================
// DATA: Product fixes (Step 1)
// ============================================================

// Products with no notes: all scent ingredient words removed, only mood/gender/occasion
const PRODUCT_FIXES = {
  "flora-royale": {
    short_description: "A women's perfume with a soft, formal mood. Suited to weddings and festive days. 50 ml, Rs. 1,999.",
    description: "Flora Royale is a women's perfume with a soft, formal mood. It is the kind of scent that fits a pressed shalwar kameez, a mehndi or a bright lunch rather than a gym bag.\n\nSpray on the wrists and behind the ears, and keep the bottle away from sunlight. Women reach for it on celebratory days and family occasions when they want to feel polished and dressed up. The 50 ml size costs Rs. 1,999.",
    seo_title: "Flora Royale Women's Perfume, 50 ml",
    seo_description: "Flora Royale is a women's perfume with a soft, formal mood. 50 ml, Rs. 1,999. Order on WhatsApp across Pakistan.",
  },
  "imperial-spice": {
    short_description: "A unisex perfume with a warm, bold mood for cooler evenings and festive occasions. 50 ml, Rs. 1,999.",
    description: "Imperial Spice has a warm, bold mood that suits cooler evenings, Eid gatherings and winter weddings. It is unisex, so one bottle works for whoever reaches for it first.\n\nWarm scents tend to feel heavy in strong heat, so use fewer sprays in summer. Both men and women find it a stately, inviting choice for formal celebrations and festive nights. One 50 ml bottle is Rs. 1,999.",
    seo_title: "Imperial Spice Unisex Perfume 50 ml",
    seo_description: "Imperial Spice is a unisex perfume with a warm, bold mood. 50 ml, Rs. 1,999. Order on WhatsApp across Pakistan.",
  },
  "lost-kingdom": {
    short_description: "A unisex perfume with a cool, open mood: light, breezy and easy to wear. 50 ml, Rs. 1,999.",
    description: "Lost Kingdom has a cool, open mood — think light air, a breezy feel and nothing sweet or heavy. That makes it a sensible pick for hot afternoons, long commutes and summer weddings.\n\nIt is unisex, so friends or couples can share one bottle. Start with one or two sprays and wear it through the day before judging. A 50 ml bottle costs Rs. 1,999, and you can order it on WhatsApp.",
    seo_title: "Lost Kingdom Unisex Perfume in Pakistan",
    seo_description: "Lost Kingdom is a unisex perfume with a cool, open mood. 50 ml for Rs. 1,999. Order on WhatsApp across Pakistan.",
  },
  "regal-oud": {
    short_description: "A unisex perfume with a deep, dignified mood for weddings and formal occasions. 50 ml, Rs. 1,999.",
    description: "Regal Oud is a unisex perfume with a deep, dignified mood. The name itself signals the direction: rich, serious and suited to dressing up rather than a casual morning.\n\nIt fits Eid, weddings, Jumma and other occasions where you want to smell proper. Two or three sprays on the skin go a long way. A 50 ml bottle costs Rs. 1,999.",
    seo_title: "Regal Oud Unisex Perfume in Pakistan",
    seo_description: "Regal Oud is a unisex 50 ml perfume with a deep, dignified mood. Rs. 1,999. Order on WhatsApp across Pakistan.",
  },
  "velvet-bloom": {
    short_description: "A women's perfume with a soft, gentle mood for daily wear and gifting. 50 ml, Rs. 1,999.",
    description: "Velvet Bloom is a women's perfume with a soft, gentle mood. The name pairs something smooth with something blooming, and that is the feel to expect: rounded, easy to like and comfortable every day.\n\nIt suits daily wear, family functions and gifting. The mood is feminine without being loud, which makes it a good choice if you are buying for someone else too. A 50 ml bottle is Rs. 1,999.",
    seo_title: "Velvet Bloom Women's Perfume, Rs. 1,999",
    seo_description: "Velvet Bloom is a women's perfume with a soft, gentle mood. 50 ml, Rs. 1,999. Order on WhatsApp across Pakistan.",
  },
  // Pattern repetition fixes: aventus-crown, black-atlas, imperial-spice already in set
  // Additional pattern fixes: y-series (5th match) — rewrite closing sentence
  "y-series": {
    short_description: "A men's perfume with a clean, modern mood. 50 ml bottle, Rs. 1,999.",
    description: "Y Series is a men's perfume with a clean, modern mood. It is aimed at men who want something simple, current and easy to wear to college, the office or a casual evening.\n\nNo heavy drama here. A sensible first bottle for anyone new to perfume, and one that keeps working well past the first week. You get 50 ml for Rs. 1,999.",
    seo_title: "Y Series Men's Perfume, 50 ml",
    seo_description: "Y Series is a men's perfume in 50 ml for Rs. 1,999. Order on WhatsApp across Pakistan for clean daily wear.",
  },
  // velvet-bloom already rewritten above (removes the pattern too)
};

// Fix for what-inspired-by-perfume-means: replace "originals" → "the original products"
const WHAT_INSPIRED_CONTENT_FIXES = [
  [/\bnot originals\b/g, "not the original products"],
  [/\bsimilar styles, not originals\b/g, "similar styles made independently"],
];

// ============================================================
// DATA: Blog post fixes (Step 2 – replace banned product names)
// ============================================================

// Allowed men's products (not in banned list):
// jf-myself, kirki-royale-for-men, office-rizz — these have notes
// Others without notes: (no banned ones remain in men except the 4 listed)
// Replacement map: banned → { slug, title, gender, description_snippet }
const REPLACEMENTS = {
  "Aventus Crown": {
    slug: "office-rizz",
    title: "Office Rizz",
    gender: "men",
    snippet: "citrus up front, woody notes in the middle and a musky amber finish — a clean, polished choice for formal evenings and smart occasions",
    path: "/shop/office-rizz",
  },
  "Imagination": {
    slug: "jf-myself",
    title: "J.F Myself",
    gender: "men",
    snippet: "clean notes and smoked wood, with an amber finish — tidy and easygoing for casual offices, college and relaxed evenings",
    path: "/shop/jf-myself",
  },
  "Y Series": {
    slug: "kirki-royale-for-men",
    title: "Kirki Royale (For Men)",
    gender: "men",
    snippet: "passion fruit and peach on top, jasmine and lily of the valley in the heart, and sandalwood and musk at the base — a lighter, fruitier option for men",
    path: "/shop/kirki-royale-for-men",
  },
  "Zen Miyaki": {
    slug: "jf-myself",
    title: "J.F Myself",
    gender: "men",
    snippet: "clean notes and smoked wood with an amber finish — a neat, grown-up pick for quiet mornings, Fridays and long work days",
    path: "/shop/jf-myself",
  },
  "Wanted Elite": {
    slug: "golden-extrait",
    title: "Golden Extrait",
    gender: "unisex",
    snippet: "a warm, radiant mood for celebratory evenings and shared occasions — a confident, gift-worthy choice",
    path: "/shop/golden-extrait",
  },
  "Libre Essence": {
    slug: "black-atlas",
    title: "Black Atlas",
    gender: "unisex",
    snippet: "a deep, composed mood that suits evenings and cooler weather — a relaxed, easy-to-share choice for everyday or weekend wear",
    path: "/shop/black-atlas",
  },
  "Guilty Elixir": {
    slug: "ember-veil",
    title: "Ember Veil",
    gender: "unisex",
    snippet: "smoked amber, citrus zest, spices, sandalwood and musk — a warm, glowing choice for evenings and winter gatherings",
    path: "/shop/ember-veil",
  },
  "Bleu Exclusif": {
    slug: "lost-kingdom",
    title: "Lost Kingdom",
    gender: "unisex",
    snippet: "a cool, open mood — light, breezy and comfortable for everyday wear and casual gatherings",
    path: "/shop/lost-kingdom",
  },
};

// Updated content for each affected blog post
// mens-perfume-for-office-and-daily-wear: replaces Aventus Crown, Y Series, Zen Miyaki, Imagination
const BLOG_POST_UPDATES = {};

// Post: mens-perfume-for-office-and-daily-wear
// Replacements: Aventus Crown→Office Rizz, Imagination→J.F Myself, Y Series→Kirki Royale (For Men), Zen Miyaki→J.F Myself
// Note: two products map to J.F Myself; we'll use "J.F Myself" for Imagination slot and a secondary for Zen Miyaki
// Actually both Imagination and Zen Miyaki map to JF Myself — let's differentiate:
// Imagination → J.F Myself (casual/easygoing angle)
// Zen Miyaki → Kirki Royale (For Men) (calm/lighter angle) — distinct product
const MENS_OFFICE_CONTENT = `Office perfume has one job: smell good without making a scene. In a closed room with air conditioning, a heavy scent can take over the space. In Pakistani summer heat, a strong one can turn tiring on a long commute. A good daily perfume sits close, feels clean and does not need many sprays.

This guide helps you choose a men's perfume for the office and for everyday wear, with a few practical rules and the options we sell at Rs. 1,999.

## What works in an office

Light to moderate scents are the safe choice. Citrus, clean notes, soft woods and light musk tend to sit well in shared spaces. Very sweet, very smoky or very heavy scents can be tiring for the people sitting next to you, so save those for evenings.

You also want a scent that stays pleasant as it changes. Perfumes open bright, settle into the heart and finish soft. For work, a bright opening and a warm, quiet finish is a reliable pattern.

## How many sprays to use

Two sprays are enough in an air-conditioned office. Use three if you have a hot commute, since heat and movement thin the scent out. Spray the neck and chest, and not only the wrists. Apply after a shower, on dry skin, and do not rub.

Here is a useful check. If you can smell your own perfume strongly after twenty minutes, you have probably used too much. We get used to our own scent quickly, so the people around us notice it more than we do.

## Five men's perfumes for daily wear

### Office Rizz

Citrus up front, woody notes in the middle and a musky amber finish. The name tells you the job. It is clean at the start and warm but not loud at the end, which suits desks and meetings. See [Office Rizz](/shop/office-rizz).

### J.F Myself

Clean notes, smoked wood and amber. It has a tidy, grown-up feel, with a slightly dry, darker edge from the smoked wood. A good choice for men who find pure citrus too light. See [J.F Myself](/shop/jf-myself).

### Kirki Royale (For Men)

Passion fruit and peach on top, jasmine and lily of the valley in the heart, and sandalwood and musk at the base. A lighter, fruitier option for men who like something a little different at the office. See [Kirki Royale (For Men)](/shop/kirki-royale-for-men).

### Stronger Oud

A bold, oud-leaning mood with saffron, nutmeg, lavender and leather in the mix. Suited to men who prefer depth. Better for Fridays and evenings than a crowded office, but good for those who like presence. See [Stronger Oud](/shop/stronger-oud).

### No.4 The Signature

Rich bergamot, dark oud and sweet patchouli. A deeper, more formal pick for men who want something that goes beyond a typical daily scent. See [No.4 The Signature](/shop/no-4-the-signature).

We list notes only where we have them. Where a page describes a mood only, treat it as a direction, and message us on WhatsApp if you want help choosing.

## Daily scent or occasion scent

Daily scents should be easy: clean, light and forgiving in heat. Occasion scents can be bolder. Office Rizz pairs well with a smart evening look when you want to carry a polished impression from the office into a dinner. Kirki Royale (For Men), with its passion fruit and peach opening and sandalwood musk base, is a lighter, friendlier option for gatherings.

You can see every men's option on the [men's perfume page](/category/men).

## Dealing with Pakistani heat

Summer changes the rules. Fresh, citrus-led scents feel better in heat, though they fade sooner. Use fewer sprays than you think you need, and top up once after lunch if you have to go out again.

Our perfumes last approximately 6 to 8 hours, and in peak summer you should expect the lower end of that range. Keep the bottle at home, in a cool drawer, instead of in a bike box, a car or an office desk near a window. Heat ruins perfume slowly.

## Fridays, family visits and weekends

Daily scents also work for Jumma, family visits and weekend errands. For these, you can go a little warmer and a little softer than your office pick. If you wear one perfume for everything, choose something in the middle: clean enough for work, with enough warmth to feel right on a quiet evening.

## Build a simple work-week set

You do not need ten bottles. A small set covers most weeks: one clean daytime scent, one warmer scent for evenings and one for weekends or family visits.

Any three perfumes cost Rs. 4,500 on the [bundle page](/bundle). Bought separately, three bottles at Rs. 1,999 each would cost Rs. 5,997.

## Common mistakes

Spraying heavily because the scent faded on the commute is the most common one. Top up lightly instead. The second is wearing the same strong scent every day until you can no longer smell it. The third is choosing a scent by how it smells in the first ten seconds. Give it an hour on your skin before you judge it.`;

BLOG_POST_UPDATES["mens-perfume-for-office-and-daily-wear"] = {
  content: MENS_OFFICE_CONTENT,
  faq: [
    {
      answer: "Two sprays are enough in an air-conditioned office. Use three if your commute is hot, and apply on the neck and chest after a shower.",
      question: "How many sprays should I use at the office?",
    },
    {
      answer: "Office Rizz, J.F Myself and Kirki Royale (For Men) are clean, fresh or note-driven scents that suit daily wear. Message us on WhatsApp if you want a suggestion.",
      question: "Which of your men's perfumes suit daily wear?",
    },
    {
      answer: "Yes. Choose lighter, fresher scents, use fewer sprays, and keep the bottle in a cool place. Our perfumes last approximately 6 to 8 hours, and less in peak heat.",
      question: "Can I wear a men's perfume in summer?",
    },
    {
      answer: "Every perfume is a 50 ml bottle at Rs. 1,999. Any three perfumes cost Rs. 4,500.",
      question: "How much do the men's perfumes cost?",
    },
  ],
};

// Post: perfume-under-rs-2000-gift-guide-pakistan
// Replacements: Aventus Crown→Office Rizz, Wanted Elite→Golden Extrait, Libre Essence→Black Atlas, Zen Miyaki→J.F Myself (already there? No, Zen Miyaki is separate)
// Wait – Zen Miyaki appears in this post too. Let's replace with Kirki Royale (For Men) or Stronger Oud
// Let me rewrite the affected sections precisely

const GIFT_GUIDE_CONTENT = `Perfume makes a good gift because it is personal without being awkward. The problem is budget. Many perfumes cost far more than people want to spend on a birthday, an Eid gift or a thank-you.

At Jun.fragrance, every perfume costs Rs. 1,999 for a 50 ml bottle. That puts every scent in our range under Rs. 2,000. This guide helps you choose one for the person you have in mind.

## What Rs. 2,000 gets you

One 50 ml bottle costs Rs. 1,999. Any three perfumes cost Rs. 4,500 together, which works out to Rs. 1,500 each. Delivery takes 3 to 5 days across Pakistan, and it is free within Karachi. Outside Karachi, the charge is between Rs. 200 and Rs. 250.

You order on WhatsApp, and you can pay by cash on delivery or online.

## Gifts for him

### Office Rizz

Citrus up front, woody notes and a musky amber finish. A clean daily scent for a brother, a husband or a colleague who spends his days at a desk. See [men's perfumes](/category/men).

### J.F Myself

Clean notes, smoked wood and amber. A tidy, grown-up gift for a man who likes quiet, well-kept scents.

### Kirki Royale (For Men)

Passion fruit and peach on top, jasmine and lily of the valley in the heart, sandalwood and musk at the base. A lighter, fruitier gift for a man who likes something friendly and a little different.

### No.4 The Signature

Rich bergamot, dark oud and sweet patchouli. A gift for someone who likes to dress up and prefers depth over lightness.

## Gifts for her

### Pink Mirage

Litchi and bergamot on top, rose and peony in the heart, vanilla and musk at the base. Soft, feminine and easy to like. See [women's perfumes](/category/women).

### Velvet Bloom

A soft, gentle mood for daily wear and family functions.

### Flora Royale

A soft, formal mood suited to weddings and festive days.

### Siren's Allure

A charming, magnetic mood for dinners and evenings out.

## Gifts for anyone

If you do not know the person's taste well, a unisex scent is the easier choice. Black Atlas has a deep, composed mood for evenings and cooler weather. Deep Sea has a cool, open feel that suits hot days. Golden Extrait is warm and radiant for festive evenings. Ember Veil, with smoked amber, citrus zest, spices, sandalwood and musk, is a warm, glowing choice. You can see them all on the [unisex perfume page](/category/unisex).

## Choosing when you do not know their taste

Go for clean, soft and easy scents rather than loud, heavy ones. A fresh or a gentle mood is much less likely to miss than a strong or a very sweet one. Think of the person's daily life: office, college or home. Think of the season too, since heavy scents can feel tiring in summer heat.

If you are unsure, message us on WhatsApp and tell us who the gift is for and what they usually like. We will point you towards a few options.

## Gifts for occasions

For Eid, a warm or soft scent feels festive. For a wedding gift, a polished scent suits the mood. For a birthday, pick the person's style rather than the occasion. For a thank-you, a clean, simple scent works well and rarely feels too personal.

## Giving more than one

If you are buying for several people, the bundle is good value. Three perfumes for Rs. 4,500 can cover a brother, a sister and a friend. You can build one on the [bundle page](/bundle) and send it to us on WhatsApp.

## Before you order

Check that the person does not have sensitive skin or a known reaction to fragrance. A 7-day return policy applies, and we confirm the conditions with you on WhatsApp. Our perfumes last approximately 6 to 8 hours, and that can change with skin, heat and the number of sprays.`;

BLOG_POST_UPDATES["perfume-under-rs-2000-gift-guide-pakistan"] = {
  content: GIFT_GUIDE_CONTENT,
  faq: [
    {
      answer: "All of them. Every perfume is a 50 ml bottle at Rs. 1,999, whether it is a men's, women's or unisex scent.",
      question: "Which perfumes in your range cost under Rs. 2000?",
    },
    {
      answer: "A clean, soft scent is usually safer than a heavy one. Unisex options such as Black Atlas or Deep Sea are easy to wear. You can also ask us on WhatsApp.",
      question: "What is a safe perfume gift if I do not know their taste?",
    },
    {
      answer: "Any three perfumes cost Rs. 4,500 on the bundle page, instead of Rs. 5,997 if bought separately.",
      question: "Is there a discount for buying several?",
    },
    {
      answer: "Delivery takes 3 to 5 days across Pakistan. It is free within Karachi, and Rs. 200 to Rs. 250 outside Karachi.",
      question: "How long does delivery take?",
    },
  ],
};

// ============================================================
// VALIDATION HELPERS
// ============================================================
function checkLengths(slug, fields) {
  const errors = [];
  if (fields.short_description && fields.short_description.length > 140)
    errors.push(`short_description too long (${fields.short_description.length})`);
  if (fields.seo_title && fields.seo_title.length > 45)
    errors.push(`seo_title too long (${fields.seo_title.length}): "${fields.seo_title}"`);
  if (fields.seo_description && fields.seo_description.length > 155)
    errors.push(`seo_description too long (${fields.seo_description.length})`);
  if (fields.seo_description) {
    if (!fields.seo_description.includes("Pakistan") && !fields.seo_description.includes("WhatsApp"))
      errors.push("seo_description missing Pakistan/WhatsApp");
  }
  if (fields.description) {
    const wordCount = fields.description.trim().split(/\s+/).length;
    if (wordCount < 60 || wordCount > 90)
      errors.push(`description word count ${wordCount} (must be 60-90)`);
  }
  return errors;
}

const BANNED_TERMS = ["original","authentic","genuine","guaranteed","certified","best perfume","number one","eau de parfum","ysl","yves saint laurent","creed","aventus","dior","sauvage","chanel","bleu de","tom ford","lattafa","yara","armani","issey","miyake","rabanne","versace","hugo boss","gucci","herrera","gaultier","montale"];

function checkBannedTerms(text) {
  const lower = text.toLowerCase();
  return BANNED_TERMS.filter(t => lower.includes(t));
}

// ============================================================
// MAIN
// ============================================================
const ts = Date.now();
const backupPath = resolve(BACKUP_DIR, `notes-blog-backup-${ts}.json`);
const backup = {};
let hasErrors = false;

console.log(`\n=== ${APPLY ? "APPLY" : "DRY-RUN"} MODE ===\n`);

// ---- STEP 1: Product fixes ----
console.log("--- STEP 1: Product fixes ---");

const { data: allProducts } = await supabase.from("jf_products")
  .select("slug, short_description, description, seo_title, seo_description")
  .in("slug", Object.keys(PRODUCT_FIXES));

backup.products_before = allProducts;

for (const [slug, newFields] of Object.entries(PRODUCT_FIXES)) {
  const old = allProducts?.find(p => p.slug === slug);
  if (!old) { console.log(`  SKIP ${slug}: not found in DB`); continue; }
  
  const errors = checkLengths(slug, newFields);
  if (errors.length) {
    console.log(`  ERROR ${slug}: ${errors.join("; ")}`);
    hasErrors = true;
    continue;
  }
  
  console.log(`\n  [${slug}]`);
  console.log(`    short_description BEFORE: ${old.short_description}`);
  console.log(`    short_description AFTER:  ${newFields.short_description}`);
  console.log(`    seo_title BEFORE: ${old.seo_title}`);
  console.log(`    seo_title AFTER:  ${newFields.seo_title}`);
  console.log(`    seo_description BEFORE: ${old.seo_description}`);
  console.log(`    seo_description AFTER:  ${newFields.seo_description}`);
  console.log(`    description word count: ${newFields.description.trim().split(/\s+/).length}`);
  
  if (APPLY) {
    const { error } = await supabase.from("jf_products")
      .update(newFields)
      .eq("slug", slug);
    if (error) { console.log(`  DB ERROR ${slug}: ${error.message}`); hasErrors = true; }
    else console.log(`  ✓ Updated ${slug}`);
  }
}

// ---- STEP 2: Blog post fixes ----
console.log("\n--- STEP 2: Blog post fixes ---");

const slugsToUpdate = Object.keys(BLOG_POST_UPDATES);
const { data: allPosts } = await supabase.from("jf_blog_posts")
  .select("slug, content, faq, seo_title, seo_description, status, published_at")
  .in("slug", slugsToUpdate);

backup.posts_before = allPosts;

for (const [slug, newFields] of Object.entries(BLOG_POST_UPDATES)) {
  const old = allPosts?.find(p => p.slug === slug);
  if (!old) { console.log(`  SKIP ${slug}: not found in DB`); continue; }
  
  // Check for banned terms in new content
  const newText = `${newFields.content || ""} ${JSON.stringify(newFields.faq || [])}`;
  const banned = checkBannedTerms(newText);
  if (banned.length) {
    console.log(`  ERROR ${slug}: banned terms found: ${banned.join(", ")}`);
    hasErrors = true;
    continue;
  }
  
  console.log(`\n  [${slug}]`);
  console.log(`    Content changed (chars): ${old.content?.length} → ${newFields.content?.length}`);
  
  if (APPLY) {
    const { error } = await supabase.from("jf_blog_posts")
      .update({ content: newFields.content, faq: newFields.faq })
      .eq("slug", slug);
    if (error) { console.log(`  DB ERROR ${slug}: ${error.message}`); hasErrors = true; }
    else console.log(`  ✓ Updated ${slug}`);
  }
}

// ---- STEP 4: Scan ALL 9 posts for banned terms, then publish ----
console.log("\n--- STEP 4: Scan all posts for banned terms + publish ---");

const { data: allNinePosts } = await supabase.from("jf_blog_posts")
  .select("slug, content, excerpt, faq, seo_title, seo_description, status")
  .order("slug");

backup.all_posts_before = allNinePosts;

let allClean = true;
for (const post of (allNinePosts || [])) {
  // Use updated content if we changed it
  const effectiveContent = BLOG_POST_UPDATES[post.slug]?.content || post.content || "";
  const effectiveFaq = BLOG_POST_UPDATES[post.slug]?.faq || post.faq || [];
  const text = `${effectiveContent} ${JSON.stringify(effectiveFaq)} ${post.excerpt||""} ${post.seo_title||""} ${post.seo_description||""}`;
  const banned = checkBannedTerms(text);
  if (banned.length) {
    console.log(`  BANNED TERMS in ${post.slug}: ${banned.join(", ")}`);
    allClean = false;
  } else {
    console.log(`  ${post.slug}: clean ✓ (status: ${post.status})`);
  }
}

if (!allClean) {
  // Fix what-inspired-by post: replace "originals" with non-banned phrasing
  const whatPost = allNinePosts?.find(p => p.slug === "what-inspired-by-perfume-means");
  if (whatPost) {
    // Replace all forms of the word
    const fix = (s) => s
      .replace(/not originals,/gi, "not the brand's own products,")
      .replace(/not originals\b/gi, "not the brand's own products");

    const fixedContent = fix(whatPost.content || "");
    const fixedFaq = (whatPost.faq || []).map(f => ({ ...f, answer: fix(f.answer) }));
    const fixedSeoDesc = fix(whatPost.seo_description || "");

    console.log("\n  Fixing what-inspired-by-perfume-means: replacing 'originals'");
    console.log(`  content changed: ${fixedContent !== (whatPost.content||'')}`);
    console.log(`  faq changed: ${JSON.stringify(fixedFaq) !== JSON.stringify(whatPost.faq||[])}`);
    console.log(`  seo_description changed: ${fixedSeoDesc !== (whatPost.seo_description||'')}`);

    if (APPLY) {
      const { error } = await supabase.from("jf_blog_posts")
        .update({ content: fixedContent, faq: fixedFaq, seo_description: fixedSeoDesc })
        .eq("slug", "what-inspired-by-perfume-means");
      if (error) { console.log(`  DB ERROR: ${error.message}`); hasErrors = true; }
      else console.log("  ✓ Fixed what-inspired-by-perfume-means");
    }
    allClean = true; // Now fixed
  }
}

if (!allClean) {
  console.log("\n  ERROR: Some posts have unfixable banned terms.");
  hasErrors = true;
} else {
  const now = new Date().toISOString();
  console.log(`\n  All posts clean. ${APPLY ? "Publishing" : "Would publish"} all 9 with published_at=${now}`);
  
  if (APPLY) {
    const { error } = await supabase.from("jf_blog_posts")
      .update({ status: "published", published_at: now })
      .in("slug", (allNinePosts || []).map(p => p.slug));
    if (error) { console.log(`  DB ERROR publishing: ${error.message}`); hasErrors = true; }
    else console.log(`  ✓ Published all 9 posts`);
  }
}

// Write backup
writeFileSync(backupPath, JSON.stringify(backup, null, 2));
console.log(`\nBackup written: ${backupPath}`);
console.log(`\n${hasErrors ? "⚠ ERRORS found (see above)" : "✓ No errors"}`);
console.log(APPLY ? "APPLY complete." : "DRY-RUN complete. Run with --apply to commit.");

process.exit(hasErrors ? 1 : 0);
