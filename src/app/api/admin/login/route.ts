import { NextRequest, NextResponse } from 'next/server'

// Edge runtime 제거 - Node.js runtime 사용

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json() as { password?: string }

    if (!password) {
      return NextResponse.json({ success: false, error: '비밀번호를 입력해주세요.' })
    }

    // 환경변수에서 ADMIN_PASSWORD 가져오기
    const adminPassword = process.env.ADMIN_PASSWORD

    if (!adminPassword) {
      console.error('ADMIN_PASSWORD not configured')
      return NextResponse.json({ success: false, error: '서버 설정 오류' })
    }

    if (password === adminPassword) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ success: false, error: '비밀번호가 올바르지 않습니다.' })
    }
  } catch (error) {
    console.error('Admin login error:', error)
    return NextResponse.json({ success: false, error: '서버 오류가 발생했습니다.' })
  }
}
