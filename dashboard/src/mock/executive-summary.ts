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

function hashParams(start: string, end: string, salt: string): number {
  const str = `${start}:${end}:${salt}`;
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

function monthsAgo(n: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d.toISOString().slice(0, 7);
}

function monthsAhead(n: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + n);
  return d.toISOString().slice(0, 7);
}

// --- Generators (range-scoped endpoints get different data per range) ---

export function generateSpendKpi(start: string, end: string) {
  const rng = createRng(hashParams(start, end, "spend-kpi"));
  const days = Math.max(daysBetween(start, end), 1);
  const dailyRate = 800 + rng() * 1200;
  const spend = Math.round(dailyRate * days);
  const priorSpend = Math.round(spend * (0.8 + rng() * 0.35));
  const delta = ((spend - priorSpend) / priorSpend) * 100;
  const budget = Math.round(spend * (0.9 + rng() * 0.3));

  return {
    start,
    end,
    spend_usd: spend,
    prior_spend_usd: priorSpend,
    delta_pct: Math.round(delta * 10) / 10,
    budget_usd: budget,
    budget_utilization_pct:
      Math.round((spend / budget) * 1000) / 10,
  };
}

export function generateSuccessRate(start: string, end: string) {
  const rng = createRng(hashParams(start, end, "success-rate"));
  const total = Math.round(5000 + rng() * 30000);
  const rate = 88 + rng() * 11;
  const completed = Math.round(total * (rate / 100));
  const failed = total - completed;
  const priorRate = 88 + rng() * 11;
  const delta = Math.round((rate - priorRate) * 10) / 10;

  return {
    start,
    end,
    rate_pct: Math.round(rate * 10) / 10,
    completed,
    failed,
    total,
    prior_rate_pct: Math.round(priorRate * 10) / 10,
    delta_pp: delta,
  };
}

export function generateRunVolume(start: string, end: string) {
  const rng = createRng(hashParams(start, end, "run-volume"));
  const days = Math.max(daysBetween(start, end), 1);
  const baseDaily = 300 + rng() * 800;
  const daily = [];
  const d = new Date(start + "T00:00:00Z");
  let totalRuns = 0;

  for (let i = 0; i < days; i++) {
    const count = Math.round(baseDaily + (rng() - 0.5) * baseDaily * 0.6);
    daily.push({ date: d.toISOString().slice(0, 10), count });
    totalRuns += count;
    d.setUTCDate(d.getUTCDate() + 1);
  }

  const priorTotal = Math.round(totalRuns * (0.75 + rng() * 0.4));
  const delta = ((totalRuns - priorTotal) / priorTotal) * 100;

  return {
    start,
    end,
    total_runs: totalRuns,
    prior_total_runs: priorTotal,
    delta_pct: Math.round(delta * 10) / 10,
    daily,
  };
}

export function generateTopCostCenters(start: string, end: string) {
  const rng = createRng(hashParams(start, end, "top-cost-centers"));
  const names = [
    "ML Platform",
    "Data Engineering",
    "Backend Services",
    "Frontend Platform",
    "DevOps",
    "Research",
  ];
  // Pick 3 teams based on rng
  const shuffled = names.sort(() => rng() - 0.5);
  const teams = shuffled.slice(0, 3).map((name, i) => {
    const spend = Math.round((20000 - i * 5000) * (0.6 + rng() * 0.8));
    const runs = Math.round(spend / (3 + rng() * 4));
    const delta = Math.round((rng() * 30 - 10) * 10) / 10;
    return {
      team_id: `a1b2c3d4-000${i + 1}-0000-0000-000000000001`,
      team_name: name,
      spend_usd: spend,
      run_count: runs,
      delta_pct: delta,
    };
  });

  teams.sort((a, b) => b.spend_usd - a.spend_usd);

  return { start, end, teams };
}

// --- Fixed-window endpoints (same data regardless of date range) ---

export function generateMonthlySpend() {
  const rng = createRng(42);
  const base = 28000;
  const monthly_spend = [];
  for (let i = 12; i >= 1; i--) {
    const trend = (12 - i) * 800;
    const noise = (rng() - 0.5) * 6000;
    monthly_spend.push({
      period: monthsAgo(i),
      total_usd: Math.round(base + trend + noise),
    });
  }
  const last = monthly_spend[monthly_spend.length - 1]!.total_usd;
  const monthly_spend_forecast = [0, 1, 2].map((n) => ({
    period: n === 0 ? monthsAgo(0) : monthsAhead(n),
    projected_usd: Math.round(last * (1 + n * 0.03 + (rng() - 0.5) * 0.04)),
  }));

  return { monthly_spend, monthly_spend_forecast };
}

export function generateBudgetForecast() {
  const now = new Date();
  const daysInMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
  ).getDate();
  const daysElapsed = now.getDate();
  const dailyRate = 1400 + Math.random() * 600;
  const spentSoFar = Math.round(dailyRate * daysElapsed);
  const projected = Math.round(dailyRate * daysInMonth);
  const budget = 45000;
  const overBudget = projected - budget;

  return {
    month: now.toISOString().slice(0, 7),
    days_elapsed: daysElapsed,
    days_in_month: daysInMonth,
    spent_so_far_usd: spentSoFar,
    daily_run_rate_usd: Math.round(dailyRate * 100) / 100,
    forecast: {
      projected_usd: projected,
      projected_over_budget_usd: overBudget,
      projected_budget_pct:
        Math.round((projected / budget) * 1000) / 10,
    },
    burn_rate: {
      budget_usd: budget,
      burn_pct:
        Math.round((spentSoFar / budget) * 1000) / 10,
      month_progress_pct:
        Math.round((daysElapsed / daysInMonth) * 1000) / 10,
      on_track: projected <= budget,
    },
  };
}
