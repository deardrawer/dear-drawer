import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'
import { isAdminAccountViewer } from '@/lib/siteAdmin'

export const dynamic = 'force-dynamic'

/** 관리자 페이지 — 관리자 계정이 등록돼 있으면 그 계정으로 로그인한 사람에게만 (아니면 없는 페이지) */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  if (!(await isAdminAccountViewer())) notFound()
  return <>{children}</>
}
