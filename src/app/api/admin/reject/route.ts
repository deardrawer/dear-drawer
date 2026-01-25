import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { D1Database } from "@cloudflare/workers-types";

interface CloudflareEnvWithDB {
  DB?: D1Database;
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_CHAT_ID?: string;
}

interface PaymentRequest {
  id: string;
  order_number: string;
  buyer_name: string;
  status: string;
}

async function sendTelegramNotification(
  message: string,
  botToken: string,
  chatId: string
): Promise<boolean> {
  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
      }),
    });
    return response.ok;
  } catch (error) {
    console.error("Telegram send failed:", error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { requestId } = await request.json() as { requestId: string };

    if (!requestId) {
      return NextResponse.json(
        { error: "요청 ID가 필요합니다." },
        { status: 400 }
      );
    }

    const { env } = await getCloudflareContext() as { env: CloudflareEnvWithDB };

    if (!env.DB) {
      return NextResponse.json(
        { error: "Database not available" },
        { status: 500 }
      );
    }

    const db = env.DB;

    // Get the payment request
    const paymentRequest = await db
      .prepare("SELECT * FROM payment_requests WHERE id = ?")
      .bind(requestId)
      .first<PaymentRequest>();

    if (!paymentRequest) {
      return NextResponse.json(
        { error: "요청을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    if (paymentRequest.status !== "pending") {
      return NextResponse.json(
        { error: "이미 처리된 요청입니다." },
        { status: 400 }
      );
    }

    // Update payment request status
    await db
      .prepare("UPDATE payment_requests SET status = ? WHERE id = ?")
      .bind("rejected", requestId)
      .run();

    // Send Telegram notification
    try {
      if (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) {
        const message = `❌ <b>결제 거절</b>\n\n📦 주문번호: <code>${paymentRequest.order_number}</code>\n👤 구매자: ${paymentRequest.buyer_name}`;
        await sendTelegramNotification(
          message,
          env.TELEGRAM_BOT_TOKEN,
          env.TELEGRAM_CHAT_ID
        );
      }
    } catch (error) {
      console.error("Telegram notification failed:", error);
    }

    return NextResponse.json({ success: true, message: "거절되었습니다." });
  } catch (error) {
    console.error("Payment reject error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
