# Prompt for Antigravity / Codex

Copy everything inside the code block below and paste it to your coding agent. Run it from the project root, with the `seo-content/` folder already inside the project.

```text
Task: import the SEO content files from the /seo-content folder into this website, then commit and push to git.

Context: this is the website for Jun.fragrance (www.junfragrance.com), a Pakistani perfume shop. Technical SEO (sitemap, robots, canonicals, structured data, meta tags) is already built. Do NOT rebuild any of it. Your job is only to load the new content.

Files in /seo-content:
- products.json: array of 27 objects { slug, short_description, description, seo_title, seo_description }
- categories.json: array of 3 objects { slug, description, seo_title, seo_description } for men, women, unisex
- pages-seo.json: array of { page_key, seo_title, seo_description } for home, shop, about, contact, journal, faq, bundle
- about.md: content for /about
- faq.json: array of { question, answer } for /faq (it must keep feeding the FAQPage structured data)
- terms.md and privacy.md: content for /terms-and-conditions and /privacy-policy. Both start with the line "Last updated: {{DATE}}". Replace {{DATE}} with the date of the import, written like "29 October 2026".
- posts.txt: 9 journal posts in this exact block format:
  === POST ===
  title: / slug: / show_on: / excerpt: / seo_title: / seo_description:
  --- content --- (Markdown)
  --- faq --- (pairs of "Q:" and "A:")
  === END ===
  show_on is one of: journal, home, category:men, category:women.
  In the products descriptions, "\n\n" means a paragraph break and must be rendered as one.

Steps:
1. First read the codebase and find out how products, categories, page SEO fields, FAQ, journal posts and static pages are stored (database, seed files, JSON, CMS tables, etc.) and how the admin dashboard edits SEO titles and descriptions. Tell me briefly what you found before changing anything.
2. Write one import script (for example scripts/import-seo-content.*) that is safe to run many times (idempotent: match by slug or page_key, update, do not duplicate). Update ONLY the fields listed above. Do not touch prices, images, stock, order logic or design.
3. Match existing products, categories and pages by slug or page_key. If a slug in the files does not exist in the site, do not create it: list it in a report for me.
4. Journal posts: create or update by slug. Keep the Markdown as is. Save excerpt, seo_title, seo_description and show_on. Save the faq pairs in the same place the site already uses for FAQ blocks, so the FAQPage structured data keeps working. Do not add an H1 inside the content, the page title is the H1. Internal links in the content must stay as relative links.
5. Do not add the brand name to any seo_title. The site adds " | Jun.fragrance" automatically.
6. Before importing, validate: all JSON parses, seo_title is at most 45 characters, seo_description at most 155, product short_description at most 140, category description at most 160. Print a list of any failures and stop rather than truncating text.
7. Keep a backup of the current values (for example a JSON dump in /backups) before overwriting, because the client may have edited some SEO fields in the dashboard. Show me which records had different existing values.
8. Run the existing build and tests. Open /shop/pink-mirage, /category/men, /about, /faq and one journal post and check that the title tag, meta description, canonical and structured data render correctly.
9. Create a git branch named seo-content-import, make clear commits (script, content, then any code changes), and push the branch. Do not force push, do not rewrite history, and do not commit secrets or .env files. If the repo deploys from main and the build and tests pass, merge into main and push.
10. At the end, give me a short report: what was imported, what was skipped or could not be mapped, and anything I need to do by hand. Do not guess where something is unclear; ask me.

Rules: do not change visible design, do not rewrite the supplied text, do not invent content, do not add any real perfume brand names anywhere.
```

## Notes for you

- The about page, FAQ and privacy policy contain facts from your business details. If any fact changes (delivery charges, return rules, hours), edit the file and run the import again.
- The privacy file has a "Website data" section about analytics. Delete that section if your site does not use analytics or cookies.
- `offsite-pack.md` is not imported. Use it by hand.
