import axios from 'axios';

const WHAPI_TOKEN = process.env.WHAPI_TOKEN;
const BASE_URL = 'https://gate.whapi.cloud';

async function getChannelInfo() {
  try {
    console.log('🔍 Fetching Whapi.Cloud Channel Information...\n');
    
    // Get health/status information
    const healthResponse = await axios.get(`${BASE_URL}/health?token=${WHAPI_TOKEN}`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    if (healthResponse.status === 200) {
      const data = healthResponse.data;
      
      console.log('📱 Channel Information:');
      console.log('═'.repeat(60));
      console.log(`📞 Channel ID: ${data.channel_id || 'Not available'}`);
      console.log(`👤 Name: ${data.user?.name || 'Not set'}`);
      console.log(`📱 Phone: ${data.user?.id || 'Not available'}`);
      console.log(`🏢 Business Account: ${data.user?.is_business ? 'Yes' : 'No'}`);
      console.log(`📊 Status: ${data.status?.text || 'Unknown'} (Code: ${data.status?.code})`);
      console.log(`⏰ Uptime: ${Math.floor(data.uptime / 3600)}h ${Math.floor((data.uptime % 3600) / 60)}m`);
      console.log(`🌐 API Version: ${data.api_version || 'Unknown'}`);
      console.log(`💻 Core Version: ${data.core_version || 'Unknown'}`);
      console.log(`🔧 Service Version: ${data.version || 'Unknown'}`);
      console.log(`🌍 IP Address: ${data.ip || 'Unknown'}`);
      
      // Status codes explanation
      const statusCodes = {
        1: 'CONNECTING',
        2: 'CONNECTED', 
        3: 'DISCONNECTED',
        4: 'AUTHENTICATED',
        5: 'LOGOUT'
      };
      
      const statusText = statusCodes[data.status?.code] || 'UNKNOWN';
      console.log(`📈 Connection Status: ${statusText}`);
    }

    // Get settings information
    console.log('\n⚙️  Channel Settings:');
    console.log('═'.repeat(60));
    
    const settingsResponse = await axios.get(`${BASE_URL}/settings`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${WHAPI_TOKEN}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    if (settingsResponse.status === 200) {
      const settings = settingsResponse.data;
      
      console.log(`🔄 Callback Persist: ${settings.callback_persist ? 'Enabled' : 'Disabled'}`);
      console.log(`📴 Offline Mode: ${settings.offline_mode ? 'Enabled' : 'Disabled'}`);
      console.log(`📜 Full History: ${settings.full_history ? 'Enabled' : 'Disabled'}`);
      
      if (settings.media) {
        console.log(`📥 Auto Download: ${settings.media.auto_download?.length ? settings.media.auto_download.join(', ') : 'None'}`);
        console.log(`🖼️  Init Avatars: ${settings.media.init_avatars ? 'Enabled' : 'Disabled'}`);
      }
      
      if (settings.proxy) {
        console.log(`🌐 Proxy: ${settings.proxy || 'Not configured'}`);
      }
      
      if (settings.webhooks && settings.webhooks.length > 0) {
        console.log('\n🔗 Webhook Configuration:');
        settings.webhooks.forEach((webhook, index) => {
          console.log(`   Webhook ${index + 1}:`);
          console.log(`   📍 URL: ${webhook.url}`);
          console.log(`   📝 Mode: ${webhook.mode}`);
          console.log(`   📋 Events: ${webhook.events?.length || 0} configured`);
          if (webhook.events && webhook.events.length > 0) {
            const eventTypes = [...new Set(webhook.events.map(e => e.type))];
            console.log(`   🎯 Types: ${eventTypes.join(', ')}`);
          }
        });
      }
    }

    // Try to get screen/QR status
    console.log('\n📱 Connection Details:');
    console.log('═'.repeat(60));
    
    try {
      const screenResponse = await axios.get(`${BASE_URL}/screen?token=${WHAPI_TOKEN}`, {
        headers: {
          'Accept': 'application/json'
        },
        timeout: 10000
      });
      
      if (screenResponse.status === 200) {
        const screen = screenResponse.data;
        console.log(`📺 Screen Status: Available`);
        console.log(`🔐 QR Code: ${screen.qr ? 'Generated' : 'Not needed'}`);
      }
    } catch (screenError) {
      if (screenError.response?.status === 403) {
        console.log(`📺 Screen Status: Already authenticated (no QR needed)`);
      } else {
        console.log(`📺 Screen Status: Not accessible`);
      }
    }

    console.log('\n✅ Channel information retrieved successfully!');
    console.log('\n💡 Usage Tips:');
    console.log('   - Use the Channel ID for API identification');
    console.log('   - Phone number format for messaging: [number]@c.us (contacts) or [number]@g.us (groups)');
    console.log('   - Check webhook configuration if you need real-time notifications');

  } catch (error) {
    console.error('❌ Error fetching channel information:');
    
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Error: ${JSON.stringify(error.response.data, null, 2)}`);
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  getChannelInfo();
}

export { getChannelInfo };