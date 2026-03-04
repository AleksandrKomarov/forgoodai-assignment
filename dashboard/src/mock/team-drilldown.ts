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

const TEAMS = [
  { team_id: "t1-0000-0000-0000-000000000001", team_name: "ML Platform" },
  { team_id: "t2-0000-0000-0000-000000000001", team_name: "Data Engineering" },
  { team_id: "t3-0000-0000-0000-000000000001", team_name: "Backend Services" },
  { team_id: "t4-0000-0000-0000-000000000001", team_name: "Frontend Platform" },
  { team_id: "t5-0000-0000-0000-000000000001", team_name: "DevOps" },
  { team_id: "t6-0000-0000-0000-000000000001", team_name: "Research" },
];

const AGENT_TYPES = [
  "code-reviewer",
  "deep-analyzer",
  "test-writer",
  "security-scanner",
  "doc-generator",
];

const USER_NAMES = [
  "Alice Chen",
  "Bob Martinez",
  "Carla Johnson",
  "David Kim",
  "Elena Rodriguez",
  "Frank Patel",
  "Grace Liu",
  "Henry Thompson",
  "Irene Nakamura",
  "James Wilson",
];

// --- Generators ---

export function generateTeamList() {
  return { teams: TEAMS };
}

export function generateTeamSummary(
  teamId: string,
  start: string,
  end: string,
) {
  const rng = createRng(hashParams(teamId, start, end, "team-summary"));
  const days = daysBetween(start, end);

  const runsPerDay = 30 + rng() * 70;
  const runs = Math.round(runsPerDay * days);
  const priorRuns = Math.round(runsPerDay * days * (0.8 + rng() * 0.4));
  const deltaRunsPct =
    priorRuns > 0
      ? Math.round(((runs - priorRuns) / priorRuns) * 1000) / 10
      : 0;

  const spendPerDay = 200 + rng() * 600;
  const spendUsd = Math.round(spendPerDay * days);
  const priorSpendUsd = Math.round(spendPerDay * days * (0.8 + rng() * 0.4));
  const deltaSpendPct =
    priorSpendUsd > 0
      ? Math.round(((spendUsd - priorSpendUsd) / priorSpendUsd) * 1000) / 10
      : 0;

  const successRatePct = Math.round((92 + rng() * 7) * 10) / 10;
  const priorSuccessRatePct = Math.round((91 + rng() * 7) * 10) / 10;
  const deltaSuccessRatePp =
    Math.round((successRatePct - priorSuccessRatePct) * 10) / 10;

  const activeUsers = Math.round(5 + rng() * 15);
  const priorActiveUsers = Math.round(5 + rng() * 15);
  const deltaUsers = activeUsers - priorActiveUsers;

  const team = TEAMS.find((t) => t.team_id === teamId);

  return {
    team_id: teamId,
    team_name: team?.team_name ?? teamId,
    start,
    end,
    runs: {
      total: runs,
      prior_total: priorRuns,
      delta_pct: deltaRunsPct,
    },
    spend: {
      spend_usd: spendUsd,
      prior_spend_usd: priorSpendUsd,
      delta_pct: deltaSpendPct,
    },
    success_rate: {
      rate_pct: successRatePct,
      prior_rate_pct: priorSuccessRatePct,
      delta_pp: deltaSuccessRatePp,
    },
    active_users: {
      count: activeUsers,
      prior_count: priorActiveUsers,
      delta: deltaUsers,
    },
  };
}

export function generateTeamTopAgents(
  teamId: string,
  start: string,
  end: string,
  limit: number,
) {
  const rng = createRng(hashParams(teamId, start, end, "team-top-agents"));

  const agents = AGENT_TYPES.map((agentType) => {
    const runCount = Math.round(200 + rng() * 3000);
    const failRate = 0.01 + rng() * 0.08;
    const failedCount = Math.round(runCount * failRate);
    const successRatePct =
      Math.round(((runCount - failedCount) / runCount) * 1000) / 10;
    const avgDurationMs = Math.round(1000 + rng() * 15000);
    const spendUsd = Math.round(runCount * (0.5 + rng() * 3) * 100) / 100;

    return {
      agent_type: agentType,
      run_count: runCount,
      success_rate_pct: successRatePct,
      avg_duration_ms: avgDurationMs,
      spend_usd: spendUsd,
    };
  });

  agents.sort((a, b) => b.run_count - a.run_count);
  return { agents: agents.slice(0, limit) };
}

export function generateTeamUserActivity(
  teamId: string,
  start: string,
  end: string,
) {
  const rng = createRng(hashParams(teamId, start, end, "team-user-activity"));
  const userCount = Math.round(5 + rng() * 5);

  const users = USER_NAMES.slice(0, userCount).map((name, i) => {
    const runCount = Math.round(50 + rng() * 500);
    const successRatePct = Math.round((93 + rng() * 6) * 10) / 10;

    // last_active: random time within the date range
    const rangeMs = new Date(end).getTime() - new Date(start).getTime();
    const lastActiveMs = new Date(end).getTime() - rng() * rangeMs;
    const lastActive = new Date(lastActiveMs).toISOString();

    return {
      user_id: `u${i + 1}-${teamId.slice(0, 8)}`,
      user_name: name,
      run_count: runCount,
      success_rate_pct: successRatePct,
      last_active: lastActive,
    };
  });

  users.sort((a, b) => b.run_count - a.run_count);
  return { users };
}
