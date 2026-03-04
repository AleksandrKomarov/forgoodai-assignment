import { fetchWidget } from "./api";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

afterEach(() => {
  mockFetch.mockReset();
});

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("fetchWidget", () => {
  it("fetches from the correct URL", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ ok: true }));

    await fetchWidget("spend-kpi");

    const url = new URL(mockFetch.mock.calls[0]![0] as string);
    expect(url.pathname).toBe("/api/v1/widgets/spend-kpi");
  });

  it("appends query params", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ ok: true }));

    await fetchWidget("run-volume", { start: "2026-01-01", end: "2026-01-31" });

    const url = new URL(mockFetch.mock.calls[0]![0] as string);
    expect(url.searchParams.get("start")).toBe("2026-01-01");
    expect(url.searchParams.get("end")).toBe("2026-01-31");
  });

  it("returns parsed JSON on success", async () => {
    const data = { spend_usd: 1234, delta_pct: 5.2 };
    mockFetch.mockResolvedValue(jsonResponse(data));

    const result = await fetchWidget<{ spend_usd: number; delta_pct: number }>("spend-kpi");

    expect(result).toEqual(data);
  });

  it("throws on non-ok response", async () => {
    mockFetch.mockResolvedValue(new Response(null, { status: 500 }));

    await expect(fetchWidget("spend-kpi")).rejects.toThrow("API error: 500");
  });

  it("works without params", async () => {
    mockFetch.mockResolvedValue(jsonResponse([]));

    await fetchWidget("monthly-spend");

    const url = new URL(mockFetch.mock.calls[0]![0] as string);
    expect(url.search).toBe("");
  });
});
