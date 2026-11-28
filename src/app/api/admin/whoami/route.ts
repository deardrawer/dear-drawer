import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/ownerAuth'
import { adminUserIds, verifyAdminPassword } from '@/lib/siteAdmin'

export const dynamic = 'force-dynamic'

/**
 * 관리자 계정 등록 도우미 — 관리자 비밀번호가 맞으면 지금 로그인한 계정 번호를 알려 줌.
 * 계정이 이미 등록돼 있으면(enforced) 번호는 돌려주지 않음.
 */
export async function GET(request: NextRequest) {
  if (!verifyAdminPassword(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const enforced = adminUserIds().length > 0
  if (enforced) return NextResponse.json({ enforced: true })
  const user = await getCurrentUser(request)
  return NextResponse.json({ enforced: false, userId: user?.id ?? null })
}
