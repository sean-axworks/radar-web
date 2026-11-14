import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container inner-page">
      <div className="card detail-card">
        <h1>페이지를 찾을 수 없습니다</h1>
        <p className="detail-agency">주소를 확인하거나 홈에서 공고를 찾아보세요.</p>
        <Link className="button button-primary mt-6" href="/">홈으로 돌아가기</Link>
      </div>
    </div>
  );
}
