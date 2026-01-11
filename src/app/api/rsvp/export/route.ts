import { NextRequest, NextResponse } from "next/server";
import { getRSVPsByInvitationId } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const invitationId = searchParams.get("invitationId");

    if (!invitationId) {
      return NextResponse.json(
        { error: "청첩장 ID가 필요합니다." },
        { status: 400 }
      );
    }

    const data = await getRSVPsByInvitationId(invitationId);

    // Create CSV content
    const headers = ["이름", "연락처", "참석여부", "동반인원", "메시지", "응답일시"];

    const getAttendanceLabel = (attendance: string) => {
      switch (attendance) {
        case "attending":
          return "참석";
        case "not_attending":
          return "불참";
        case "pending":
          return "미정";
        default:
          return attendance;
      }
    };

    const rows = data.map((r) => [
      r.guest_name,
      r.guest_phone || "",
      getAttendanceLabel(r.attendance),
      r.attendance === "attending" ? r.guest_count.toString() : "",
      (r.message || "").replace(/"/g, '""'),
      new Date(r.created_at).toLocaleString("ko-KR"),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    // Add BOM for Excel Korean support
    const bom = "\uFEFF";
    const csvWithBom = bom + csvContent;

    return new NextResponse(csvWithBom, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="rsvp_responses_${invitationId}.csv"`,
      },
    });
  } catch (error) {
    console.error("CSV export error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
