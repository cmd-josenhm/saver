# Saver — José World

Saver is a mobile-first Next.js/TypeScript web application for processing **public, authorized media URLs** through an external acquisition provider.

## Architecture

- Next.js App Router + TypeScript
- Vercel-ready API routes
- External provider/worker for long-running media acquisition
- Upstash Redis rate limiting
- Zod validation
- Signed job capability tokens
- Provider download-host allowlist
- Short-lived provider download URLs
- 50 files per ZIP
- 5 ZIPs recommended per operation
- Configurable resource-safety ceiling (250 files by default)
- CI build/typecheck on GitHub Actions

## Important platform limitation

Saver does not scrape platforms directly and does not bypass private accounts, login, CAPTCHA, DRM, rate limits, or other access controls.

Current official TikTok Display APIs require user authorization and are designed to expose profile/video metadata and embeds; they are not a general anonymous public-profile downloader. [TikTok Display API](https://developers.tiktok.com/docs/en/display-api-overview) and [TikTok Get Started](https://developers.tiktok.com/docs/en/display-api-get-started).

Therefore the acquisition provider must be separately authorized for the exact platform/content workflow. Do not deploy a random scraping endpoint and assume it is compliant.

## Local setup

```bash
npm install
cp .env.example .env.local
npm run typecheck
npm run build
npm run dev
```

## Required production environment

```text
MEDIA_PROVIDER_URL=
MEDIA_PROVIDER_TOKEN=
MEDIA_DOWNLOAD_HOSTS=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
JOB_ACCESS_SECRET=
MAX_FILES_PER_OPERATION=250
NEXT_PUBLIC_APP_URL=https://your-domain.example
```

`JOB_ACCESS_SECRET` must contain at least 32 random characters.

## Production checks

Open:

```text
/api/health
```

A healthy production configuration returns HTTP 200 with all required configuration flags set to true.

## Deployment

1. Import the repository into Vercel.
2. Add all production environment variables.
3. Deploy.
4. Confirm `/api/health` returns 200.
5. Run a real provider integration test with content you are authorized to process.

Vercel Functions have finite request durations, so Saver keeps the frontend/API request short and delegates long-running acquisition to the provider/worker. Vercel documents the current duration limits and longer-running options for paid plans. [Vercel Functions limits](https://vercel.com/docs/functions/limitations) and its long-running Functions documentation.

## Legal responsibility

The operator is responsible for rights, platform terms, privacy, retention, and lawful use of downloaded content. Saver intentionally refuses private profiles and access-control bypasses.
