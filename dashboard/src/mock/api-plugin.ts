import type { Plugin, Connect } from "vite";
import {
  generateMonthlySpend,
  generateSuccessRate,
  generateRunVolume,
  generateTopCostCenters,
  generateSpendKpi,
  generateBudgetForecast,
} from "./executive-summary";

type RouteHandler = (params: URLSearchParams) => unknown;

const routes: Record<string, RouteHandler> = {
  "monthly-spend": () => generateMonthlySpend(),
  "budget-forecast": () => generateBudgetForecast(),
  "success-rate": (p) => generateSuccessRate(p.get("start") ?? "", p.get("end") ?? ""),
  "run-volume": (p) => generateRunVolume(p.get("start") ?? "", p.get("end") ?? ""),
  "top-cost-centers": (p) => generateTopCostCenters(p.get("start") ?? "", p.get("end") ?? ""),
  "spend-kpi": (p) => generateSpendKpi(p.get("start") ?? "", p.get("end") ?? ""),
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
