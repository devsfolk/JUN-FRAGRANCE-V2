import { createClient } from "@supabase/supabase-js";
import { WebSocket } from "ws";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

if (!globalThis.WebSocket) globalThis.WebSocket = WebSocket;
const root = resolve(import.meta.dirname, "..");
const env = Object.fromEntries(readFileSync(resolve(root, ".env.local"), "utf8").split(/\r?\n/).filter((line) => line.includes("=")).map((line) => [line.slice(0, line.indexOf("=")).trim(), line.slice(line.indexOf("=") + 1).trim()]));
const client = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const source = readFileSync(resolve(root, "seo-content/posts-round2.md"), "utf8");
const blocks = source.split(/^=== POST ===\s*$/m).slice(1).map((block) => block.split(/^=== END ===/m)[0].trim()).filter(Boolean);
const parse = (block) => {
  const header = block.split(/^--- content ---$/m)[0];
  const bodyAndFaq = block.split(/^--- content ---$/m)[1] ?? "";
  const [content, faqText = ""] = bodyAndFaq.split(/^--- faq ---$/m);
  const fields = Object.fromEntries([...header.matchAll(/^([\w_]+):\s*(.+)$/gm)].map((match) => [match[1], match[2].trim()]));
  return { ...fields, content: (content ?? "").trim(), faqText: faqText.trim() };
};
const posts = blocks.map(parse);
const errors = [];
if (posts.length !== 12) errors.push(`Expected 12 posts, found ${posts.length}.`);

const { data: existing, error: postError } = await client.from("jf_blog_posts").select("slug,title,content,excerpt,seo_title,seo_description,faq").eq("status", "published");
if (postError) throw postError;
const newSlugs = new Set(posts.map((post) => post.slug));
const comparisonPosts = (existing ?? []).filter((post) => !newSlugs.has(post.slug));
const { data: products, error: productError } = await client.from("jf_products").select("slug,title,is_active,notes_top,notes_heart,notes_base");
if (productError) throw productError;
const knownSlugs = new Set((products ?? []).filter((p) => p.is_active).map((p) => p.slug));
const catalogNotes = (products ?? []).flatMap((product) => [...(product.notes_top ?? []), ...(product.notes_heart ?? []), ...(product.notes_base ?? [])]);
const banned = ["authentic", "genuine", "guaranteed", "certified", "best perfume", "number one", "eau de parfum", "original", "extrait", "ysl", "yves", "saint laurent", "creed", "aventus", "dior", "sauvage", "chanel", "bleu de", "bleu exclusif", "tom ford", "lattafa", "yara", "armani", "issey", "miyake", "rabanne", "versace", "hugo boss", "gucci", "herrera", "gaultier", "montale", "xerjoff", "amouage", "imagination", "y series", "wanted elite", "guilty elixir", "libre essence", "zen miyaki"];
const stock = ["elevate", "unleash", "game-changer", "delve", "tapestry", "symphony", "journey", "in today's world", "look no further", "in conclusion", "whether you're"];
const wordCount = (text) => (text.match(/\b[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*\b/gu) ?? []).length;
const normalize = (text) => text.toLowerCase().replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/[^\p{L}\p{N}]+/gu, " ").trim().split(/\s+/).filter(Boolean);
const shingles = (text) => {
  const words = normalize(text);
  return new Set(Array.from({ length: Math.max(0, words.length - 5) }, (_, i) => words.slice(i, i + 6).join(" ")));
};
const openingKey = (text) => normalize(text.split(/[.!?]/, 1)[0] ?? "").slice(0, 7).join(" ");
const allForOverlap = [...comparisonPosts.map((p) => ({ slug: p.slug, content: p.content ?? "" })), ...posts.map((p) => ({ slug: p.slug, content: `${p.content}\n${p.faqText}` }))];
const openingKeys = new Map(comparisonPosts.map((p) => [openingKey(p.content ?? ""), p.slug]));

for (const post of posts) {
  if (!post.slug || !post.title || !post.show_on || !post.excerpt || !post.seo_title || !post.seo_description) errors.push(`${post.slug || "(missing slug)"}: missing required header field.`);
  if (!/^(journal|home|category:men|category:women)$/.test(post.show_on ?? "")) errors.push(`${post.slug}: invalid show_on value.`);
  const excerpt = post.excerpt ?? "";
  if (excerpt.length > 160) errors.push(`${post.slug}: excerpt is ${excerpt.length} characters.`);
  if ((post.seo_title ?? "").length > 45) errors.push(`${post.slug}: seo_title is ${(post.seo_title ?? "").length} characters.`);
  if ((post.seo_description ?? "").length > 155) errors.push(`${post.slug}: seo_description is ${(post.seo_description ?? "").length} characters.`);
  const words = wordCount(post.content);
  if (words < 700 || words > 1000) errors.push(`${post.slug}: content has ${words} words (required 700–1000).`);
  if (/^#\s/m.test(post.content) || /^#(?!#)/m.test(post.content)) errors.push(`${post.slug}: H1 heading found.`);
  const faqCount = [...post.faqText.matchAll(/^Q:\s*.+$/gm)].length;
  if (faqCount < 3 || faqCount > 4) errors.push(`${post.slug}: found ${faqCount} FAQ questions (required 3–4).`);
  const linkMatches = [...post.content.matchAll(/\]\((\/[^)]+)\)/g)];
  if (linkMatches.length < 2 || linkMatches.length > 4) errors.push(`${post.slug}: found ${linkMatches.length} internal links (required 2–4).`);
  for (const [, href] of linkMatches) {
    if (/^\/shop\//.test(href) && !knownSlugs.has(href.slice("/shop/".length))) errors.push(`${post.slug}: product link is not an active product: ${href}.`);
    if (!/^\/(shop(?:\/[a-z0-9-]+)?|category\/(men|women|unisex)|bundle)$/.test(href)) errors.push(`${post.slug}: unsupported internal link ${href}.`);
  }
  const completeText = `${post.title}\n${post.excerpt}\n${post.seo_title}\n${post.seo_description}\n${post.content}\n${post.faqText}`.toLowerCase();
  const disclosureAllowed = completeText.replace(/\bnot the original perfumes\b/g, "");
  for (const term of banned) if (disclosureAllowed.includes(term)) errors.push(`${post.slug}: banned term “${term}”.`);
  for (const phrase of stock) if (completeText.includes(phrase)) errors.push(`${post.slug}: stock phrase “${phrase}”.`);
  const key = openingKey(post.content);
  if (key && openingKeys.has(key)) errors.push(`${post.slug}: opening pattern repeats ${openingKeys.get(key)} (“${key}”).`);
  else if (key) openingKeys.set(key, post.slug);

  for (const product of products ?? []) {
    const title = product.title?.toLowerCase();
    if (!title || title.split(/\s+/).length < 2) continue;
    const contexts = post.content.split(/\n\s*\n/).filter((paragraph) => paragraph.toLowerCase().includes(title) || paragraph.includes(`/shop/${product.slug}`));
    if (!contexts.length) continue;
    const ownNotes = [...(product.notes_top ?? []), ...(product.notes_heart ?? []), ...(product.notes_base ?? [])].map((note) => note.toLowerCase());
    const context = contexts.join(" ").toLowerCase();
    for (const note of catalogNotes) {
      const phrase = note.toLowerCase();
      if (!ownNotes.includes(phrase) && context.includes(phrase)) errors.push(`${post.slug}: ${product.title} context includes a note not stored for it (“${note}”).`);
    }
  }
}

const sets = allForOverlap.map((p) => ({ slug: p.slug, words: shingles(p.content) }));
const overlaps = [];
for (let i = 0; i < sets.length; i++) {
  for (let j = i + 1; j < sets.length; j++) {
    const a = sets[i].words;
    const b = sets[j].words;
    if (!a.size || !b.size) continue;
    let common = 0;
    for (const shingle of a) if (b.has(shingle)) common++;
    const pct = common / Math.min(a.size, b.size);
    if (pct > 0.1) overlaps.push({ first: sets[i].slug, second: sets[j].slug, percent: `${(pct * 100).toFixed(1)}%` });
  }
}
if (overlaps.length) errors.push(`${overlaps.length} post pair(s) exceed 10% 6-word shingle overlap.`);

for (const post of posts) console.log(`${post.slug} | ${wordCount(post.content)} words | ${post.show_on}`);
console.log(`Shingle overlap pairs over 10%: ${overlaps.length}`);
for (const overlap of overlaps) console.log(`  ${overlap.first} | ${overlap.second} | ${overlap.percent}`);
if (errors.length) {
  console.error("QUALITY GATE FAILED:");
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}
console.log("QUALITY GATE PASSED");
