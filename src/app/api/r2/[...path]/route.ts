import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

interface CloudflareEnv {
  R2: R2Bucket;
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

    // R2 bucket 가져오기
    const { env } = (await getCloudflareContext()) as unknown as { env: CloudflareEnv };

    // R2에서 파일 가져오기
    const object = await env.R2.get(key);

    if (!object) {
      return NextResponse.json({ error: "파일을 찾을 수 없습니다." }, { status: 404 });
    }

    // 응답 헤더 설정
    const headers = new Headers();
    headers.set("Content-Type", object.httpMetadata?.contentType || "application/octet-stream");
    headers.set("Cache-Control", object.httpMetadata?.cacheControl || "public, max-age=31536000");
    headers.set("ETag", object.httpEtag);

    // 바디 스트림 반환
    return new NextResponse(object.body, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("R2 serve error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
