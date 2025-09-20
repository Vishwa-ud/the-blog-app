# Blog App Docker Compose Management
.PHONY: help dev prod build logs clean migrate seed backup

# Default target
help: ## Show this help message
	@echo "Blog App Docker Compose Commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

# Development commands
dev: ## Start development environment
	docker-compose -f docker-compose.dev.yml up -d
	@echo "🚀 Development environment started!"
	@echo "Backend: http://localhost:3000"
	@echo "Database: localhost:5432"

dev-build: ## Build and start development environment
	docker-compose -f docker-compose.dev.yml up -d --build

dev-logs: ## View development logs
	docker-compose -f docker-compose.dev.yml logs -f

dev-stop: ## Stop development environment
	docker-compose -f docker-compose.dev.yml down

# Production commands
prod: ## Start production environment
	docker-compose -f docker-compose.prod.yml up -d
	@echo "🚀 Production environment started!"

prod-build: ## Build and start production environment
	docker-compose -f docker-compose.prod.yml up -d --build

prod-logs: ## View production logs
	docker-compose -f docker-compose.prod.yml logs -f

prod-stop: ## Stop production environment
	docker-compose -f docker-compose.prod.yml down

# Full stack commands
full: ## Start full stack environment
	docker-compose up -d
	@echo "🚀 Full stack environment started!"
	@echo "Frontend: http://localhost"
	@echo "Backend: http://localhost:3000"

full-build: ## Build and start full stack environment
	docker-compose up -d --build

full-logs: ## View full stack logs
	docker-compose logs -f

full-stop: ## Stop full stack environment
	docker-compose down

# Database commands
migrate: ## Run database migrations
	docker-compose exec backend npx prisma migrate deploy
	@echo "✅ Database migrations completed!"

migrate-dev: ## Create and apply new migration
	docker-compose exec backend npx prisma migrate dev

seed: ## Seed database with initial data
	docker-compose exec backend npm run seed
	@echo "✅ Database seeded!"

db-shell: ## Access database shell
	docker-compose exec db psql -U postgres -d blogapp

db-reset: ## Reset database (WARNING: This will delete all data!)
	@read -p "Are you sure you want to reset the database? [y/N] " confirm && [ $$confirm = y ]
	docker-compose exec backend npx prisma migrate reset --force
	@echo "🗑️ Database reset completed!"

# Backup and restore
backup: ## Create database backup
	@mkdir -p backups
	docker-compose exec db pg_dump -U postgres blogapp > backups/backup-$$(date +%Y%m%d-%H%M%S).sql
	@echo "💾 Database backup created in backups/ directory"

restore: ## Restore database from backup (usage: make restore BACKUP=filename.sql)
	@if [ -z "$(BACKUP)" ]; then echo "Usage: make restore BACKUP=filename.sql"; exit 1; fi
	docker-compose exec -T db psql -U postgres -d blogapp < backups/$(BACKUP)
	@echo "📥 Database restored from $(BACKUP)"

# Maintenance commands
logs: ## View logs for all services
	docker-compose logs -f

build: ## Build all services
	docker-compose build

clean: ## Clean up containers, networks, and volumes
	docker-compose down -v
	docker system prune -f
	@echo "🧹 Cleanup completed!"

restart: ## Restart all services
	docker-compose restart
	@echo "🔄 All services restarted!"

status: ## Show status of all services
	docker-compose ps

# Development utilities
shell-backend: ## Access backend container shell
	docker-compose exec backend sh

shell-frontend: ## Access frontend container shell  
	docker-compose exec frontend sh

shell-db: ## Access database container shell
	docker-compose exec db sh

# Health checks
health: ## Check health of all services
	@echo "🏥 Health Check Results:"
	@echo "Backend: $$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health || echo "FAIL")"
	@echo "Database: $$(docker-compose exec db pg_isready -U postgres || echo "FAIL")"
	@echo "Redis: $$(docker-compose exec redis redis-cli ping || echo "FAIL")"

# Setup commands
setup: ## Initial setup (copy env file, start dev environment)
	@if [ ! -f .env ]; then cp .env.example .env; echo "📄 .env file created from .env.example"; fi
	@echo "✏️  Please edit .env file with your configuration"
	@echo "Then run: make dev"

# Testing
test: ## Run tests in containers
	docker-compose exec backend npm test
	docker-compose exec frontend npm test

# Update dependencies
update: ## Update all dependencies and rebuild
	docker-compose exec backend npm update
	docker-compose exec frontend npm update
	docker-compose build
	@echo "📦 Dependencies updated and containers rebuilt!"

# SSL setup for production
ssl: ## Generate self-signed SSL certificates for nginx
	@mkdir -p nginx/ssl
	openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
		-keyout nginx/ssl/nginx.key \
		-out nginx/ssl/nginx.crt \
		-subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
	@echo "🔒 SSL certificates generated in nginx/ssl/"