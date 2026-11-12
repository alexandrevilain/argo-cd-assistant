import type { FC } from 'react';
import { ChatContainer } from './components/ChatContainer';

const AssistantComponent: FC = (props: any) => {
  const { application } = props;
  return (
    <div style={{ height: '100vh', overflow: 'hidden', margin: '-30px' }}>
      <ChatContainer application={application} />
    </div>
  );
};

const Button: FC = () => {
  return (
    <>
      <i className="fa-solid fa-wand-magic-sparkles" />
      <span className="show-for-large" style={{ marginLeft: '5px' }}>
        Assistant
      </span>
    </>
  );
};

((window: any) => {
  window?.extensionsAPI?.registerTopBarActionMenuExt(
    Button,
    'Assistant',
    'assistant',
    AssistantComponent,
    () => true,
  );
})(window);
