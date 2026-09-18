# Provider contract

Saver's web application is production-oriented, but media acquisition is intentionally isolated behind an external provider.

## Security and compliance requirements

The provider must have a documented legal/technical authorization for the platform and content it serves. It must not bypass private accounts, authentication, CAPTCHA, DRM, rate limits, or other access controls.

Saver never receives Instagram/TikTok passwords.

## Endpoints

### POST /v1/jobs

Request:

```json
{
  "url": "https://www.instagram.com/example/",
  "source": "instagram",
  "maxFilesPerZip": 50,
  "maxRecommendedZips": 5,
  "maxFilesPerOperation": 250
}
```

Response:

```json
{
  "id": "opaque-random-job-id",
  "status": "queued",
  "totalFiles": 0,
  "completedFiles": 0,
  "failedFiles": 0,
  "bytesDownloaded": 0,
  "speedBytesPerSecond": 0,
  "zipUrls": [],
  "failedZipUrl": null
}
```

For a private profile, return HTTP 403 with:

```json
{ "error": { "code": "PRIVATE_PROFILE" } }
```

Job IDs must be unpredictable and at least 128 bits of entropy.

### GET /v1/jobs/:id

Return the same job schema. Status values are:

- `queued`
- `running`
- `completed`
- `partial`
- `failed`

Download URLs must be short-lived HTTPS URLs.

## ZIP rules

- Maximum 50 files per ZIP.
- Five ZIPs are the recommended default batch size.
- `MAX_FILES_PER_OPERATION` is a configurable resource-safety limit and defaults to 250.
- Failed files may be collected into a separate ZIP.
- The provider should set `Content-Disposition: attachment` on ZIP responses.
- Temporary ZIPs and source files must be deleted after their retention window.

## Provider responsibilities

The provider owns platform-specific acquisition, pagination, duplicate handling, unavailable/deleted media, file-size limits, storage, retries, cleanup, and progress accounting.

The provider must never return arbitrary untrusted URLs. Saver validates returned download hosts against `MEDIA_DOWNLOAD_HOSTS`.

## Vercel architecture

Saver's Vercel functions create and poll jobs; they do not keep a large profile download inside a single HTTP request. This avoids tying media processing to a frontend request and lets the provider/worker handle long-running work.

## Production environment

Required:

- `MEDIA_PROVIDER_URL`
- `MEDIA_PROVIDER_TOKEN`
- `MEDIA_DOWNLOAD_HOSTS`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `JOB_ACCESS_SECRET` (minimum 32 characters)

Optional:

- `MAX_FILES_PER_OPERATION`
- `NEXT_PUBLIC_APP_URL`
