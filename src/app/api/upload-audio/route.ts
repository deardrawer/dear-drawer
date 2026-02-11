import { NextRequest, NextResponse } from "next/server";
import { verifyToken, getAuthCookieName } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const isCloudflare = process.env.CF_PAGES === "1" || process.env.CLOUDFLARE === "1";

interface CloudflareEnv {
  R2: R2Bucket;
}

const ALLOWED_TYPES = ["audio/mpeg", "audio/mp3"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

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
    const invitationId = formData.get("invitationId") as string || "temp";

    if (!file) {
      return NextResponse.json({ error: "MP3 파일이 필요합니다." }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "MP3 파일만 업로드 가능합니다." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "파일 크기는 10MB 이하여야 합니다." },
        { status: 400 }
      );
    }

    const audioId = crypto.randomUUID();

    if (isCloudflare) {
      const { getCloudflareContext } = await import("@opennextjs/cloudflare");
      const { env } = (await getCloudflareContext()) as unknown as { env: CloudflareEnv };

      const key = `invitation/${invitationId}/audio/${audioId}.mp3`;
      const buffer = await file.arrayBuffer();
      await env.R2.put(key, buffer, {
        httpMetadata: {
          contentType: "audio/mpeg",
          cacheControl: "public, max-age=31536000",
        },
      });

      return NextResponse.json({
        success: true,
        url: `/api/r2/${key}`,
      });
    } else {
      const subDir = `invitation/${invitationId}/audio`;
      await ensureUploadDir(subDir);

      const fileName = `${audioId}.mp3`;
      const buffer = Buffer.from(await file.arrayBuffer());
      const filePath = path.join(LOCAL_UPLOAD_DIR, subDir, fileName);
      await writeFile(filePath, buffer);

      return NextResponse.json({
        success: true,
        url: `/uploads/${subDir}/${fileName}`,
      });
    }
  } catch (error) {
    console.error("Audio upload error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
