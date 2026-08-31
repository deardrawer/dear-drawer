import { NextRequest, NextResponse } from "next/server";
import { getRSVPsByInvitationId, getInvitationById, getInvitationsByUserId } from "@/lib/db";
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
    const scope = searchParams.get("scope");

    if (scope !== "all" && !invitationId) {
      return NextResponse.json(
        { error: "청첩장 ID가 필요합니다." },
        { status: 400 }
      );
    }

    // Create CSV content
    const headers = ["이름", "연락처", "소속", "세부소속", "참석여부", "식사여부", "대절버스", "애프터파티", "동반인원", "메시지", "응답일시"];

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

    const getAfterPartyLabel = (afterParty: string | null) => {
      switch (afterParty) {
        case "yes":
          return "참석";
        case "no":
          return "불참";
        default:
          return "";
      }
    };

    const getSideDetailLabel = (sideDetail: string | null) => {
      switch (sideDetail) {
        case "self":
          return "";
        case "father":
          return "아버지";
        case "mother":
          return "어머니";
        default:
          return "";
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buildRow = (r: any) => [
      r.guest_name,
      r.guest_phone || "",
      getSideLabel(r.side),
      getSideDetailLabel(r.side_detail),
      getAttendanceLabel(r.attendance),
      r.attendance === "attending" ? getMealLabel(r.meal_attendance) : "",
      r.attendance === "attending" ? getShuttleLabel(r.shuttle_bus) : "",
      r.attendance === "attending" ? getAfterPartyLabel(r.after_party) : "",
      r.attendance === "attending" ? String(r.guest_count) : "",
      (r.message || "").replace(/"/g, '""'),
      new Date(r.created_at).toLocaleString("ko-KR"),
    ];

    let csvHeaders = headers;
    let rows: string[][] = [];
    let filename = `rsvp_responses_${invitationId}.csv`;

    if (scope === "all") {
      // \uB0B4 \uBAA8\uB4E0 \uCCAD\uCCA9\uC7A5 \uD1B5\uD569 (\uCCAD\uCCA9\uC7A5 \uCEEC\uB7FC \uCD94\uAC00)
      const invs = await getInvitationsByUserId(payload.user.id);
      csvHeaders = ["\uCCAD\uCCA9\uC7A5", ...headers];
      for (const inv of invs) {
        const name = [inv.groom_name, inv.bride_name].filter(Boolean).join(" \u00B7 ") || "\uCCAD\uCCA9\uC7A5";
        const data = await getRSVPsByInvitationId(inv.id);
        for (const r of data) rows.push([name, ...buildRow(r)]);
      }
      filename = "rsvp_responses_all.csv";
    } else {
      const invitation = await getInvitationById(invitationId as string);
      if (!invitation || invitation.user_id !== payload.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const data = await getRSVPsByInvitationId(invitationId as string);
      rows = data.map((r) => buildRow(r));
    }

    const csvContent = [
      csvHeaders.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    // Add BOM for Excel Korean support
    const bom = "\uFEFF";
    const csvWithBom = bom + csvContent;

    return new NextResponse(csvWithBom, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
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
