#!/bin/bash

export WHAPI_TOKEN="9LId9ZUKfkduvHSCi7BObvig5VjGfZi9"
export CSV_PATH="/Users/gurkiratsingh/schedule.csv"
export CONCURRENCY=3

echo "Starting WhatsApp Scheduler..."
echo "Token: $WHAPI_TOKEN"
echo "CSV Path: $CSV_PATH"
echo "Concurrency: $CONCURRENCY"

node index.js