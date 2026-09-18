import { createHmac, timingSafeEqual } from "node:crypto";

const TTL_SECONDS = 24 * 60 * 60;

function secret() {
  const value = process.env.JOB_ACCESS_SECRET;
  if (!value || value.length < 32) throw new Error("JOB_ACCESS_SECRET_MISSING");
  return value;
}

function signature(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function issueJobToken(jobId: string) {
  const exp = Math.floor(Date.now() / 1000) + TTL_SECONDS;
  const payload = jobId + "." + exp;
  return payload + "." + signature(payload);
}

export function verifyJobToken(jobId: string, token: string | null) {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const id = parts[0], expRaw = parts[1], sig = parts[2];
  const exp = Number(expRaw);
  if (id !== jobId || !Number.isSafeInteger(exp) || exp < Math.floor(Date.now() / 1000)) return false;
  const expected = signature(id + "." + expRaw);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}