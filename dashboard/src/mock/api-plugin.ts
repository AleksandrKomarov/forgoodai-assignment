import type { Plugin, Connect } from "vite";
import {
  generateMonthlySpend,
  generateSuccessRate,
  generateRunVolume,
  generateTopCostCenters,
  generateSpendKpi,
  generateBudgetForecast,
} from "./executive-summary";
import {
  generateDailySpend,
  generateSpendBreakdown,
  generateTeamCostSummary,
} from "./cost-explorer";
import {
  generateSuccessRatePerf,
  generateLatencyKpi,
  generateSuccessFailureTimeseries,
  generateErrorTaxonomy,
  generateLatencyDistribution,
  generateSlowestAgents,
  generateFailureHotspots,
} from "./performance";
import {
  generateActiveUsers,
  generateConcurrencyTimeseries,
  generateRunVolumeByTeam,
  generateRunHeatmap,
  generateAgentAdoption,
} from "./usage-capacity";
import {
  generateTeamList,
  generateTeamSummary,
  generateTeamTopAgents,
  generateTeamUserActivity,
} from "./team-drilldown";

type RouteHandler = (params: URLSearchParams) => unknown;

const routes: Record<string, RouteHandler> = {
  "monthly-spend": () => generateMonthlySpend(),
  "budget-forecast": () => generateBudgetForecast(),
  "success-rate": (p) => generateSuccessRate(p.get("start") ?? "", p.get("end") ?? ""),
  "run-volume": (p) => generateRunVolume(p.get("start") ?? "", p.get("end") ?? ""),
  "top-cost-centers": (p) => generateTopCostCenters(p.get("start") ?? "", p.get("end") ?? ""),
  "spend-kpi": (p) => generateSpendKpi(p.get("start") ?? "", p.get("end") ?? ""),
  "daily-spend": (p) =>
    generateDailySpend(
      p.get("start") ?? "",
      p.get("end") ?? "",
      p.get("dimension") ?? "team",
      p.get("granularity") ?? "daily",
    ),
  "spend-breakdown": (p) =>
    generateSpendBreakdown(p.get("start") ?? "", p.get("end") ?? ""),
  "team-cost-summary": (p) =>
    generateTeamCostSummary(p.get("start") ?? "", p.get("end") ?? ""),
  "perf-success-rate": (p) =>
    generateSuccessRatePerf(p.get("start") ?? "", p.get("end") ?? ""),
  "latency-kpi": (p) =>
    generateLatencyKpi(p.get("start") ?? "", p.get("end") ?? ""),
  "success-failure-timeseries": (p) =>
    generateSuccessFailureTimeseries(p.get("start") ?? "", p.get("end") ?? ""),
  "error-taxonomy": (p) =>
    generateErrorTaxonomy(p.get("start") ?? "", p.get("end") ?? ""),
  "latency-distribution": (p) =>
    generateLatencyDistribution(p.get("start") ?? "", p.get("end") ?? ""),
  "slowest-agents": (p) =>
    generateSlowestAgents(
      p.get("start") ?? "",
      p.get("end") ?? "",
      Number(p.get("limit") ?? "10"),
    ),
  "failure-hotspots": (p) =>
    generateFailureHotspots(p.get("start") ?? "", p.get("end") ?? ""),
  "active-users": (p) =>
    generateActiveUsers(p.get("start") ?? "", p.get("end") ?? ""),
  "concurrency-timeseries": (p) =>
    generateConcurrencyTimeseries(p.get("start") ?? "", p.get("end") ?? ""),
  "run-volume-by-team": (p) =>
    generateRunVolumeByTeam(p.get("start") ?? "", p.get("end") ?? ""),
  "run-heatmap": (p) =>
    generateRunHeatmap(p.get("start") ?? "", p.get("end") ?? ""),
  "agent-adoption": () => generateAgentAdoption(),
  "team-list": () => generateTeamList(),
  "team-summary": (p) =>
    generateTeamSummary(
      p.get("team_id") ?? "",
      p.get("start") ?? "",
      p.get("end") ?? "",
    ),
  "team-top-agents": (p) =>
    generateTeamTopAgents(
      p.get("team_id") ?? "",
      p.get("start") ?? "",
      p.get("end") ?? "",
      Number(p.get("limit") ?? "10"),
    ),
  "team-user-activity": (p) =>
    generateTeamUserActivity(
      p.get("team_id") ?? "",
      p.get("start") ?? "",
      p.get("end") ?? "",
    ),
};

function randomDelay(): number {
  return 300 + Math.random() * 1700;
}

export function mockApiPlugin(): Plugin {
  return {
    name: "mock-api",
    configureServer(server) {
      server.middlewares.use(((req, res, next) => {
        const url = req.url ?? "";
        if (!url.startsWith("/api/v1/widgets/")) return next();

        const [path, qs] = url.split("/api/v1/widgets/")[1]?.split("?") ?? [];
        const endpoint = path ?? "";
        const handler = routes[endpoint];

        if (!handler) {
          res.statusCode = 404;
          res.end(JSON.stringify({ error: "not_found" }));
          return;
        }

        const params = new URLSearchParams(qs ?? "");
        const data = handler(params);
        const delay = randomDelay();

        setTimeout(() => {
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(data));
        }, delay);
      }) as Connect.NextHandleFunction);
    },
  };
}
