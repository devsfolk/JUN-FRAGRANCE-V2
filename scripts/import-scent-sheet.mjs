import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
function envFile() {
  const text = fs.readFileSync(path.join(root, ".env.local"), "utf8");
  const env = {};
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (match) env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
  }
  return env;
}
function parseCsv(text) {
  const rows = [];
  let row = [], cell = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted && char === '"' && text[i + 1] === '"') { cell += '"'; i++; }
    else if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) { row.push(cell); cell = ""; }
    else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); if (row.some((part) => part.trim())) rows.push(row);
      row = []; cell = "";
    } else cell += char;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const headers = rows.shift().map((item) => item.replace(/^\uFEFF/, "").trim().replace(/\s*\(.+\)$/, ""));
  return rows.map((cells) => Object.fromEntries(headers.map((key, i) => [key, (cells[i] ?? "").trim()])));
}
const lists = (value = "") => value.split(";").map((item) => item.trim()).filter(Boolean);
const familySet = new Set(["fresh", "citrus", "aquatic", "woody", "oud", "floral", "sweet", "spicy", "musky", "fruity"]);
const occasionSet = new Set(["day", "office", "evening", "wedding"]);
const seasonSet = new Set(["summer", "winter", "all year"]);
const strengthSet = new Set(["soft", "moderate", "strong"]);
const env = envFile();
const base = (env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL || "").replace(/\/$/, "");
const key = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_KEY || "";
if (!base || !key) throw new Error("Supabase URL or service role key is missing from .env.local");
const apply = process.argv.includes("--apply");
if (apply === process.argv.includes("--dry-run")) throw new Error("Choose exactly one of --dry-run or --apply");
const rows = parseCsv(fs.readFileSync(path.join(root, "scent-sheet.csv"), "utf8"));
const slugs = [...new Set(rows.map((row) => row.slug).filter(Boolean))];
const query = new URLSearchParams({ select: "id,slug,title,scent_profile,notes_top,notes_heart,notes_base", slug: `in.(${slugs.join(",")})` });
const response = await fetch(`${base}/rest/v1/jf_products?${query}`, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
if (!response.ok) throw new Error(`Product read failed (${response.status}): ${await response.text()}`);
const products = await response.json();
const bySlug = new Map(products.map((product) => [product.slug, product]));
const unknown = rows.filter((row) => row.slug && !bySlug.has(row.slug)).map((row) => row.slug);
const plans = [];
const empty = [];
for (const [index, row] of rows.entries()) {
  const old = bySlug.get(row.slug);
  if (!old) continue;
  const cells = ["main_family", "best_for", "strength", "season", "notes_top", "notes_heart", "notes_base"];
  if (cells.every((name) => !row[name])) empty.push({ row: index + 2, slug: row.slug });
  const family = lists(row.main_family).map((x) => x.toLowerCase());
  const occasion = lists(row.best_for).map((x) => x.toLowerCase());
  const season = lists(row.season).map((x) => x.toLowerCase().replaceAll("-", " "));
  const strength = (row.strength ?? "").trim().toLowerCase() || null;
  for (const value of [...family, ...occasion, ...season, ...(strength ? [strength] : [])]) {
    if (!(familySet.has(value) || occasionSet.has(value) || seasonSet.has(value) || strengthSet.has(value))) throw new Error(`Unknown profile value '${value}' in row ${index + 2} (${row.slug})`);
  }
  let profile = old.scent_profile;
  if (family.length || occasion.length || season.length || strength) {
    profile = {
      families: family.length ? family : (profile?.families ?? []),
      strength: strength ?? profile?.strength ?? null,
      occasions: occasion.length ? occasion : (profile?.occasions ?? []),
      seasons: season.length ? season : (profile?.seasons ?? []),
      heat_ok: profile?.heat_ok ?? false,
    };
  }
  const patch = {};
  if (profile !== old.scent_profile) patch.scent_profile = profile;
  for (const [source, target] of [["notes_top", "notes_top"], ["notes_heart", "notes_heart"], ["notes_base", "notes_base"]]) {
    if (row[source]) patch[target] = lists(row[source]);
  }
  if (Object.keys(patch).length) plans.push({ old, patch });
}
const backups = path.join(root, "backups");
fs.mkdirSync(backups, { recursive: true });
const backupFile = path.join(backups, `scent-sheet-${new Date().toISOString().replaceAll(":", "-")}.json`);
fs.writeFileSync(backupFile, JSON.stringify({ created_at: new Date().toISOString(), rows: plans.map(({ old }) => old) }, null, 2), "utf8");
console.log(`${apply ? "APPLY" : "DRY RUN"}: ${rows.length} CSV rows; ${plans.length} products to update; ${unknown.length} unknown slugs; ${empty.length} empty data rows.`);
console.log(`Backup: ${path.relative(root, backupFile)} (${plans.length} existing rows)`);
console.log(`Unknown slugs: ${JSON.stringify(unknown)}`);
console.log(`Empty rows: ${JSON.stringify(empty)}`);
for (const { old, patch } of plans) {
  console.log(`${old.slug} BEFORE ${JSON.stringify({ scent_profile: old.scent_profile, notes_top: old.notes_top, notes_heart: old.notes_heart, notes_base: old.notes_base })}`);
  console.log(`${old.slug} AFTER  ${JSON.stringify({ ...old, ...patch })}`);
  if (apply) {
    const write = await fetch(`${base}/rest/v1/jf_products?id=eq.${encodeURIComponent(old.id)}`, {
      method: "PATCH", headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "return=minimal" }, body: JSON.stringify(patch),
    });
    if (!write.ok) throw new Error(`Update failed for ${old.slug} (${write.status}): ${await write.text()}`);
  }
}
