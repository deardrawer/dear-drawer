import { NextRequest, NextResponse } from "next/server";
import { verifyToken, getAuthCookieName } from "@/lib/auth";
import { getInvitationById } from "@/lib/db";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";

// 환경 감지: Cloudflare Workers 환경인지 확인
const isCloudflare = process.env.CF_PAGES === "1" || process.env.CLOUDFLARE === "1";

interface CloudflareEnv {
  R2: R2Bucket;
}

// 허용 파일 타입
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
// 최대 파일 크기 (30MB)
const MAX_FILE_SIZE = 30 * 1024 * 1024;

// 로컬 업로드 디렉토리
const LOCAL_UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

async function ensureUploadDir(subDir: string = "") {
  const dir = path.join(LOCAL_UPLOAD_DIR, subDir);
  try {
    await mkdir(dir, { recursive: true });
  } catch {
    // 이미 존재하면 무시
  }
  return dir;
}

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

    // 이미지 크기 정보
    const width = parseInt(formData.get("width") as string) || 0;
    const height = parseInt(formData.get("height") as string) || 0;

    // 환경에 따라 분기
    if (isCloudflare) {
      // ===== Cloudflare R2 환경 =====
      const { getCloudflareContext } = await import("@opennextjs/cloudflare");
      const { env } = (await getCloudflareContext()) as unknown as { env: CloudflareEnv };

      const baseUrl = "/api/r2";
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
        thumbUrl = `${baseUrl}/${thumbKey}`;
        sizeThumb = thumbFile.size;
      }

      return NextResponse.json({
        success: true,
        imageId,
        webUrl: `${baseUrl}/${webKey}`,
        thumbUrl: thumbUrl || `${baseUrl}/${webKey}`,
        width,
        height,
        sizeWeb: webFile.size,
        sizeThumb: sizeThumb || webFile.size,
      });
    } else {
      // ===== 로컬 개발 환경 (파일 시스템) =====
      const subDir = `invitation/${invitationId}`;
      await ensureUploadDir(subDir);

      const baseUrl = "/uploads";
      const webFileName = `${imageId}_web.webp`;
      const thumbFileName = `${imageId}_thumb.webp`;

      // Web 버전 저장
      const webBuffer = Buffer.from(await webFile.arrayBuffer());
      const webPath = path.join(LOCAL_UPLOAD_DIR, subDir, webFileName);
      await writeFile(webPath, webBuffer);

      let thumbUrl = "";
      let sizeThumb = 0;

      // Thumb 버전 저장 (있는 경우)
      if (thumbFile) {
        const thumbBuffer = Buffer.from(await thumbFile.arrayBuffer());
        const thumbPath = path.join(LOCAL_UPLOAD_DIR, subDir, thumbFileName);
        await writeFile(thumbPath, thumbBuffer);
        thumbUrl = `${baseUrl}/${subDir}/${thumbFileName}`;
        sizeThumb = thumbFile.size;
      }

      return NextResponse.json({
        success: true,
        imageId,
        webUrl: `${baseUrl}/${subDir}/${webFileName}`,
        thumbUrl: thumbUrl || `${baseUrl}/${subDir}/${webFileName}`,
        width,
        height,
        sizeWeb: webFile.size,
        sizeThumb: sizeThumb || webFile.size,
      });
    }
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

    if (!imageId || !invitationId) {
      return NextResponse.json(
        { error: "이미지 ID와 청첩장 ID가 필요합니다." },
        { status: 400 }
      );
    }

    // 청첩장 소유자 검증
    const invitation = await getInvitationById(invitationId);
    if (!invitation || invitation.user_id !== payload.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (isCloudflare) {
      // ===== Cloudflare R2 환경 =====
      const { getCloudflareContext } = await import("@opennextjs/cloudflare");
      const { env } = (await getCloudflareContext()) as unknown as { env: CloudflareEnv };

      const baseKey = `invitation/${invitationId}/${imageId}`;
      const webKey = `${baseKey}_web.webp`;
      const thumbKey = `${baseKey}_thumb.webp`;

      await Promise.all([
        env.R2.delete(webKey),
        env.R2.delete(thumbKey),
      ]);
    } else {
      // ===== 로컬 개발 환경 =====
      const subDir = `invitation/${invitationId}`;
      const webPath = path.join(LOCAL_UPLOAD_DIR, subDir, `${imageId}_web.webp`);
      const thumbPath = path.join(LOCAL_UPLOAD_DIR, subDir, `${imageId}_thumb.webp`);

      await Promise.all([
        unlink(webPath).catch(() => {}),
        unlink(thumbPath).catch(() => {}),
      ]);
    }

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
