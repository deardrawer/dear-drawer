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
  user_id: string;
  invitation_id: string | null;
  order_number: string;
  buyer_name: string;
  buyer_phone: string;
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
    const { requestId, createGeunnal } = await request.json() as { requestId: string; createGeunnal?: boolean };

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
      .bind("approved", requestId)
      .run();

    // Update invitation is_paid status
    let updateResult;
    try {
      if (paymentRequest.invitation_id) {
        updateResult = await db
          .prepare(
            `UPDATE invitations SET is_paid = 1 WHERE id = ?`
          )
          .bind(paymentRequest.invitation_id)
          .run();
      } else {
        // invitation_id가 없으면 해당 사용자의 최신 미결제 청첩장 업데이트
        updateResult = await db
          .prepare(
            `UPDATE invitations SET is_paid = 1
             WHERE id = (
               SELECT id FROM invitations
               WHERE user_id = ? AND (is_paid = 0 OR is_paid IS NULL)
               ORDER BY created_at DESC
               LIMIT 1
             )`
          )
          .bind(paymentRequest.user_id)
          .run();
      }

      // 업데이트된 행이 없으면 경고
      if (!updateResult.meta?.changes || updateResult.meta.changes === 0) {
        console.warn("No invitation was updated! invitation_id:", paymentRequest.invitation_id, "user_id:", paymentRequest.user_id);
      }
    } catch (error) {
      console.error("Failed to update invitation is_paid status:", error);
      // 에러가 발생해도 결제 승인은 성공으로 처리하되 로그 남김
    }

    // Auto-create geunnal page for paid invitation (skip if createGeunnal is explicitly false)
    if (createGeunnal !== false) try {
      // Find the invitation that was just paid
      const invitationId = paymentRequest.invitation_id;
      if (invitationId) {
        const invitation = await db
          .prepare("SELECT id, slug, groom_name, bride_name, wedding_date, wedding_time, venue_name, venue_address FROM invitations WHERE id = ?")
          .bind(invitationId)
          .first<{ id: string; slug: string | null; groom_name: string | null; bride_name: string | null; wedding_date: string | null; wedding_time: string | null; venue_name: string | null; venue_address: string | null }>();

        if (invitation && invitation.groom_name && invitation.bride_name) {
          // Check if geunnal page already exists for this invitation
          const existingPage = await db
            .prepare("SELECT id FROM geunnal_pages WHERE invitation_id = ?")
            .bind(invitationId)
            .first();

          if (!existingPage) {
            const geunnalId = crypto.randomUUID().split('-')[0];
            const geunnalSlug = `${invitation.slug || invitationId}-g`;
            const now = new Date().toISOString();

            await db
              .prepare(
                `INSERT INTO geunnal_pages (id, invitation_id, slug, groom_name, bride_name, wedding_date, wedding_time, venue_name, venue_address, login_count, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`
              )
              .bind(
                geunnalId, invitationId, geunnalSlug,
                invitation.groom_name, invitation.bride_name,
                invitation.wedding_date || null, invitation.wedding_time || null,
                invitation.venue_name || null, invitation.venue_address || null,
                now, now
              )
              .run();
          }
        }
      }
    } catch (error) {
      console.error("Failed to auto-create geunnal page:", error);
      // Non-blocking: payment approval still succeeds
    }

    // Send Telegram notification
    try {
      if (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) {
        const message = `✅ <b>결제 승인 완료</b>\n\n📦 주문번호: <code>${paymentRequest.order_number}</code>\n👤 구매자: ${paymentRequest.buyer_name}`;
        await sendTelegramNotification(
          message,
          env.TELEGRAM_BOT_TOKEN,
          env.TELEGRAM_CHAT_ID
        );
      }
    } catch (error) {
      console.error("Telegram notification failed:", error);
    }

    return NextResponse.json({ success: true, message: "승인되었습니다." });
  } catch (error) {
    console.error("Payment approve error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
