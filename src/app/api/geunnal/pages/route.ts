import { NextRequest, NextResponse } from "next/server";
import { createPage, getAllPages } from "@/lib/geunnalDb";

function verifyAdmin(request: NextRequest): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) return false;
  const authHeader = request.headers.get("x-admin-password");
  return authHeader === adminPassword;
}

export async function POST(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: "권한이 없습니다" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      groom_name?: string;
      bride_name?: string;
      slug?: string;
      wedding_date?: string;
      wedding_time?: string;
      venue_name?: string;
      venue_address?: string;
      invitation_id?: string;
    };
    const {
      groom_name,
      bride_name,
      slug,
      wedding_date,
      wedding_time,
      venue_name,
      venue_address,
      invitation_id,
    } = body;

    if (!groom_name || !bride_name || !slug) {
      return NextResponse.json(
        { error: "groom_name, bride_name, slug는 필수입니다" },
        { status: 400 }
      );
    }

    const page = await createPage({
      groom_name,
      bride_name,
      slug,
      wedding_date,
      wedding_time,
      venue_name,
      venue_address,
      invitation_id,
    });

    return NextResponse.json({
      success: true,
      page,
    });
  } catch (error) {
    console.error("Create page API error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: "권한이 없습니다" }, { status: 401 });
  }

  try {
    const pages = await getAllPages();

    return NextResponse.json({
      success: true,
      pages,
    });
  } catch (error) {
    console.error("Get pages API error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
