# Security Policy for uni-miniprogram-pro

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Security Architecture & Red-Line Commitments

`uni-miniprogram-pro` is a local-first, privacy-by-design mini-program template and commercial scaffolding. We maintain strict security guardrails:

1. **Credential Isolation (Zero Leaks):**
   - AppSecret, Payment API v3 Private Keys (`apiclient_key.pem`), and Merchant Serial Numbers **must never be bundled into front-end mini-program code**.
   - Front-end only initiates orders through authorized server endpoints or WeChat CloudBase authenticated functions.
   - All `.env`, local certificates, and test credentials are strictly gated by `.gitignore`.

2. **Dual-Token Silent Refresh Mechanism:**
   - Access tokens have short TTLs.
   - Refresh tokens are securely maintained in encrypted persistent storage (`uni.setStorageSync`).
   - Concurrency locking prevents stampedes during silent token rotation.

3. **Circuit Breaker Resilience:**
   - Enterprise three-state circuit breaker (`CLOSED` $\rightarrow$ `OPEN` $\rightarrow$ `HALF_OPEN`) prevents cascading failures and DDoS amplification during network degradation.

## Reporting a Vulnerability

If you discover a security vulnerability or credential leak risk:
- Please **do not** create a public GitHub Issue.
- Submit details privately via GitHub Private Vulnerability Reporting or contact the maintainer at `mo9652962-ai@users.noreply.github.com`.
- We will acknowledge receipt within 48 hours and provide a fix release within 7 days.
