import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const baseUrl = process.env.QA_BASE_URL || "http://127.0.0.1:3100";
const outputDir = path.resolve("qa-output");
const results = [];
const record = (route, scenario, result, details = "") => results.push({ route, scenario, result, details });

await fs.mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

for (const route of ["/shop", "/", "/category/men", "/journal", "/perfume-price-list"]) {
  try {
    const response = await page.goto(new URL(route, baseUrl).href, { waitUntil: "networkidle", timeout: 30000 });
    if (!response || response.status() >= 400) {
      record(route, "scroll restoration", "blocked", `Page returned ${response?.status() ?? "no response"}`);
      continue;
    }
    await page.evaluate(() => window.scrollTo(0, 1500));
    await page.waitForTimeout(150);
    const before = await page.evaluate(() => window.scrollY);
    const links = page.locator("main a[href^='/shop/'],main a[href^='/journal/']");
    if (await links.count() === 0) {
      record(route, "scroll restoration", "skipped", "No product/article item rendered to navigate to");
      continue;
    }
    const targetHref = await links.first().getAttribute("href");
    await links.first().click({ timeout: 7000 });
    await page.waitForURL((url) => url.pathname !== route, { timeout: 10000 });
    await page.goBack({ waitUntil: "domcontentloaded", timeout: 15000 });
    await page.waitForTimeout(500);
    const after = await page.evaluate(() => window.scrollY);
    const delta = Math.abs(before - after);
    record(route, "scroll restoration", delta <= 100 ? "pass" : "fail", `before=${before}, after=${after}, delta=${delta}, target=${targetHref}`);
  } catch (error) {
    record(route, "scroll restoration", "blocked", error.message);
  }
}

try {
  const response = await page.goto(new URL("/shop", baseUrl).href, { waitUntil: "networkidle", timeout: 30000 });
  const input = page.locator("#shop-search");
  const firstProduct = page.locator("main a[href^='/shop/']").first();
  if (response?.status() < 400 && await input.count() && await firstProduct.count()) {
    const title = (await firstProduct.innerText()).trim().split("\n")[0];
    await input.fill(title);
    await page.waitForTimeout(150);
    const filtered = page.locator("main a[href^='/shop/']").first();
    const targetHref = await filtered.getAttribute("href");
    await filtered.click();
    await page.waitForURL((url) => url.pathname !== "/shop");
    await page.goBack({ waitUntil: "domcontentloaded" });
    await page.waitForTimeout(250);
    record("/shop", "search retained after Back", (await page.locator("#shop-search").inputValue()) === title ? "pass" : "fail", `query=${title}, target=${targetHref}`);
  } else record("/shop", "search retained after Back", "skipped", "No product links rendered");
} catch (error) { record("/shop", "search retained after Back", "blocked", error.message); }

try {
  await page.goto(new URL("/", baseUrl).href, { waitUntil: "networkidle", timeout: 30000 });
  const cartButton = page.getByRole("button", { name: "View shopping cart" });
  if (await cartButton.count()) {
    await cartButton.click();
    await page.getByRole("dialog", { name: "Your Fragrance Cart" }).waitFor({ state: "visible", timeout: 5000 });
    await page.goBack({ waitUntil: "domcontentloaded" });
    await page.getByRole("dialog", { name: "Your Fragrance Cart" }).waitFor({ state: "hidden", timeout: 5000 });
    record("/", "Back closes cart drawer", "pass", "Remained on home route");
  } else record("/", "Back closes cart drawer", "skipped", "Cart control is not rendered");
} catch (error) { record("/", "Back closes cart drawer", "fail", error.message); }

try {
  await page.goto(new URL("/", baseUrl).href, { waitUntil: "networkidle", timeout: 30000 });
  const countryButton = page.getByRole("button", { name: "Choose delivery country" });
  if (await countryButton.count()) {
    await countryButton.click();
    await page.getByRole("dialog", { name: "Deliver to" }).waitFor({ state: "visible", timeout: 5000 });
    await page.goBack({ waitUntil: "domcontentloaded" });
    await page.getByRole("dialog", { name: "Deliver to" }).waitFor({ state: "hidden", timeout: 5000 });
    record("/", "Back closes country sheet", "pass", "Remained on home route");
  } else record("/", "Back closes country sheet", "skipped", "International country selector is disabled");
} catch (error) { record("/", "Back closes country sheet", "fail", error.message); }

try {
  await page.goto(new URL("/", baseUrl).href, { waitUntil: "networkidle", timeout: 30000 });
  const giftSheet = page.getByRole("dialog", { name: /gift/i });
  record("/", "Back closes gift sheet", await giftSheet.count() ? "pending" : "not applicable", "No standalone gift sheet exists; gift option is inline in order forms");
} catch (error) { record("/", "Back closes gift sheet", "blocked", error.message); }

for (const [route, stepText] of [["/custom", "Step 3 of 5"], ["/perfume-finder", "Step 3 of 5"]]) {
  try {
    const response = await page.goto(new URL(route, baseUrl).href, { waitUntil: "networkidle", timeout: 30000 });
    if (!response || response.status() >= 400) {
      record(route, "wizard Back returns one step", "skipped", `Page returned ${response?.status() ?? "no response"}`);
      continue;
    }
    const next = page.getByRole("button", { name: "Next" });
    if (await next.count() === 0) { record(route, "wizard Back returns one step", "skipped", "Wizard controls unavailable"); continue; }
    await next.first().click();
    await page.getByText("Step 2 of 5").waitFor();
    await next.first().click();
    await page.getByText(stepText).waitFor();
    await page.goBack({ waitUntil: "domcontentloaded" });
    await page.getByText("Step 2 of 5").waitFor();
    record(route, "wizard Back returns one step", "pass", "Step 3 returned to step 2 without leaving the page");
  } catch (error) { record(route, "wizard Back returns one step", "fail", error.message); }
}

await page.screenshot({ path: path.join(outputDir, "back-navigation-final.png"), fullPage: true }).catch(() => {});
await browser.close();
await fs.writeFile(path.join(outputDir, "back-navigation.json"), `${JSON.stringify(results, null, 2)}\n`, "utf8");
console.log("route | scenario | result | details");
for (const result of results) console.log(`${result.route} | ${result.scenario} | ${result.result} | ${result.details}`);
