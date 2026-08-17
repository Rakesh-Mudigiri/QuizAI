# =====================================================================
# QuizAI Production Dockerfile
# Multi-stage build for React UI + FastAPI Python Backend
# =====================================================================

# Stage 1: Build React Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/react-ui
COPY react-ui/package*.json ./
RUN npm install
COPY react-ui/ ./
RUN npm run build

# Stage 2: Production Python API Server
FROM python:3.11-slim
WORKDIR /app

# Prevent Python from writing bytecode and buffer stdout
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend ./backend

# Copy compiled frontend from Stage 1 into react-ui/dist
COPY --from=frontend-builder /app/react-ui/dist ./react-ui/dist

# Expose server port
EXPOSE 8000

# Start Uvicorn web server (supports Render dynamic $PORT)
CMD ["sh", "-c", "python -m uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
