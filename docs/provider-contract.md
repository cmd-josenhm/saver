# Provider contract
The acquisition layer is intentionally external. It must be legally authorized for the target platform/content and must not bypass private accounts, authentication, CAPTCHA, DRM, rate limits or access controls.

POST /v1/jobs accepts {url,source,maxFilesPerZip:50,maxRecommendedZips:5}. GET /v1/jobs/:id returns job progress and short-lived HTTPS ZIP URLs. Provider must enforce file-size, concurrency, timeout, storage cleanup and platform-specific restrictions.