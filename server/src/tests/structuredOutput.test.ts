import { describe, expect, it } from "vitest";
import { extractedDetailsSchema } from "./structuredOutput.schema.js";

describe("extractedDetailsSchema", () => {
  it("accepts valid extracted details", () => {
    const result = extractedDetailsSchema.safeParse({
      name: "Priya Sharma",
      date: "2026-11-15",
      amount: 12500,
    });

    expect(result.success).toBe(true);
  });

  it("accepts null for missing values", () => {
    const result = extractedDetailsSchema.safeParse({
      name: "Priya Sharma",
      date: null,
      amount: null,
    });

    expect(result.success).toBe(true);
  });

  it("rejects an impossible calendar date", () => {
    const result = extractedDetailsSchema.safeParse({
      name: "Priya Sharma",
      date: "2026-02-31",
      amount: 12500,
    });

    expect(result.success).toBe(false);
  });

  it("rejects a string amount", () => {
    const result = extractedDetailsSchema.safeParse({
      name: "Priya Sharma",
      date: "2026-11-15",
      amount: "12500",
    });

    expect(result.success).toBe(false);
  });

  it("rejects unexpected fields", () => {
    const result = extractedDetailsSchema.safeParse({
      name: "Priya Sharma",
      date: "2026-11-15",
      amount: 12500,
      extra: "unexpected",
    });

    expect(result.success).toBe(false);
  });
});