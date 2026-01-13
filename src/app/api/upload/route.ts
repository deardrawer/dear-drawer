import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { verifyToken, getAuthCookieName } from "@/lib/auth";

interface CloudflareEnv {
  R2: R2Bucket;
  NEXT_PUBLIC_R2_PUBLIC_URL?: string;
}

// 허용 파일 타입
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
// 최대 파일 크기 (30MB)
const MAX_FILE_SIZE = 30 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    // 인증 확인
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

    // 파일 추출 (web, thumb 버전)
    const webFile = formData.get("web") as File | null;
    const thumbFile = formData.get("thumb") as File | null;
    const invitationId = formData.get("invitationId") as string || "temp";
    const imageId = formData.get("imageId") as string || crypto.randomUUID();

    // 최소 web 파일은 필수
    if (!webFile) {
      return NextResponse.json(
        { error: "이미지 파일이 필요합니다." },
        { status: 400 }
      );
    }

    // 파일 타입 검증
    if (!ALLOWED_TYPES.includes(webFile.type)) {
      return NextResponse.json(
        { error: "지원하지 않는 파일 형식입니다. (JPG, PNG, WebP만 가능)" },
        { status: 400 }
      );
    }

    // 파일 크기 검증
    if (webFile.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "파일 크기는 30MB 이하여야 합니다." },
        { status: 400 }
      );
    }

    // R2 bucket 가져오기
    const { env } = (await getCloudflareContext()) as unknown as { env: CloudflareEnv };
    const publicUrl = env.NEXT_PUBLIC_R2_PUBLIC_URL || "https://pub-dear-drawer.r2.dev";

    // 파일 키 생성
    const baseKey = `invitation/${invitationId}/${imageId}`;
    const webKey = `${baseKey}_web.webp`;
    const thumbKey = `${baseKey}_thumb.webp`;

    // Web 버전 업로드
    const webBuffer = await webFile.arrayBuffer();
    await env.R2.put(webKey, webBuffer, {
      httpMetadata: {
        contentType: "image/webp",
        cacheControl: "public, max-age=31536000",
      },
    });

    let thumbUrl = "";
    let sizeThumb = 0;

    // Thumb 버전 업로드 (있는 경우)
    if (thumbFile) {
      const thumbBuffer = await thumbFile.arrayBuffer();
      await env.R2.put(thumbKey, thumbBuffer, {
        httpMetadata: {
          contentType: "image/webp",
          cacheControl: "public, max-age=31536000",
        },
      });
      thumbUrl = `${publicUrl}/${thumbKey}`;
      sizeThumb = thumbFile.size;
    }

    // 이미지 크기 정보는 클라이언트에서 전달받음
    const width = parseInt(formData.get("width") as string) || 0;
    const height = parseInt(formData.get("height") as string) || 0;

    return NextResponse.json({
      success: true,
      imageId,
      webUrl: `${publicUrl}/${webKey}`,
      thumbUrl: thumbUrl || `${publicUrl}/${webKey}`,
      width,
      height,
      sizeWeb: webFile.size,
      sizeThumb: sizeThumb || webFile.size,
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

    const { imageId, invitationId }: { imageId?: string; invitationId?: string } = await request.json();

    if (!imageId) {
      return NextResponse.json(
        { error: "이미지 ID가 필요합니다." },
        { status: 400 }
      );
    }

    // R2 bucket 가져오기
    const { env } = (await getCloudflareContext()) as unknown as { env: CloudflareEnv };

    // 파일 키 생성
    const baseKey = `invitation/${invitationId || "temp"}/${imageId}`;
    const webKey = `${baseKey}_web.webp`;
    const thumbKey = `${baseKey}_thumb.webp`;

    // 두 버전 모두 삭제
    await Promise.all([
      env.R2.delete(webKey),
      env.R2.delete(thumbKey),
    ]);

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
