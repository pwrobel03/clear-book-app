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

> **Default SSH user**: For **Canonical Ubuntu** images the default user is `ubuntu`.
> If you choose an **Oracle Linux** image (heavily promoted by OCI), the user is `opc`.
> This guide assumes Ubuntu — adjust the username if you switch images.

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
1. Build all images and create Docker-managed volumes
2. Start nginx with the HTTP-only bootstrap config (serves the ACME challenge over HTTP)
3. Run certbot to issue the certificate
4. Switch to the full HTTPS config

```bash
cd ~/clearbook

# ── 6a. Build images and create named volumes without starting services ───────
# This builds backend + frontend images and creates all Docker named volumes
# (postgres-data, uploads-data, certbot-certs, certbot-webroot) so the bootstrap
# nginx can mount certbot-webroot by its Docker Compose volume name.
docker compose create --build

# ── 6b. Start services (without nginx — it needs the cert first) ─────────────
docker compose start postgres-db backend frontend

# ── 6c. Start HTTP-only bootstrap nginx ──────────────────────────────────────
# conf.d/ files are included INSIDE nginx's http{} block — no events{}/http{}
# wrappers in nginx.bootstrap.conf (that caused the "not allowed here" error).
# The project prefix in the volume name matches directory name "clearbook".
docker run -d \
  -v $(pwd)/nginx/nginx.bootstrap.conf:/etc/nginx/conf.d/default.conf:ro \
  -v clearbook_certbot-webroot:/var/www/certbot \
  -p 80:80 \
  --network clearbook_clearbook-net \
  --name clearbook_nginx_bootstrap \
  nginx:alpine

# Verify it started cleanly (should show "start worker process" with no errors)
docker logs clearbook_nginx_bootstrap

# ── 6d. Issue the SSL certificate ─────────────────────────────────────────────
docker compose --profile certbot run --rm certbot certonly \
  --webroot \
  --webroot-path /var/www/certbot \
  --email your@email.com \
  --agree-tos \
  --no-eff-email \
  -d clearbook.yourdomain.com

# ── 6e. Stop bootstrap nginx and start the full stack with HTTPS ───────────────
docker stop clearbook_nginx_bootstrap
docker rm clearbook_nginx_bootstrap
docker compose up -d
```

Verify the certificate was issued:
```bash
ls /var/lib/docker/volumes/clearbook_certbot-certs/_data/live/
```

> **Volume naming note**: Docker Compose prefixes volume names with the project name,
> which defaults to the directory name. If you cloned to `~/clearbook`, the prefix
> is `clearbook` and the volume is `clearbook_certbot-webroot`.
> If you used a different directory name, adjust the `-v` flag accordingly,
> or check with: `docker volume ls | grep certbot`

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

Cron runs with a minimal `PATH` environment — commands like `docker` are not
found unless you use the full binary path. Using `/usr/bin/docker` ensures the
job runs correctly regardless of the cron environment.

```bash
crontab -e
```

Add these lines (note full paths and `MAILTO` to suppress silent mail errors):
```cron
MAILTO=""
0 3 * * * cd /home/ubuntu/clearbook && \
  /usr/bin/docker compose --profile certbot run --rm certbot renew --quiet && \
  /usr/bin/docker compose exec nginx nginx -s reload >> /var/log/certbot-renew.log 2>&1
```

Verify the path to docker on your VM before saving:
```bash
which docker   # should output /usr/bin/docker
```

---

## Step 9 — Seed the Database (first time only)

The seed script populates the database with demo doctors, patients, and
appointments. It runs inside Docker so it can reach `postgres-db` without
exposing the database port.

```bash
cd ~/clearbook

# Make the wrapper executable (only needed once)
chmod +x scripts/run_in_docker.sh

# ── Verify the connection (no writes) ────────────────────────────────────────
./scripts/run_in_docker.sh seed_database.py --dry-run

# ── Full seed (80 doctors, 200 patients, ~8 weeks future schedule) ────────────
./scripts/run_in_docker.sh seed_database.py

# ── Custom parameters (e.g. fewer doctors/patients for a dev server) ──────────
./scripts/run_in_docker.sh seed_database.py --doctors 20 --patients 50

# ── Re-seed from scratch (keeps manually registered accounts) ─────────────────
./scripts/run_in_docker.sh seed_database.py --reset

# ── Nuclear option — wipe everything including real user accounts ─────────────
./scripts/run_in_docker.sh seed_database.py --full-reset
```

The script will print progress and finish with:
```
==============================
  Seed complete!
  All demo accounts use password: Demo1234!
==============================
```

---

## Step 10 — Schedule Automatic Future Shifts (cron)

As time passes, the seeded doctors' future availability blocks will run out.
`extend_schedules.py` automatically creates new future blocks for all doctors
who have an existing schedule pattern.

**How it works:**
- Looks at each doctor's blocks from the last 28 days to infer their work hours
  and which clinic they work at on each weekday
- Creates any missing blocks up to 8 weeks ahead (configurable via `HORIZON_WEEKS`)
- Fully idempotent — safe to run multiple times, never overwrites existing blocks
- Skips doctors with no recent schedule (e.g. newly registered, waiting for setup)

**Test it first:**
```bash
# Dry-run: prints what would be created without writing anything
DRY_RUN=1 ./scripts/run_in_docker.sh extend_schedules.py

# Real run
./scripts/run_in_docker.sh extend_schedules.py

# Extend further ahead (12 weeks instead of the default 8)
HORIZON_WEEKS=12 ./scripts/run_in_docker.sh extend_schedules.py
```

**Set up the cron job** (runs every Monday morning at 06:00):
```bash
crontab -e
```

Add the following lines **below** the existing certbot renewal entry:
```cron
MAILTO=""
# Extend future doctor schedules every Monday at 06:00
0 6 * * 1 cd /home/ubuntu/clearbook && \
  /usr/bin/docker run --rm \
    --network clearbook_clearbook-net \
    -v /home/ubuntu/clearbook:/app -w /app \
    -e DB_HOST=postgres-db \
    -e DB_NAME=$(grep '^DB_NAME=' .env | cut -d= -f2) \
    -e DB_USER=$(grep '^DB_USER=' .env | cut -d= -f2) \
    -e DB_PASSWORD=$(grep '^DB_PASSWORD=' .env | cut -d= -f2) \
    -e HORIZON_WEEKS=8 \
    python:3.11-slim \
    bash -c "pip install psycopg2-binary -q && python extend_schedules.py" \
  >> /var/log/extend-schedules.log 2>&1
```

> **Why Monday at 06:00?** The seed creates 8 weeks of future blocks. Running
> once a week is more than enough to stay ahead. Running at 06:00 avoids overlap
> with the 03:00 certbot renewal and 02:00 database backup jobs.

Verify the cron job ran successfully:
```bash
cat /var/log/extend-schedules.log
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

# Stop all services (data volumes are preserved)
docker compose down

# Full reset — WARNING: -v deletes ALL named volumes including the database!
docker compose down -v
```

### Database Backup & Restore

Named Docker volumes are safe from accidental deletion during normal operation,
but `docker compose down -v` wipes them permanently. Keep regular backups.

```bash
# ── Create a backup ────────────────────────────────────────────────────────────
# pg_dump with -F c (custom format) supports selective table restore later.
docker compose exec postgres-db \
  pg_dump -U ${DB_USER} -d ${DB_NAME} -F c \
  > backup_$(date +%F).dump

# ── Restore from a backup ──────────────────────────────────────────────────────
# The database must exist but be empty (or freshly created).
docker exec -i $(docker compose ps -q postgres-db) \
  pg_restore -U ${DB_USER} -d ${DB_NAME} -1 < backup_2025-01-01.dump

# ── Automated daily backup via cron (add to crontab -e) ───────────────────────
# Keeps 30 days of backups in ~/clearbook/backups/
MAILTO=""
0 2 * * * mkdir -p /home/ubuntu/clearbook/backups && \
  /usr/bin/docker compose -f /home/ubuntu/clearbook/docker-compose.yaml \
  exec -T postgres-db pg_dump -U clearbook_user -d clearbook_db -F c \
  > /home/ubuntu/clearbook/backups/backup_$(date +\%F).dump && \
  find /home/ubuntu/clearbook/backups -name "*.dump" -mtime +30 -delete \
  >> /var/log/db-backup.log 2>&1
```

> 💡 For production consider also copying backups to OCI Object Storage
> (`oci os object put`) or a remote location — a backup on the same VM
> is lost if the VM is destroyed.

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
