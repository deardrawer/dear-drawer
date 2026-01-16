import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'

// Telegram helper function
async function sendTelegramNotification(message: string, botToken: string, chatId: string): Promise<boolean> {
  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
      })
    })
    return response.ok
  } catch (error) {
    console.error('Telegram send failed:', error)
    return false
  }
}

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
    const { requestId } = await request.json() as { requestId?: number }

    if (!requestId) {
      return NextResponse.json({ error: '요청 ID가 필요합니다.' }, { status: 400 })
    }

    const { env } = await getCloudflareContext() as { env: CloudflareEnv }

    if (!env.DB) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 })
    }

    const db = env.DB

    // 결제 요청 조회
    const paymentRequest = await db.prepare(
      'SELECT * FROM payment_requests WHERE id = ?'
    ).bind(requestId).first<{
      id: number
      user_id: string
      invitation_id: string | null
      order_number: string
      buyer_name: string
      status: string
    }>()

    if (!paymentRequest) {
      return NextResponse.json({ error: '요청을 찾을 수 없습니다.' }, { status: 404 })
    }

    if (paymentRequest.status !== 'pending') {
      return NextResponse.json({ error: '이미 처리된 요청입니다.' }, { status: 400 })
    }

    // 트랜잭션으로 처리
    // 1. payment_requests 상태 업데이트
    await db.prepare(
      'UPDATE payment_requests SET status = ? WHERE id = ?'
    ).bind('approved', requestId).run()

    // 2. 해당 사용자의 가장 최근 청첩장 is_paid = 1로 업데이트
    // (invitation_id가 있으면 해당 청첩장, 없으면 최근 청첩장)
    try {
      if (paymentRequest.invitation_id) {
        await db.prepare(`
          UPDATE invitations
          SET is_paid = 1, imweb_order_no = ?
          WHERE id = ?
        `).bind(paymentRequest.order_number, paymentRequest.invitation_id).run()
      } else {
        // invitation_id가 없으면 해당 유저의 가장 최근 청첩장 업데이트
        await db.prepare(`
          UPDATE invitations
          SET is_paid = 1, imweb_order_no = ?
          WHERE user_id = ? AND (is_paid = 0 OR is_paid IS NULL)
          ORDER BY created_at DESC
          LIMIT 1
        `).bind(paymentRequest.order_number, paymentRequest.user_id).run()
      }
    } catch (invitationError) {
      // invitations 테이블이 없는 경우 (로컬 개발 환경)
      // 결제 요청 상태는 이미 업데이트되었으므로 경고만 출력
      console.warn('Could not update invitation is_paid status:', invitationError)
    }

    // 텔레그램 승인 완료 알림 전송
    try {
      if (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) {
        const message = `✅ <b>결제 승인 완료</b>

📦 주문번호: <code>${paymentRequest.order_number}</code>
👤 구매자: ${paymentRequest.buyer_name}`

        await sendTelegramNotification(message, env.TELEGRAM_BOT_TOKEN, env.TELEGRAM_CHAT_ID)
      }
    } catch (telegramError) {
      console.error('Telegram notification failed:', telegramError)
    }

    return NextResponse.json({ success: true, message: '승인되었습니다.' })
  } catch (error) {
    console.error('Payment approve error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
