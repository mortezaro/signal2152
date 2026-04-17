# Deployment Guide

## Recommended product name

Best single-name recommendation:

- **Signal2152**

Why this works:

- short and memorable
- works as a repo, domain, and product name
- broad enough for dashboards, models, and future tools

Good alternatives:

- **State2152**
- **MarketPaper 2152**
- **CopperAlpha 2152**

## Target deployment shape

- Frontend: GitHub Pages
- Backend: Hetzner VPS
- Backend reverse proxy: Nginx
- TLS: Let's Encrypt via Certbot

## 1. Push the repo to GitHub

Create a new repository, for example:

```text
signal2152
```

Then push the local folder:

```bash
cd /Users/morteza/Documents/Playground/market-state-dashboard
git init
git add .
git commit -m "Initial dashboard scaffold"
git branch -M main
git remote add origin git@github.com:YOUR_USERNAME/signal2152.git
git push -u origin main
```

## 2. GitHub Pages frontend setup

The frontend workflow is already included:

- [deploy-frontend.yml](/Users/morteza/Documents/Playground/market-state-dashboard/.github/workflows/deploy-frontend.yml)

### Required GitHub secret

Add this repository secret:

- `VITE_API_BASE`

Example:

```text
https://api.yourdomain.com/api
```

### GitHub Pages settings

In GitHub:

1. Open repository settings
2. Go to `Pages`
3. Set source to `GitHub Actions`

After each push to `main`, the frontend will publish automatically.

If your repo is named `signal2152`, the site URL will typically be:

```text
https://YOUR_GITHUB_USERNAME.github.io/signal2152/
```

## 3. Hetzner backend setup

### Recommended server

For this app, start with a small shared vCPU VPS:

- 2 vCPU
- 4 GB RAM
- Ubuntu 24.04

That is enough for:

- FastAPI
- yfinance requests
- moderate personal traffic
- model artifact loading

### Initial server bootstrap

On the server:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y python3 python3-venv python3-pip nginx certbot python3-certbot-nginx git
sudo adduser --disabled-password --gecos "" deploy
sudo mkdir -p /opt/market-state-dashboard
sudo chown -R deploy:deploy /opt/market-state-dashboard
```

### Copy code to server

From your local machine:

```bash
scp -r /Users/morteza/Documents/Playground/market-state-dashboard deploy@YOUR_SERVER_IP:/opt/market-state-dashboard
```

### Backend app install

On the server:

```bash
sudo su - deploy
cd /opt/market-state-dashboard/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp /opt/market-state-dashboard/deploy/hetzner/backend.env.example .env
```

Edit `.env` with real values:

- `ALLOWED_ORIGINS`
- `LMSA_RESULTS_ROOT`

### Systemd service

As root:

```bash
sudo cp /opt/market-state-dashboard/deploy/hetzner/market-state-dashboard.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable market-state-dashboard
sudo systemctl start market-state-dashboard
sudo systemctl status market-state-dashboard
```

## 4. Nginx reverse proxy

Copy the included config:

```bash
sudo cp /opt/market-state-dashboard/deploy/hetzner/nginx.market-state-dashboard.conf /etc/nginx/sites-available/market-state-dashboard
sudo ln -s /etc/nginx/sites-available/market-state-dashboard /etc/nginx/sites-enabled/market-state-dashboard
sudo nginx -t
sudo systemctl reload nginx
```

Replace:

- `api.example.com`

with your real backend domain.

## 5. TLS certificate

```bash
sudo certbot --nginx -d api.example.com
```

## 6. Point the frontend to the backend

Set GitHub secret:

- `VITE_API_BASE=https://api.example.com/api`

Then push again to trigger the frontend deploy workflow.

## 7. Using your own computer instead

Yes, you can run the backend on your own computer for now.

That is okay for:

- private use
- demos
- early testing

But it is weaker because:

- your machine must stay on
- your home IP can change
- router and firewall setup are annoying
- TLS and domain setup are less clean

So:

- own machine: good for a prototype this week
- Hetzner: better for a durable public demo

## 8. Best recommended path

1. Push repo to GitHub as `signal2152`
2. Turn on GitHub Pages for the frontend
3. Rent a small Hetzner VPS for the backend
4. Point `api.signal2152.com` or similar to the VPS
5. Add your model artifacts on the server
6. Keep the frontend static and simple

That gives you a clean architecture and a professional portfolio deployment.

## 9. Semi-live model refresh

This repository now supports semi-live production artifacts for:

- Ridge Live Context
- GBDT Live Context
- Latent Research Snapshot

The scoring command is:

```bash
cd /opt/market-state-dashboard/backend
source .venv/bin/activate
python -m app.scoring.refresh
```

Artifacts are written to:

```text
/opt/market-state-dashboard/backend/runtime_artifacts/models
```

To enable automatic refreshes every 4 hours:

```bash
sudo cp /opt/market-state-dashboard/deploy/hetzner/market-state-refresh.service /etc/systemd/system/
sudo cp /opt/market-state-dashboard/deploy/hetzner/market-state-refresh.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable market-state-refresh.timer
sudo systemctl start market-state-refresh.timer
sudo systemctl list-timers --all | grep market-state-refresh
```
