import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 10000;
const ai = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;
const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

const MOOD_PROMPTS = {
  assistant: "Tumhara naam Ragni hai. Tum ek smart aur helpful AI assistant ho.",
  friendly: "Tum Ragni ho, ek energetic aur chill dost ki tarah baat karo.",
  gf_mode: "Tum Ragni ho, user ki sweet aur romantic girlfriend ki tarah baat karo."
};

app.get('/', (req, res) => {
  res.send('Ragni AI Backend is Running!');
});

app.post('/api/chat', async (req, res) => {
  try {
    const { message, model, mood } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const systemPrompt = MOOD_PROMPTS[mood] || MOOD_PROMPTS.assistant;

    if (model === 'gemini') {
      if (!ai) return res.status(500).json({ error: 'GEMINI_API_KEY missing' });
      const geminiModel = ai.getGenerativeModel({ 
        model: 'gemini-1.5-flash',
        systemInstruction: systemPrompt 
      });
      const result = await geminiModel.generateContent(message);
      return res.json({ reply: result.response.text() });
    }

    if (model === 'groq') {
      if (!groq) return res.status(500).json({ error: 'GROQ_API_KEY missing' });
      const completion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        model: 'llama-3.1-8b-instant',
      });
      return res.json({ reply: completion.choices[0]?.message?.content || '' });
    }

    return res.status(400).json({ error: 'Invalid model' });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message || 'Server Error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
