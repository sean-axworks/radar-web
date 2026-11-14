import assert from "node:assert/strict";
import { test } from "node:test";
import { trackCalculatorUse, trackEvent, validGaId } from "../lib/analytics.ts";

test("accepts GA4 measurement IDs and rejects unsafe inline input", () => {
  assert.equal(validGaId(" G-TEST123 "), "G-TEST123");
  assert.equal(validGaId(undefined), undefined);
  assert.equal(validGaId("G-ABC</script>"), undefined);
});

test("event dispatch is optional and calculator use is once per tab per notice", () => {
  assert.doesNotThrow(() => trackEvent("excel_download", { total_budget: 100 }));
  const events = [];
  const storage = new Map();
  globalThis.window = { sessionStorage: { getItem: storage.get.bind(storage), setItem: storage.set.bind(storage) } };
  try {
    const notice = { notice_id: "iris-42", notice_title: "실증 지원" };
    trackCalculatorUse("/grants/iris-42/", notice);
    assert.equal(storage.size, 0);
    window.gtag = (...args) => events.push(args);
    trackCalculatorUse("/grants/iris-42/", notice);
    trackCalculatorUse("/grants/iris-42/", notice);
    trackCalculatorUse("/calculator/", { notice_id: "(none)", notice_title: "범용 계산기" });
    trackEvent("excel_download", { ...notice, total_budget: 100 });
    assert.deepEqual(events, [
      ["event", "calculator_used", notice],
      ["event", "calculator_used", { notice_id: "(none)", notice_title: "범용 계산기" }],
      ["event", "excel_download", { ...notice, total_budget: 100 }],
    ]);
  } finally {
    delete globalThis.window;
  }
});
