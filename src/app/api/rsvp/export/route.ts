import { NextRequest, NextResponse } from "next/server";
import { getRSVPsByInvitationId, getInvitationById } from "@/lib/db";
import { verifyToken, getAuthCookieName } from "@/lib/auth";

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

    const { searchParams } = new URL(request.url);
    const invitationId = searchParams.get("invitationId");

    if (!invitationId) {
      return NextResponse.json(
        { error: "청첩장 ID가 필요합니다." },
        { status: 400 }
      );
    }

    const invitation = await getInvitationById(invitationId);
    if (!invitation || invitation.user_id !== payload.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const data = await getRSVPsByInvitationId(invitationId);

    // Create CSV content
    const headers = ["이름", "연락처", "소속", "참석여부", "식사여부", "대절버스", "동반인원", "메시지", "응답일시"];

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

    const getSideLabel = (side: string | null) => {
      switch (side) {
        case "groom":
          return "신랑측";
        case "bride":
          return "신부측";
        default:
          return "";
      }
    };

    const getMealLabel = (meal: string | null) => {
      switch (meal) {
        case "yes":
          return "식사 예정";
        case "no":
          return "식사 안 함";
        default:
          return "";
      }
    };

    const getShuttleLabel = (shuttle: string | null) => {
      switch (shuttle) {
        case "yes":
          return "이용 예정";
        case "no":
          return "이용 안 함";
        default:
          return "";
      }
    };

    const rows = data.map((r) => [
      r.guest_name,
      r.guest_phone || "",
      getSideLabel(r.side),
      getAttendanceLabel(r.attendance),
      r.attendance === "attending" ? getMealLabel(r.meal_attendance) : "",
      r.attendance === "attending" ? getShuttleLabel((r as any).shuttle_bus) : "",
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
