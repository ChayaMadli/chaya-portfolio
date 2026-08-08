import { GoogleGenAI } from '@google/genai';
import { AI_CONFIG } from '../src/config/aiConfig.js';

// Helper to send JSON responses consistently across Node HTTP and Vercel Serverless environments
function sendJson(res, statusCode, data) {
  if (typeof res.status === 'function' && typeof res.json === 'function') {
    return res.status(statusCode).json(data);
  }
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return sendJson(res, 405, { error: 'Method Not Allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === '' || apiKey === 'your_gemini_api_key_here') {
    return sendJson(res, 500, {
      error: 'GEMINI_API_KEY is not configured. Please add GEMINI_API_KEY to your server environment or local .env file.'
    });
  }

  try {
    const { messages } = req.body || {};

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return sendJson(res, 400, { error: 'Messages array is required' });
    }

    // Format conversation history for Gemini API (roles: 'user' and 'model')
    const formattedContents = messages.map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content || '' }]
    }));

    // Initialize Google GenAI client
    const ai = new GoogleGenAI({ apiKey });

    // Request stream from Gemini model
    const responseStream = await ai.models.generateContentStream({
      model: AI_CONFIG.model,
      contents: formattedContents,
      config: {
        systemInstruction: AI_CONFIG.systemInstruction,
        temperature: AI_CONFIG.temperature,
        maxOutputTokens: AI_CONFIG.maxOutputTokens
      }
    });

    // Set Server-Sent Events (SSE) headers
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    // Stream text chunks to client
    for await (const chunk of responseStream) {
      if (chunk.text) {
        res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
        if (typeof res.flush === 'function') res.flush();
      }
    }

    // Signal stream completion
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    console.error('Gemini API Error:', err);
    if (!res.headersSent) {
      return sendJson(res, 500, {
        error: err.message || 'An error occurred while communicating with the Gemini API.'
      });
    } else {
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      res.end();
    }
  }
}
