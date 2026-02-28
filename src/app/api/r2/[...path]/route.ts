import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getInvitationById } from "@/lib/db";
import { verifyToken, getAuthCookieName } from "@/lib/auth";

interface CloudflareEnv {
  R2: R2Bucket;
}

// Path validation: invitation/{id}/{filename}.{ext} 형식만 허용
const SAFE_PATH_REGEX = /^invitation\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+\.(webp|jpg|jpeg|png)$/;

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
    if (!SAFE_PATH_REGEX.test(key)) {
      return NextResponse.json({ error: "잘못된 파일 경로입니다." }, { status: 400 });
    }

    // 2. invitationId 추출 (invitation/{invitationId}/{filename})
    const invitationId = path[1];
    if (!invitationId) {
      return NextResponse.json({ error: "잘못된 파일 경로입니다." }, { status: 400 });
    }

    // 3. 청첩장 존재 및 발행 상태 확인
    const invitation = await getInvitationById(invitationId);
    if (!invitation) {
      return NextResponse.json({ error: "파일을 찾을 수 없습니다." }, { status: 404 });
    }

    const isPublished = !!invitation.is_published;

    // 4. 미발행 청첩장 → 소유자만 접근 가능
    if (!isPublished) {
      const cookieName = getAuthCookieName();
      const token = request.cookies.get(cookieName)?.value;

      if (!token) {
        return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
      }

      const payload = await verifyToken(token);
      if (!payload || payload.user.id !== invitation.user_id) {
        return NextResponse.json({ error: "접근 권한이 없습니다." }, { status: 403 });
      }
    }

    // 5. R2에서 파일 가져오기
    const { env } = (await getCloudflareContext()) as unknown as { env: CloudflareEnv };
    const object = await env.R2.get(key);

    if (!object) {
      return NextResponse.json({ error: "파일을 찾을 수 없습니다." }, { status: 404 });
    }

    // 6. 캐시 정책: published vs unpublished 분리
    const headers = new Headers();
    headers.set("Content-Type", object.httpMetadata?.contentType || "application/octet-stream");
    headers.set("ETag", object.httpEtag);

    if (isPublished) {
      headers.set("Cache-Control", "public, max-age=31536000, immutable");
    } else {
      headers.set("Cache-Control", "private, no-store");
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
