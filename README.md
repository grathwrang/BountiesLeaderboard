# AoE2 Bounty Leaderboard (Vercel)

## Routes
- Leaderboard: `/`
- Admin page: `/admin`
- API: `GET /api/bounties`, `POST /api/bounties`
- Back-compat API alias: `POST /bounties` (rewrite to `/api/bounties`)

## Local development
This repo is configured for Vercel-style API routes.

```bash
vercel dev
```

Then open:
- `http://localhost:3000/`
- `http://localhost:3000/admin`

## Vercel setup (required for persistent writes)
The API reads seed entries from `data/bounties.json` and stores newly submitted entries in Vercel KV/Upstash REST.

Add these environment variables in your Vercel project:
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`

If you connected Upstash directly (instead of Vercel KV), these also work:
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

### Fix for this error
If you see:

`Missing KV credentials...`

do this in Vercel:
1. Project → **Storage** → create/connect **KV**.
2. Project → **Settings** → **Environment Variables** → confirm KV vars exist for your target environment (Preview/Production).
3. Trigger a new deploy (env vars are loaded at build/runtime; old deployments keep old env).
4. Re-test `POST /api/bounties` from `/admin`.

Without KV configured:
- `GET /api/bounties` still works (seed JSON only)
- `POST /api/bounties` returns an error explaining KV is required.

## Quick test on deployed Vercel
1. Open `https://<your-app>.vercel.app/admin`
2. Submit a bounty
3. Verify response message says saved
4. Open `https://<your-app>.vercel.app/` and confirm the new row appears
5. Optional API checks:
   - `curl -sS https://<your-app>.vercel.app/api/bounties | head`
   - `curl -sS -X POST https://<your-app>.vercel.app/api/bounties -H 'content-type: application/json' -d '{"bounty_name":"Test","player":"Tester","prize":5,"attempts":1,"conditions":"test"}'`
