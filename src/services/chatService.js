/**
 * Client service for consuming the streaming Gemini AI chat endpoint (/api/chat).
 */

export async function streamChatMessage({ messages, onToken, onError, onComplete, signal }) {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ messages }),
      signal
    });

    if (!response.ok) {
      let errorMessage = `Server error (${response.status})`;
      try {
        const errorData = await response.json();
        if (errorData.error) {
          errorMessage = errorData.error;
        }
      } catch (e) {
        // Fallback to HTTP status error text if non-JSON error
      }
      throw new Error(errorMessage);
    }

    if (!response.body) {
      throw new Error('ReadableStream not supported in this browser.');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep partial line in buffer

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;

        const dataStr = trimmed.slice(6);
        if (dataStr === '[DONE]') {
          if (onComplete) onComplete();
          return;
        }

        try {
          const parsed = JSON.parse(dataStr);
          if (parsed.error) {
            if (onError) onError(parsed.error);
            return;
          }
          if (parsed.text && onToken) {
            onToken(parsed.text);
          }
        } catch (e) {
          console.warn('Failed to parse SSE data chunk:', dataStr);
        }
      }
    }

    if (onComplete) onComplete();
  } catch (err) {
    if (err.name === 'AbortError') {
      // User clicked Stop - handle abort gracefully
      if (onComplete) onComplete();
      return;
    }
    console.error('Chat stream error:', err);
    if (onError) onError(err.message || 'An unexpected network error occurred.');
  }
}
