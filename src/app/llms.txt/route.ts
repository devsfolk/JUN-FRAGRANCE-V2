export const revalidate = 300;

export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://junfragrance.com";
  const body = `# Jun.fragrance

Jun.fragrance is an independent Pakistani perfume brand offering 50 ml perfumes in scent styles inspired by well-known fragrances; these are not the original perfumes and Jun.fragrance is not affiliated with those brands. Each perfume is Rs. 1,999, and any three are Rs. 4,500 on the bundle page. Orders are placed through WhatsApp.

## Key pages
- Shop: ${siteUrl}/shop
- Men: ${siteUrl}/category/men
- Women: ${siteUrl}/category/women
- Unisex: ${siteUrl}/category/unisex
- Bundle: ${siteUrl}/bundle
- Journal: ${siteUrl}/journal
- FAQ: ${siteUrl}/faq
- About: ${siteUrl}/about
- Contact: ${siteUrl}/contact
- Terms: ${siteUrl}/terms-and-conditions
- Privacy: ${siteUrl}/privacy-policy

## How to order
Choose perfumes on the shop or bundle page, then use the cart or Order now button to send your order through WhatsApp. The website does not take online payments; payment options are discussed in the WhatsApp chat.
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=300",
    },
  });
}
