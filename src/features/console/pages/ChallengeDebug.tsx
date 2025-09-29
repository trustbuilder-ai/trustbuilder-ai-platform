import React, { useState } from "react";
import { Container, Heading, Text, Flex, Card, Button, Badge, Code, Spinner, Callout, Box } from "@radix-ui/themes";
import * as ScrollArea from "@radix-ui/react-scroll-area";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { useApiData } from "../../../shared/hooks";
import { getChatTemplateContextChatTemplatesChatTemplateIdContextGet } from "../../../backend_client/sdk.gen";
import { ProtectedCard } from "../../../shared/components/ProtectedCard";

export function ChallengeDebug() {
  const [challengeId, setChallengeId] = useState("");
  const [inputValue, setInputValue] = useState("");

  // Fetch challenge context
  const challengeContext = useApiData(getChatTemplateContextChatTemplatesChatTemplateIdContextGet, {
    requiresAuth: true,
    enabled: !!challengeId && !isNaN(Number(challengeId)),
    initialParams: challengeId && !isNaN(Number(challengeId))
      ? {
          path: {
            chat_template_id: Number(challengeId),
          },
        }
      : undefined,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isNaN(Number(inputValue))) {
      setChallengeId(inputValue.trim());
      // Update params to trigger fetch
      challengeContext.updateParams({
        path: {
          chat_template_id: Number(inputValue.trim()),
        },
      });
    }
  };

  const handleClear = () => {
    setChallengeId("");
    setInputValue("");
  };

  return (
    <Box style={{ backgroundColor: "var(--gray-2)", minHeight: "100vh" }}>
      <Box style={{ backgroundColor: "white", borderBottom: "1px solid var(--gray-5)" }} p="5">
        <Heading size="8" mb="1">Challenge Context Debugger</Heading>
        <Text color="gray">Enter a challenge ID to view its full context data</Text>
      </Box>

      <Container size="3" p="5">
        <ProtectedCard>
          <Card mb="5">
            <form onSubmit={handleSubmit}>
              <Flex direction="column" gap="4">
                <Flex direction="column" gap="2">
                  <Text as="label" htmlFor="challenge-id" size="2" weight="medium">
                    Challenge ID:
                  </Text>
                  <input
                    id="challenge-id"
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Enter challenge ID (e.g., 1, 2, 3...)"
                    style={{
                      padding: "var(--space-2)",
                      border: "1px solid var(--gray-7)",
                      borderRadius: "var(--radius-2)",
                      fontSize: "var(--font-size-2)",
                      fontFamily: "var(--default-font-family)",
                      width: "100%",
                      maxWidth: "400px",
                    }}
                  />
                </Flex>
                <Flex gap="2">
                  <Button type="submit">Fetch Context</Button>
                  <Button type="button" variant="soft" onClick={handleClear}>
                    Clear
                  </Button>
                </Flex>
              </Flex>
            </form>
          </Card>

          {challengeId && (
            <Flex direction="column" gap="4">
              <Heading size="5">Challenge ID: {challengeId}</Heading>

              {challengeContext.loading && (
                <Flex align="center" justify="center" py="6">
                  <Spinner size="3" />
                  <Text color="gray" ml="3">Loading challenge context...</Text>
                </Flex>
              )}

              {challengeContext.error && (
                <Callout.Root color="red">
                  <Callout.Icon>
                    <ExclamationTriangleIcon />
                  </Callout.Icon>
                  <Callout.Text>
                    <strong>Error:</strong> {challengeContext.error.message}
                  </Callout.Text>
                </Callout.Root>
              )}

              {challengeContext.data && (
                <Flex direction="column" gap="5">
                  {/* User Challenge Context */}
                  <Box>
                    <Heading size="4" mb="3">User Challenge Context:</Heading>
                    <Card>
                      <ScrollArea.Root type="auto" style={{ maxHeight: 400 }}>
                        <ScrollArea.Viewport style={{ width: "100%" }}>
                          <Code variant="ghost" size="2" style={{ display: "block", whiteSpace: "pre", fontFamily: "monospace" }}>
                            {JSON.stringify(challengeContext.data.user_chat_template_context, null, 2)}
                          </Code>
                        </ScrollArea.Viewport>
                        <ScrollArea.Scrollbar orientation="vertical">
                          <ScrollArea.Thumb />
                        </ScrollArea.Scrollbar>
                      </ScrollArea.Root>
                    </Card>
                  </Box>

                  {/* Messages Section */}
                  <Box>
                    <Heading size="4" mb="3">
                      Messages ({challengeContext.data.messages?.length || 0}):
                    </Heading>
                    {challengeContext.data.messages && challengeContext.data.messages.length > 0 ? (
                      <Flex direction="column" gap="3">
                        {challengeContext.data.messages.map((message: any, index: number) => (
                          <Card key={index}>
                            <Flex direction="column" gap="2">
                              <Flex align="center" gap="2" wrap="wrap">
                                <Text size="1" color="gray" weight="medium">
                                  #{index + 1}
                                </Text>
                                <Badge color="blue" variant="soft">
                                  {message.role}
                                </Badge>
                                {message.is_tool_call && (
                                  <Badge color="red" variant="soft">
                                    Tool Call
                                  </Badge>
                                )}
                                {message.tool_name && (
                                  <Code size="1">{message.tool_name}</Code>
                                )}
                              </Flex>
                              <Box
                                style={{
                                  backgroundColor: "var(--gray-2)",
                                  padding: "var(--space-3)",
                                  borderRadius: "var(--radius-2)",
                                }}
                              >
                                <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordWrap: "break-word", fontSize: "var(--font-size-2)" }}>
                                  {message.content}
                                </pre>
                              </Box>
                            </Flex>
                          </Card>
                        ))}
                      </Flex>
                    ) : (
                      <Card>
                        <Text color="gray" style={{ textAlign: "center", fontStyle: "italic" }}>
                          No messages found
                        </Text>
                      </Card>
                    )}
                  </Box>

                  {/* Full Response Data */}
                  <Box>
                    <Heading size="4" mb="3">Full Response Data:</Heading>
                    <Card>
                      <ScrollArea.Root type="auto" style={{ maxHeight: 400 }}>
                        <ScrollArea.Viewport style={{ width: "100%" }}>
                          <Code variant="ghost" size="2" style={{ display: "block", whiteSpace: "pre", fontFamily: "monospace" }}>
                            {JSON.stringify(challengeContext.data, null, 2)}
                          </Code>
                        </ScrollArea.Viewport>
                        <ScrollArea.Scrollbar orientation="vertical">
                          <ScrollArea.Thumb />
                        </ScrollArea.Scrollbar>
                      </ScrollArea.Root>
                    </Card>
                  </Box>
                </Flex>
              )}
            </Flex>
          )}
        </ProtectedCard>
      </Container>
    </Box>
  );
}

export default ChallengeDebug;