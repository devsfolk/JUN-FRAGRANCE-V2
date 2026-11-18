import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { chromium, webkit } from "playwright";

const baseUrl = process.env.QA_BASE_URL || "http://127.0.0.1:3100";
const outputDir = path.resolve("qa-output");
const viewports = [
  { width: 320, height: 568 },
  { width: 360, height: 740 },
  { width: 375, height: 667 },
  { width: 390, height: 844 },
  { width: 412, height: 915 },
];
const routes = [
  "/", "/shop", "/shop/pink-mirage", "/category/men", "/bundle", "/gifts",
  "/delivery", "/perfume-price-list", "/journal", "/journal/how-to-store-perfume",
  "/about", "/contact", "/faq", "/perfume-finder", "/custom",
];
const browsers = [
  ["chromium", chromium],
  ["webkit", webkit],
];
const issues = [];
const addIssue = (route, device, issue, severity) => issues.push({ route, device, issue, severity });

await fs.mkdir(outputDir, { recursive: true });
for (const [browserName, browserType] of browsers) {
  let browser;
  try {
    browser = await browserType.launch({ headless: true });
  } catch (error) {
    addIssue("*", browserName, `Browser could not launch: ${error.message}`, "blocker");
    continue;
  }

  for (const viewport of viewports) {
    const device = `${browserName} ${viewport.width}x${viewport.height}`;
    const context = await browser.newContext({ viewport, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    const page = await context.newPage();
    for (const route of routes) {
      const consoleErrors = [];
      const failedRequests = [];
      const onConsole = (message) => { if (message.type() === "error") consoleErrors.push(message.text()); };
      const onFailed = (request) => failedRequests.push(`${request.method()} ${request.url()} (${request.failure()?.errorText || "failed"})`);
      page.on("console", onConsole);
      page.on("requestfailed", onFailed);
      let response;
      try {
        response = await page.goto(new URL(route, baseUrl).href, { waitUntil: "networkidle", timeout: 45000 });
      } catch (error) {
        addIssue(route, device, `Navigation failed: ${error.message}`, "high");
      }
      if (!response) {
        page.off("console", onConsole);
        page.off("requestfailed", onFailed);
        continue;
      }
      if (route === "/custom" && response.status() === 404) {
        page.off("console", onConsole);
        page.off("requestfailed", onFailed);
        continue;
      }
      if (response.status() >= 400) addIssue(route, device, `HTTP ${response.status()}`, response.status() >= 500 ? "high" : "medium");
      await page.screenshot({ path: path.join(outputDir, `${browserName}-${viewport.width}x${viewport.height}-${route.replaceAll("/", "_") || "home"}.png`), fullPage: true, animations: "disabled" }).catch(() => {});

      const pageIssues = await page.evaluate(() => {
        const visible = (element) => {
          const rect = element.getBoundingClientRect();
          const style = getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
        };
        const rectOf = (element) => {
          const rect = element.getBoundingClientRect();
          return { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height };
        };
        const overlaps = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
        const overflow = document.documentElement.scrollWidth > window.innerWidth;
        const brokenImages = [...document.images].filter((image) => image.complete && (image.naturalWidth === 0 || image.naturalHeight === 0)).map((image) => image.currentSrc || image.src);
        const undersizedTargets = [...document.querySelectorAll("a,button,input,select,textarea,[role=button]")]
          .filter(visible)
          .map((element) => ({ element, rect: element.getBoundingClientRect() }))
          .filter(({ rect }) => rect.width < 44 || rect.height < 44)
          .map(({ element, rect }) => ({ label: (element.getAttribute("aria-label") || element.innerText || element.getAttribute("placeholder") || element.tagName).trim().replace(/\s+/g, " ").slice(0, 70), width: Math.round(rect.width), height: Math.round(rect.height) }))
          .slice(0, 30);
        const floaters = [...document.querySelectorAll("a[href*='wa.me'],button,[role=button]")]
          .filter((element) => visible(element) && ["fixed", "sticky"].includes(getComputedStyle(element).position))
          .map((element) => ({ element, rect: rectOf(element), label: (element.getAttribute("aria-label") || element.innerText || element.tagName).trim().replace(/\s+/g, " ").slice(0, 60) }));
        const floatingButtons = floaters.filter(({ element }) => element.matches("a[href*='wa.me'],button[aria-label*='cart' i],[data-cart-button]"));
        const stickyBars = floaters.filter(({ element }) => element.matches("[class*='sticky'],[data-sticky-bar]"));
        const collisions = [];
        for (const floating of floatingButtons) for (const sticky of stickyBars) {
          if (floating.element !== sticky.element && overlaps(floating.rect, sticky.rect)) collisions.push(`${floating.label} overlaps ${sticky.label}`);
        }
        const clippedText = [...document.querySelectorAll("h1,h2,h3,p,a,button,span,label")]
          .filter(visible)
          .filter((element) => {
            const style = getComputedStyle(element);
            if (Number(style.webkitLineClamp) > 0) return false;
            return (style.overflowX === "hidden" || style.overflowY === "hidden" || style.textOverflow === "ellipsis") && (element.scrollWidth > element.clientWidth + 2 || element.scrollHeight > element.clientHeight + 2);
          })
          .map((element) => (element.innerText || element.getAttribute("aria-label") || element.tagName).trim().replace(/\s+/g, " ").slice(0, 80))
          .slice(0, 20);
        return { overflow, brokenImages, undersizedTargets, collisions, clippedText };
      });

      if (pageIssues.overflow) addIssue(route, device, "Horizontal overflow (documentElement.scrollWidth > innerWidth)", "high");
      for (const image of pageIssues.brokenImages) addIssue(route, device, `Broken image: ${image}`, "medium");
      for (const collision of pageIssues.collisions) addIssue(route, device, `Floating control overlap: ${collision}`, "high");
      if (pageIssues.undersizedTargets.length) addIssue(route, device, `Tap targets under 44x44: ${JSON.stringify(pageIssues.undersizedTargets)}`, "medium");
      for (const text of pageIssues.clippedText) addIssue(route, device, `Possibly clipped text: ${text}`, "low");
      for (const error of consoleErrors) addIssue(route, device, `Console error: ${error}`, "medium");
      for (const request of failedRequests) addIssue(route, device, `Failed request: ${request}`, "medium");
      page.off("console", onConsole);
      page.off("requestfailed", onFailed);
    }
    await context.close();
  }
  await browser.close();
}

await fs.writeFile(path.join(outputDir, "report.json"), `${JSON.stringify({ baseUrl, routes, viewports, issues }, null, 2)}\n`, "utf8");
console.log("route | device | issue | severity");
for (const issue of issues) console.log(`${issue.route} | ${issue.device} | ${issue.issue} | ${issue.severity}`);
console.log(`Saved ${issues.length} issue rows and screenshots in ${outputDir}`);
