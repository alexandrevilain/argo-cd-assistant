import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useChat } from '@ai-sdk/react';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { DefaultChatTransport, UIMessage } from 'ai';
import { Application } from '@/packages/argocd';
import styled from 'styled-components';
import { colors } from '../theme';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  background-color: ${colors.backgroundLight};
  overflow: hidden;
`;

const ErrorContainer = styled.div`
  padding: 16px 20px;
  background-color: ${colors.errorBg};
  color: ${colors.errorText};
  border-left: 4px solid ${colors.errorBorder};
  margin: 16px;
  font-size: 14px;
  border-radius: 8px;
`;

const ErrorTitle = styled.div`
  font-weight: 600;
  margin-bottom: 6px;
`;

const InputArea = styled.div`
  display: flex;
  gap: 8px;
  align-items: flex-end;
  padding: 16px 20px;
  background-color: ${colors.backgroundWhite};
  border-top: 1px solid ${colors.borderLight};
`;

const IconButton = styled.button<{ disabled?: boolean; hasContent?: boolean }>`
  padding: 12px;
  background-color: transparent;
  border: none;
  border-radius: 8px;
  cursor: ${(props) => (props.disabled || !props.hasContent ? 'not-allowed' : 'pointer')};
  font-size: 16px;
  color: ${(props) =>
    props.disabled || !props.hasContent ? colors.textDisabled : colors.argoGray6};
  transition: all 0.2s ease-in-out;
  height: 44px;
  width: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: ${(props) => (props.disabled ? 0.5 : 1)};

  &:hover:not(:disabled) {
    background-color: ${(props) => (props.hasContent ? colors.backgroundLight : 'transparent')};
    color: ${(props) => (props.hasContent ? colors.textPrimary : colors.argoGray6)};
  }
`;

interface ChatContainerProps {
  application: Application;
}

export const ChatContainer: React.FC<ChatContainerProps> = ({ application }) => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const applicationName = application.metadata?.name || '';
  const applicationNamespace = application.metadata?.namespace || '';
  const project = application.spec?.project || '';

  const historyStorageKey = useMemo(
    () => `chat-history:${applicationNamespace}:${applicationName}`,
    [applicationName, applicationNamespace],
  );

  const savedJson = localStorage.getItem(historyStorageKey);

  let initialMessages: UIMessage[] = [];
  try {
    if (savedJson) {
      initialMessages = JSON.parse(savedJson);
    }
  } catch (err) {
    console.warn('Could not parse saved chat history', err);
    initialMessages = [];
  }

  const {
    messages,
    sendMessage,
    error: chatError,
    setMessages,
    status,
  } = useChat({
    transport: new DefaultChatTransport({
      headers: {
        Origin: 'https://' + location.host,
        'Argocd-Application-Name': `${applicationNamespace}:${applicationName}`,
        'Argocd-Project-Name': `${project}`,
      },
      api: '/extensions/assistant/api/agent',
    }),
    messages: initialMessages,
    onError: (err) => {
      setError(err.message);
    },
  });

  useEffect(() => {
    try {
      localStorage.setItem(historyStorageKey, JSON.stringify(messages));
    } catch (err) {
      console.error('Failed to persist messages', err);
    }
  }, [messages, historyStorageKey]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (messageText: string) => {
    setIsLoading(true);
    try {
      await sendMessage({ text: messageText });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetHistory = () => {
    if (confirm('Are you sure you want to clear the chat history? This action cannot be undone.')) {
      setMessages([]);
      localStorage.removeItem(historyStorageKey);
      setError(null);
    }
  };

  return (
    <Container>
      {/* Error Display */}
      {(error || chatError) && (
        <ErrorContainer>
          <ErrorTitle>Error</ErrorTitle>
          <div>{error || (chatError instanceof Error ? chatError.message : String(chatError))}</div>
        </ErrorContainer>
      )}

      {/* Messages */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <MessageList
          messages={messages}
          isLoading={status === 'submitted'}
          messagesEndRef={messagesEndRef}
        />
      </div>

      <InputArea>
        <IconButton
          onClick={handleResetHistory}
          disabled={isLoading || messages.length === 0}
          hasContent={messages.length > 0}
          title="Clear chat history"
        >
          <i className="fa fa-trash" />
        </IconButton>
        <div style={{ flex: 1 }}>
          <MessageInput onSendMessage={handleSendMessage} disabled={isLoading} />
        </div>
      </InputArea>
    </Container>
  );
};
