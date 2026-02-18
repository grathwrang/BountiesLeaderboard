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
The API reads seed entries from `data/bounties.json` and stores newly submitted entries in Vercel KV.

Add these environment variables in your Vercel project:
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`

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
