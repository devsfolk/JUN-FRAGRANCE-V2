import { createClient } from "@supabase/supabase-js";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, join } from "node:path";

const root = process.cwd();
const apply = process.argv.includes("--apply");
const env = Object.fromEntries(readFileSync(join(root, ".env.local"), "utf8").split(/\r?\n/).filter(line => line.includes("=")).map(line => [line.slice(0, line.indexOf("=")).trim(), line.slice(line.indexOf("=") + 1).trim().replace(/^['"]|['"]$/g, "")]));
if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) throw new Error("Missing database configuration");
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const file = resolve(root, "seo-content/posts-round4.md");
const text = readFileSync(file, "utf8");
const blocks = text.split(/^=== POST ===\s*$/m).slice(1).map(block => block.split(/^=== END ===/m)[0].trim()).filter(Boolean);
const posts = blocks.map(block => {
  const parts = block.split(/^--- content ---\s*$/m), header = parts[0], rest = parts[1] || "";
  const sections = rest.split(/^--- faq ---\s*$/m);
  const fields = Object.fromEntries([...header.matchAll(/^([\w_]+):\s*(.+)$/gm)].map(match => [match[1], match[2].trim()]));
  const faq = [...(sections[1] || "").matchAll(/^Q:\s*(.+)\s*\nA:\s*(.+)$/gm)].map(([,question,answer]) => ({ question, answer }));
  return { slug:fields.slug, title:fields.title, excerpt:fields.excerpt, content:sections[0].trim(), seo_title:fields.seo_title, seo_description:fields.seo_description, show_on_page:fields.show_on, status:"published", published_at:fields.published_at, faq };
});
if (posts.length !== 7 || new Set(posts.map(post => post.slug)).size !== 7) throw new Error("Expected seven unique post blocks");
for (const post of posts) {
  if (!post.slug || !post.title || !post.excerpt || !post.seo_title || !post.seo_description || !post.content || post.show_on_page !== "journal" || post.status !== "published" || !post.published_at || post.faq.length < 3) throw new Error("Incomplete post payload: " + post.slug);
  if (Date.parse(post.published_at) <= Date.now()) throw new Error("Scheduled date is not in the future: " + post.slug);
}
const { data: existing, error } = await db.from("jf_blog_posts").select("id,slug,title,status,published_at").in("slug", posts.map(post => post.slug));
if (error) throw error;
if (existing.length) throw new Error("Refusing to overwrite existing slugs: " + existing.map(post => post.slug).join(", "));
const backupDir = resolve(root, "backups");
if (!existsSync(backupDir)) mkdirSync(backupDir, { recursive: true });
const backupPath = resolve(backupDir, "local-seo-posts-before-import-" + new Date().toISOString().replace(/[:.]/g, "-") + ".json");
writeFileSync(backupPath, JSON.stringify({ created_at:new Date().toISOString(), existing_rows:existing }, null, 2));
console.log("Mode: " + (apply ? "APPLY" : "DRY-RUN") + "; backup: " + backupPath);
for (const post of posts) console.log(post.slug + " | before: absent | after: " + post.status + " @ " + post.published_at);
if (apply) {
  const { error: insertError } = await db.from("jf_blog_posts").insert(posts);
  if (insertError) throw insertError;
  const { data: after, error: verifyError } = await db.from("jf_blog_posts").select("slug,status,published_at").in("slug", posts.map(post => post.slug)).order("published_at");
  if (verifyError) throw verifyError;
  if (after.length !== posts.length || after.some((post,index) => post.status !== "published" || post.published_at !== posts[index].published_at)) throw new Error("Post import verification did not match requested status/dates");
  for (const post of after) console.log("AFTER CONFIRMED " + post.slug + " | " + post.status + " | " + post.published_at);
}

