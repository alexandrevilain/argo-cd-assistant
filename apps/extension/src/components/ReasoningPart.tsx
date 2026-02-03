import React, { useState } from 'react';

import styled from 'styled-components';
import { colors } from '../theme';

const ReasoningContainer = styled.div`
  margin: 12px 0;
  border-left: 3px solid ${colors.primary};
  border-radius: 4px;
  overflow: hidden;
  background-color: rgba(24, 190, 148, 0.05);
`;

const ReasoningHeader = styled.button`
  width: 100%;
  padding: 12px;
  background-color: rgba(24, 190, 148, 0.1);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 500;
  color: ${colors.textPrimary};
  transition: background-color 0.2s ease-in-out;

  &:hover {
    background-color: rgba(24, 190, 148, 0.15);
  }
`;

const ReasoningIcon = styled.span<{ isExpanded: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  transition: transform 0.2s ease-in-out;
  transform: ${(props) => (props.isExpanded ? 'rotate(90deg)' : 'rotate(0deg)')};
`;

const ReasoningContent = styled.div<{ isExpanded: boolean }>`
  max-height: ${(props) => (props.isExpanded ? '500px' : '0')};
  overflow-y: ${(props) => (props.isExpanded ? 'scroll' : 'hidden')};
  transition: max-height 0.3s ease-in-out;
  padding: ${(props) => (props.isExpanded ? '12px' : '0 12px')};
  background-color: rgba(24, 190, 148, 0.02);
  font-size: 13px;
  line-height: 1.6;
  color: ${colors.textSecondary};
  white-space: pre-wrap;
  word-break: break-word;
`;

const ReasoningStatus = styled.span<{ state?: string }>`
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 3px;
  background-color: ${(props) =>
    props.state === 'streaming' ? 'rgba(24, 190, 148, 0.2)' : 'rgba(0, 0, 0, 0.05)'};
  color: ${(props) => (props.state === 'streaming' ? colors.primary : colors.textMuted)};
  margin-left: auto;
`;

interface ReasoningPartProps {
  text: string;
  state?: 'streaming' | 'done';
}

export const ReasoningPart: React.FC<ReasoningPartProps> = React.memo(({ text, state }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <ReasoningContainer>
      <ReasoningHeader onClick={() => setIsExpanded(!isExpanded)}>
        <ReasoningIcon isExpanded={isExpanded}>▶</ReasoningIcon>
        <span>Reasoning...</span>
        <ReasoningStatus state={state}>
          {state === 'streaming' ? 'Streaming' : 'Done'}
        </ReasoningStatus>
      </ReasoningHeader>
      <ReasoningContent isExpanded={isExpanded}>{text}</ReasoningContent>
    </ReasoningContainer>
  );
});
