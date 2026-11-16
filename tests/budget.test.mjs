import assert from "node:assert/strict";
import { test } from "node:test";
import { applyRatioScenario, calculateBudget } from "../lib/budget.ts";

const inputs = {
  mode: "total",
  amount: "100000000",
  government: "75",
  cash: "10",
  labor: "40",
  indirect: "5",
  directBase: "80000000",
};

test("calculates the contribution split and cost limits in won", () => {
  const { values } = calculateBudget(inputs);
  assert.deepEqual(values, {
    total: 100000000, government: 75000000, privateTotal: 25000000,
    cash: 2500000, inKind: 22500000, labor: 40000000,
    allowance: 8000000, directBase: 80000000, indirect: 4000000,
  });
});

test("rounds the required total and minimum cash upward", () => {
  const { values } = calculateBudget({
    ...inputs, mode: "government", amount: "100", directBase: "",
  });
  assert.equal(values.total, 134);
  assert.equal(values.government, 100);
  assert.equal(values.cash, 4);
  assert.equal(values.inKind, 30);
  assert.equal(values.indirect, null);
});

test("rejects invalid rates, amounts and an indirect base above the total", () => {
  for (const fields of [
    { government: "101" }, { government: "0", mode: "government" },
    { cash: "-1" }, { labor: "1.001" }, { amount: "" }, { amount: "1.5" },
    { directBase: "100000001" }, { indirect: "Infinity" },
  ]) {
    assert.equal(calculateBudget({ ...inputs, ...fields }).values, null);
  }
});

test("accepts zero government support when the amount is the total", () => {
  const { values } = calculateBudget({ ...inputs, government: "0", cash: "100" });
  assert.equal(values.government, 0);
  assert.equal(values.cash, 100000000);
  assert.equal(values.inKind, 0);
});

test("reports exactly which financing fields are missing", () => {
  const result = calculateBudget({ ...inputs, government: "", cash: "" });
  assert.equal(result.values, null);
  assert.match(result.error, /지원비율·민간현금비율을 입력/);
});

test("user-selected full support calculates inkind support with no cash burden", () => {
  const unknown = { ...inputs, mode: "government", amount: "50000000", government: "", cash: "", directBase: "" };
  assert.equal(calculateBudget(unknown).values, null);
  const selected = applyRatioScenario(unknown, "100");
  const { values } = calculateBudget(selected);
  assert.equal(values.total, 50000000);
  assert.equal(values.government, 50000000);
  assert.equal(values.cash, 0);
  assert.equal(unknown.government, "");
  assert.equal(unknown.cash, "");
  assert.equal(applyRatioScenario(unknown, "70").cash, "10");
  assert.equal(applyRatioScenario({ ...unknown, cash: "50" }, "50").cash, "50");
});
