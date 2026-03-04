import { getCloudflareContext } from "@opennextjs/cloudflare";

const BASE_URL = "https://invite.deardrawer.com";

const STATIC_PAGES = [
  { path: "/", changefreq: "weekly", priority: 1.0 },
  { path: "/gallery", changefreq: "weekly", priority: 0.9 },
  { path: "/templates", changefreq: "weekly", priority: 0.8 },
  { path: "/privacy", changefreq: "monthly", priority: 0.3 },
];

const SAMPLE_SLUGS = [
  "sample-our",
  "sample-family",
  "sample-magazine",
  "sample-film",
  "sample-record",
  "sample-exhibit",
  "sample-feed",
  "sample-essay",
  "sample-essay-paper",
  "sample-essay-book",
];

export async function GET() {
  const now = new Date().toISOString();

  // 공개된 청첩장 slug 목록 조회
  let publishedInvitations: { slug: string; updated_at: string }[] = [];
  try {
    const { env } = (await getCloudflareContext()) as {
      env: { DB?: { prepare: (q: string) => { all: <T>() => Promise<{ results?: T[] }> } } };
    };
    if (env.DB) {
      const result = await env.DB
        .prepare("SELECT slug, updated_at FROM invitations WHERE is_published = 1 AND slug IS NOT NULL")
        .all<{ slug: string; updated_at: string }>();
      publishedInvitations = result.results || [];
    }
  } catch {
    // DB 접근 실패 시 정적 페이지만 포함
  }

  const urls: string[] = [];

  // 정적 페이지
  for (const page of STATIC_PAGES) {
    urls.push(`  <url>
    <loc>${BASE_URL}${page.path}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`);
  }

  // 샘플 청첩장
  for (const slug of SAMPLE_SLUGS) {
    urls.push(`  <url>
    <loc>${BASE_URL}/i/${slug}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`);
  }

  // 공개된 청첩장
  for (const inv of publishedInvitations) {
    urls.push(`  <url>
    <loc>${BASE_URL}/i/${inv.slug}</loc>
    <lastmod>${inv.updated_at || now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>`);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
