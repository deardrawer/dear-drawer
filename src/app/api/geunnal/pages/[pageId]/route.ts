import { NextRequest, NextResponse } from "next/server";
import { getPageById, updatePage, deletePage } from "@/lib/geunnalDb";
import { verifyGeunnalToken } from "@/lib/geunnalAuth";

function verifyAdmin(request: NextRequest): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) return false;
  const authHeader = request.headers.get("x-admin-password");
  return authHeader === adminPassword;
}

async function verifyPageAccess(
  request: NextRequest,
  pageId: string
): Promise<boolean> {
  // Admin access
  if (verifyAdmin(request)) {
    return true;
  }

  // Geunnal auth access
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!token) {
    return false;
  }

  const payload = await verifyGeunnalToken(token);
  if (!payload || payload.pageId !== pageId) {
    return false;
  }

  return true;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ pageId: string }> }
) {
  try {
    const { pageId } = await context.params;

    if (!(await verifyPageAccess(request, pageId))) {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
    }

    const page = await getPageById(pageId);
    if (!page) {
      return NextResponse.json(
        { error: "페이지를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // password_hash는 제거하고 반환
    const { password_hash, ...safePageData } = page;

    return NextResponse.json({
      success: true,
      page: safePageData,
    });
  } catch (error) {
    console.error("Get page API error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ pageId: string }> }
) {
  try {
    const { pageId } = await context.params;

    if (!verifyAdmin(request)) {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 401 });
    }

    const body = (await request.json()) as Record<string, unknown>;

    const page = await updatePage(pageId, body);
    if (!page) {
      return NextResponse.json(
        { error: "페이지를 업데이트할 수 없습니다" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      page,
    });
  } catch (error) {
    console.error("Update page API error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ pageId: string }> }
) {
  try {
    const { pageId } = await context.params;

    if (!verifyAdmin(request)) {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 401 });
    }

    const success = await deletePage(pageId);
    if (!success) {
      return NextResponse.json(
        { error: "페이지를 삭제할 수 없습니다" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "페이지가 삭제되었습니다",
    });
  } catch (error) {
    console.error("Delete page API error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
