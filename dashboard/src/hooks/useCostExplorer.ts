import { useQuery } from "@tanstack/react-query";
import { fetchWidget } from "../api";

// --- Response Types ---

export interface DailySpendData {
  series: {
    key: string;
    label: string;
    data: { date: string; spend_usd: number }[];
  }[];
}

export interface SpendBreakdownData {
  total_usd: number;
  drivers: {
    driver: string;
    spend_usd: number;
    pct: number;
  }[];
}

export interface TeamCostSummaryData {
  total_spend_usd: number;
  teams: {
    team_id: string;
    team_name: string;
    spend_usd: number;
    run_count: number;
    avg_cost_per_run: number;
    delta_pct: number;
    share_pct: number;
  }[];
}

// --- Hooks ---

const GC_TIME = 600_000;

export function useDailySpend(
  start: string,
  end: string,
  dimension: "team" | "agent_type",
  granularity: "daily" | "weekly" | "monthly",
) {
  return useQuery({
    queryKey: ["daily-spend", start, end, dimension, granularity],
    queryFn: ({ signal }) =>
      fetchWidget<DailySpendData>("daily-spend", { start, end, dimension, granularity }, signal),
    staleTime: 30_000,
    gcTime: GC_TIME,
  });
}

export function useSpendBreakdown(start: string, end: string) {
  return useQuery({
    queryKey: ["spend-breakdown", start, end],
    queryFn: ({ signal }) =>
      fetchWidget<SpendBreakdownData>("spend-breakdown", { start, end }, signal),
    staleTime: 30_000,
    gcTime: GC_TIME,
  });
}

export function useTeamCostSummary(start: string, end: string) {
  return useQuery({
    queryKey: ["team-cost-summary", start, end],
    queryFn: ({ signal }) =>
      fetchWidget<TeamCostSummaryData>("team-cost-summary", { start, end }, signal),
    staleTime: 30_000,
    gcTime: GC_TIME,
  });
}
