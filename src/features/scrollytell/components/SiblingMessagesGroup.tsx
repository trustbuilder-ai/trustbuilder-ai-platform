import React from 'react';
import { Button, Flex, Badge } from '@radix-ui/themes';
import { MessageContainer, EvalResult } from '../../../backend_client/types.gen';
import LLMUIMessage from './LLMUIMessage';
import EvaluationResultPopover from './EvaluationResultPopover';
import { getEvalStatusIcon, getEvalButtonColor, getEvalButtonVariant } from '../utils/evaluationHelpers';

interface SiblingMessagesGroupProps {
  siblings: MessageContainer[];
  onContinueFrom: (messageId: number) => void;
  onEvaluate: (messageId: number) => void;
  onEvaluateAll: () => void;
  evalResults: Record<number, EvalResult>;
  evaluatingNodes: Set<number>;
  showEvalButtons: boolean; // Only show after tree saved to DB
  currentLeafId: number;
}

const SiblingMessagesGroup: React.FC<SiblingMessagesGroupProps> = ({
  siblings,
  onContinueFrom,
  onEvaluate,
  onEvaluateAll,
  evalResults,
  evaluatingNodes,
  showEvalButtons,
  currentLeafId,
}) => {
  return (
    <div className="sibling-messages-group">
      <div className="sibling-group-header">
        <Badge color="purple" size="2">
          {siblings.length} Model Response{siblings.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      <div className="sibling-messages-container">
        {siblings.map((sibling, index) => {
          const isActive = sibling.id_in_tree === currentLeafId;
          const result = evalResults[sibling.id_in_tree];
          const isEvaluating = evaluatingNodes.has(sibling.id_in_tree);

          return (
            <div
              key={sibling.id_in_tree}
              className={`sibling-message-card ${isActive ? 'active' : ''}`}
            >
              {/* Connecting line (not for first item) */}
              {index > 0 && <div className="sibling-connecting-line" />}

              {/* Message content */}
              <LLMUIMessage
                message={sibling}
                showActions={false}
              />

              {/* Action buttons */}
              <Flex gap="2" mt="2" justify="between" align="center">
                <Flex gap="2" align="center">
                  <Button
                    size="1"
                    variant="soft"
                    onClick={() => onContinueFrom(sibling.id_in_tree)}
                    className="continue-button"
                  >
                    Continue from here
                  </Button>
                  {isActive && (
                    <Badge color="gray" size="1" variant="soft" className="default-badge">
                      default
                    </Badge>
                  )}
                </Flex>

                {showEvalButtons && (
                  <EvaluationResultPopover
                    evalResult={result}
                    isEvaluating={isEvaluating}
                    onEvaluate={() => onEvaluate(sibling.id_in_tree)}
                  >
                    <Button
                      size="1"
                      variant={getEvalButtonVariant(result)}
                      color={getEvalButtonColor(result)}
                      disabled={isEvaluating}
                      className="eval-button-sibling"
                    >
                      Eval {getEvalStatusIcon(result?.status, isEvaluating)}
                    </Button>
                  </EvaluationResultPopover>
                )}
              </Flex>
            </div>
          );
        })}
      </div>

      {/* Evaluate All button */}
      {showEvalButtons && siblings.length > 1 && (
        <Flex justify="center" mt="3">
          <Button
            size="2"
            variant="solid"
            color="purple"
            onClick={onEvaluateAll}
            disabled={siblings.some(s => evaluatingNodes.has(s.id_in_tree))}
            className="evaluate-all-button"
          >
            Evaluate All ({siblings.length})
          </Button>
        </Flex>
      )}
    </div>
  );
};

export default SiblingMessagesGroup;
