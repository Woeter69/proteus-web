# --- Stage 1: Build Next.js Frontend ---
FROM node:20-slim AS frontend-builder
WORKDIR /app/frontend
COPY platform/frontend/package*.json ./
RUN npm install
COPY platform/frontend/ ./
# Ensure the frontend points to the relative /api path for production
ENV NEXT_PUBLIC_API_URL=/api
RUN npm run build

# --- Stage 2: Final Image ---
FROM continuumio/miniconda3:latest

# Install system dependencies, Node.js, and Nginx
RUN apt-get update && apt-get install -y \
    libxrender1 libxext6 libsm6 build-essential \
    curl nginx gettext-base redis-server libgomp1 \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Setup Conda environment
COPY environment.yml .
RUN conda env update -n base -f environment.yml && conda clean -afy

# Copy Backend and Source
COPY platform/backend/ ./backend/
COPY src/ ./src/

# Copy Frontend artifacts
COPY --from=frontend-builder /app/frontend/.next ./.next
COPY --from=frontend-builder /app/frontend/public ./public
COPY --from=frontend-builder /app/frontend/package*.json ./
COPY --from=frontend-builder /app/frontend/next.config.* ./
COPY --from=frontend-builder /app/frontend/node_modules ./node_modules

# Copy Nginx configuration template
COPY platform/nginx/nginx.conf.template /etc/nginx/templates/nginx.conf.template

# Start script: 
# 1. Replaces $PORT in nginx template
# 2. Starts Redis Server
# 3. Starts Celery Worker
# 4. Starts FastAPI on 8000
# 5. Starts Next.js on 3000
# 6. Starts Nginx on $PORT
RUN echo '#!/bin/bash' > /app/start.sh && \
    echo 'envsubst '\''${PORT}'\'' < /etc/nginx/templates/nginx.conf.template > /etc/nginx/nginx.conf' >> /app/start.sh && \
    echo 'redis-server --daemonize yes' >> /app/start.sh && \
    echo 'sleep 2' >> /app/start.sh && \
    echo 'celery -A backend.worker:celery_app worker --loglevel=info &' >> /app/start.sh && \
    echo 'uvicorn backend.main:app --host 127.0.0.1 --port 8000 &' >> /app/start.sh && \
    echo 'npm run start -- -p 3000 &' >> /app/start.sh && \
    echo 'nginx -g "daemon off;"' >> /app/start.sh && \
    chmod +x /app/start.sh

CMD ["/app/start.sh"]