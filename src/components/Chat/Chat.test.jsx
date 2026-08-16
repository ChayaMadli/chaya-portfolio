import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatContainer } from './ChatContainer';
import { ChatInput } from './ChatInput';
import { ChatMessage } from './ChatMessage';
import { ToolState } from './ToolState';

describe('Chat message rendering', () => {
  it('renders a user message with its sender label', () => {
    render(
      <ChatMessage
        message={{
          id: 'user-1',
          role: 'user',
          content: 'Hello from the user',
          status: 'complete',
        }}
      />
    );

    expect(screen.getByText('Hello from the user')).not.toBeNull();
    expect(screen.getAllByText('You').length).toBeGreaterThan(0);
  });

  it('renders the assistant thinking state', () => {
    render(
      <ChatMessage
        message={{
          id: 'assistant-1',
          role: 'assistant',
          content: '',
          status: 'thinking',
        }}
      />
    );

    expect(screen.getByLabelText('Thinking...')).not.toBeNull();
    expect(screen.getByText('Chaya AI Assistant')).not.toBeNull();
  });

  it('renders streaming text with a blinking cursor', () => {
    render(
      <ChatMessage
        message={{
          id: 'assistant-2',
          role: 'assistant',
          content: 'Streaming response',
          status: 'streaming',
        }}
      />
    );

    expect(screen.getByText(/Streaming response/i)).not.toBeNull();
    expect(screen.getByText('▌')).not.toBeNull();
  });

  it('renders an error state with the visible error message', () => {
    render(
      <ChatMessage
        message={{
          id: 'assistant-3',
          role: 'assistant',
          content: '',
          status: 'error',
          errorMessage: 'The AI service failed to respond.',
        }}
      />
    );

    expect(screen.getByText(/The AI service failed to respond\./i)).not.toBeNull();
  });
});

describe('Chat input validation', () => {
  it('prevents empty submissions and trims the message before sending', async () => {
    const user = userEvent.setup();
    const onSendMessage = vi.fn();

    render(
      <ChatInput
        onSendMessage={onSendMessage}
        onStop={vi.fn()}
        isGenerating={false}
      />
    );

    const textbox = screen.getByRole('textbox', { name: /message input/i });
    const sendButton = screen.getByRole('button', { name: /send message/i });

    expect(sendButton.disabled).toBe(true);

    await user.type(textbox, '   hello from the form   ');
    await user.click(sendButton);

    expect(onSendMessage).toHaveBeenCalledWith('hello from the form');
    expect(textbox.value).toBe('');
  });
});

describe('Tool state rendering', () => {
  it('renders a successful project result card', () => {
    render(
      <ToolState
        toolState={{
          type: 'tool-output-available',
          output: {
            name: 'Wearable IoT-Based Soldier Health and Safety Monitoring System',
            category: 'IoT / Embedded Systems',
            technologies: ['ESP32', 'React', 'Node.js'],
            description: 'A wearable monitoring system for soldiers.',
            role: 'Full-stack engineer',
          },
        }}
      />
    );

    expect(screen.getByText('PROJECT RESULT')).not.toBeNull();
    expect(
      screen.getByRole('heading', {
        name: 'Wearable IoT-Based Soldier Health and Safety Monitoring System',
      })
    ).not.toBeNull();
    expect(screen.getByText('IoT / Embedded Systems')).not.toBeNull();
    expect(screen.getByText('A wearable monitoring system for soldiers.')).not.toBeNull();
    expect(screen.getByText('Full-stack engineer')).not.toBeNull();
  });

  it('renders a tool error state when project lookup fails', () => {
    render(
      <ToolState
        toolState={{
          type: 'tool-output-error',
          error: 'The project lookup failed.',
        }}
      />
    );

    expect(screen.getByText('Project lookup failed')).not.toBeNull();
    expect(screen.getByText('The project lookup failed.')).not.toBeNull();
  });
});

describe('Chat container workflow', () => {
  it('sending a message triggers the user flow and eventually renders the assistant response', async () => {
    const user = userEvent.setup();

    const stream = new ReadableStream({
      start(controller) {
        setTimeout(() => {
          controller.enqueue(
            new TextEncoder().encode('data: {"type":"text","text":"Hello there"}\n\n')
          );
          setTimeout(() => {
            controller.enqueue(
              new TextEncoder().encode('data: [DONE]\n\n')
            );
            controller.close();
          }, 15);
        }, 25);
      },
    });

    global.fetch = vi.fn().mockResolvedValue(
      new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream; charset=utf-8',
        },
      })
    );

    render(<ChatContainer />);

    const textbox = screen.getByRole('textbox', { name: /message input/i });
    await user.type(textbox, 'Tell me about this project');
    await user.click(screen.getByRole('button', { name: /send message/i }));

    expect(screen.getByText('Tell me about this project')).not.toBeNull();

    await waitFor(() => {
      expect(screen.getByText('Hello there')).toBeTruthy();
    }, { timeout: 2000 });
  });
});
