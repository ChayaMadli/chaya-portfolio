import React from 'react';

export function ChatMessage({ message, onRetry }) {
  const isUser = message.role === 'user';
  const isThinking = message.status === 'thinking';
  const isError = message.status === 'error';

  const handleRetry = () => {
    if (
      onRetry &&
      message.id &&
      !isUser &&
      isError
    ) {
      onRetry(message.id);
    }
  };

  return (
    <div
      className={`message-wrapper ${
        isUser
          ? 'user-wrapper'
          : 'assistant-wrapper'
      }`}
    >
      <div
        className={`avatar ${
          isUser
            ? 'user-avatar'
            : 'assistant-avatar'
        }`}
      >
        {isUser ? 'You' : 'AI'}
      </div>

      <div
        className={`message-bubble ${
          isUser
            ? 'user-bubble'
            : 'assistant-bubble'
        } ${isError ? 'error-bubble' : ''}`}
      >
        <div className="message-header">
          <span className="sender-name">
            {isUser
              ? 'You'
              : 'Chaya AI Assistant'}
          </span>
        </div>

        <div className="message-content">
          {isThinking ? (
            <div
              className="thinking-indicator"
              aria-label="Generating response"
            >
              <span className="dot"></span>
              <span className="dot"></span>
              <span className="dot"></span>
            </div>
          ) : (
            <div className="text-content">
              {message.content}

              {message.status === 'streaming' && (
                <span className="cursor-blink">
                  ▌
                </span>
              )}
            </div>
          )}
        </div>

        {isError && (
          <div className="error-recovery">
            <div className="error-notice">
              <span
                className="error-icon"
                aria-hidden="true"
              >
                ⚠
              </span>

              <div>
                <strong>
                  Response interrupted
                </strong>

                <p>
                  {message.errorMessage ||
                    'Something went wrong while generating this response.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              className="retry-button"
              onClick={handleRetry}
              aria-label="Retry this failed response"
            >
              ↻ Retry
            </button>
          </div>
        )}
      </div>
    </div>
  );
}