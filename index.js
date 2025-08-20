import cron from 'node-cron';
import PQueue from 'p-queue';
import { loadSchedule, saveSchedule } from './csvUtils.js';
import { sendMessage } from './whapi.js';

const WHAPI_TOKEN = process.env.WHAPI_TOKEN;
const CSV_PATH = process.env.CSV_PATH;
const CONCURRENCY = parseInt(process.env.CONCURRENCY) || 15;

if (!WHAPI_TOKEN) {
  console.error('WHAPI_TOKEN environment variable is required');
  process.exit(1);
}

if (!CSV_PATH) {
  console.error('CSV_PATH environment variable is required');
  process.exit(1);
}

const queue = new PQueue({ concurrency: CONCURRENCY });
let isProcessing = false;

async function processSchedule() {
  if (isProcessing) {
    return; // Skip if already processing
  }
  
  try {
    isProcessing = true;
    const currentTime = Math.floor(Date.now() / 1000);
    const istTime = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    
    const records = await loadSchedule(CSV_PATH);
    
    const dueMessages = records.filter(record => {
      const sendTime = parseInt(record.send_at);
      const isDue = sendTime <= currentTime && record.sent !== 'true';
      if (isDue) {
        console.log(`[${istTime} IST] Message due: ${record.type} to ${record.group_id} (epoch: ${sendTime})`);
      }
      return isDue;
    });
    
    if (dueMessages.length === 0) {
      return; // No logging when no messages
    }
    
    console.log(`[${istTime} IST] Found ${dueMessages.length} message(s) ready to send`);
    
    const results = await Promise.allSettled(
      dueMessages.map(record => 
        queue.add(() => sendMessage(record))
      )
    );
    
    const sentRecords = [];
    
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
        sentRecords.push(record);
      } else {
        const error = result.status === 'rejected' ? result.reason : result.value.error;
        console.log(`[${timestamp}] ${record.group_id} ${record.type} failed ${error}`);
        record.sent = 'false';
        record.status = 'failed';
        record.message_id = '';
        record.error_details = typeof error === 'string' ? error : JSON.stringify(error);
        record.sent_at = timestamp;
        sentRecords.push(record);
      }
    });
    
    // Only save if we actually processed messages
    if (sentRecords.length > 0) {
      // Save immediately for instant feedback
      await saveSchedule(CSV_PATH, records);
      console.log(`[${istTime} IST] Updated ${sentRecords.length} record(s) in CSV`);
    }
    
  } catch (error) {
    const istTime = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    console.error(`[${istTime} IST] Error processing schedule:`, error);
  } finally {
    isProcessing = false;
  }
}

// Function to immediately process due messages
async function processDueMessagesNow() {
  await processSchedule();
}

const startTime = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
console.log(`[${startTime} IST] WhatsApp Scheduler started`);
console.log(`[${startTime} IST] CSV Path: ${CSV_PATH}`);
console.log(`[${startTime} IST] Concurrency: ${CONCURRENCY}`);

// Check every 1 second for immediate processing
cron.schedule('*/1 * * * * *', processSchedule);

// Export the immediate processing function
export { processDueMessagesNow };