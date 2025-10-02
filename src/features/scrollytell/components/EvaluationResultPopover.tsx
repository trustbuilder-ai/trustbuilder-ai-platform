import React, { useState } from 'react';
import { Popover, Badge, Flex, Box, Text } from '@radix-ui/themes';
import { EvalResult } from '../../../backend_client/types.gen';

interface EvaluationResultPopoverProps {
  evalResult?: EvalResult | null;
  isEvaluating?: boolean;
  onEvaluate?: () => void;
  children: React.ReactNode; // Eval button
}

const EvaluationResultPopover: React.FC<EvaluationResultPopoverProps> = ({
  evalResult,
  isEvaluating,
  onEvaluate,
  children,
}) => {
  const [open, setOpen] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();

    // If we already have a result, just toggle the popover
    if (evalResult) {
      setOpen(!open);
      return;
    }

    // No result yet - trigger evaluation
    if (onEvaluate && !isEvaluating) {
      await onEvaluate();
      setOpen(true);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCEEDED':
        return 'green';
      case 'FAILED':
        return 'red';
      case 'ERRORED':
        return 'amber';
      case 'NOT_EVALUATED':
        return 'gray';
      default:
        return 'gray';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUCCEEDED':
        return '✓';
      case 'FAILED':
        return '✗';
      case 'ERRORED':
        return '⚠️';
      default:
        return '';
    }
  };

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild onClick={handleClick}>
        {children}
      </Popover.Trigger>
      <Popover.Content width="400px" className="eval-popover-content">
        {evalResult ? (
          <Flex direction="column" gap="3">
            <Badge
              size="2"
              color={getStatusColor(evalResult.status)}
              className="eval-status-badge"
            >
              {getStatusIcon(evalResult.status)} {evalResult.status}
            </Badge>

            {evalResult.reason && (
              <Box className="eval-reason-section">
                <Text weight="bold" size="2" mb="1" as="div">
                  Reason:
                </Text>
                <Text size="2" color="gray">
                  {evalResult.reason}
                </Text>
              </Box>
            )}

            {evalResult.context_message_leaf_id && (
              <Box className="eval-metadata">
                <Text size="1" color="gray">
                  Leaf ID: {evalResult.context_message_leaf_id}
                </Text>
              </Box>
            )}
          </Flex>
        ) : isEvaluating ? (
          <Flex align="center" gap="2">
            <Text size="2">Evaluating...</Text>
          </Flex>
        ) : (
          <Text size="2" color="gray">
            No evaluation result available
          </Text>
        )}
      </Popover.Content>
    </Popover.Root>
  );
};

export default EvaluationResultPopover;
