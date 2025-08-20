import axios from 'axios';
import fetch from 'node-fetch';

const MAX_RETRIES = 2;
const INITIAL_DELAY = 1000;

async function checkHealth() {
  try {
    const token = process.env.WHAPI_TOKEN;
    const response = await fetch('https://gate.whapi.cloud/health?wakeup=true&channel_type=web', {
      method: 'GET',
      headers: {
        accept: 'application/json',
        authorization: `Bearer ${token}`
      }
    });
    
    return response.ok;
  } catch (error) {
    console.error('Health check failed:', error.message);
    return false;
  }
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function makeRequest(url, payload, retryCount = 0) {
  try {
    const token = process.env.WHAPI_TOKEN;
    const response = await axios.post(url, payload, {
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'authorization': `Bearer ${token}`
      },
      timeout: 10000
    });
    
    return {
      success: true,
      status: response.status,
      data: response.data,
      messageId: response.data?.message?.id || response.data?.id || response.data?.messageId
    };
  } catch (error) {
    const status = error.response?.status || 0;
    const errorData = error.response?.data || error.message;
    
    if (retryCount < MAX_RETRIES) {
      const delay = INITIAL_DELAY * Math.pow(2, retryCount);
      await sleep(delay);
      return makeRequest(url, payload, retryCount + 1);
    }
    
    return {
      success: false,
      status,
      error: errorData
    };
  }
}

function formatRecipient(group_id) {
  // If it's already a WhatsApp ID, return as is
  if (group_id.includes('@')) {
    return group_id;
  }
  
  // If it's a long number (likely a group), append @g.us
  if (group_id.length > 15) {
    return `${group_id}@g.us`;
  }
  
  // If it's a phone number, append @s.whatsapp.net
  return `${group_id}@s.whatsapp.net`;
}

export async function sendMessage(record) {
  const { type, group_id, body, poll_options, image_url } = record;
  
  switch (type) {
    case 'text': {
      const url = `https://gate.whapi.cloud/messages/text`;
      const payload = {
        to: formatRecipient(group_id),
        body: body
      };
      return await makeRequest(url, payload);
    }
    
    case 'poll': {
      const url = `https://gate.whapi.cloud/messages/poll`;
      const options = poll_options ? poll_options.split(';').map(opt => opt.trim()) : [];
      const payload = {
        to: formatRecipient(group_id),
        title: body,
        options: options
      };
      
      // Use fetch instead of axios for polls as specified
      try {
        const token = process.env.WHAPI_TOKEN;
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            accept: 'application/json',
            'content-type': 'application/json',
            authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
        
        const data = await response.json();
        
        return {
          success: response.ok,
          status: response.status,
          data: data,
          messageId: data?.message?.id || data?.id || data?.messageId
        };
      } catch (error) {
        return {
          success: false,
          status: 0,
          error: error.message
        };
      }
    }
    
    case 'dp': {
      const url = `https://gate.whapi.cloud/groups/${group_id}/picture`;
      const payload = {
        url: image_url
      };
      return await makeRequest(url, payload);
    }
    
    default:
      return { success: false, error: `Unknown message type: ${type}` };
  }
}