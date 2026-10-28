/**
 * scripts/seed-catalog.mjs
 * One-time catalog seed. Safe to re-run (idempotent via slug upsert).
 * Usage:  node scripts/seed-catalog.mjs [--dry-run]
 *
 * Reads NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from .env.local
 * Service-role client is ONLY in this file, never imported by the app build.
 */

// Node 20 polyfill — supabase-js realtime requires a global WebSocket
import { WebSocket as _WS } from 'ws';
if (!globalThis.WebSocket) globalThis.WebSocket = _WS;

import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

// ── load .env.local ───────────────────────────────────────────────────────────
const __dir = dirname(fileURLToPath(import.meta.url));
const root  = join(__dir, '..');

function loadEnv() {
  const p = join(root, '.env.local');
  if (!existsSync(p)) {
    console.error('ERROR: .env.local not found at', p);
    process.exit(1);
  }
  for (const line of readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}
loadEnv();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('ERROR: missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const DRY_RUN = process.argv.includes('--dry-run');
const BUCKET  = 'jf-media';
const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const JUN_DIR  = join(root, 'Jun');

// Seed scripts don't need realtime; disabling avoids Node 20 WebSocket error
const CLIENT_OPTS = {
  auth: { persistSession: false },
  realtime: { params: { eventsPerSecond: 0 } },
  global: { fetch },
};

// Service-role client (admin, only lives in this script)
const admin = createClient(SUPABASE_URL, SERVICE_KEY, CLIENT_OPTS);
// Anon client for read-back verification
const anon  = createClient(SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || SERVICE_KEY, CLIENT_OPTS);

// Find a file in Jun/ matching the product's imageFile case-insensitively
function norm(s) {
  return s.toLowerCase()
    .replace(/['''\u2019`]/g, '')   // strip all apostrophe variants
    .replace(/[\s._\-]+/g, ' ')
    .trim();
}

function findImageFile(imageFile) {
  const normTarget = norm(imageFile.replace(/\.[^.]+$/, ''));
  const entries = readdirSync(JUN_DIR, { withFileTypes: true });
  for (const e of entries) {
    if (!e.isFile()) continue;
    if (!IMAGE_EXTS.has(extname(e.name).toLowerCase())) continue;
    const normF = norm(e.name.replace(/\.[^.]+$/, ''));
    if (normF === normTarget) return join(e.parentPath ?? JUN_DIR, e.name);
  }
  // Fuzzy fallback: first two words of target must appear in file name
  const targetWords = normTarget.split(' ').slice(0, 2).join(' ');
  for (const e of entries) {
    if (!e.isFile()) continue;
    if (!IMAGE_EXTS.has(extname(e.name).toLowerCase())) continue;
    const normF = norm(e.name.replace(/\.[^.]+$/, ''));
    if (normF.includes(targetWords)) return join(e.parentPath ?? JUN_DIR, e.name);
  }
  return null;
}


const CATEGORIES = [
  {
    name: 'Men',
    slug: 'men',
    sort_order: 1,
    is_active: true,
    imageFile: 'Office rizz inspired by office for men for men 1999.jpeg',
    description: 'Fragrances for men who value confidence and character — each bottle at 50 ml, Rs. 1,999, orderable via WhatsApp.',
    seo_title: 'Men\'s Fragrances in Pakistan | Jun.fragrance',
    seo_description: 'Shop men\'s fragrances from Jun.fragrance in Pakistan. 50 ml bottles at Rs. 1,999 each. Order via WhatsApp with ease.',
  },
  {
    name: 'Women',
    slug: 'women',
    sort_order: 2,
    is_active: true,
    imageFile: 'Pink mirage inspired by yara pink for women 1999.jpeg',
    description: 'Women\'s fragrances that move between softness and intensity — all 50 ml, Rs. 1,999, available to order via WhatsApp across Pakistan.',
    seo_title: 'Women\'s Fragrances in Pakistan | Jun.fragrance',
    seo_description: 'Explore Jun.fragrance women\'s perfumes in Pakistan. 50 ml at Rs. 1,999. Easy WhatsApp ordering, no forms needed.',
  },
  {
    name: 'Unisex',
    slug: 'unisex',
    sort_order: 3,
    is_active: true,
    imageFile: 'Libre essence inspired by ysl Libre unisex 1999.jpeg',
    description: 'Scents made for anyone — neither strictly masculine nor feminine. All 50 ml, Rs. 1,999. Order through WhatsApp, anywhere in Pakistan.',
    seo_title: 'Unisex Fragrances in Pakistan | Jun.fragrance',
    seo_description: 'Discover unisex fragrances by Jun.fragrance in Pakistan. 50 ml bottles at Rs. 1,999. Order on WhatsApp — no account needed.',
  },
];

// Products: first 8 are exact per spec; rest derived from file names
const FIXED_PRODUCTS = [
  {
    title: 'Pink Mirage',
    slug: 'pink-mirage',
    inspired_by: 'Yara Pink',
    gender: 'women',
    categorySlug: 'women',
    notes_top: ['Litchi', 'Bergamot'],
    notes_heart: ['Rose', 'Peony'],
    notes_base: ['Vanilla', 'Musk'],
    accent_color: '#D93A52',
    price: 1999,
    sort_order: 1,
    imageFile: 'Pink mirage inspired by yara pink for women 1999.jpeg',
    short_description: 'Litchi and Bergamot open into Rose and Peony, settling on Vanilla Musk. 50 ml, Rs. 1,999.',
    description: 'Pink Mirage opens with a bright burst of Litchi and Bergamot before settling into a floral heart of Rose and Peony. The base of Vanilla and Musk gives the scent a soft, rounded finish. At 50 ml, it is an everyday women\'s fragrance with a gentle presence. Available to order in Pakistan via WhatsApp at Rs. 1,999.',
    seo_title: 'Pink Mirage Women\'s Perfume in Pakistan | Jun.fragrance',
    seo_description: 'Pink Mirage by Jun.fragrance — a floral scent with Litchi, Rose, and Vanilla Musk. 50 ml at Rs. 1,999 in Pakistan. Order via WhatsApp.',
  },
  {
    title: 'Libre Essence',
    slug: 'libre-essence',
    inspired_by: 'YSL Libre',
    gender: 'unisex',
    categorySlug: 'unisex',
    notes_top: [],
    notes_heart: [],
    notes_base: [],
    accent_color: '#D9A066',
    price: 1999,
    sort_order: 2,
    imageFile: 'Libre essence inspired by ysl Libre unisex 1999.jpeg',
    short_description: 'A warm, open-air unisex fragrance. 50 ml at Rs. 1,999.',
    description: 'Libre Essence captures an airy, sun-warmed character that reads as neither masculine nor feminine — a scent suited to any setting. The amber-toned liquid carries a gentle depth that emerges gradually over wear. At 50 ml and Rs. 1,999, it is available to anyone in Pakistan through WhatsApp ordering.',
    seo_title: 'Libre Essence Unisex Perfume in Pakistan | Jun.fragrance',
    seo_description: 'Libre Essence — warm, unisex fragrance from Jun.fragrance. 50 ml at Rs. 1,999 in Pakistan. Order easily through WhatsApp.',
  },
  {
    title: 'Office Rizz',
    slug: 'office-rizz',
    inspired_by: 'Office for Men',
    gender: 'men',
    categorySlug: 'men',
    notes_top: ['Citrus'],
    notes_heart: ['Woody'],
    notes_base: ['Musky', 'Amber'],
    accent_color: '#B8864B',
    price: 1999,
    sort_order: 3,
    imageFile: 'Office rizz inspired by office for men for men 1999.jpeg',
    short_description: 'Citrus opens, woody heart, and a musky amber base. Suited for work and beyond. 50 ml, Rs. 1,999.',
    description: 'Office Rizz starts with a clean citrus note that transitions into a woody heart before anchoring on musky amber. The combination works well in professional settings without feeling out of place in the evening. 50 ml at Rs. 1,999, available to order in Pakistan via WhatsApp.',
    seo_title: 'Office Rizz Men\'s Fragrance in Pakistan | Jun.fragrance',
    seo_description: 'Office Rizz by Jun.fragrance — citrus, woody, and amber for men. 50 ml at Rs. 1,999 in Pakistan. Order on WhatsApp.',
    _flags: ['ASSUMPTION: notes (Citrus/Woody/Musky/Amber) assigned from image; file name says "office for men for men" (doubled "for men")'],
  },
  {
    title: 'J.F Myself',
    slug: 'jf-myself',
    inspired_by: 'YSL Myself',
    gender: 'men',
    categorySlug: 'men',
    notes_top: ['Clean notes'],
    notes_heart: ['Smoked wood'],
    notes_base: ['Amber'],
    accent_color: '#4F8FBF',
    price: 1999,
    sort_order: 4,
    imageFile: 'J.f myself inspired by ysl myself 1999 for men.jpeg',
    short_description: 'Clean top, smoked wood heart, amber base. A men\'s fragrance with quiet depth. 50 ml, Rs. 1,999.',
    description: 'J.F Myself leads with clean, uncomplicated top notes that clear the way for a smoked wood heart — distinct but not overpowering. Amber rounds the base into something warm and grounded. The blue bottle and minimal styling reflect that straightforward character. At 50 ml and Rs. 1,999, it is available in Pakistan via WhatsApp.',
    seo_title: 'J.F Myself Men\'s Perfume in Pakistan | Jun.fragrance',
    seo_description: 'J.F Myself by Jun.fragrance — smoked wood and amber men\'s fragrance. 50 ml at Rs. 1,999 in Pakistan. Order via WhatsApp.',
  },
  {
    title: 'Lost Kingdom',
    slug: 'lost-kingdom',
    inspired_by: 'Imperial Valley',
    gender: 'unisex',
    categorySlug: 'unisex',
    notes_top: [],
    notes_heart: [],
    notes_base: [],
    accent_color: '#5FA8A8',
    price: 1999,
    sort_order: 5,
    imageFile: 'Lost kingdom inspired by imperial valley unisex 1999.jpeg',
    short_description: 'An aquatic unisex scent with an adventurous, outdoors character. 50 ml, Rs. 1,999.',
    description: 'Lost Kingdom carries a cool, aquatic quality that suits open spaces and unhurried days. The teal-toned liquid and the rugged outdoor imagery speak to a scent built for movement. It works for men and women equally. 50 ml at Rs. 1,999, orderable in Pakistan through WhatsApp.',
    seo_title: 'Lost Kingdom Unisex Perfume in Pakistan | Jun.fragrance',
    seo_description: 'Lost Kingdom — a fresh aquatic unisex fragrance from Jun.fragrance. 50 ml at Rs. 1,999 in Pakistan. Order via WhatsApp.',
  },
  {
    title: 'Kirki Royale (For Women)',
    slug: 'kirki-royale-for-women',
    inspired_by: 'Kirke',
    gender: 'women',
    categorySlug: 'women',
    notes_top: [],
    notes_heart: [],
    notes_base: [],
    accent_color: '#E7A9A0',
    price: 1999,
    sort_order: 6,
    imageFile: 'Kirki Royale inspired by Kirke 1999 for women.jpeg',
    short_description: 'A delicate women\'s scent presented in a blush-pink bottle. 50 ml, Rs. 1,999.',
    description: 'Kirki Royale For Women arrives in a near-colourless bottle alongside blush petals — the visual restraint matches the scent\'s character. Soft and composed, it sits quietly rather than announcing itself. A women\'s fragrance for those who prefer understatement. 50 ml at Rs. 1,999, available in Pakistan via WhatsApp.',
    seo_title: 'Kirki Royale Women\'s Perfume in Pakistan | Jun.fragrance',
    seo_description: 'Kirki Royale For Women by Jun.fragrance — a soft, composed women\'s scent. 50 ml at Rs. 1,999 in Pakistan. Order via WhatsApp.',
  },
  {
    title: 'Kirki Royale (For Men)',
    slug: 'kirki-royale-for-men',
    inspired_by: 'Kirki',
    gender: 'men',
    categorySlug: 'men',
    notes_top: ['Passion Fruit', 'Peach'],
    notes_heart: ['Jasmine', 'Lily-of-the-Valley'],
    notes_base: ['Sandalwood', 'Musk'],
    accent_color: '#E8946A',
    price: 1999,
    sort_order: 7,
    imageFile: 'Kirki Royale inspired by kirki for men 1999.jpeg',
    short_description: 'Passion Fruit, Jasmine, Sandalwood and Musk — a men\'s fragrance with floral warmth. 50 ml, Rs. 1,999.',
    description: 'Kirki Royale For Men opens with Passion Fruit and Peach before moving into a Jasmine and Lily-of-the-Valley heart that lends a floral dimension rarely found in men\'s fragrances. Sandalwood and Musk anchor the dry-down into a familiar, warm finish. At 50 ml and Rs. 1,999, available in Pakistan via WhatsApp.',
    seo_title: 'Kirki Royale Men\'s Perfume in Pakistan | Jun.fragrance',
    seo_description: 'Kirki Royale For Men by Jun.fragrance — fruity, floral, and woody. 50 ml at Rs. 1,999 in Pakistan. Order via WhatsApp.',
  },
  {
    title: 'No.4 The Signature',
    slug: 'no-4-the-signature',
    inspired_by: 'TK No. 4',
    gender: 'unisex',
    categorySlug: 'unisex',
    notes_top: ['Rich bergamot'],
    notes_heart: ['Dark oud'],
    notes_base: ['Sweet patchouli'],
    accent_color: '#B5651D',
    price: 1999,
    sort_order: 8,
    imageFile: 'No.4 the signature inspired by tk no 4.jpeg',
    short_description: 'Bergamot, dark oud, and patchouli in a sculptural unisex fragrance. 50 ml, Rs. 1,999.',
    description: 'No.4 The Signature opens with rich bergamot before revealing a dark oud heart that gives the fragrance its signature weight. Sweet patchouli softens the base without losing the depth. Shot against a classical backdrop of chains and marble, the visual language matches the fragrance\'s weight. Unisex, 50 ml, Rs. 1,999 — order in Pakistan via WhatsApp.',
    seo_title: 'No.4 The Signature Unisex Perfume in Pakistan | Jun.fragrance',
    seo_description: 'No.4 The Signature by Jun.fragrance — bergamot, oud, and patchouli. 50 ml at Rs. 1,999 in Pakistan. Order via WhatsApp.',
    _flags: ['ASSUMPTION: gender=unisex; no gender word in filename'],
  },
];

// Additional products derived from remaining images
const EXTRA_PRODUCTS = [
  {
    title: 'Arctic Frost',
    slug: 'arctic-frost',
    inspired_by: 'Hawas Ice',
    gender: 'unisex',
    categorySlug: 'unisex',
    notes_top: [], notes_heart: [], notes_base: [],
    accent_color: '#7BC4D8',
    price: 1999,
    sort_order: 9,
    imageFile: 'Artic frost inspired by hawas ice.jpeg',
    short_description: 'A cool, clean unisex fragrance with an icy character. 50 ml, Rs. 1,999.',
    description: 'Arctic Frost carries the freshness of a cold, clear morning. The pale blue liquid inside the bottle is the clearest indicator of its aquatic, icy character — a scent that sits lightly on skin without fading into nothing. Suitable for both men and women. 50 ml at Rs. 1,999, available in Pakistan via WhatsApp.',
    seo_title: 'Arctic Frost Unisex Fragrance in Pakistan | Jun.fragrance',
    seo_description: 'Arctic Frost by Jun.fragrance — a cool, fresh unisex scent. 50 ml at Rs. 1,999 in Pakistan. Order easily via WhatsApp.',
    _flags: ['Filename spells "Artic" (missing c); label reads "ARCTIC FROST" — using correct spelling in title', 'No gender word in filename — defaulting to unisex'],
  },
  {
    title: 'Aventus Crown',
    slug: 'aventus-crown',
    inspired_by: 'Creed Aventus',
    gender: 'men',
    categorySlug: 'men',
    notes_top: [], notes_heart: [], notes_base: [],
    accent_color: '#C8922A',
    price: 1999,
    sort_order: 10,
    imageFile: 'Aventus crown inspired by creed Aventus for men 1999.jpeg',
    short_description: 'A composed men\'s fragrance with warm amber tones. 50 ml, Rs. 1,999.',
    description: 'Aventus Crown presents a warm, amber-golden liquid in a clean bottle. The setting — leather-bound books, compass, antique map — evokes a sense of deliberate, unhurried confidence. Notes shown in the image: Clean Notes, Smoked Wood, Warm Amber. A men\'s fragrance at 50 ml and Rs. 1,999, orderable in Pakistan via WhatsApp.',
    seo_title: 'Aventus Crown Men\'s Fragrance in Pakistan | Jun.fragrance',
    seo_description: 'Aventus Crown by Jun.fragrance — warm amber and smoked wood for men. 50 ml at Rs. 1,999 in Pakistan. Order via WhatsApp.',
  },
  {
    title: 'Black Atlas',
    slug: 'black-atlas',
    inspired_by: 'Royal Oud',
    gender: 'unisex',
    categorySlug: 'unisex',
    notes_top: [], notes_heart: [], notes_base: [],
    accent_color: '#3D2B1A',
    price: 1999,
    sort_order: 11,
    imageFile: 'Black atlas inspired by royal oud unisex 1999.jpeg',
    short_description: 'A dark, oud-forward unisex fragrance with mountain-landscape imagery. 50 ml, Rs. 1,999.',
    description: 'Black Atlas is built around a rich oud character that comes through in its deep, near-black bottle liquid. The dramatic mountain-and-lake setting in the image communicates a scent with presence and scale. Unisex and suited to cooler weather. At 50 ml and Rs. 1,999, it is available in Pakistan through WhatsApp.',
    seo_title: 'Black Atlas Unisex Oud Fragrance in Pakistan | Jun.fragrance',
    seo_description: 'Black Atlas by Jun.fragrance — rich, oud-forward unisex fragrance. 50 ml at Rs. 1,999 in Pakistan. Order via WhatsApp.',
  },
  {
    title: 'Bleu Exclusif',
    slug: 'bleu-exclusif',
    inspired_by: 'Bleu de Chanel',
    gender: 'unisex',
    categorySlug: 'unisex',
    notes_top: [], notes_heart: [], notes_base: [],
    accent_color: '#A07840',
    price: 1999,
    sort_order: 12,
    imageFile: 'Bleu exclusif inspired by bleu de Chanel.jpeg',
    short_description: 'A warm, amber-toned unisex fragrance with understated presentation. 50 ml, Rs. 1,999.',
    description: 'Bleu Exclusif is photographed held against skin and leather — a deliberate choice that places the fragrance in an intimate, personal context. The amber liquid in the bottle reads warm despite the cool name. No notes are written in the image. At 50 ml, Rs. 1,999, orderable in Pakistan via WhatsApp.',
    seo_title: 'Bleu Exclusif Fragrance in Pakistan | Jun.fragrance',
    seo_description: 'Bleu Exclusif by Jun.fragrance — warm amber unisex scent. 50 ml at Rs. 1,999 in Pakistan. Order via WhatsApp.',
    _flags: ['No gender word in filename — defaulting to unisex', 'No price in filename — defaulting to Rs. 1,999'],
  },
  {
    title: 'Deep Sea',
    slug: 'deep-sea',
    inspired_by: 'Cool Water',
    gender: 'unisex',
    categorySlug: 'unisex',
    notes_top: ['Mint', 'Green Notes', 'Lavender', 'Coriander'],
    notes_heart: ['Jasmine', 'Geranium', 'Neroli', 'Sea Water'],
    notes_base: ['Musk', 'Amber', 'Cedarwood', 'Tobacco'],
    accent_color: '#2D6FA4',
    price: 1999,
    sort_order: 13,
    imageFile: 'Deep sea inspired by cool water unisex 1999.jpeg',
    short_description: 'Mint, Lavender and Sea Water at the heart of a deep aquatic unisex scent. 50 ml, Rs. 1,999.',
    description: 'Deep Sea opens with Mint, Green Notes, Lavender, and Coriander — a crisp, airy start. The heart moves through Jasmine, Geranium, Neroli, and Sea Water, with a base that anchors on Musk, Amber, Cedarwood, and Tobacco. Clear and aquatic, suited for warm weather. Unisex, 50 ml, Rs. 1,999 — order in Pakistan via WhatsApp.',
    seo_title: 'Deep Sea Unisex Aquatic Fragrance in Pakistan | Jun.fragrance',
    seo_description: 'Deep Sea by Jun.fragrance — mint, lavender, and aquatic notes. 50 ml at Rs. 1,999 in Pakistan. Order via WhatsApp.',
    _flags: ['Website on label reads "www.junfragrance.ca" — wrong domain (.ca instead of .com)'],
  },
  {
    title: 'Ember Veil',
    slug: 'ember-veil',
    inspired_by: 'Dunhill Desire',
    gender: 'unisex',
    categorySlug: 'unisex',
    notes_top: ['Smoked Amber', 'Citrus Zest'],
    notes_heart: ['Spices', 'Sandalwood'],
    notes_base: ['Rich Woods', 'Musk'],
    accent_color: '#C47A20',
    price: 1999,
    sort_order: 14,
    imageFile: 'Ember veil inspired by dunhill desire unisex 1999.jpeg',
    short_description: 'Smoked Amber, Spices, and Rich Woods in a warm unisex fragrance. 50 ml, Rs. 1,999.',
    description: 'Ember Veil opens with Smoked Amber and Citrus Zest before moving into a Spices and Sandalwood heart. Rich Woods and Musk round the base into something deep and settled. The fireplace setting and autumn colour palette in the image describe the scent\'s warmth accurately. Unisex, 50 ml, Rs. 1,999 — available in Pakistan via WhatsApp.',
    seo_title: 'Ember Veil Unisex Fragrance in Pakistan | Jun.fragrance',
    seo_description: 'Ember Veil by Jun.fragrance — warm spice and smoked amber. Unisex, 50 ml at Rs. 1,999 in Pakistan. Order via WhatsApp.',
  },
  {
    title: 'Flora Royale',
    slug: 'flora-royale',
    inspired_by: 'Gucci Flora',
    gender: 'women',
    categorySlug: 'women',
    notes_top: [], notes_heart: [], notes_base: [],
    accent_color: '#D4724A',
    price: 1999,
    sort_order: 15,
    imageFile: 'Flora Royale inspired by Gucci flora 1999 for women.jpeg',
    short_description: 'A warm floral women\'s fragrance with an earthy amber tone. 50 ml, Rs. 1,999.',
    description: 'Flora Royale is photographed resting in the fork of a dry, sun-bleached branch — a natural setting that suits its warm, amber-orange liquid. The bottle is simple, the scent\'s character earthy and floral without decoration. A women\'s fragrance at 50 ml and Rs. 1,999, available in Pakistan through WhatsApp.',
    seo_title: 'Flora Royale Women\'s Perfume in Pakistan | Jun.fragrance',
    seo_description: 'Flora Royale by Jun.fragrance — warm floral fragrance for women. 50 ml at Rs. 1,999 in Pakistan. Order via WhatsApp.',
  },
  {
    title: 'Golden Extrait',
    slug: 'golden-extrait',
    inspired_by: 'Baccarat',
    gender: 'unisex',
    categorySlug: 'unisex',
    notes_top: [], notes_heart: [], notes_base: [],
    accent_color: '#C49A20',
    price: 1999,
    sort_order: 16,
    imageFile: 'Golden extrait inspired by baccarat.jpeg',
    short_description: 'A rich, golden unisex fragrance with opulent presentation. 50 ml, Rs. 1,999.',
    description: 'Golden Extrait sits on a crystal plinth surrounded by candlelight and gilded glassware. The amber-gold liquid inside is the deepest in colour of the Jun.fragrance range. No notes are written in the image, so none are listed here. Unisex, 50 ml, Rs. 1,999 — orderable in Pakistan via WhatsApp.',
    seo_title: 'Golden Extrait Unisex Fragrance in Pakistan | Jun.fragrance',
    seo_description: 'Golden Extrait by Jun.fragrance — rich, amber-gold unisex fragrance. 50 ml at Rs. 1,999 in Pakistan. Order via WhatsApp.',
    _flags: ['No gender or price in filename — defaulting to unisex, Rs. 1,999', 'Website on label reads "www.junfragrance.ca" — wrong domain (.ca)'],
  },
  {
    title: 'Guilty Elixir',
    slug: 'guilty-elixir',
    inspired_by: 'Gucci Guilty',
    gender: 'unisex',
    categorySlug: 'unisex',
    notes_top: [], notes_heart: [], notes_base: [],
    accent_color: '#C8881A',
    price: 1999,
    sort_order: 17,
    imageFile: 'Guilty elixir inspired by Gucci guilty unisex 1999.jpeg',
    short_description: 'A spiced, citrus-forward unisex fragrance with a vivid visual identity. 50 ml, Rs. 1,999.',
    description: 'Guilty Elixir is shot mid-air surrounded by lime slices, saffron threads, mint leaves, and cardamom pods — ingredients that hint at a bright, spiced character. The liquid is a warm caramel tone. Unisex, 50 ml at Rs. 1,999, available in Pakistan via WhatsApp.',
    seo_title: 'Guilty Elixir Unisex Fragrance in Pakistan | Jun.fragrance',
    seo_description: 'Guilty Elixir by Jun.fragrance — spiced citrus unisex fragrance. 50 ml at Rs. 1,999 in Pakistan. Order via WhatsApp.',
  },
  {
    title: 'Imagination',
    slug: 'imagination',
    inspired_by: 'LV Imagination',
    gender: 'men',
    categorySlug: 'men',
    notes_top: [], notes_heart: [], notes_base: [],
    accent_color: '#78BFC8',
    price: 1999,
    sort_order: 18,
    imageFile: 'Imagination inspired by lv imagination for men 1999.jpeg',
    short_description: 'A fresh, light men\'s fragrance for creative, city-focused days. 50 ml, Rs. 1,999.',
    description: 'Imagination is placed on a dark marble desk overlooking a city skyline — a setting that frames it as a fragrance for people who work with ideas. The clear, pale blue liquid is clean and undemanding. A men\'s fragrance at 50 ml and Rs. 1,999, available in Pakistan through WhatsApp.',
    seo_title: 'Imagination Men\'s Fragrance in Pakistan | Jun.fragrance',
    seo_description: 'Imagination by Jun.fragrance — fresh, city-ready men\'s scent. 50 ml at Rs. 1,999 in Pakistan. Order via WhatsApp.',
  },
  {
    title: 'Imperial Spice',
    slug: 'imperial-spice',
    inspired_by: 'Oud Ispahan',
    gender: 'unisex',
    categorySlug: 'unisex',
    notes_top: [], notes_heart: [], notes_base: [],
    accent_color: '#C8A060',
    price: 1999,
    sort_order: 19,
    imageFile: 'Imperial spice inspired by oud ispahan.jpeg',
    short_description: 'A warm, spiced unisex fragrance. 50 ml, Rs. 1,999.',
    description: 'Imperial Spice is shot as a silhouette — the bottle small but clearly present in the subject\'s hand. The low-key presentation puts the fragrance in context without making claims. Warm and spiced in character, suited for cooler settings. Unisex, 50 ml, Rs. 1,999 — orderable in Pakistan via WhatsApp.',
    seo_title: 'Imperial Spice Unisex Fragrance in Pakistan | Jun.fragrance',
    seo_description: 'Imperial Spice by Jun.fragrance — warm oud and spice unisex fragrance. 50 ml at Rs. 1,999 in Pakistan. Order via WhatsApp.',
    _flags: ['No gender or price in filename — defaulting to unisex, Rs. 1,999'],
  },
  {
    title: 'Prism 22',
    slug: 'prism-22',
    inspired_by: 'Bright Crystal',
    gender: 'women',
    categorySlug: 'women',
    notes_top: [], notes_heart: [], notes_base: [],
    accent_color: '#D4A8C0',
    price: 1999,
    sort_order: 20,
    imageFile: 'Prism 22 inspired by bright crystal for women 1999.jpeg',
    short_description: 'A light, crystal-clear women\'s fragrance with a powder-pink tone. 50 ml, Rs. 1,999.',
    description: 'Prism 22 is placed on a lit stage of crystal prisms and refracted light. The blush-pink liquid and the scattered crystal props describe a scent that is clean, luminous, and feminine in character. No notes are visible in the image. Women\'s fragrance, 50 ml at Rs. 1,999, available in Pakistan via WhatsApp.',
    seo_title: 'Prism 22 Women\'s Fragrance in Pakistan | Jun.fragrance',
    seo_description: 'Prism 22 by Jun.fragrance — light, crystal-clear fragrance for women. 50 ml at Rs. 1,999 in Pakistan. Order via WhatsApp.',
    _flags: ['Image label says "Inspired by a Prism of Light" — creative label differs from filename inspired_by "Bright Crystal"'],
  },
  {
    title: 'Regal Oud',
    slug: 'regal-oud',
    inspired_by: 'White Oud',
    gender: 'unisex',
    categorySlug: 'unisex',
    notes_top: [], notes_heart: [], notes_base: [],
    accent_color: '#E8DCC0',
    price: 1999,
    sort_order: 21,
    imageFile: 'Regal oud inspired by white oud 1999 unisex.jpeg',
    short_description: 'A clean, white oud unisex fragrance in a clear bottle. 50 ml, Rs. 1,999.',
    description: 'Regal Oud is the palest of the Jun.fragrance range — the liquid is nearly colourless, matching its light oud character. The outdoor lifestyle setting suggests a fragrance worn without occasion. Unisex, 50 ml, Rs. 1,999 — available in Pakistan via WhatsApp.',
    seo_title: 'Regal Oud Unisex Fragrance in Pakistan | Jun.fragrance',
    seo_description: 'Regal Oud by Jun.fragrance — light, clean white oud unisex fragrance. 50 ml at Rs. 1,999 in Pakistan. Order via WhatsApp.',
  },
  {
    title: "Siren's Allure",
    slug: 'sirens-allure',
    inspired_by: 'Armani Si',
    gender: 'women',
    categorySlug: 'women',
    notes_top: [], notes_heart: [], notes_base: [],
    accent_color: '#F5F0E8',
    price: 1999,
    sort_order: 22,
    imageFile: "Siren's allure inspired by Armani si.jpeg",
    short_description: 'A soft, clear women\'s fragrance for outdoor and open-air moments. 50 ml, Rs. 1,999.',
    description: "Siren's Allure is photographed outdoors alongside a horse in autumn light — an image of calm and natural presence. The bottle liquid is nearly clear. No notes are shown in the image. A women's fragrance, 50 ml at Rs. 1,999, available to order in Pakistan via WhatsApp.",
    seo_title: "Siren's Allure Women's Fragrance in Pakistan | Jun.fragrance",
    seo_description: "Siren's Allure by Jun.fragrance — soft, clear women's perfume. 50 ml at Rs. 1,999 in Pakistan. Order via WhatsApp.",
    _flags: ['No gender word in filename — derived gender=women from image context (held by a woman); flagging as assumption', 'No price in filename — defaulting Rs. 1,999'],
  },
  {
    title: 'Stronger Oud',
    slug: 'stronger-oud',
    inspired_by: 'Stronger with You',
    gender: 'unisex',
    categorySlug: 'unisex',
    notes_top: ['Saffron', 'Nutmeg', 'Lavender'],
    notes_heart: ['Oud', 'Patchouli', 'Cedarwood'],
    notes_base: ['Amber', 'Musk', 'Leather'],
    accent_color: '#C8A060',
    price: 1999,
    sort_order: 23,
    imageFile: 'Stronger oud inspired by stronger with you unisex 1999.jpeg',
    short_description: 'Saffron, Oud, Patchouli and Leather in a bold unisex fragrance. 50 ml, Rs. 1,999.',
    description: 'Stronger Oud opens with Saffron, Nutmeg, and Lavender. The heart is built on Oud, Patchouli, and Cedarwood — a dense, woody combination. Amber, Musk, and Leather form the base. Set against a city skyline at night, the visual positions this as a fragrance for the evening. Unisex, 50 ml, Rs. 1,999 — orderable in Pakistan via WhatsApp.',
    seo_title: 'Stronger Oud Unisex Fragrance in Pakistan | Jun.fragrance',
    seo_description: 'Stronger Oud by Jun.fragrance — saffron, oud, and leather unisex fragrance. 50 ml at Rs. 1,999 in Pakistan. Order via WhatsApp.',
    _flags: ['Website on label reads "www.junfragrance.ca" — wrong domain (.ca)'],
  },
  {
    title: 'Velvet Bloom',
    slug: 'velvet-bloom',
    inspired_by: 'VR',
    gender: 'women',
    categorySlug: 'women',
    notes_top: [], notes_heart: [], notes_base: [],
    accent_color: '#C8A898',
    price: 1999,
    sort_order: 24,
    imageFile: 'Velvet bloom inspired by vbc.jpeg',
    short_description: 'A warm, skin-close women\'s fragrance presented with quiet restraint. 50 ml, Rs. 1,999.',
    description: 'Velvet Bloom is photographed as a silhouette — a woman in profile, the bottle resting in her palm. The warmth of the shot and the near-clear liquid suggest a skin-close, understated character. No notes are shown in the image. Women\'s fragrance, 50 ml at Rs. 1,999, available in Pakistan via WhatsApp.',
    seo_title: 'Velvet Bloom Women\'s Fragrance in Pakistan | Jun.fragrance',
    seo_description: 'Velvet Bloom by Jun.fragrance — warm, understated women\'s scent. 50 ml at Rs. 1,999 in Pakistan. Order via WhatsApp.',
    _flags: ['Filename says "vbc" — label reads "Inspired by VR"; inspired_by set to "VR" per label. Flag: abbreviated inspired_by, confirm with owner.', 'No gender or price in filename — derived women from image; defaulting Rs. 1,999'],
  },
  {
    title: 'Wanted Elite',
    slug: 'wanted-elite',
    inspired_by: 'Azzaro Wanted',
    gender: 'unisex',
    categorySlug: 'unisex',
    notes_top: [], notes_heart: [], notes_base: [],
    accent_color: '#4A90D0',
    price: 1999,
    sort_order: 25,
    imageFile: 'Wanted elite inspired by Azzaro wanted.jpeg',
    short_description: 'A blue, fresh unisex fragrance with an open outdoor character. 50 ml, Rs. 1,999.',
    description: 'Wanted Elite is held outdoors beside a horse in open desert light — a composition built around space and sky. The bright blue liquid pairs with that wide-open visual. No notes are written in the image. Unisex, 50 ml at Rs. 1,999, available in Pakistan via WhatsApp.',
    seo_title: 'Wanted Elite Unisex Fragrance in Pakistan | Jun.fragrance',
    seo_description: 'Wanted Elite by Jun.fragrance — fresh blue unisex fragrance. 50 ml at Rs. 1,999 in Pakistan. Order via WhatsApp.',
    _flags: ['No gender word in filename — defaulting to unisex', 'No price in filename — defaulting Rs. 1,999'],
  },
  {
    title: 'Y Series',
    slug: 'y-series',
    inspired_by: 'YSL Y',
    gender: 'men',
    categorySlug: 'men',
    notes_top: [], notes_heart: [], notes_base: [],
    accent_color: '#E8E4DC',
    price: 1999,
    sort_order: 26,
    imageFile: 'Y series inspired by ysl y.jpeg',
    short_description: 'A clean, clear men\'s fragrance styled for minimal presentation. 50 ml, Rs. 1,999.',
    description: 'Y Series is photographed as a product tag paired with a clean, colourless bottle. The tag reads "My perfume stay much longer than their promise" — the only copy on the image. No notes are visible. A men\'s fragrance at 50 ml and Rs. 1,999, available in Pakistan via WhatsApp.',
    seo_title: 'Y Series Men\'s Fragrance in Pakistan | Jun.fragrance',
    seo_description: 'Y Series by Jun.fragrance — clean, fresh men\'s scent. 50 ml at Rs. 1,999 in Pakistan. Order via WhatsApp.',
  },
  {
    title: 'Zen Miyaki',
    slug: 'zen-miyaki',
    inspired_by: 'Issey Miyake',
    gender: 'men',
    categorySlug: 'men',
    notes_top: [], notes_heart: [], notes_base: [],
    accent_color: '#F0EAE0',
    price: 1999,
    sort_order: 27,
    imageFile: 'Zen miyaki inspired by issey miyake for men 1999.jpeg',
    short_description: 'A light, clear men\'s fragrance with a zen-like calm. 50 ml, Rs. 1,999.',
    description: 'Zen Miyaki is held against a warm, gradient background — part soft red, part pale cream. The bottle liquid is nearly clear, which matches a scent that prioritises freshness over weight. No notes appear in the image. Men\'s fragrance at 50 ml and Rs. 1,999, available in Pakistan via WhatsApp.',
    seo_title: 'Zen Miyaki Men\'s Fragrance in Pakistan | Jun.fragrance',
    seo_description: 'Zen Miyaki by Jun.fragrance — light, fresh men\'s fragrance. 50 ml at Rs. 1,999 in Pakistan. Order via WhatsApp.',
    _flags: ['Filename says "miyaki"; label prints "MIYAKI" — keeping as-is (Jun.fragrance brand name, not a misspelling of "Miyake")'],
  },
];

// Files to skip (bundle/set/combo)
const SKIP_FILES = [
  'Bundle 4,500.jpeg',
];

const ALL_PRODUCTS = [...FIXED_PRODUCTS, ...EXTRA_PRODUCTS];

// ── image processing ──────────────────────────────────────────────────────────

async function processImage(srcPath) {
  const sharp = (await import('sharp')).default;
  const W = 1200, H = 1500;

  const src = sharp(srcPath);
  const meta = await src.metadata();

  // Blurred, darkened background from same image
  const blurBg = await sharp(srcPath)
    .resize(W, H, { fit: 'cover' })
    .blur(40)
    .modulate({ brightness: 0.35 })
    .toBuffer();

  // Foreground: contain within 1200x1500
  const fg = await sharp(srcPath)
    .resize(W, H, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  const result = await sharp(blurBg)
    .composite([{ input: fg, blend: 'over' }])
    .webp({ quality: 82 })
    .toBuffer();

  return result;
}

// ── upload ────────────────────────────────────────────────────────────────────

function publicUrl(path) {
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;
}

async function uploadImage(buffer, storagePath) {
  if (DRY_RUN) {
    console.log(`  [dry-run] would upload ${storagePath}`);
    return publicUrl(storagePath);
  }
  const { error } = await admin.storage.from(BUCKET).upload(storagePath, buffer, {
    contentType: 'image/webp',
    upsert: true,
  });
  if (error) throw new Error(`Upload failed for ${storagePath}: ${error.message}`);
  return publicUrl(storagePath);
}

// ── main ──────────────────────────────────────────────────────────────────────

async function run() {
  console.log(DRY_RUN ? '\n=== DRY RUN ===' : '\n=== SEEDING CATALOG ===');
  console.log('Target:', SUPABASE_URL, '\n');

  // ── categories ──────────────────────────────────────────────────
  const catIdMap = {};

  for (const cat of CATEGORIES) {
    console.log(`\nCategory: ${cat.name}`);

    // Check existing
    const { data: existing } = await admin
      .from('jf_categories')
      .select('id, image_url')
      .eq('slug', cat.slug)
      .single();

    let imageUrl = existing?.image_url ?? null;

    if (!imageUrl) {
      const srcPath = findImageFile(cat.imageFile);
      if (!srcPath) {
        console.warn(`  WARNING: image not found for category ${cat.name}: ${cat.imageFile}`);
      } else {
        const buf = await processImage(srcPath);
        const storagePath = `categories/${cat.slug}.webp`;
        imageUrl = await uploadImage(buf, storagePath);
        console.log(`  image -> ${storagePath}`);
      }
    } else {
      console.log(`  image already uploaded, skipping`);
    }

    const row = {
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      image_url: imageUrl,
      sort_order: cat.sort_order,
      is_active: cat.is_active,
      seo_title: cat.seo_title,
      seo_description: cat.seo_description,
    };

    if (DRY_RUN) {
      console.log(`  [dry-run] upsert category:`, row.slug);
    } else {
      const { data, error } = await admin
        .from('jf_categories')
        .upsert(row, { onConflict: 'slug' })
        .select('id')
        .single();
      if (error) throw new Error(`Category upsert failed (${cat.slug}): ${error.message}`);
      catIdMap[cat.slug] = data.id;
      console.log(`  upserted -> ${data.id}`);
    }
  }

  // If not dry-run, fetch all cat ids
  if (!DRY_RUN && Object.keys(catIdMap).length === 0) {
    const { data } = await admin.from('jf_categories').select('id, slug');
    for (const c of data ?? []) catIdMap[c.slug] = c.id;
  }

  // ── products ─────────────────────────────────────────────────────
  const usedSlugs = new Set();

  for (const prod of ALL_PRODUCTS) {
    let slug = prod.slug;
    while (usedSlugs.has(slug)) slug = slug + '-2';
    usedSlugs.add(slug);

    console.log(`\nProduct: ${prod.title} [${slug}]`);
    if (prod._flags) prod._flags.forEach(f => console.log(`  FLAG: ${f}`));

    // Check existing images
    const { data: existing } = await admin
      .from('jf_products')
      .select('id, images')
      .eq('slug', slug)
      .single();

    let images = existing?.images ?? [];

    if (images.length === 0) {
      const srcPath = findImageFile(prod.imageFile);
      if (!srcPath) {
        console.warn(`  WARNING: image not found: ${prod.imageFile}`);
      } else {
        const buf = await processImage(srcPath);
        const uuid = existing?.id ?? crypto.randomUUID();
        const storagePath = `products/${uuid}.webp`;
        const url = await uploadImage(buf, storagePath);
        images = [url];
        console.log(`  image -> ${storagePath}`);
      }
    } else {
      console.log(`  images already present (${images.length}), skipping upload`);
    }

    const catId = catIdMap[prod.categorySlug] ?? null;

    const row = {
      title: prod.title,
      slug,
      short_description: prod.short_description,
      description: prod.description,
      inspired_by: prod.inspired_by,
      size_ml: 50,
      price: prod.price,
      compare_at_price: null,
      images,
      notes_top: prod.notes_top,
      notes_heart: prod.notes_heart,
      notes_base: prod.notes_base,
      gender: prod.gender,
      accent_color: prod.accent_color,
      is_featured: true,
      is_active: true,
      sort_order: prod.sort_order,
      seo_title: prod.seo_title,
      seo_description: prod.seo_description,
      category_id: catId,
    };

    if (DRY_RUN) {
      console.log(`  [dry-run] upsert product:`, slug);
    } else {
      const { error } = await admin
        .from('jf_products')
        .upsert(row, { onConflict: 'slug' });
      if (error) throw new Error(`Product upsert failed (${slug}): ${error.message}`);
      console.log(`  upserted OK`);
    }
  }

  // ── verification read-back with anon client ───────────────────
  if (!DRY_RUN) {
    console.log('\n── Verification (anon client) ──');
    const { data: cats, error: ce } = await anon
      .from('jf_categories')
      .select('id')
      .eq('is_active', true);
    const { data: prods, error: pe } = await anon
      .from('jf_products')
      .select('id')
      .eq('is_active', true);
    if (ce) console.error('Category read error:', ce.message);
    if (pe) console.error('Product read error:', pe.message);
    console.log(`Visible categories: ${cats?.length ?? 'error'}`);
    console.log(`Visible products:   ${prods?.length ?? 'error'}`);
  }

  console.log('\n=== DONE ===\n');
}

run().catch(err => { console.error(err); process.exit(1); });
