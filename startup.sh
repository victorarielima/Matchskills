#!/bin/bash

# Script de configuração para deploy na Azure Linux
# Este script é executado automaticamente durante o deploy

echo "=== Azure Linux Deploy Configuration ==="

# 1. Configurar variáveis de ambiente para Linux
export NODE_ENV=production
export PORT=${PORT:-8080}

# 2. Instalar dependências
echo "Installing dependencies..."
npm ci --production=false

# 3. Build do projeto
echo "Building project..."
npm run build

# 4. Executar migrations do banco
echo "Running database migrations..."
npm run db:migrate

# 5. Iniciar aplicação
echo "Starting application..."
npm run start:linux
