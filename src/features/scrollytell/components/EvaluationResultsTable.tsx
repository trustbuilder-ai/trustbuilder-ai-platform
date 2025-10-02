import React from 'react';
import { Dialog, Table, Badge, Button, Flex, Text } from '@radix-ui/themes';
import { MessageContainer, EvalResult } from '../../../backend_client/types.gen';
import { getEvalStatusIcon, getEvalButtonColor } from '../utils/evaluationHelpers';
import EvaluationResultPopover from './EvaluationResultPopover';

interface EvaluationResultsTableProps {
  siblings: MessageContainer[];
  evalResults: Record<number, EvalResult>;
  evaluatingNodes: Set<number>;
  onEvaluate: (messageId: number) => void;
  isOpen: boolean;
  onClose: () => void;
}

const EvaluationResultsTable: React.FC<EvaluationResultsTableProps> = ({
  siblings,
  evalResults,
  evaluatingNodes,
  onEvaluate,
  isOpen,
  onClose,
}) => {
  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Content maxWidth="600px">
        <Dialog.Title>Evaluation Results</Dialog.Title>
        <Dialog.Description size="2" mb="4">
          Comparing {siblings.length} model response{siblings.length !== 1 ? 's' : ''}
        </Dialog.Description>

        <Table.Root variant="surface" className="eval-results-table">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell>Model</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Details</Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>

          <Table.Body>
            {siblings.map((sibling) => {
              const result = evalResults[sibling.id_in_tree];
              const isEvaluating = evaluatingNodes.has(sibling.id_in_tree);
              const model = sibling.message.model || 'Unknown Model';

              return (
                <Table.Row key={sibling.id_in_tree} className="eval-table-row">
                  <Table.Cell className="eval-table-cell">
                    <Text weight="medium">{model}</Text>
                  </Table.Cell>
                  <Table.Cell className="eval-table-cell">
                    {isEvaluating ? (
                      <Badge color="gray">⏳ Running</Badge>
                    ) : result ? (
                      <Badge color={getEvalButtonColor(result)}>
                        {getEvalStatusIcon(result.status, false)} {result.status}
                      </Badge>
                    ) : (
                      <Badge color="gray">Not Evaluated</Badge>
                    )}
                  </Table.Cell>
                  <Table.Cell className="eval-table-cell">
                    <EvaluationResultPopover
                      evalResult={result}
                      isEvaluating={isEvaluating}
                      onEvaluate={() => onEvaluate(sibling.id_in_tree)}
                    >
                      <Button
                        size="1"
                        variant="soft"
                        disabled={isEvaluating}
                      >
                        View Details
                      </Button>
                    </EvaluationResultPopover>
                  </Table.Cell>
                </Table.Row>
              );
            })}
          </Table.Body>
        </Table.Root>

        <Flex gap="3" mt="4" justify="end">
          <Dialog.Close>
            <Button variant="soft" color="gray">
              Close
            </Button>
          </Dialog.Close>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
};

export default EvaluationResultsTable;
