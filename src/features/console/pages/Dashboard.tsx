import React, { useState } from "react";
import { Box, Container, Flex, Grid, Heading, Text, Button, Badge, Card } from "@radix-ui/themes";
import * as ToggleGroup from "@radix-ui/react-toggle-group";
import { useApiData, usePaginatedData } from "../../../shared/hooks";
import { ProtectedCard } from "../../../shared/components/ProtectedCard";
import { DataCard } from "../components/DataCard";
import {
  healthCheckHealthCheckGet,
  listChatTemplateContainersChatTemplateContainersGet,
  getCurrentUserInfoUsersMeGet,
  listBadgesBadgesGet,
  listChatTemplatesChatTemplatesGet,
} from "../../../backend_client/sdk.gen";
import type { SelectionFilter, UserInfo, Badges, ChatTemplateContainer, ChatTemplatesPublic } from "../../../backend_client/types.gen";
import { BACKEND_URL } from "../../../config";
import { WARGAMES_CONSTANTS } from "../../../shared/constants/wargames";
import { ChevronLeftIcon, ChevronRightIcon } from "@radix-ui/react-icons";

export function Dashboard() {
  const [tournamentFilter, setTournamentFilter] =
    useState<SelectionFilter>("ACTIVE");

  // PUBLIC DATA - No authentication required
  const healthStatus = useApiData<any>(healthCheckHealthCheckGet);

  const allTournaments = useApiData<ChatTemplateContainer[]>(listChatTemplateContainersChatTemplateContainersGet);

  const paginatedTournaments = usePaginatedData<ChatTemplateContainer[]>(listChatTemplateContainersChatTemplateContainersGet, {
    pageSize: 10,
    initialParams: {
      query: {
        selection_filter: tournamentFilter,
      },
    },
  });

  const challenges = useApiData<ChatTemplatesPublic[]>(listChatTemplatesChatTemplatesGet, {
    initialParams: {
      query: {
        chat_template_container_id: 1,
        page_index: 0,
        count: WARGAMES_CONSTANTS.CHALLENGES_PAGE_SIZE,
      },
    },
  });

  // PROTECTED DATA - Requires authentication
  const userInfo = useApiData<UserInfo>(getCurrentUserInfoUsersMeGet, {
    requiresAuth: true,
  });

  const userBadges = useApiData<Badges[]>(listBadgesBadgesGet, {
    requiresAuth: true,
    initialParams: {
      query: {
        user_badges_only: true,
      },
    },
  });

  const paginatedUserBadges = usePaginatedData<Badges[]>(listBadgesBadgesGet, {
    requiresAuth: true,
    pageSize: 5,
    initialParams: {
      query: {
        user_badges_only: true,
      },
    },
  });

  const handleFilterChange = (newFilter: SelectionFilter) => {
    setTournamentFilter(newFilter);
    paginatedTournaments.updateParams({
      query: {
        selection_filter: newFilter,
        page_index: 0,
        count: 10,
      },
    });
  };

  return (
    <Container size="4" p="5">
      <Heading size="8" mb="2" align="center">Wargames Dashboard</Heading>

      {/* API Status Banner */}
      <Box mb="4">
        <DataCard {...healthStatus}>
          {(data) => (
            <Flex align="center" justify="center" py="2">
              <Badge color={data.status === "ok" ? "green" : "red"} size="2">
                API Status: {data.status} | Backend: {BACKEND_URL}
              </Badge>
            </Flex>
          )}
        </DataCard>
      </Box>

      {/* PUBLIC SECTION */}
      <Box mb="6">
        <Heading size="6" mb="4">Public Information</Heading>

        {/* Filter controls */}
        <Card mb="4">
          <Flex gap="3" align="center" wrap="wrap">
            <Text weight="medium">Tournament Status:</Text>
            <ToggleGroup.Root
              type="single"
              value={tournamentFilter}
              onValueChange={(value) => value && handleFilterChange(value as SelectionFilter)}
              style={{ display: "flex", gap: "0.5rem" }}
            >
              <ToggleGroup.Item
                value="ACTIVE"
                style={{
                  padding: "0.5rem 1rem",
                  border: "1px solid var(--gray-7)",
                  borderRadius: "var(--radius-2)",
                  backgroundColor: tournamentFilter === "ACTIVE" ? "var(--accent-9)" : "var(--color-background)",
                  color: tournamentFilter === "ACTIVE" ? "white" : "var(--gray-12)",
                  cursor: "pointer",
                }}
              >
                Active
              </ToggleGroup.Item>
              <ToggleGroup.Item
                value="FUTURE"
                style={{
                  padding: "0.5rem 1rem",
                  border: "1px solid var(--gray-7)",
                  borderRadius: "var(--radius-2)",
                  backgroundColor: tournamentFilter === "FUTURE" ? "var(--accent-9)" : "var(--color-background)",
                  color: tournamentFilter === "FUTURE" ? "white" : "var(--gray-12)",
                  cursor: "pointer",
                }}
              >
                Future
              </ToggleGroup.Item>
              <ToggleGroup.Item
                value="PAST"
                style={{
                  padding: "0.5rem 1rem",
                  border: "1px solid var(--gray-7)",
                  borderRadius: "var(--radius-2)",
                  backgroundColor: tournamentFilter === "PAST" ? "var(--accent-9)" : "var(--color-background)",
                  color: tournamentFilter === "PAST" ? "white" : "var(--gray-12)",
                  cursor: "pointer",
                }}
              >
                Past
              </ToggleGroup.Item>
            </ToggleGroup.Root>
          </Flex>
        </Card>

        {/* Paginated tournaments */}
        <DataCard
          data={paginatedTournaments.data as ChatTemplateContainer[] | null}
          error={paginatedTournaments.error}
          loading={paginatedTournaments.loading}
          title="Tournaments"
        >
          {(data: ChatTemplateContainer[]) => (
            <>
              <Grid columns={{ initial: "1", sm: "2", lg: "3" }} gap="4" mb="4">
                {data.map((tournament) => (
                  <Card key={tournament.id}>
                    <Heading size="4" mb="2">{tournament.name}</Heading>
                    {tournament.start_date && (
                      <Text size="2" color="gray" mb="2">
                        Starts: {new Date(tournament.start_date).toLocaleDateString()}
                      </Text>
                    )}
                    {tournament.end_date && (
                      <Text size="2" color="gray">
                        Ends: {new Date(tournament.end_date).toLocaleDateString()}
                      </Text>
                    )}
                  </Card>
                ))}
              </Grid>

              <Card>
                <Flex justify="between" align="center">
                  <Button
                    variant="soft"
                    onClick={paginatedTournaments.prevPage}
                    disabled={!paginatedTournaments.hasPrevPage}
                  >
                    <ChevronLeftIcon /> Previous
                  </Button>
                  <Text>Page {paginatedTournaments.currentPage + 1}</Text>
                  <Button
                    variant="soft"
                    onClick={paginatedTournaments.nextPage}
                    disabled={!paginatedTournaments.hasNextPage}
                  >
                    Next <ChevronRightIcon />
                  </Button>
                </Flex>
              </Card>
            </>
          )}
        </DataCard>

        {/* Challenges */}
        <DataCard {...challenges} title="Latest Challenges">
          {(data) => (
            <Flex direction="column" gap="3">
              {data.map((item) => (
                <Card key={item.chat_template.id}>
                  <Heading size="3" mb="2">{item.chat_template.name}</Heading>
                  {item.chat_template.description && (
                    <Text size="2" color="gray" mb="2">{item.chat_template.description}</Text>
                  )}
                  {item.chat_template.required_tools && (
                    <Badge variant="soft">{item.chat_template.required_tools}</Badge>
                  )}
                </Card>
              ))}
            </Flex>
          )}
        </DataCard>
      </Box>

      {/* PROTECTED SECTION */}
      <ProtectedCard>
        <Heading size="6" mb="4">Your Profile</Heading>

        <DataCard {...userInfo} title="Account Info">
          {(data: UserInfo) => (
            <Box>
              <Flex direction="column" gap="2">
                <Text><Text weight="bold">User ID:</Text> {data.user_id}</Text>
                <Text><Text weight="bold">Email:</Text> {data.email}</Text>
              </Flex>
            </Box>
          )}
        </DataCard>

        <DataCard
          data={paginatedUserBadges.data as Badges[] | null}
          error={paginatedUserBadges.error}
          loading={paginatedUserBadges.loading}
          title="Your Badges"
        >
          {(data: Badges[]) => (
            <>
              <Grid columns={{ initial: "2", sm: "3", lg: "5" }} gap="3" mb="4">
                {data.map((badge) => (
                  <Card key={badge.id}>
                    <Heading size="2" mb="1">Badge #{badge.id}</Heading>
                    <Text size="1" color="gray">Challenge ID: {badge.chat_template_id}</Text>
                  </Card>
                ))}
              </Grid>

              <Card>
                <Flex justify="between" align="center">
                  <Button
                    variant="soft"
                    size="1"
                    onClick={paginatedUserBadges.prevPage}
                    disabled={!paginatedUserBadges.hasPrevPage}
                  >
                    <ChevronLeftIcon />
                  </Button>
                  <Text size="2">Page {paginatedUserBadges.currentPage + 1}</Text>
                  <Button
                    variant="soft"
                    size="1"
                    onClick={paginatedUserBadges.nextPage}
                    disabled={!paginatedUserBadges.hasNextPage}
                  >
                    <ChevronRightIcon />
                  </Button>
                </Flex>
              </Card>
            </>
          )}
        </DataCard>

        <Flex justify="center" mt="4">
          <Button
            onClick={() => {
              userBadges.refetch({
                query: {
                  user_badges_only: true,
                  page_index: 0,
                  count: 50,
                },
              });
            }}
          >
            Load All Badges
          </Button>
        </Flex>
      </ProtectedCard>
    </Container>
  );
}

export default Dashboard;