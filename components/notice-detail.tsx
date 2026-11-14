import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, CalendarDays } from "lucide-react";
import { BudgetCalculator } from "@/components/budget-calculator";
import { channels, formatDeadline, notices, type NoticeKind } from "@/lib/notices";

export type DetailProps = { params: Promise<{ id: string }> };

function getNotice(kind: NoticeKind, id: string) {
  const notice = notices[kind].find((entry) => entry.id === id);
  if (!notice) notFound();
  return notice;
}

export async function noticeMetadata(kind: NoticeKind, { params }: DetailProps): Promise<Metadata> {
  const { id } = await params;
  const notice = getNotice(kind, id);
  return {
    title: `${notice.title} · ${channels[kind].name}`,
    description: notice.summary_3lines.join(" "),
  };
}

export async function NoticeDetail({ kind, params }: DetailProps & { kind: NoticeKind }) {
  const { id } = await params;
  const notice = getNotice(kind, id);
  return (
    <div className="container inner-page">
      <Link className="back-link" href="/#notices"><ArrowLeft size={16} aria-hidden="true" /> 공고 목록</Link>
      <article className="card detail-card">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`category-pill ${kind}`}>{channels[kind].name}</span>
          <span className="category-pill">{notice.category}</span>
          {notice.is_demo && <span className="demo-label">예시 공고</span>}
        </div>
        <h1>{notice.title}</h1>
        <p className="detail-agency">{notice.agency}</p>
        <div className="detail-meta">
          <strong>{notice.budget_text}</strong>
          <span><CalendarDays size={16} aria-hidden="true" /> 마감 <time dateTime={notice.deadline}>{formatDeadline(notice.deadline)}</time></span>
        </div>
        <h2>공고 3줄 요약</h2>
        <ul className="summary-list">
          {notice.summary_3lines.map((line) => <li key={line}>{line}</li>)}
        </ul>
        <a className="button button-outline" href={notice.source_url} target="_blank" rel="noopener noreferrer">
          {notice.source_is_listing ? "공식 공고 사이트" : "공고 원문 보기"} <ArrowUpRight size={17} aria-hidden="true" />
        </a>
      </article>
      <BudgetCalculator preset={{
        amount: notice.max_grant_amount,
        government: Number((notice.gov_ratio * 100).toFixed(2)),
        cash: Number((notice.cash_ratio * 100).toFixed(2)),
        title: notice.title,
        bid: kind === "bids",
      }} />
    </div>
  );
}
