import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // 최소 테스트: 요청만 받고 응답
    return NextResponse.json({
      success: true,
      message: '테스트 성공',
      received: body
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
