# Market State Dashboard

A standalone market intelligence dashboard that combines broad Yahoo Finance coverage with our own cross-sectional alpha model outputs.

This project is intentionally **not** an MCP server and does **not** include any LLM integration. It is a product-style dashboard with:

- live market snapshots
- historical price charts
- company profile and financial summaries
- options and news surfaces
- model rankings and ticker-level prediction overlays
- a distinct UI designed for discretionary research, not chat

## Product concept

The reference point was the breadth of [`Alex2Yang97/yahoo-finance-mcp`](https://github.com/Alex2Yang97/yahoo-finance-mcp), which exposes Yahoo Finance data through MCP tools. This repository keeps the useful data coverage idea, but turns it into a standalone dashboard application with a redesigned frontend and a model-adapter backend.

## Stack

- Backend: FastAPI
- Frontend: React + TypeScript + Vite
- Data source: `yfinance`
- Model integration: reads exported prediction artifacts from the `latent-market-state-alpha` research project

## Repository layout

```text
market-state-dashboard/
  backend/
  frontend/
  docs/
```

## Features

### Market data

- quotes and company overview
- historical OHLCV charts
- key statistics
- analyst/news/options summaries

### Model layer

- latest model leaderboard
- ticker prediction cards
- cross-sectional ranking table
- confidence / percentile / decile style presentation from exported model artifacts

### UI direction

- editorial dashboard feel rather than broker-terminal cloning
- warm paper-and-ink color system with copper accents
- large typography and asymmetric layout
- strong mobile fallback

## Quick start

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend expects the backend at `http://localhost:8000` by default.

## Production deployment

Recommended setup:

- frontend on GitHub Pages
- backend on a small Hetzner VPS

Deployment files are included:

- [GitHub Pages workflow](/Users/morteza/Documents/Playground/market-state-dashboard/.github/workflows/deploy-frontend.yml)
- [Backend Dockerfile](/Users/morteza/Documents/Playground/market-state-dashboard/backend/Dockerfile)
- [Hetzner systemd service](/Users/morteza/Documents/Playground/market-state-dashboard/deploy/hetzner/market-state-dashboard.service)
- [Hetzner Nginx config](/Users/morteza/Documents/Playground/market-state-dashboard/deploy/hetzner/nginx.market-state-dashboard.conf)
- [Full deployment guide](/Users/morteza/Documents/Playground/market-state-dashboard/docs/DEPLOYMENT.md)

## Model artifact configuration

The backend can read exported prediction artifacts from the research repo. Set these environment variables before starting the backend if you want live model integration:

```bash
export LMSA_PREDICTIONS_CSV=/absolute/path/to/predictions.csv
export LMSA_METRICS_JSON=/absolute/path/to/metrics.json
export LMSA_MODEL_SUMMARY_JSON=/absolute/path/to/model_summary.json
```

Or point the backend at a results root and let it auto-pick the best available run by `test.ic_mean`:

```bash
export LMSA_RESULTS_ROOT=/absolute/path/to/latent-market-state-alpha/results/runs
```

If no explicit artifact paths are provided, the backend will scan `LMSA_RESULTS_ROOT` and automatically select the strongest available run that has both `metrics.json` and `predictions.csv`.

If no artifacts are available, the dashboard still works in market-data-only mode.

## Current local behavior

In this workspace, the backend defaults to:

```text
/Users/morteza/Documents/Playground/latent-market-state-alpha/results/runs
```

so it will immediately surface the strongest locally available model run without extra configuration.

## Next product steps

- add watchlists and saved layouts
- add sector heatmaps and regime panels
- add backtest equity curve and decile spread charts
- support multiple model runs and side-by-side comparisons
- add daily batch refresh jobs for cached market data
