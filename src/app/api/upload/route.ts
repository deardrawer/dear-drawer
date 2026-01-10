import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { verifyToken, getAuthCookieName } from "@/lib/auth";

interface CloudflareEnvWithR2 {
  R2?: {
    put(key: string, value: ArrayBuffer, options?: { httpMetadata?: { contentType?: string } }): Promise<unknown>;
    delete(key: string): Promise<void>;
  };
}

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

// 이미지 업로드
export async function POST(request: NextRequest) {
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

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // 파일 타입 검증
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: JPEG, PNG, WebP, GIF" },
        { status: 400 }
      );
    }

    // 파일 크기 검증
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File too large. Max size: 10MB" },
        { status: 400 }
      );
    }

    // Cloudflare R2 접근
    const { env } = await getCloudflareContext() as { env: CloudflareEnvWithR2 };
    if (!env.R2) {
      return NextResponse.json(
        { error: "Storage not configured" },
        { status: 500 }
      );
    }

    // 파일명 생성
    const ext = file.name.split(".").pop() || "jpg";
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const key = `invitations/${payload.user.id}/${timestamp}-${random}.${ext}`;

    // R2에 업로드
    const arrayBuffer = await file.arrayBuffer();
    await env.R2.put(key, arrayBuffer, {
      httpMetadata: {
        contentType: file.type,
      },
    });

    // 공개 URL 생성 (R2 public bucket 설정 필요)
    const publicUrl = `${process.env.R2_PUBLIC_URL || ""}/${key}`;

    return NextResponse.json({
      url: publicUrl,
      key,
      size: file.size,
      type: file.type,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// 이미지 삭제
export async function DELETE(request: NextRequest) {
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

    const { key } = await request.json();

    if (!key) {
      return NextResponse.json({ error: "No key provided" }, { status: 400 });
    }

    // 본인 이미지만 삭제 가능
    if (!key.includes(`/${payload.user.id}/`)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Cloudflare R2 접근
    const { env } = await getCloudflareContext() as { env: CloudflareEnvWithR2 };
    if (!env.R2) {
      return NextResponse.json(
        { error: "Storage not configured" },
        { status: 500 }
      );
    }

    await env.R2.delete(key);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
