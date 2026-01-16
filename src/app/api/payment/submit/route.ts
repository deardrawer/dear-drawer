import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { getCloudflareContext } from '@opennextjs/cloudflare'

export const runtime = 'edge'

// Inline auth functions to avoid import issues
const AUTH_COOKIE_NAME = 'auth-token'

interface JWTPayload {
  user: {
    id: string
    kakaoId: number
    nickname: string
    email?: string
    profileImage?: string
  }
  iat: number
  exp: number
}

interface CloudflareEnvWithSecret {
  JWT_SECRET?: string
  DB?: D1Database
  TELEGRAM_BOT_TOKEN?: string
  TELEGRAM_CHAT_ID?: string
}

async function verifyAuthToken(token: string, env: CloudflareEnvWithSecret): Promise<JWTPayload | null> {
  try {
    const secret = env.JWT_SECRET || process.env.JWT_SECRET || 'your-super-secret-jwt-key-min-32-chars'
    const secretKey = new TextEncoder().encode(secret)
    const { payload } = await jwtVerify(token, secretKey)
    return payload as unknown as JWTPayload
  } catch {
    return null
  }
}

// Telegram helper functions (inline to avoid edge runtime import issues)
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

export async function POST(request: NextRequest) {
  try {
    const { env } = await getCloudflareContext() as { env: CloudflareEnvWithSecret }

    // 인증 확인
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value

    if (!token) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const payload = await verifyAuthToken(token, env)

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
      if (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) {
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

        const message = `🔔 <b>새로운 결제 요청</b>

📦 주문번호: <code>${orderNumber}</code>
👤 구매자: ${buyerName}
📱 연락처: ${buyerPhone}
🕐 제출시간: ${submittedAt}

👉 <a href="${adminUrl}">승인하러 가기</a>`

        await sendTelegramNotification(message, env.TELEGRAM_BOT_TOKEN, env.TELEGRAM_CHAT_ID)
      }
    } catch (telegramError) {
      console.error('Telegram notification failed:', telegramError)
    }

    return NextResponse.json({ success: true, message: '접수되었습니다.' })
  } catch (error) {
    console.error('Payment submit error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: `서버 오류: ${errorMessage}` }, { status: 500 })
  }
}
