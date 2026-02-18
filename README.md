# AoE2 Bounty Leaderboard

## Run locally
From this folder:

```bash
node server.js
```

Then open:
- Leaderboard: `http://localhost:8080/`
- Admin page: `http://localhost:8080/admin`

## Admin updates
- Submit completed bounties from `/admin`.
- The admin form sends `POST /bounties`.
- The backend appends the new completion to `data/bounties.json`.

## Deploy
Any host that can run a Node.js server works.

## Data
Bounties are stored in `data/bounties.json`.
