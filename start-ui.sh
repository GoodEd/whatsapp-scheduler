#!/bin/bash

export WHAPI_TOKEN="9LId9ZUKfkduvHSCi7BObvig5VjGfZi9"
export CSV_PATH="/Users/gurkiratsingh/schedule.csv"
export SERVER_PORT=3001

echo "🚀 Starting WhatsApp Scheduler Web UI..."
echo "🌐 Web Interface: http://localhost:3001"
#echo "📱 Channel Token: ${WHAPI_TOKEN:0:8}..."
echo "📄 CSV Path: $CSV_PATH"
echo ""

node server.js &
