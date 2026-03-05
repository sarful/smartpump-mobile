# PumpPilot Mobile - Codecanyon Checklist

## Security & Config
- [ ] `.env` not included in upload
- [ ] `.env.example` updated
- [ ] No hardcoded private server URLs in source
- [ ] API base URL configurable via `EXPO_PUBLIC_API_BASE_URL`

## Functional Validation
- [ ] `npm install` passes
- [ ] `npm run preflight` passes
- [ ] User/Admin/Master login tested
- [ ] User dashboard motor actions tested
- [ ] Admin dashboard recharge and actions tested
- [ ] Master dashboard actions tested

## Build Validation
- [ ] `npm run start` works
- [ ] `npm run build:apk` works
- [ ] `npm run build:aab` works

## Packaging
- [ ] Exclude `.git`, `node_modules`, `.expo`, `.env`
- [ ] Include source, assets, docs, `.env.example`
- [ ] Include install guide and quick start

## Final
- [ ] PASS all sections

