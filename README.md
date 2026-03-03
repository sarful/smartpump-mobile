# SmartPump Mobile (React Native)

This app uses the same backend/database architecture:

- MongoDB (one shared DB)
- Next.js API (`smartpump-pro`) as the single backend
- Web frontend + React Native app as two clients

## Backend requirements (`smartpump-pro`)

Set these env variables:

- `MONGODB_URI`
- `MOBILE_JWT_SECRET` (recommended; fallback is `NEXTAUTH_SECRET`)

New mobile auth endpoints:

- `POST /api/mobile/auth/login`
- `POST /api/mobile/auth/refresh`
- `POST /api/mobile/auth/logout`
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

## Run mobile app

```bash
cd smartpump-mobile
npm install
npm run start
```

## API base URL

Update `src/config.ts`:

```ts
export const API_BASE_URL = "https://pms-two-kappa.vercel.app";
```

Use your real deployed backend URL.
