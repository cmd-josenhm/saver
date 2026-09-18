import { NextRequest, NextResponse } from "next/server";
import { providerDownloadHosts, safeExternalHttps } from "@/lib/guards";
import { verifyJobToken } from "@/lib/job-token";
import { getJob, ProviderError } from "@/lib/provider";
import { enforceRateLimit } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || req.headers.get("x-real-ip")
    || "unknown";
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!/^[A-Za-z0-9_-]{8,128}$/.test(id)) {
    return NextResponse.json({ error: "Job invalide." }, { status: 400 });
  }

  if (!verifyJobToken(id, req.headers.get("x-job-token"))) {
    return NextResponse.json({ error: "Accès au job refusé." }, { status: 401 });
  }

  try {
    if (!(await enforceRateLimit(`poll:${clientIp(req)}:${id}`, 60, "1 m"))) {
      return NextResponse.json({ error: "Trop de requêtes." }, { status: 429 });
    }

    const job = await getJob(id);
    const hosts = providerDownloadHosts();
    const urls = [...job.zipUrls, ...(job.failedZipUrl ? [job.failedZipUrl] : [])];

    if (urls.some((url) => !safeExternalHttps(url, hosts))) {
      console.error("unsafe_provider_download_url", { id });
      return NextResponse.json({ error: "Réponse de téléchargement non sûre." }, { status: 502 });
    }

    return NextResponse.json(job, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("job_status", error);
    if (error instanceof ProviderError && error.code === "JOB_NOT_FOUND") {
      return NextResponse.json({ error: "Job introuvable." }, { status: 404 });
    }
    if (error instanceof Error && error.message === "RATE_LIMIT_NOT_CONFIGURED") {
      return NextResponse.json({ error: "Service non configuré pour la production." }, { status: 503 });
    }
    return NextResponse.json({ error: "Impossible de récupérer la progression." }, { status: 502 });
  }
}
