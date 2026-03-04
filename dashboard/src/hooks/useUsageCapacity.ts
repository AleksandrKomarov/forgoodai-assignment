import { useQuery } from "@tanstack/react-query";
import { fetchWidget } from "../api";
import { daysBetween } from "../dateUtils";

// --- Response Types ---

export interface ActiveUsersData {
  days: number;
  active_users: number;
  prior_active_users: number;
  delta_users: number;
  active_teams: number;
  total_teams: number;
}

export interface ConcurrencyTimeseriesData {
  concurrency_limit: number | null;
  peak_in_period: number;
  daily: { date: string; peak_concurrent: number }[];
}

export interface RunVolumeByTeamData {
  teams: { team_id: string; team_name: string; run_count: number }[];
}

export interface RunHeatmapData {
  cells: { day_of_week: number; hour_of_day: number; run_count: number }[];
}

export interface AgentAdoptionData {
  months: { month: string; new_count: number; new_types: string[] }[];
  current_month: { month: string; new_count: number; new_types: string[] };
}

// --- Hooks ---

const GC_TIME = 600_000;

export function useActiveUsers(start: string, end: string) {
  return useQuery({
    queryKey: ["active-users", start, end],
    queryFn: ({ signal }) =>
      fetchWidget<ActiveUsersData>("active-users", { start, end }, signal),
    staleTime: 30_000,
    gcTime: GC_TIME,
  });
}

export function useConcurrencyTimeseries(start: string, end: string) {
  const withinLimit = daysBetween(start, end) <= 90;
  return useQuery({
    queryKey: ["concurrency-timeseries", start, end],
    queryFn: ({ signal }) =>
      fetchWidget<ConcurrencyTimeseriesData>("concurrency-timeseries", {
        start,
        end,
      }, signal),
    staleTime: 30_000,
    gcTime: GC_TIME,
    enabled: withinLimit,
  });
}

export function useRunVolumeByTeam(start: string, end: string) {
  return useQuery({
    queryKey: ["run-volume-by-team", start, end],
    queryFn: ({ signal }) =>
      fetchWidget<RunVolumeByTeamData>("run-volume-by-team", { start, end }, signal),
    staleTime: 30_000,
    gcTime: GC_TIME,
  });
}

export function useRunHeatmap(start: string, end: string) {
  const withinLimit = daysBetween(start, end) <= 90;
  return useQuery({
    queryKey: ["run-heatmap", start, end],
    queryFn: ({ signal }) =>
      fetchWidget<RunHeatmapData>("run-heatmap", { start, end }, signal),
    staleTime: 30_000,
    gcTime: GC_TIME,
    enabled: withinLimit,
  });
}

export function useAgentAdoption() {
  return useQuery({
    queryKey: ["agent-adoption"],
    queryFn: ({ signal }) => fetchWidget<AgentAdoptionData>("agent-adoption", undefined, signal),
    staleTime: 120_000,
    gcTime: GC_TIME,
  });
}
