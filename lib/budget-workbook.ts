import ExcelJS from "exceljs";
import { disclaimer, vatNote, type BudgetInputs, type BudgetValues } from "./budget";

export async function downloadBudget(input: BudgetInputs, values: BudgetValues, title?: string) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("사업비 시뮬레이션");
  sheet.columns = [{ width: 31 }, { width: 24 }, { width: 73 }];
  sheet.addRows([
    ["항목", "값", "기준 / 비고"],
    ["공고", title ?? "범용 계산기"],
    ["입력 기준", input.mode === "total" ? "총사업비" : "지원금"],
    ["지원비율 (%)", Number(input.government), "총사업비 대비"],
    ["민간현금비율 (%)", Number(input.cash), "민간부담금 대비"],
    ["인건비 비중 (%)", Number(input.labor), "총사업비 대비"],
    ["간접비율 (%)", Number(input.indirect), "공고 기준 직접비 대비"],
    [],
    ["총사업비 (원)", values.total],
    ["지원금 (원)", values.government],
    ["민간부담금 (원)", values.privateTotal],
    ["민간현금 최소액 (원)", values.cash],
    ["민간현물 (원)", values.inKind, "현금을 최소액으로 계상한 경우"],
    ["인건비 (원)", values.labor],
    ["연구수당 상한 (원)", values.allowance, "인건비의 20% 가정"],
    ["간접비 산정 기준액 (원)", values.directBase ?? "미입력"],
    ["간접비 한도 (원)", values.indirect ?? "미산정"],
    [],
    ["부가세 안내", null, vatNote],
    ["제출 전 확인", null, disclaimer],
  ]);
  const heading = sheet.getRow(1);
  heading.font = { bold: true, color: { argb: "FFFFFFFF" } };
  heading.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF121E3A" } };
  for (let row = 9; row <= 17; row++) sheet.getCell(row, 2).numFmt = "#,##0";
  for (const row of [2, 19, 20]) {
    sheet.getRow(row).alignment = { wrapText: true, vertical: "middle" };
    sheet.getRow(row).height = 36;
  }
  sheet.mergeCells("B2:C2");

  const bytes = await workbook.xlsx.writeBuffer();
  const blob = new Blob([bytes], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "Radar-사업비-계산서.xlsx";
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
