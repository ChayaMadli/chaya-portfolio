import React from 'react';

export function ChatMessage({ message }) {
  const isUser = message.role === 'user';
  const isThinking = message.status === 'thinking';
  const isError = message.status === 'error';

  return (
    <div className={`message-wrapper ${isUser ? 'user-wrapper' : 'assistant-wrapper'}`}>
      <div className={`avatar ${isUser ? 'user-avatar' : 'assistant-avatar'}`}>
        {isUser ? 'You' : 'AI'}
      </div>
      <div className={`message-bubble ${isUser ? 'user-bubble' : 'assistant-bubble'} ${isError ? 'error-bubble' : ''}`}>
        <div className="message-header">
          <span className="sender-name">{isUser ? 'You' : 'Chaya AI Assistant'}</span>
        </div>

        <div className="message-content">
          {isThinking ? (
            <div className="thinking-indicator" aria-label="Thinking...">
              <span className="dot"></span>
              <span className="dot"></span>
              <span className="dot"></span>
            </div>
          ) : (
            <div className="text-content">
              {message.content}
              {message.status === 'streaming' && <span className="cursor-blink">▌</span>}
            </div>
          )}
        </div>

        {isError && message.errorMessage && (
          <div className="error-notice">
            ⚠️ {message.errorMessage}
          </div>
        )}
      </div>
    </div>
  );
}
