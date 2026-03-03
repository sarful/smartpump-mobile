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
