# AoE2 Bounty Leaderboard (Static)

## Run locally
From this folder:

- Windows (Python installed):
  python -m http.server 8080

Then open: http://localhost:8080

(You need a local server because the page fetches `data/bounties.json`.)

## Deploy
Any static hosting works (Vercel, GitHub Pages, Netlify).

## Data
Edit `data/bounties.json` to add/remove completions.
