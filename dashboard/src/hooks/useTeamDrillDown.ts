import { useQuery } from "@tanstack/react-query";
import { fetchWidget } from "../api";

// --- Response Types ---

export interface TeamListData {
  teams: { team_id: string; team_name: string }[];
}

export interface TeamSummaryData {
  team_id: string;
  team_name: string;
  runs: { total: number; prior_total: number; delta_pct: number };
  spend: { spend_usd: number; prior_spend_usd: number; delta_pct: number };
  success_rate: { rate_pct: number; prior_rate_pct: number; delta_pp: number };
  active_users: { count: number; prior_count: number; delta: number };
}

export interface TeamTopAgentsData {
  agents: {
    agent_type: string;
    run_count: number;
    success_rate_pct: number;
    avg_duration_ms: number;
    spend_usd: number;
  }[];
}

export interface TeamUserActivityData {
  users: {
    user_id: string;
    user_name: string;
    run_count: number;
    success_rate_pct: number;
    last_active: string;
  }[];
}

// --- Hooks ---

const GC_TIME = 600_000;

export function useTeamList() {
  return useQuery({
    queryKey: ["team-list"],
    queryFn: () => fetchWidget<TeamListData>("team-list"),
    staleTime: 900_000, // 15 min per spec
    gcTime: GC_TIME,
  });
}

export function useTeamSummary(teamId: string, start: string, end: string) {
  return useQuery({
    queryKey: ["team-summary", teamId, start, end],
    queryFn: () =>
      fetchWidget<TeamSummaryData>("team-summary", {
        team_id: teamId,
        start,
        end,
      }),
    staleTime: 60_000,
    gcTime: GC_TIME,
    enabled: !!teamId,
  });
}

export function useTeamTopAgents(
  teamId: string,
  start: string,
  end: string,
  limit: number = 10,
) {
  return useQuery({
    queryKey: ["team-top-agents", teamId, start, end, limit],
    queryFn: () =>
      fetchWidget<TeamTopAgentsData>("team-top-agents", {
        team_id: teamId,
        start,
        end,
        limit: String(limit),
      }),
    staleTime: 60_000,
    gcTime: GC_TIME,
    enabled: !!teamId,
  });
}

export function useTeamUserActivity(
  teamId: string,
  start: string,
  end: string,
) {
  return useQuery({
    queryKey: ["team-user-activity", teamId, start, end],
    queryFn: () =>
      fetchWidget<TeamUserActivityData>("team-user-activity", {
        team_id: teamId,
        start,
        end,
      }),
    staleTime: 60_000,
    gcTime: GC_TIME,
    enabled: !!teamId,
  });
}
