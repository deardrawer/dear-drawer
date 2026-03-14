import { NextRequest, NextResponse } from "next/server";
import { deleteSubmission } from "@/lib/geunnalDb";
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

async function verifySubmissionAccess(
  submissionId: string,
  authenticatedPageId: string
): Promise<boolean> {
  try {
    // Get submission with event and page info via JOIN
    const { env } = (await getCloudflareContext()) as {
      env: CloudflareEnvWithDB;
    };
    if (!env.DB) return false;

    const result = await env.DB.prepare(
      `SELECT e.page_id
       FROM geunnal_submissions s
       JOIN geunnal_events e ON s.event_id = e.id
       WHERE s.id = ?`
    )
      .bind(submissionId)
      .first<{ page_id: string }>();

    if (!result) return false;

    return result.page_id === authenticatedPageId;
  } catch (error) {
    console.error("Verify submission access error:", error);
    return false;
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ submissionId: string }> }
) {
  try {
    const { submissionId } = await context.params;

    const authenticatedPageId = await getAuthenticatedPageId(request);
    if (!authenticatedPageId) {
      return NextResponse.json(
        { error: "인증 토큰이 필요합니다" },
        { status: 401 }
      );
    }

    // Verify through event -> page chain
    const hasAccess = await verifySubmissionAccess(
      submissionId,
      authenticatedPageId
    );
    if (!hasAccess) {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
    }

    const success = await deleteSubmission(submissionId);
    if (!success) {
      return NextResponse.json(
        { error: "제출 내용을 삭제할 수 없습니다" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "제출 내용이 삭제되었습니다",
    });
  } catch (error) {
    console.error("Delete submission API error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
