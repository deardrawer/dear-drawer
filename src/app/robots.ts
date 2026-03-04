import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/editor", "/my-invitations", "/dashboard", "/admin", "/login", "/api/"],
      },
    ],
    sitemap: "https://invite.deardrawer.com/sitemap.xml",
  };
}
