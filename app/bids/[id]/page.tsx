import { NoticeDetail, noticeMetadata, type DetailProps } from "@/components/notice-detail";
import { notices } from "@/lib/notices";

export const dynamicParams = false;
export const generateStaticParams = () => notices.bids.map(({ id }) => ({ id }));
export const generateMetadata = (props: DetailProps) => noticeMetadata("bids", props);

export default function Page(props: DetailProps) {
  return <NoticeDetail kind="bids" {...props} />;
}
