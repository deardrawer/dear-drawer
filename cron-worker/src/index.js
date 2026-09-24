/**
 * dear-drawer 알림 크론 Worker
 *  - Cloudflare Cron Trigger(신뢰성 있는 스케줄)로 앱의 알림 발송 엔드포인트를 호출.
 *  - GitHub Actions cron(고빈도 시 대부분 드롭됨) 대체.
 *
 * env:
 *  - API_URL     (var)    예: https://invite.deardrawer.com
 *  - CRON_SECRET (secret) 앱의 CRON_SECRET 과 동일 (Bearer 인증)
 */
export default {
  // 스케줄(cron) 실행
  async scheduled(event, env, ctx) {
    ctx.waitUntil(sendNotifications(env));
  },

  // 수동 트리거/헬스체크용(선택). CRON_SECRET 없으면 401.
  async fetch(request, env) {
    const auth = request.headers.get('authorization') || '';
    if (!env.CRON_SECRET || auth !== `Bearer ${env.CRON_SECRET}`) {
      return new Response('Unauthorized', { status: 401 });
    }
    const result = await sendNotifications(env);
    return new Response(JSON.stringify(result), {
      headers: { 'content-type': 'application/json' },
    });
  },
};

async function sendNotifications(env) {
  const url = `${env.API_URL}/api/geunnal/notifications/send`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.CRON_SECRET}` },
    });
    const body = await res.text();
    console.log(`[cron] POST ${url} -> ${res.status} ${body.slice(0, 300)}`);
    return { ok: res.ok, status: res.status, body: body.slice(0, 300) };
  } catch (err) {
    console.error('[cron] fetch failed:', err);
    return { ok: false, error: String(err) };
  }
}
