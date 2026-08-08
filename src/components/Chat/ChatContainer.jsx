import React, { useState, useRef } from 'react';
import { ChatMessageList } from './ChatMessageList';
import { ChatInput } from './ChatInput';
import { streamChatMessage } from '../../services/chatService';

export function ChatContainer() {
  const [messages, setMessages] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const abortControllerRef = useRef(null);

  const handleSendMessage = async (text) => {
    if (isGenerating) return;

    const userMsgId = `user-${Date.now()}`;
    const assistantMsgId = `ai-${Date.now() + 1}`;

    const userMessage = {
      id: userMsgId,
      role: 'user',
      content: text,
      status: 'complete'
    };

    const initialAssistantMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      status: 'thinking'
    };

    // Update state with user message and thinking assistant placeholder
    const updatedMessages = [...messages, userMessage, initialAssistantMessage];
    setMessages(updatedMessages);
    setIsGenerating(true);

    // Prepare AbortController for cancel/stop functionality
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Filter messages for API payload (sending conversation history)
    const apiMessages = [...messages, userMessage].map((m) => ({
      role: m.role,
      content: m.content
    }));

    let receivedTokens = false;

    await streamChatMessage({
      messages: apiMessages,
      signal: controller.signal,
      onToken: (token) => {
        receivedTokens = true;
        setMessages((prev) =>
          prev.map((msg) => {
            if (msg.id === assistantMsgId) {
              return {
                ...msg,
                status: 'streaming',
                content: msg.content + token
              };
            }
            return msg;
          })
        );
      },
      onComplete: () => {
        setIsGenerating(false);
        abortControllerRef.current = null;
        setMessages((prev) =>
          prev.map((msg) => {
            if (msg.id === assistantMsgId) {
              return {
                ...msg,
                status: 'complete',
                // If stream completed without tokens, provide feedback
                content: msg.content || (receivedTokens ? msg.content : 'No response text received.')
              };
            }
            return msg;
          })
        );
      },
      onError: (errorMsg) => {
        setIsGenerating(false);
        abortControllerRef.current = null;
        setMessages((prev) =>
          prev.map((msg) => {
            if (msg.id === assistantMsgId) {
              return {
                ...msg,
                status: 'error',
                errorMessage: errorMsg,
                content: msg.content || ''
              };
            }
            return msg;
          })
        );
      }
    });
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.status === 'thinking' || msg.status === 'streaming') {
          return {
            ...msg,
            status: 'complete',
            content: msg.content ? `${msg.content} [Generation stopped]` : '[Generation stopped]'
          };
        }
        return msg;
      })
    );
  };

  const handleClearChat = () => {
    if (isGenerating) {
      handleStop();
    }
    setMessages([]);
  };

  return (
    <div className="chat-card">
      <header className="chat-header">
        <div className="header-info">
          <div className="header-badge">FE-06</div>
          <div className="header-text">
            <h1>Chaya Madli — AI Assistant</h1>
            <p className="subtitle">Interactive Streaming Portfolio Assistant</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            type="button"
            className="btn-clear"
            onClick={handleClearChat}
            disabled={isGenerating}
            title="Clear current chat history"
          >
            Clear Session
          </button>
        )}
      </header>

      <ChatMessageList messages={messages} onSelectPrompt={handleSendMessage} />

      <ChatInput
        onSendMessage={handleSendMessage}
        onStop={handleStop}
        isGenerating={isGenerating}
      />
    </div>
  );
}
