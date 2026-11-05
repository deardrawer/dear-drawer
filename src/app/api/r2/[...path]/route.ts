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

// 엣지 캐시 (Cloudflare Cache API) — 이미지 전체 응답만, 지역 데이터센터에 30일 보관
// - 첫 하객 이후로는 R2까지 가지 않고 가까운 엣지에서 바로 응답 → 오프닝 사진 등 첫 로딩 단축
// - 파일명이 업로드마다 새로 정해지는 이미지(UUID)만 대상. 같은 이름으로 덮어쓰는 파일
//   (drawer-stamp · video-poster · capsule-*)은 제외 — 주소의 ?t= 로 갱신되긴 하지만 혹시 모를 옛 사진 노출 방지
// - 동영상·오디오(Range 스트리밍)는 대상 아님. Cache API가 없는 환경(로컬 dev)에선 그냥 건너뜀
const BROWSER_CACHE_CONTROL = "public, max-age=31536000, immutable";
const EDGE_CACHE_CONTROL = "public, max-age=2592000";
const FIXED_NAME_REGEX = /\/(drawer-stamp|video-poster|capsule-[a-zA-Z0-9_-]+)(_[a-z]+)?\.[a-z]+$/;

function getEdgeCache(): Cache | null {
  try {
    const c = (globalThis as unknown as { caches?: { default?: Cache } }).caches;
    return c?.default ?? null;
  } catch {
    return null;
  }
}

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
    const isImage = SAFE_PATH_REGEX.test(key) || isGeunnalImage;
    const edgeCache = isImage && !FIXED_NAME_REGEX.test(key) ? getEdgeCache() : null;
    const cacheKey = edgeCache ? new Request(request.url, { method: "GET" }) : null;

    if (edgeCache && cacheKey) {
      try {
        const hit = await edgeCache.match(cacheKey);
        if (hit) {
          const hitHeaders = new Headers(hit.headers);
          hitHeaders.set("Cache-Control", BROWSER_CACHE_CONTROL);
          hitHeaders.set("X-Edge-Cache", "HIT");
          return new NextResponse(hit.body, { status: 200, headers: hitHeaders });
        }
      } catch {
        /* 캐시 조회 실패 → 아래에서 R2로 */
      }
    }

    const object = await env.R2.get(key);

    if (!object) {
      return NextResponse.json({ error: "파일을 찾을 수 없습니다." }, { status: 404 });
    }

    const headers = new Headers();
    headers.set("Content-Type", object.httpMetadata?.contentType || "application/octet-stream");
    headers.set("ETag", object.httpEtag);
    headers.set("Cache-Control", BROWSER_CACHE_CONTROL);
    headers.set("Accept-Ranges", "bytes");

    if (edgeCache && cacheKey) {
      try {
        const [forClient, forCache] = object.body.tee();
        const edgeHeaders = new Headers(headers);
        edgeHeaders.set("Cache-Control", EDGE_CACHE_CONTROL);
        const { ctx } = (await getCloudflareContext()) as unknown as { ctx: { waitUntil: (p: Promise<unknown>) => void } };
        ctx.waitUntil(
          edgeCache.put(cacheKey, new Response(forCache, { status: 200, headers: edgeHeaders })).catch(() => {})
        );
        headers.set("X-Edge-Cache", "MISS");
        return new NextResponse(forClient, { status: 200, headers });
      } catch {
        /* 캐시 저장 준비 실패 → 아래 기존 응답 (tee 이전 실패만 여기로 옴) */
      }
    }

    return new NextResponse(object.body, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("R2 serve error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
