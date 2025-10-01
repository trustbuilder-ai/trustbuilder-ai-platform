import React from 'react';
import { Flex, Text, Select } from '@radix-ui/themes';
import type { ModelInfo } from '../../../backend_client/types.gen';

interface ModelSelectorProps {
  models: ModelInfo[];
  selectedModel: string;
  onModelChange: (model: string) => void;
  disabled?: boolean;
  loading?: boolean;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({
  models,
  selectedModel,
  onModelChange,
  disabled = false,
  loading = false,
}) => {
  if (loading) {
    return (
      <Flex gap="3" align="center">
        <Text as="label" size="2" weight="medium">
          Model:
        </Text>
        <Select.Root disabled value="">
          <Select.Trigger placeholder="Loading models..." style={{ minWidth: '200px' }} />
        </Select.Root>
      </Flex>
    );
  }

  if (models.length === 0) {
    return (
      <Flex gap="3" align="center">
        <Text as="label" size="2" weight="medium">
          Model:
        </Text>
        <Select.Root disabled value="">
          <Select.Trigger placeholder="No models available" style={{ minWidth: '200px' }} />
        </Select.Root>
      </Flex>
    );
  }

  return (
    <Flex gap="3" align="center">
      <Text as="label" size="2" weight="medium">
        Model:
      </Text>
      <Select.Root
        value={selectedModel}
        onValueChange={onModelChange}
        disabled={disabled}
      >
        <Select.Trigger placeholder="Select a model" style={{ minWidth: '200px' }} />
        <Select.Content position="popper">
          {models.map((model) => (
            <Select.Item key={model.id} value={model.id}>
              <Flex gap="2" align="center">
                <Text>{model.display_name || model.id}</Text>
                {model.owned_by && (
                  <Text size="1" color="gray">
                    ({model.owned_by})
                  </Text>
                )}
              </Flex>
            </Select.Item>
          ))}
        </Select.Content>
      </Select.Root>
    </Flex>
  );
};

export default ModelSelector;
