# Makefile for Ceramic Production Analysis & Prediction System

.PHONY: all help install start stop status restart clean logs logs-backend logs-ai logs-web \
         docker-up docker-down docker-logs docker-status docker-clean docker-restart

# Color definitions using portable printf
GREEN  := $(shell printf '\033[32m')
YELLOW := $(shell printf '\033[33m')
WHITE  := $(shell printf '\033[37m')
CYAN   := $(shell printf '\033[36m')
RESET  := $(shell printf '\033[0m')

# Directory configurations
RUN_DIR  := .run
LOG_DIR  := .logs

# PID files
BACKEND_PID := $(RUN_DIR)/backend.pid
AI_PID      := $(RUN_DIR)/ai.pid
WEB_PID     := $(RUN_DIR)/web.pid

# Log files
BACKEND_LOG := $(LOG_DIR)/backend.log
AI_LOG      := $(LOG_DIR)/ai.log
WEB_LOG     := $(LOG_DIR)/web.log

all: help

help:
	@echo ""
	@echo "$(GREEN)🏺 Ceramic Production System Control Center$(RESET)"
	@echo "==========================================="
	@echo "$(YELLOW)Usage:$(RESET)"
	@echo "  make <target>"
	@echo ""
	@echo "$(YELLOW)=== Docker Compose (推荐) ====$(RESET)"
	@echo "  $(CYAN)docker-up$(RESET)       🐳 一键启动所有服务 (PostgreSQL + Backend + AI + Web)"
	@echo "  $(CYAN)docker-down$(RESET)     停止所有 Docker 服务"
	@echo "  $(CYAN)docker-restart$(RESET)  重启所有 Docker 服务"
	@echo "  $(CYAN)docker-status$(RESET)   查看 Docker 服务状态"
	@echo "  $(CYAN)docker-logs$(RESET)     查看 Docker 实时日志"
	@echo "  $(CYAN)docker-clean$(RESET)    删除所有容器和数据卷"
	@echo ""
	@echo "$(YELLOW)=== 本地开发 ====$(RESET)"
	@echo "  $(CYAN)install$(RESET)        安装所有依赖 (Backend, AI, Frontend)"
	@echo "  $(CYAN)start$(RESET)          启动所有本地服务"
	@echo "  $(CYAN)stop$(RESET)           停止所有本地服务"
	@echo "  $(CYAN)status$(RESET)         查看本地服务状态"
	@echo "  $(CYAN)restart$(RESET)        重启所有本地服务"
	@echo "  $(CYAN)logs$(RESET)           查看所有本地服务日志"
	@echo "  $(CYAN)logs-backend$(RESET)   查看 Backend 日志"
	@echo "  $(CYAN)logs-ai$(RESET)        查看 AI 服务日志"
	@echo "  $(CYAN)logs-web$(RESET)       查看 Frontend 日志"
	@echo "  $(CYAN)clean$(RESET)          清理日志、PIDs 和构建文件"
	@echo ""

install:
	@echo "$(YELLOW)Installing all dependencies...$(RESET)"
	@echo "$(YELLOW)[1/3] Backend: Preparing Gradle build...$(RESET)"
	@cd ceramic && ./gradlew build -x test
	@echo "$(YELLOW)[2/3] AI Service: Syncing python environment...$(RESET)"
	@cd ceramic-ai && uv pip install -r requirements.txt
	@echo "$(YELLOW)[3/3] Frontend: Installing NPM packages...$(RESET)"
	@cd ceramic-web && npm install --registry=https://registry.npmmirror.com
	@echo "$(GREEN)All dependencies installed successfully!$(RESET)"

start:
	@mkdir -p $(RUN_DIR) $(LOG_DIR)
	@echo "$(YELLOW)Starting all services on host 0.0.0.0...$(RESET)"
	
	@# 1. Start AI service
	@if [ -f $(AI_PID) ] && kill -0 $$(cat $(AI_PID)) 2>/dev/null; then \
		echo "AI Service is already running (PID: $$(cat $(AI_PID)))"; \
	else \
		echo "Starting AI Service (FastAPI)..."; \
		cd ceramic-ai && uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 > ../$(AI_LOG) 2>&1 & echo $$! > ../$(AI_PID); \
		sleep 1; \
	fi

	@# 2. Start Backend
	@if [ -f $(BACKEND_PID) ] && kill -0 $$(cat $(BACKEND_PID)) 2>/dev/null; then \
		echo "Backend is already running (PID: $$(cat $(BACKEND_PID)))"; \
	else \
		echo "Starting Backend (Spring Boot)..."; \
		cd ceramic && ./gradlew bootRun > ../$(BACKEND_LOG) 2>&1 & echo $$! > ../$(BACKEND_PID); \
		sleep 2; \
	fi

	@# 3. Start Frontend
	@if [ -f $(WEB_PID) ] && kill -0 $$(cat $(WEB_PID)) 2>/dev/null; then \
		echo "Frontend is already running (PID: $$(cat $(WEB_PID)))"; \
	else \
		echo "Starting Frontend (Vite)..."; \
		cd ceramic-web && npm run dev -- --host 0.0.0.0 > ../$(WEB_LOG) 2>&1 & echo $$! > ../$(WEB_PID); \
		sleep 1; \
	fi
	@echo "$(GREEN)All services successfully launched! Use 'make status' to check.$(RESET)"

stop:
	@echo "$(YELLOW)Stopping all services...$(RESET)"
	@# Stop Frontend (Vite)
	@if [ -f $(WEB_PID) ]; then \
		PID=$$(cat $(WEB_PID)); \
		if kill -0 $$PID 2>/dev/null; then \
			echo "Stopping Frontend (PID: $$PID)..."; \
			kill -15 $$PID 2>/dev/null || true; \
			pkill -P $$PID 2>/dev/null || true; \
		fi; \
		rm -f $(WEB_PID); \
	fi
	@pkill -f "vite" 2>/dev/null || true
	
	@# Stop Backend (Spring Boot)
	@if [ -f $(BACKEND_PID) ]; then \
		PID=$$(cat $(BACKEND_PID)); \
		if kill -0 $$PID 2>/dev/null; then \
			echo "Stopping Backend (PID: $$PID)..."; \
			kill -15 $$PID 2>/dev/null || true; \
			pkill -P $$PID 2>/dev/null || true; \
		fi; \
		rm -f $(BACKEND_PID); \
	fi
	@pkill -f "ceramic.*bootRun" 2>/dev/null || true
	@pkill -f "GradleDaemon" 2>/dev/null || true
	
	@# Stop AI Service (FastAPI)
	@if [ -f $(AI_PID) ]; then \
		PID=$$(cat $(AI_PID)); \
		if kill -0 $$PID 2>/dev/null; then \
			echo "Stopping AI Service (PID: $$PID)..."; \
			kill -15 $$PID 2>/dev/null || true; \
			pkill -P $$PID 2>/dev/null || true; \
		fi; \
		rm -f $(AI_PID); \
	fi
	@pkill -f "uvicorn app.main:app" 2>/dev/null || true
	@echo "$(GREEN)All services stopped!$(RESET)"

status:
	@echo ""
	@echo "$(YELLOW)Service Status Check:$(RESET)"
	@echo "======================"
	@# AI Service
	@if [ -f $(AI_PID) ] && kill -0 $$(cat $(AI_PID)) 2>/dev/null; then \
		echo "🤖 AI Service (FastAPI) : $(GREEN)RUNNING$(RESET) (PID: $$(cat $(AI_PID))) - http://localhost:8000"; \
	else \
		echo "🤖 AI Service (FastAPI) : $(YELLOW)STOPPED$(RESET)"; \
	fi
	@# Backend
	@if [ -f $(BACKEND_PID) ] && kill -0 $$(cat $(BACKEND_PID)) 2>/dev/null; then \
		echo "☕ Backend (Spring Boot): $(GREEN)RUNNING$(RESET) (PID: $$(cat $(BACKEND_PID))) - http://localhost:8080"; \
	else \
		echo "☕ Backend (Spring Boot): $(YELLOW)STOPPED$(RESET)"; \
	fi
	@# Frontend
	@if [ -f $(WEB_PID) ] && kill -0 $$(cat $(WEB_PID)) 2>/dev/null; then \
		echo "🖥️ Frontend (Vite)     : $(GREEN)RUNNING$(RESET) (PID: $$(cat $(WEB_PID))) - http://localhost:5173"; \
	else \
		echo "🖥️ Frontend (Vite)     : $(YELLOW)STOPPED$(RESET)"; \
	fi
	@echo ""

restart: stop start

logs:
	@echo "Tailing all logs (Press Ctrl+C to exit)..."
	@tail -f $(BACKEND_LOG) -f $(AI_LOG) -f $(WEB_LOG)

logs-backend:
	@tail -f $(BACKEND_LOG)

logs-ai:
	@tail -f $(AI_LOG)

logs-web:
	@tail -f $(WEB_LOG)

clean: stop
	@echo "$(YELLOW)Cleaning logs and PIDs...$(RESET)"
	@rm -rf $(RUN_DIR) $(LOG_DIR)
	@echo "$(YELLOW)Cleaning build artifacts...$(RESET)"
	@cd ceramic && ./gradlew clean
	@echo "$(GREEN)Clean completed!$(RESET)"

# ============================================================================
# Docker Compose Commands
# ============================================================================

docker-up:
	@echo "$(GREEN)🐳 启动所有 Docker 容器...$(RESET)"
	@echo "$(YELLOW)这可能需要 3-5 分钟用于首次构建$(RESET)"
	@docker-compose up -d
	@echo ""
	@echo "$(YELLOW)⏳ 等待服务初始化...$(RESET)"
	@sleep 30
	@echo ""
	@make docker-status
	@echo ""
	@echo "$(GREEN)✅ 服务已启动!$(RESET)"
	@echo "$(CYAN)访问地址:$(RESET)"
	@echo "  前端:        http://localhost:5173"
	@echo "  后端 API:    http://localhost:8080"
	@echo "  AI 服务:     http://localhost:8000/docs"
	@echo "  数据库:      localhost:5432 (PostgreSQL)"
	@echo ""
	@echo "$(YELLOW)查看日志: make docker-logs$(RESET)"

docker-down:
	@echo "$(YELLOW)🛑 停止所有 Docker 容器...$(RESET)"
	@docker-compose down
	@echo "$(GREEN)✅ 所有容器已停止$(RESET)"

docker-restart:
	@echo "$(YELLOW)🔄 重启所有 Docker 容器...$(RESET)"
	@docker-compose restart
	@sleep 15
	@make docker-status

docker-status:
	@echo ""
	@echo "$(YELLOW)Docker 服务状态:$(RESET)"
	@echo "=================================="
	@docker-compose ps
	@echo ""

docker-logs:
	@echo "$(YELLOW)📊 查看实时日志 (Ctrl+C 退出)...$(RESET)"
	@docker-compose logs -f

docker-clean:
	@echo "$(YELLOW)🧹 完全清理 Docker (包括数据卷)...$(RESET)"
	@docker-compose down -v
	@echo "$(GREEN)✅ Docker 环境已清理$(RESET)"
	@echo "$(YELLOW)注意: 所有数据库数据将被删除$(RESET)"
