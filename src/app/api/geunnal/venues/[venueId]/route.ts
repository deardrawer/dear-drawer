import { NextRequest, NextResponse } from "next/server";
import { updateVenue, deleteVenue } from "@/lib/geunnalDb";
import { verifyGeunnalToken } from "@/lib/geunnalAuth";
import { getCloudflareContext } from "@opennextjs/cloudflare";

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(colName?: string): Promise<T | null>;
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

interface CloudflareEnvWithDB {
  DB?: D1Database;
}

async function getAuthenticatedPageId(
  request: NextRequest
): Promise<string | null> {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!token) {
    return null;
  }

  const payload = await verifyGeunnalToken(token);
  return payload?.pageId || null;
}

async function verifyVenueAccess(
  venueId: string,
  authenticatedPageId: string
): Promise<boolean> {
  try {
    const { env } = (await getCloudflareContext()) as {
      env: CloudflareEnvWithDB;
    };
    if (!env.DB) return false;

    const result = await env.DB.prepare(
      "SELECT page_id FROM geunnal_venues WHERE id = ?"
    )
      .bind(venueId)
      .first<{ page_id: string }>();

    if (!result) return false;

    return result.page_id === authenticatedPageId;
  } catch (error) {
    console.error("Verify venue access error:", error);
    return false;
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ venueId: string }> }
) {
  try {
    const { venueId } = await context.params;

    const authenticatedPageId = await getAuthenticatedPageId(request);
    if (!authenticatedPageId) {
      return NextResponse.json(
        { error: "인증 토큰이 필요합니다" },
        { status: 401 }
      );
    }

    const hasAccess = await verifyVenueAccess(venueId, authenticatedPageId);
    if (!hasAccess) {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
    }

    const body = (await request.json()) as Record<string, unknown>;

    const venue = await updateVenue(venueId, body);
    if (!venue) {
      return NextResponse.json(
        { error: "장소를 업데이트할 수 없습니다" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      venue,
    });
  } catch (error) {
    console.error("Update venue API error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ venueId: string }> }
) {
  try {
    const { venueId } = await context.params;

    const authenticatedPageId = await getAuthenticatedPageId(request);
    if (!authenticatedPageId) {
      return NextResponse.json(
        { error: "인증 토큰이 필요합니다" },
        { status: 401 }
      );
    }

    const hasAccess = await verifyVenueAccess(venueId, authenticatedPageId);
    if (!hasAccess) {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
    }

    const success = await deleteVenue(venueId);
    if (!success) {
      return NextResponse.json(
        { error: "장소를 삭제할 수 없습니다" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "장소가 삭제되었습니다",
    });
  } catch (error) {
    console.error("Delete venue API error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
