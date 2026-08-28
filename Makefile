.PHONY: help dev prod build test lint clean db-migrate

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# Development
dev: ## Start development database and cache services
	docker compose up -d db redis

dev-backend: ## Run local backend using Uvicorn
	cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

dev-frontend: ## Run local frontend dev server
	cd frontend && npm run dev

dev-worker: ## Start Celery background tasks worker
	cd backend && celery -A app.workers.celery_app worker --loglevel=info

db-migrate: ## Apply database migrations using Alembic
	cd backend && alembic upgrade head

# Production
prod: ## Build and start production multi-container platform
	docker compose -f docker-compose.prod.yml up -d --build

prod-down: ## Stop production services
	docker compose -f docker-compose.prod.yml down

# Clean
clean: ## Clean all cached compiled assets
	find . -type d -name __pycache__ -exec rm -rf {} +
	rm -rf backend/.pytest_cache
	rm -rf backend/htmlcov
