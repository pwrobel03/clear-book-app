# ClearBook — Deployment Guide (Oracle Cloud Infrastructure)

## Architecture

```
Internet (HTTP/HTTPS)
        │
  [OCI Security List]
  allow: 22, 80, 443
        │
  [OCI Compute VM]
  Ubuntu 22.04, ≥2 OCPU / 8 GB RAM
        │
  [Docker — clearbook-net bridge]
  ┌─────────────────────────────────────────┐
  │  nginx  (80, 443) ← only public ports   │
  │    │                                    │
  │  frontend:3000  (Next.js standalone)    │
  │    │ rewrites /api/backend/* →          │
  │  backend:8080   (Spring Boot)           │
  │    │                                    │
  │  postgres-db:5432  (PostgreSQL 18)      │
  └─────────────────────────────────────────┘
```

The Next.js server proxies all `/api/backend/*` requests to `http://backend:8080/api/*`
internally. The browser never calls the Spring API directly — only nginx is exposed.

---

## Step 1 — Create the OCI VM

1. In OCI Console → **Compute** → **Instances** → **Create Instance**
2. Recommended shape: **VM.Standard.E4.Flex** — 2 OCPU, 8 GB RAM
   (Free tier: **VM.Standard.A1.Flex** — 4 OCPU, 24 GB RAM Ampere — ARM64)
3. Image: **Canonical Ubuntu 22.04**
4. Add your SSH public key
5. In **Primary VNIC**: assign a public IP

> **ARM64 note**: If you use the Ampere (A1) shape, the `eclipse-temurin:25`
> image must exist for `linux/arm64`. Verify on Docker Hub before deploying.
> If unavailable, use `eclipse-temurin:21-jre-noble` and update `api/Dockerfile`.

---

## Step 2 — Configure OCI Security List (Firewall)

In OCI Console → **Networking** → **Virtual Cloud Networks** → your VCN
→ **Security Lists** → **Default Security List** → **Add Ingress Rules**:

| Source CIDR | Protocol | Port | Description            |
|-------------|----------|------|------------------------|
| 0.0.0.0/0   | TCP      | 22   | SSH                    |
| 0.0.0.0/0   | TCP      | 80   | HTTP (→ HTTPS redirect)|
| 0.0.0.0/0   | TCP      | 443  | HTTPS                  |

Do **not** open port 8080 or 3000 — they are internal only.

OCI Ubuntu VMs have **two independent firewalls** — the OCI Security List (cloud level)
AND the OS-level `iptables`. Both must allow the traffic.

```bash
# Open ports 80 and 443 in iptables (INSERT preserves existing rules including SSH)
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT

# Persist rules across reboots
sudo apt-get install -y iptables-persistent
sudo netfilter-persistent save
```

> ⚠️  Do NOT use `iptables -F` (flush) — it removes all rules including the one
> that allows your SSH connection, and you will be locked out of the VM.

---

## Step 3 — Prepare the VM

```bash
# SSH into the VM
ssh ubuntu@<PUBLIC_IP>

# Install Docker + Docker Compose plugin
sudo apt-get update
sudo apt-get install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

echo "deb [arch=$(dpkg --print-architecture) \
  signed-by=/etc/apt/keyrings/docker.asc] \
  https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io \
  docker-buildx-plugin docker-compose-plugin

# Allow your user to run Docker without sudo
sudo usermod -aG docker $USER
newgrp docker

# Verify
docker compose version
```

---

## Step 4 — Upload the Project

From your local machine:
```bash
# Copy the project to the VM (exclude build artefacts and secrets)
rsync -avz --exclude='.git' --exclude='node_modules' \
  --exclude='.next' --exclude='target' --exclude='.env' \
  /path/to/clear-book-app/ ubuntu@<PUBLIC_IP>:~/clearbook/
```

Or clone from Git:
```bash
git clone https://github.com/your-repo/clear-book-app.git ~/clearbook
```

---

## Step 5 — Configure Environment Variables

```bash
cd ~/clearbook

cp .env.example .env
nano .env
```

Set **all** of the following (replace placeholder values):

```dotenv
# Database
DB_NAME=clearbook_db
DB_USER=clearbook_user
DB_PASSWORD=<generate: openssl rand -base64 32>

# JWT — MUST be at least 64 hex characters
JWT_SECRET=<generate: openssl rand -hex 64>
JWT_ACCESS_EXPIRATION_MS=900000
JWT_REFRESH_EXPIRATION_DAYS=7

# Gmail SMTP App Password
EMAIL_USERNAME=your_gmail@gmail.com
EMAIL_2FA_PASSWORD=<gmail app password>

# Your domain (must have A record pointing to this VM's public IP)
DOMAIN=clearbook.yourdomain.com
FRONTEND_URL=https://clearbook.yourdomain.com
```

---

## Step 6 — Bootstrap SSL Certificate (first time only)

On the first deployment, no certificate exists yet, so we need to:
1. Start nginx with the HTTP-only bootstrap config
2. Run certbot to issue the certificate
3. Switch to the full HTTPS config

```bash
cd ~/clearbook

# ── 6a. Start services with bootstrap nginx (HTTP only) ──────────────────────
# Temporarily override the nginx config to HTTP-only bootstrap
docker compose up -d postgres-db backend frontend

docker run --rm \
  -v $(pwd)/nginx/nginx.bootstrap.conf:/etc/nginx/conf.d/default.conf:ro \
  -v $(pwd):/var/www/certbot \
  -p 80:80 \
  --network clearbook_clearbook-net \
  --name clearbook_nginx_bootstrap \
  nginx:alpine

# In a second terminal — run certbot
docker compose --profile certbot run --rm certbot certonly \
  --webroot \
  --webroot-path /var/www/certbot \
  --email your@email.com \
  --agree-tos \
  --no-eff-email \
  -d clearbook.yourdomain.com

# Stop the bootstrap nginx
docker stop clearbook_nginx_bootstrap

# ── 6b. Start the full stack with HTTPS nginx ─────────────────────────────────
docker compose up -d
```

Verify the certificate was issued:
```bash
ls /var/lib/docker/volumes/clearbook_certbot-certs/_data/live/
```

---

## Step 7 — Start the Full Stack

```bash
cd ~/clearbook

# Build images and start all services
docker compose up -d --build

# Watch logs
docker compose logs -f

# Check all containers are healthy
docker compose ps
```

Expected output:
```
NAME                  STATUS          PORTS
clearbook_nginx       running         0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp
clearbook_frontend    running
clearbook_backend     running
clearbook_postgres    running (healthy)
```

---

## Step 8 — Certificate Auto-Renewal

Add a cron job on the VM to renew the certificate every 60 days:

```bash
crontab -e
```

Add this line:
```cron
0 3 * * * cd /home/ubuntu/clearbook && \
  docker compose --profile certbot run --rm certbot renew --quiet && \
  docker compose exec nginx nginx -s reload >> /var/log/certbot-renew.log 2>&1
```

---

## Useful Commands

```bash
# Rebuild and redeploy after code changes
cd ~/clearbook
git pull
docker compose up -d --build

# Rebuild only one service
docker compose up -d --build backend

# View logs for a specific service
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f nginx

# Run database seed
docker compose exec backend sh  # then run your seed commands
# Or from outside: connect with psych to postgres-db

# Stop all services
docker compose down

# Full reset (WARNING: deletes all data volumes)
docker compose down -v
```

---

## Local Development

To run the full stack locally with ports exposed directly (no nginx):
```bash
docker compose -f docker-compose.yaml -f docker-compose.dev.yaml up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8080

---

## Troubleshooting

**Nginx fails to start** — certificate not found:
The `nginx.conf.template` references `/etc/letsencrypt/live/${DOMAIN}/fullchain.pem`.
If the cert doesn't exist yet, nginx crashes. Use the bootstrap flow (Step 6) first.

**Backend not reachable**:
```bash
docker compose logs backend
# Check Spring Boot started on port 8080
docker compose exec backend wget -qO- http://localhost:8080/actuator/health
```

**Database connection refused**:
```bash
docker compose ps postgres-db  # should show (healthy)
docker compose logs postgres-db
```

**Permission denied on uploads**:
The `uploads-data` Docker volume is owned by root inside the container.
If the backend can't write files, check the Dockerfile created the directory
before switching to the non-root user (`appuser`).
