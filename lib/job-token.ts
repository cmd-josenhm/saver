import { createHmac, timingSafeEqual } from "node:crypto";

const TTL_SECONDS = 24 * 60 * 60;

function secret(): string {
  const value = process.env.JOB_ACCESS_SECRET;
  if (!value || value.length < 32) throw new Error("JOB_ACCESS_SECRET_MISSING");
  return value;
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function issueJobToken(jobId: string): string {
  const exp = Math.floor(Date.now() / 1000) + TTL_SECONDS;
  const payload = `${jobId}.${exp}`;
  return `${payload}.${sign(payload)}`;
}

export function verifyJobToken(jobId: string, token: string | null): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;

  const [id, expRaw, signature] = parts;
  const exp = Number(expRaw);
  if (id !== jobId || !Number.isSafeInteger(exp) || exp < Math.floor(Date.now() / 1000)) return false;

  const expected = sign(`${id}.${expRaw}`);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
