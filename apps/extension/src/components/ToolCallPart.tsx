import React, { useState } from 'react';
import styled from 'styled-components';
import { colors } from '../theme';
import type { DynamicToolUIPart } from 'ai';

const Container = styled.div<{ isFirstPart: boolean }>`
  margin-top: ${(props) => (props.isFirstPart ? '0' : '12px')};
  padding: 12px;
  background-color: rgba(0, 0, 0, 0.05);
  border-radius: 8px;
  border-left: 3px solid ${colors.primary};
` as any;

const Header = styled.div<{ hasContent: boolean }>`
  font-size: 13px;
  font-weight: 600;
  color: ${colors.primary};
  margin-bottom: ${(props) => (props.hasContent ? '8px' : '0')};
  display: flex;
  align-items: center;
  gap: 6px;
`;

const Status = styled.div`
  font-size: 12px;
  color: ${colors.textSecondary};
`;

const Section = styled.div<{ hasMargin?: boolean }>`
  margin-bottom: ${(props) => (props.hasMargin ? '8px' : '0')};
`;

const ExpandButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  background-color: rgba(0, 0, 0, 0.03);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  color: ${colors.textSecondary};
  width: 100%;
  text-align: left;
  transition: background-color 0.2s;

  &:hover {
    background-color: rgba(0, 0, 0, 0.06);
  }
`;

const ExpandIcon = styled.span<{ expanded: boolean }>`
  transform: ${(props) => (props.expanded ? 'rotate(90deg)' : 'rotate(0deg)')};
  transition: transform 0.2s;
`;

const Content = styled.div`
  margin-top: 8px;
  padding: 8px;
  background-color: rgba(0, 0, 0, 0.02);
  border-radius: 4px;
  font-size: 12px;
  font-family: Monaco, Menlo, Consolas, monospace;
  color: ${colors.textPrimary};
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 300px;
  overflow-y: auto;
`;

const Error = styled.div`
  font-size: 13px;
  color: ${colors.errorBorder};
  padding: 8px;
  background-color: rgba(220, 38, 38, 0.1);
  border-radius: 4px;
`;

interface ToolCallDisplayProps {
  part: DynamicToolUIPart;
  isFirstPart: boolean;
}

export const ToolCallPart: React.FC<ToolCallDisplayProps> = React.memo(({ part, isFirstPart }) => {
  const [isInputExpanded, setIsInputExpanded] = useState(false);
  const [isOutputExpanded, setIsOutputExpanded] = useState(false);

  const hasInput = (part.input || null) && Object.keys(part.input || {}).length > 0;
  const hasOutput = part.state === 'output-available';
  const hasError = part.state === 'output-error';

  return (
    <Container isFirstPart={isFirstPart}>
      <Header hasContent={hasInput || hasOutput || hasError}>
        <span>🔧</span>
        <span>{part.toolName}</span>
      </Header>

      {part.state === 'input-streaming' && <Status>Processing...</Status>}

      {/* Input Section */}
      {hasInput && (
        <Section hasMargin={hasOutput || hasError}>
          <ExpandButton onClick={() => setIsInputExpanded(!isInputExpanded)}>
            <ExpandIcon expanded={isInputExpanded}>▶</ExpandIcon>
            <span>Input</span>
          </ExpandButton>
          {isInputExpanded && <Content>{JSON.stringify(part.input, null, 2)}</Content>}
        </Section>
      )}

      {/* Output Section */}
      {hasOutput && (
        <div>
          <ExpandButton onClick={() => setIsOutputExpanded(!isOutputExpanded)}>
            <ExpandIcon expanded={isOutputExpanded}>▶</ExpandIcon>
            <span>Output</span>
          </ExpandButton>
          {isOutputExpanded && (
            <Content>
              {typeof part.output === 'string' ? part.output : JSON.stringify(part.output, null, 2)}
            </Content>
          )}
        </div>
      )}

      {/* Error Section */}
      {hasError && <Error>❌ Error: {part.errorText}</Error>}
    </Container>
  );
});
