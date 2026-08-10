import React, { useRef, useEffect, useState } from 'react';
import { ChatMessage } from './ChatMessage';
import { EmptyState } from './EmptyState';
import { ToolState } from './ToolState';

export function ChatMessageList({
  messages,
  onSelectPrompt,
  toolState,
}) {
  const containerRef = useRef(null);
  const isNearBottomRef = useRef(true);
  const [showJumpToBottom, setShowJumpToBottom] = useState(false);

  // Monitor scroll position.
  const handleScroll = () => {
    const el = containerRef.current;

    if (!el) return;

    const distanceFromBottom =
      el.scrollHeight -
      el.scrollTop -
      el.clientHeight;

    const isNear = distanceFromBottom < 100;

    isNearBottomRef.current = isNear;
    setShowJumpToBottom(!isNear);
  };

  // Auto-scroll when messages or tool state updates,
  // but only if the user is already near the bottom.
  useEffect(() => {
    if (
      isNearBottomRef.current &&
      containerRef.current
    ) {
      containerRef.current.scrollTop =
        containerRef.current.scrollHeight;
    }
  }, [messages, toolState]);

  const scrollToBottom = () => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: 'smooth',
      });

      isNearBottomRef.current = true;
      setShowJumpToBottom(false);
    }
  };

  // Show the normal empty state only when there
  // are no messages AND no active tool state.
  if (messages.length === 0 && !toolState) {
    return (
      <div className="chat-messages-container empty">
        <EmptyState onSelectPrompt={onSelectPrompt} />
      </div>
    );
  }

  return (
    <div
      className="chat-messages-container"
      ref={containerRef}
      onScroll={handleScroll}
    >
      <div className="messages-inner">
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message}
          />
        ))}

        {/* FE-07: render the current tool lifecycle state */}
        {toolState && (
          <ToolState toolState={toolState} />
        )}
      </div>

      {showJumpToBottom && (
        <button
          type="button"
          className="jump-to-latest"
          onClick={scrollToBottom}
          aria-label="Jump to latest message"
        >
          ↓ Jump to latest
        </button>
      )}
    </div>
  );
}