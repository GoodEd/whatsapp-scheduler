#!/bin/bash

# Load environment variables from .env file
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
else
  echo "❌ ERROR: .env file not found!"
  echo "📝 Please copy .env.example to .env and add your WHAPI_TOKEN"
  exit 1
fi

# Set defaults
export CSV_PATH=${CSV_PATH:-"./schedule.csv"}
export SERVER_PORT=${SERVER_PORT:-3001}

echo "🚀 Starting WhatsApp Scheduler Web UI..."
echo "🌐 Web Interface: http://localhost:$SERVER_PORT"
echo "📱 Channel Token: ${WHAPI_TOKEN:0:8}..."
echo "📄 CSV Path: $CSV_PATH"
echo ""

node server.js
