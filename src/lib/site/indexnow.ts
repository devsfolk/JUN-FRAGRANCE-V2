/**
 * Best-effort IndexNow ping utility.
 * Only sends when:
 * 1. INDEXNOW_KEY environment variable is set
 * 2. NEXT_PUBLIC_SITE_URL begins with https://
 * 3. VERCEL_ENV is "production"
 *
 * Never blocks caller, never throws, never logs secrets.
 */
export async function pingIndexNow(urls: string[]): Promise<void> {
  const key = process.env.INDEXNOW_KEY?.trim();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const vercelEnv = process.env.VERCEL_ENV?.trim();

  if (!key || !siteUrl || !siteUrl.startsWith("https://") || vercelEnv !== "production") {
    return;
  }

  if (!urls || urls.length === 0) return;

  try {
    const host = new URL(siteUrl).hostname;
    const keyLocation = `https://${host}/indexnow.txt`;

    // Ensure all URLs are absolute
    const urlList = urls.map((u) => (u.startsWith("http") ? u : `${siteUrl}${u.startsWith("/") ? "" : "/"}${u}`));

    const payload = {
      host,
      key,
      keyLocation,
      urlList,
    };

    await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify(payload),
    }).catch(() => {
      // Best effort, ignore network issues
    });
  } catch {
    // Best effort, never throw
  }
}
