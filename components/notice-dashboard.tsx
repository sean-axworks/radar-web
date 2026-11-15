"use client";

import Link from "next/link";
import { ArrowUpRight, Building2, FileText } from "lucide-react";
import { useSyncExternalStore, type ReactNode } from "react";
import { NoticeTabs } from "@/components/notice-tabs";
import { deadlineCutoff, latestDeadlinePassed } from "@/lib/deadlines";
import { channels, formatDeadline, noticePath, notices } from "@/lib/notices";

const grantsWithCutoffs = notices.grants.map((notice) => ({
  notice,
  cutoff: deadlineCutoff(notice.deadline),
}));
const cutoffs = grantsWithCutoffs.flatMap(({ cutoff }) => cutoff === null ? [] : [cutoff]);

function getSnapshot() {
  return latestDeadlinePassed(cutoffs, Date.now());
}

function subscribe(onChange: () => void) {
  const timer = window.setInterval(onChange, 1000);
  window.addEventListener("focus", onChange);
  return () => {
    window.clearInterval(timer);
    window.removeEventListener("focus", onChange);
  };
}

export function NoticeDashboard({ builtAt, children }: { builtAt: number; children: ReactNode }) {
  const latestPassed = useSyncExternalStore(subscribe, getSnapshot, () => latestDeadlinePassed(cutoffs, builtAt));
  const openGrants = grantsWithCutoffs
    .filter(({ cutoff }) => cutoff === null || cutoff > latestPassed)
    .map(({ notice }) => notice);
  const highlights = [
    { kind: "grants", notice: openGrants[0], icon: Building2 },
    { kind: "bids", notice: notices.bids[0], icon: FileText },
  ] as const;

  return (
    <>
      <section aria-labelledby="highlights">
        <div className="section-heading">
          <h2 id="highlights">오늘의 주요 공고</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {highlights.map(({ kind, notice, icon: Icon }) => notice && (
            <Link className="highlight card" key={kind} href={noticePath(kind, notice.id)}>
              <div className="flex items-start justify-between gap-4">
                <span className={`tile-icon ${kind}`}><Icon size={21} aria-hidden="true" /></span>
                <ArrowUpRight className="card-arrow" size={19} aria-hidden="true" />
              </div>
              <div className="highlight-info">
                <span className={`kind-label ${kind}`}>{channels[kind].label}</span>
                <h3>{notice.title}</h3>
                <p>{notice.agency}</p>
              </div>
              <div className="highlight-meta">
                <strong>{notice.budget_text}</strong>
                {notice.deadline ? <time dateTime={notice.deadline}>마감 {formatDeadline(notice.deadline)}</time> : <span>마감 원문 확인</span>}
              </div>
            </Link>
          ))}
        </div>
      </section>
      <div className="dashboard-columns">
        <section id="notices" aria-labelledby="notices-heading">
          <div className="section-heading"><h2 id="notices-heading">공고 둘러보기</h2></div>
          <NoticeTabs notices={{ ...notices, grants: openGrants }} />
        </section>
        {children}
      </div>
    </>
  );
}
