import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Box, Container, Card, Flex, Heading, Text, Spinner, Callout, Button } from "@radix-ui/themes";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { supabase } from "../../lib/supabase";

const Callback = () => {
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const hashParams = new URLSearchParams(
          window.location.hash.substring(1),
        );
        const queryParams = new URLSearchParams(window.location.search);

        const token_hash =
          hashParams.get("token_hash") || queryParams.get("token_hash");
        const type = hashParams.get("type") || queryParams.get("type");
        const next = hashParams.get("next") || queryParams.get("next") || "/";

        if (token_hash && type) {
          // Handle different callback types
          if (type === "recovery") {
            // Password reset flow - let Supabase handle the session
            // The ResetPassword page will handle the actual password update
            const fullUrl = `${window.location.origin}/auth/reset-password${window.location.hash}${window.location.search}`;
            window.location.href = fullUrl;
            return;
          } else if (type === "email" || type === "signup") {
            // Email confirmation flow
            const { error } = await supabase.auth.verifyOtp({
              token_hash,
              type,
            });

            if (!error) {
              void navigate(next);
            } else {
              setError("Invalid or expired authentication link.");
            }
          } else {
            // Other OTP verification types
            const { error } = await supabase.auth.verifyOtp({
              token_hash,
              type,
            });

            if (!error) {
              void navigate(next);
            } else {
              setError("Invalid or expired authentication link.");
            }
          }
        } else {
          setError("Missing authentication parameters.");
        }
      } catch (err) {
        setError("An error occurred during authentication.");
      }
    };

    void handleCallback();
  }, [navigate, location]);

  if (error) {
    return (
      <Box style={{ minHeight: "100vh", backgroundColor: "var(--gray-2)" }}>
        <Flex align="center" justify="center" style={{ minHeight: "100vh" }}>
          <Container size="1">
            <Card>
              <Flex direction="column" align="center" gap="4" p="6">
                <Callout.Root color="red" size="2">
                  <Callout.Icon>
                    <ExclamationTriangleIcon width="24" height="24" />
                  </Callout.Icon>
                  <Callout.Text>
                    <Heading size="4" mb="2">Authentication Error</Heading>
                    <Text>{error}</Text>
                  </Callout.Text>
                </Callout.Root>
                <Button onClick={() => navigate("/")} size="3">
                  Return to Home
                </Button>
              </Flex>
            </Card>
          </Container>
        </Flex>
      </Box>
    );
  }

  return (
    <Box style={{ minHeight: "100vh", backgroundColor: "var(--gray-2)" }}>
      <Flex align="center" justify="center" style={{ minHeight: "100vh" }}>
        <Container size="1">
          <Card>
            <Flex direction="column" align="center" gap="4" p="6">
              <Spinner size="3" />
              <Heading size="5">Verifying your login...</Heading>
              <Text color="gray" style={{ textAlign: "center" }}>
                Please wait while we authenticate your session.
              </Text>
            </Flex>
          </Card>
        </Container>
      </Flex>
    </Box>
  );
};

export default Callback;
