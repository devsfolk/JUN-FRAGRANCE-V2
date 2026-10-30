import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { tmpdir } from "node:os";
import { writeFileSync } from "node:fs";

const root = process.cwd();
const env = Object.fromEntries(readFileSync(join(root, ".env.local"), "utf8").split(/\r?\n/).filter(line => line.includes("=")).map(line => [line.slice(0, line.indexOf("=")).trim(), line.slice(line.indexOf("=") + 1).trim().replace(/^['"]|['"]$/g, "")]));
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const source = readFileSync(resolve(root, "seo-content/posts-round4.md"), "utf8");
const blocks = source.split(/^=== POST ===\s*$/m).slice(1).map(block => block.split(/^=== END ===/m)[0].trim()).filter(Boolean);
const parse = block => {
  const parts = block.split(/^--- content ---\s*$/m);
  const header = parts[0], rest = parts[1] || "";
  const contentAndFaq = rest.split(/^--- faq ---\s*$/m);
  const fields = Object.fromEntries([...header.matchAll(/^([\w_]+):\s*(.+)$/gm)].map(match => [match[1], match[2].trim()]));
  const faqText = contentAndFaq[1] || "";
  const faq = [...faqText.matchAll(/^Q:\s*(.+)\s*\nA:\s*(.+)$/gm)].map(([, question, answer]) => ({ question, answer }));
  return { ...fields, content: contentAndFaq[0].trim(), faqText: faqText.trim(), faq };
};
const posts = blocks.map(parse);
const errors = [];
const results = await Promise.all([
  db.from("jf_products").select("slug,is_active,notes_top,notes_heart,notes_base"),
  db.from("jf_categories").select("slug,is_active"),
  db.from("jf_blog_posts").select("slug,title,excerpt,seo_title,seo_description,content,faq,status,published_at"),
]);
for (const result of results) if (result.error) throw result.error;
const products = results[0].data, categories = results[1].data, existing = results[2].data;
const activeProducts = new Set(products.filter(row => row.is_active).map(row => row.slug));
const activeCategories = new Set(categories.filter(row => row.is_active).map(row => row.slug));
const existingSlugs = new Set(existing.map(row => row.slug));
const dates = ["2026-11-02T01:10:00Z","2026-11-05T01:10:00Z","2026-11-08T01:10:00Z","2026-11-11T01:10:00Z","2026-11-14T01:10:00Z","2026-11-17T01:10:00Z","2026-11-20T01:10:00Z"];
const banned = ["authentic","genuine","guaranteed","certified","best perfume","number one","eau de parfum","eau de toilette","parfum","extrait","ysl","yves saint laurent","creed","aventus","dior","sauvage","chanel","bleu de","tom ford","lattafa","yara","armani","issey","miyake","rabanne","versace","hugo boss","gucci","herrera","gaultier","montale","xerjoff","amouage","imagination","y series","wanted elite","guilty elixir","libre essence","zen miyaki"];
const stock = ["elevate","unleash","game-changer","delve","tapestry","symphony","journey","in today's world","look no further","in conclusion","whether you're"];
const scentWords = ["fresh","clean","light","airy","watery","woody","wood","floral","sweet","smoky","warm","spicy","oud","citrus","musky","amber","powdery","fruity","creamy","sharp","bright","green","marine","aquatic","litchi","lychee","bergamot","rose","peony","vanilla","musk","jasmine","lavender","patchouli","cedarwood","tobacco","sandalwood","nutmeg","saffron","leather","geranium","neroli","coriander","mint","sea water","rich woods","citrus zest","smoked amber"];
const count = text => (text.match(/\b[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*\b/gu) || []).length;
const norm = text => text.toLowerCase().replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/[^\p{L}\p{N}]+/gu, " ").trim().split(/\s+/).filter(Boolean);
const shingles = text => { const words = norm(text), set = new Set(); for (let i = 0; i + 5 < words.length; i++) set.add(words.slice(i, i + 6).join(" ")); return set; };
const opening = text => norm((text.split(/[.!?]/, 1)[0] || "")).slice(0, 7).join(" ");

if (posts.length !== 7) errors.push("Expected 7 posts, found " + posts.length);
if (existing.length !== 25) errors.push("Expected 25 existing database posts, found " + existing.length);
for (let i = 0; i < posts.length; i++) {
  const p = posts[i], full = [p.title,p.slug,p.excerpt,p.seo_title,p.seo_description,p.content,p.faqText].join("\n").toLowerCase();
  const allowedDisclosureRemoved = full.replaceAll("not the original perfumes", "");
  if (!p.slug || existingSlugs.has(p.slug)) errors.push(p.slug + ": slug missing or already exists");
  if (p.show_on !== "journal") errors.push(p.slug + ": show_on must be journal");
  if (p.published_at !== dates[i]) errors.push(p.slug + ": wrong schedule date");
  if (p.excerpt.length > 160) errors.push(p.slug + ": excerpt length " + p.excerpt.length);
  if (p.seo_title.length > 45 || /\|\s*Jun\.fragrance/i.test(p.seo_title)) errors.push(p.slug + ": seo_title invalid");
  if (p.seo_description.length > 155) errors.push(p.slug + ": seo_description length " + p.seo_description.length);
  if (count(p.content) < 700 || count(p.content) > 1000) errors.push(p.slug + ": body word count " + count(p.content));
  if (/^#(?!#)\s/m.test(p.content) || /^#{4,}\s/m.test(p.content)) errors.push(p.slug + ": heading level outside H2/H3");
  if (!/^## who this (?:guide|comparison|advice|approach|hub) may not suit/im.test(p.content)) errors.push(p.slug + ": missing honest limitation section");
  if (p.faq.length < 3 || p.faq.length > 4) errors.push(p.slug + ": FAQ count " + p.faq.length);
  const commercial = [...p.content.matchAll(/\]\((\/shop(?:\/[^)]+)?|\/category\/(?:men|women|unisex)|\/bundle)\)/g)];
  if (commercial.length < 2 || commercial.length > 4) errors.push(p.slug + ": commerce link count " + commercial.length);
  for (const [, path] of commercial) {
    if (path.startsWith("/shop/")) {
      const slug = path.slice(6), product = products.find(row => row.slug === slug);
      if (!activeProducts.has(slug)) errors.push(p.slug + ": inactive product link " + path);
      const paragraph = p.content.split(/\n\s*\n/).find(part => part.includes("](" + path + ")") || "");
      const linkedProducts = [...paragraph.matchAll(/\]\((\/shop\/[^)]+)\)/g)].map(([,href]) => products.find(row => row.slug === href.slice(6))).filter(Boolean);
      const notes = linkedProducts.flatMap(row => [...(row.notes_top || []),...(row.notes_heart || []),...(row.notes_base || [])]).join(" ").toLowerCase();
      for (const term of scentWords) {
        const regex = new RegExp("\\b" + term + "\\b", "i");
        if (regex.test(paragraph) && !regex.test(notes)) errors.push(p.slug + ": unlisted scent word " + term + " beside " + path);
      }
    } else if (path.startsWith("/category/") && !activeCategories.has(path.slice(10))) errors.push(p.slug + ": inactive category link " + path);
  }
  for (const term of banned) if (allowedDisclosureRemoved.includes(term)) errors.push(p.slug + ": banned/brand word " + term);
  for (const phrase of stock) if (full.includes(phrase)) errors.push(p.slug + ": stock phrase " + phrase);
  if ((full.match(/\b(?:yaar|acha|achha|theek|shukriya|khair|bas|chalo|shaadi)\b/gi) || []).length > 3) errors.push(p.slug + ": more than 3 Roman Urdu words");
  for (const match of p.content.matchAll(/^#{2,3} .*?\?\s*\n\s*([^\n]+)/gm)) {
    const answerWords = count(match[1]);
    if (answerWords < 40 || answerWords > 60) errors.push(p.slug + ": question heading answer is " + answerWords + " words");
  }
}
const all = [
  ...existing.map(p => ({ slug:p.slug, body:p.content || "", text:[p.title,p.excerpt,p.seo_title,p.seo_description,p.content,JSON.stringify(p.faq || [])].join("\n") })),
  ...posts.map(p => ({ slug:p.slug, body:p.content, text:[p.title,p.excerpt,p.seo_title,p.seo_description,p.content,p.faqText].join("\n") })),
];
const planned = new Set(posts.map(p => p.slug)), old = new Set(existing.map(p => p.slug));
for (const p of posts) for (const match of p.content.matchAll(/\]\((\/journal\/[^)]+)\)/g)) {
  const slug = match[1].slice(9);
  if (!planned.has(slug) && !old.has(slug)) errors.push(p.slug + ": missing journal target " + match[1]);
}
const starts = new Map();
for (const p of all) {
  const key = opening(p.body);
  if (key && starts.has(key)) errors.push("Repeated opening pattern: " + p.slug + " and " + starts.get(key));
  else if (key) starts.set(key, p.slug);
}
const sets = all.map(p => ({slug:p.slug, values:shingles(p.text)})), overlaps = [];
for (let i = 0; i < sets.length; i++) for (let j = i + 1; j < sets.length; j++) {
  const a = sets[i].values, b = sets[j].values;
  if (!a.size || !b.size) continue;
  let common = 0; for (const value of a) if (b.has(value)) common++;
  const ratio = common / Math.min(a.size,b.size);
  if (ratio >= 0.1) overlaps.push({first:sets[i].slug,second:sets[j].slug,percent:(ratio*100).toFixed(1)+"%"});
}
for (const overlap of overlaps) errors.push("6-word overlap >=10%: " + overlap.first + " | " + overlap.second + " | " + overlap.percent);
for (const p of posts) console.log(p.slug + " | " + count(p.content) + " words | " + p.published_at);
console.log("Compared " + all.length + " posts; overlap flags: " + overlaps.length);
for (const overlap of overlaps) console.log(overlap.first + " | " + overlap.second + " | " + overlap.percent);
writeFileSync(join(tmpdir(), "jun-local-seo-gate.json"), JSON.stringify({ posts:posts.map(p=>({slug:p.slug,words:count(p.content),published_at:p.published_at})), totalCompared:all.length, overlaps, errors }, null, 2));
if (errors.length) { console.error("QUALITY GATE FAILED"); for (const error of errors) console.error(" - " + error); process.exit(1); }
console.log("QUALITY GATE PASSED");

