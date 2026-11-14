import { NoticeDetail, noticeMetadata, type DetailProps } from "@/components/notice-detail";
import { notices } from "@/lib/notices";

export const dynamicParams = false;
export const generateStaticParams = () => notices.grants.map(({ id }) => ({ id }));
export const generateMetadata = (props: DetailProps) => noticeMetadata("grants", props);

export default function Page(props: DetailProps) {
  return <NoticeDetail kind="grants" {...props} />;
}
