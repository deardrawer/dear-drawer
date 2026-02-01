# 위자드 에디터 구현 가이드

## 🎯 개발자를 위한 구현 가이드

이 문서는 **PRD_WIZARD_EDITOR_UX.md**를 기반으로 실제 개발 시 참고할 수 있는 구현 가이드입니다.

---

## 1. 프로젝트 구조

### 1.1 새로 생성할 파일

```bash
wedding-link/src/
├── components/
│   └── editor/
│       ├── WizardEditor.tsx            # 신규 - 위자드 컨테이너
│       └── wizard/                     # 신규 - 위자드 단계별 컴포넌트
│           ├── WizardProgress.tsx      # 진행률 바
│           ├── WizardNavigation.tsx    # 이전/다음 버튼
│           ├── Step1_BasicInfo.tsx     # Step 1
│           ├── Step2_IntroDesign.tsx   # Step 2
│           ├── Step3_Story.tsx         # Step 3
│           ├── Step4_Content.tsx       # Step 4
│           ├── Step5_FinalInfo.tsx     # Step 5
│           └── Step6_Completion.tsx    # Step 6
├── store/
│   └── editorStore.ts                  # 수정 - 위자드 상태 추가
└── lib/
    └── wizardValidation.ts             # 신규 - 단계별 검증 로직
```

### 1.2 수정할 파일

```bash
wedding-link/src/
├── app/
│   └── editor/
│       └── page.tsx                    # 수정 - 위자드 모드 플래그 추가
└── components/
    └── editor/
        └── EditPanel.tsx               # 유지 - 자유 편집 모드용
```

---

## 2. Step 1: editorStore 확장

### 2.1 타입 정의 추가

```typescript
// src/store/editorStore.ts

export type WizardStep = 1 | 2 | 3 | 4 | 5 | 6

export interface WizardState {
  step1: { completed: boolean; errors: string[] }
  step2: { completed: boolean; errors: string[] }
  step3: { completed: boolean; errors: string[] }
  step4: { completed: boolean; errors: string[] }
  step5: { completed: boolean; errors: string[] }
  step6: { completed: boolean; errors: string[] }
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
}
```

### 2.2 Store 인터페이스 확장

```typescript
interface EditorStore {
  // 기존 필드들...
  invitation: InvitationContent | null
  template: Template | null
  isDirty: boolean
  // ...

  // ===== 위자드 모드 추가 =====
  wizardMode: boolean
  wizardStep: WizardStep
  wizardState: WizardState

  // ===== 위자드 액션 =====
  setWizardMode: (mode: boolean) => void
  setWizardStep: (step: WizardStep) => void
  nextWizardStep: () => boolean  // 검증 후 다음 단계, 성공 시 true 반환
  prevWizardStep: () => void
  validateStep: (step: WizardStep) => ValidationResult
  completeStep: (step: WizardStep) => void
  resetWizard: () => void
}
```

### 2.3 Store 구현

```typescript
export const useEditorStore = create<EditorStore>((set, get) => ({
  // 기존 상태...
  invitation: null,
  template: null,
  isDirty: false,
  // ...

  // 위자드 초기 상태
  wizardMode: false,
  wizardStep: 1,
  wizardState: {
    step1: { completed: false, errors: [] },
    step2: { completed: false, errors: [] },
    step3: { completed: false, errors: [] },
    step4: { completed: false, errors: [] },
    step5: { completed: false, errors: [] },
    step6: { completed: false, errors: [] },
  },

  // 위자드 액션
  setWizardMode: (mode) => set({ wizardMode: mode }),

  setWizardStep: (step) => set({ wizardStep: step }),

  nextWizardStep: () => {
    const state = get()
    const validation = state.validateStep(state.wizardStep)

    if (!validation.valid) {
      // 검증 실패 시 에러 상태 업데이트
      set((s) => ({
        wizardState: {
          ...s.wizardState,
          [`step${s.wizardStep}`]: {
            completed: false,
            errors: validation.errors,
          },
        },
      }))
      return false
    }

    // 검증 성공 시
    const nextStep = Math.min(state.wizardStep + 1, 6) as WizardStep
    state.completeStep(state.wizardStep)
    set({ wizardStep: nextStep })
    return true
  },

  prevWizardStep: () => {
    const state = get()
    const prevStep = Math.max(state.wizardStep - 1, 1) as WizardStep
    set({ wizardStep: prevStep })
  },

  validateStep: (step) => {
    const state = get()
    const invitation = state.invitation

    if (!invitation) {
      return { valid: false, errors: ['초대장 데이터가 없습니다.'] }
    }

    const errors: string[] = []

    switch (step) {
      case 1:
        // Step 1: 기본 정보 검증
        if (!invitation.groom.name?.trim()) {
          errors.push('신랑 이름을 입력해주세요.')
        }
        if (!invitation.bride.name?.trim()) {
          errors.push('신부 이름을 입력해주세요.')
        }
        if (!invitation.wedding.date) {
          errors.push('결혼 날짜를 선택해주세요.')
        }
        if (!invitation.wedding.time) {
          errors.push('결혼 시간을 선택해주세요.')
        }
        if (!invitation.wedding.venue.name?.trim()) {
          errors.push('예식장 이름을 입력해주세요.')
        }
        if (!invitation.wedding.venue.address?.trim()) {
          errors.push('예식장 주소를 입력해주세요.')
        }
        break

      case 2:
        // Step 2: 인트로 디자인 검증
        if (!invitation.meta.kakaoThumbnail?.trim()) {
          errors.push('카카오톡 공유 썸네일을 추가해주세요.')
        }
        break

      case 3:
        // Step 3: 스토리 (선택 사항이므로 검증 없음)
        break

      case 4:
        // Step 4: 본문 콘텐츠 (선택 사항)
        break

      case 5:
        // Step 5: 마무리 정보 (선택 사항)
        break

      case 6:
        // Step 6: 완성 (슬러그 중복 체크는 별도)
        break

      default:
        break
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  },

  completeStep: (step) => {
    set((state) => ({
      wizardState: {
        ...state.wizardState,
        [`step${step}`]: {
          completed: true,
          errors: [],
        },
      },
    }))
  },

  resetWizard: () => {
    set({
      wizardStep: 1,
      wizardState: {
        step1: { completed: false, errors: [] },
        step2: { completed: false, errors: [] },
        step3: { completed: false, errors: [] },
        step4: { completed: false, errors: [] },
        step5: { completed: false, errors: [] },
        step6: { completed: false, errors: [] },
      },
    })
  },
}))
```

---

## 3. WizardProgress 컴포넌트

```typescript
// src/components/editor/wizard/WizardProgress.tsx
'use client'

interface WizardProgressProps {
  currentStep: 1 | 2 | 3 | 4 | 5 | 6
  totalSteps?: number
}

export default function WizardProgress({
  currentStep,
  totalSteps = 6
}: WizardProgressProps) {
  const progress = (currentStep / totalSteps) * 100

  const stepLabels: Record<number, string> = {
    1: '기본 정보 입력',
    2: '인트로 디자인',
    3: '스토리 만들기',
    4: '본문 콘텐츠',
    5: '마무리 정보',
    6: '완성 & 공유',
  }

  return (
    <div className="px-4 py-3 bg-white border-b sticky top-0 z-20">
      <div className="flex items-center justify-between mb-2">
        <div>
          <span className="text-sm font-medium text-gray-900">
            Step {currentStep}/{totalSteps}
          </span>
          <span className="ml-2 text-sm text-gray-600">
            {stepLabels[currentStep]}
          </span>
        </div>
        <span className="text-xs text-gray-500">{Math.round(progress)}% 완료</span>
      </div>

      {/* 진행률 바 */}
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-black transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  )
}
```

---

## 4. WizardNavigation 컴포넌트

```typescript
// src/components/editor/wizard/WizardNavigation.tsx
'use client'

import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface WizardNavigationProps {
  currentStep: 1 | 2 | 3 | 4 | 5 | 6
  canGoNext: boolean  // 다음 단계 진행 가능 여부
  onPrev: () => void
  onNext: () => void
  onSkip?: () => void  // 건너뛰기 (선택 단계만)
  onSaveLater?: () => void  // 나중에 계속하기
  nextLabel?: string
  isLastStep?: boolean
}

export default function WizardNavigation({
  currentStep,
  canGoNext,
  onPrev,
  onNext,
  onSkip,
  onSaveLater,
  nextLabel = '다음 단계',
  isLastStep = false,
}: WizardNavigationProps) {
  return (
    <div className="px-4 py-4 border-t bg-white sticky bottom-0 z-10">
      <div className="flex items-center justify-between gap-3">
        {/* 좌측: 이전 / 나중에 */}
        <div className="flex items-center gap-2">
          {currentStep > 1 && (
            <Button
              variant="outline"
              size="sm"
              onClick={onPrev}
              className="flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              이전
            </Button>
          )}

          {onSaveLater && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onSaveLater}
              className="text-gray-500"
            >
              나중에 계속하기
            </Button>
          )}
        </div>

        {/* 우측: 건너뛰기 / 다음 */}
        <div className="flex items-center gap-2">
          {onSkip && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onSkip}
              className="text-gray-500 underline"
            >
              건너뛰기
            </Button>
          )}

          <Button
            size="sm"
            onClick={onNext}
            disabled={!canGoNext}
            className="flex items-center gap-1 bg-black text-white hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isLastStep ? '저장하고 공유하기' : nextLabel}
            {!isLastStep && <ChevronRight className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  )
}
```

---

## 5. Step1_BasicInfo 컴포넌트 예시

```typescript
// src/components/editor/wizard/Step1_BasicInfo.tsx
'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useEditorStore } from '@/store/editorStore'
import { useState, useEffect } from 'react'

export default function Step1_BasicInfo() {
  const { invitation, updateNestedField, wizardState } = useEditorStore()

  if (!invitation) return null

  const errors = wizardState.step1.errors

  return (
    <div className="p-4 space-y-6 overflow-y-auto h-full">
      {/* 헤더 */}
      <div className="text-center pb-4 border-b">
        <div className="w-12 h-12 mx-auto mb-3 bg-black text-white rounded-full flex items-center justify-center text-xl">
          📋
        </div>
        <h2 className="text-xl font-semibold text-gray-900">
          청첩장의 기본 정보를 입력해주세요
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          모든 항목은 필수입니다
        </p>
      </div>

      {/* 에러 배너 */}
      {errors.length > 0 && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800 font-medium mb-1">
            ⚠ 다음 항목을 확인해주세요:
          </p>
          <ul className="text-sm text-red-700 list-disc list-inside">
            {errors.map((error, idx) => (
              <li key={idx}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 신랑 신부 정보 */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">
          신랑 신부 정보
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="groom-name" className="text-xs">
              신랑 이름 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="groom-name"
              value={invitation.groom.name}
              onChange={(e) => updateNestedField('groom.name', e.target.value)}
              placeholder="예: 홍길동"
              className={errors.some(e => e.includes('신랑')) ? 'border-red-500' : ''}
            />
          </div>
          <div>
            <Label htmlFor="bride-name" className="text-xs">
              신부 이름 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="bride-name"
              value={invitation.bride.name}
              onChange={(e) => updateNestedField('bride.name', e.target.value)}
              placeholder="예: 김영희"
              className={errors.some(e => e.includes('신부')) ? 'border-red-500' : ''}
            />
          </div>
        </div>
      </div>

      {/* 결혼식 정보 */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">
          결혼식 정보
        </h3>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="wedding-date" className="text-xs">
                날짜 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="wedding-date"
                type="date"
                value={invitation.wedding.date}
                onChange={(e) => updateNestedField('wedding.date', e.target.value)}
                className={errors.some(e => e.includes('날짜')) ? 'border-red-500' : ''}
              />
            </div>
            <div>
              <Label htmlFor="wedding-time" className="text-xs">
                시간 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="wedding-time"
                type="time"
                value={invitation.wedding.time}
                onChange={(e) => updateNestedField('wedding.time', e.target.value)}
                className={errors.some(e => e.includes('시간')) ? 'border-red-500' : ''}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 예식장 정보 */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">
          예식장 정보
        </h3>
        <div className="space-y-3">
          <div>
            <Label htmlFor="venue-name" className="text-xs">
              예식장 이름 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="venue-name"
              value={invitation.wedding.venue.name}
              onChange={(e) => updateNestedField('wedding.venue.name', e.target.value)}
              placeholder="예: 그랜드 하얏트 서울"
              className={errors.some(e => e.includes('예식장')) ? 'border-red-500' : ''}
            />
          </div>
          <div>
            <Label htmlFor="venue-hall" className="text-xs">
              예식 홀 (선택)
            </Label>
            <Input
              id="venue-hall"
              value={invitation.wedding.venue.hall}
              onChange={(e) => updateNestedField('wedding.venue.hall', e.target.value)}
              placeholder="예: 3층 그랜드볼룸"
            />
          </div>
          <div>
            <Label htmlFor="venue-address" className="text-xs">
              주소 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="venue-address"
              value={invitation.wedding.venue.address}
              onChange={(e) => updateNestedField('wedding.venue.address', e.target.value)}
              placeholder="주소를 입력하세요"
              className={errors.some(e => e.includes('주소')) ? 'border-red-500' : ''}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
```

---

## 6. WizardEditor 컨테이너

```typescript
// src/components/editor/WizardEditor.tsx
'use client'

import { useEditorStore } from '@/store/editorStore'
import WizardProgress from './wizard/WizardProgress'
import WizardNavigation from './wizard/WizardNavigation'
import Step1_BasicInfo from './wizard/Step1_BasicInfo'
import Step2_IntroDesign from './wizard/Step2_IntroDesign'
import Step3_Story from './wizard/Step3_Story'
import Step4_Content from './wizard/Step4_Content'
import Step5_FinalInfo from './wizard/Step5_FinalInfo'
import Step6_Completion from './wizard/Step6_Completion'
import { useRouter } from 'next/navigation'

interface WizardEditorProps {
  onSave: () => Promise<void>
}

export default function WizardEditor({ onSave }: WizardEditorProps) {
  const router = useRouter()
  const {
    wizardStep,
    wizardState,
    nextWizardStep,
    prevWizardStep,
    validateStep,
    setWizardMode,
  } = useEditorStore()

  const currentStepState = wizardState[`step${wizardStep}`]
  const validation = validateStep(wizardStep)

  const handleNext = () => {
    const success = nextWizardStep()
    if (!success) {
      // 검증 실패 시 스크롤을 상단으로 (에러 메시지 표시)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleSkip = () => {
    // 선택 단계(3-5)만 건너뛰기 가능
    if (wizardStep >= 3 && wizardStep <= 5) {
      useEditorStore.getState().completeStep(wizardStep)
      useEditorStore.getState().setWizardStep((wizardStep + 1) as any)
    }
  }

  const handleSaveLater = async () => {
    await onSave()  // Draft 저장
    router.push('/my-invitations')
  }

  const handleSwitchToFreeEdit = () => {
    setWizardMode(false)
  }

  const renderStep = () => {
    switch (wizardStep) {
      case 1:
        return <Step1_BasicInfo />
      case 2:
        return <Step2_IntroDesign />
      case 3:
        return <Step3_Story />
      case 4:
        return <Step4_Content />
      case 5:
        return <Step5_FinalInfo />
      case 6:
        return <Step6_Completion onSave={onSave} />
      default:
        return null
    }
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* 진행률 표시 */}
      <WizardProgress currentStep={wizardStep} />

      {/* 자유 편집 모드 전환 버튼 (우측 상단 고정) */}
      <div className="absolute top-4 right-4 z-30">
        <button
          onClick={handleSwitchToFreeEdit}
          className="text-xs text-gray-500 hover:text-gray-700 underline"
        >
          자유 편집 모드로 전환
        </button>
      </div>

      {/* 단계별 콘텐츠 */}
      <div className="flex-1 overflow-y-auto">
        {renderStep()}
      </div>

      {/* 네비게이션 */}
      <WizardNavigation
        currentStep={wizardStep}
        canGoNext={validation.valid}
        onPrev={prevWizardStep}
        onNext={handleNext}
        onSkip={wizardStep >= 3 && wizardStep <= 5 ? handleSkip : undefined}
        onSaveLater={handleSaveLater}
        isLastStep={wizardStep === 6}
      />
    </div>
  )
}
```

---

## 7. editor/page.tsx 수정

```typescript
// src/app/editor/page.tsx (수정)
'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useEditorStore } from '@/store/editorStore'
import EditPanel from '@/components/editor/EditPanel'
import WizardEditor from '@/components/editor/WizardEditor'
import Preview from '@/components/editor/Preview'

function EditorContent() {
  const searchParams = useSearchParams()
  const editId = searchParams.get('id')
  const templateId = searchParams.get('template') || 'narrative-our'

  const {
    wizardMode,
    setWizardMode,
    initInvitation
  } = useEditorStore()

  const [showModeSelector, setShowModeSelector] = useState(false)

  useEffect(() => {
    // 기존 청첩장 수정 시: 모드 선택 모달 표시
    if (editId) {
      setShowModeSelector(true)
    } else {
      // 신규 청첩장: 위자드 모드 기본값
      setWizardMode(true)
    }
  }, [editId])

  const handleSave = async () => {
    // 기존 저장 로직 유지
    // ...
  }

  // 모드 선택 모달
  if (showModeSelector) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <h2 className="text-xl font-semibold mb-3">
            편집 방식을 선택해주세요
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            위자드 모드는 단계별로 안내하며, 자유 편집 모드는 모든 항목을 한 번에 수정할 수 있습니다.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => {
                setWizardMode(true)
                setShowModeSelector(false)
              }}
              className="w-full p-4 border-2 border-black rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="font-semibold mb-1">✨ 위자드 모드 (권장)</div>
              <div className="text-xs text-gray-600">
                단계별 안내를 받으며 편집합니다
              </div>
            </button>
            <button
              onClick={() => {
                setWizardMode(false)
                setShowModeSelector(false)
              }}
              className="w-full p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="font-semibold mb-1">🎨 자유 편집 모드</div>
              <div className="text-xs text-gray-600">
                모든 항목을 자유롭게 편집합니다
              </div>
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Action Bar */}
      <header className="h-12 border-b flex items-center justify-between px-6">
        {/* ... 기존 헤더 유지 ... */}
      </header>

      {/* Main Editor Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* 좌측: 에디터 패널 */}
        <div className="w-2/5 min-w-[400px] max-w-[500px] border-r">
          {wizardMode ? (
            <WizardEditor onSave={handleSave} />
          ) : (
            <EditPanel
              onOpenIntroSelector={() => {}}
              onOpenAIStoryGenerator={() => {}}
              invitationId={editId}
              templateId={templateId}
            />
          )}
        </div>

        {/* 우측: 미리보기 */}
        <div className="flex-1">
          <Preview />
        </div>
      </div>
    </div>
  )
}

export default function EditorPage() {
  return <EditorContent />
}
```

---

## 8. 체크리스트

### Week 1
- [ ] editorStore에 위자드 상태 추가
- [ ] WizardProgress 컴포넌트 구현
- [ ] WizardNavigation 컴포넌트 구현
- [ ] WizardEditor 컨테이너 구현
- [ ] editor/page.tsx에 모드 선택 모달 추가

### Week 2
- [ ] Step1_BasicInfo 구현
- [ ] Step2_IntroDesign 구현
- [ ] 단계별 검증 로직 구현
- [ ] 에러 배너 UI 구현

### Week 3
- [ ] Step3_Story 구현
- [ ] AI 스토리 생성 권장 모달 구현
- [ ] AI 생성 결과 반영 로직 연동

### Week 4
- [ ] QA 및 버그 수정
- [ ] 모바일 반응형 테스트
- [ ] 성능 최적화 (이미지 레이지 로딩)
- [ ] GA4 이벤트 추적 추가

---

## 9. 주의사항

### 9.1 기존 코드 호환성
- `EditPanel.tsx`는 그대로 유지 (자유 편집 모드용)
- 기존 사용자의 데이터는 모두 호환되어야 함
- `invitations` 테이블 스키마 변경은 선택적 (필수 아님)

### 9.2 에러 핸들링
- 검증 실패 시 스크롤을 에러 위치로 이동
- 에러 메시지는 한국어로 명확하게
- 필수 항목은 `*` 표시로 시각적 강조

### 9.3 성능 최적화
- 단계별 컴포넌트 lazy loading 고려
- 이미지 업로드는 비동기 처리
- Draft 저장은 debounce (3초 간격)

---

## 10. 테스트 시나리오

### 시나리오 1: 신규 청첩장 작성
1. 갤러리에서 템플릿 선택
2. 에디터 진입 → 자동으로 위자드 모드 + Step 1 표시
3. 기본 정보 입력 (이름, 날짜, 예식장)
4. "다음 단계" 클릭 → Step 2 진입
5. 인트로 선택, 썸네일 업로드
6. Step 3에서 "AI로 만들기" → 질문 응답 → 적용
7. Step 4-5 건너뛰기
8. Step 6에서 슬러그 설정 → 저장 및 공유

### 시나리오 2: 필수 항목 누락 검증
1. Step 1에서 신랑 이름만 입력
2. "다음 단계" 클릭
3. 에러 배너 표시: "신부 이름을 입력해주세요"
4. 신부 이름 입력 후 "다음 단계" → 성공

### 시나리오 3: 자유 편집 모드 전환
1. 위자드 모드로 Step 2까지 진행
2. 우측 상단 "자유 편집 모드로 전환" 클릭
3. 기존 탭 방식 EditPanel로 전환
4. 작성한 내용 유지 확인

---

## 11. 참고 자료

- **PRD_WIZARD_EDITOR_UX.md**: 전체 기능 명세 및 UX 가이드
- **EDITOR_ANALYSIS.md**: 현재 에디터 구조 분석
- **WIZARD_PROPOSAL_SUMMARY.md**: 요약 제안서

---

**작성일**: 2026-01-31
**버전**: v1.0
**작성자**: PM (Claude Code)
