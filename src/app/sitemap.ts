import type { MetadataRoute } from "next";

const SITE = "https://politeia.co";

const STATIC_PATHS = [
  "/",
  "/senators",
  "/representatives",
  "/bills",
  "/investments",
  "/cspan",
  "/chat",
  "/donate",
  "/about",
  "/privacy",
  "/terms",
  "/cabinet",
  "/candidates",
  "/campaigns",
  "/trump-trades",
  "/uk",
  "/germany",
  "/india",
  "/europe",
  "/canada",
  "/latin-america",
  "/us",
  "/us/mayors",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return STATIC_PATHS.map((path) => ({
    url: `${SITE}${path === "/" ? "" : path}`,
    lastModified,
    changeFrequency: path === "/" ? "hourly" : "daily",
    priority: path === "/" ? 1 : 0.7,
  }));
}
