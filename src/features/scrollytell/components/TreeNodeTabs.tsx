import React from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { MessageContainer, EvalResult } from '../../../backend_client/types.gen';
import EvaluationResultPopover from './EvaluationResultPopover';
import { getEvalStatusIcon, getEvalButtonColor } from '../utils/evaluationHelpers';

interface TreeNodeTabsProps {
  message: MessageContainer;
  onEvaluate: (messageId: number) => void;
  onChatClick?: (messageId: number) => void;
  evalResult?: EvalResult | null;
  isEvaluating?: boolean;
}

const TreeNodeTabs: React.FC<TreeNodeTabsProps> = ({
  message,
  onEvaluate,
  onChatClick,
  evalResult,
  isEvaluating = false
}) => {
  // Only render tabs for assistant messages
  if (message.message.role !== 'assistant') {
    return null;
  }

  const handleChatClick = () => {
    if (message.id_in_tree !== undefined && onChatClick) {
      onChatClick(message.id_in_tree);
    }
  };

  const handleEvalClick = () => {
    if (message.id_in_tree !== undefined) {
      onEvaluate(message.id_in_tree);
    }
  };

  return (
    <Tabs.Root defaultValue="chat" className="tree-node-tabs">
      <Tabs.List className="tree-node-tabs-list">
        <Tabs.Trigger
          value="chat"
          className="tree-node-tab-trigger"
          onClick={handleChatClick}
        >
          Chat
        </Tabs.Trigger>
        <EvaluationResultPopover
          evalResult={evalResult}
          isEvaluating={isEvaluating}
          onEvaluate={handleEvalClick}
        >
          <Tabs.Trigger
            value="eval"
            className="tree-node-tab-trigger"
            disabled={isEvaluating}
            style={{
              color: evalResult ? `var(--${getEvalButtonColor(evalResult)}-9) !important` : undefined,
              backgroundColor: evalResult ? `var(--${getEvalButtonColor(evalResult)}-3)` : undefined,
            }}
          >
            Eval {getEvalStatusIcon(evalResult?.status, isEvaluating)}
          </Tabs.Trigger>
        </EvaluationResultPopover>
      </Tabs.List>
    </Tabs.Root>
  );
};

export default TreeNodeTabs;
