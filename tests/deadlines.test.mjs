import assert from "node:assert/strict";
import { test } from "node:test";
import { deadlineCutoff, latestDeadlinePassed } from "../lib/deadlines.ts";

test("a date-only notice stays open through the Korean calendar day", () => {
  const cutoff = deadlineCutoff("2026-11-15");
  assert.equal(cutoff, Date.parse("2026-11-16T00:00:00+09:00"));
  assert.equal(latestDeadlinePassed([cutoff], cutoff - 1), 0);
  assert.equal(latestDeadlinePassed([cutoff], cutoff), cutoff);
});

test("uses explicit timestamps and leaves unknown deadlines visible", () => {
  const cutoff = Date.parse("2026-09-30T15:00:00+09:00");
  assert.equal(deadlineCutoff("2026-09-30T15:00:00+09:00"), cutoff);
  assert.equal(deadlineCutoff("2026-09-30T15:00:00"), cutoff);
  assert.equal(deadlineCutoff(null), null);
  assert.equal(deadlineCutoff("2026-02-30"), null);
  assert.equal(deadlineCutoff("미정"), null);
});
