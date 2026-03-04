import { useQuery } from "@tanstack/react-query";
import { fetchWidget } from "../api";

// --- Response Types ---

export interface SpendKpiData {
  spend_usd: number;
  prior_spend_usd: number;
  delta_pct: number;
  budget_usd: number | null;
  budget_utilization_pct: number | null;
}

export interface RunVolumeData {
  total_runs: number;
  prior_total_runs: number;
  delta_pct: number;
  daily: { date: string; count: number }[];
}

export interface SuccessRateData {
  rate_pct: number;
  completed: number;
  failed: number;
  total: number;
  prior_rate_pct: number;
  delta_pp: number;
}

export interface BudgetForecastData {
  month: string;
  days_elapsed: number;
  days_in_month: number;
  spent_so_far_usd: number;
  daily_run_rate_usd: number;
  forecast: {
    projected_usd: number;
    projected_over_budget_usd: number | null;
    projected_budget_pct: number | null;
  };
  burn_rate: {
    budget_usd: number | null;
    burn_pct: number | null;
    month_progress_pct: number;
    on_track: boolean;
  };
}

export interface MonthlySpendData {
  monthly_spend: { period: string; total_usd: number }[];
  monthly_spend_forecast: { period: string; projected_usd: number }[];
}

export interface TopCostCentersData {
  teams: {
    team_id: string;
    team_name: string;
    spend_usd: number;
    run_count: number;
    delta_pct: number;
  }[];
}

// --- Hooks ---

const GC_TIME = 600_000;

export function useSpendKpi(start: string, end: string) {
  return useQuery({
    queryKey: ["spend-kpi", start, end],
    queryFn: () => fetchWidget<SpendKpiData>("spend-kpi", { start, end }),
    staleTime: 30_000,
    gcTime: GC_TIME,
  });
}

export function useRunVolume(start: string, end: string) {
  return useQuery({
    queryKey: ["run-volume", start, end],
    queryFn: () => fetchWidget<RunVolumeData>("run-volume", { start, end }),
    staleTime: 30_000,
    gcTime: GC_TIME,
  });
}

export function useSuccessRate(start: string, end: string) {
  return useQuery({
    queryKey: ["success-rate", start, end],
    queryFn: () => fetchWidget<SuccessRateData>("success-rate", { start, end }),
    staleTime: 30_000,
    gcTime: GC_TIME,
  });
}

export function useBudgetForecast() {
  return useQuery({
    queryKey: ["budget-forecast"],
    queryFn: () => fetchWidget<BudgetForecastData>("budget-forecast"),
    staleTime: 120_000,
    gcTime: GC_TIME,
  });
}

export function useMonthlySpend() {
  return useQuery({
    queryKey: ["monthly-spend"],
    queryFn: () => fetchWidget<MonthlySpendData>("monthly-spend"),
    staleTime: 120_000,
    gcTime: GC_TIME,
  });
}

export function useTopCostCenters(start: string, end: string) {
  return useQuery({
    queryKey: ["top-cost-centers", start, end],
    queryFn: () =>
      fetchWidget<TopCostCentersData>("top-cost-centers", { start, end }),
    staleTime: 30_000,
    gcTime: GC_TIME,
  });
}
