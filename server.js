import express from 'express';
import cors from 'cors';
import axios from 'axios';
import fetch from 'node-fetch';
import { loadSchedule, saveSchedule } from './csvUtils.js';
import { loadSubgroups, createSubgroup, updateSubgroup, deleteSubgroup, getSubgroupGroups } from './subgroupUtils.js';
import { sendMessage } from './whapi.js';
import { readFile } from 'fs/promises';
import path from 'path';
import PQueue from 'p-queue';

const app = express();
const PORT = process.env.SERVER_PORT || 3001;
const WHAPI_TOKEN = process.env.WHAPI_TOKEN;
const CSV_PATH = process.env.CSV_PATH || './schedule.csv';
const BASE_URL = 'https://gate.whapi.cloud';

// Check for required environment variables
if (!WHAPI_TOKEN) {
  console.error('❌ ERROR: WHAPI_TOKEN environment variable is required');
  console.error('📝 Please copy .env.example to .env and add your token');
  process.exit(1);
}

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST';
  console.log(`[${timestamp}] ${req.method} ${req.path}`, req.body ? JSON.stringify(req.body) : '');
  next();
});

// Serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const response = await fetch('https://gate.whapi.cloud/health?wakeup=true&channel_type=web', {
      method: 'GET',
      headers: {
        accept: 'application/json',
        authorization: `Bearer ${WHAPI_TOKEN}`
      }
    });
    
    const data = await response.json();
    
    res.json({
      success: response.ok,
      status: response.status,
      data: data
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to check health',
      details: error.message 
    });
  }
});

// Get channel information
app.get('/api/channel-info', async (req, res) => {
  try {
    const response = await axios.get(`${BASE_URL}/settings`, {
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'authorization': `Bearer ${WHAPI_TOKEN}`
      },
      timeout: 10000
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch channel info',
      details: error.response?.data || error.message 
    });
  }
});

// Get groups
app.get('/api/groups', async (req, res) => {
  try {
    const response = await axios.get(`${BASE_URL}/groups`, {
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'authorization': `Bearer ${WHAPI_TOKEN}`
      },
      params: {
        count: 50
      },
      timeout: 15000
    });
    
    const groups = response.data.groups || response.data || [];
    const formattedGroups = groups.map(group => ({
      id: group.id.replace('@g.us', ''),
      name: group.name || group.subject || 'Unnamed Group',
      participants: group.participants?.length || 0,
      description: group.description || '',
      created_at: group.created_at || null
    }));
    
    res.json({ groups: formattedGroups });
  } catch (error) {
    console.error('Error fetching groups:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to fetch groups',
      details: error.response?.data || error.message 
    });
  }
});

// Get contacts
app.get('/api/contacts', async (req, res) => {
  try {
    const response = await axios.get(`${BASE_URL}/contacts`, {
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'authorization': `Bearer ${WHAPI_TOKEN}`
      },
      params: {
        count: 100
      },
      timeout: 15000
    });
    
    const contacts = response.data.contacts || response.data || [];
    const formattedContacts = contacts.map(contact => ({
      id: contact.id.replace('@c.us', ''),
      name: contact.name || contact.pushname || contact.notify || 'Unknown',
      phone: contact.id.replace('@c.us', ''),
      is_business: contact.is_business || false,
      status: contact.status || ''
    }));
    
    res.json({ contacts: formattedContacts });
  } catch (error) {
    console.error('Error fetching contacts:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to fetch contacts',
      details: error.response?.data || error.message 
    });
  }
});

// Get current schedule
app.get('/api/schedule', async (req, res) => {
  try {
    const records = await loadSchedule(CSV_PATH);
    
    // Add runtime status information
    const enrichedRecords = records.map(record => {
      const currentTime = Math.floor(Date.now() / 1000);
      const sendTime = parseInt(record.send_at);
      
      let runtimeStatus = 'pending';
      if (record.sent === 'true' && record.status === 'success') {
        runtimeStatus = 'sent_successfully';
      } else if (record.sent === 'false' && record.status === 'failed') {
        runtimeStatus = 'failed';
      } else if (sendTime <= currentTime && record.sent !== 'true') {
        runtimeStatus = 'processing';
      } else if (sendTime > currentTime) {
        runtimeStatus = 'scheduled';
      }
      
      return {
        ...record,
        runtime_status: runtimeStatus,
        scheduled_time: new Date(sendTime * 1000).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST',
        time_until_send: sendTime > currentTime ? sendTime - currentTime : 0
      };
    });
    
    res.json({ schedule: enrichedRecords });
  } catch (error) {
    console.error('Error loading schedule:', error);
    res.status(500).json({ 
      error: 'Failed to load schedule',
      details: error.message 
    });
  }
});

// Add new scheduled item
app.post('/api/schedule', async (req, res) => {
  try {
    const { type, group_id, body, poll_options, image_url, send_at } = req.body;
    
    // Validation
    if (!type || !group_id || !send_at) {
      return res.status(400).json({ 
        error: 'Missing required fields: type, group_id, send_at' 
      });
    }
    
    if (type === 'poll' && (!body || !poll_options)) {
      return res.status(400).json({ 
        error: 'Poll type requires body (question) and poll_options' 
      });
    }
    
    if (type === 'text' && !body) {
      return res.status(400).json({ 
        error: 'Text type requires body' 
      });
    }
    
    if (type === 'dp' && !image_url) {
      return res.status(400).json({ 
        error: 'DP type requires image_url' 
      });
    }
    
    // Load existing schedule
    const records = await loadSchedule(CSV_PATH);
    
    // Create new record
    const newRecord = {
      type,
      group_id,
      body: body || '',
      poll_options: poll_options || '',
      image_url: image_url || '',
      send_at: parseInt(send_at),
      sent: false,
      status: 'pending',
      message_id: '',
      error_details: '',
      sent_at: ''
    };
    
    // Add to records
    records.push(newRecord);
    
    // Save updated schedule
    await saveSchedule(CSV_PATH, records);
    
    res.json({ 
      success: true, 
      message: 'Schedule item added successfully',
      item: newRecord
    });
    
  } catch (error) {
    console.error('Error adding schedule item:', error);
    res.status(500).json({ 
      error: 'Failed to add schedule item',
      details: error.message 
    });
  }
});

// Edit scheduled item
app.put('/api/schedule/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { type, group_id, body, poll_options, image_url, send_at } = req.body;
    
    // Validation
    if (!type || !group_id || !send_at) {
      return res.status(400).json({ 
        error: 'Missing required fields: type, group_id, send_at' 
      });
    }
    
    const records = await loadSchedule(CSV_PATH);
    
    // Find and update the record
    let found = false;
    const updatedRecords = records.map((record, index) => {
      const recordId = `${record.type}_${record.group_id}_${record.send_at}_${index}`;
      if (recordId === id) {
        found = true;
        // Only allow editing if message hasn't been sent yet
        if (record.sent === 'true') {
          throw new Error('Cannot edit message that has already been sent');
        }
        
        return {
          ...record,
          type,
          group_id,
          body,
          poll_options: poll_options || '',
          image_url: image_url || '',
          send_at,
          // Reset status when editing
          status: 'pending',
          error_details: '',
          message_id: '',
          sent_at: ''
        };
      }
      return record;
    });
    
    if (!found) {
      return res.status(404).json({ error: 'Schedule item not found' });
    }
    
    await saveSchedule(CSV_PATH, updatedRecords);
    
    res.json({ 
      success: true, 
      message: 'Schedule item updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating schedule:', error.message);
    res.status(500).json({ 
      error: error.message || 'Failed to update schedule item',
      details: error.message 
    });
  }
});

// Delete scheduled item
app.delete('/api/schedule/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const records = await loadSchedule(CSV_PATH);
    
    // Find and remove the record
    const initialLength = records.length;
    const filteredRecords = records.filter((record, index) => {
      const recordId = `${record.type}_${record.group_id}_${record.send_at}_${index}`;
      return recordId !== id;
    });
    
    if (filteredRecords.length === initialLength) {
      return res.status(404).json({ error: 'Schedule item not found' });
    }
    
    await saveSchedule(CSV_PATH, filteredRecords);
    
    res.json({ 
      success: true, 
      message: 'Schedule item deleted successfully' 
    });
    
  } catch (error) {
    console.error('Error deleting schedule item:', error);
    res.status(500).json({ 
      error: 'Failed to delete schedule item',
      details: error.message 
    });
  }
});

// Test message endpoint
app.post('/api/test-message', async (req, res) => {
  try {
    const { to, message } = req.body;
    
    if (!to || !message) {
      return res.status(400).json({ error: 'Missing required fields: to, message' });
    }
    
    // Use the same sendMessage function as scheduled messages
    const record = {
      type: 'text',
      group_id: to,
      body: message
    };
    
    const result = await sendMessage(record);
    
    if (result.success) {
      res.json({ 
        success: true, 
        message: 'Test message sent successfully',
        messageId: result.messageId,
        response: result.data
      });
    } else {
      res.status(500).json({ 
        error: 'Failed to send test message',
        details: result.error 
      });
    }
    
  } catch (error) {
    console.error('Error sending test message:', error);
    res.status(500).json({ 
      error: 'Failed to send test message',
      details: error.message 
    });
  }
});

// Send message immediately (Schedule Now)
app.post('/api/send-now', async (req, res) => {
  try {
    const { type, group_id, body, poll_options, image_url } = req.body;
    
    // Validation
    if (!type || !group_id) {
      return res.status(400).json({ 
        error: 'Missing required fields: type, group_id' 
      });
    }
    
    // Use the same sendMessage function as scheduled messages
    const record = {
      type,
      group_id,
      body: body || '',
      poll_options: poll_options || '',
      image_url: image_url || ''
    };
    
    const result = await sendMessage(record);
    
    if (result.success) {
      res.json({ 
        success: true, 
        message: `${type} message sent immediately`,
        messageId: result.messageId,
        response: result.data
      });
    } else {
      res.status(500).json({ 
        error: 'Failed to send immediate message',
        details: result.error 
      });
    }
    
  } catch (error) {
    console.error('Error sending immediate message:', error);
    res.status(500).json({ 
      error: 'Failed to send immediate message',
      details: error.message 
    });
  }
});

// Get message statistics
app.get('/api/stats', async (req, res) => {
  try {
    const records = await loadSchedule(CSV_PATH);
    const currentTime = Math.floor(Date.now() / 1000);
    
    const stats = {
      total: records.length,
      sent_successfully: 0,
      failed: 0,
      scheduled: 0,
      processing: 0,
      pending: 0,
      recent_failures: []
    };
    
    records.forEach(record => {
      const sendTime = parseInt(record.send_at);
      
      if (record.sent === 'true' && record.status === 'success') {
        stats.sent_successfully++;
      } else if (record.sent === 'false' && record.status === 'failed') {
        stats.failed++;
        if (record.error_details) {
          stats.recent_failures.push({
            group_id: record.group_id,
            type: record.type,
            error: record.error_details,
            failed_at: record.sent_at
          });
        }
      } else if (sendTime <= currentTime && record.sent !== 'true') {
        stats.processing++;
      } else if (sendTime > currentTime) {
        stats.scheduled++;
      } else {
        stats.pending++;
      }
    });
    
    // Keep only the 10 most recent failures
    stats.recent_failures = stats.recent_failures.slice(-10);
    
    res.json(stats);
  } catch (error) {
    console.error('Error loading stats:', error);
    res.status(500).json({ 
      error: 'Failed to load statistics',
      details: error.message 
    });
  }
});

// Get all subgroups
app.get('/api/subgroups', async (req, res) => {
  try {
    const subgroups = await loadSubgroups();
    res.json({ subgroups });
  } catch (error) {
    console.error('Error loading subgroups:', error);
    res.status(500).json({ 
      error: 'Failed to load subgroups',
      details: error.message 
    });
  }
});

// Create new subgroup
app.post('/api/subgroups', async (req, res) => {
  try {
    const { name, description, group_ids } = req.body;
    
    if (!name || !Array.isArray(group_ids) || group_ids.length === 0) {
      return res.status(400).json({ 
        error: 'Missing required fields: name and group_ids (array)' 
      });
    }
    
    const subgroup = await createSubgroup(name, description, group_ids);
    res.json({ 
      success: true, 
      message: 'Subgroup created successfully',
      subgroup 
    });
  } catch (error) {
    console.error('Error creating subgroup:', error);
    res.status(500).json({ 
      error: 'Failed to create subgroup',
      details: error.message 
    });
  }
});

// Update subgroup
app.put('/api/subgroups/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const subgroup = await updateSubgroup(id, updates);
    res.json({ 
      success: true, 
      message: 'Subgroup updated successfully',
      subgroup 
    });
  } catch (error) {
    console.error('Error updating subgroup:', error);
    const status = error.message === 'Subgroup not found' ? 404 : 500;
    res.status(status).json({ 
      error: 'Failed to update subgroup',
      details: error.message 
    });
  }
});

// Delete subgroup
app.delete('/api/subgroups/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await deleteSubgroup(id);
    res.json({ 
      success: true, 
      message: 'Subgroup deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting subgroup:', error);
    const status = error.message === 'Subgroup not found' ? 404 : 500;
    res.status(status).json({ 
      error: 'Failed to delete subgroup',
      details: error.message 
    });
  }
});

// Direct message processing function
async function processMessagesNow() {
  const CONCURRENCY = 15;
  const queue = new PQueue({ concurrency: CONCURRENCY });
  
  try {
    const currentTime = Math.floor(Date.now() / 1000);
    const istTime = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    
    const records = await loadSchedule(CSV_PATH);
    
    const dueMessages = records.filter(record => {
      const sendTime = parseInt(record.send_at);
      return sendTime <= currentTime && record.sent !== 'true';
    });
    
    if (dueMessages.length === 0) {
      return { processed: 0, message: 'No messages due for sending' };
    }
    
    console.log(`[${istTime} IST] Processing ${dueMessages.length} due messages immediately`);
    
    const results = await Promise.allSettled(
      dueMessages.map(record => 
        queue.add(() => sendMessage(record))
      )
    );
    
    let successCount = 0;
    
    results.forEach((result, index) => {
      const record = dueMessages[index];
      const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST';
      
      if (result.status === 'fulfilled' && result.value.success) {
        console.log(`[${timestamp}] ${record.group_id} ${record.type} 200 ${result.value.messageId || 'success'}`);
        record.sent = 'true';
        record.status = 'success';
        record.message_id = result.value.messageId || '';
        record.error_details = '';
        record.sent_at = timestamp;
        successCount++;
      } else {
        const error = result.status === 'rejected' ? result.reason : result.value.error;
        console.log(`[${timestamp}] ${record.group_id} ${record.type} failed ${error}`);
        record.sent = 'false';
        record.status = 'failed';
        record.message_id = '';
        record.error_details = typeof error === 'string' ? error : JSON.stringify(error);
        record.sent_at = timestamp;
      }
    });
    
    await saveSchedule(CSV_PATH, records);
    console.log(`[${istTime} IST] Processed ${dueMessages.length} messages, ${successCount} successful`);
    
    return { processed: dueMessages.length, successful: successCount };
  } catch (error) {
    console.error('Error in direct message processing:', error);
    throw error;
  }
}

// Trigger immediate processing of due messages
app.post('/api/process-now', async (req, res) => {
  try {
    const result = await processMessagesNow();
    
    res.json({ 
      success: true, 
      message: 'Processing triggered successfully',
      ...result
    });
  } catch (error) {
    console.error('Error triggering immediate processing:', error);
    res.status(500).json({ 
      error: 'Failed to trigger processing',
      details: error.message 
    });
  }
});

// Send message to subgroup with rate limiting and optional immediate sending
app.post('/api/subgroups/:id/send', async (req, res) => {
  try {
    const { id } = req.params;
    const { type, body, poll_options, image_url, send_at, send_immediately, rate_limit_delay } = req.body;
    
    if (!type || !send_at) {
      return res.status(400).json({ 
        error: 'Missing required fields: type, send_at' 
      });
    }
    
    const groupIds = await getSubgroupGroups(id);
    const records = await loadSchedule(CSV_PATH);
    const newRecords = [];
    
    // Rate limiting: delay between messages (default 2 seconds)
    const delayBetweenMessages = parseInt(rate_limit_delay) || 2000; // milliseconds
    
    // Create scheduled message for each group in the subgroup with rate limiting
    for (let i = 0; i < groupIds.length; i++) {
      const groupId = groupIds[i];
      let effectiveSendAt;
      
      if (send_immediately) {
        // For immediate sending, add progressive delay to avoid overwhelming API
        effectiveSendAt = Math.floor(Date.now() / 1000) + Math.floor((i * delayBetweenMessages) / 1000);
      } else {
        // For scheduled sending, add progressive delay from the base time
        effectiveSendAt = parseInt(send_at) + Math.floor((i * delayBetweenMessages) / 1000);
      }
      
      const newRecord = {
        type,
        group_id: groupId,
        body: body || '',
        poll_options: poll_options || '',
        image_url: image_url || '',
        send_at: effectiveSendAt,
        sent: false,
        status: 'pending',
        message_id: '',
        error_details: '',
        sent_at: '',
        subgroup_id: id // Track which subgroup this message belongs to
      };
      
      records.push(newRecord);
      newRecords.push(newRecord);
    }
    
    await saveSchedule(CSV_PATH, records);
    
    // If immediate sending requested, trigger processing
    if (send_immediately) {
      try {
        setImmediate(() => processMessagesNow());
      } catch (error) {
        console.error('Error triggering immediate processing:', error);
      }
    }
    
    res.json({ 
      success: true, 
      message: `Message scheduled for ${groupIds.length} groups in subgroup with ${delayBetweenMessages}ms delay between messages`,
      scheduled_count: groupIds.length,
      rate_limit_delay: delayBetweenMessages,
      records: newRecords
    });
  } catch (error) {
    console.error('Error scheduling subgroup message:', error);
    const status = error.message === 'Subgroup not found' ? 404 : 500;
    res.status(status).json({ 
      error: 'Failed to schedule subgroup message',
      details: error.message 
    });
  }
});

// Get failed messages
app.get('/api/failed-messages', async (req, res) => {
  try {
    const records = await loadSchedule(CSV_PATH);
    
    const failedMessages = records.filter(record => 
      record.sent === 'false' && record.status === 'failed'
    ).map(record => ({
      ...record,
      scheduled_time: new Date(parseInt(record.send_at) * 1000).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST'
    }));
    
    res.json({ 
      failed_messages: failedMessages,
      count: failedMessages.length
    });
  } catch (error) {
    console.error('Error loading failed messages:', error);
    res.status(500).json({ 
      error: 'Failed to load failed messages',
      details: error.message 
    });
  }
});

// Resend failed messages with rate limiting
app.post('/api/resend-failed', async (req, res) => {
  try {
    const { message_indices, rate_limit_delay } = req.body;
    
    if (!Array.isArray(message_indices) || message_indices.length === 0) {
      return res.status(400).json({ 
        error: 'Missing or invalid message_indices array' 
      });
    }
    
    const records = await loadSchedule(CSV_PATH);
    const failedMessages = records.filter(record => 
      record.sent === 'false' && record.status === 'failed'
    );
    
    if (failedMessages.length === 0) {
      return res.status(404).json({ 
        error: 'No failed messages found' 
      });
    }
    
    // Rate limiting: delay between resend messages (default 3 seconds for resends)
    const delayBetweenMessages = parseInt(rate_limit_delay) || 3000; // milliseconds
    const currentTime = Math.floor(Date.now() / 1000);
    let resendCount = 0;
    
    // Process each specified message index
    for (let i = 0; i < message_indices.length; i++) {
      const messageIndex = message_indices[i];
      
      if (messageIndex >= 0 && messageIndex < failedMessages.length) {
        const failedMessage = failedMessages[messageIndex];
        
        // Find the original record in the main records array
        const originalIndex = records.findIndex(record => 
          record.group_id === failedMessage.group_id &&
          record.send_at === failedMessage.send_at &&
          record.type === failedMessage.type &&
          record.sent === 'false' &&
          record.status === 'failed'
        );
        
        if (originalIndex !== -1) {
          // Update the record for resending with progressive delay
          records[originalIndex].send_at = currentTime + Math.floor((i * delayBetweenMessages) / 1000);
          records[originalIndex].sent = 'false';
          records[originalIndex].status = 'pending';
          records[originalIndex].error_details = '';
          records[originalIndex].sent_at = '';
          resendCount++;
        }
      }
    }
    
    if (resendCount > 0) {
      await saveSchedule(CSV_PATH, records);
      
      // Trigger immediate processing
      try {
        setImmediate(() => processMessagesNow());
      } catch (error) {
        console.error('Error triggering immediate processing for resend:', error);
      }
    }
    
    res.json({ 
      success: true, 
      message: `${resendCount} failed messages rescheduled for resending with ${delayBetweenMessages}ms delay`,
      resend_count: resendCount,
      rate_limit_delay: delayBetweenMessages
    });
    
  } catch (error) {
    console.error('Error resending failed messages:', error);
    res.status(500).json({ 
      error: 'Failed to resend messages',
      details: error.message 
    });
  }
});

// Resend all failed messages for a specific subgroup
app.post('/api/subgroups/:id/resend-failed', async (req, res) => {
  try {
    const { id } = req.params;
    const { rate_limit_delay } = req.body;
    
    const records = await loadSchedule(CSV_PATH);
    
    // Find all failed messages for this subgroup
    const failedMessages = records.filter(record => 
      record.subgroup_id === id &&
      record.sent === 'false' && 
      record.status === 'failed'
    );
    
    if (failedMessages.length === 0) {
      return res.status(404).json({ 
        error: 'No failed messages found for this subgroup' 
      });
    }
    
    // Rate limiting: delay between resend messages (default 3 seconds for resends)
    const delayBetweenMessages = parseInt(rate_limit_delay) || 3000; // milliseconds
    const currentTime = Math.floor(Date.now() / 1000);
    let resendCount = 0;
    
    // Update each failed message for resending
    for (let i = 0; i < failedMessages.length; i++) {
      const failedMessage = failedMessages[i];
      
      // Find the original record in the main records array
      const originalIndex = records.findIndex(record => 
        record === failedMessage
      );
      
      if (originalIndex !== -1) {
        // Update the record for resending with progressive delay
        records[originalIndex].send_at = currentTime + Math.floor((i * delayBetweenMessages) / 1000);
        records[originalIndex].sent = 'false';
        records[originalIndex].status = 'pending';
        records[originalIndex].error_details = '';
        records[originalIndex].sent_at = '';
        resendCount++;
      }
    }
    
    await saveSchedule(CSV_PATH, records);
    
    // Trigger immediate processing
    try {
      setImmediate(() => processMessagesNow());
    } catch (error) {
      console.error('Error triggering immediate processing for subgroup resend:', error);
    }
    
    res.json({ 
      success: true, 
      message: `${resendCount} failed messages from subgroup rescheduled for resending with ${delayBetweenMessages}ms delay`,
      resend_count: resendCount,
      rate_limit_delay: delayBetweenMessages
    });
    
  } catch (error) {
    console.error('Error resending failed subgroup messages:', error);
    res.status(500).json({ 
      error: 'Failed to resend subgroup messages',
      details: error.message 
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    details: error.message 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 WhatsApp Scheduler Web UI running on http://localhost:${PORT}`);
  console.log(`📱 Channel: ${WHAPI_TOKEN.substring(0, 8)}...`);
  console.log(`📄 CSV Path: ${CSV_PATH}`);
  console.log(`\n🌐 Open http://localhost:${PORT} in your browser to access the UI`);
});