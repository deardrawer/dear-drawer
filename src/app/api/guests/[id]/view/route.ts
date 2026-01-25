import { NextRequest, NextResponse } from "next/server";
import { getGuestById, recordGuestView } from "@/lib/db";

// 게스트 열람 기록 (청첩장 조회 시 호출)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const guest = await getGuestById(id);
    if (!guest) {
      return NextResponse.json({ error: "Guest not found" }, { status: 404 });
    }

    await recordGuestView(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Record guest view error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
