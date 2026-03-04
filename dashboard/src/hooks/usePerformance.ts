import { useQuery } from "@tanstack/react-query";
import { fetchWidget } from "../api";
import { daysBetween } from "../dateUtils";

// --- Response Types ---

export interface PerfSuccessRateData {
  rate_pct: number;
  completed: number;
  failed: number;
  total: number;
  prior_rate_pct: number;
  delta_pp: number;
}

export interface LatencyKpiData {
  p50_ms: number;
  p95_ms: number;
  p99_ms: number;
  prior_p50_ms: number;
  prior_p95_ms: number;
  prior_p99_ms: number;
  delta_p50_ms: number;
  delta_p95_ms: number;
  delta_p99_ms: number;
}

export interface SuccessFailureTimeseriesData {
  daily: { date: string; completed: number; failed: number }[];
}

export interface ErrorTaxonomyData {
  total_failures: number;
  errors: { error_code: string; count: number; pct: number }[];
}

export interface LatencyDistributionData {
  daily: { date: string; p50_ms: number; p95_ms: number; p99_ms: number }[];
}

export interface SlowestAgentsData {
  agents: {
    agent_type: string;
    avg_duration_ms: number;
    p95_duration_ms: number;
    run_count: number;
  }[];
}

export interface FailureHotspotsData {
  teams: { team_id: string; team_name: string }[];
  cells: {
    agent_type: string;
    team_id: string;
    failure_rate_pct: number;
    failed: number;
    total: number;
  }[];
}

// --- Hooks ---

const GC_TIME = 600_000;

export function usePerfSuccessRate(start: string, end: string) {
  return useQuery({
    queryKey: ["perf-success-rate", start, end],
    queryFn: ({ signal }) =>
      fetchWidget<PerfSuccessRateData>("perf-success-rate", { start, end }, signal),
    staleTime: 30_000,
    gcTime: GC_TIME,
  });
}

export function useLatencyKpi(start: string, end: string) {
  const withinLimit = daysBetween(start, end) <= 90;
  return useQuery({
    queryKey: ["latency-kpi", start, end],
    queryFn: ({ signal }) =>
      fetchWidget<LatencyKpiData>("latency-kpi", { start, end }, signal),
    staleTime: 30_000,
    gcTime: GC_TIME,
    enabled: withinLimit,
  });
}

export function useSuccessFailureTimeseries(start: string, end: string) {
  return useQuery({
    queryKey: ["success-failure-timeseries", start, end],
    queryFn: ({ signal }) =>
      fetchWidget<SuccessFailureTimeseriesData>(
        "success-failure-timeseries",
        { start, end },
        signal,
      ),
    staleTime: 30_000,
    gcTime: GC_TIME,
  });
}

export function useErrorTaxonomy(start: string, end: string) {
  return useQuery({
    queryKey: ["error-taxonomy", start, end],
    queryFn: ({ signal }) =>
      fetchWidget<ErrorTaxonomyData>("error-taxonomy", { start, end }, signal),
    staleTime: 30_000,
    gcTime: GC_TIME,
  });
}

export function useLatencyDistribution(start: string, end: string) {
  return useQuery({
    queryKey: ["latency-distribution", start, end],
    queryFn: ({ signal }) =>
      fetchWidget<LatencyDistributionData>("latency-distribution", {
        start,
        end,
      }, signal),
    staleTime: 30_000,
    gcTime: GC_TIME,
  });
}

export function useSlowestAgents(
  start: string,
  end: string,
  limit: number = 10,
) {
  return useQuery({
    queryKey: ["slowest-agents", start, end, limit],
    queryFn: ({ signal }) =>
      fetchWidget<SlowestAgentsData>("slowest-agents", {
        start,
        end,
        limit: String(limit),
      }, signal),
    staleTime: 30_000,
    gcTime: GC_TIME,
  });
}

export function useFailureHotspots(start: string, end: string) {
  return useQuery({
    queryKey: ["failure-hotspots", start, end],
    queryFn: ({ signal }) =>
      fetchWidget<FailureHotspotsData>("failure-hotspots", { start, end }, signal),
    staleTime: 30_000,
    gcTime: GC_TIME,
  });
}
