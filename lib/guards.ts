const PRIVATE_HOSTS = new Set(["localhost","127.0.0.1","0.0.0.0","::1","169.254.169.254"]);

export function safeExternalHttps(raw: string, allowedHosts: Set<string>): boolean {
  try {
    const u = new URL(raw);
    const host = u.hostname.toLowerCase().replace(/^www\./, "");
    if (u.protocol !== "https:" || u.username || u.password || u.port) return false;
    if (PRIVATE_HOSTS.has(host) || host.endsWith(".local") || host.endsWith(".internal")) return false;
    return allowedHosts.has(host);
  } catch { return false; }
}

export function providerDownloadHosts(): Set<string> {
  const configured = (process.env.MEDIA_DOWNLOAD_HOSTS ?? "").split(",").map(x => x.trim().toLowerCase().replace(/^www\./, "")).filter(Boolean);
  if (configured.length) return new Set(configured);
  try {
    const u = new URL(process.env.MEDIA_PROVIDER_URL ?? "");
    return new Set([u.hostname.toLowerCase().replace(/^www\./, "")]);
  } catch { return new Set(); }
}