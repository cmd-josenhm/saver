import { z } from "zod";

const HOSTS = new Map<string, "instagram" | "tiktok">([
  ["instagram.com", "instagram"], ["www.instagram.com", "instagram"], ["m.instagram.com", "instagram"],
  ["tiktok.com", "tiktok"], ["www.tiktok.com", "tiktok"], ["vm.tiktok.com", "tiktok"], ["vt.tiktok.com", "tiktok"]
]);

export const schema = z.object({ url: z.string().trim().min(1).max(2048).url() });
export type Source = "instagram" | "tiktok";

export function classify(raw: string): Source | "invalid" | "unsupported" {
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:" || u.username || u.password || u.port) return "invalid";
    const source = HOSTS.get(u.hostname.toLowerCase());
    if (!source) return "unsupported";
    if (u.pathname === "/" || u.pathname.length < 2) return "invalid";
    return source;
  } catch { return "invalid"; }
}

export function normalizeInput(raw: string): string {
  const u = new URL(raw.trim());
  u.hash = "";
  return u.toString();
}