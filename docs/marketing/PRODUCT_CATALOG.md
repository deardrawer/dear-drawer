# PRODUCT_CATALOG.md — 디어드로어(dear drawer) 제품 카탈로그

**생성 일자:** 2026-07-25
**분석 기준 커밋:** `2b4df96` (master)
**분석 대상:** `wedding-link/` (Next.js 16 · Cloudflare D1 + R2)

> 상태 태그: **[구현완료]** 코드로 동작 확인 / **[개발중]** 코드 있으나 미완성·범위 한정 / **[코드없음]** 코드 없음 / **[확인필요]** 코드로 확정 불가.
> **가격·플랜명·워터마크 정책·출시 일정은 → BRAND_FACTS.md 참조.** (이 문서에 값을 복제하지 않는다.)

---

## 1. 템플릿 카탈로그 [구현완료]

- 정의 원본: `src/lib/templates.ts` (초대장 10종). 노출 이름/태그라인: `src/app/templates/page.tsx`.
- **순수 한글 표시명은 없음** — 코드상 `name`은 영문 대문자. 사용자 화면엔 **영문 이름 + 한글 태그라인 + 한글 카테고리**(스토리형/미니스토리형/혼주용/감사장)로 노출.
- **메인 컬러**는 렌더러의 **기본 컬러테마** 기준(런타임 `colorTheme` 값이 있으면 그것이 우선). `templates.ts`의 색상 필드와 실제 렌더러 팔레트가 불일치하는 경우가 있어, 아래는 **실제 렌더러 기본값**을 기재.
- "어울리는 예식 스타일" / "이 템플릿을 고를 만한 사람"은 **작성자 판단**(코드 근거 아님).

| 노출 이름 | 내부 ID | 카테고리 | 컨셉(한 줄) | 기본 메인컬러(HEX) | 폰트(heading / body) | 애니메이션 | 어울리는 예식 스타일 *(판단)* | 이 템플릿을 고를 만한 사람 *(판단)* |
|---|---|---|---|---|---|---|---|---|
| **OUR** | `narrative-our` | 스토리형 | 두 사람의 사랑을 한 편의 이야기로 | primary `#C41050` · accent `#B8956A` · bg `#FFF8F5` (classic-rose) | Okticon / Pretendard | [구현완료] 공용 인트로 프리셋 | 채플·하우스·스몰웨딩 | 둘의 서사를 천천히 보여주고 싶은 커플 |
| **FAMILY** | `narrative-family` | 스토리형 | 두 가족이 함께 써 내려가는 결혼 이야기 | primary `#C41050` · accent `#B8956A` · bg `#FFF8F5` (classic-rose) | Noto Serif KR / Noto Sans KR | [구현완료] 공용 인트로 | 일반 예식장·호텔 | 양가 가족의 축복을 강조하고 싶은 커플 |
| **PARENTS** | `narrative-parents` | 혼주용 | 부모(혼주)의 시선으로 전하는 초대 | primary `#C8A0A0` · accent `#B89878` (burgundy 기본, 실제 로즈핑크) | Noto Serif KR / Pretendard | [구현완료] 봉투 오프닝 | 전통·호텔 예식 | 부모님이 지인분들께 직접 격식 있게 초대 |
| **MAGAZINE** | `narrative-magazine` | 미니스토리형 | 매거진 인터뷰로 전하는 우리 이야기 | primary `#111111` · bg `#FFFFFF` (modern-black 기본) | Montserrat / Pretendard | [구현완료] 공용 인트로 | 모던·도심 웨딩 | 미니멀·인터뷰 콘텐츠 취향 커플 |
| **MOVIE** | `narrative-film` | 스토리형 | 한 편의 영화처럼 펼쳐지는 시네마틱 | primary `#E8E4DF` · bg `#1C1C1E` · accent `#B8977E` (film-dark) | Playfair Display / Pretendard | [구현완료] 자체 시네마 연출 | 저녁·필름 감성 촬영 | 영화 같은 무드를 원하는 커플 |
| **RECORD** | `narrative-record` | 스토리형 | 비닐 레코드처럼 펼쳐지는 음악 앨범 | primary `#E89B8F` · accent `#D4766A` · bg `#FAF7F4` (record-coral) | Montserrat / Pretendard | [구현완료] 레코드 회전 | 캐주얼·파티형 | 음악 취향이 뚜렷, 플레이리스트 공유 |
| **FEED** | `narrative-exhibit` | 미니스토리형 | 미니스토리형 인스타 피드 청첩장 | 인스타 UI 하드코딩 · accent `#0095F6` · bg `#FFFFFF` | Pretendard / Pretendard | [구현완료] 스토리링·탭 전환 | 촬영 많이 한 커플·캐주얼 | 사진(리허설 다회) 풍부·SNS 감성 |
| **ESSAY** | `narrative-essay` | 미니스토리형 | 사진 없이도 빛나는, 에세이 같은 청첩장 | bg `#FAF8F3` · heading `#5C4A3A` · accent `#8B7355` (essay-ivory) | Playfair Display / Pretendard | [구현완료] 스크롤 + 책 넘기기 | 미니멀·스몰웨딩 | 사진 적어도 글/문장으로 표현하고 싶은 커플 |
| **THE SIMPLE** | `narrative-the-simple` | (필터 외) | 가장 일반적이면서도 특별한, 세련된 더심플 | 사용자 색 · 기본 pointColor `#B8A88A` · bg `#fbfaf7` | Cormorant Garamond / Pretendard | [구현완료] TapToOpen·구분선 12종 | 모든 유형 | 무난하면서 커스터마이즈 자유도를 원하는 대중 |
| **THANKS** | `narrative-thankyou` | 감사장 | 결혼식 후 감사의 마음을 전하는 모바일 감사장 | accent `#B89878` · seal `#722F37` · bg `#F5F3EF` | Noto Sans KR / Noto Sans KR | [구현완료] 폴라로이드·커튼 | (식후) 감사 인사 | 하객에게 사후 감사를 전하려는 신혼부부 |

**지원 섹션 목록(템플릿별, `templates.ts`)**
- OUR: opening / first-chapter(AI) / our-time(AI) / decision(AI) / invitation / details / closing
- FAMILY: opening / groom-story(AI) / bride-story(AI) / our-meeting(AI) / parents-message(AI·선택) / invitation / details / family-intro(선택) / closing
- PARENTS: envelope / greeting(AI) / timeline / gallery / date / venue / wedding-info(선택) / account / share / rsvp
- MAGAZINE: cover / editors-note / feature-interview(AI) / photo-spread / the-details / closing
- MOVIE: poster / chapter-1(AI) / chapter-2(AI) / chapter-3 / premiere / credits
- RECORD: vinyl-cover / track-01~05 / bonus-track(Liner Notes)
- FEED: cover / room-01~04 / greeting / details
- ESSAY: cover / greeting / story / quote / details / closing
- THE SIMPLE: intro / greeting / couple / info / direction / interview / gallery / guide(선택) / account(선택) / rsvp(선택) / guestbook(선택) / thanks(선택) — `sectionOrder` 기반 동적 순서
- THANKS: intro / photos / closing

**공용 자산**
- 인트로 애니메이션 프리셋 10종 [구현완료] (`src/lib/introPresets.ts`): 01 시네마틱 / 02 타이핑 / 03 포커스 / 04 프레임 / 05 레터 / 06 써클 / 07 아치 / 08 대각선 / 09 폴라로이드 / 10 필름. (OUR/FAMILY/MAGAZINE 등 공용 `IntroAnimation` 사용)
- 표준 컬러테마 6종 + custom: classic-rose `#C41050` · modern-black `#111111` · romantic-blush `#A67A7A` · nature-green `#3A5A3A` · luxury-navy `#0f2035` · sunset-coral `#B85040`
- 표준 폰트 12종: classic / modern / romantic / contemporary / luxury / gulim / adulthand / neathand / roundhand / roundgothic / suit / myungjo

> ⚠️ **주의:** `geunnal(근날)`은 초대장 템플릿이 **아니다.** 청첩장에 연결되는 별도 "모임 관리" 대시보드 기능(`/g/[slug]`). 카탈로그에서 제외.

---

## 2. 섹션·기능 인벤토리 [구현완료]

- 모든 토글은 편집기 상태 `InvitationContent`(`src/store/editorStore.ts`) → `invitations.content`(JSON)에 저장.
- **유·무료**: BRAND_FACTS.md 기준 **모든 기능은 무료**(워터마크 제거만 유료). 따라서 아래 전 항목 = **무료** / 워터마크 제거 = **유료(→ BRAND_FACTS.md 참조)**.

| 기능 | 하는 일(한 줄) | on/off | 유·무료 | 상태 |
|---|---|---|---|---|
| 섹션 표시 토글 | coupleProfile/ourStory/parentsGreeting/interview/guidance/contacts/bankAccounts/guestbook/rsvp/parentNames 개별 표시 | O | 무료 | [구현완료] |
| RSVP(참석 회신) | 참석 여부 응답 수집 | O(rsvpEnabled) | 무료 | [구현완료] |
| RSVP 세부옵션 | 동반인 수·식사 여부·셔틀 여부·연락처4자리·하객구분(신랑/신부·본인/부/모) | O | 무료 | [구현완료] |
| 배경음악(BGM) | 음악 재생 + 자동재생·알림표시·시작페이지 설정 | O(bgm.enabled) | 무료 | [구현완료] |
| 인트로 애니메이션 | 프리셋 10종 선택, 넘김 안내문구 토글, 배경모드(사진/단색/그라데이션) | O | 무료 | [구현완료] |
| D-Day 팝업 | 입장 시 D-day 팝업 + "오늘 그만 보기" | O(ddayPopup.enabled) | 무료 | [구현완료] |
| 안내 항목 | 드레스코드·사진공유·포토부스·화동·꽃답례품·화환·셔틀·피로연·커스텀(각각 on/off, 순서 조절) | O | 무료 | [구현완료] |
| 갤러리 | 레이아웃 4종(grid/slide/feature/custom)·라이트박스·더보기 | O | 무료 | [구현완료] |
| 유튜브 영상 | 영상 임베드(제목·URL) | O(youtube.enabled) | 무료 | [구현완료] |
| 계좌/축의금 | 인당 계좌 표시(신랑·신부·부·모) | O(인당 enabled) | 무료 | [구현완료] |
| 방명록 | 하객 축하 메시지 + 질문 프롬프트 | O | 무료 | [구현완료] |
| 오시는 길 | 지도 + 지도앱 버튼(네이버/카카오/티맵)·교통 안내·주차 | O(mapButtons 등) | 무료 | [구현완료] |
| 고인 표시 | 부모 고인 표기(한자/꽃) | O | 무료 | [구현완료] |
| FAMILY 전용 | 부모님 소개·서로를 선택한 이유·풀하이트 디바이더 | O | 무료 | [구현완료] |
| 표시 모드 셀렉터 | navStyle(햄버거/하단바/미니)·프로필 순서/프레임·인터뷰(인라인/팝업) 등 | 선택형 | 무료 | [구현완료] |
| 워터마크 제거 | 무료본 워터마크 제거 | 결제 | **유료 → BRAND_FACTS.md 참조** | [구현완료] |
| 커스텀 URL(슬러그) | 발행 주소 지정·중복확인·별칭(slug_aliases) | O | 무료 | [구현완료] |
| AI 문구 생성 | 인사말·프로필·스토리·인터뷰 초안 생성/재생성 | 사용 | 무료 | [구현완료] (`ai_generated_texts`) |
| 혼주 개인화 링크 | 하객별 맞춤 인사·4자리 비번 관리자 로그인·열람 추적 | O | 무료 | [구현완료] (PARENTS, `guests`/`invitation_admins`) |

> [미분류] 항목 없음 — BRAND_FACTS.md가 "모든 기능 무료, 워터마크 제거만 유료"로 전 범위를 규정.

**DB 스키마 요약 [구현완료]** (Cloudflare D1 단독, Supabase 없음)
- `invitations`(id, user_id, template_id, groom/bride_name, wedding_date/time, venue_*, main_image, gallery_images(JSON), greeting_message, contact_*, account_info(JSON), **content(전체 편집기 JSON)**, is_paid, is_published, slug, created/updated_at)
- `rsvp_responses`(guest_name, phone, attendance, guest_count, message, side, meal_attendance, shuttle_bus, side_detail, …)
- `guestbook_messages`, `page_views`, `guests`, `invitation_admins`(혼주 비번), `greeting_templates`, `slug_aliases`, `payment_requests`, `ai_generated_texts`
- `users` 테이블: **미존재** — 인증은 카카오 JWT로 외부 처리(user_id만 사용) [확인필요→확정: CREATE 없음]
- `invitations.imweb_order_no`: **스키마에 없음**(주석 처리된 ALTER만 존재)

---

## 3. 제작 흐름 [구현완료]

| 단계 | 내용 | 사용자 입력 |
|---|---|---|
| 0. 시작 | **로그인 없이 편집 시작 가능**. 저장/발행 시 카카오 로그인 강제(초안은 sessionStorage 보관 후 복원) | 0 (로그인 시 카카오 1클릭) |
| 1. 템플릿 선택 | `/templates` — 스타일 퀴즈(2~3문항) + 10종 쇼케이스 그리드. 선택 시 랜덤 슬러그 자동생성 | 퀴즈 2~3 선택 |
| 2. 위저드 편집 | **템플릿별로 갈라짐**: 공용(OUR/FAMILY/MAGAZINE/MOVIE/RECORD) **5단계**(디자인·인트로·스토리·추가기능·발행), PARENTS 5 / ESSAY 5 / FEED 6 / THANKS 5 / THE-SIMPLE 섹션조립형 | 디자인 ~5선택 · 인트로 ~15~20 · 스토리 ~15~25 · 추가기능 ~10~30 (대부분 선택) — **필수는 디자인+발행뿐** |
| 3. 발행 | 슬러그 실시간 중복확인 → `is_published=true`. URL: `invite.deardrawer.com/i/<slug>` | 슬러그 1 |
| 4. 공유 | 링크 복사 / 카카오 공유(성공 모달·헤더 ShareModal) | 0 |

- 편집은 **3초 debounce 자동저장** + 수동 저장. (`editor/page.tsx`)
- 인증: **카카오 OAuth 단독** (+ 개발용 test-login, 프로덕션 숨김). 이메일/비번 가입 없음.

---

## 4. 알림·공유 (하객 경험 중심)

| 항목 | 하객이 경험하는 것 | 상태 |
|---|---|---|
| 카카오 로그인 | **호스트(제작자)** 로그인용. 하객이 청첩장 열람 시 로그인 불필요 | [구현완료] (`src/lib/auth.ts`, 카카오 콜백) |
| 공유 — 링크 복사 | 초대 링크 복사(프로덕션 도메인) | [구현완료] (`ShareModal.tsx`) |
| 공유 — QR | QR 생성 + 1024×1024 PNG 다운로드, 색상 선택 | [구현완료] |
| 공유 — 카카오톡 | Kakao JS SDK 피드형 공유(썸네일/문구), 미지원 시 클립보드 폴백 | [구현완료] |
| 공유 — SMS | `sms:?body=` 문자 공유(모바일) | [구현완료] |
| **알림톡(카카오 알림톡)** | — | **[코드없음]** (저장소 0건). 알림은 Web Push만 |
| PWA(설치/푸시) — 일반 청첩장 | **없음**: 루트 manifest·서비스워커 미등록 → 게스트 설치·푸시 불가 | **[코드없음]**(루트 기준) |
| PWA — 그날(geunnal) 영역 | `/g/[slug]`에서만 설치형 + Web Push(서비스워커·VAPID·5분 cron) 동작 | [개발중/범위 한정] |

---

## 5. 서랍장·타임캡슐 구현 현황

> 목적: 개발 진행 여부와 **마케팅 가능성 판단**.

| 하위 기능 | 상태 | 근거 |
|---|---|---|
| 서랍 자동 생성 | **[코드없음]** | 관련 로직 0건. "drawer"는 브랜드명뿐 |
| 시간 잠금(미래 개봉) | **[코드없음]** | lockUntil/openAt/개봉 로직 없음 |
| 구글 로그인 연동 | **[코드없음]** | 카카오 OAuth만 존재. googleapis=폰트 CDN |
| 이메일 발송 | **[코드없음]** | nodemailer/resend/sendgrid 등 의존성·코드 0건 |

**결론:** 서랍장/타임캡슐은 서랍 엔티티·자동 생성·시간 잠금·구글 로그인·이메일 발송 **어느 것도 코드가 존재하지 않아, 현재 홍보 가능한 부분이 전혀 없다**(pre-code/컨셉 단계). 저장소에서 유일하게 "예약 발송"에 가까운 것은 geunnal(그날)의 Web Push 알림인데, 이는 결혼식/이벤트 당일 리마인더이지 타임캡슐이 아니므로 타임캡슐로 홍보해서는 안 된다. → 출시 시점은 **BRAND_FACTS.md 참조**.

---

## 6. 스크린샷 촬영 목록 (라우트 포함)

| 화면 | 라우트 | 쓸모 |
|---|---|---|
| 템플릿 쇼케이스 | `/templates` | 10종 폰프레임 그리드 + 스타일 퀴즈 — 히어로/라인업 |
| 완성 청첩장 (11종 샘플) | `/i/sample-our` · `/i/sample-family` · `/i/sample-magazine` · `/i/sample-film` · `/i/sample-record` · `/i/sample-exhibit` · `/i/sample-feed` · `/i/sample-essay` · `/i/sample-essay-paper` · `/i/sample-essay-book` · `/i/sample-the-simple` | 각 템플릿 완성본 — 대표 컷 |
| 편집기(스플릿 뷰) | `/editor?template=<id>` (+ `/editor/parents` `/editor/feed` `/editor/essay` `/editor/thank-you` `/editor/the-simple`) | 실시간 미리보기 편집 — "제품 사용 중" 컷 |
| RSVP 대시보드 | `/dashboard/[id]` | 참석 파이차트·인원·식사/셔틀 통계 — 분석 컷 |
| 혼주 샘플 | `/sample/parents` | PARENTS 봉투 오프닝 |
| 감사장 샘플 | `/sample/thank-you` | THANKS |
| 봉투 인트로 | `/sample/envelope` | 봉투 애니메이션 |
| 내 청첩장 관리 | `/my-invitations` | 목록/관리 |

> `/sample/parents-test`는 QA/미리보기용(라우팅 참조 없음) — 마케팅 제외.
