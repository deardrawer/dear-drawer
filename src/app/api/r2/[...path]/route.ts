import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

interface CloudflareEnv {
  R2: R2Bucket;
}

// Path validation: 허용 패턴
const SAFE_PATH_REGEX = /^invitation\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+\.(webp|jpg|jpeg|png)$/;
const USER_AUDIO_PATH_REGEX = /^invitation\/[a-zA-Z0-9_-]+\/audio\/[a-zA-Z0-9_-]+\.mp3$/;
const PRESET_AUDIO_PATH_REGEX = /^audio\/[a-zA-Z0-9_-]+\.mp3$/;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    const key = path.join("/");

    if (!key) {
      return NextResponse.json({ error: "파일 경로가 필요합니다." }, { status: 400 });
    }

    // 1. Path validation — directory traversal 차단, 허용 패턴만 통과
    const isPresetAudio = PRESET_AUDIO_PATH_REGEX.test(key);
    const isUserAudio = USER_AUDIO_PATH_REGEX.test(key);
    if (!SAFE_PATH_REGEX.test(key) && !isPresetAudio && !isUserAudio) {
      return NextResponse.json({ error: "잘못된 파일 경로입니다." }, { status: 400 });
    }

    // 2. R2에서 파일 가져오기 (모든 이미지/오디오 공개 서빙)
    // temp 경로 포함 — 에디터에서 저장된 이미지가 temp 경로에 남아있을 수 있음
    // 파일명이 UUID이므로 보안 위험 최소, path validation이 보안 담당
    const { env } = (await getCloudflareContext()) as unknown as { env: CloudflareEnv };
    const object = await env.R2.get(key);

    if (!object) {
      return NextResponse.json({ error: "파일을 찾을 수 없습니다." }, { status: 404 });
    }

    // 3. 응답 헤더 설정
    const headers = new Headers();
    headers.set("Content-Type", object.httpMetadata?.contentType || "application/octet-stream");
    headers.set("ETag", object.httpEtag);
    headers.set("Cache-Control", "public, max-age=31536000, immutable");

    return new NextResponse(object.body, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("R2 serve error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
