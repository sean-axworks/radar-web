"use client";

import { useId, useState } from "react";
import { Calculator, Download, Info } from "lucide-react";
import { calculateBudget, disclaimer, vatNote, type BudgetInputs } from "@/lib/budget";

const formatter = new Intl.NumberFormat("ko-KR");
const displayWon = (value: number) => `${formatter.format(value)}원`;

type Preset = {
  amount: number;
  government: number;
  cash: number;
  title: string;
  bid: boolean;
};

export function BudgetCalculator({ preset }: { preset?: Preset }) {
  const headingId = useId();
  const errorId = useId();
  const [input, setInput] = useState<BudgetInputs>({
    mode: preset && !preset.bid ? "government" : "total",
    amount: formatter.format(preset?.amount ?? 100000000),
    government: String(preset?.government ?? 75),
    cash: String(preset?.cash ?? 10),
    labor: "40",
    indirect: "5",
    directBase: "",
  });
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const { values, error } = calculateBudget(input);
  const exceedsCap = preset && !preset.bid && values && values.government > preset.amount;

  function update(key: Exclude<keyof BudgetInputs, "mode">, value: string) {
    setInput((current) => ({ ...current, [key]: value }));
  }

  function changeMode(mode: BudgetInputs["mode"]) {
    if (mode === input.mode) return;
    setInput((current) => ({
      ...current,
      mode,
      amount: values ? formatter.format(values[mode]) : current.amount,
    }));
  }

  async function exportWorkbook() {
    if (!values || exporting) return;
    setExporting(true);
    setExportError("");
    try {
      const { downloadBudget } = await import("@/lib/budget-workbook");
      await downloadBudget(input, values, preset?.title);
    } catch {
      setExportError("엑셀 파일을 생성하지 못했습니다. 다시 시도해 주세요.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <section className="calculator" aria-labelledby={headingId}>
      <h2 id={headingId} className="calculator-heading"><Calculator size={23} aria-hidden="true" /> 사업비 시뮬레이션</h2>
      {preset && <p className="calculator-note">
        {preset.bid
          ? "입찰 추정가격을 총사업비에 적용했습니다. 지원비율 100%·현금비율 0%는 비교 계산용 가정이며, 실제 계약 조건은 입찰 원문을 확인하세요."
          : "등록된 지원금 상한과 부담 비율을 기본값으로 적용했습니다."}
      </p>}
      <div className="calculator-grid">
        <div className="card calculator-panel">
          <h3>계산 조건</h3>
          <fieldset className="mode-fieldset">
            <legend>입력 기준</legend>
            <div className="mode-switch">
              <label><input type="radio" name={headingId} checked={input.mode === "total"} onChange={() => changeMode("total")} />총사업비 기준</label>
              <label><input type="radio" name={headingId} checked={input.mode === "government"} onChange={() => changeMode("government")} />정부지원금 기준</label>
            </div>
          </fieldset>
          <label className="field">
            <span>{input.mode === "total" ? "총사업비" : "정부지원금"}</span>
            <span className="input-wrap"><input inputMode="numeric" value={input.amount}
              onChange={(event) => update("amount", event.target.value)} aria-describedby={error ? errorId : undefined} /><span>원</span></span>
          </label>
          <div className="rate-grid">
            {([
              ["government", "정부지원비율"],
              ["cash", "민간현금비율"],
              ["labor", "인건비 비중"],
              ["indirect", "간접비율"],
            ] as const).map(([key, label]) => (
              <label className="field" key={key}>
                <span>{label}</span>
                <span className="input-wrap"><input inputMode="decimal" value={input[key]}
                  onChange={(event) => update(key, event.target.value)} /><span>%</span></span>
              </label>
            ))}
          </div>
          <label className="field">
            <span>간접비 산정 기준액 <small>선택</small></span>
            <span className="input-wrap"><input inputMode="numeric" placeholder="공고 기준 직접비" value={input.directBase}
              onChange={(event) => update("directBase", event.target.value)} /><span>원</span></span>
          </label>
          <p className="field-help">민간현금비율은 민간부담금 대비입니다. 간접비율 5%는 예시이며, 공고에 따른 직접비와 비율을 입력하세요.</p>
          {error && <p id={errorId} className="field-error" role="status">{error}</p>}
          {exceedsCap && <p className="field-error" role="status">정부지원금이 공고 상한 {displayWon(preset.amount)}을 초과합니다.</p>}
        </div>
        <div className="card calculator-panel result-panel">
          <h3>계산 결과</h3>
          <div className="result-total">
            <span>총사업비</span>
            <strong>{values ? displayWon(values.total) : "—"}</strong>
          </div>
          <dl className="result-list">
            {([
              ["정부지원금", values?.government],
              ["민간부담금", values?.privateTotal],
              ["민간현금 최소액", values?.cash],
              ["민간현물", values?.inKind],
              ["인건비", values?.labor],
              ["연구수당 상한 (인건비의 20%)", values?.allowance],
              ["간접비 한도", values?.indirect],
            ] as const).map(([label, value]) => (
              <div key={label}><dt>{label}</dt><dd>{value == null ? (value === null && values ? "기준액 입력 필요" : "—") : displayWon(value)}</dd></div>
            ))}
          </dl>
          <button className="button button-primary export-button" type="button" disabled={!values || exporting}
            onClick={exportWorkbook}><Download size={18} aria-hidden="true" />
            {exporting ? "엑셀 파일 생성 중…" : "제출용 엑셀(.xlsx) 내보내기"}
          </button>
          {exportError && <p className="field-error" role="alert">{exportError}</p>}
        </div>
      </div>
      <div className="calculator-disclaimer">
        <Info size={19} aria-hidden="true" />
        <div><p>{vatNote}</p><p>{disclaimer}</p></div>
      </div>
    </section>
  );
}
