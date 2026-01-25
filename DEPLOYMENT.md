# Dear Drawer 배포 가이드

이 문서는 Dear Drawer 프로젝트의 배포 과정에서 발생한 문제들과 해결방법을 정리합니다.

## 목차

- [배포 전 체크리스트](#배포-전-체크리스트)
- [배포 방법](#배포-방법)
- [배포 후 검증](#배포-후-검증)
- [문제 해결 기록](#문제-해결-기록)
- [문제 기록 템플릿](#문제-기록-템플릿)

---

## 배포 전 체크리스트

### 1. 환경변수 확인

#### GitHub Secrets (필수)
- [ ] `CLOUDFLARE_API_TOKEN` - Cloudflare API 토큰
- [ ] `CLOUDFLARE_ACCOUNT_ID` - Cloudflare 계정 ID

#### GitHub Variables (선택)
- [ ] `NEXT_PUBLIC_KAKAO_CLIENT_ID` - 카카오 클라이언트 ID
- [ ] `NEXT_PUBLIC_KAKAO_REDIRECT_URI` - 카카오 리다이렉트 URI
- [ ] `NEXT_PUBLIC_R2_PUBLIC_URL` - R2 퍼블릭 URL

#### Cloudflare Dashboard 환경변수
- [ ] `TELEGRAM_BOT_TOKEN` (Secret) - 텔레그램 봇 토큰
- [ ] `TELEGRAM_CHAT_ID` - 텔레그램 채팅 ID
- [ ] `NEXTAUTH_SECRET` - NextAuth 시크릿

### 2. 빌드 설정 확인

#### package.json
```json
{
  "devDependencies": {
    "@opennextjs/cloudflare": "^1.14.8"  // 이 버전 유지 필수!
  }
}
```

> **주의**: `@opennextjs/cloudflare` 버전을 1.14.8 미만으로 다운그레이드하면 500 에러가 발생합니다.

#### wrangler.toml
```toml
name = "dear-drawer"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]

[[d1_databases]]
binding = "DB"
database_name = "dear-drawer-db"
database_id = "YOUR_DATABASE_ID"

[[r2_buckets]]
binding = "R2"
bucket_name = "dear-drawer-images"
```

### 3. Cloudflare 바인딩 확인

Cloudflare Dashboard > Pages > dear-drawer > Settings > Functions

- [ ] D1 Database (`DB`) 바인딩 연결됨
- [ ] R2 Bucket (`R2`) 바인딩 연결됨

### 4. 로컬 캐시 정리 (문제 발생 시)

```bash
rm -rf .next .open-next .wrangler
```

---

## 배포 방법

### 권장: GitHub Actions (자동 배포)

```bash
git add -A
git commit -m "Your commit message"
git push origin master
```

- `master` 브랜치에 push하면 자동으로 배포됩니다
- Linux 환경에서 빌드되어 Windows 관련 문제가 없습니다

### 배포 상태 확인

```bash
# GitHub Actions 실행 목록
gh run list --limit 5

# 특정 실행 모니터링
gh run watch <RUN_ID>
```

### 수동 배포 (비권장)

Windows에서 로컬 빌드 시 `resvg.wasm` 관련 오류가 발생할 수 있습니다.

```bash
npm run deploy
```

---

## 배포 후 검증

### 필수 확인 사항

```bash
# 1. 메인 페이지
curl -s -o /dev/null -w "%{http_code}" "https://invite.deardrawer.com"
# 예상: 200

# 2. 청첩장 페이지 (short ID)
curl -s -o /dev/null -w "%{http_code}" "https://invite.deardrawer.com/i/<SHORT_ID>"
# 예상: 200

# 3. 내 청첩장 목록
curl -s -o /dev/null -w "%{http_code}" "https://invite.deardrawer.com/my-invitations"
# 예상: 200

# 4. 갤러리 페이지
curl -s -o /dev/null -w "%{http_code}" "https://invite.deardrawer.com/gallery"
# 예상: 200
```

### 기능 테스트

- [ ] 로그인/회원가입 작동
- [ ] 청첩장 생성/수정/삭제
- [ ] 이미지 업로드
- [ ] 카카오톡 공유 (썸네일 포함)
- [ ] RSVP 제출
- [ ] 방명록 작성

---

## 문제 해결 기록

### Issue #001: @opennextjs/cloudflare 버전 다운그레이드로 인한 500 에러

| 항목 | 내용 |
|------|------|
| **발생일** | 2026-01-25 |
| **증상** | 모든 페이지에서 500 Internal Server Error 반환 |
| **원인** | `@opennextjs/cloudflare`를 1.14.8에서 1.10.0/1.8.0으로 다운그레이드 |
| **해결방법** | package.json에서 버전을 `^1.14.8`로 복원 |
| **예방책** | 이 패키지 버전을 다운그레이드하지 말 것 |

**문제 코드:**
```json
"@opennextjs/cloudflare": "^1.8.0"  // 500 에러 발생
```

**해결 코드:**
```json
"@opennextjs/cloudflare": "^1.14.8"  // 정상 작동
```

---

### Issue #002: Windows에서 wrangler resvg.wasm 빌드 오류

| 항목 | 내용 |
|------|------|
| **발생일** | 2026-01-25 |
| **증상** | `wrangler pages deploy` 실행 시 파일을 찾을 수 없음 오류 |
| **에러메시지** | `ENOENT: no such file or directory, open '...\resvg.wasm?module'` |
| **원인** | Windows에서 `?module` 접미사가 파일명의 일부로 해석됨 |
| **해결방법** | GitHub Actions를 통해 Linux 환경에서 빌드/배포 |
| **예방책** | Windows에서 로컬 배포 대신 항상 GitHub Actions 사용 |

---

### Issue #003: Turbopack 캐시 손상

| 항목 | 내용 |
|------|------|
| **발생일** | 2026-01-25 |
| **증상** | 개발 서버에서 `Failed to restore task data (corrupted database or bug)` 오류 |
| **원인** | `.next` 폴더의 Turbopack 캐시 손상 |
| **해결방법** | 캐시 폴더 삭제 후 재시작 |
| **예방책** | 문제 발생 시 캐시 삭제 |

**해결 명령어:**
```bash
rm -rf .next .open-next .wrangler
npm run dev
```

---

### Issue #004: Short ID (8자리) 청첩장 404 에러

| 항목 | 내용 |
|------|------|
| **발생일** | 2026-01-25 |
| **증상** | `/i/e91bedfe` 같은 8자리 ID로 접근 시 404 반환 |
| **원인** | `isUUID()` 함수가 36자리 UUID만 인식하여 8자리 short ID를 처리하지 못함 |
| **해결방법** | `/i/[slug]/page.tsx`에서 UUID 형식과 관계없이 ID 조회 시도하도록 수정 |
| **파일** | `src/app/i/[slug]/page.tsx` |

**수정 전:**
```typescript
if (isUUID(slug)) {
  invitation = await getInvitationById(slug);
}
```

**수정 후:**
```typescript
// slug로 먼저 조회
if (!invitation) {
  invitation = await getInvitationBySlug(slug);
}
// ID로 조회 (UUID 또는 8자리 short ID)
if (!invitation) {
  invitation = await getInvitationById(slug);
}
```

---

### Issue #005: 카카오톡 공유 시 썸네일 누락 (/my-invitations)

| 항목 | 내용 |
|------|------|
| **발생일** | 2026-01-25 |
| **증상** | `/my-invitations` 페이지에서 카카오톡 공유 시 기본 og-image만 표시 |
| **원인** | `handleKakaoShare`에서 하드코딩된 `og-image.png` 사용 |
| **해결방법** | 청첩장의 실제 커버 이미지를 사용하도록 수정 |
| **파일** | `src/app/(main)/my-invitations/page.tsx` |

**수정 코드:**
```typescript
const handleKakaoShare = () => {
  const { coverImage } = parseInvitationContent(shareInvitation.content)

  let imageUrl = 'https://invite.deardrawer.com/og-image.png'
  if (coverImage) {
    if (coverImage.startsWith('https://')) {
      imageUrl = coverImage
    } else if (coverImage.startsWith('/')) {
      imageUrl = `https://invite.deardrawer.com${coverImage}`
    }
  }
  // ...
}
```

---

## 문제 기록 템플릿

새로운 문제가 발생하면 아래 템플릿을 복사하여 [문제 해결 기록](#문제-해결-기록) 섹션에 추가하세요.

```markdown
### Issue #XXX: [문제 제목]

| 항목 | 내용 |
|------|------|
| **발생일** | YYYY-MM-DD |
| **증상** | [사용자가 경험한 증상] |
| **에러메시지** | `[에러 메시지가 있다면 기록]` |
| **원인** | [근본 원인 분석] |
| **해결방법** | [해결 방법 설명] |
| **파일** | [수정한 파일 경로] |
| **예방책** | [재발 방지를 위한 조치] |

**관련 코드:**
\`\`\`typescript
// 문제가 된 코드 또는 해결 코드
\`\`\`
```

---

## 롤백 방법

### Cloudflare 대시보드에서 롤백

1. [Cloudflare Dashboard](https://dash.cloudflare.com) 접속
2. Pages > dear-drawer > Deployments
3. 작동하던 배포 선택 > "Rollback to this deployment" 클릭

### 배포 목록 확인

```bash
npx wrangler pages deployment list --project-name dear-drawer
```

### 작동 확인

```bash
# 특정 배포 URL로 확인
curl -s -o /dev/null -w "%{http_code}" "https://<DEPLOYMENT_ID>.dear-drawer.pages.dev"
```

---

## 유용한 명령어

```bash
# 로컬 개발 서버
npm run dev

# 프로덕션 빌드 테스트
npm run build

# Cloudflare 빌드
npm run build:cloudflare

# 배포 (GitHub Actions 권장)
git push origin master

# D1 데이터베이스 스튜디오
npm run db:studio

# 캐시 정리
rm -rf .next .open-next .wrangler
```

---

*마지막 업데이트: 2026-01-25*
