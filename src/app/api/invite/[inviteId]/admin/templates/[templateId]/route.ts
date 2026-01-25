import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/adminAuth";
import {
  getGreetingTemplateById,
  updateGreetingTemplate,
  deleteGreetingTemplate,
  setDefaultGreetingTemplate,
} from "@/lib/db";

// GET: 템플릿 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ inviteId: string; templateId: string }> }
) {
  try {
    const { inviteId, templateId } = await params;

    // 인증 확인
    const auth = await verifyAdminRequest(request, inviteId);
    if (!auth.valid) {
      return auth.response;
    }

    const template = await getGreetingTemplateById(templateId);
    if (!template) {
      return NextResponse.json(
        { error: "템플릿을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // 청첩장 소속 확인
    if (template.invitation_id !== inviteId) {
      return NextResponse.json(
        { error: "권한이 없습니다" },
        { status: 403 }
      );
    }

    return NextResponse.json({ template });
  } catch (error) {
    console.error("Get template error:", error);
    return NextResponse.json(
      { error: "템플릿 조회 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// PUT: 템플릿 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ inviteId: string; templateId: string }> }
) {
  try {
    const { inviteId, templateId } = await params;

    // 인증 확인
    const auth = await verifyAdminRequest(request, inviteId);
    if (!auth.valid) {
      return auth.response;
    }

    // 템플릿 존재 및 소속 확인
    const existingTemplate = await getGreetingTemplateById(templateId);
    if (!existingTemplate) {
      return NextResponse.json(
        { error: "템플릿을 찾을 수 없습니다" },
        { status: 404 }
      );
    }
    if (existingTemplate.invitation_id !== inviteId) {
      return NextResponse.json(
        { error: "권한이 없습니다" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, content, is_default, sort_order } = body as {
      name?: string;
      content?: string;
      is_default?: boolean;
      sort_order?: number;
    };

    // 기본 템플릿으로 설정하는 경우
    if (is_default === true) {
      await setDefaultGreetingTemplate(templateId, inviteId);
    }

    const template = await updateGreetingTemplate(templateId, {
      name: name?.trim(),
      content: content?.trim(),
      is_default,
      sort_order,
    });

    if (!template) {
      return NextResponse.json(
        { error: "템플릿 수정에 실패했습니다" },
        { status: 500 }
      );
    }

    return NextResponse.json({ template });
  } catch (error) {
    console.error("Update template error:", error);
    return NextResponse.json(
      { error: "템플릿 수정 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// DELETE: 템플릿 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ inviteId: string; templateId: string }> }
) {
  try {
    const { inviteId, templateId } = await params;

    // 인증 확인
    const auth = await verifyAdminRequest(request, inviteId);
    if (!auth.valid) {
      return auth.response;
    }

    // 템플릿 존재 및 소속 확인
    const existingTemplate = await getGreetingTemplateById(templateId);
    if (!existingTemplate) {
      return NextResponse.json(
        { error: "템플릿을 찾을 수 없습니다" },
        { status: 404 }
      );
    }
    if (existingTemplate.invitation_id !== inviteId) {
      return NextResponse.json(
        { error: "권한이 없습니다" },
        { status: 403 }
      );
    }

    const success = await deleteGreetingTemplate(templateId);
    if (!success) {
      return NextResponse.json(
        { error: "템플릿 삭제에 실패했습니다" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete template error:", error);
    return NextResponse.json(
      { error: "템플릿 삭제 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
