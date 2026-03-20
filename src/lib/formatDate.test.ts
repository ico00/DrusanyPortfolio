import { describe, expect, it } from "vitest";
import {
  formatAdminCaptureDate,
  formatBlogDate,
  formatPortfolioDateLong,
} from "./formatDate";

describe("formatBlogDate", () => {
  it("formats YYYY-MM-DD as dd. mm. yyyy.", () => {
    expect(formatBlogDate("2025-03-20")).toBe("20. 03. 2025.");
  });

  it("returns original when invalid", () => {
    expect(formatBlogDate("")).toBe("");
    expect(formatBlogDate("bad")).toBe("bad");
  });
});

describe("formatPortfolioDateLong", () => {
  it("formats ISO date with en-US long month", () => {
    const s = formatPortfolioDateLong("2025-03-20T12:00:00.000Z");
    expect(s).toMatch(/March/);
    expect(s).toMatch(/2025/);
  });
});

describe("formatAdminCaptureDate", () => {
  it("includes date and 24h-style clock", () => {
    const s = formatAdminCaptureDate("2025-06-15T14:30:00.000Z");
    expect(s).toMatch(/2025/);
    expect(s).toMatch(/\d{1,2}:\d{2}/);
  });
});
