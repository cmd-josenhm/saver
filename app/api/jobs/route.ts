import { NextRequest, NextResponse } from "next/server";
import { schema, classify, normalizeInput } from "@/lib/url";
import { createJob, ProviderError } from "@/lib/provider";
import { enforceRateLimit } from "@/lib/ratelimit";
import { issueJobToken } from "@/lib/job-token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 16384;

function ip(req: NextRequest) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}

export async function POST(req: NextRequest) {
  try {
    const client = ip(req);
    if (!(await enforceRateLimit("create:" + client, 10, "1 m"))) {
      return NextResponse.json({ error: "Trop de demandes. Réessayez dans un instant." }, { status: 429 });
    }

    const length = Number(req.headers.get("content-length") ?? 0);
    if (length > MAX_BODY_BYTES) return NextResponse.json({ error: "Requête trop volumineuse." }, { status: 413 });
    if (!req.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
      return NextResponse.json({ error: "Content-Type invalide." }, { status: 415 });
    }

    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "URL invalide." }, { status: 400 });

    const source = classify(parsed.data.url);
    if (source === "invalid") return NextResponse.json({ error: "URL HTTPS Instagram/TikTok invalide." }, { status: 400 });
    if (source === "unsupported") return NextResponse.json({ error: "Utilisez une URL Instagram ou TikTok." }, { status: 400 });

    const job = await createJob(normalizeInput(parsed.data.url), source);
    return NextResponse.json({ job, accessToken: issueJobToken(job.id) }, { status: 202 });
  } catch (error) {
    console.error("job_create", error);
    if (error instanceof ProviderError) {
      if (error.code === "PRIVATE_PROFILE" || error.code === "AUTH_REQUIRED") {
        return NextResponse.json({ error: "Ce contenu nécessite une autorisation ou provient d'un profil privé. Saver ne peut pas contourner cet accès." }, { status: 403 });
      }
      if (error.code === "NO_MEDIA") {
        return NextResponse.json({ error: "Aucun contenu public compatible n'a été trouvé." }, { status: 404 });
      }
      if (error.code === "RATE_LIMITED") {
        return NextResponse.json({ error: "La plateforme source limite momentanément cette opération. Réessayez plus tard." }, { status: 429 });
      }
      return NextResponse.json({ error: "Le service de téléchargement est momentanément indisponible." }, { status: error.status });
    }
    if (error instanceof Error && ["RATE_LIMIT_NOT_CONFIGURED", "JOB_ACCESS_SECRET_MISSING"].includes(error.message)) {
      return NextResponse.json({ error: "Configuration de production incomplète." }, { status: 503 });
    }
    return NextResponse.json({ error: "Service momentanément indisponible." }, { status: 503 });
  }
}