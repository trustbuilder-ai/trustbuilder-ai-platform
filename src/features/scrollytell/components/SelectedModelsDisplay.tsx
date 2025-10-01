import React from 'react';
import { Flex, Text, Badge } from '@radix-ui/themes';
import type { ModelInfo } from '../../../backend_client/types.gen';

interface SelectedModelsDisplayProps {
  selectedModels: string[];
  models: ModelInfo[];
  loading?: boolean;
}

const SelectedModelsDisplay: React.FC<SelectedModelsDisplayProps> = ({
  selectedModels,
  models,
  loading = false,
}) => {
  if (loading) {
    return (
      <Flex gap="2" align="center">
        <Text size="2" weight="medium">Selected:</Text>
        <Text size="2" color="gray">Loading...</Text>
      </Flex>
    );
  }

  if (selectedModels.length === 0) {
    return (
      <Flex gap="2" align="center">
        <Text size="2" weight="medium">Selected:</Text>
        <Text size="2" color="gray">None</Text>
      </Flex>
    );
  }

  return (
    <Flex gap="2" align="center" wrap="wrap">
      <Text size="2" weight="medium">Selected:</Text>
      {selectedModels.map((modelId) => {
        const model = models.find(m => m.id === modelId);
        return (
          <Badge key={modelId} size="2" variant="soft">
            {model?.display_name || modelId}
          </Badge>
        );
      })}
    </Flex>
  );
};

export default SelectedModelsDisplay;
