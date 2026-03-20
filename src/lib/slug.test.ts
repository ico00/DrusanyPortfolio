import { describe, expect, it } from "vitest";
import {
  generateBlogSlug,
  isValidBlogSlug,
  normalizeBlogSlug,
  slugify,
} from "./slug";

describe("slugify", () => {
  it("lowercases and replaces spaces", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });
});

describe("generateBlogSlug", () => {
  it("prefixes with yymmdd", () => {
    expect(generateBlogSlug("Advent", "2025-12-28")).toBe("251228-advent");
  });
});

describe("isValidBlogSlug", () => {
  it("accepts yymmdd-title", () => {
    expect(isValidBlogSlug("251228-advent-2025")).toBe(true);
  });

  it("rejects invalid", () => {
    expect(isValidBlogSlug("")).toBe(false);
    expect(isValidBlogSlug("no-date-prefix")).toBe(false);
  });
});

describe("normalizeBlogSlug", () => {
  it("keeps valid slug", () => {
    expect(
      normalizeBlogSlug("251228-foo", "Ignored", "2025-12-28")
    ).toBe("251228-foo");
  });

  it("generates when slug invalid", () => {
    expect(normalizeBlogSlug("bad", "Title", "2025-01-15")).toMatch(/^250115-/);
  });
});
