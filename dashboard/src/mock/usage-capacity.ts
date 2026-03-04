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
  { team_id: "t1", team_name: "ML Infra" },
  { team_id: "t2", team_name: "Data Eng" },
  { team_id: "t3", team_name: "Platform" },
  { team_id: "t4", team_name: "Security" },
  { team_id: "t5", team_name: "DevTools" },
];

const AGENT_TYPES = [
  "code-reviewer",
  "deep-analyzer",
  "test-writer",
  "security-scanner",
  "doc-generator",
  "refactor-bot",
  "migration-helper",
];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// --- Generators ---

export function generateActiveUsers(start: string, end: string) {
  const rng = createRng(hashParams(start, end, "active-users"));
  const days = daysBetween(start, end);
  const totalUsers = Math.round(80 + rng() * 120);
  const activeUsers = Math.round(totalUsers * (0.4 + rng() * 0.4));
  const priorActiveUsers = Math.round(totalUsers * (0.4 + rng() * 0.4));
  const deltaUsers = activeUsers - priorActiveUsers;
  const activeTeams = Math.round(3 + rng() * (TEAMS.length - 3));
  const totalTeams = TEAMS.length;

  return {
    days,
    active_users: activeUsers,
    prior_active_users: priorActiveUsers,
    delta_users: deltaUsers,
    active_teams: activeTeams,
    total_teams: totalTeams,
  };
}

export function generateConcurrencyTimeseries(start: string, end: string) {
  const rng = createRng(hashParams(start, end, "concurrency-ts"));
  const days = Math.max(daysBetween(start, end), 1);
  const hasLimit = rng() > 0.3;
  const concurrencyLimit = hasLimit ? Math.round(20 + rng() * 30) : null;

  const daily = Array.from({ length: days }, (_, i) => {
    const d = new Date(start + "T00:00:00Z");
    d.setUTCDate(d.getUTCDate() + i);
    const base = concurrencyLimit ? concurrencyLimit * (0.5 + rng() * 0.6) : 10 + rng() * 30;
    const peakConcurrent = Math.round(base);
    return {
      date: d.toISOString().slice(0, 10),
      peak_concurrent: peakConcurrent,
    };
  });

  const peakInPeriod = Math.max(...daily.map((d) => d.peak_concurrent));

  return {
    concurrency_limit: concurrencyLimit,
    peak_in_period: peakInPeriod,
    daily,
  };
}

export function generateRunVolumeByTeam(start: string, end: string) {
  const rng = createRng(hashParams(start, end, "run-volume-team"));

  const teams = TEAMS.map((t) => ({
    team_id: t.team_id,
    team_name: t.team_name,
    run_count: Math.round(500 + rng() * 4500),
  }));

  teams.sort((a, b) => b.run_count - a.run_count);
  return { teams };
}

export function generateRunHeatmap(start: string, end: string) {
  const rng = createRng(hashParams(start, end, "run-heatmap"));

  const cells = DAY_NAMES.flatMap((_, dayOfWeek) =>
    Array.from({ length: 24 }, (__, hourOfDay) => {
      const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
      const isWorkHour = hourOfDay >= 9 && hourOfDay <= 17;
      const base = isWeekday && isWorkHour ? 80 : isWeekday ? 20 : 5;
      return {
        day_of_week: dayOfWeek,
        hour_of_day: hourOfDay,
        run_count: Math.round(base + rng() * base),
      };
    }),
  );

  return { cells };
}

export function generateAgentAdoption() {
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    const month = d.toISOString().slice(0, 7);
    const rng = createRng(hashParams(month, "agent-adoption"));
    const newCount = Math.round(1 + rng() * 4);
    const shuffled = [...AGENT_TYPES].sort(() => rng() - 0.5);
    const newTypes = shuffled.slice(0, newCount);
    return { month, new_count: newCount, new_types: newTypes };
  });

  const currentMonth = months[months.length - 1]!;

  return { months, current_month: currentMonth };
}
