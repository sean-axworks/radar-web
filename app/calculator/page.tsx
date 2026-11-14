import type { Metadata } from "next";
import { BudgetCalculator } from "@/components/budget-calculator";

export const metadata: Metadata = {
  title: "사업비 계산기",
  description: "정부지원금, 민간부담금, 연구수당과 간접비 한도를 시뮬레이션하고 계산서를 엑셀로 다운로드하세요.",
};

export default function Page() {
  return (
    <div className="container inner-page">
      <div className="page-intro">
        <h1>사업비 계산기</h1>
        <p>총사업비 또는 정부지원금을 입력해 필요한 부담금과 비용 한도를 확인하세요.</p>
      </div>
      <BudgetCalculator />
    </div>
  );
}
