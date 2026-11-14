export type BudgetInputs = {
  mode: "total" | "government";
  amount: string;
  government: string;
  cash: string;
  labor: string;
  indirect: string;
  directBase: string;
};

export type BudgetValues = {
  total: number;
  government: number;
  privateTotal: number;
  cash: number;
  inKind: number;
  labor: number;
  allowance: number;
  directBase: number | null;
  indirect: number | null;
};

type BudgetResult =
  | { values: BudgetValues; error?: never }
  | { values: null; error: string };

const rateScale = 10000n;
export const disclaimer = "본 계산기는 참고용 시뮬레이터이며, 최종 제출 전 반드시 공고 원문 및 IRIS/e나라도움 기준과 대조하세요.";
export const vatNote = "부가세를 제외한 금액을 입력하세요. 부가세 인정 여부는 공고와 사업비 지침을 확인하세요.";

function won(input: string) {
  const normalized = input.replaceAll(",", "").trim();
  const value = Number(normalized);
  return /^\d+$/.test(normalized) && Number.isSafeInteger(value) ? BigInt(value) : null;
}

function basisPoints(input: string) {
  const value = Number(input);
  return /^\d+(\.\d{1,2})?$/.test(input) && value <= 100
    ? BigInt(Math.round(value * 100))
    : null;
}

function ceilDivide(numerator: bigint, denominator: bigint) {
  return (numerator + denominator - 1n) / denominator;
}

export function calculateBudget(input: BudgetInputs): BudgetResult {
  const amount = won(input.amount);
  const govRate = basisPoints(input.government);
  const cashRate = basisPoints(input.cash);
  const laborRate = basisPoints(input.labor);
  const indirectRate = basisPoints(input.indirect);
  const directBase = input.directBase.trim() ? won(input.directBase) : null;

  if (amount === null) return { values: null, error: "사업비를 원 단위의 0 이상 정수로 입력하세요." };
  if (govRate === null || cashRate === null || laborRate === null || indirectRate === null) {
    return { values: null, error: "비율은 0~100% 범위에서 소수점 둘째 자리까지 입력하세요." };
  }
  if (input.mode === "government" && govRate === 0n) {
    return { values: null, error: "정부지원금 기준에서는 0%보다 큰 정부지원비율을 입력하세요." };
  }
  const total = input.mode === "total" ? amount : ceilDivide(amount * rateScale, govRate);
  if (total > BigInt(Number.MAX_SAFE_INTEGER)) {
    return { values: null, error: "총사업비가 계산 가능한 범위를 초과했습니다." };
  }
  if ((input.directBase.trim() && directBase === null) || (directBase !== null && directBase > total)) {
    return { values: null, error: "간접비 산정 기준액은 0원부터 총사업비까지 입력하세요." };
  }
  const government = input.mode === "government" ? amount : total * govRate / rateScale;
  const privateTotal = total - government;
  const cash = ceilDivide(privateTotal * cashRate, rateScale);
  const labor = total * laborRate / rateScale;

  return {
    values: {
      total: Number(total),
      government: Number(government),
      privateTotal: Number(privateTotal),
      cash: Number(cash),
      inKind: Number(privateTotal - cash),
      labor: Number(labor),
      allowance: Number(labor / 5n),
      directBase: directBase === null ? null : Number(directBase),
      indirect: directBase === null ? null : Number(directBase * indirectRate / rateScale),
    },
  };
}
