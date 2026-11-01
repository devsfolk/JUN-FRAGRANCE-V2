import { createClient } from "@supabase/supabase-js";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const apply = process.argv.includes("--apply");
const envText = readFileSync(resolve(root, ".env.local"), "utf8");
const env = Object.fromEntries(envText.split(/\r?\n/).filter((line) => line.includes("=")).map((line) => {
  const separator = line.indexOf("=");
  return [line.slice(0, separator).trim(), line.slice(separator + 1).trim().replace(/^['"]|['"]$/g, "")];
}));
if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) throw new Error("Missing database configuration.");
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const source = readFileSync(resolve(root, "seo-content/posts-phase1.md"), "utf8");
const block = source.split(/^=== POST ===\s*$/m)[1]?.split(/^=== END ===/m)[0]?.trim();
if (!block) throw new Error("Expected one post block.");
const [header, rest = ""] = block.split(/^--- content ---\s*$/m);
const [content, faqText = ""] = rest.split(/^--- faq ---\s*$/m);
const fields = Object.fromEntries([...header.matchAll(/^([\w_]+):\s*(.+)$/gm)].map((match) => [match[1], match[2].trim()]));
const faq = [...faqText.matchAll(/^Q:\s*(.+)\s*\nA:\s*(.+)$/gm)].map(([, question, answer]) => ({ question, answer }));
const row = {
  title: fields.title,
  slug: fields.slug,
  excerpt: fields.excerpt,
  content: content.trim(),
  seo_title: fields.seo_title,
  seo_description: fields.seo_description,
  show_on_page: fields.show_on,
  status: "published",
  published_at: fields.published_at,
  faq,
};
if (row.show_on_page !== "journal" || Date.parse(row.published_at) <= Date.now() || faq.length < 3 || faq.length > 4) throw new Error("Invalid post placement, schedule, or FAQ payload.");
const { data: before, error: readError } = await db.from("jf_blog_posts").select("*").eq("slug", row.slug);
if (readError) throw readError;
if (process.argv.includes("--verify")) {
  const { data: scheduled, error: verifyError } = await db.from("jf_blog_posts").select("slug,title,status,published_at").eq("slug", row.slug).maybeSingle();
  if (verifyError) throw verifyError;
  const { data: visible, error: visibilityError } = await db.from("jf_blog_posts").select("slug").eq("slug", row.slug).eq("status", "published").lte("published_at", new Date().toISOString());
  if (visibilityError) throw visibilityError;
  console.log(`Stored row: ${JSON.stringify(scheduled)}`);
  console.log(`Visible under published-and-due query: ${visible?.length ? "yes" : "no"}`);
  if (!scheduled || scheduled.status !== "published" || Date.parse(scheduled.published_at) !== Date.parse(row.published_at) || visible?.length) process.exit(1);
  process.exit(0);
}
const backupDir = resolve(root, "backups");
if (!existsSync(backupDir)) mkdirSync(backupDir, { recursive: true });
const backupPath = resolve(backupDir, `phase1-post-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
writeFileSync(backupPath, JSON.stringify({ created_at: new Date().toISOString(), slug: row.slug, existing_rows: before ?? [] }, null, 2), "utf8");
console.log(`Mode: ${apply ? "APPLY" : "DRY-RUN"}; backup written: ${backupPath}`);
console.log(`BEFORE ${row.slug}: ${before?.length ? JSON.stringify(before) : "absent"}`);
console.log(`AFTER planned ${row.slug}: ${row.status} @ ${row.published_at}`);
if (!apply) process.exit(0);
if (before?.length) throw new Error("Refusing to overwrite an existing row; inspect the backup first.");
const { error: insertError } = await db.from("jf_blog_posts").insert(row);
if (insertError) throw insertError;
const { data: after, error: verifyError } = await db.from("jf_blog_posts").select("slug,title,status,published_at").eq("slug", row.slug).maybeSingle();
if (verifyError) throw verifyError;
if (!after || after.status !== "published" || Date.parse(after.published_at) !== Date.parse(row.published_at)) throw new Error(`Post insert verification did not match the scheduled row: ${JSON.stringify(after)}`);
console.log(`AFTER confirmed: ${JSON.stringify(after)}`);
