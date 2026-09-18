# Saver — José World

Mobile-first Next.js + TypeScript application for processing publicly accessible Instagram/TikTok URLs through a separately configured, compliant media provider.

## Important legal architecture decision

Saver does **not** scrape Instagram/TikTok directly and does not bypass private accounts, authentication, CAPTCHAs, DRM, rate limits or security controls. This is intentional: TikTok's current Terms prohibit automated scraping/crawling/exporting unless approved in writing, so an arbitrary-profile scraper would not be a responsible production implementation. Use only a provider/API that you are authorized to use for the relevant content and platform.

## Stack

- Next.js App Router
- TypeScript
- React
- Zod validation
- Upstash Redis rate limiting
- Vercel-ready configuration
- Provider adapter for long-running media jobs

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Configure `MEDIA_PROVIDER_URL` and `MEDIA_PROVIDER_TOKEN` according to `docs/provider-contract.md`. Configure Upstash variables in production so rate limiting is distributed across Vercel instances.

## Production

Deploy the repository to Vercel, add all environment variables, and use a production provider that complies with the applicable platform terms and law. Vercel Functions support longer execution times on eligible plans, but Saver keeps the long-running media job outside the request lifecycle through the provider contract.

## Security checklist

- HTTPS-only input validation
- strict source allowlist
- no user credentials
- no arbitrary server-side URL fetching
- provider isolation
- rate limiting
- bounded ZIP/file counts
- short-lived download URLs
- structured provider job polling
- safe error messages without secrets
- no client-side secret exposure

## Platform notice

Users remain responsible for having the right to download and retain content. Platform availability and permitted access can change; the provider must enforce current platform requirements.
