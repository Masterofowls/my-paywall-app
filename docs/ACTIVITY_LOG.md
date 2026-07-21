# Activity Log

## 2026-07-22T00:21:00+03:00
- Fixed Vite `@` alias so `@/pages/*` imports resolve
- Fixed Express 5 auth wildcard route (`/*` -> `/{*path}`)
- Filled empty stub files: Home, Dashboard, LoginForm, ProtectedRoute, CheckoutButton
- Added missing `auth` import in payment route

## 2026-07-22T00:22:30+03:00
- Load env via `import "dotenv/config"` before route modules (ESM hoist fix)
- Lazy-init Stripe client so missing key fails at request time, not boot
- Verified: auth route loads, Vite build succeeds, API health on :9010

## 2026-07-22T01:06:00+03:00
- Created Fly app `paywallapp`, volume `paywall_data`, synced secrets, deployed
- Live: https://paywallapp.fly.dev/ (health OK)
