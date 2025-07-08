import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ site }) => {
  const baseUrl = site?.toString() || "https://etchnft.com";

  // Static pages
  const staticPages = [
    { url: "", priority: "1.0", changefreq: "weekly" },
    { url: "about", priority: "0.8", changefreq: "monthly" },
    { url: "gallery", priority: "0.9", changefreq: "weekly" },
    { url: "pitch", priority: "0.7", changefreq: "monthly" },
    { url: "my-orders", priority: "0.6", changefreq: "weekly" },
    { url: "checkout", priority: "0.7", changefreq: "monthly" },
    { url: "success", priority: "0.5", changefreq: "yearly" },
  ];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticPages
  .map(
    (page) => `
  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`,
  )
  .join("")}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=86400", // Cache for 24 hours
    },
  });
};
