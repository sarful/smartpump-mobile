# PumpPilot Mobile (React Native)

This app uses the same backend/database architecture:

- MongoDB (one shared DB)
- Next.js API (`smartpump-pro`) as the single backend
- Web frontend + React Native app as two clients

## Backend requirements (`smartpump-pro`)

Set these env variables:

- `MONGODB_URI`
- `MOBILE_JWT_SECRET` (recommended; fallback is `NEXTAUTH_SECRET`)
- `MOBILE_MAX_SESSIONS` (optional, default `5`)

New mobile auth endpoints:

- `POST /api/mobile/auth/login`
- `POST /api/mobile/auth/refresh`
- `POST /api/mobile/auth/logout`
- `POST /api/mobile/auth/logout-all`
- `GET /api/mobile/auth/me` (Bearer access token)

Phase-1 user endpoints:

- `GET /api/mobile/user/dashboard`
- `POST /api/mobile/user/start`
- `POST /api/mobile/user/stop`
- `POST /api/mobile/user/extend`
- `GET/POST /api/mobile/user/minute-request`

Phase-2 admin endpoints:

- `GET /api/mobile/admin/dashboard`
- `POST /api/mobile/admin/recharge`
- `POST /api/mobile/admin/minute-requests/approve`
- `POST /api/mobile/admin/minute-requests/decline`
- `POST /api/mobile/admin/users/suspend`
- `POST /api/mobile/admin/users/unsuspend`
- `POST /api/mobile/admin/users/stop-reset`

Phase-3 master endpoints:

- `GET /api/mobile/master/dashboard`
- `POST /api/mobile/master/settings`
- `POST /api/mobile/master/admins/action`
- `POST /api/mobile/master/users/action`

Phase-4 hardening included:

- IP-based rate limit on login/refresh
- refresh-token rotation with reuse detection
- optional device-bound refresh flow (`deviceId`)
- max active mobile sessions per account (`MOBILE_MAX_SESSIONS`)
- logout-all endpoint for account-wide session revoke

## Run mobile app

```bash
cd smartpump-mobile
cp .env.example .env
npm install
npm run start
```

## API base URL

Set `.env`:

```env
EXPO_PUBLIC_API_BASE_URL=https://your-backend-domain.com
```

## Build Android release

```bash
npm install -g eas-cli
eas login
npm run build:apk   # internal test APK
npm run build:aab   # Play Store AAB
```

## Phase-5 release readiness

- Environment-driven API base URL (`EXPO_PUBLIC_API_BASE_URL`)
- API health check button on login screen (`/api/mobile/health`)
- Request timeout handling for network calls
- EAS build profiles for APK/AAB
- `logout-all` support from Admin/Master screens

## Phase-6 operational checks

- Backend readiness endpoint: `/api/mobile/ready`
- Mobile preflight script:

```bash
npm run preflight
```

Checks:
- `/api/mobile/health` -> `200`
- `/api/mobile/ready` -> `200`
- `/api/mobile/auth/me` -> `401` (expected without token)

## Codecanyon packaging

```bash
npm run package:codecanyon
```

Output:

- `dist/codecanyon/PumpPilot-Mobile`

Docs:
- `MOBILE_CODECANYON_INSTALL.md`
- `MOBILE_CODECANYON_CHECKLIST.md`
