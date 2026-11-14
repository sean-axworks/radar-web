"use client";

import { useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import Link from "next/link";
import { ArrowUpRight, BriefcaseBusiness, CalendarDays, Landmark } from "lucide-react";
import { channels, formatDeadline, noticePath, type Notice, type NoticeKind } from "@/lib/notices";

const kinds = ["grants", "bids"] as const;

export function NoticeTabs({ notices }: { notices: Record<NoticeKind, Notice[]> }) {
  const [active, setActive] = useState<NoticeKind>("grants");
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);

  function moveTab(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === "Home" ? 0 : event.key === "End" ? 1 : 1 - index;
    setActive(kinds[next]);
    tabs.current[next]?.focus();
  }

  return (
    <div className="card notice-browser">
      <div className="tab-bar" role="tablist" aria-label="공고 유형">
        {kinds.map((kind, index) => {
          const Icon = kind === "grants" ? Landmark : BriefcaseBusiness;
          return (
            <button key={kind} type="button" role="tab" id={`tab-${kind}`}
              aria-controls={`panel-${kind}`} aria-selected={active === kind}
              tabIndex={active === kind ? 0 : -1}
              ref={(element) => { tabs.current[index] = element; }}
              onKeyDown={(event) => moveTab(event, index)} onClick={() => setActive(kind)}>
              <Icon size={17} aria-hidden="true" /> {channels[kind].name}
              <span className="tab-count">{notices[kind].length}</span>
            </button>
          );
        })}
      </div>
      {kinds.map((kind) => (
        <div key={kind} role="tabpanel" id={`panel-${kind}`} aria-labelledby={`tab-${kind}`} hidden={active !== kind}>
          <ul className="notice-list">
            {notices[kind].map((notice) => (
              <li key={notice.id}>
                <Link className="notice-row" href={noticePath(kind, notice.id)}>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`category-pill ${kind}`}>{notice.category}</span>
                      {notice.is_demo && <span className="demo-label">예시</span>}
                    </div>
                    <h3>{notice.title}</h3>
                    <p>{notice.agency}</p>
                    <div className="notice-meta">
                      <strong>{notice.budget_text}</strong>
                      <span><CalendarDays size={14} aria-hidden="true" />{notice.deadline ? <time dateTime={notice.deadline}>{formatDeadline(notice.deadline)}</time> : "마감 원문 확인"}</span>
                    </div>
                  </div>
                  <ArrowUpRight className="card-arrow shrink-0" size={18} aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
