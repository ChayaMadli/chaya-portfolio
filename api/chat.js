import { GoogleGenAI } from '@google/genai';
import { AI_CONFIG } from '../src/config/aiConfig.js';
import {
  executeProjectTool,
  projectToolDeclaration,
} from '../src/tools/projectTool.js';

// Helper to send JSON responses consistently across Node HTTP and Vercel.
function sendJson(res, statusCode, data) {
  if (
    typeof res.status === 'function' &&
    typeof res.json === 'function'
  ) {
    return res.status(statusCode).json(data);
  }

  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

// Send a typed SSE event to the frontend.
function sendEvent(res, type, payload = {}) {
  res.write(
    `data: ${JSON.stringify({
      type,
      ...payload,
    })}\n\n`
  );

  if (typeof res.flush === 'function') {
    res.flush();
  }
}

export default async function handler(req, res) {
  // Only allow POST requests.
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return sendJson(res, 405, {
      error: 'Method Not Allowed',
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (
    !apiKey ||
    apiKey.trim() === '' ||
    apiKey === 'your_gemini_api_key_here'
  ) {
    return sendJson(res, 500, {
      error:
        'GEMINI_API_KEY is not configured. Please add GEMINI_API_KEY to your server environment or local .env file.',
    });
  }

  try {
    const { messages } = req.body || {};

    if (
      !messages ||
      !Array.isArray(messages) ||
      messages.length === 0
    ) {
      return sendJson(res, 400, {
        error: 'Messages array is required',
      });
    }

    // Format conversation history for Gemini.
    const formattedContents = messages.map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content || '' }],
    }));

    const ai = new GoogleGenAI({
      apiKey,
    });

    // SSE headers.
    res.setHeader(
      'Content-Type',
      'text/event-stream; charset=utf-8'
    );
    res.setHeader(
      'Cache-Control',
      'no-cache, no-transform'
    );
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    // ---------------------------------------------------------
    // FIRST MODEL TURN
    // ---------------------------------------------------------

    const responseStream =
      await ai.models.generateContentStream({
        model: AI_CONFIG.model,
        contents: formattedContents,
        config: {
          systemInstruction: AI_CONFIG.systemInstruction,
          temperature: AI_CONFIG.temperature,
          maxOutputTokens: AI_CONFIG.maxOutputTokens,

          tools: [
            {
              functionDeclarations: [
                projectToolDeclaration,
              ],
            },
          ],
        },
      });

    let functionCall = null;
    let modelResponseContent = null;

    // Read the first streamed response.
    for await (const chunk of responseStream) {
      // Preserve normal text streaming.
      if (chunk.text) {
        sendEvent(res, 'text', {
          text: chunk.text,
        });
      }

      // Detect Gemini function calls.
      const parts =
        chunk?.candidates?.[0]?.content?.parts || [];

      for (const part of parts) {
        if (part.functionCall) {
          functionCall = part.functionCall;

          // Preserve the model content for the follow-up turn.
          modelResponseContent =
            chunk.candidates[0].content;

          break;
        }
      }
    }

    // ---------------------------------------------------------
    // NO TOOL CALL
    // ---------------------------------------------------------

    if (!functionCall) {
      sendEvent(res, 'done');
      res.end();
      return;
    }

    // ---------------------------------------------------------
    // TOOL INPUT STREAMING
    // ---------------------------------------------------------

    sendEvent(res, 'tool-input-streaming', {
      toolName: 'getProjectDetails',
    });

    // ---------------------------------------------------------
    // TOOL INPUT AVAILABLE
    // ---------------------------------------------------------

    const toolInput = functionCall.args || {};

    sendEvent(res, 'tool-input-available', {
      toolName: 'getProjectDetails',
      input: toolInput,
    });

    // ---------------------------------------------------------
    // EXECUTE SERVER-SIDE TOOL
    // ---------------------------------------------------------

    let toolResult;

    try {
      toolResult = await executeProjectTool(toolInput);

      // -------------------------------------------------------
      // TOOL OUTPUT AVAILABLE
      // -------------------------------------------------------

      sendEvent(res, 'tool-output-available', {
        toolName: 'getProjectDetails',
        output: toolResult,
      });
    } catch (toolError) {
      // -------------------------------------------------------
      // TOOL OUTPUT ERROR
      // -------------------------------------------------------

      sendEvent(res, 'tool-output-error', {
        toolName: 'getProjectDetails',
        error:
          toolError.message ||
          'The project lookup failed.',
      });

      sendEvent(res, 'done');
      res.end();
      return;
    }

    // ---------------------------------------------------------
    // FOLLOW-UP MODEL TURN
    // Give Gemini the tool result so it can produce a final
    // user-facing response.
    // ---------------------------------------------------------

    if (modelResponseContent && functionCall) {
      const followUpContents = [
        ...formattedContents,
        modelResponseContent,
        {
          role: 'user',
          parts: [
            {
              functionResponse: {
                name: functionCall.name,
                response: {
                  result: toolResult,
                },
                ...(functionCall.id
                  ? { id: functionCall.id }
                  : {}),
              },
            },
          ],
        },
      ];

      const finalStream =
        await ai.models.generateContentStream({
          model: AI_CONFIG.model,
          contents: followUpContents,
          config: {
            systemInstruction:
              AI_CONFIG.systemInstruction,
            temperature: AI_CONFIG.temperature,
            maxOutputTokens:
              AI_CONFIG.maxOutputTokens,
          },
        });

      for await (const chunk of finalStream) {
        if (chunk.text) {
          sendEvent(res, 'text', {
            text: chunk.text,
          });
        }
      }
    }

    // Complete.
    sendEvent(res, 'done');
    res.end();
  } catch (err) {
    console.error('Gemini API Error:', err);

    if (!res.headersSent) {
      return sendJson(res, 500, {
        error:
          err.message ||
          'An error occurred while communicating with the Gemini API.',
      });
    }

    sendEvent(res, 'error', {
      error:
        err.message ||
        'An error occurred while communicating with the Gemini API.',
    });

    res.end();
  }
}