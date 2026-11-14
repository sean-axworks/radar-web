type EventName = "calculator_used" | "excel_download" | "source_link_click";
type EventParams = Record<string, string | number>;

declare global {
  interface Window {
    gtag?: (command: "event", name: EventName, params: EventParams) => void;
  }
}

const reportedCalculators = new Set<string>();

export function validGaId(value: string | undefined) {
  const id = value?.trim();
  return id && /^G-[A-Z0-9]+$/.test(id) ? id : undefined;
}

export function trackEvent(name: EventName, params: EventParams) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return false;
  window.gtag("event", name, params);
  return true;
}

export function trackCalculatorUse(path: string, params: EventParams) {
  if (typeof window === "undefined") return;
  const key = `radar:calculator_used:${path}`;
  if (reportedCalculators.has(key)) return;
  try {
    if (window.sessionStorage.getItem(key)) return;
  } catch {
    // Use the in-memory set if browser privacy settings block storage.
  }
  if (!trackEvent("calculator_used", params)) return;
  reportedCalculators.add(key);
  try {
    window.sessionStorage.setItem(key, "1");
  } catch {
    // The in-memory set still deduplicates within the current document.
  }
}
