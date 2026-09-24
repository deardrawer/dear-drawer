# dear-drawer 알림 크론 Worker

앱의 알림 스케줄을 **신뢰성 있게** 돌리기 위한 전용 Cloudflare Worker.

## 왜 필요한가 (근거)
- 본 앱은 Cloudflare **Pages**로 배포됨 → **Pages는 Cron Triggers 미지원**.
- 그래서 알림 스케줄을 **GitHub Actions `schedule` (`*/5 * * * *`)** 로 돌렸는데,
  GitHub은 고빈도 예약 워크플로우를 부하 시 **대부분 드롭**함.
  - 실측(9일/60건): 예상 ~2,582건 대비 **실제 60건 = 약 2.3%**, 실행 간격 **중앙값 ~230분(≈3.8h)**, 최대 ~7h.
  - 워크플로우는 active·master·이벤트=schedule·skip 없음 → **설정 문제가 아니라 GitHub 플랫폼 특성**.
- Cloudflare Workers **Cron Trigger는 예약대로 실행**되므로 이 Worker로 대체.

## ⚠️ 반드시 `--config wrangler.toml` (또는 npm 스크립트) 사용
상위 `wedding-link/` 에 wrangler 설정(`wrangler.jsonc` + `wrangler.toml`, 둘 다 **Pages** 앱)이 있어,
cron-worker 폴더에서 그냥 `wrangler deploy` 를 하면 wrangler(v4)가 **상위 Pages 설정을 읽어**
`It looks like you've run a Workers-specific command in a Pages project` 오류가 납니다.
→ 이 폴더의 `package.json` 스크립트에는 `--config wrangler.toml` 이 내장돼 있으니 **npm 스크립트를 쓰세요.**

## 배포 (최초 1회)
> 별도 Worker라 앱(Pages) 배포와 무관. GitHub push로는 배포되지 않으니 아래 명령을 직접 실행.

```bash
cd wedding-link/cron-worker

# (로그인 안 돼 있으면 먼저) npx wrangler login

# 1) 배포 (Worker 생성 + cron trigger 등록)  — 아직 시크릿 없으니 이 시점 호출은 401(무방)
npm run deploy

# 2) 앱과 동일한 CRON_SECRET 을 시크릿으로 등록 (프롬프트에 값 입력) → Worker는 즉시 반영
npm run secret

# 로그 확인
npm run tail
```

배포 후 Cloudflare 대시보드 → Workers & Pages → `dear-drawer-cron` → Triggers 에서
Cron `*/5 * * * *` 이 등록됐는지 확인. 로그는 Workers 로그(Observability)에서 확인.

## 수동 테스트
```bash
curl -X POST "https://dear-drawer-cron.<your-subdomain>.workers.dev" \
  -H "Authorization: Bearer <CRON_SECRET>"
# -> {"ok":true,"status":200,...}
```

## 전환 후
정상 동작 확인되면 GitHub Actions 워크플로우(`.github/workflows/notification-cron.yml`)의
`schedule:` 를 제거하거나 workflow 를 비활성화(중복 호출 방지). `workflow_dispatch` 는 남겨 수동 실행용으로 유지 가능.

## 주기 변경
`wrangler.toml` 의 `crons` 수정 후 `wrangler deploy`. (Workers cron 최소 단위 1분: `*/1 * * * *`)
