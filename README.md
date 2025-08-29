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
2. **Configure environment**: 
   ```bash
   cp .env.example .env
   # Edit .env and add your WHAPI_TOKEN from https://whapi.cloud
   ```
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

The system uses environment variables from a `.env` file:

```bash
# Copy the example file
cp .env.example .env

# Edit .env with your values:
WHAPI_TOKEN=your_whapi_cloud_token_here
CSV_PATH=./schedule.csv
SERVER_PORT=3001
CONCURRENCY=15
```

**🔐 Security**: Never commit your `.env` file to git - it's already in `.gitignore`

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

## 🌐 Digital Ocean Deployment

Deploy your WhatsApp Scheduler on Digital Ocean droplets for production use.

### Prerequisites
- Digital Ocean droplet (Ubuntu 20.04+ recommended)
- Domain name (optional, for SSL)
- Your WHAPI_TOKEN from https://whapi.cloud

### Step 1: Create Digital Ocean Droplet
1. **Create Droplet**: 
   - Ubuntu 20.04 or 22.04 LTS
   - Minimum: 1GB RAM, 1 vCPU
   - Recommended: 2GB RAM, 2 vCPU
2. **Access via SSH**: `ssh root@YOUR_DROPLET_IP`

### Step 2: Initial Server Setup
Run the production setup script on your droplet:
```bash
# Download and run the setup script
curl -fsSL https://raw.githubusercontent.com/GoodEd/whatsapp-scheduler/main/setup-production.sh -o setup-production.sh
chmod +x setup-production.sh
./setup-production.sh
```

This script will:
- Install Docker and Docker Compose
- Configure firewall (allow ports 22, 3001)
- Create systemd service for auto-restart
- Set up log rotation and monitoring
- Create necessary directories

### Step 3: Deploy Your Application
```bash
# Navigate to application directory
cd /opt/whatsapp-scheduler

# Clone your repository
git clone https://github.com/GoodEd/whatsapp-scheduler.git .

# Create .env file with your token
nano .env
```

Add your configuration to `.env`:
```bash
WHAPI_TOKEN=your_whapi_cloud_token_here
CSV_PATH=./schedule.csv
SUBGROUPS_PATH=./subgroups.csv
SERVER_PORT=3001
CONCURRENCY=15
NODE_ENV=production
```

### Step 4: Deploy with Docker
```bash
# Run the deployment script
./deploy.sh
```

The deployment script will:
- Validate your .env configuration
- Build Docker containers
- Start all services
- Perform health checks
- Show deployment status

### Step 5: Access Your Application
Open your browser and navigate to:
```
http://YOUR_DROPLET_IP:3001
```

### Production Management Commands

#### Service Management
```bash
# Check service status
systemctl status whatsapp-scheduler

# Start/stop/restart service
sudo systemctl start whatsapp-scheduler
sudo systemctl stop whatsapp-scheduler
sudo systemctl restart whatsapp-scheduler

# View service logs
sudo journalctl -u whatsapp-scheduler -f
```

#### Container Management
```bash
# View running containers
docker-compose ps

# View logs
docker-compose logs -f

# Restart specific service
docker-compose restart whatsapp-scheduler
docker-compose restart whatsapp-scheduler-worker

# Update application (after git pull)
docker-compose up -d --build
```

#### Monitoring Commands
```bash
# Run monitoring script
./monitor.sh

# Check system resources
htop
df -h
free -m

# View application logs
tail -f logs/app.log
tail -f logs/scheduler.log
```

#### Backup and Maintenance
```bash
# Backup data
tar -czf backup-$(date +%Y%m%d).tar.gz data/ logs/ .env

# Update system packages
sudo apt update && sudo apt upgrade -y

# Clean up Docker
docker system prune -a
```

### SSL Configuration (Optional)
To secure your application with HTTPS:

1. **Install Certbot**:
```bash
sudo apt install certbot nginx
```

2. **Configure Nginx** (create `/etc/nginx/sites-available/whatsapp-scheduler`):
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

3. **Get SSL Certificate**:
```bash
sudo ln -s /etc/nginx/sites-available/whatsapp-scheduler /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
sudo certbot --nginx -d your-domain.com
```

### Troubleshooting

#### Common Issues
```bash
# Service won't start
sudo journalctl -u whatsapp-scheduler --no-pager

# Container health check failing
docker-compose logs whatsapp-scheduler

# Port 3001 already in use
sudo lsof -ti:3001
sudo kill -9 $(sudo lsof -ti:3001)

# Out of disk space
df -h
docker system prune -a
```

#### Recovery Commands
```bash
# Complete system restart
sudo systemctl stop whatsapp-scheduler
docker-compose down
docker system prune -f
./deploy.sh

# Restore from backup
tar -xzf backup-YYYYMMDD.tar.gz
./deploy.sh
```

### Performance Optimization

For high-volume deployments:

1. **Increase Resources**: Upgrade to larger droplet
2. **Optimize Concurrency**: Adjust `CONCURRENCY` in `.env`
3. **Database Migration**: Consider PostgreSQL for large datasets
4. **Load Balancing**: Use multiple droplets with load balancer

Your WhatsApp Scheduler is now deployed and running in production! 🚀

## 📞 Support

- **Issues**: Report at https://github.com/GoodEd/whatsapp-scheduler/issues
- **Documentation**: Check this README for comprehensive guides
- **API Reference**: Visit http://YOUR_IP:3001 for interactive API docs

Your complete WhatsApp scheduling system is now ready for production use! 🎉