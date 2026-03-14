import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// 환경 감지: Cloudflare Workers 환경인지 확인
const isCloudflare =
  process.env.CF_PAGES === "1" || process.env.CLOUDFLARE === "1";

interface CloudflareEnv {
  R2: R2Bucket;
}

// 허용 파일 타입
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
// 최대 파일 크기 (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

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
  // PUBLIC endpoint - no auth required
  try {
    const formData = await request.formData();

    const file = formData.get("file") as File | null;
    const pageId = (formData.get("pageId") as string) || "temp";
    const eventId = (formData.get("eventId") as string) || "temp";

    if (!file) {
      return NextResponse.json(
        { error: "이미지 파일이 필요합니다" },
        { status: 400 }
      );
    }

    // 파일 타입 검증
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "지원하지 않는 파일 형식입니다 (JPG, PNG, WebP만 가능)" },
        { status: 400 }
      );
    }

    // 파일 크기 검증
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "파일 크기는 10MB 이하여야 합니다" },
        { status: 400 }
      );
    }

    const imageId = crypto.randomUUID().split("-")[0];

    // 환경에 따라 분기
    if (isCloudflare) {
      // ===== Cloudflare R2 환경 =====
      const { getCloudflareContext } = await import("@opennextjs/cloudflare");
      const { env } = (await getCloudflareContext()) as unknown as {
        env: CloudflareEnv;
      };

      const baseUrl = "/api/r2";
      const key = `geunnal/${pageId}/${eventId}/${imageId}.webp`;

      const buffer = await file.arrayBuffer();
      await env.R2.put(key, buffer, {
        httpMetadata: {
          contentType: "image/webp",
          cacheControl: "public, max-age=31536000",
        },
      });

      return NextResponse.json({
        success: true,
        url: `${baseUrl}/${key}`,
        imageId,
      });
    } else {
      // ===== 로컬 개발 환경 (파일 시스템) =====
      const subDir = `geunnal/${pageId}/${eventId}`;
      await ensureUploadDir(subDir);

      const baseUrl = "/uploads";
      const fileName = `${imageId}.webp`;

      const buffer = Buffer.from(await file.arrayBuffer());
      const filePath = path.join(LOCAL_UPLOAD_DIR, subDir, fileName);
      await writeFile(filePath, buffer);

      return NextResponse.json({
        success: true,
        url: `${baseUrl}/${subDir}/${fileName}`,
        imageId,
      });
    }
  } catch (error) {
    console.error("Geunnal upload API error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
