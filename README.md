# WhatsApp Scheduler - Complete System

A production-ready Node.js application for scheduling WhatsApp messages, polls, and group display picture changes via Whapi.Cloud API, featuring both CLI scheduling and a web-based UI.

## 🚀 Features

### Core Functionality
- **Automated Scheduling**: Cron-based message delivery every minute
- **Multiple Message Types**: Text messages, polls, and group display pictures
- **Retry Logic**: 3 attempts with exponential backoff for failed messages
- **State Management**: CSV-based persistence with automatic status updates
- **Rate Limiting**: Configurable concurrency control via p-queue

### Web Interface
- **Visual Dashboard**: Modern, responsive web UI
- **Group/Contact Management**: Fetch and browse WhatsApp groups and contacts
- **Interactive Scheduling**: Visual forms for scheduling different message types
- **Real-time Status**: Live channel connection status and message tracking
- **Test Messaging**: Send immediate test messages
- **Schedule Management**: View, edit, and delete scheduled messages

## 🛠 Quick Start

1. **Install dependencies**: `npm install`
2. **Set your token**: Edit `start-ui.sh` with your Whapi.Cloud token
3. **Start web interface**: `./start-ui.sh`
4. **Open browser**: http://localhost:3001
5. **Start scheduling**: Use the web interface to manage messages

## 🌐 Web Interface

Access the dashboard at http://localhost:3001 with these features:

- **📅 Schedule Messages**: Create text, poll, and display picture messages
- **👥 Groups**: Browse and select WhatsApp groups
- **📞 Contacts**: View and select contacts  
- **📋 Scheduled Items**: Manage existing schedules
- **📤 Test Message**: Send immediate test messages

## 📁 Project Structure

```
whatsapp-scheduler/
├── Core System
│   ├── index.js           # Main cron scheduler
│   ├── whapi.js          # Whapi.Cloud API wrapper
│   ├── csvUtils.js       # CSV file management
│   └── webhook.js        # Webhook server
│
├── Web Interface
│   ├── server.js         # Express API server
│   └── public/           # Frontend files
│
├── Configuration
│   ├── package.json      # Dependencies
│   ├── schedule.csv      # Message data
│   ├── start.sh         # CLI startup
│   └── start-ui.sh      # Web UI startup
│
└── README.md            # This file
```

## 🔧 Running Options

### Web Interface (Recommended)
```bash
./start-ui.sh
# Opens web dashboard at http://localhost:3001
```

### CLI Scheduler Only
```bash
./start.sh
# Runs background message scheduler
```

### Both Systems
```bash
# Terminal 1: Web UI
./start-ui.sh

# Terminal 2: Scheduler
./start.sh
```

## 📊 CSV Files

The system uses two main CSV files:

### Schedule CSV (`schedule.csv`)
Main scheduling data storage:
```csv
type,group_id,body,poll_options,image_url,send_at,sent,status,message_id,error_details,sent_at
text,919876543210,Hello World!,,,1692825600,false,pending,,,
poll,919876543210,Favorite color?,Red;Blue;Green,,1692825660,false,pending,,,
dp,120363023456789012,,,https://example.com/image.jpg,1692825720,false,pending,,,
```

### Subgroups CSV (`subgroups.csv`)
Subgroup management for bulk messaging:
```csv
subgroup_id,subgroup_name,description,group_ids,created_at,updated_at
example-uuid-1,Marketing Team,Marketing campaigns,"919876543210,919876543211",2024-01-01T00:00:00.000Z,2024-01-01T00:00:00.000Z
```

**📝 Note**: Template files (`.template`) are included with example data for reference.

## 🔒 Configuration

Set environment variables:
```bash
export WHAPI_TOKEN="your_whapi_cloud_token"
export CSV_PATH="/absolute/path/to/schedule.csv"
export CONCURRENCY=5
export SERVER_PORT=3001
```

## 🖥️ Terminal Commands

### Starting the System
```bash
# Start web server + scheduler (recommended)
WHAPI_TOKEN=your_token_here nohup node server.js > server.log 2>&1 &
WHAPI_TOKEN=your_token_here CSV_PATH=./schedule.csv nohup node index.js > scheduler.log 2>&1 &

# Or use the provided scripts
./start-ui.sh    # Starts both server and scheduler
./start.sh       # Starts scheduler only
```

### Checking Server Status
```bash
# Check if processes are running
ps aux | grep "node.*js" | grep -v grep

# Check server health
curl -s http://localhost:3001/api/health | head -20

# Check if ports are in use
lsof -ti:3001

# Check server logs (last 20 lines)
tail -20 server.log

# Check scheduler logs (last 20 lines)  
tail -20 scheduler.log

# Follow logs in real-time
tail -f server.log    # Server logs
tail -f scheduler.log # Scheduler logs
```

### Testing the API
```bash
# Test API endpoints
curl -s http://localhost:3001/api/channel-info | head -20
curl -s http://localhost:3001/api/groups | head -20
curl -s http://localhost:3001/api/stats
curl -s http://localhost:3001/api/schedule | head -20

# Trigger immediate processing
curl -s -X POST http://localhost:3001/api/process-now

# Send test message
curl -X POST http://localhost:3001/api/send-now \
  -H "Content-Type: application/json" \
  -d '{"type":"text","group_id":"your_group_id","body":"Test message"}'
```

### Managing the System
```bash
# Stop all processes
pkill -f "node server.js"
pkill -f "node index.js"

# Restart the system
pkill -f "node.*js" && sleep 2 && ./start-ui.sh

# Check system performance
top -pid $(pgrep -f "node.*js")

# Monitor network connections
netstat -an | grep 3001
```

### Debugging
```bash
# Check for errors in logs
grep -i error server.log
grep -i error scheduler.log

# Check CSV file status
wc -l schedule.csv
head -5 schedule.csv
tail -5 schedule.csv

# Verify environment
echo $WHAPI_TOKEN | cut -c1-8
echo $CSV_PATH
```

### Clean System Reset
```bash
# Clear all scheduled messages
echo "type,group_id,body,poll_options,image_url,send_at,sent,status,message_id,error_details,sent_at" > schedule.csv

# Clear logs
> server.log
> scheduler.log

# Restart fresh
pkill -f "node.*js" && sleep 2 && ./start-ui.sh
```

Your complete WhatsApp scheduling system is now ready! 🎉