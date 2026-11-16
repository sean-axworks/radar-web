import type { MetadataRoute } from "next";
import grants from "@/data/grants.json";
import bids from "@/data/bids.json";

export const dynamic = "force-static";

const baseUrl = "https://radar-web-coral.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${baseUrl}/` },
    { url: `${baseUrl}/calculator/` },
    ...grants.map(({ id }) => ({ url: `${baseUrl}/grants/${id}/` })),
    ...bids.map(({ id }) => ({ url: `${baseUrl}/bids/${id}/` })),
  ];
}
