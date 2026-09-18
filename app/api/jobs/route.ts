import { NextRequest, NextResponse } from "next/server";
import { schema, classify, normalizeInput } from "@/lib/url";
import { createJob, ProviderError } from "@/lib/provider";
import { enforceRateLimit } from "@/lib/ratelimit";
import { issueJobToken } from "@/lib/job-token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 16_384;

function clientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || req.headers.get("x-real-ip")
    || "unknown";
}

export async function POST(req: NextRequest) {
  const ip = clientIp(req);

  try {
    if (!(await enforceRateLimit(`create:${ip}`, 10, "1 m"))) {
      return NextResponse.json({ error: "Trop de demandes. Réessayez dans un instant." }, { status: 429 });
    }

    const contentLength = Number(req.headers.get("content-length") ?? 0);
    if (contentLength > MAX_BODY_BYTES) {
      return NextResponse.json({ error: "Requête trop volumineuse." }, { status: 413 });
    }

    if (!req.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
      return NextResponse.json({ error: "Content-Type invalide." }, { status: 415 });
    }

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "URL invalide." }, { status: 400 });

    const source = classify(parsed.data.url);
    if (source === "invalid") return NextResponse.json({ error: "URL HTTPS Instagram/TikTok invalide." }, { status: 400 });
    if (source === "unsupported") return NextResponse.json({ error: "Utilisez une URL Instagram ou TikTok." }, { status: 400 });

    const job = await createJob(normalizeInput(parsed.data.url), source);
    return NextResponse.json({ job, accessToken: issueJobToken(job.id) }, { status: 202 });
  } catch (error) {
    console.error("job_create", error);
    if (error instanceof ProviderError) {
      if (error.code === "PRIVATE_PROFILE") {
        return NextResponse.json({ error: "Ce profil est privé. Saver ne peut pas télécharger son contenu." }, { status: 403 });
      }
      return NextResponse.json({ error: "Le service de téléchargement est momentanément indisponible." }, { status: error.status });
    }
    if (error instanceof Error && error.message === "RATE_LIMIT_NOT_CONFIGURED") {
      return NextResponse.json({ error: "Service non configuré pour la production." }, { status: 503 });
    }
    if (error instanceof Error && error.message === "JOB_ACCESS_SECRET_MISSING") {
      return NextResponse.json({ error: "Configuration de sécurité incomplète." }, { status: 503 });
    }
    return NextResponse.json({ error: "Service momentanément indisponible." }, { status: 503 });
  }
}
