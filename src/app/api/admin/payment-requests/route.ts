import { NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'

export const runtime = 'edge'

interface D1Database {
  prepare(query: string): {
    first<T = unknown>(): Promise<T | null>
    run(): Promise<{ meta: { changes: number } }>
    all<T = unknown>(): Promise<{ results?: T[] }>
    bind(...values: unknown[]): {
      first<T = unknown>(): Promise<T | null>
      run(): Promise<{ meta: { changes: number } }>
      all<T = unknown>(): Promise<{ results?: T[] }>
    }
  }
}

export async function GET() {
  try {
    const { env } = await getCloudflareContext() as { env: { DB?: D1Database } }

    if (!env.DB) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 })
    }

    const db = env.DB

    // 모든 결제 요청 조회 (최신순)
    const result = await db.prepare(`
      SELECT * FROM payment_requests ORDER BY created_at DESC
    `).all()

    return NextResponse.json({ requests: result.results || [] })
  } catch (error) {
    console.error('Payment requests fetch error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
