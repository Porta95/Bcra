import type { MetadataRoute } from "next";
import { getVariables, type Variable } from "@/lib/bcra";

const BASE = "https://panel-bcra.vercel.app";

export const revalidate = 86400;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticUrls: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE}/macro`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/deudores`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/cheques`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
  ];

  let vars: Variable[] = [];
  try {
    vars = await getVariables();
  } catch {
    vars = [];
  }

  const principales = vars
    .filter((v) => /principales/i.test(v.categoria))
    .slice(0, 60);

  const variableUrls: MetadataRoute.Sitemap = principales.map((v) => ({
    url: `${BASE}/variable/${v.idVariable}`,
    lastModified: v.ultFechaInformada ? new Date(v.ultFechaInformada) : now,
    changeFrequency: "daily",
    priority: 0.6,
  }));

  return [...staticUrls, ...variableUrls];
}
