import { NextRequest, NextResponse } from "next/server";
import { getGuestbookMessages } from "@/lib/db";

// GET: 방명록 CSV 내보내기
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const invitationId = searchParams.get("invitationId");

  if (!invitationId) {
    return NextResponse.json(
      { error: "invitationId is required" },
      { status: 400 }
    );
  }

  try {
    const messages = await getGuestbookMessages(invitationId);

    // CSV 헤더
    const headers = ["이름", "메시지", "질문", "등록일"];

    // CSV 행 생성
    const rows = messages.map((msg) => [
      msg.guest_name,
      msg.message.replace(/"/g, '""'), // 쌍따옴표 이스케이프
      msg.question || "",
      new Date(msg.created_at).toLocaleDateString("ko-KR"),
    ]);

    // CSV 문자열 생성
    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    // BOM 추가 (Excel에서 한글 깨짐 방지)
    const bom = "\uFEFF";
    const csvWithBom = bom + csvContent;

    return new NextResponse(csvWithBom, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="guestbook_${invitationId}_${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error("Failed to export guestbook:", error);
    return NextResponse.json(
      { error: "Failed to export guestbook" },
      { status: 500 }
    );
  }
}
