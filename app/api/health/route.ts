import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const providerConfigured = Boolean(process.env.MEDIA_PROVIDER_URL && process.env.MEDIA_PROVIDER_TOKEN);
  const rateLimitConfigured = Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
  const jobSecretConfigured = Boolean(process.env.JOB_ACCESS_SECRET && process.env.JOB_ACCESS_SECRET.length >= 32);
  const ok = providerConfigured && rateLimitConfigured && jobSecretConfigured;
  return NextResponse.json(
    { ok, service: "saver", providerConfigured, rateLimitConfigured, jobSecretConfigured },
    { status: ok ? 200 : 503, headers: { "Cache-Control": "no-store" } }
  );
}