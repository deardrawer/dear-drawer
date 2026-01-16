import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'

interface D1Database {
  prepare(query: string): {
    bind(...values: unknown[]): {
      first<T = unknown>(): Promise<T | null>
      run(): Promise<{ meta: { changes: number } }>
      all<T = unknown>(): Promise<{ results?: T[] }>
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { requestId } = await request.json() as { requestId?: number }

    if (!requestId) {
      return NextResponse.json({ error: '요청 ID가 필요합니다.' }, { status: 400 })
    }

    const { env } = await getCloudflareContext() as { env: { DB?: D1Database } }

    if (!env.DB) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 })
    }

    const db = env.DB

    // 결제 요청 조회
    const paymentRequest = await db.prepare(
      'SELECT * FROM payment_requests WHERE id = ?'
    ).bind(requestId).first<{
      id: number
      status: string
    }>()

    if (!paymentRequest) {
      return NextResponse.json({ error: '요청을 찾을 수 없습니다.' }, { status: 404 })
    }

    if (paymentRequest.status !== 'pending') {
      return NextResponse.json({ error: '이미 처리된 요청입니다.' }, { status: 400 })
    }

    // payment_requests 상태 업데이트
    await db.prepare(
      'UPDATE payment_requests SET status = ? WHERE id = ?'
    ).bind('rejected', requestId).run()

    return NextResponse.json({ success: true, message: '거절되었습니다.' })
  } catch (error) {
    console.error('Payment reject error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
