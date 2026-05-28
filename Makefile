ENV_FILE ?= backend/.env.development

up:
	docker compose --env-file $(ENV_FILE) up -d --build

start:
	docker compose --env-file $(ENV_FILE) up -d

down:
	docker compose --env-file $(ENV_FILE) down

restart:
	docker compose --env-file $(ENV_FILE) restart backend

logs:
	docker compose --env-file $(ENV_FILE) logs -f backend

db:
	@export $$(grep -v '^#' $(ENV_FILE) | xargs) && \
	  docker compose exec postgres psql -U $$DB_USER -d $$DB_NAME

migrate:
	docker compose exec backend npm run migrate:latest

seed:
	docker compose exec backend npm run seed

shell:
	docker compose exec backend sh

test:
	cd backend && npm test

clean:
	docker compose --env-file $(ENV_FILE) down -v --remove-orphans

.PHONY: up start down restart logs db migrate seed shell test clean
