import React from "react";
import { Card, Flex, Spinner, Text, Callout } from "@radix-ui/themes";
import { ExclamationTriangleIcon, InfoCircledIcon } from "@radix-ui/react-icons";

interface DataCardProps<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  title?: string;
  children: (data: T) => React.ReactNode;
  className?: string;
}

/**
 * Generic component for displaying API data with loading, error, and empty states.
 * Works with any data type and handles all common display states.
 * Now powered by Radix UI for accessibility and consistent styling.
 */
export function DataCard<T>({
  data,
  loading,
  error,
  title,
  children,
  className = "",
}: DataCardProps<T>) {
  if (loading) {
    return (
      <Card className={className}>
        <Flex direction="column" align="center" justify="center" gap="3" py="6">
          <Spinner size="3" />
          <Text color="gray" size="2">
            Loading{title ? ` ${title}` : ""}...
          </Text>
        </Flex>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <Callout.Root color="red">
          <Callout.Icon>
            <ExclamationTriangleIcon />
          </Callout.Icon>
          <Callout.Text>
            Error loading {title || "data"}: {error.message}
          </Callout.Text>
        </Callout.Root>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className={className}>
        <Callout.Root color="gray">
          <Callout.Icon>
            <InfoCircledIcon />
          </Callout.Icon>
          <Callout.Text>
            No {title || "data"} available
          </Callout.Text>
        </Callout.Root>
      </Card>
    );
  }

  return <Card className={className}>{children(data)}</Card>;
}

export default DataCard;
