import { NextRequest, NextResponse } from "next/server";
import { isSlugAvailable } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");

    if (!slug) {
      return NextResponse.json(
        { error: "slug 파라미터가 필요합니다." },
        { status: 400 }
      );
    }

    const available = await isSlugAvailable(slug);

    return NextResponse.json({
      available,
      slug,
    });
  } catch (error) {
    console.error("Slug check error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
