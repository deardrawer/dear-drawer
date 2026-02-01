# 현재 에디터 구조 분석 문서

## 📊 현재 상태 (As-Is Analysis)

### 1. 전체 아키텍처

```
┌─────────────────────────────────────────────────────────┐
│                    editor/page.tsx                      │
│  ┌──────────────────┐  ┌──────────────────────────┐    │
│  │   EditPanel      │  │      Preview             │    │
│  │   (좌측 40%)     │  │   (우측 60%, 데스크탑만) │    │
│  └──────────────────┘  └──────────────────────────┘    │
│                                                         │
│  Modals:                                                │
│  - ShareModal                                           │
│  - AIStoryGenerator (Portal)                            │
│  - IntroSelector (전체 화면 전환)                        │
│  - Preview Modal (모바일용)                             │
└─────────────────────────────────────────────────────────┘
```

### 2. EditPanel 구조 상세 분석

#### 2.1 탭 구조

현재 `EditPanel.tsx`는 4개의 주요 탭으로 구성되어 있습니다:

```typescript
<Tabs value={editorActiveTab} onValueChange={setEditorActiveTab}>
  <TabsList>
    <TabsTrigger value="design">디자인</TabsTrigger>      // 8개 아코디언
    <TabsTrigger value="required">필수입력</TabsTrigger>   // 5개 아코디언
    <TabsTrigger value="story">스토리</TabsTrigger>        // 3개 아코디언
    <TabsTrigger value="extras">추가기능</TabsTrigger>     // 5개 아코디언
  </TabsList>
</Tabs>
```

#### 2.2 각 탭별 아코디언 항목

**디자인 탭 (8개)**
1. `design-theme` - 컬러 테마
2. `design-font` - 폰트 스타일
3. `design-intro` - 인트로 애니메이션
4. `design-animation` - 추가 애니메이션
5. `design-bgm` - 배경음악
6. `design-cover` - 커버 이미지
7. `design-kakao` - 카카오톡 공유 설정
8. `design-divider` - 섹션 구분선 텍스트

**필수입력 탭 (5개)**
1. `couple-basic` - 신랑/신부 기본 정보
2. `family-info` - 부모님 정보
3. `greeting` - 인사말
4. `wedding-info` - 예식 정보 (날짜, 시간, 장소)
5. `directions` - 오시는 길
6. `gallery` - 갤러리 이미지

**스토리 탭 (3개)**
1. `profile` - 커플 프로필
2. `our-story` - 우리의 이야기 (러브스토리)
3. `interview` - 인터뷰 Q&A

**추가기능 탭 (5개)**
1. `guidance` - 행복한 시간을 위한 안내
2. `info` - 기타 안내사항 (드레스코드, 포토부스 등)
3. `bank` - 계좌 정보
4. `rsvp` - RSVP 설정
5. `thank-you` - 감사 인사

### 3. 데이터 흐름 분석

#### 3.1 Zustand 상태 관리

```typescript
// editorStore.ts
interface EditorStore {
  // 상태
  invitation: InvitationContent | null
  template: Template | null
  isDirty: boolean              // 저장되지 않은 변경사항 여부
  isSaving: boolean
  activeSection: PreviewSectionId  // 현재 편집 중인 섹션
  editorActiveTab: string         // 현재 활성 탭
  validationError: { tab: string; message: string } | null

  // 액션
  initInvitation: (template: Template) => void
  updateField: (field, value) => void
  updateNestedField: (path: string, value: unknown) => void
  updateMultipleFields: (fields: Partial<InvitationContent>) => void
  applyAIStory: (story: GeneratedStory) => void
  toggleSectionVisibility: (section) => void
  // ... 기타
}
```

#### 3.2 저장 프로세스

```
사용자 입력
  ↓
updateField / updateNestedField 호출
  ↓
editorStore 업데이트 + isDirty = true
  ↓
사용자가 "저장" 버튼 클릭
  ↓
handleSave() 실행
  ↓
필수 항목 검증
  - groom.name (필수)
  - bride.name (필수)
  - meta.kakaoThumbnail (필수)
  ↓
검증 실패 시:
  - setValidationError()
  - 해당 탭으로 자동 이동
  - 에러 배너 표시
  ↓
검증 통과 시:
  - base64 이미지 제거 (cleanImages)
  - POST /api/invitations (신규)
  - PUT /api/invitations/:id (수정)
  ↓
resetDirty()
```

### 4. 현재 UI/UX 문제점 상세

#### 4.1 인지 과부하 (Cognitive Overload)

**문제점**
- 총 21개의 아코디언 항목이 4개 탭에 분산
- 사용자가 "어디부터 시작해야 하는가?"를 알 수 없음
- 필수/선택 항목의 구분이 시각적으로 명확하지 않음

**사용자 여정 예시 (부정적)**
```
사용자: "청첩장을 만들고 싶어요"
  → 에디터 진입
  → 4개 탭, 21개 항목에 압도됨
  → "디자인" 탭부터 시작? "필수입력" 탭부터 시작?
  → 탭을 클릭하며 둘러봄 (2분 소요)
  → "일단 이름부터 입력해야겠다" (필수입력 탭 선택)
  → 이름 입력 → 다음엔 뭐하지?
  → 다시 탭 전환하며 탐색 (3분 소요)
  → 지쳐서 이탈
```

#### 4.2 비선형적 UX

**문제점**
- 탭 간 자유로운 이동 가능
- 진행 상태를 파악할 수 없음
- "내가 지금 몇 % 완성했는가?"를 알 수 없음

**현재 플로우**
```
필수입력 → 디자인 → 스토리 → 필수입력(다시) → 추가기능 → 저장
  ↑──────────────────┴────────────────────────────────┘
  (사용자가 임의로 왔다갔다)
```

**이상적인 플로우**
```
Step 1 → Step 2 → Step 3 → Step 4 → Step 5 → 완료
(선형적, 진행률 명확)
```

#### 4.3 검증 타이밍 문제

**현재 검증 시점**
```typescript
// editor/page.tsx handleSave()
if (!invitation.groom.name?.trim() || !invitation.bride.name?.trim()) {
  useEditorStore.getState().setEditorActiveTab('required')
  useEditorStore.getState().setValidationError({
    tab: 'required',
    message: '📋 필수입력 > 신랑/신부 이름을 모두 입력해주세요.'
  })
  return
}
```

**문제점**
- 저장 버튼을 눌러야만 필수 항목 누락을 인지
- 사용자가 30분간 작성 후 저장 시도 → 에러 → 좌절감 ↑

**개선 방안**
- 각 단계 완료 시점에 실시간 검증
- 필수 항목 미입력 시 "다음 단계" 버튼 비활성화

#### 4.4 모바일 경험 부재

**현재 모바일 처리**
```tsx
{isMobile && (
  <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 text-center">
    <p className="text-sm text-amber-800">
      더 나은 편집 환경을 위해 데스크탑에서 작성해주세요
    </p>
  </div>
)}
```

**문제점**
- 모바일 사용자 진입 차단 (경고 메시지만 표시)
- 모바일 트래픽 증가 추세에 대응 불가
- 외출 중 간단한 수정도 불가능

**사용자 시나리오 (부정적)**
```
모바일 사용자: "출근길에 이름만 수정하려고 했는데..."
  → 경고 메시지 확인
  → 데스크탑 접속해야 함을 인지
  → 좌절 → 이탈
```

### 5. AI 스토리 생성 플로우 분석

#### 5.1 현재 플로우

```
사용자가 "스토리" 탭 진입
  ↓
수동으로 "AI 스토리 생성" 버튼 탐색
  ↓
버튼 클릭
  ↓
AIStoryGenerator 모달 표시 (Portal 방식)
  ↓
질문 응답 (OUR: 10개, FAMILY: 12개)
  ↓
AI 생성 (Claude API 호출)
  ↓
생성 결과 확인
  ↓
"적용하기" 클릭
  ↓
handleAIStoryGeneratorApply() 실행
  ↓
editorStore 업데이트 (greeting, profile, story, interview 등)
  ↓
모달 닫힘
  ↓
스토리 탭에서 생성된 콘텐츠 확인
```

#### 5.2 문제점

**발견성 (Discoverability) 문제**
- "AI 스토리 생성" 버튼이 "스토리" 탭 내부에 숨어있음
- 신규 사용자가 AI 기능 존재를 모를 수 있음

**개선 방안 (위자드에서)**
- Step 3 진입 시 자동으로 "AI로 만들기" 권장 모달 표시
- 사용자 선택지:
  - [AI로 만들기] → AI 질문 플로우
  - [직접 작성하기] → 수동 입력 필드 표시

### 6. 필드별 데이터 구조 분석

#### 6.1 InvitationContent 주요 필드

```typescript
interface InvitationContent {
  // 커플 정보 (필수)
  groom: PersonInfo {
    name: string              // ✅ 필수
    phone: string
    father: ParentInfo
    mother: ParentInfo
    bank: BankInfo
    profile: ProfileInfo
  }
  bride: PersonInfo { ... }   // ✅ 필수

  // 결혼식 정보 (필수)
  wedding: {
    date: string              // ✅ 필수
    time: string              // ✅ 필수
    venue: {
      name: string            // ✅ 필수
      hall: string
      address: string         // ✅ 필수
    }
    directions: DirectionsInfo
  }

  // 콘텐츠 (선택)
  content: {
    greeting: string          // 인사말
    quote: QuoteInfo
    thankYou: ThankYouInfo
    info: InfoSettings        // 안내사항
    interviews: InterviewItem[]
    guestbookQuestions: string[]
  }

  // 갤러리 (선택)
  gallery: {
    images: string[]
    imageSettings: ImageSettings[]
  }

  // 미디어 (선택)
  media: {
    coverImage: string
    infoImage: string
    bgm: string
  }

  // 메타 (카카오 썸네일 필수)
  meta: {
    title: string
    description: string
    ogImage: string
    kakaoThumbnail: string    // ✅ 필수
  }

  // 섹션 공개 설정
  sectionVisibility: SectionVisibility
}
```

#### 6.2 필수 항목 정리

| 필드 | 검증 위치 | 에러 메시지 |
|------|-----------|-------------|
| `groom.name` | handleSave() | "📋 필수입력 > 신랑/신부 이름을 모두 입력해주세요." |
| `bride.name` | handleSave() | 동일 |
| `meta.kakaoThumbnail` | handleSave() | "🎨 디자인 > 공유 미리보기 설정 > 카카오톡 공유 썸네일을 추가해주세요." |
| `wedding.date` | 없음 (현재 검증 없음) | - |
| `wedding.time` | 없음 | - |
| `wedding.venue.name` | 없음 | - |
| `wedding.venue.address` | 없음 | - |

**문제점**
- 날짜, 시간, 예식장 정보는 필수임에도 검증 로직 없음
- 사용자가 이름만 입력하고 저장 가능 → 청첩장 불완전

### 7. 현재 사용자 경험 시나리오

#### 7.1 신규 사용자 (부정적 시나리오)

```
[00:00] 갤러리에서 템플릿 선택 (OUR)
[00:05] 에디터 로딩... EditPanel 표시
[00:07] "어디부터 시작하지?" (4개 탭 둘러봄)
[00:10] "디자인" 탭 클릭 → 컬러 테마 변경
[00:15] "필수입력" 탭 클릭 → 이름 입력
[00:20] "스토리" 탭 클릭 → "직접 쓰기 어렵다..."
[00:25] 다시 "디자인" 탭으로 이동 → 인트로 애니메이션 변경
[00:30] "추가기능" 탭 → RSVP 설정
[00:35] "아, 예식장 정보 입력 안 했네" → "필수입력" 탭
[00:40] 예식장 정보 입력
[00:45] "저장" 클릭
[00:46] 에러: "카카오톡 공유 썸네일을 추가해주세요."
[00:47] "어디서 추가하지?" → 탭 전환하며 탐색
[00:50] "디자인" 탭 → 카카오 썸네일 업로드
[00:55] "저장" 재시도 → 성공
[00:56] "휴... 겨우 저장했다. 스토리는 나중에 쓰자."
[00:57] 브라우저 닫음
```

**총 소요 시간**: 57분
**문제점**
- 비선형적 탐색으로 시간 낭비
- 필수 항목 누락을 저장 시점에 발견
- 스토리 작성 포기 → 청첩장 불완전

#### 7.2 이상적인 사용자 경험 (위자드 도입 후)

```
[00:00] 갤러리에서 템플릿 선택 (OUR)
[00:05] 에디터 진입 → "Step 1/6 기본 정보 입력" 자동 표시
[00:06] "아, 여기서부터 시작하는구나!" (명확한 지침)
[00:08] 신랑/신부 이름, 날짜, 예식장 정보 입력
[00:12] "다음 단계" 클릭 → Step 2 (인트로 디자인)
[00:13] 인트로 프리셋 선택 + 커버 이미지 업로드
[00:15] 카카오 썸네일 업로드 (필수 표시 명확)
[00:17] "다음 단계" 클릭 → Step 3 (스토리)
[00:18] "AI로 만들기" 권장 모달 표시
[00:19] "오, AI가 만들어주는구나!" → AI 질문 시작
[00:25] 10개 질문 응답 완료
[00:30] AI 생성 중... (로딩 15초)
[00:45] 생성 결과 확인 → "적용하기"
[00:46] Step 3 완료 → "다음 단계"
[00:47] Step 4 (본문 콘텐츠) → 갤러리 이미지 업로드
[00:52] "다음 단계" → Step 5 (계좌 정보) → "건너뛰기"
[00:53] Step 6 (완성) → 슬러그 설정 + "저장하고 공유하기"
[00:54] 공유 모달 표시 → QR 코드 다운로드
[00:55] "완성!"
```

**총 소요 시간**: 25분 (기존 대비 57% 단축)
**개선점**
- 선형적 플로우로 다음 할 일이 명확
- AI 권장으로 콘텐츠 생성 시간 단축
- 실시간 검증으로 에러 조기 발견

### 8. 성능 분석

#### 8.1 현재 성능 지표 (추정)

| 항목 | 현재 | 목표 |
|------|------|------|
| 에디터 초기 로딩 | 2-3초 | 1.5초 |
| 탭 전환 속도 | 100-200ms | <100ms |
| 이미지 업로드 (5MB) | 5-7초 | <3초 |
| AI 스토리 생성 | 15-20초 | 12-15초 |
| 저장 속도 | 1-2초 | <1초 |

#### 8.2 병목 구간

**EditPanel.tsx 파일 크기**
- 현재: 40,079 토큰 (약 3,500줄 추정)
- 문제점: 단일 파일에 모든 탭 로직 포함 → 초기 로딩 느림
- 해결책: 탭별 코드 스플리팅 (lazy loading)

**이미지 업로드**
```typescript
// 현재 플로우
사용자가 이미지 선택 (5MB)
  ↓
클라이언트에서 base64 변환 (느림)
  ↓
Supabase 업로드
  ↓
URL 반환
```

**개선 방안**
- 이미지 리사이징 (클라이언트 측, 1920px 이하로 제한)
- WebP 변환 (파일 크기 50% 감소)
- 업로드 중 낙관적 UI 업데이트

### 9. 접근성 (Accessibility) 문제

#### 9.1 현재 접근성 수준

**키보드 네비게이션**
- ❌ Tab 키로 탭 전환 불가 (마우스 클릭 필수)
- ✅ 입력 필드 Tab 이동 가능
- ❌ 아코디언 Enter 키로 열기/닫기 불가

**스크린 리더 지원**
- ❌ 진행률 정보 없음 (aria-valuenow 미설정)
- ❌ 필수 항목 표시 없음 (aria-required 미설정)
- ⚠️ 에러 메시지 role="alert" 없음

**색상 대비**
- ✅ 대부분 WCAG AA 기준 충족
- ❌ 비활성 버튼 색상 대비 부족 (bg-gray-300)

### 10. 개선 우선순위 매트릭스

```
            높음 │ P1: AI 자동 권장   │ P0: 위자드 플로우 │
영향도            │ P2: 모바일 최적화   │ P0: 진행률 표시   │
            낮음 │ P2: 도움말 투어     │ P1: 자동 저장     │
                 └─────────────────────┴───────────────────┘
                     낮음        구현 난이도        높음
```

**P0 (Critical)**
- 위자드 플로우 구현
- 진행률 표시
- 단계별 검증

**P1 (High)**
- AI 자동 권장
- 자동 저장 (Draft)
- 모드 전환 기능

**P2 (Medium)**
- 모바일 최적화
- 도움말 투어
- 성능 최적화

### 11. 마이그레이션 전략

#### 11.1 기존 데이터 호환성

**현재 DB 스키마**
```sql
invitations (
  id,
  user_id,
  template_id,
  groom_name,
  bride_name,
  wedding_date,
  wedding_time,
  venue_name,
  venue_address,
  venue_hall,
  content,        -- JSON (전체 InvitationContent)
  slug,
  is_published,
  created_at,
  updated_at
)
```

**위자드 도입 후 추가 필드 (선택적)**
```sql
ALTER TABLE invitations
ADD COLUMN wizard_completed_steps INTEGER[] DEFAULT '{}',
ADD COLUMN wizard_current_step INTEGER DEFAULT 1;
```

**마이그레이션 시나리오**
1. 기존 청첩장 수정 시: "위자드 모드" vs "자유 편집 모드" 선택 모달 표시
2. 신규 청첩장 작성 시: 자동으로 위자드 모드 진입
3. 위자드 모드에서 "자유 편집 모드"로 전환 시: 현재 단계 상태 저장

#### 11.2 롤백 계획

**Feature Flag 사용**
```typescript
// 환경 변수
NEXT_PUBLIC_ENABLE_WIZARD_MODE=true

// 런타임 체크
if (process.env.NEXT_PUBLIC_ENABLE_WIZARD_MODE === 'true') {
  return <WizardEditor />
} else {
  return <EditPanel />
}
```

**A/B 테스트 그룹**
- Group A (50%): 위자드 모드
- Group B (50%): 기존 탭 방식
- 성공 지표: 청첩장 완성률

### 12. 결론 및 권장사항

#### 12.1 핵심 문제 요약

1. **인지 과부하**: 21개 아코디언 항목에 압도
2. **비선형 UX**: 다음 할 일이 명확하지 않음
3. **검증 지연**: 저장 시점에만 에러 발견
4. **모바일 부재**: 모바일 작성 불가

#### 12.2 권장 솔루션

**단기 (4주, MVP)**
- Step 1-2 위자드 구현
- 진행률 표시
- 단계별 실시간 검증

**중기 (8주, v1.1)**
- 전체 위자드 완성 (Step 3-6)
- 모바일 최적화
- 자동 저장 기능

**장기 (12주+, v1.2)**
- 도움말 투어
- AI 추천 엔진
- 협업 기능

#### 12.3 예상 효과

| 지표 | 현재 | 목표 | 개선율 |
|------|------|------|--------|
| 청첩장 완성률 | 35% | 65% | +85% |
| 평균 작성 시간 | 45분 | 30분 | -33% |
| 사용자 만족도 (NPS) | N/A | 60+ | - |
| 모바일 작성 가능 여부 | ❌ | ✅ (Step 1-2) | +100% |

---

## 부록: 코드 스니펫

### 현재 저장 로직
```typescript
// editor/page.tsx
const handleSave = async () => {
  if (!invitation || !user) {
    alert('저장하려면 로그인이 필요합니다.')
    router.push('/login')
    return
  }

  // 필수 항목 검증
  if (!invitation.groom.name?.trim() || !invitation.bride.name?.trim()) {
    useEditorStore.getState().setEditorActiveTab('required')
    useEditorStore.getState().setValidationError({
      tab: 'required',
      message: '📋 필수입력 > 신랑/신부 이름을 모두 입력해주세요.'
    })
    return
  }

  if (!invitation.meta.kakaoThumbnail?.trim()) {
    useEditorStore.getState().setEditorActiveTab('design')
    useEditorStore.getState().setValidationError({
      tab: 'design',
      message: '🎨 디자인 > 공유 미리보기 설정 > 카카오톡 공유 썸네일을 추가해주세요.'
    })
    return
  }

  setSaving(true)

  try {
    const cleanInvitation = JSON.parse(JSON.stringify(invitation))
    const cleanImages = (obj) => { /* base64 제거 로직 */ }
    cleanImages(cleanInvitation)

    const payload = {
      template_id: templateId,
      groom_name: invitation.groom.name,
      bride_name: invitation.bride.name,
      wedding_date: invitation.wedding.date,
      wedding_time: invitation.wedding.timeDisplay,
      venue_name: invitation.wedding.venue.name,
      venue_address: invitation.wedding.venue.address,
      venue_hall: invitation.wedding.venue.hall,
      content: JSON.stringify(cleanInvitation),
    }

    let response
    if (invitationId) {
      response = await fetch(`/api/invitations/${invitationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    } else {
      response = await fetch('/api/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    }

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || '저장에 실패했습니다.')
    }

    if (!invitationId && data.invitation?.id) {
      setInvitationId(data.invitation.id)
    }

    resetDirty()
    alert('저장되었습니다!')
  } catch (error) {
    console.error('Save error:', error)
    alert(error instanceof Error ? error.message : '저장에 실패했습니다.')
  } finally {
    setSaving(false)
  }
}
```

### 현재 AI 스토리 적용 로직
```typescript
// editor/page.tsx
const handleAIStoryGeneratorApply = (content: GeneratedContent) => {
  // 인사말 적용
  if (content.greeting) {
    updateNestedField('content.greeting', content.greeting)
  }

  // 감사 인사 적용
  if (content.thanks) {
    updateNestedField('content.thankYou.message', content.thanks)
  }

  // 신랑 소개 적용
  if (content.groomProfile) {
    updateNestedField('groom.profile.intro', content.groomProfile)
  }

  // 신부 소개 적용
  if (content.brideProfile) {
    updateNestedField('bride.profile.intro', content.brideProfile)
  }

  // 러브스토리 적용
  if (content.story) {
    const stories = []
    if (content.story.first) {
      stories.push({
        date: '',
        title: '연애의 시작',
        desc: content.story.first,
        images: [],
        imageSettings: []
      })
    }
    // ... (생략)
    if (stories.length > 0) {
      updateNestedField('relationship.stories', stories)
      if (invitation && !invitation.sectionVisibility.ourStory) {
        toggleSectionVisibility('ourStory')
      }
    }
  }

  // 인터뷰 적용
  if (content.interview && content.interview.length > 0) {
    const interviews = content.interview.map((item, index) => ({
      question: item.question,
      answer: item.jointAnswer || `🤵 ${item.groomAnswer}\n\n👰 ${item.brideAnswer}`,
      images: [],
      imageSettings: [],
      bgClass: index % 2 === 0 ? 'white-bg' : 'pink-bg'
    }))
    updateNestedField('content.interviews', interviews)
    if (invitation && !invitation.sectionVisibility.interview) {
      toggleSectionVisibility('interview')
    }
  }

  setIsAIStoryGeneratorOpen(false)
}
```
