#!/bin/bash

# WhatsApp Scheduler - Digital Ocean Deployment Script
set -e

echo "🚀 Starting WhatsApp Scheduler deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ ERROR: .env file not found!${NC}"
    echo -e "${YELLOW}📝 Please create .env file with your WHAPI_TOKEN${NC}"
    exit 1
fi

# Load environment variables
source .env

# Check required environment variables
if [ -z "$WHAPI_TOKEN" ]; then
    echo -e "${RED}❌ ERROR: WHAPI_TOKEN not set in .env file${NC}"
    exit 1
fi

# Create necessary directories
mkdir -p data logs

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down || true

# Build and start containers
echo "🏗️ Building and starting containers..."
docker-compose up -d --build

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Health check
echo "🔍 Checking service health..."
for i in {1..30}; do
    if curl -s http://localhost:3001/api/health > /dev/null; then
        echo -e "${GREEN}✅ WhatsApp Scheduler is running successfully!${NC}"
        echo -e "${GREEN}🌐 Access the web interface at: http://YOUR_DROPLET_IP:3001${NC}"
        echo -e "${GREEN}📱 Channel Token: ${WHAPI_TOKEN:0:8}...${NC}"
        break
    fi
    
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ Service failed to start within 5 minutes${NC}"
        echo "📋 Checking logs..."
        docker-compose logs --tail=20
        exit 1
    fi
    
    echo "⏳ Waiting for service... ($i/30)"
    sleep 10
done

# Show running containers
echo "📦 Running containers:"
docker-compose ps

# Show logs
echo "📋 Recent logs:"
docker-compose logs --tail=10

echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"