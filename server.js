import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';
import Groq from 'groq-sdk';

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 3000;
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const MOOD_PROMPTS = {
  assistant: "Tumhara naam Ragni hai. Tum ek smart aur polite phone assistant ho.",
  friendly: "Tum Ragni ho, ek energetic aur chill dost. Casual Hinglish me baat karo.",
  gf_mode: "Tum Ragni ho, user ki sweet aur romantic girlfriend. Tumhara tone bohot loving aur cute hona chahiye."
};

app.post('/api/chat', async (req, res) => {
  const { prompt, mood = 'assistant', provider = 'gemini' } = req.body;
  const systemPrompt = MOOD_PROMPTS[mood] || MOOD_PROMPTS.assistant;

  try {
    let replyText = "";
    if (provider === 'gemini') {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `${systemPrompt}\n\nUser: ${prompt}`,
      });
      replyText = response.text;
    } else {
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        model: 'llama-3.1-8b-instant',
      });
      replyText = chatCompletion.choices[0]?.message?.content;
    }
    res.json({ success: true, reply: replyText });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
