import React from "react";
import { Card, Flex, Spinner, Text, Callout, Button } from "@radix-ui/themes";
import { LockClosedIcon } from "@radix-ui/react-icons";
import { useAuth } from "../hooks/useAuth";

/**
 * Wraps content that requires authentication to view.
 * @param {React.ReactNode} children - Content to display when authenticated
 * @param {string} [requiredRole] - Future: specific role required for access
 * @param {string} [className=""] - Additional CSS classes for styling
 */
export function ProtectedCard({ children, requiredRole = null, className = "" }) {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <Card className={className}>
        <Flex
          direction="column"
          align="center"
          justify="center"
          gap="3"
          py="6"
          style={{ minHeight: "200px" }}
        >
          <Spinner size="3" />
          <Text color="gray">Loading...</Text>
        </Flex>
      </Card>
    );
  }

  if (!session) {
    return (
      <Card className={className}>
        <Flex
          direction="column"
          align="center"
          justify="center"
          gap="4"
          py="6"
          style={{ minHeight: "200px" }}
        >
          <Callout.Root color="amber">
            <Callout.Icon>
              <LockClosedIcon width="20" height="20" />
            </Callout.Icon>
            <Callout.Text>
              Please log in to view this content
            </Callout.Text>
          </Callout.Root>
          <Button
            onClick={() => {
              const loginButton = document.querySelector(".header-right button");
              if (loginButton) loginButton.click();
            }}
          >
            Log In
          </Button>
        </Flex>
      </Card>
    );
  }

  return <>{children}</>;
}

export default ProtectedCard;
