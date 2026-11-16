import grants from "@/data/grants.json";
import bids from "@/data/bids.json";

export type NoticeKind = "grants" | "bids";
export type Notice = {
  id: string;
  title: string;
  agency: string;
  category: string;
  deadline: string | null;
  budget_text: string;
  max_grant_amount: number | null;
  /** 지원금 / 총사업비: 0~1 분수 (민간·현물 지원 포함). */
  gov_ratio: number | null;
  /** 현금 최소액 / 민간부담금(지방비 등 대응부담 포함): 0~1 분수. */
  cash_ratio: number | null;
  summary_3lines: string[];
  source_url: string;
  created_at: string;
  is_demo?: boolean;
  source_is_listing?: boolean;
};

export const notices: Record<NoticeKind, Notice[]> = { grants, bids };
export const channels = {
  grants: { name: "GrantRadar", label: "국책과제", url: "https://t.me/grantradar_kr" },
  bids: { name: "BidRadar", label: "공공입찰", url: "https://t.me/bidradar_kr" },
} as const;

export const noticePath = (kind: NoticeKind, id: string) => `/${kind}/${id}/`;

export function formatDeadline(value: string | null) {
  if (value === null) return "원문 확인";
  const [date, time] = value.split("T");
  return date.replaceAll("-", ".") + (time ? ` ${time.slice(0, 5)} KST` : "");
}
