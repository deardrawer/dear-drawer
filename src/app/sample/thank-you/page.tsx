import type { Metadata } from "next";
import ThankYouPage from "@/components/thank-you/ThankYouPage";

export const metadata: Metadata = {
  title: "감사장 샘플 | 디어드로어",
  description: "결혼식 감사장 샘플 - 스크롤 인터랙티브 경험",
};

export default function ThankYouSamplePage() {
  return <ThankYouPage />;
}
