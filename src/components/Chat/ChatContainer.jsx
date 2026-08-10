import React, { useState, useRef } from 'react';
import { ChatMessageList } from './ChatMessageList';
import { ChatInput } from './ChatInput';
import { streamChatMessage } from '../../services/chatService';

export function ChatContainer() {
  const [messages, setMessages] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // FE-07: stores the current tool lifecycle state.
  const [toolState, setToolState] = useState(null);

  const abortControllerRef = useRef(null);

  const handleSendMessage = async (text) => {
    if (isGenerating) return;

    // Clear the previous tool state when a new request starts.
    setToolState(null);

    const userMsgId = `user-${Date.now()}`;
    const assistantMsgId = `ai-${Date.now() + 1}`;

    const userMessage = {
      id: userMsgId,
      role: 'user',
      content: text,
      status: 'complete',
    };

    const initialAssistantMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      status: 'thinking',
    };

    const updatedMessages = [
      ...messages,
      userMessage,
      initialAssistantMessage,
    ];

    setMessages(updatedMessages);
    setIsGenerating(true);

    // AbortController keeps the existing Stop button working.
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const apiMessages = [...messages, userMessage].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    let receivedTokens = false;

    await streamChatMessage({
      messages: apiMessages,
      signal: controller.signal,

      // ---------------------------------------------
      // NORMAL AI TEXT STREAM
      // ---------------------------------------------

      onToken: (token) => {
        receivedTokens = true;

        setMessages((prev) =>
          prev.map((msg) => {
            if (msg.id === assistantMsgId) {
              return {
                ...msg,
                status: 'streaming',
                content: msg.content + token,
              };
            }

            return msg;
          })
        );
      },

      // ---------------------------------------------
      // FE-07 TOOL LIFECYCLE
      // ---------------------------------------------

      onToolEvent: (event) => {
        console.log('[FE-07 Tool Event]', event);

        setToolState({
          type: event.type,
          toolName: event.toolName || 'getProjectDetails',
          input: event.input || null,
          output: event.output || null,
          error: event.error || null,
        });
      },

      // ---------------------------------------------
      // COMPLETE
      // ---------------------------------------------

      onComplete: () => {
        setIsGenerating(false);
        abortControllerRef.current = null;

        setMessages((prev) =>
          prev.map((msg) => {
            if (msg.id === assistantMsgId) {
              return {
                ...msg,
                status: 'complete',
                content:
                  msg.content ||
                  (receivedTokens
                    ? msg.content
                    : 'No response text received.'),
              };
            }

            return msg;
          })
        );
      },

      // ---------------------------------------------
      // GENERAL ERROR
      // ---------------------------------------------

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
                content: msg.content || '',
              };
            }

            return msg;
          })
        );

        // If a tool was running when an error occurred,
        // preserve a designed FE-07 error state.
        setToolState((current) => {
          if (
            current &&
            current.type !== 'tool-output-available'
          ) {
            return {
              ...current,
              type: 'tool-output-error',
              error: errorMsg,
            };
          }

          return current;
        });
      },
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
        if (
          msg.status === 'thinking' ||
          msg.status === 'streaming'
        ) {
          return {
            ...msg,
            status: 'complete',
            content: msg.content
              ? `${msg.content} [Generation stopped]`
              : '[Generation stopped]',
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

    setToolState(null);
    setMessages([]);
  };

  return (
    <div className="chat-container">
      <header className="chat-header">
        <div>
          <div className="chat-label">FE-06 / FE-07</div>

          <h1>Chaya Madli — AI Assistant</h1>

          <p>
            Interactive Streaming Portfolio Assistant
          </p>
        </div>

        {messages.length > 0 && (
          <button
            type="button"
            className="clear-chat-button"
            onClick={handleClearChat}
            disabled={isGenerating}
          >
            Clear Session
          </button>
        )}
      </header>

      <ChatMessageList
        messages={messages}
        onSelectPrompt={handleSendMessage}
        toolState={toolState}
      />

      <ChatInput
        onSendMessage={handleSendMessage}
        onStop={handleStop}
        isGenerating={isGenerating}
      />
    </div>
  );
}