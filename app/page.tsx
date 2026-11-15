import Link from "next/link";
import { ArrowDown, ArrowRight, ArrowUpRight, Calculator, Radio, Send } from "lucide-react";
import { channels } from "@/lib/notices";
import { NoticeDashboard } from "@/components/notice-dashboard";
import { TrackedSourceLink } from "@/components/tracked-source-link";

function getBuildTime() {
  return Date.now();
}

export default function Home() {
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
        <NoticeDashboard builtAt={getBuildTime()}>
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
        </NoticeDashboard>
      </div>
    </>
  );
}
