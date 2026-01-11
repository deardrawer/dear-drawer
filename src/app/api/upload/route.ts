import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { verifyToken, getAuthCookieName } from "@/lib/auth";

interface CloudflareEnv {
  R2: R2Bucket;
  NEXT_PUBLIC_R2_PUBLIC_URL?: string;
}

export async function POST(request: NextRequest) {
  try {
    const cookieName = getAuthCookieName();
    const token = request.cookies.get(cookieName)?.value;

    if (!token) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    const userId = payload.user.id;
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const invitationId = formData.get("invitationId") as string;
    const type = formData.get("type") as string; // 'main' or 'gallery'

    if (!file) {
      return NextResponse.json(
        { error: "파일이 필요합니다." },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "지원하지 않는 파일 형식입니다. (JPG, PNG, WebP, GIF만 가능)" },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "파일 크기는 5MB 이하여야 합니다." },
        { status: 400 }
      );
    }

    // Generate unique filename
    const ext = file.name.split(".").pop();
    const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
    const key = `${userId}/${invitationId || "temp"}/${type}/${filename}`;

    // Get R2 bucket from Cloudflare context
    const { env } = (await getCloudflareContext()) as unknown as { env: CloudflareEnv };

    // Upload to R2
    const arrayBuffer = await file.arrayBuffer();
    await env.R2.put(key, arrayBuffer, {
      httpMetadata: {
        contentType: file.type,
      },
    });

    // Get public URL
    const publicUrl = env.NEXT_PUBLIC_R2_PUBLIC_URL || "https://pub-dear-drawer.r2.dev";
    const url = `${publicUrl}/${key}`;

    return NextResponse.json({
      success: true,
      url,
      path: key,
    });
  } catch (error) {
    console.error("Upload API error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const cookieName = getAuthCookieName();
    const token = request.cookies.get(cookieName)?.value;

    if (!token) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    const userId = payload.user.id;
    const { path }: { path?: string } = await request.json();

    if (!path) {
      return NextResponse.json(
        { error: "파일 경로가 필요합니다." },
        { status: 400 }
      );
    }

    // Verify ownership (path should start with user's ID)
    if (!path.startsWith(userId)) {
      return NextResponse.json(
        { error: "삭제 권한이 없습니다." },
        { status: 403 }
      );
    }

    // Get R2 bucket from Cloudflare context
    const { env } = (await getCloudflareContext()) as unknown as { env: CloudflareEnv };

    // Delete from R2
    await env.R2.delete(path);

    return NextResponse.json({
      success: true,
      message: "파일이 삭제되었습니다.",
    });
  } catch (error) {
    console.error("Delete API error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
