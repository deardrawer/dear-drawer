import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/adminAuth";
import {
  getGreetingTemplatesByInvitationId,
  createGreetingTemplate,
} from "@/lib/db";

// GET: 템플릿 목록 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ inviteId: string }> }
) {
  try {
    const { inviteId } = await params;

    // 인증 확인
    const auth = await verifyAdminRequest(request, inviteId);
    if (!auth.valid) {
      return auth.response;
    }

    const templates = await getGreetingTemplatesByInvitationId(inviteId);

    return NextResponse.json({ templates });
  } catch (error) {
    console.error("Get templates error:", error);
    return NextResponse.json(
      { error: "템플릿 목록 조회 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// POST: 템플릿 추가
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ inviteId: string }> }
) {
  try {
    const { inviteId } = await params;

    // 인증 확인
    const auth = await verifyAdminRequest(request, inviteId);
    if (!auth.valid) {
      return auth.response;
    }

    const body = await request.json();
    const { name, content, is_default, sort_order } = body as {
      name: string;
      content: string;
      is_default?: boolean;
      sort_order?: number;
    };

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "템플릿 이름은 필수입니다" },
        { status: 400 }
      );
    }

    if (!content?.trim()) {
      return NextResponse.json(
        { error: "템플릿 내용은 필수입니다" },
        { status: 400 }
      );
    }

    const template = await createGreetingTemplate({
      invitation_id: inviteId,
      name: name.trim(),
      content: content.trim(),
      is_default,
      sort_order,
    });

    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    console.error("Create template error:", error);
    return NextResponse.json(
      { error: "템플릿 추가 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
