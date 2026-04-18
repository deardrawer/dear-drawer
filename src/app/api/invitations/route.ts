import { NextRequest, NextResponse } from "next/server";
import { verifyToken, getAuthCookieName } from "@/lib/auth";
import { createInvitation, getInvitationsByUserId } from "@/lib/db";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { InvitationInput } from "@/types/invitation";

// 사용자 청첩장 목록 조회
export async function GET(request: NextRequest) {
  try {
    const cookieName = getAuthCookieName();
    const token = request.cookies.get(cookieName)?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const invitations = await getInvitationsByUserId(payload.user.id);

    // Check which invitations have geunnal pages
    const paidIds = invitations.filter(inv => inv.is_paid).map(inv => inv.id);
    const geunnalSet = new Set<string>();

    if (paidIds.length > 0) {
      try {
        const { env } = await getCloudflareContext() as { env: { DB?: import("@cloudflare/workers-types").D1Database } };
        if (env.DB) {
          const placeholders = paidIds.map(() => '?').join(',');
          const result = await env.DB
            .prepare(`SELECT invitation_id FROM geunnal_pages WHERE invitation_id IN (${placeholders})`)
            .bind(...paidIds)
            .all<{ invitation_id: string }>();
          for (const row of result.results || []) {
            geunnalSet.add(row.invitation_id);
          }
        }
      } catch (e) {
        console.error("Failed to check geunnal pages:", e);
      }
    }

    const invitationsWithGeunnal = invitations.map(inv => ({
      ...inv,
      has_geunnal: geunnalSet.has(inv.id) ? 1 : 0,
    }));

    return NextResponse.json({ invitations: invitationsWithGeunnal });
  } catch (error) {
    console.error("Get invitations error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// 새 청첩장 생성
export async function POST(request: NextRequest) {
  try {
    const cookieName = getAuthCookieName();
    const token = request.cookies.get(cookieName)?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const body: InvitationInput = await request.json();
    const invitation = await createInvitation(payload.user.id, body);

    return NextResponse.json({ invitation }, { status: 201 });
  } catch (error) {
    console.error("Create invitation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
