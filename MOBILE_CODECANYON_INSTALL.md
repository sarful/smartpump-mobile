# PumpPilot Mobile - Codecanyon Install Guide

## Requirements
- Node.js 20+
- npm 10+
- Expo CLI / EAS CLI
- Running PumpPilot backend URL

## 1) Configure Environment
Copy:

```bash
cp .env.example .env
```

Set:

```env
EXPO_PUBLIC_API_BASE_URL=https://your-backend-domain.com
```

Do not leave this as a placeholder. Mobile startup, preflight, and release builds now fail if the backend URL is missing.

## 2) Install

```bash
npm install
```

## 3) Validate Backend Connectivity

```bash
npm run preflight
```

Expected:
- `/api/mobile/health` -> 200
- `/api/mobile/ready` -> 200
- `/api/mobile/auth/me` -> 401 (without token)

## 4) Run App

```bash
npm run start
```

## 5) Build Android

```bash
npm run build:apk
npm run build:aab
```

For EAS cloud builds, set `EXPO_PUBLIC_API_BASE_URL` in the EAS environment or project secrets before running the build.

## Troubleshooting
- `Network request failed`: check API base URL and backend CORS/firewall.
- `401 Unauthorized`: login first and ensure token is stored.
- `Preflight failed`: backend not live or wrong domain/path.
