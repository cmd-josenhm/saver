import { z } from "zod";

export const JobStatusSchema = z.enum(["queued", "running", "completed", "partial", "failed"]);

export const JobSchema = z.object({
  id: z.string().regex(/^[A-Za-z0-9_-]{8,128}$/),
  status: JobStatusSchema,
  totalFiles: z.number().int().min(0).max(10000),
  completedFiles: z.number().int().min(0).max(10000),
  failedFiles: z.number().int().min(0).max(10000),
  bytesDownloaded: z.number().finite().min(0).max(10_000_000_000_000),
  speedBytesPerSecond: z.number().finite().min(0).max(10_000_000_000),
  zipUrls: z.array(z.string().url()).max(100),
  failedZipUrl: z.string().url().optional(),
});

export type JobStatus = z.infer<typeof JobStatusSchema>;
export type Job = z.infer<typeof JobSchema>;

export function normalizeJob(value: unknown): Job {
  const parsed = JobSchema.safeParse(value);
  if (!parsed.success) throw new Error("INVALID_PROVIDER_RESPONSE");
  if (parsed.data.completedFiles + parsed.data.failedFiles > parsed.data.totalFiles) {
    throw new Error("INVALID_PROVIDER_RESPONSE");
  }
  return parsed.data;
}
