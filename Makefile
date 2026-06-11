# ─────────────────────────────────────────────────────────────────────────────
# ClearBook — Makefile shortcuts
# ─────────────────────────────────────────────────────────────────────────────
# Usage:  make <target>
# ─────────────────────────────────────────────────────────────────────────────

COMPOSE = docker compose -f docker-compose.yaml -f docker-compose.dev.yaml

.PHONY: help setup dev dev-d down logs logs-backend logs-frontend clean db shell-backend shell-frontend seed seed-reset

help: ## Show this help message
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
	  awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'

setup: ## First-time setup: create .env and start all containers
	@chmod +x setup.sh && ./setup.sh

dev: ## Build and start all local containers (foreground)
	$(COMPOSE) up --build

dev-d: ## Build and start all local containers (background)
	$(COMPOSE) up --build -d

down: ## Stop and remove all local containers
	$(COMPOSE) down

logs: ## Tail logs from all containers
	$(COMPOSE) logs -f

logs-backend: ## Tail backend logs only
	$(COMPOSE) logs -f backend

logs-frontend: ## Tail frontend logs only
	$(COMPOSE) logs -f frontend

clean: ## Full reset: stop containers, remove images + volumes (fixes schema errors)
	$(COMPOSE) down --volumes --rmi local

db: ## Open a psql shell inside the PostgreSQL container
	docker exec -it clearbook_postgres psql -U $${DB_USER:-clearbook_user} -d $${DB_NAME:-clearbook}

shell-backend: ## Open a shell inside the backend container
	docker exec -it clearbook_backend /bin/sh

shell-frontend: ## Open a shell inside the frontend container
	docker exec -it clearbook_frontend /bin/sh

seed: ## Seed the database with demo data (80 doctors, 200 patients)
	@echo "Installing Python dependencies…"
	pip install -r requirements.txt -q
	python seed_database.py

seed-reset: ## Wipe previous seed data and re-seed from scratch
	@echo "Installing Python dependencies…"
	pip install -r requirements.txt -q
	python seed_database.py --reset
