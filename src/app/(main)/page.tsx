import { redirect } from 'next/navigation'

// (main) 레이아웃 그룹의 기본 페이지는 /gallery로 리다이렉트
export default function MainHomePage() {
  redirect('/gallery')
}
