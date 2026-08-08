import React, { useState, useRef, useEffect } from 'react';

export function ChatInput({ onSendMessage, onStop, isGenerating }) {
  const [input, setInput] = useState('');
  const textareaRef = useRef(null);

  // Auto-resize textarea height as user types
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [input]);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isGenerating) return;

    onSendMessage(trimmed);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e) => {
    // Enter sends message, Shift+Enter creates newline
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="chat-input-area">
      <form onSubmit={handleSubmit} className="input-form">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask Chaya's AI assistant a question..."
          rows={1}
          disabled={isGenerating}
          aria-label="Message input"
        />

        <div className="input-actions">
          {isGenerating ? (
            <button
              type="button"
              className="btn btn-stop"
              onClick={onStop}
              aria-label="Stop generating response"
            >
              <span className="stop-icon">■</span> Stop
            </button>
          ) : (
            <button
              type="submit"
              className="btn btn-send"
              disabled={!input.trim()}
              aria-label="Send message"
            >
              <span>Send</span> ➔
            </button>
          )}
        </div>
      </form>
      <div className="input-footer-note">
        Press Enter to send, Shift+Enter for new line.
      </div>
    </div>
  );
}
