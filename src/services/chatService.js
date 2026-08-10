/**
 * Client service for consuming the streaming Gemini AI chat endpoint (/api/chat).
 *
 * The service supports:
 * - Normal text streaming
 * - Tool input streaming
 * - Tool input available
 * - Tool output available
 * - Tool output error
 * - Abort/Stop handling
 */

export async function streamChatMessage({
  messages,
  onToken,
  onToolEvent,
  onError,
  onComplete,
  signal,
}) {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages }),
      signal,
    });

    if (!response.ok) {
      let errorMessage = `Server error (${response.status})`;

      try {
        const errorData = await response.json();

        if (errorData.error) {
          errorMessage = errorData.error;
        }
      } catch (e) {
        // Keep the HTTP status message as the fallback.
      }

      throw new Error(errorMessage);
    }

    if (!response.body) {
      throw new Error(
        'ReadableStream not supported in this browser.'
      );
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');

    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      buffer += decoder.decode(value, {
        stream: true,
      });

      const lines = buffer.split('\n');

      // Keep an incomplete line for the next chunk.
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();

        if (
          !trimmed ||
          !trimmed.startsWith('data: ')
        ) {
          continue;
        }

        const dataStr = trimmed.slice(6);

        // Stream completion.
        if (dataStr === '[DONE]') {
          if (onComplete) {
            onComplete();
          }

          return;
        }

        try {
          const parsed = JSON.parse(dataStr);

          // ---------------------------------------------
          // Normal AI text
          // ---------------------------------------------

          if (parsed.type === 'text') {
            if (parsed.text && onToken) {
              onToken(parsed.text);
            }

            continue;
          }

          // ---------------------------------------------
          // Tool lifecycle events
          // ---------------------------------------------

          if (
            parsed.type === 'tool-input-streaming' ||
            parsed.type === 'tool-input-available' ||
            parsed.type === 'tool-output-available' ||
            parsed.type === 'tool-output-error'
          ) {
            if (onToolEvent) {
              onToolEvent({
                type: parsed.type,
                toolName: parsed.toolName,
                input: parsed.input,
                output: parsed.output,
                error: parsed.error,
              });
            }

            continue;
          }

          // ---------------------------------------------
          // General stream error
          // ---------------------------------------------

          if (parsed.type === 'error' || parsed.error) {
            if (onError) {
              onError(
                parsed.error ||
                  'An error occurred while generating the response.'
              );
            }

            return;
          }

          // ---------------------------------------------
          // Backward compatibility
          // ---------------------------------------------

          // If an older server event sends { text: "..." }
          // instead of { type: "text", text: "..." }.
          if (parsed.text && onToken) {
            onToken(parsed.text);
          }
        } catch (e) {
          console.warn(
            'Failed to parse SSE data chunk:',
            dataStr
          );
        }
      }
    }

    if (onComplete) {
      onComplete();
    }
  } catch (err) {
    // User clicked Stop.
    if (err.name === 'AbortError') {
      if (onComplete) {
        onComplete();
      }

      return;
    }

    console.error('Chat stream error:', err);

    if (onError) {
      onError(
        err.message ||
          'An unexpected network error occurred.'
      );
    }
  }
}