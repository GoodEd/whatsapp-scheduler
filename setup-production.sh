#!/bin/bash

# WhatsApp Scheduler - Production Server Setup Script for Digital Ocean
# Run this script on your Digital Ocean droplet

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Setting up WhatsApp Scheduler on Digital Ocean...${NC}"

# Update system
echo -e "${YELLOW}📦 Updating system packages...${NC}"
sudo apt update && sudo apt upgrade -y

# Install Docker
echo -e "${YELLOW}🐳 Installing Docker...${NC}"
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
echo -e "${YELLOW}🐳 Installing Docker Compose...${NC}"
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install additional tools
echo -e "${YELLOW}🛠️ Installing additional tools...${NC}"
sudo apt install -y curl wget git nano htop ufw

# Configure firewall
echo -e "${YELLOW}🔥 Configuring firewall...${NC}"
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 3001/tcp
sudo ufw --force enable

# Create app directory
echo -e "${YELLOW}📁 Creating application directory...${NC}"
sudo mkdir -p /opt/whatsapp-scheduler
sudo chown $USER:$USER /opt/whatsapp-scheduler
cd /opt/whatsapp-scheduler

# Create systemd service for auto-restart
echo -e "${YELLOW}⚙️ Creating systemd service...${NC}"
sudo tee /etc/systemd/system/whatsapp-scheduler.service > /dev/null <<EOF
[Unit]
Description=WhatsApp Scheduler Docker Compose
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/whatsapp-scheduler
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

# Enable the service
sudo systemctl enable whatsapp-scheduler.service

# Create deployment user
echo -e "${YELLOW}👤 Creating deployment user...${NC}"
sudo adduser --disabled-password --gecos "" deploy
sudo usermod -aG docker deploy

# Set up log rotation
echo -e "${YELLOW}📄 Setting up log rotation...${NC}"
sudo tee /etc/logrotate.d/whatsapp-scheduler > /dev/null <<EOF
/opt/whatsapp-scheduler/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    copytruncate
}
EOF

# Create directory structure
mkdir -p logs data

# Set up monitoring script
echo -e "${YELLOW}📊 Setting up monitoring...${NC}"
tee monitor.sh > /dev/null <<'EOF'
#!/bin/bash
# Simple monitoring script for WhatsApp Scheduler

echo "=== WhatsApp Scheduler Status ==="
echo "Date: $(date)"
echo ""

# Check if containers are running
echo "Docker Containers:"
docker-compose ps

echo ""
echo "System Resources:"
echo "CPU Usage: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F% '{print $1}')"
echo "Memory Usage: $(free -m | awk 'NR==2{printf "%.1f%% (%s/%s MB)\n", $3*100/$2, $3, $2}')"
echo "Disk Usage: $(df -h / | awk 'NR==2{printf "%s (%s used, %s available)\n", $5, $3, $4}')"

echo ""
echo "Recent Logs (last 10 lines):"
docker-compose logs --tail=10 --no-color
EOF

chmod +x monitor.sh

echo -e "${GREEN}✅ Production server setup completed!${NC}"
echo ""
echo -e "${BLUE}📋 Next steps:${NC}"
echo "1. Clone your repository: git clone https://github.com/GoodEd/whatsapp-scheduler.git ."
echo "2. Copy your .env file with WHAPI_TOKEN"
echo "3. Run: ./deploy.sh"
echo "4. Access your application at: http://YOUR_DROPLET_IP:3001"
echo ""
echo -e "${YELLOW}💡 Useful commands:${NC}"
echo "- View logs: docker-compose logs -f"
echo "- Restart services: docker-compose restart"
echo "- Monitor system: ./monitor.sh"
echo "- Check service status: systemctl status whatsapp-scheduler"

echo -e "${GREEN}🎉 Setup complete! Please reboot the server to ensure all changes take effect.${NC}"