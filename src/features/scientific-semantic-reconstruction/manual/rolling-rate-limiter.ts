export type RollingRateLimiterSnapshot = {
  maxRequests: number;
  windowMs: number;
  totalStarts: number;
  retainedStarts: string[];
};

export class RollingWindowRequestLimiter {
  private readonly starts: number[];
  private totalStarts: number;

  constructor(private readonly options: {
    maxRequests: number;
    windowMs: number;
    safetyMarginMs?: number;
    initialStarts?: string[];
    initialTotalStarts?: number;
    nowMs?: () => number;
    sleepImpl?: (milliseconds: number) => Promise<void>;
  }) {
    if (!Number.isInteger(options.maxRequests) || options.maxRequests < 1) throw new Error("RATE_LIMIT_MAX_REQUESTS_INVALID");
    if (!Number.isFinite(options.windowMs) || options.windowMs < 1) throw new Error("RATE_LIMIT_WINDOW_INVALID");
    const now = this.now();
    this.starts = (options.initialStarts ?? []).map((item) => Date.parse(item)).filter((item) => Number.isFinite(item) && now - item < options.windowMs).sort((a, b) => a - b);
    this.totalStarts = Math.max(this.starts.length, options.initialTotalStarts ?? this.starts.length);
  }

  private now() { return this.options.nowMs?.() ?? Date.now(); }

  private async sleep(milliseconds: number) {
    if (this.options.sleepImpl) await this.options.sleepImpl(milliseconds);
    else await new Promise<void>((resolve) => setTimeout(resolve, milliseconds));
  }

  async acquire(): Promise<void> {
    for (;;) {
      const now = this.now();
      while (this.starts.length && now - this.starts[0] >= this.options.windowMs) this.starts.shift();
      if (this.starts.length < this.options.maxRequests) {
        this.starts.push(now);
        this.totalStarts += 1;
        return;
      }
      const waitMs = Math.max(1, this.options.windowMs - (now - this.starts[0]) + (this.options.safetyMarginMs ?? 250));
      await this.sleep(waitMs);
    }
  }

  snapshot(): RollingRateLimiterSnapshot {
    return {
      maxRequests: this.options.maxRequests,
      windowMs: this.options.windowMs,
      totalStarts: this.totalStarts,
      retainedStarts: this.starts.map((item) => new Date(item).toISOString()),
    };
  }
}
