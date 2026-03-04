// Seeded pseudo-random number generator (mulberry32)
function createRng(seed: number) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashParams(...parts: string[]): number {
  const str = parts.join(":");
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return h;
}

function daysBetween(a: string, b: string): number {
  return (
    Math.round(
      (new Date(b).getTime() - new Date(a).getTime()) / 86_400_000,
    ) + 1
  );
}

// --- Constants ---

const ERROR_CODES = [
  "CONTEXT_LIMIT_EXCEEDED",
  "TIMEOUT",
  "OOM",
  "LOGIC_ERROR",
  "INFRA_FAULT",
];

const AGENT_TYPES = [
  "code-reviewer",
  "deep-analyzer",
  "test-writer",
  "security-scanner",
  "doc-generator",
];

const TEAMS = [
  { team_id: "t1", team_name: "ML Infra" },
  { team_id: "t2", team_name: "Data Eng" },
  { team_id: "t3", team_name: "Platform" },
];

// --- Generators ---

export function generateSuccessRatePerf(start: string, end: string) {
  const rng = createRng(hashParams(start, end, "perf-success-rate"));
  const total = Math.round(20000 + rng() * 15000);
  const rate_pct = Math.round((92 + rng() * 7) * 10) / 10;
  const completed = Math.round(total * (rate_pct / 100));
  const failed = total - completed;
  const prior_rate_pct = Math.round((91 + rng() * 7) * 10) / 10;
  const delta_pp = Math.round((rate_pct - prior_rate_pct) * 10) / 10;

  return { rate_pct, completed, failed, total, prior_rate_pct, delta_pp };
}

export function generateLatencyKpi(start: string, end: string) {
  const rng = createRng(hashParams(start, end, "latency-kpi"));

  const p50_ms = Math.round(800 + rng() * 1200);
  const p95_ms = Math.round(3000 + rng() * 4000);
  const p99_ms = Math.round(8000 + rng() * 8000);

  const prior_p50_ms = Math.round(800 + rng() * 1200);
  const prior_p95_ms = Math.round(3000 + rng() * 4000);
  const prior_p99_ms = Math.round(8000 + rng() * 8000);

  return {
    p50_ms,
    p95_ms,
    p99_ms,
    prior_p50_ms,
    prior_p95_ms,
    prior_p99_ms,
    delta_p50_ms: p50_ms - prior_p50_ms,
    delta_p95_ms: p95_ms - prior_p95_ms,
    delta_p99_ms: p99_ms - prior_p99_ms,
  };
}

export function generateSuccessFailureTimeseries(start: string, end: string) {
  const rng = createRng(hashParams(start, end, "success-failure-ts"));
  const days = Math.max(daysBetween(start, end), 1);

  const daily = Array.from({ length: days }, (_, i) => {
    const d = new Date(start + "T00:00:00Z");
    d.setUTCDate(d.getUTCDate() + i);
    const total = Math.round(600 + rng() * 600);
    const failRate = 0.02 + rng() * 0.08;
    const failed = Math.round(total * failRate);
    return {
      date: d.toISOString().slice(0, 10),
      completed: total - failed,
      failed,
    };
  });

  return { daily };
}

export function generateErrorTaxonomy(start: string, end: string) {
  const rng = createRng(hashParams(start, end, "error-taxonomy"));

  const rawWeights = [
    35 + rng() * 10, // CONTEXT_LIMIT_EXCEEDED
    20 + rng() * 10, // TIMEOUT
    15 + rng() * 8, // OOM
    8 + rng() * 8, // LOGIC_ERROR
    5 + rng() * 6, // INFRA_FAULT
  ];
  const weightSum = rawWeights.reduce((a, b) => a + b, 0);
  const total_failures = Math.round(800 + rng() * 600);

  const errors = ERROR_CODES.map((error_code, i) => {
    const pct = Math.round((rawWeights[i]! / weightSum) * 1000) / 10;
    const count = Math.round(total_failures * (rawWeights[i]! / weightSum));
    return { error_code, count, pct };
  });

  return { total_failures, errors };
}

export function generateLatencyDistribution(start: string, end: string) {
  const rng = createRng(hashParams(start, end, "latency-distribution"));
  const days = Math.max(daysBetween(start, end), 1);

  const daily = Array.from({ length: days }, (_, i) => {
    const d = new Date(start + "T00:00:00Z");
    d.setUTCDate(d.getUTCDate() + i);
    const p50_ms = Math.round(600 + rng() * 1000);
    const p95_ms = Math.round(p50_ms * (2.5 + rng() * 2));
    const p99_ms = Math.round(p95_ms * (1.5 + rng() * 1.5));
    return {
      date: d.toISOString().slice(0, 10),
      p50_ms,
      p95_ms,
      p99_ms,
    };
  });

  return { daily };
}

export function generateSlowestAgents(
  start: string,
  end: string,
  limit: number,
) {
  const rng = createRng(hashParams(start, end, "slowest-agents"));

  const agents = AGENT_TYPES.map((agent_type) => {
    const avg_duration_ms = Math.round(2000 + rng() * 18000);
    const p95_duration_ms = Math.round(avg_duration_ms * (1.5 + rng()));
    const run_count = Math.round(100 + rng() * 3000);
    return { agent_type, avg_duration_ms, p95_duration_ms, run_count };
  });

  agents.sort((a, b) => b.avg_duration_ms - a.avg_duration_ms);
  return { agents: agents.slice(0, limit) };
}

export function generateFailureHotspots(start: string, end: string) {
  const rng = createRng(hashParams(start, end, "failure-hotspots"));

  const cells = AGENT_TYPES.flatMap((agent_type) =>
    TEAMS.map((team) => {
      const total = Math.round(200 + rng() * 2000);
      const failure_rate_pct = Math.round(rng() * 100) / 10;
      const failed = Math.round(total * (failure_rate_pct / 100));
      return {
        agent_type,
        team_id: team.team_id,
        failure_rate_pct,
        failed,
        total,
      };
    }),
  );

  return { teams: TEAMS, cells };
}
