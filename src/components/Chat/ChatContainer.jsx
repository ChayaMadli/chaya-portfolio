import React, { useRef, useState } from 'react';
import { ChatMessageList } from './ChatMessageList';
import { ChatInput } from './ChatInput';
import { streamChatMessage } from '../../services/chatService';

export function ChatContainer() {
  const [messages, setMessages] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // FE-07: current tool lifecycle state.
  const [toolState, setToolState] = useState(null);

  const abortControllerRef = useRef(null);
  const stoppedRef = useRef(false);

  /*
   * Runs one AI generation.
   *
   * This helper is shared by:
   * - normal user messages
   * - Retry actions
   */
  const runGeneration = async ({
    assistantMsgId,
    apiMessages,
  }) => {
    const controller = new AbortController();

    abortControllerRef.current = controller;
    stoppedRef.current = false;
    setIsGenerating(true);

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
        /*
         * If the user clicked Stop, handleStop already updated
         * the message. Don't overwrite that state here.
         */
        if (stoppedRef.current) {
          return;
        }

        setIsGenerating(false);
        abortControllerRef.current = null;

        setMessages((prev) =>
          prev.map((msg) => {
            if (msg.id === assistantMsgId) {
              return {
                ...msg,
                status: 'complete',
                errorMessage: null,
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
      // FE-08 ERROR
      // ---------------------------------------------

      onError: (errorMsg) => {
        if (stoppedRef.current) {
          return;
        }

        setIsGenerating(false);
        abortControllerRef.current = null;

        setMessages((prev) =>
          prev.map((msg) => {
            if (msg.id === assistantMsgId) {
              return {
                ...msg,
                status: 'error',
                errorMessage:
                  errorMsg ||
                  'Something went wrong while generating this response.',
              };
            }

            return msg;
          })
        );

        /*
         * If a tool was active when the stream failed,
         * preserve the designed FE-07 tool error state.
         */
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

  /*
   * Normal user message.
   */
  const handleSendMessage = async (text) => {
    if (isGenerating) return;

    const trimmedText = text.trim();

    if (!trimmedText) return;

    setToolState(null);

    const userMsgId = `user-${Date.now()}`;
    const assistantMsgId = `ai-${Date.now() + 1}`;

    const userMessage = {
      id: userMsgId,
      role: 'user',
      content: trimmedText,
      status: 'complete',
    };

    /*
     * The API receives the conversation history plus
     * the new user message.
     */
    const apiMessages = [...messages, userMessage].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const initialAssistantMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      status: 'thinking',

      /*
       * Store the exact request needed to retry this message.
       * This prevents Retry from duplicating the user message.
       */
      retryMessages: apiMessages,
    };

    setMessages([
      ...messages,
      userMessage,
      initialAssistantMessage,
    ]);

    await runGeneration({
      assistantMsgId,
      apiMessages,
    });
  };

  /*
   * FE-08 Retry
   *
   * Retries only the failed assistant response using the
   * original request that produced the failure.
   */
  const handleRetry = async (assistantMsgId) => {
    if (isGenerating) return;

    const failedMessage = messages.find(
      (message) => message.id === assistantMsgId
    );

    if (!failedMessage || failedMessage.status !== 'error') {
      return;
    }

    if (
      !failedMessage.retryMessages ||
      failedMessage.retryMessages.length === 0
    ) {
      return;
    }

    setToolState(null);

    /*
     * Put the same assistant message back into thinking state.
     * We don't create another user message.
     */
    setMessages((prev) =>
      prev.map((message) => {
        if (message.id === assistantMsgId) {
          return {
            ...message,
            status: 'thinking',
            content: '',
            errorMessage: null,
          };
        }

        return message;
      })
    );

    await runGeneration({
      assistantMsgId,
      apiMessages: failedMessage.retryMessages,
    });
  };

  /*
   * Stop generation.
   */
  const handleStop = () => {
    stoppedRef.current = true;

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

  /*
   * Clear the entire conversation.
   */
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
          <div className="chat-label">FE-06 / FE-07 / FE-08</div>

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
        onRetry={handleRetry}
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