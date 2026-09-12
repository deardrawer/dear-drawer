import { NextRequest, NextResponse } from "next/server";
import { verifyToken, getAuthCookieName } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

/**
 * [오너] 청첩장 동영상(mp4) 파일 업로드 — the-simple 등 파일 동영상용.
 * - mp4(H.264 권장)만, 50MB 이하. 저장 경로: invitation/{id}/video/{uid}.mp4
 * - 서빙은 /api/r2 (Range/206 지원)로 스트리밍 → 아이폰 재생 가능.
 * - 코덱(HEVC 등) 브라우저 호환은 업로드 전 클라이언트에서 재생 테스트로 1차 검증.
 */
const isCloudflare = process.env.CF_PAGES === "1" || process.env.CLOUDFLARE === "1";

interface CloudflareEnv {
  R2: R2Bucket;
}

const ALLOWED_TYPES = ["video/mp4"];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const LOCAL_UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

async function ensureUploadDir(subDir: string = "") {
  const dir = path.join(LOCAL_UPLOAD_DIR, subDir);
  try {
    await mkdir(dir, { recursive: true });
  } catch {
    // already exists
  }
  return dir;
}

export async function POST(request: NextRequest) {
  try {
    const cookieName = getAuthCookieName();
    const token = request.cookies.get(cookieName)?.value;

    if (!token) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const invitationId = (formData.get("invitationId") as string) || "temp";

    if (!file) {
      return NextResponse.json({ error: "동영상 파일이 필요합니다." }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "MP4 파일만 업로드 가능합니다." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "파일 크기는 50MB 이하여야 합니다." },
        { status: 400 }
      );
    }

    const videoId = crypto.randomUUID();

    if (isCloudflare) {
      const { getCloudflareContext } = await import("@opennextjs/cloudflare");
      const { env } = (await getCloudflareContext()) as unknown as { env: CloudflareEnv };

      const key = `invitation/${invitationId}/video/${videoId}.mp4`;
      const buffer = await file.arrayBuffer();
      await env.R2.put(key, buffer, {
        httpMetadata: {
          contentType: "video/mp4",
          cacheControl: "public, max-age=31536000",
        },
      });

      return NextResponse.json({
        success: true,
        url: `/api/r2/${key}`,
      });
    } else {
      const subDir = `invitation/${invitationId}/video`;
      await ensureUploadDir(subDir);

      const fileName = `${videoId}.mp4`;
      const buffer = Buffer.from(await file.arrayBuffer());
      const filePath = path.join(LOCAL_UPLOAD_DIR, subDir, fileName);
      await writeFile(filePath, buffer);

      return NextResponse.json({
        success: true,
        url: `/uploads/${subDir}/${fileName}`,
      });
    }
  } catch (error) {
    console.error("Video upload error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
