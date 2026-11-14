import Link from "next/link";
import { ArrowDown, ArrowRight, ArrowUpRight, Building2, Calculator, FileText, Radio, Send } from "lucide-react";
import { channels, formatDeadline, noticePath, notices } from "@/lib/notices";
import { NoticeTabs } from "@/components/notice-tabs";
import { TrackedSourceLink } from "@/components/tracked-source-link";

export default function Home() {
  const highlights = [
    { kind: "grants", notice: notices.grants[0], icon: Building2 },
    { kind: "bids", notice: notices.bids[0], icon: FileText },
  ] as const;

  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <div className="container hero-inner">
          <div className="hero-copy">
            <p className="hero-kicker"><Radio size={15} aria-hidden="true" /> 국책과제 · 공공입찰 통합 포털</p>
            <h1 id="hero-title">지원사업과 공공입찰,<br /><span>한곳에서 찾으세요.</span></h1>
            <p className="hero-description">공고를 살펴보고, 지원금과 우리 회사의 부담금을 미리 계산하세요.</p>
            <div className="flex flex-wrap gap-3">
              <a className="button button-primary" href="#notices">공고 둘러보기 <ArrowDown size={17} aria-hidden="true" /></a>
              <Link className="button button-ghost" href="/calculator/"><Calculator size={17} aria-hidden="true" /> 사업비 계산기</Link>
            </div>
          </div>
          <div className="radar-art" aria-hidden="true">
            <div className="radar-dial">
              <i className="ring ring-one" /><i className="ring ring-two" /><i className="ring ring-three" />
              <i className="radar-center" /><i className="blip blip-one" /><i className="blip blip-two" /><i className="blip blip-three" />
            </div>
            <span className="radar-label radar-grant"><i /> GrantRadar</span>
            <span className="radar-label radar-bid"><i /> BidRadar</span>
          </div>
        </div>
      </section>

      <div className="container dashboard">
        <section aria-labelledby="highlights">
          <div className="section-heading">
            <h2 id="highlights">오늘의 주요 공고</h2>
            <span className="sample-note">샘플 데이터</span>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {highlights.map(({ kind, notice, icon: Icon }) => (
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
            <NoticeTabs notices={notices} />
          </section>
          <aside className="dashboard-aside" aria-label="채널 및 계산기">
            <div className="card side-card">
              <span className="tile-icon grants"><Send size={19} aria-hidden="true" /></span>
              <h2>텔레그램 공고 알림</h2>
              <p>관심 있는 공고를 채널에서 받아보세요.</p>
              {Object.values(channels).map((channel) => (
                <TrackedSourceLink className="channel-link" key={channel.name} href={channel.url} sourceType="telegram_channel">
                  {channel.name} <ArrowUpRight size={16} aria-hidden="true" />
                </TrackedSourceLink>
              ))}
            </div>
            <Link className="card side-card side-calculator" href="/calculator/">
              <Calculator size={23} aria-hidden="true" />
              <h2>사업비 계산기</h2>
              <p>정부지원금과 민간부담금을 계산하세요.</p>
              <span>계산하기 <ArrowRight size={16} aria-hidden="true" /></span>
            </Link>
          </aside>
        </div>
      </div>
    </>
  );
}
