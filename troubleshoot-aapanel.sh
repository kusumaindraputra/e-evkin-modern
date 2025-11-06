#!/bin/bash

# aaPanel Access Troubleshooting Script
echo "🔧 aaPanel Access Troubleshooting"
echo "================================="

echo "🔍 Checking aaPanel status..."

# Check if aaPanel is running
if systemctl is-active --quiet bt; then
    echo "✅ aaPanel service is running"
else
    echo "❌ aaPanel service is not running"
    echo "🚀 Starting aaPanel..."
    systemctl start bt
    sleep 3
    if systemctl is-active --quiet bt; then
        echo "✅ aaPanel started successfully"
    else
        echo "❌ Failed to start aaPanel"
    fi
fi

echo ""
echo "🔍 Checking aaPanel port..."

# Check if port 8888 is listening
if netstat -tlnp | grep -q ":8888"; then
    echo "✅ Port 8888 is listening"
    netstat -tlnp | grep ":8888"
else
    echo "❌ Port 8888 is not listening"
    echo "🔧 Checking aaPanel configuration..."
fi

echo ""
echo "🔍 Checking firewall..."

# Check UFW status
if command -v ufw >/dev/null 2>&1; then
    echo "UFW Status:"
    ufw status
    
    # Check if 8888 is allowed
    if ufw status | grep -q "8888"; then
        echo "✅ Port 8888 is allowed in UFW"
    else
        echo "❌ Port 8888 is not allowed in UFW"
        echo "🔧 Adding UFW rule..."
        ufw allow 8888/tcp
        echo "✅ Port 8888 added to UFW"
    fi
fi

# Check iptables
echo ""
echo "🔍 Checking iptables..."
if iptables -L | grep -q "8888"; then
    echo "✅ Port 8888 found in iptables"
else
    echo "⚠️  Port 8888 not explicitly found in iptables"
fi

echo ""
echo "🔍 Checking aaPanel processes..."
ps aux | grep -E "(python|bt\.py)" | grep -v grep

echo ""
echo "🔧 aaPanel Status Commands:"
echo "=========================="

# Get aaPanel status
echo "📊 aaPanel detailed status:"
/etc/init.d/bt status 2>/dev/null || systemctl status bt

echo ""
echo "🔧 aaPanel useful commands:"
echo "- Check status: systemctl status bt"
echo "- Start: systemctl start bt"
echo "- Restart: systemctl restart bt"
echo "- Check logs: journalctl -u bt -f"

echo ""
echo "🔍 aaPanel configuration check:"
if [ -f "/www/server/panel/data/port.pl" ]; then
    echo "Current aaPanel port: $(cat /www/server/panel/data/port.pl)"
fi

if [ -f "/www/server/panel/data/domain.conf" ]; then
    echo "Domain restrictions: $(cat /www/server/panel/data/domain.conf 2>/dev/null || echo 'None')"
fi

echo ""
echo "🌐 Network accessibility test:"
echo "=============================="

# Test internal access
echo "🔍 Testing internal access..."
if curl -s --connect-timeout 5 http://127.0.0.1:8888 >/dev/null; then
    echo "✅ aaPanel responds on localhost"
else
    echo "❌ aaPanel does not respond on localhost"
fi

# Test external interface
echo "🔍 Testing external access..."
if curl -s --connect-timeout 5 http://103.197.189.168:8888 >/dev/null; then
    echo "✅ aaPanel responds on external IP"
else
    echo "❌ aaPanel does not respond on external IP"
fi

echo ""
echo "🔧 Quick fixes to try:"
echo "====================="
echo ""
echo "1. Restart aaPanel:"
echo "   systemctl restart bt"
echo ""
echo "2. Check if port is blocked by cloud provider:"
echo "   - Login to your VPS control panel"
echo "   - Check security groups/firewall rules"
echo "   - Allow port 8888 (TCP)"
echo ""
echo "3. Reset aaPanel password:"
echo "   bt 5"
echo ""
echo "4. Change aaPanel port (if 8888 is blocked):"
echo "   bt 8"
echo ""
echo "5. Check aaPanel entrance (security feature):"
echo "   bt 6"
echo ""
echo "6. Show aaPanel info:"
echo "   bt 1"

echo ""
echo "🆘 Emergency access alternatives:"
echo "================================"
echo ""
echo "If aaPanel web interface is not accessible:"
echo ""
echo "1. Command line management:"
echo "   - bt 1    # Show panel info"
echo "   - bt 5    # Reset password"
echo "   - bt 6    # Set entrance"
echo "   - bt 8    # Change port"
echo "   - bt 14   # Show panel status"
echo ""
echo "2. Direct file management:"
echo "   - Files: /www/wwwroot/"
echo "   - Logs: /www/wwwlogs/"
echo "   - Database: Access via command line"
echo ""
echo "3. Alternative ports to try:"
echo "   - http://103.197.189.168:7800"
echo "   - http://103.197.189.168:8080"
echo "   - http://103.197.189.168:888"

# Final status summary
echo ""
echo "📋 Summary:"
echo "==========="
echo "Server IP: 103.197.189.168"
echo "aaPanel URL should be: http://103.197.189.168:8888"
echo ""
if systemctl is-active --quiet bt && netstat -tlnp | grep -q ":8888"; then
    echo "✅ aaPanel appears to be running correctly"
    echo "🔍 Issue likely: Cloud provider firewall or security groups"
    echo "💡 Solution: Check your VPS provider's firewall settings"
else
    echo "❌ aaPanel has issues on the server side"
    echo "💡 Solution: Run 'systemctl restart bt' and check logs"
fi