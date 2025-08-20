import axios from 'axios';

const WHAPI_TOKEN = process.env.WHAPI_TOKEN || '9LId9ZUKfkduvHSCi7BObvig5VjGfZi9';
const BASE_URL = 'https://gate.whapi.cloud';

async function getChannels() {
  try {
    console.log('Fetching channels from Whapi.Cloud...\n');
    
    const response = await axios.get(`${BASE_URL}/settings`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${WHAPI_TOKEN}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    if (response.status === 200) {
      const data = response.data;
      
      console.log('✅ Successfully retrieved channel information:\n');
      console.log('📱 Channel Details:');
      console.log('─'.repeat(50));
      
      if (data.profile) {
        console.log(`Name: ${data.profile.name || 'Not set'}`);
        console.log(`Phone: ${data.profile.wid || 'Not available'}`);
        console.log(`Status: ${data.profile.status || 'Not set'}`);
        console.log(`Picture: ${data.profile.picture ? 'Available' : 'Not set'}`);
        console.log(`Business: ${data.profile.business ? 'Yes' : 'No'}`);
      }
      
      if (data.webhook) {
        console.log('\n🔗 Webhook Settings:');
        console.log(`URL: ${data.webhook.url || 'Not configured'}`);
        console.log(`Events: ${data.webhook.events ? data.webhook.events.join(', ') : 'None'}`);
        console.log(`Active: ${data.webhook.active ? 'Yes' : 'No'}`);
      }
      
      if (data.settings) {
        console.log('\n⚙️  Channel Settings:');
        console.log(`Media Upload: ${data.settings.media_upload ? 'Enabled' : 'Disabled'}`);
        console.log(`Auto Reply: ${data.settings.auto_reply ? 'Enabled' : 'Disabled'}`);
        console.log(`Typing Indicator: ${data.settings.typing_indicator ? 'Enabled' : 'Disabled'}`);
        console.log(`Read Receipts: ${data.settings.read_receipts ? 'Enabled' : 'Disabled'}`);
      }
      
      console.log('\n📊 Raw Response:');
      console.log(JSON.stringify(data, null, 2));
      
    } else {
      console.error(`❌ Failed to fetch channels. Status: ${response.status}`);
      console.error('Response:', response.data);
    }
    
  } catch (error) {
    console.error('❌ Error fetching channels:');
    
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Error: ${JSON.stringify(error.response.data, null, 2)}`);
    } else if (error.request) {
      console.error('Network error - no response received');
      console.error(error.message);
    } else {
      console.error('Request setup error:', error.message);
    }
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  getChannels();
}

export { getChannels };