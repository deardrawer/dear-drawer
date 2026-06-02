import { NextRequest, NextResponse } from "next/server";
import { getInvitationBySlug } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");

  if (!slug) {
    return NextResponse.json({ error: "slug parameter required" }, { status: 400 });
  }

  try {
    const invitation = await getInvitationBySlug(slug);
    if (!invitation) {
      return NextResponse.json({ error: "Not found", slug }, { status: 404 });
    }

    return NextResponse.json({
      id: invitation.id,
      slug: invitation.slug,
      templateId: invitation.template_id,
    });
  } catch (error) {
    console.error("Lookup error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
