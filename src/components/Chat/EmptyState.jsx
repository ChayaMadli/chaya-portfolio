import React from 'react';

const SUGGESTED_PROMPTS = [
  "What are Chaya's key technical skills and expertise?",
  "Tell me about Chaya's experience with React and Vite.",
  "What types of web projects has Chaya built?",
  "How can I get in touch with Chaya for an opportunity?"
];

export function EmptyState({ onSelectPrompt }) {
  return (
    <div className="empty-state">
      <div className="empty-state-avatar">CM</div>
      <h2>Chaya Madli — AI Assistant</h2>
      <p>
        Welcome! Ask me anything about Chaya's web development experience, technical skills, project portfolio, or career background.
      </p>
      <div className="suggested-prompts">
        <span className="prompts-label">Try asking:</span>
        <div className="prompts-grid">
          {SUGGESTED_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              className="prompt-chip"
              onClick={() => onSelectPrompt(prompt)}
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
