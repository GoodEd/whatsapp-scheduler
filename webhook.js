import express from 'express';

const app = express();
const PORT = process.env.WEBHOOK_PORT || 3000;

app.use(express.json());

app.post('/webhook', (req, res) => {
  const timestamp = new Date().toISOString();
  const body = req.body;
  
  try {
    if (body.messages && body.messages.sent) {
      console.log(`[${timestamp}] WEBHOOK: messages.sent - ${JSON.stringify(body.messages.sent)}`);
    }
    
    if (body.messages && body.messages.failed) {
      console.log(`[${timestamp}] WEBHOOK: messages.failed - ${JSON.stringify(body.messages.failed)}`);
    }
    
    if (body.pictures && body.pictures.set) {
      console.log(`[${timestamp}] WEBHOOK: pictures.set - ${JSON.stringify(body.pictures.set)}`);
    }
    
    if (body.poll && body.poll.vote) {
      console.log(`[${timestamp}] WEBHOOK: poll.vote - ${JSON.stringify(body.poll.vote)}`);
    }
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error(`[${timestamp}] WEBHOOK: Error - ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`[${new Date().toISOString()}] Webhook server on port ${PORT}`);
});