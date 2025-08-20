import axios from 'axios';

const WHAPI_TOKEN = process.env.WHAPI_TOKEN;
const BASE_URL = 'https://gate.whapi.cloud';

async function getChannelStatus() {
  try {
    console.log('Fetching Whapi.Cloud channel status...\n');
    
    // Get channel status
    const statusResponse = await axios.get(`${BASE_URL}/status?token=${WHAPI_TOKEN}`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    if (statusResponse.status === 200) {
      const status = statusResponse.data;
      
      console.log('📊 Channel Status:');
      console.log('─'.repeat(50));
      console.log(`Status: ${status.status || 'Unknown'}`);
      console.log(`Account: ${status.account_status || 'Unknown'}`);
      console.log(`Connected: ${status.connected ? 'Yes' : 'No'}`);
      console.log(`Phone: ${status.phone || 'Not available'}`);
      console.log(`Name: ${status.name || 'Not set'}`);
      console.log(`Profile Picture: ${status.avatar ? 'Available' : 'Not set'}`);
      
      if (status.device) {
        console.log('\n📱 Device Info:');
        console.log(`Platform: ${status.device.platform || 'Unknown'}`);
        console.log(`Version: ${status.device.version || 'Unknown'}`);
      }
      
      console.log('\n📊 Full Response:');
      console.log(JSON.stringify(status, null, 2));
    }

    // Try to get groups
    console.log('\n\n🔍 Fetching groups...');
    try {
      const groupsResponse = await axios.get(`${BASE_URL}/groups?token=${WHAPI_TOKEN}`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      if (groupsResponse.status === 200) {
        const groups = groupsResponse.data.groups || groupsResponse.data;
        
        console.log('\n👥 Available Groups:');
        console.log('─'.repeat(70));
        console.log('Group ID'.padEnd(30) + 'Name');
        console.log('─'.repeat(70));
        
        if (Array.isArray(groups)) {
          groups.slice(0, 10).forEach(group => {
            const id = group.id.replace('@g.us', '').padEnd(30);
            const name = (group.name || group.subject || 'Unnamed Group').substring(0, 35);
            console.log(`${id}${name}`);
          });
          
          if (groups.length > 10) {
            console.log(`\n... and ${groups.length - 10} more groups`);
          }
          
          console.log(`\nTotal groups: ${groups.length}`);
        } else {
          console.log('No groups found or unexpected response format');
        }
      }
    } catch (groupError) {
      console.log('Groups endpoint not accessible or no groups available');
      if (groupError.response) {
        console.log(`Status: ${groupError.response.status}`);
      }
    }

    // Try to get contacts
    console.log('\n\n👥 Fetching contacts...');
    try {
      const contactsResponse = await axios.get(`${BASE_URL}/contacts?token=${WHAPI_TOKEN}&count=10`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      if (contactsResponse.status === 200) {
        const contacts = contactsResponse.data.contacts || contactsResponse.data;
        
        console.log('\n📞 Sample Contacts:');
        console.log('─'.repeat(70));
        console.log('Contact ID'.padEnd(25) + 'Name');
        console.log('─'.repeat(70));
        
        if (Array.isArray(contacts)) {
          contacts.slice(0, 5).forEach(contact => {
            const id = contact.id.replace('@c.us', '').padEnd(25);
            const name = (contact.name || contact.pushname || 'No Name').substring(0, 40);
            console.log(`${id}${name}`);
          });
          
          console.log(`\nShowing 5 of ${contacts.length} contacts`);
        } else {
          console.log('No contacts found or unexpected response format');
        }
      }
    } catch (contactError) {
      console.log('Contacts endpoint not accessible');
      if (contactError.response) {
        console.log(`Status: ${contactError.response.status}`);
      }
    }

  } catch (error) {
    console.error('❌ Error fetching channel status:');
    
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
  getChannelStatus();
}

export { getChannelStatus };