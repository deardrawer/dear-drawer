import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { D1Database } from "@cloudflare/workers-types";

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

export async function GET() {
  try {
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
        `SELECT * FROM payment_requests ORDER BY
          CASE WHEN status = 'pending' THEN 0 ELSE 1 END,
          created_at DESC`
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
