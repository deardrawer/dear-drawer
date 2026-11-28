import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { D1Database } from "@cloudflare/workers-types";
import { verifySiteAdmin } from "@/lib/siteAdmin";

interface CloudflareEnvWithDB {
  DB?: D1Database;
}

interface PaymentRequest {
  id: string;
  user_id: string;
  user_email: string | null;
  invitation_id: string | null;
  order_number: string;
  buyer_name: string;
  buyer_phone: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

export async function GET(request: NextRequest) {
  try {
    if (!(await verifySiteAdmin(request))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { env } = await getCloudflareContext() as { env: CloudflareEnvWithDB };

    if (!env.DB) {
      return NextResponse.json(
        { error: "Database not available" },
        { status: 500 }
      );
    }

    const db = env.DB;

    const { results } = await db
      .prepare(
        // 청첩장 정보도 함께 — 이름 · 템플릿 · 이미 결제됐는지 (중복 신청 알아보기)
        `SELECT pr.*, i.groom_name AS inv_groom_name, i.bride_name AS inv_bride_name,
                i.template_id AS inv_template_id, i.is_paid AS inv_is_paid
         FROM payment_requests pr
         LEFT JOIN invitations i ON i.id = pr.invitation_id
         ORDER BY CASE WHEN pr.status = 'pending' THEN 0 ELSE 1 END, pr.created_at DESC`
      )
      .all<PaymentRequest>();

    return NextResponse.json({ requests: results || [] });
  } catch (error) {
    console.error("Payment requests fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch payment requests" },
      { status: 500 }
    );
  }
}
