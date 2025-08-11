import React, { useState } from "react";
import { useApiData, usePaginatedData } from "../../../shared/hooks";
import { ProtectedCard } from "../../../shared/components/ProtectedCard";
import { DataCard } from "../components/DataCard";
import {
  healthCheckHealthCheckGet, // Public: ${BACKEND_URL}/health_check
  listTournamentsTournamentsGet, // Public: ${BACKEND_URL}/tournaments
  getCurrentUserInfoUsersMeGet, // Protected: ${BACKEND_URL}/users/me
  listBadgesBadgesGet, // Protected: ${BACKEND_URL}/badges
  listChallengesChallengesGet, // Public: ${BACKEND_URL}/challenges
} from "../../../backend_client/sdk.gen";
import type { SelectionFilter, UserInfo, Badges, Tournaments, Challenges } from "../../../backend_client/types.gen";
import { BACKEND_URL } from "../../../config";
import { WARGAMES_CONSTANTS } from "../../../shared/constants/wargames";
import "./Dashboard.css";

export function Dashboard() {
  const [tournamentFilter, setTournamentFilter] =
    useState<SelectionFilter>("ACTIVE");

  // PUBLIC DATA - No authentication required

  // Health check - hits https://wargames-ai-backend-357559285333.us-west1.run.app/health_check
  const healthStatus = useApiData<any>(healthCheckHealthCheckGet);

  // Simple public data fetch - hits ${BACKEND_URL}/tournaments
  const allTournaments = useApiData<Tournaments[]>(listTournamentsTournamentsGet);

  // Public data with pagination - hits ${BACKEND_URL}/tournaments?page_index=0&count=10
  const paginatedTournaments = usePaginatedData<Tournaments[]>(listTournamentsTournamentsGet, {
    pageSize: 10,
    initialParams: {
      query: {
        selection_filter: tournamentFilter,
      },
    },
  });

  // Public data with manual parameter control - hits ${BACKEND_URL}/challenges?tournament_id=1&page_index=0&count=20
  const challenges = useApiData<Challenges[]>(listChallengesChallengesGet, {
    initialParams: {
      query: {
        tournament_id: 1,
        page_index: 0,
        count: WARGAMES_CONSTANTS.CHALLENGES_PAGE_SIZE,
      },
    },
  });

  // PROTECTED DATA - Requires authentication

  // Simple protected data - hits ${BACKEND_URL}/users/me with Authorization header
  const userInfo = useApiData<UserInfo>(getCurrentUserInfoUsersMeGet, {
    requiresAuth: true,
  });

  // Protected data with parameters - hits ${BACKEND_URL}/badges?user_badges_only=true
  const userBadges = useApiData<Badges[]>(listBadgesBadgesGet, {
    requiresAuth: true,
    initialParams: {
      query: {
        user_badges_only: true,
      },
    },
  });

  // Protected data with pagination - hits ${BACKEND_URL}/badges?user_badges_only=true&page_index=0&count=5
  const paginatedUserBadges = usePaginatedData<Badges[]>(listBadgesBadgesGet, {
    requiresAuth: true,
    pageSize: 5,
    initialParams: {
      query: {
        user_badges_only: true,
      },
    },
  });

  // Dynamic parameter updates (fully typed!)
  const handleFilterChange = (newFilter: SelectionFilter) => {
    setTournamentFilter(newFilter);
    paginatedTournaments.updateParams({
      query: {
        selection_filter: newFilter, // TypeScript knows this field exists
        page_index: 0, // Reset to first page
        count: 10,
      },
    });
  };

  return (
    <div className="dashboard-page">
      <h1>Wargames Dashboard</h1>

      {/* API Status Banner */}
      <div className="api-status">
        <DataCard {...healthStatus} className="health-banner">
          {(data) => (
            <span className={`status ${data.status === "ok" ? "ok" : "error"}`}>
              API Status: {data.status} | Backend: {BACKEND_URL}
            </span>
          )}
        </DataCard>
      </div>

      {/* PUBLIC SECTION - Always visible */}
      <section className="public-section">
        <h2>Public Information</h2>

        {/* Filter controls */}
        <div className="filters">
          <label>Tournament Status:</label>
          {(["ACTIVE", "FUTURE", "PAST"] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => handleFilterChange(filter)}
              className={tournamentFilter === filter ? "ACTIVE" : ""}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>

        {/* Paginated public data from ${BACKEND_URL}/tournaments */}
        <DataCard
          data={paginatedTournaments.data as Tournaments[] | null}
          error={paginatedTournaments.error}
          loading={paginatedTournaments.loading}
          title="Tournaments"
          className="tournaments-list"
        >
          {(data: Tournaments[]) => (
            <>
              <div className="tournament-grid">
                {data.map((tournament) => (
                  <div key={tournament.id} className="tournament-item">
                    <h3>{tournament.name}</h3>
                    <p>
                      Starts:{" "}
                      {new Date(tournament.start_date).toLocaleDateString()}
                    </p>
                    {tournament.end_date && (
                      <p>
                        Ends:{" "}
                        {new Date(tournament.end_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              <div className="pagination">
                <button
                  onClick={paginatedTournaments.prevPage}
                  disabled={!paginatedTournaments.hasPrevPage}
                >
                  Previous
                </button>
                <span>Page {paginatedTournaments.currentPage + 1}</span>
                <button
                  onClick={paginatedTournaments.nextPage}
                  disabled={!paginatedTournaments.hasNextPage}
                >
                  Next
                </button>
              </div>
            </>
          )}
        </DataCard>

        {/* Simple public data from ${BACKEND_URL}/challenges */}
        <DataCard {...challenges} title="Latest Challenges">
          {(data) => (
            <div className="challenges-list">
              {data.map((challenge) => (
                <div key={challenge.id} className="challenge-item">
                  <h4>{challenge.name}</h4>
                  {challenge.description && <p>{challenge.description}</p>}
                  {challenge.required_tools && (
                    <p className="tools">Tools: {challenge.required_tools}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </DataCard>
      </section>

      {/* PROTECTED SECTION - Only visible when authenticated */}
      <ProtectedCard className="user-section">
        <h2>Your Profile</h2>

        {/* Simple protected data from ${BACKEND_URL}/users/me */}
        <DataCard {...userInfo} title="Account Info">
          {(data: UserInfo) => (
            <div className="user-info">
              <p>
                <strong>User ID:</strong> {data.user_id}
              </p>
              <p>
                <strong>Email:</strong> {data.email}
              </p>
            </div>
          )}
        </DataCard>

        {/* Paginated protected data from ${BACKEND_URL}/badges */}
        <DataCard 
          data={paginatedUserBadges.data as Badges[] | null}
          error={paginatedUserBadges.error}
          loading={paginatedUserBadges.loading}
          title="Your Badges">
          {(data: Badges[]) => (
            <>
              <div className="badges-grid">
                {data.map((badge) => (
                  <div key={badge.id} className="badge-card">
                    <h4>Badge #{badge.id}</h4>
                    <p>Challenge ID: {badge.challenge_id}</p>
                  </div>
                ))}
              </div>

              <div className="pagination">
                <button
                  onClick={paginatedUserBadges.prevPage}
                  disabled={!paginatedUserBadges.hasPrevPage}
                >
                  ←
                </button>
                <span>Page {paginatedUserBadges.currentPage + 1}</span>
                <button
                  onClick={paginatedUserBadges.nextPage}
                  disabled={!paginatedUserBadges.hasNextPage}
                >
                  →
                </button>
              </div>
            </>
          )}
        </DataCard>

        {/* Manual parameter control example */}
        <div className="actions">
          <button
            onClick={() => {
              userBadges.refetch({
                query: {
                  user_badges_only: true,
                  page_index: 0,
                  count: 50, // Load more badges
                },
              });
            }}
            className="load-all-btn"
          >
            Load All Badges
          </button>
        </div>
      </ProtectedCard>
    </div>
  );
}

export default Dashboard;
