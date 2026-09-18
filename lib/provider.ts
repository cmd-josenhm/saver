import { normalizeJob, type Job } from "@/lib/jobs";

export class ProviderError extends Error {
  constructor(public code: string, public status = 502) { super(code); }
}

function providerBase() {
  const base = process.env.MEDIA_PROVIDER_URL;
  if (!base) throw new ProviderError("PROVIDER_NOT_CONFIGURED", 503);
  const url = new URL(base);
  if (url.protocol !== "https:") throw new ProviderError("PROVIDER_MUST_USE_HTTPS", 503);
  return url.toString().replace(/\/$/, "");
}

async function providerFetch(path: string, init: RequestInit = {}) {
  const token = process.env.MEDIA_PROVIDER_TOKEN;
  if (!token) throw new ProviderError("PROVIDER_NOT_CONFIGURED", 503);
  return fetch(providerBase() + path, {
    ...init,
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
      ...(init.headers ?? {})
    },
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(10000)
  });
}

export async function createJob(url: string, source: string): Promise<Job> {
  const response = await providerFetch("/v1/jobs", {
    method: "POST",
    body: JSON.stringify({
      url, source, maxFilesPerZip: 50, maxRecommendedZips: 5,
      maxFilesPerOperation: Number(process.env.MAX_FILES_PER_OPERATION ?? 250)
    })
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const code = typeof data?.error?.code === "string" ? data.error.code : "PROVIDER_ERROR";
    if (code === "PRIVATE_PROFILE") throw new ProviderError(code, 403);
    throw new ProviderError(code, 502);
  }
  return normalizeJob(data);
}

export async function getJob(id: string): Promise<Job> {
  const response = await providerFetch("/v1/jobs/" + encodeURIComponent(id));
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new ProviderError(response.status === 404 ? "JOB_NOT_FOUND" : "PROVIDER_ERROR", response.status === 404 ? 404 : 502);
  return normalizeJob(data);
}