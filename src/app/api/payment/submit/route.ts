import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, getAuthCookieName } from '@/lib/auth'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { sendTelegramMessage, formatPaymentRequestMessage } from '@/lib/telegram'

export const runtime = 'edge'

interface D1Database {
  prepare(query: string): {
    bind(...values: unknown[]): {
      first<T = unknown>(): Promise<T | null>
      run(): Promise<{ meta: { changes: number } }>
      all<T = unknown>(): Promise<{ results?: T[] }>
    }
  }
}

interface CloudflareEnv {
  DB?: D1Database
  TELEGRAM_BOT_TOKEN?: string
  TELEGRAM_CHAT_ID?: string
}

export async function POST(request: NextRequest) {
  try {
    // 인증 확인
    const cookieName = getAuthCookieName()
    const token = request.cookies.get(cookieName)?.value

    if (!token) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const payload = await verifyToken(token)

    if (!payload?.user?.id) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const userId = payload.user.id

    const { orderNumber, buyerName, buyerPhone, invitationId } = await request.json() as {
      orderNumber?: string
      buyerName?: string
      buyerPhone?: string
      invitationId?: string
    }

    if (!orderNumber || !buyerName || !buyerPhone) {
      return NextResponse.json({ error: '모든 필드를 입력해주세요.' }, { status: 400 })
    }

    const { env } = await getCloudflareContext() as { env: CloudflareEnv }

    if (!env.DB) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 })
    }

    const db = env.DB

    // 중복 체크
    const existing = await db.prepare(
      'SELECT id FROM payment_requests WHERE order_number = ?'
    ).bind(orderNumber).first()

    if (existing) {
      return NextResponse.json({ error: '이미 접수된 주문번호입니다.' }, { status: 400 })
    }

    // payment_requests 테이블에 INSERT
    await db.prepare(`
      INSERT INTO payment_requests (user_id, invitation_id, order_number, buyer_name, buyer_phone, status, created_at)
      VALUES (?, ?, ?, ?, ?, 'pending', datetime('now'))
    `).bind(
      userId,
      invitationId || null,
      orderNumber,
      buyerName,
      buyerPhone
    ).run()

    // 텔레그램 알림 전송 (실패해도 DB 저장은 완료됨)
    try {
      const now = new Date()
      const submittedAt = now.toLocaleString('ko-KR', {
        timeZone: 'Asia/Seoul',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })

      const adminUrl = `${request.headers.get('origin') || 'https://invite.deardrawer.com'}/admin/simple`

      const message = formatPaymentRequestMessage({
        orderNumber,
        buyerName,
        buyerPhone,
        submittedAt,
        adminUrl
      })

      await sendTelegramMessage(message, env)
    } catch (telegramError) {
      console.error('Telegram notification failed:', telegramError)
    }

    return NextResponse.json({ success: true, message: '접수되었습니다.' })
  } catch (error) {
    console.error('Payment submit error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
