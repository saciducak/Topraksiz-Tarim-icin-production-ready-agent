.PHONY: help up down build logs backend frontend test clean

# Default target
help:
	@echo "🌾 Topraksız Tarım AI Agent - Makefile"
	@echo ""
	@echo "Available commands:"
	@echo "  make up        - Start all services"
	@echo "  make down      - Stop all services"
	@echo "  make build     - Build Docker images"
	@echo "  make logs      - Show logs"
	@echo "  make backend   - Run backend locally"
	@echo "  make frontend  - Run frontend locally"
	@echo "  make test      - Run tests"
	@echo "  make clean     - Clean up"
	@echo "  make setup     - Initial setup"

# Docker commands
up:
	docker-compose up -d
	@echo "✅ Services started!"
	@echo "   Backend:  http://localhost:8000"
	@echo "   Frontend: http://localhost:3000"
	@echo "   Qdrant:   http://localhost:6333"

down:
	docker-compose down

build:
	docker-compose build --no-cache

logs:
	docker-compose logs -f

# Local development
backend:
	cd backend && pip install -r requirements.txt && uvicorn src.main:app --reload --port 8000

frontend:
	cd frontend && npm install && npm run dev

# Testing
test:
	cd backend && pytest tests/ -v

# Cleanup
clean:
	docker-compose down -v
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -type d -name .pytest_cache -exec rm -rf {} +
	find . -type d -name node_modules -exec rm -rf {} +

# Initial setup
setup:
	@echo "📦 Setting up environment..."
	cp -n .env.example .env || true
	@echo "🔧 Pulling Ollama models..."
	ollama pull llama3.2
	ollama pull nomic-embed-text
	@echo "🐳 Building Docker images..."
	docker-compose build
	@echo "✅ Setup complete! Run 'make up' to start."
