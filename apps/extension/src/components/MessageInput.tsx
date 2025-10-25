import React, { useState } from 'react';
import type { KeyboardEvent } from 'react';
import styled from 'styled-components';
import { colors } from '../theme';

const Container = styled.div`
  display: flex;
  gap: 12px;
  align-items: flex-end;
`;

const InputWrapper = styled.div`
  flex: 1;
`;

const MessageTextarea = styled.textarea<{ disabled?: boolean }>`
  width: 100%;
  min-height: 44px;
  max-height: 120px;
  padding: 12px 16px;
  border: 1px solid ${colors.border};
  border-radius: 8px;
  resize: none;
  outline: none;
  font-size: 14px;
  font-family: inherit;
  background-color: ${(props) =>
    props.disabled ? colors.backgroundLight : colors.backgroundWhite};
  transition:
    border-color 0.2s ease-in-out,
    box-shadow 0.2s ease-in-out;
  line-height: 1.5;

  &:focus {
    border-color: ${colors.primary};
    box-shadow: 0 0 0 3px rgba(24, 190, 148, 0.1);
  }
`;

const SendButton = styled.button<{ disabled?: boolean }>`
  padding: 12px 24px;
  background-color: ${(props) => (props.disabled ? colors.textDisabled : colors.primary)};
  color: ${colors.textWhite};
  border: none;
  border-radius: 8px;
  cursor: ${(props) => (props.disabled ? 'not-allowed' : 'pointer')};
  font-size: 14px;
  font-weight: 600;
  transition:
    background-color 0.2s ease-in-out,
    transform 0.1s ease-in-out;
  min-width: 90px;
  height: 44px;

  &:hover:not(:disabled) {
    background-color: ${colors.primaryHover};
  }

  &:active:not(:disabled) {
    transform: scale(0.98);
  }
`;

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage, disabled = false }) => {
  const [message, setMessage] = useState('');

  const handleSubmit = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Container>
      <InputWrapper>
        <MessageTextarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask me a question ..."
          disabled={disabled}
          rows={1}
        />
      </InputWrapper>
      <SendButton onClick={handleSubmit} disabled={disabled || !message.trim()}>
        Send
      </SendButton>
    </Container>
  );
};
