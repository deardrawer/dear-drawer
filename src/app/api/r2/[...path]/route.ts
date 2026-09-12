import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

interface CloudflareEnv {
  R2: R2Bucket;
}

// Path validation: 허용 패턴
const SAFE_PATH_REGEX = /^invitation\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+\.(webp|jpg|jpeg|png)$/;
const GEUNNAL_IMAGE_PATH_REGEX = /^geunnal\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+\.(webp|jpg|jpeg|png)$/;
const USER_AUDIO_PATH_REGEX = /^invitation\/[a-zA-Z0-9_-]+\/audio\/[a-zA-Z0-9_-]+\.mp3$/;
const PRESET_AUDIO_PATH_REGEX = /^audio\/[a-zA-Z0-9_-]+\.mp3$/;
// 하객 청첩장 동영상(mp4) — 파일 업로드 방식. 스트리밍 위해 Range 응답 필요(아이폰 재생 필수).
const USER_VIDEO_PATH_REGEX = /^invitation\/[a-zA-Z0-9_-]+\/video\/[a-zA-Z0-9_-]+\.mp4$/;

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
    const isGeunnalImage = GEUNNAL_IMAGE_PATH_REGEX.test(key);
    const isUserVideo = USER_VIDEO_PATH_REGEX.test(key);
    if (!SAFE_PATH_REGEX.test(key) && !isGeunnalImage && !isPresetAudio && !isUserAudio && !isUserVideo) {
      return NextResponse.json({ error: "잘못된 파일 경로입니다." }, { status: 400 });
    }

    const { env } = (await getCloudflareContext()) as unknown as { env: CloudflareEnv };

    // 2. Range 요청 처리 (동영상/오디오 스트리밍·seek, 특히 iOS 사파리는 206이 필수)
    //    Range 헤더가 있을 때만 부분 응답. 없으면 기존처럼 200 전체 응답(이미지 등 그대로).
    const rangeHeader = request.headers.get("range");
    if (rangeHeader) {
      const head = await env.R2.head(key);
      if (!head) {
        return NextResponse.json({ error: "파일을 찾을 수 없습니다." }, { status: 404 });
      }
      const size = head.size;
      const m = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader.trim());
      let start = m && m[1] ? parseInt(m[1], 10) : 0;
      let end = m && m[2] ? parseInt(m[2], 10) : size - 1;
      if (Number.isNaN(start)) start = 0;
      if (Number.isNaN(end) || end >= size) end = size - 1;
      if (start > end || start >= size) {
        return new NextResponse(null, {
          status: 416,
          headers: { "Content-Range": `bytes */${size}`, "Accept-Ranges": "bytes" },
        });
      }
      const length = end - start + 1;
      const ranged = await env.R2.get(key, { range: { offset: start, length } });
      if (!ranged) {
        return NextResponse.json({ error: "파일을 찾을 수 없습니다." }, { status: 404 });
      }
      const rHeaders = new Headers();
      rHeaders.set("Content-Type", head.httpMetadata?.contentType || "application/octet-stream");
      rHeaders.set("ETag", head.httpEtag);
      rHeaders.set("Cache-Control", "public, max-age=31536000, immutable");
      rHeaders.set("Accept-Ranges", "bytes");
      rHeaders.set("Content-Range", `bytes ${start}-${end}/${size}`);
      rHeaders.set("Content-Length", String(length));
      return new NextResponse(ranged.body, { status: 206, headers: rHeaders });
    }

    // 3. Range 없음 — 전체 파일 서빙 (기존 동작)
    // temp 경로 포함 — 에디터에서 저장된 이미지가 temp 경로에 남아있을 수 있음
    // 파일명이 UUID이므로 보안 위험 최소, path validation이 보안 담당
    const object = await env.R2.get(key);

    if (!object) {
      return NextResponse.json({ error: "파일을 찾을 수 없습니다." }, { status: 404 });
    }

    const headers = new Headers();
    headers.set("Content-Type", object.httpMetadata?.contentType || "application/octet-stream");
    headers.set("ETag", object.httpEtag);
    headers.set("Cache-Control", "public, max-age=31536000, immutable");
    headers.set("Accept-Ranges", "bytes");

    return new NextResponse(object.body, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("R2 serve error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
