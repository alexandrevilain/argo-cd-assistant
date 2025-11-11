import React from 'react';
import type { UIMessage } from 'ai';
import ReactMarkdown from 'react-markdown';
import styled from 'styled-components';
import { colors } from '../theme';
import { ToolCallPart } from './ToolCallPart';
import { ReasoningPart } from './ReasoningPart';
import remarkGfm from 'remark-gfm';
import { Light, SyntaxHighlighterProps } from 'react-syntax-highlighter';
import yaml from 'react-syntax-highlighter/dist/esm/languages/hljs/yaml';
import bash from 'react-syntax-highlighter/dist/esm/languages/hljs/bash';
import vs from 'react-syntax-highlighter/dist/esm/styles/hljs/vs';

Light.registerLanguage('yaml', yaml);
Light.registerLanguage('bash', bash);

const SyntaxHighlighter = Light as any as React.FC<SyntaxHighlighterProps>;

const Container = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 20px;
  background-color: ${colors.backgroundLight};
`;

const EmptyState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: ${colors.textMuted};
  font-size: 14px;
  padding: 40px 20px;
  text-align: center;
`;

const MessageWrapper = styled.div<{ isUser: boolean }>`
  display: flex;
  justify-content: ${(props) => (props.isUser ? 'flex-end' : 'flex-start')};
  margin-bottom: 16px;
`;

const MessageBubble = styled.div<{ isUser: boolean }>`
  max-width: 85%;
  padding: 16px 20px;
  border-radius: 12px;
  background-color: ${(props) => (props.isUser ? colors.primary : colors.backgroundGray)};
  color: ${(props) => (props.isUser ? colors.textWhite : colors.textPrimary)};
  word-wrap: break-word;
  position: relative;
  border: none;
  font-size: 14px;
  line-height: 1.6;
  box-shadow: ${(props) => (props.isUser ? 'none' : '0 1px 2px rgba(0, 0, 0, 0.05)')};
`;

const MessageContent = styled.div<{ isUser: boolean }>`
  color: ${(props) => (props.isUser ? colors.textWhite : colors.textPrimary)};
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: flex-start;
  margin-bottom: 16px;
`;

const LoadingBubble = styled.div`
  padding: 16px 20px;
  border-radius: 12px;
  background-color: ${colors.backgroundGray};
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
`;

const LoadingDots = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const LoadingDot = styled.div<{ delay: number }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${colors.textSecondary};
  animation: pulse 1.5s ease-in-out infinite;
  animation-delay: ${(props) => props.delay}s;

  @keyframes pulse {
    0%,
    80%,
    100% {
      opacity: 0.5;
    }
    40% {
      opacity: 1;
    }
  }
`;

const Code = styled.code`
  all: unset;
`;

interface MessageListProps {
  messages: UIMessage[];
  isLoading?: boolean;
  messagesEndRef?: React.RefObject<HTMLDivElement>;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  isLoading,
  messagesEndRef,
}) => {
  const renderMessage = (message: UIMessage, index: number) => {
    const isUser = message.role === 'user';

    return (
      <MessageWrapper key={message.id || index} isUser={isUser}>
        <MessageBubble isUser={isUser}>{renderMessageContent(message, isUser)}</MessageBubble>
      </MessageWrapper>
    );
  };

  const renderMessageContent = (message: UIMessage, isUser: boolean) => {
    // Handle different message structures
    if (message.parts && Array.isArray(message.parts)) {
      return (
        <div>
          {message.parts.map((part: any, index: number) => {
            switch (part.type) {
              case 'text':
                return (
                  <MessageContent key={index} isUser={isUser}>
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h1: ({ ...props }) => (
                          <h1
                            style={{ fontSize: '20px', fontWeight: '600', margin: '12px 0 8px' }}
                            {...props}
                          />
                        ),
                        h2: ({ ...props }) => (
                          <h2
                            style={{ fontSize: '18px', fontWeight: '600', margin: '12px 0 8px' }}
                            {...props}
                          />
                        ),
                        h3: ({ ...props }) => (
                          <h3
                            style={{ fontSize: '16px', fontWeight: '600', margin: '10px 0 6px' }}
                            {...props}
                          />
                        ),
                        h4: ({ ...props }) => (
                          <h4
                            style={{ fontSize: '14px', fontWeight: '600', margin: '10px 0 6px' }}
                            {...props}
                          />
                        ),
                        h5: ({ ...props }) => (
                          <h5
                            style={{ fontSize: '13px', fontWeight: '600', margin: '8px 0 4px' }}
                            {...props}
                          />
                        ),
                        h6: ({ ...props }) => (
                          <h6
                            style={{ fontSize: '12px', fontWeight: '600', margin: '8px 0 4px' }}
                            {...props}
                          />
                        ),
                        table: ({ ...props }) => (
                          <table
                            style={{
                              borderCollapse: 'collapse',
                              width: '100%',
                              border: '1px solid #ccc',
                            }}
                            {...props}
                          />
                        ),
                        th: ({ ...props }) => (
                          <th
                            style={{
                              border: '1px solid #ccc',
                              background: '#f9f9f9',
                              padding: '8px',
                            }}
                            {...props}
                          />
                        ),
                        td: ({ ...props }) => (
                          <td style={{ border: '1px solid #ccc', padding: '8px' }} {...props} />
                        ),
                        code: ({ ...props }) => {
                          const { children, className, ...rest } = props;
                          const match = /language-(\w+)/.exec(className || '');

                          return match ? (
                            <SyntaxHighlighter
                              CodeTag={Code}
                              children={String(children).replace(/\n$/, '')}
                              language={match[1]}
                              style={vs}
                            />
                          ) : (
                            <code
                              {...rest}
                              className={className}
                              style={{
                                backgroundColor: 'rgba(0, 0, 0, 0.08)',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '13px',
                                fontFamily: 'Monaco, Menlo, Consolas, monospace',
                                color: isUser ? colors.textWhite : colors.textPrimary,
                              }}
                            >
                              {children}
                            </code>
                          );
                        },
                      }}
                    >
                      {part.text}
                    </ReactMarkdown>
                  </MessageContent>
                );
              case 'reasoning':
                return <ReasoningPart key={index} text={part.text} state={part.state} />;
              case 'dynamic-tool':
                return <ToolCallPart key={index} part={part} isFirstPart={index === 0} />;
            }
          })}
        </div>
      );
    }

    // Fallback for other content types
    return <div>{JSON.stringify(message)}</div>;
  };

  return (
    <Container>
      {messages.length === 0 ? (
        <EmptyState>
          Hello! Please ask questions about this Application. I'm happy to help.
        </EmptyState>
      ) : (
        <>
          {messages.map((message, index) => renderMessage(message, index))}
          {isLoading && (
            <LoadingContainer>
              <LoadingBubble>
                <LoadingDots>
                  <LoadingDot delay={0} />
                  <LoadingDot delay={0.2} />
                  <LoadingDot delay={0.4} />
                </LoadingDots>
              </LoadingBubble>
            </LoadingContainer>
          )}
          {messagesEndRef && <div ref={messagesEndRef} />}
        </>
      )}
    </Container>
  );
};
