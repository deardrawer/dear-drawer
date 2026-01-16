/**
 * Telegram notification utility for payment alerts
 */

interface TelegramEnv {
  TELEGRAM_BOT_TOKEN?: string
  TELEGRAM_CHAT_ID?: string
}

/**
 * Send a message to Telegram
 * @param message - Message content (supports HTML formatting)
 * @param env - Environment variables containing TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID
 * @returns Promise<boolean> - true if sent successfully, false otherwise
 */
export async function sendTelegramMessage(message: string, env: TelegramEnv): Promise<boolean> {
  const { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID } = env

  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn('Telegram credentials not configured')
    return false
  }

  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML'
      })
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Telegram API error:', errorData)
      return false
    }

    return true
  } catch (error) {
    console.error('Failed to send Telegram message:', error)
    return false
  }
}

/**
 * Format payment request notification message
 */
export function formatPaymentRequestMessage(data: {
  orderNumber: string
  buyerName: string
  buyerPhone: string
  submittedAt: string
  adminUrl: string
}): string {
  return `🔔 <b>새로운 결제 요청</b>

📦 주문번호: <code>${data.orderNumber}</code>
👤 구매자: ${data.buyerName}
📱 연락처: ${data.buyerPhone}
🕐 제출시간: ${data.submittedAt}

👉 <a href="${data.adminUrl}">승인하러 가기</a>`
}

/**
 * Format payment approval notification message
 */
export function formatPaymentApprovalMessage(data: {
  orderNumber: string
  buyerName: string
}): string {
  return `✅ <b>결제 승인 완료</b>

📦 주문번호: <code>${data.orderNumber}</code>
👤 구매자: ${data.buyerName}`
}

/**
 * Format payment rejection notification message
 */
export function formatPaymentRejectionMessage(data: {
  orderNumber: string
  buyerName: string
  reason?: string
}): string {
  return `❌ <b>결제 거절</b>

📦 주문번호: <code>${data.orderNumber}</code>
👤 구매자: ${data.buyerName}${data.reason ? `\n📝 사유: ${data.reason}` : ''}`
}
