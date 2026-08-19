# 제품 인벤토리 (디어드로어)

> 목적: 인스타그램 콘텐츠 소재 발굴용, "제품이 실제로 가진 것" 정리.
> 조사 원칙: **코드에서 실제 확인되는 사실만** 기록. 가치/의도 추측은 넣지 않음. 확인 안 된 것은 "확인 안 됨"으로 명시. 수치·문자열은 코드 그대로 인용. 인용은 `파일:라인` 표기(경로는 `src/` 기준).
> 조사 시점 기준 브랜치의 워킹트리 상태. **THE CLASSIC(`narrative-classic`) 및 그 관련 옵션은 현재 작업 중(로컬 미커밋, 미배포)** — 아직 프로덕션에 없음. 표에는 포함하되 이 상태를 함께 표기.

---

## 항목 1. 템플릿

`src/lib/templates.ts`에 **11종** 정의(요청 10종 + `THE CLASSIC`).

### 1-1. 식별자 / 표시 이름 / 카테고리 / 설명 / 이모지

| 표시 이름 | 내부 id | narrativeType | emoji | description | 비고 |
|---|---|---|---|---|---|
| OUR | `narrative-our` | our | 💕 | 두 사람의 사랑을 한 편의 이야기로 | |
| FAMILY | `narrative-family` | family | 👨‍👩‍👧‍👦 | 두 가족이 함께 써 내려가는 결혼 이야기 | |
| PARENTS | `narrative-parents` | parents | 🎎 | 부모의 시선으로 전하는 초대 | 템플릿 갤러리에서 **제외**(`Step1Template.tsx:71`) |
| THE CLASSIC | `narrative-classic` | classic | ✉️ | 혼주가 전하는 클래식 스테이셔너리 청첩장 | **작업 중·미커밋·미배포** |
| MAGAZINE | `narrative-magazine` | magazine | 📰 | 매거진 인터뷰로 전하는 우리의 이야기 | |
| MOVIE | `narrative-film` | film | 🎬 | 한 편의 영화처럼 펼쳐지는 시네마틱 청첩장 | name≠type |
| RECORD | `narrative-record` | record | 🎵 | 비닐 레코드처럼 펼쳐지는 음악 앨범 청첩장 | |
| FEED | `narrative-exhibit` | exhibit | 🖼️ | 미니스토리형 포토 청첩장 · 리허설 촬영을 여러 번 한 커플에게 추천 | name≠type |
| ESSAY | `narrative-essay` | essay | ✍️ | 사진 없이도 빛나는, 에세이 같은 청첩장 | |
| THE SIMPLE | `narrative-the-simple` | the-simple | ✦ | 가장 일반적이면서도 특별한, 세련된 더심플 컨셉 | |
| THANKS | `narrative-thankyou` | thankyou | 💌 | 결혼식 후 감사의 마음을 전하는 모바일 감사장 | name≠type |

출처: `src/lib/templates.ts:34-372`. (표시 이름과 카테고리가 다른 케이스: MOVIE→film, FEED→exhibit, THANKS→thankyou)

### 1-2. 템플릿 기본 색상 / 폰트 (templates.ts 정의값)

| 이름 | primary | secondary | accent | background | text | heading font | body font |
|---|---|---|---|---|---|---|---|
| OUR | #8B7355 | #F5F0EB | #C9A86C | #FAF8F5 | #3D3D3D | Okticon | Pretendard |
| FAMILY | #2C3E50 | #ECF0F1 | #B8860B | #FFFFFF | #2C3E50 | Noto Serif KR | Noto Sans KR |
| PARENTS | #722F37 | #F5F0EB | #C9A962 | #FFFEF8 | #1A1A1A | Noto Serif KR | Pretendard |
| THE CLASSIC | #351714 | #DDD1BB | #351714 | #F2EEE6 | #351714 | Italiana | Gowun Batang |
| MAGAZINE | #1A1A1A | #F2F2F2 | #C8102E | #FFFFFF | #1A1A1A | Montserrat | Pretendard |
| MOVIE | #E8E4DF | #2C2C2E | #B8977E | #1C1C1E | #E8E4DF | Playfair Display | Pretendard |
| RECORD | #E89B8F | #F5F1ED | #D4766A | #FAF7F4 | #3D3D3D | Montserrat | Pretendard |
| FEED | #1D1D1F | #F5F5F7 | #86868B | #FFFFFF | #1D1D1F | Pretendard | Pretendard |
| ESSAY | #5C4A3A | #F5F0E8 | #8B7355 | #FAF8F3 | #3D3028 | Playfair Display | Pretendard |
| THE SIMPLE | #1a1a1a | #fbfaf7 | #a38d6d | #fbfaf7 | #1a1a1a | Cormorant Garamond | Pretendard |
| THANKS | #2C2C2C | #F5F3EF | #7A7570 | #F5F3EF | #2C2C2C | Noto Sans KR | Noto Sans KR |

출처: `src/lib/templates.ts:42-366`. **주의**: 이 값은 templates.ts의 메타이며, 실제 게스트뷰 렌더 테마 hex는 항목 2-3(각 `InvitationClient*.tsx`의 `colorThemes`)과 다름.

### 1-3. features[] (templates.ts)

| 이름 | features |
|---|---|
| OUR | 커플 서사 중심 / 감성적 톤 / 에디토리얼 레이아웃 / 스토리 초안 작성 (`:53`) |
| FAMILY | 가족 서사 중심 / 정중한 톤 / 클래식 레이아웃 / 스토리 초안 작성 (`:83`) |
| PARENTS | 혼주 시점 / 봉투 오프닝 / 버건디 테마 / 타임라인 (`:115`) |
| THE CLASSIC | 봉투 오프닝 / 클래식 스테이셔너리 / 혼주용 / 스크롤 스토리 (`:148`) |
| MAGAZINE | 매거진 레이아웃 / 인터뷰 형식 / 트렌디한 타이포 / 에디토리얼 감성 (`:184`) |
| MOVIE | 시네마틱 연출 / 챕터별 스토리텔링 / 다크 테마 / 크레딧 엔딩 (`:213`) |
| RECORD | 비닐 레코드 애니메이션 / 트랙 카드 시스템 / 코랄 핑크 테마 / 앨범 재킷 갤러리 (`:242`) |
| FEED | 인스타그램 UI / 3열 포토 그리드 / 촬영 컨셉별 하이라이트 / 러브스토리 게시글 (`:272`) |
| ESSAY | 사진 없이 완성 / 타이포그래피 중심 / 스크롤 애니메이션 / 러브스토리·인터뷰 선택 (`:302`) |
| THE SIMPLE | 에디토리얼 타이포 / UI 대안 5~12개 / 섹션 순서 커스텀 / 구분선 12종 (`:331`) |
| THANKS | 스크롤 애니메이션 / 폴라로이드 사진 / 커튼 연출 / 감사 메시지 (`:366`) |

### 1-4. sections[] (id · 제목, [AI]=aiGenerated, [OPT]=optional)

- **OUR** (`:54-62`): opening 오프닝 / first-chapter 만남[AI] / our-time 우리의 시간[AI] / decision 결심[AI] / invitation 초대 / details 예식 정보 / closing 클로징
- **FAMILY** (`:84-94`): opening 오프닝 / groom-story 신랑 이야기[AI] / bride-story 신부 이야기[AI] / our-meeting 두 사람의 만남[AI] / parents-message 부모님 마음[AI,OPT] / invitation 초대 인사 / details 예식 정보 / family-intro 가족 소개[OPT] / closing 클로징
- **PARENTS** (`:116-127`): envelope 봉투 / greeting 인사말[AI] / timeline 타임라인 / gallery 갤러리 / date 날짜 / venue 예식장 / wedding-info 결혼식 안내[OPT] / account 마음 전하실 곳 / share 공유하기 / rsvp 참석 의사
- **THE CLASSIC** (`:149-163`): opening 오프닝(봉투) / letter 인사말[AI] / introduction 신랑신부 소개 / portraits 인물 사진 / gallery 갤러리 / our-story 우리 이야기[AI] / date 날짜 / directions 오시는 길 / information 결혼식 안내[OPT] / accounts 마음 전하실 곳 / links 공유 / rsvp 참석 의사 / closing 클로징
- **MAGAZINE** (`:185-192`): cover 매거진 커버 / editors-note 에디터스 노트 / feature-interview 피처 인터뷰[AI] / photo-spread 포토 스프레드 / the-details 웨딩 디테일 / closing 클로징
- **MOVIE** (`:214-221`): poster 포스터 커버 / chapter-1 첫 만남[AI] / chapter-2 우리의 이야기[AI] / chapter-3 약속 / premiere 예식 정보 / credits 크레딧
- **RECORD** (`:243-251`): vinyl-cover 레코드 커버 / track-01 The Beginning / track-02 The Couple / track-03 Our Journey[AI] / track-04 Gallery / track-05 The Wedding Day / bonus-track Liner Notes
- **FEED** (`:273-281`): cover 커버 / room-01~04 / greeting 인사말 / details 예식 정보
- **ESSAY** (`:303-310`): cover 커버 / greeting 초대 글귀 / story 이야기 / quote 인용문 / details 예식 정보 / closing 감사 인사
- **THE SIMPLE** (`:332-345`): intro / greeting / couple 커플 소개 / info 예식 정보 / direction 오시는 길 / interview / gallery / guide 결혼식 안내[OPT] / account 마음 전하실 곳[OPT] / rsvp[OPT] / guestbook 방명록[OPT] / thanks 감사 인사[OPT]
- **THANKS** (`:367-371`): intro / photos 사진 / closing 감사인사

> **주의**: `sections[]`는 템플릿 갤러리 카드용 메타로 보이며, 실제 에디터/게스트뷰 렌더 섹션과 완전히 일치하지 않음(실제 분기는 1-5·항목 2 참고).

### 1-5. 템플릿별 기능 차이 (실제 코드 분기)

**아키텍처 분기 1 — 에디터 라우팅**: 아래 5종은 `/editor`에서 전용 에디터로 리다이렉트(`src/app/editor/page.tsx:185-207`).

| 템플릿 | 전용 에디터 경로 |
|---|---|
| PARENTS | `/editor/parents` |
| FEED | `/editor/feed` |
| ESSAY | `/editor/essay` |
| THANKS | `/editor/thank-you` |
| THE SIMPLE | `/editor/the-simple` |

나머지 **OUR / FAMILY / MAGAZINE / THE CLASSIC / MOVIE / RECORD**는 공유 `WizardEditor` 사용.

**아키텍처 분기 2 — 게스트뷰 클라이언트**(`src/app/i/[slug]/page.tsx:150-174`):

| 템플릿 | 게스트 클라이언트 |
|---|---|
| OUR(기본 fallback) | `InvitationClient.tsx` |
| FAMILY | `InvitationClientFamily.tsx` |
| MAGAZINE | `InvitationClientMagazine.tsx` |
| MOVIE | `InvitationClientFilm.tsx` |
| RECORD | `InvitationClientRecord.tsx` |
| FEED | `InvitationClientExhibit.tsx` |
| ESSAY | `InvitationClientEssay.tsx` |
| THANKS | `InvitationClientThankYou.tsx` (props 시그니처 다름, `:161-171`) |
| THE SIMPLE | `InvitationClientTheSimple.tsx` |
| THE CLASSIC | `InvitationClientClassic.tsx` |

> PARENTS는 이 라우트 import 목록에 없음(별도 라우트 `src/app/invitation/[id]/page.tsx`) — 이 파일 기준으론 **확인 안 됨**.

**공유 위저드 내부 분기 판정**(`WizardEditor.tsx:64-66`): `isMagazine = narrative-magazine 또는 narrative-classic`(둘이 매거진 분기 공유), `isFilm = narrative-film`, `isRecord = narrative-record`.

**Step 컴포넌트 교체**(`WizardEditor.tsx:80-99`):

| Step | OUR/FAMILY | MAGAZINE·CLASSIC | MOVIE | RECORD |
|---|---|---|---|---|
| 2 인트로 | Step3Invitation | Step3Magazine | Step2Film | Step2Record |
| 3 스토리 | Step4Content | Step4Magazine | Step3Film | Step3Record |
| 1·4·5 | 공통(Step2Style / Step5MenuSettings / Step6Publish) | 공통 | 공통 | 공통 |

**기능 × 템플릿 매트릭스 (공유 위저드 6종)** — O=있음/전용, –=없음:

| 기능/옵션 | OUR | FAMILY | MAGAZINE | THE CLASSIC | MOVIE | RECORD |
|---|---|---|---|---|---|---|
| 성/이름 분리 입력 | – | O | – | – | – | – |
| 커플 소개(coupleProfile, OUR 전용) | O | – | – | – | – | – |
| "서로를 선택한 이유"(FAMILY 전용) | – | O | – | – | – | – |
| 포토 디바이더(인터뷰 상단) | – | O | – | – | – | – |
| 갤러리 그리드 편집(Step4Content) | O | O | – | – | – | – |
| 매거진 커버/콘텐츠 문구 UI | – | – | O | O | – | – |
| 섹션 순서 드래그 | – | – | O | O | O | O |
| 섹션 배경(흰/틴티드) 토글 | – | – | O | O | O | – |
| 매거진 박스 반대색 토글 | – | – | O | O | – | – |
| 매거진 섹션 제목 편집 | – | – | O | O | – | – |
| "마음 전하실 곳 RSVP 하단 고정" | – | – | – | – | O | – |
| 디스플레이(영문) 폰트 선택 UI | – | – | O | O | O | O |
| filmOnly 폰트 노출 | – | – | – | – | O | – |
| 커스텀 컬러 피커(colorTheme=custom) | O | O | – | – | – | – |
| 매거진 전용 색 옵션(sectionTextColor 등) | – | – | O | O | – | – |
| THE CLASSIC 오프닝 스타일 5종 | – | – | – | O | – | – |
| THE CLASSIC 전용 계좌 표시 | – | – | – | O | – | – |
| BGM 자동재생 옵션 노출 | O | O | – | – | – | – |

근거(파일:라인): 성/이름 분리 `Step3Invitation.tsx:224,280` · 커플소개 `Step4Content.tsx:464` · 서로를 선택한 이유 `Step4Content.tsx:1125` · 포토 디바이더 `Step4Content.tsx:1742` · 갤러리 그리드 `Step4Content.tsx:1486` · 섹션 순서/배경 토글 `Step5MenuSettings.tsx:232-238,351-476`(showBgToggle: MAGAZINE/FILM만 true, **RECORD는 false**) · 박스 반대색 `Step5MenuSettings.tsx:437-445,258` · 섹션 제목 편집 `Step5MenuSettings.tsx:480` · MOVIE 계좌 하단고정 `Step5MenuSettings.tsx:461-474` · 폰트 UI `Step2Style.tsx:195,209-210` · 커스텀 컬러 제외 `Step2Style.tsx:695` · 매거진 색 옵션 `Step2Style.tsx:777,850,904-969` · 오프닝 스타일 `Step2Style.tsx:989-1022` · 계좌 표시 `Step2Style.tsx:1025` · BGM `Step2Style.tsx:1239,1285`.

> PARENTS/FEED/ESSAY/THE SIMPLE/THANKS는 각기 **별도 에디터·별도 게스트 클라이언트**를 가짐(개별 파일 내부 옵션은 이번 조사 범위 밖, 추가 조사 필요).

---

## 항목 2. 에디터 5단계 설정 항목

`WizardEditor.tsx`는 5단계. (내부 변수명과 파일명이 어긋남에 주의: 예 `Step1Style`이 실제 `Step2Style.tsx`. 템플릿 선택은 위저드가 아니라 `/templates`에서.)

### 2-1. 단계별 항목

- **1 디자인 (`Step2Style.tsx`)**: 폰트(2-2), 색상 테마·포인트 컬러·배경/텍스트 색(2-3), Classic 전용 오프닝 스타일·계좌 표시, 배경음악(on/off·프리셋·MP3 업로드 ≤10MB·자동재생·안내 표시/문구·재생 시작 페이지[OUR·FAMILY만]), 넘김 안내 문구(OUR·FAMILY). (`Step2Style.tsx:334-1325`)
- **2 인트로/기본정보**:
  - 기본 `Step3Invitation.tsx`: 신랑·신부 기본정보(성/이름), 결혼식 정보(날짜/시간/시간표시/예식장명/홀/주소), 인트로 스타일, 명언·슬로건(문구/출처), 인트로 인사말, 부모님 정보(성함·고인 표시/스타일), 카카오톡 공유(썸네일/비율/제목/설명), OG 이미지, D-Day 팝업 (`:204-1078`)
  - Magazine `Step3Magazine.tsx`: 이름, 결혼식 정보(+지도 버튼 표시), 인트로 스타일(Cover/Clean/Editorial), 커버 이미지, 카톡·OG, D-Day (`:90-431`)
  - Film `Step2Film.tsx`: 인트로 스타일(TUDUM/Cinematic/프레임), 프레임 선택+색상, 인트로 문구, 필름(2컷) 두 번째 사진, 커버 이미지, 이름, 결혼식 정보, 카톡·OG, D-Day (`:98-547`)
  - Record `Step2Record.tsx`: 앨범 커버 이미지, 앨범 자켓 이미지, 커버 타이틀, 이름, 결혼식 정보, 카톡·OG, D-Day (`:81-401`)
- **3 스토리**:
  - 기본 `Step4Content.tsx`: 커플 소개(OUR), 러브스토리(OUR)·부모님 인사말(FAMILY), 포토 디바이더, 부모님 소개, 서로를 선택한 이유(FAMILY), 처음 만난 날(OUR), 갤러리 (`:242-1385`)
  - Magazine `Step4Magazine.tsx`: Editor's Note, Meet The Couple, 인터뷰, 갤러리, 유튜브, 부모님 성함, 안내사항, 감사 인사, 방명록 (`:75-1234`)
  - Film `Step3Film.tsx`: Chapter1 인사말, 명대사, Chapter2 프로필, Scenes 인터뷰/스토리, Chapter3 갤러리, 유튜브, 부모님, 안내사항, Credits, 방명록 (`:97-1119`)
  - Record `Step3Record.tsx`: TRACK01~04, 영상, 부모님, 안내사항, THANK YOU, GUESTBOOK (`:86-1132`)
- **4 추가기능 (`Step5MenuSettings.tsx`)**: 메뉴 버튼 스타일, 섹션 순서 변경(매거진/필름 — on/off·배경색 토글), 매거진 섹션 제목 편집, 오시는 길 안내, 연락처(신랑/신부측), RSVP 설정, 마음 전하실 곳(본인/부모 계좌) (`:311-1244`)
- **5 발행 (`Step6Publish.tsx`)**: 주소(slug) 표시/변경, 공개 설정, 검증/에러, 발행, 발행 완료 모달(공유 링크·미리보기·카톡·워터마크 안내) (`:267-567`)

### 2-2. 폰트

**(A) 한글 본문 폰트 12종** — `FONT_STYLES`(`Step2Style.tsx:43-56`), CSS 매핑 `fontStyles`(예 `InvitationClient.tsx:3396-3409`):

| id | 에디터 이름 | 표기 | fontFamily |
|---|---|---|---|
| classic | 클래식 | 리디바탕 | `'Ridibatang', serif` |
| modern | 모던 (추천) | 프리텐다드 | `'Pretendard', sans-serif` |
| romantic | 손글씨 | 오케이티콘체 | `'Okticon', serif` |
| contemporary | 컨템포러리 | 전남교육바른체 | `'JeonnamEducationBarun', sans-serif` |
| luxury | 포멀 | 이랜드초이스체 | `'ELandChoice', serif` |
| gulim | 굴림 | 조선굴림체 | `'JoseonGulim', serif` |
| adulthand | 어른손글씨 | 강원교육모두체 | `'GangwonEducationModuche', sans-serif` |
| neathand | 또박또박 | 오무다예체 | `'OmuDaye', sans-serif` |
| roundhand | 둥근손글씨 | 온글잎 콘콘체 | `'OngleipKonkon', sans-serif` |
| roundgothic | 둥근고딕 | 나눔스퀘어라운드 | `'NanumSquareRound', sans-serif` |
| suit | SUIT | SUIT | `'Suit', sans-serif` |
| myungjo | 명조 | 조선일보명조체 | `'ChosunIlboMyungjo', serif` |

> `gulim`의 병행 영문(`display`)은 파일별로 다름: OUR/Family/Record `'EB Garamond'` vs Magazine `'Montserrat'`(`InvitationClient.tsx:3402` vs `InvitationClientMagazine.tsx:41`).

**(B) 영문 제목(디스플레이) 폰트 11종** (Film/Record/Magazine 전용) — `DISPLAY_FONTS`(`Step2Style.tsx:61-73`), 매핑 `displayFontMap`(`InvitationClientFilm.tsx:3206-3218`):

playfair(Playfair Display, Film 기본) / cinzel / montserrat(Record·Magazine 기본) / garamond(EB Garamond) / cormorant(Cormorant Garamond) / greatvibes(Great Vibes, **filmOnly**, 확대 1.2) / lora / made-slab(MADELikesSlab) / italiana / italianno(**filmOnly**, 확대 1.35) / majesty.

**(C) `layout.tsx` next/font import 17종** (`--font-*`, `src/app/layout.tsx:3-21,28-165`): Noto_Sans_KR / Noto_Serif_KR / Cormorant_Garamond / Playfair_Display / Montserrat / Great_Vibes / Lora / Cinzel / EB_Garamond / Nanum_Myeongjo / Nanum_Gothic / Gowun_Batang / Gowun_Dodum / Song_Myung / Hahmlet / Italiana / Italianno. (로컬 `@font-face`(Ridibatang/Okticon/Pretendard 등)는 별도 `fonts.css`.)

### 2-3. 색상 테마

**중요**: 에디터 노출 옵션과 실제 렌더 테마(`colorThemes`)는 별개이며 **동일 id라도 템플릿마다 hex가 다름**.

**(A) 에디터 노출 옵션 (`Step2Style.tsx`)**
- 기본(OUR/FAMILY/Magazine) `COLOR_THEMES` **7종**(`:12-20`, primary=스와치용): 클래식 로즈(classic-rose `#E91E63`) / 모던 블랙(modern-black `#1A1A1A`, 추천) / 로맨틱 블러시(romantic-blush `#D4A5A5`) / 네이처 그린(nature-green `#6B8E6B`) / 럭셔리 네이비(luxury-navy `#1E3A5F`) / 선셋 코럴(sunset-coral `#E8846B`) / 커스텀(custom `#888888`)
- Film **2종**(`:513-538`): film-dark / film-light
- Record **6종**(`:349-355`): record-coral 코랄(기본) / record-rose 솜사탕 / record-peach **스카이** / record-bw 모노 / record-lilac 진주 / record-mint **포레스트** (라벨과 id 의미 어긋남)
- 포인트 컬러 프리셋 `ACCENT_PRESETS`(`:75-82`): 로즈핑크 `#D4838F`, 골드 `#B8977E`, 라벤더 `#9B8EC4`, 민트 `#6BA89E`, 코랄 `#D4836A`, 스카이블루 `#6A9FD4`
- 테마별 기본 강조 텍스트색 `DEFAULT_ACCENT_TEXT_COLORS`(`:23-40`): classic-rose `#C41050`, modern-black `#000000`, romantic-blush `#A67A7A`, nature-green `#4A7A4A`, luxury-navy `#B8956A`, sunset-coral `#B85040`. 기본 본문색은 6종 모두 `#3d3d3d`.

**(B) OUR 렌더 테마 7종** (`InvitationClient.tsx:3382-3390`):

| 테마 | primary | secondary | accent | background | sectionBg | cardBg | divider | text | gray | highlight |
|---|---|---|---|---|---|---|---|---|---|---|
| classic-rose | #C41050 | #B8956A | #B8956A | #FFF8F5 | #FFE8E8 | #FFFFFF | #d4b896 | #3d3d3d | #555555 | — |
| modern-black | #111111 | #555555 | #111111 | #FFFFFF | #F1F3F5 | #FFFFFF | #CCCCCC | #3d3d3d | #555555 | #888888 |
| romantic-blush | #A67A7A | #8a7068 | #8a7068 | #FDF8F6 | #F8EFEC | #FFFFFF | #D4C4BC | #3d3d3d | #555555 | — |
| nature-green | #3A5A3A | #6A7A62 | #5A7A52 | #F5F7F4 | #EBF0E8 | #FFFFFF | #A8B5A0 | #3d3d3d | #555555 | #5A8A52 |
| luxury-navy | #0f2035 | #8A6A3A | #8A6A3A | #F8F9FA | #E8ECF0 | #FFFFFF | #C9A96E | #3d3d3d | #555555 | #8A6A3A |
| sunset-coral | #B85040 | #B88060 | #B8683A | #FFFAF7 | #FFEEE5 | #FFFFFF | #E8A87C | #3d3d3d | #555555 | — |
| custom | #C41050 | #C41050 | #C41050 | #FFFFFF | #D5D8DC | #FFFFFF | #E0E0E0 | #3d3d3d | #555555 | — |

**(C) FAMILY** (`InvitationClientFamily.tsx:3643-3651`): **OUR과 hex 완전히 동일**(7종).

**(D) MAGAZINE·CLASSIC** (`InvitationClientMagazine.tsx:23-30`, **6종·custom 없음**): OUR과 다른 부분만 —
| 테마 | secondary | background | sectionBg | divider |
|---|---|---|---|---|
| classic-rose | #D4768A | #FFFFFF | #FFF5F5 | #E8A0B0 (accent #C41050) |
| modern-black | (OUR 동일) | | | |
| romantic-blush | | #FFFFFF | #FAF5F3 | |
| nature-green | | #FFFFFF | #F3F7F1 | |
| luxury-navy | | #FFFFFF | #F3F5F8 | |
| sunset-coral | | #FFFFFF | #FFF5EF | |

**(E) MOVIE** (`InvitationClientFilm.tsx:21-52`, 8종): 기본 6종 OUR 동일 + film-dark(primary #E8E4DF, accent #D4838F, background #111111, cardText #2A2A2A) / film-light(primary #1A1A1A, accent #B8977E, background #FFFFFF, sectionBg #F8F6F3).

**(F) RECORD** (`InvitationClientRecord.tsx:24-99`, 15종): 기본 6종 + film-dark/film-light + custom + Record 6종:
| 테마 | primary | accent | background | sectionBg |
|---|---|---|---|---|
| record-coral | #E89B8F | #D4766A | #FAF7F4 | #F5F1ED |
| record-rose | #D4848C | #C4707A | #FFFFFF | #FBF2F3 |
| record-peach | #8BAEBF | #7A9DAE | #FFFFFF | #F0F6F8 |
| record-bw | #1A1A1A | #333333 | #FFFFFF | #F7F7F7 |
| record-lilac | #B8B0B8 | #A8A0A8 | #FFFFFF | #F0ECED |
| record-mint | #9CAF88 | #8A9D78 | #F8FAF5 | #F0F3EC |
(divider/cardBg/text/gray 등은 원본 참조.)

---

## 항목 3. 섹션/블록 종류 및 제한 수치

섹션 정의: `src/store/editorStore.ts:187-215` (`SectionVisibility` `:188-199`, `PreviewSectionId` `:202-215`).
공개 설정 섹션: 커플 소개(coupleProfile) / 우리의 이야기(ourStory) / 부모님 인사말(parentsGreeting) / 인터뷰(interview) / 안내(guidance) / 연락처(contacts) / 계좌(bankAccounts) / 방명록(guestbook) / RSVP(rsvp) / 부모님 성함(parentNames).
블록 구조: 갤러리(MultiImageUploader), 오시는 길(`DirectionsInfo` `editorStore.ts:76-85`: car/publicTransport/train/expressBus/shuttle/extraInfo + 지도버튼 naver/kakao/tmap `:509-513`), 계좌(`BankInfo` `:9-14` — 신랑·신부 본인+각 부·모 고정 구조), 인터뷰(`InterviewItem[]` `:97-110` 동적), 영상(youtube `:462-466`), RSVP(`RsvpForm.tsx`), 방명록.

### 3-1. 이미지 최대 장수 (`MultiImageUploader`의 `maxImages`, 기본 10)

| 용도 | maxImages | 위치 |
|---|---|---|
| 기본값 | **10** | `components/editor/ImageUploader.tsx:346` |
| 갤러리(Essay) | **30** | `app/editor/essay/wizard/steps/EssayStep3Details.tsx:667` |
| 갤러리(Feed 룸) | **30** | `app/editor/feed/wizard/steps/FeedStep3Rooms.tsx:157` |
| 갤러리(Film) | **30** | `components/editor/wizard/steps/Step3Film.tsx:593` |
| 갤러리(Magazine) | **30** | `components/editor/wizard/steps/Step4Magazine.tsx:708` |
| 갤러리(공통 Content) | **30** | `components/editor/wizard/steps/Step4Content.tsx:1448` |
| 스토리/피드 사진 | **4~5** | `FeedStep4Stories.tsx:208,245,341` |
| 프로필/커플 사진 | **2~3** | `Step4Content.tsx:540,644,839,968,1068,1211,1295,1807`, `Step4Magazine.tsx:619` |
| Film 프레임 | **2** | `Step3Film.tsx:499` |

초과 메시지(`ImageUploader.tsx:417`): `최대 ${maxImages}장까지 가능합니다. ${files.length}장 중 ${available}장만 업로드합니다.`
> 서버 업로드 API는 파일당 크기만 검증, **총 장수 제한은 클라이언트 `maxImages`에만** 존재.

### 3-2. 파일 크기 제한

| 항목 | 제한 | 코드 | 위치 |
|---|---|---|---|
| 이미지 업로드 API | **30MB** | `30 * 1024 * 1024` | `app/api/upload/route.ts:17`(검증 `:78`) |
| 이미지 클라이언트 유틸 | **30MB** | 동 | `lib/imageUpload.ts:118` |
| IntroSelector 이미지 | **30MB** | 동 | `components/editor/IntroSelector.tsx:51,86` |
| 오디오(BGM) API | **10MB** | `10 * 1024 * 1024` | `app/api/upload-audio/route.ts:13`(검증 `:56`) |
| Essay 디자인 이미지 | **10MB** | 동 | `app/editor/essay/wizard/steps/EssayStepDesign.tsx:108` |
| Feed 기본정보 이미지 | **10MB** | 동 | `app/editor/feed/wizard/steps/FeedStep1BasicInfo.tsx:98` |
| 청첩장 저장(content 본문) | **5MB** | `5 * 1024 * 1024` | `app/api/invitations/[id]/route.ts:108` |

허용 타입: 이미지 JPG/PNG/WebP(`ALLOWED_TYPES=["image/jpeg","image/png","image/webp"]` `upload/route.ts:15`), 오디오 MP3(`["audio/mpeg","audio/mp3"]` `upload-audio/route.ts:12`).
이미지 리사이즈 기본(`imageUpload.ts:29-34`): web 최대 2048px(품질 0.8), thumb 최대 600px(품질 0.7), WebP 변환.

### 3-3. RSVP 제한

| 항목 | 제한 | 위치 |
|---|---|---|
| 동반 인원(클라이언트) | 1~**10** | `RsvpForm.tsx:334,342` |
| 동반 인원(서버) | 1~**100** | `api/rsvp/route.ts:94,359` |
| 이름 | **50자** | `api/rsvp/route.ts:67,342` |
| 전화번호 | **20자**, 뒷자리 4자리 `/^\d{4}$/` | `api/rsvp/route.ts:73,80` |
| 메시지 | **500자** | `api/rsvp/route.ts:86,354` |
| Rate limit | IP당 분당 **10회**(60초) | `api/rsvp/route.ts:10-11` |

### 3-4. 방명록 제한 (`api/guestbook/route.ts`)
이름 **50자**(`:49`) / 메시지 **500자**(`:55`) / 질문 **200자**(`:61`) / 스팸방지: 같은 이름 **30초** 이내 중복 차단(`:78`).
클라이언트 입력 maxLength(템플릿별 상이): Record/Film/Magazine·OUR/Family 방명록 이름 **20**·메시지 **100**; the-simple 이름 **50**·메시지 **500**(`TheSimplePreview.tsx:2069,2076`).

### 3-5. 기타 제한
- 인트로 텍스트(`lib/introPresets.ts`): 메인 타이틀 **30**(`:130`), cinematic 환영문구 **40**(`:221`), 서브 **50**(`:131`), 날짜 **20**(`:132`), 장소 **30**(`:133`)
- D-Day 팝업(`components/dday/DdayPopupEditor.tsx:22-29`): 페이지 최대 **5**, 링크 **2**, 이미지 **3**, 제목 **20자**, 페이지 제목 **30자**, 본문 **200자**, 버튼 라벨 **15자**, 링크 라벨 **10자**
- AI 섹션 재생성 최대 **5회**(`lib/regen-utils.ts:16`), 인사말 생성 최대 **3회**(`Step3Invitation.tsx:114`)
- 슬러그 최대 **30자**(`lib/slug.ts:21`), 이전 URL(alias) 최대 **10개**(`api/invitations/[id]/slug/route.ts:14`)
- QR 다운로드 **1024×1024 PNG**(`my-invitations/page.tsx:347,363`, `ShareModal.tsx:97`)

### 3-6. 제한 없음 / 확인 안 됨
- **계좌 개수 상한**: 동적 add/제한 로직 없음(고정 구조). — 확인 안 됨/제한 없음
- **인터뷰 질문 개수 상한**: `addInterview`(`editorStore.ts:1314-1330`)에 개수 체크 없이 무제한 push. (인기 질문 프리셋 12개 고정 `types/ai-generator.ts:358-431`)
- **러브스토리 개수 상한**: 확인 안 됨

---

## 항목 4. 랜딩 강점 기능의 실제 구현

### 4-1. AI 스토리 자동 작성

**질문 세트** (`src/lib/ai-questions.ts`, 4개 배열):

| 배열 | 개수 | 라인 |
|---|---|---|
| `aiQuestions`(기본/OUR·인터뷰) | **10개** | `:14-108` |
| `ourTemplateQuestions`(OUR) | **10개** | `:111-212` |
| `familyTemplateQuestions`(FAMILY) | **12개** | `:215-339` |
| `familyWhyWeChoseQuestions`(서로를 선택한 이유) | **8개**(신랑4+신부4) | `:343-434` |

추가로 인사말 전용 `greetingQuestions` **4개**(`api/ai/generate-greeting/route.ts:10-31`).

**① `aiQuestions` 10개** (`ai-questions.ts:14-108`):
1. 두 분은 어떻게 만나셨나요? (textarea, required)
2. 프로포즈는 어떻게 하셨나요? (textarea)
3. 원하시는 결혼식 분위기는 어떤가요? (select, required) — 격식있고 우아한 / 따뜻하고 감성적인 / 모던하고 세련된 / 자연스럽고 편안한 / 유니크하고 개성있는
4. 주로 어떤 분들을 초대하시나요? (select, required) — 가족/친척 위주 / 직장 동료 위주 / 친구 위주 / 고르게 섞여 있음
5. 하객분들께 전하고 싶은 특별한 메시지가 있나요? (textarea)
6. 두 분의 공통 취미나 관심사가 있나요? (textarea)
7. 결혼 후 어떤 가정을 꿈꾸시나요? (textarea)
8. 청첩장 문구의 격식 수준을 선택해 주세요. (select, required) — 매우 격식있게(어르신 중심) / 적당히 격식있게 / 친근하고 편안하게 / 캐주얼하게
9. 예식장의 특징이나 분위기를 설명해 주세요. (textarea)
10. 청첩장에 꼭 포함되었으면 하는 내용이 있나요? (textarea)

**② `ourTemplateQuestions` 10개** (`:111-212`):
1. 두 분은 언제, 어디서, 어떻게 처음 만나셨나요? (required)
2. 첫 만남에서 가장 기억에 남는 장면이나 감정은? (required)
3. "이 사람이 특별하다"고 처음 느낀 순간은? (required)
4. 함께한 시간 중 가장 소중한 추억은? (required)
5. 서로에게 어떤 의미인가요? (required)
6. 힘들었던 순간을 함께 극복한 경험이 있다면?
7. 상대방의 어떤 점이 가장 좋으신가요? (required)
8. 결혼을 결심하게 된 결정적인 이유나 순간은? (required)
9. 결혼 후 어떤 모습으로 함께 살아가고 싶으신가요?
10. 하객들에게 전하고 싶은 한 문장이 있다면?

**③ `familyTemplateQuestions` 12개** (`:215-339`):
1. 신랑님은 어떤 가정에서 자라셨나요? (required)
2. 신랑님의 성격/가치관 중 가족으로부터 물려받은 것? (required)
3. 신랑님 부모님이 자녀 양육에서 가장 중요하게 생각하신 가치?
4. 신랑님이 가족에게 어떤 존재인가요?
5. 신부님은 어떤 가정에서 자라셨나요? (required)
6. 신부님의 성격/가치관 중 가족으로부터 물려받은 것? (required)
7. 신부님 부모님이 자녀 양육에서 가장 중요하게 생각하신 가치?
8. 신부님이 가족에게 어떤 존재인가요?
9. 두 분은 어떻게 만나셨고, 언제부터 가족이 되고 싶다고 생각? (required)
10. 서로의 가족을 처음 만났을 때 느낌은?
11. 결혼을 통해 어떤 가정을 꾸리고 싶으신가요? (required)
12. 부모님께서 두 분의 결혼에 대해 하신 말씀 중 기억에 남는 것?

**④ `familyWhyWeChoseQuestions` 8개** (`:343-434`) — 신랑·신부 동일 4문항씩:
1. 본인의 성격을 어떻게 표현하시겠어요? (required)
2. 연애하면서 느낀 본인의 부족한 점이 있다면? (required)
3. (상대)님이 그런 부분을 어떻게 채워주나요? (required)
4. "이 사람과 결혼해야겠다" 결심한 순간이 있나요? (required)
(+ quote 선택지 `groomQuoteOptions`/`brideQuoteOptions` 각 6개 `:437-454`)

**⑤ `greetingQuestions` 4개** (`generate-greeting/route.ts:10-31`):
1. 두 분은 얼마나 사귀셨나요? — 1년 미만/1~3년/3~5년/5년 이상/10년 이상
2. 두 분의 관계를 가장 잘 표현하는 건? — 서로의 가장 친한 친구/성장시키는 파트너/편안한 동반자/설레는 연인/운명 같은 만남
3. 결혼은 어떤 의미인가요? — 새 가정의 시작/약속과 책임/평생 동반자/두 가족이 하나/사랑의 완성
4. 어떤 분위기의 인사말? — 따뜻·감성/간결·세련/스토리텔링/밝고 경쾌/전통·격식

**AI 동작** (`src/app/api/ai/**`):
- **모델: 전 라우트 `claude-3-haiku-20240307`** (Anthropic SDK, `ANTHROPIC_API_KEY`). `story/*`는 `@/lib/openrouter`에서 프롬프트만 import, 실제 호출은 Claude Haiku(파일명 openrouter지만 OpenRouter 미사용).
- `POST /api/ai/generate-story`: 인증 필요. `family-why-we-chose`면 **2개 섹션**(groomDescription/brideDescription), 기본이면 **4개 섹션**(profileIntro/ourStory/decision/thankYou, 길이 80-120/120-180/100-150/60-100자). 컨텍스트=`aiQuestions`. max_tokens 1024.
- `POST /api/ai/regenerate-section`: 단일 섹션 재생성(profileIntro/ourStory/decision/thankYou). max_tokens 512.
- `POST /api/ai/generate-greeting`: **1개 섹션** greeting. 5가지 스타일 톤. max_tokens 512.
- `POST /api/ai/story/full-generate`: FAMILY/OUR 프롬프트 분기. max_tokens 4000, temp 0.7. OUR 출력: greeting/thanks/groomProfile/brideProfile/story{first,together,preparation}/interview[]. FAMILY: greeting/thanks/whyWeChose{groom,bride}/interview[].
- `POST /api/ai/story/generate`(type: couple_intro/our_story/interview, max_tokens 2000), `story/modify`(romantic/concise/humorous/grammar/custom, max_tokens 2000), `story/regenerate-section`(greeting/thanks/프로필/story(.first/.together/.preparation)/interview, max_tokens 2500, temp 0.8).
> 섹션 생성 개수는 라우트/템플릿별로 다름. `ai-questions.ts`의 어느 배열이 실제 어느 화면에 표시되는지는 라우트 코드만으론 단정 불가(프론트 StoryGeneratorModal 확인 필요, **확인 안 됨**).

### 4-2. 하객 맞춤 초대 (개인화 링크)

**URL 구조**:
- 표준 템플릿: **`/i/{slug}?guest={guestId}`** (`i/[slug]/page.tsx:29,34`; alias 리다이렉트도 `?guest=` 유지 `:74-76`)
- PARENTS: **`/invite/{slug}?guest={guestId}`** (`invitation/[id]/page.tsx:68-78`; `ShareModal.tsx:67-68` templateType='parents'면 `/invite/`)
- 관리자 API가 반환하는 `personalLink`: **`/i/${inviteId}?guest=${guest.id}`** (slug 아닌 id 사용, `admin/guests/route.ts:39,109`)

**하객별 설정 필드** — `guests` 테이블 (`db.ts:692-707`, INSERT `:727-745`): id / invitation_id / **name**(필수) / **relation**(관계) / **honorific**(호칭, 기본 '님께' `:738`) / **intro_greeting**(인트로 인사말) / **greeting_template_id**(인사말 템플릿) / **custom_message**(커스텀 메시지) / opened_at·opened_count·last_opened_at(열람 추적) / rsvp_response_id / created·updated.
→ 하객별로 다르게 설정 가능: **이름·관계·호칭·인트로 인사말·인사말 템플릿·커스텀 메시지**.

**반영 방식**: 인사말 우선순위 = `custom_message` 있으면 그대로, 없고 `greeting_template_id` 있으면 템플릿에서 `{이름}`→name, `{관계}`→relation 치환(`i/[slug]/page.tsx:92-108`, `invite/[inviteId]/guest/[guestId]/route.ts:38-49`). 봉투 표시명 = relation 있으면 `"{name} {relation}{honorific}"`, 없으면 `"{name} {honorific}"`(예 "홍길동 이모님께"/"홍길동 님께", `guest/[guestId]/route.ts:52-54`). 열람 추적 `recordGuestView`(`i/[slug]/page.tsx:119`). 게스트 통계 `getGuestStats`(`db.ts:876-883`): total/opened(count>0)/notOpened/withRsvp.

---

## 항목 5. 데이터 보관 / 삭제 정책 — **코드에 존재함**

삭제 예정일 계산(`src/lib/db.ts:1219-1248` `getAllInvitationsForAdmin`):
- **미완성(미발행)**: `created_at + 7일` (`:1224-1227`)
- **발행 + 결혼일 있음**: `wedding_date + 30일` (`:1228-1232`)
- **발행 + 결혼일 없음**: `created_at + 90일` (`:1234-1237`)

**결제(유료) 청첩장은 자동삭제 제외**: `getInvitationsScheduledForDeletion`(`db.ts:1251-1255`)이 `days_until_deletion <= 0 && !inv.is_paid` 필터. 관리자 UI 문구: `(자동삭제 안함)` / `(결혼식+30일 / 자동삭제 안함)`(`admin/page.tsx:699-700,708-710`).

실행 경로: `deleteExpiredInvitations()`(`db.ts:1282-1297`) → `forceDeleteInvitation()`(`db.ts:1258-1279`, 연쇄 삭제 테이블: guests, greeting_templates, invitation_admins, page_views, slug_aliases, rsvp_responses, guestbook_messages, invitations) → API `POST /api/admin/cron`(Bearer CRON_SECRET, `admin/cron/route.ts:22-51`, 주석 "매일 자정 실행 권장") → 스케줄러 `.github/workflows/cleanup-cron.yml`(`cron: '0 0 * * *'` = 매일 UTC 자정/KST 09:00). 관리자 수동: `POST /api/admin?expired=true`(`admin/page.tsx:167`).
삭제 임박 지표: `days_until_deletion <= 7 && > 0 && !is_paid`를 `expiring_soon`(`db.ts:1411`), 대시보드 "7일내 삭제"(`admin/page.tsx:492`).

> **문서화된 정책 문서는 없음**: README/DEPLOYMENT/docs/marketing 어디에도 7/30/90일 기간 서술 없음. 정책은 **코드(`src/lib/db.ts`)와 관리자 UI 문구에만** 존재.
> 참고: `.github/workflows/notification-cron.yml`(`*/5 * * * *`)은 삭제가 아니라 "근날(geunnal)" 푸시 알림용(보관정책 무관).

---

## 항목 6. 설계 의도 / 제품 배경 기록 (원문)

- **배포 안전 규칙** — 상위 `Study-02/CLAUDE.md`: "이 프로젝트는 모바일 청첩장 서비스입니다. 고객이 이미 URL을 공유한 상태이므로 다음 규칙을 반드시 지켜야 합니다." → 청첩장 URL 라우트/API 경로 변경 금지, 기존 경로 삭제 금지, `_redirects`/`_routes.json` SPA fallback 유지. (URL 보존이 라우트 변경 금지의 명시적 이유)
- **가격·정책 SSOT** — `docs/marketing/BRAND_FACTS.md`: "가격·요금제·워터마크 정책·플랜명·출시 일정/로드맵에 대한 유일한 출처"(`:3`), "확정되지 않은 값은 `[확인필요]`로 둔다"(`:5`). 정책 원문: **무료** = 모든 템플릿·모든 기능 제작/발행 가능(단 워터마크)(`:21`); **유료(2만원대)** = 워터마크 제거(`:22`); **워터마크 제거 외 유료로 잠기는 기능 없음**(`:23`); 과금 단위 = 청첩장 1개당 1회 결제(`payment_requests` 테이블, `:14`); **서랍장/타임캡슐 = 코드 없음(기획 단계), 마케팅 언급 금지**(`:34`).
- **제품 스펙 상태 태그 원칙** — `docs/marketing/PRODUCT_CATALOG.md`: `[구현완료]/[개발중]/[코드없음]/[확인필요]`로만 기록(`:7`). "로그인 없이 편집 시작 가능, 저장/발행 시 카카오 로그인 강제(초안은 sessionStorage 보관 후 복원)"(`:95`).
- **배포 이슈·예방책** — `DEPLOYMENT.md`: `@opennextjs/cloudflare` 1.14.8 미만 다운그레이드 시 500 에러(`:44`); Windows 로컬 배포 대신 항상 GitHub Actions(`:176`); Short ID(8자) 청첩장 404 → slug/ID 폴백(`:198-225`).
> `wedding-link/README.md`는 create-next-app 기본 템플릿(설계 정보 없음). `wedding-link/` 하위 별도 CLAUDE.md 없음(지침은 상위 `Study-02/CLAUDE.md` 하나).

---

## 부록. 코드상 불일치 / 확인 필요 (콘텐츠 사용 전 주의)

- **THE CLASSIC**: 코드엔 있으나 **미커밋·미배포**(작업 중). 프로덕션 미반영.
- **에디터 테마 스와치 색 ≠ 실제 렌더 hex**: `COLOR_THEMES`의 primary(예 classic-rose `#E91E63`)는 미리보기 스와치용, 실제 렌더는 항목 2-3(B~F)(예 OUR classic-rose primary `#C41050`).
- **동일 테마 id, 템플릿마다 hex 다름**: 예 classic-rose가 OUR/FAMILY vs MAGAZINE에서 secondary/background/sectionBg/divider 상이.
- **`film-dark` accent 코드 불일치**: Film 파일 `#D4838F`(`InvitationClientFilm.tsx`) vs Record 파일 `#B8977E`(`InvitationClientRecord.tsx`).
- **Record 테마 라벨↔id 어긋남**: record-peach=스카이, record-mint=포레스트. 스와치 accent와 클라이언트 primary/accent도 혼재.
- **개인화 링크에 slug/id 혼재**: `admin/guests`의 `personalLink`는 `inviteId`(id), 다른 곳은 slug. 뷰 라우트는 둘 다 처리하나 노출 값이 경로마다 다름.
- **AI 질문 배열 실제 표시 화면**: 라우트 코드만으론 어느 배열이 사용자 화면에 뜨는지 단정 불가(프론트 확인 필요).
- **PARENTS**: `/i/[slug]` 라우트 분기엔 없음(별도 `invitation/[id]` 라우트) — 이 파일 기준 확인 안 됨.
- **AI 모델**: `claude-3-haiku-20240307`(상위 CLAUDE.md의 최신 모델 언급과 무관하게 코드 실제값).
