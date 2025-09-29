import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { handleChat } from './services/chatService.js';
import { connectMongo } from './services/mongoService.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

await connectMongo();

app.post('/chat', async (req, res) => {
  try {
    const userMessage = req.body.message;
    if (!userMessage) return res.status(400).json({ error: 'Message is required' });

    const response = await handleChat(userMessage);
    res.json({ response });
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = process.env.CHATBOTPORT|| 3008;
app.listen(PORT, () => {
  console.log(`🤖 Chatbot Server running at http://localhost:${PORT} ✅`);
});

