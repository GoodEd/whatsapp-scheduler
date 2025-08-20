import axios from 'axios';

const WHAPI_TOKEN = process.env.WHAPI_TOKEN;
const BASE_URL = 'https://gate.whapi.cloud';

async function getProfile() {
  try {
    console.log('Fetching WhatsApp profile and chats...\n');
    
    // Get profile information
    const profileResponse = await axios.get(`${BASE_URL}/me?token=${WHAPI_TOKEN}`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    if (profileResponse.status === 200) {
      const profile = profileResponse.data;
      
      console.log('👤 WhatsApp Profile Information:');
      console.log('─'.repeat(50));
      console.log(`Name: ${profile.name || 'Not set'}`);
      console.log(`Phone: ${profile.wid || profile.id || 'Not available'}`);
      console.log(`Status: ${profile.status || 'Not set'}`);
      console.log(`Picture: ${profile.picture ? 'Available' : 'Not set'}`);
      console.log(`Business: ${profile.business_profile ? 'Yes' : 'No'}`);
      
      if (profile.business_profile) {
        console.log(`Business Name: ${profile.business_profile.business_name || 'Not set'}`);
        console.log(`Category: ${profile.business_profile.category || 'Not set'}`);
      }
    }

    // Get chats list
    console.log('\n💬 Getting available chats...');
    const chatsResponse = await axios.get(`${BASE_URL}/chats?token=${WHAPI_TOKEN}&count=20`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    if (chatsResponse.status === 200) {
      const chats = chatsResponse.data.chats || chatsResponse.data;
      
      console.log('\n📱 Available Chats:');
      console.log('─'.repeat(70));
      console.log('Type'.padEnd(8) + 'ID'.padEnd(25) + 'Name');
      console.log('─'.repeat(70));
      
      chats.slice(0, 10).forEach(chat => {
        const type = chat.id.includes('@g.us') ? 'Group' : 'Contact';
        const id = chat.id.padEnd(25);
        const name = (chat.name || chat.contact?.name || 'Unknown').substring(0, 30);
        console.log(`${type.padEnd(8)}${id}${name}`);
      });
      
      if (chats.length > 10) {
        console.log(`\n... and ${chats.length - 10} more chats`);
      }
      
      console.log(`\nTotal chats found: ${chats.length}`);
    }

  } catch (error) {
    console.error('❌ Error fetching profile/chats:');
    
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
  getProfile();
}

export { getProfile };