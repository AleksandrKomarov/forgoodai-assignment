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
  return Math.round(
    (new Date(b).getTime() - new Date(a).getTime()) / 86_400_000,
  ) + 1;
}

// --- Generators ---

const TEAM_NAMES = [
  "ML Platform",
  "Data Engineering",
  "Backend Services",
  "Frontend Platform",
  "DevOps",
  "Research",
];

const AGENT_TYPES = [
  "code-gen",
  "qa-runner",
  "data-pipeline",
  "chat-assistant",
];

export function generateDailySpend(
  start: string,
  end: string,
  dimension: string,
  granularity: string,
) {
  const rng = createRng(hashParams(start, end, dimension, granularity, "daily-spend"));
  const days = Math.max(daysBetween(start, end), 1);

  // Build date buckets
  const buckets: string[] = [];
  const d = new Date(start + "T00:00:00Z");

  if (granularity === "monthly") {
    const endDate = new Date(end + "T00:00:00Z");
    while (d <= endDate) {
      buckets.push(d.toISOString().slice(0, 10));
      d.setUTCMonth(d.getUTCMonth() + 1);
    }
  } else if (granularity === "weekly") {
    for (let i = 0; i < days; i += 7) {
      const bd = new Date(start + "T00:00:00Z");
      bd.setUTCDate(bd.getUTCDate() + i);
      buckets.push(bd.toISOString().slice(0, 10));
    }
  } else {
    for (let i = 0; i < days; i++) {
      const bd = new Date(start + "T00:00:00Z");
      bd.setUTCDate(bd.getUTCDate() + i);
      buckets.push(bd.toISOString().slice(0, 10));
    }
  }

  const labels = dimension === "agent_type" ? AGENT_TYPES : TEAM_NAMES.slice(0, 4);

  const series = labels.map((label, idx) => {
    const baseSpend = 200 + rng() * 600;
    const data = buckets.map((date) => ({
      date,
      spend_usd: Math.round(baseSpend * (0.6 + rng() * 0.8)),
    }));
    return {
      key: dimension === "agent_type" ? label : `team-${idx}`,
      label,
      data,
    };
  });

  return { start, end, dimension, granularity, series };
}

export function generateSpendBreakdown(start: string, end: string) {
  const rng = createRng(hashParams(start, end, "spend-breakdown"));
  const days = Math.max(daysBetween(start, end), 1);
  const total_usd = Math.round((800 + rng() * 1200) * days);

  // Generate raw weights then normalize to 100%
  const rawWeights = [
    40 + rng() * 15,  // tokens
    20 + rng() * 15,  // compute
    8 + rng() * 8,    // storage
    4 + rng() * 6,    // egress
    2 + rng() * 4,    // other
  ];
  const weightSum = rawWeights.reduce((a, b) => a + b, 0);

  const driverNames = ["tokens", "compute", "storage", "egress", "other"];
  const drivers = driverNames.map((driver, i) => {
    const pct = Math.round((rawWeights[i]! / weightSum) * 1000) / 10;
    return {
      driver,
      spend_usd: Math.round(total_usd * (rawWeights[i]! / weightSum)),
      pct,
    };
  });

  return { start, end, total_usd, drivers };
}

export function generateTeamCostSummary(start: string, end: string) {
  const rng = createRng(hashParams(start, end, "team-cost-summary"));

  const teams = TEAM_NAMES.map((name, i) => {
    const spend = Math.round((15000 - i * 2000) * (0.6 + rng() * 0.8));
    const runs = Math.round(spend / (3 + rng() * 5));
    const delta = Math.round((rng() * 35 - 15) * 10) / 10;
    return {
      team_id: `t${i + 1}-0000-0000-0000-000000000001`,
      team_name: name,
      spend_usd: spend,
      run_count: runs,
      avg_cost_per_run: Math.round((spend / runs) * 100) / 100,
      delta_pct: delta,
      share_pct: 0, // computed below
    };
  });

  teams.sort((a, b) => b.spend_usd - a.spend_usd);

  const total_spend_usd = teams.reduce((s, t) => s + t.spend_usd, 0);
  for (const t of teams) {
    t.share_pct = Math.round((t.spend_usd / total_spend_usd) * 1000) / 10;
  }

  return { start, end, total_spend_usd, teams };
}
