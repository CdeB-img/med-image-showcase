import { describe, expect, it } from "vitest";
import { RollingWindowRequestLimiter } from "../manual/rolling-rate-limiter";

describe("SEM-001R2 rolling request limiter", () => {
  it("never admits a sixth start in a rolling 60-second window", async () => {
    let now = Date.parse("2026-08-11T10:00:00.000Z");
    const waits: number[] = [];
    const limiter = new RollingWindowRequestLimiter({
      maxRequests: 5,
      windowMs: 60_000,
      safetyMarginMs: 250,
      nowMs: () => now,
      sleepImpl: async (milliseconds) => { waits.push(milliseconds); now += milliseconds; },
    });
    for (let index = 0; index < 6; index += 1) await limiter.acquire();
    expect(waits).toEqual([60_250]);
    expect(limiter.snapshot()).toMatchObject({ maxRequests: 5, windowMs: 60_000, totalStarts: 6 });
  });

  it("restores recent starts when a campaign resumes", async () => {
    let now = Date.parse("2026-08-11T10:00:50.000Z");
    const waits: number[] = [];
    const limiter = new RollingWindowRequestLimiter({
      maxRequests: 1,
      windowMs: 60_000,
      initialStarts: ["2026-08-11T10:00:00.000Z"],
      initialTotalStarts: 8,
      nowMs: () => now,
      sleepImpl: async (milliseconds) => { waits.push(milliseconds); now += milliseconds; },
    });
    await limiter.acquire();
    expect(waits).toEqual([10_250]);
    expect(limiter.snapshot().totalStarts).toBe(9);
  });
});
