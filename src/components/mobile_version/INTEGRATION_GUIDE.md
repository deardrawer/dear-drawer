# 모바일 컴포넌트 통합 가이드

기존 에디터 페이지에 모바일 최적화 컴포넌트를 통합하는 방법입니다.

## 🔄 통합 전략

### 옵션 1: 반응형 렌더링 (권장)

화면 크기에 따라 자동으로 모바일/데스크톱 버전을 선택합니다.

```tsx
'use client'

import { useState, useEffect } from 'react'
import EditPanel from '@/components/editor/EditPanel'
import MobileEditPanel from '@/components/mobile_version/MobileEditPanel'

export default function EditorPage() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // 초기 감지
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()

    // 윈도우 리사이즈 감지
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return (
    <div className="h-screen">
      {isMobile ? (
        <MobileEditPanel invitationId="123" />
      ) : (
        <EditPanel invitationId="123" />
      )}
    </div>
  )
}
```

### 옵션 2: CSS 미디어 쿼리

CSS로 숨기고 보이기를 제어합니다.

```tsx
export default function EditorPage() {
  return (
    <div className="h-screen">
      {/* 모바일 (< 768px) */}
      <div className="block md:hidden">
        <MobileEditPanel invitationId="123" />
      </div>

      {/* 데스크톱 (≥ 768px) */}
      <div className="hidden md:block">
        <EditPanel invitationId="123" />
      </div>
    </div>
  )
}
```

### 옵션 3: 라우트 분리

모바일 전용 라우트를 만듭니다.

```
app/
├── editor/
│   ├── page.tsx              # 데스크톱 에디터
│   └── mobile/
│       └── page.tsx          # 모바일 에디터
```

```tsx
// app/editor/mobile/page.tsx
import MobileEditPanel from '@/components/mobile_version/MobileEditPanel'

export default function MobileEditorPage() {
  return (
    <div className="h-screen">
      <MobileEditPanel invitationId="123" />
    </div>
  )
}
```

## 📱 완전한 통합 예제

### 1. OUR/FAMILY 템플릿 에디터

```tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import EditPanel from '@/components/editor/EditPanel'
import MobileEditPanel from '@/components/mobile_version/MobileEditPanel'
import Preview from '@/components/editor/Preview'

export default function EditorPage() {
  const params = useParams()
  const invitationId = params.id as string | null
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return (
    <div className="h-screen flex flex-col md:flex-row">
      {/* 에디터 패널 */}
      <div className="w-full md:w-96 lg:w-[400px] border-r">
        {isMobile ? (
          <MobileEditPanel invitationId={invitationId} />
        ) : (
          <EditPanel invitationId={invitationId} />
        )}
      </div>

      {/* 미리보기 (모바일에서는 숨김) */}
      <div className="hidden md:block flex-1 bg-gray-50">
        <Preview />
      </div>
    </div>
  )
}
```

### 2. PARENTS 템플릿 에디터

```tsx
'use client'

import { useState, useEffect } from 'react'
import ParentsEditPanel from '@/app/editor/parents/ParentsEditPanel'
import MobileParentsEditPanel from '@/components/mobile_version/MobileParentsEditPanel'
import ParentsPreview from '@/components/parents/ParentsPreview'
import type { ParentsInvitationData } from '@/app/editor/parents/page'

export default function ParentsEditorPage() {
  const [isMobile, setIsMobile] = useState(false)
  const [data, setData] = useState<ParentsInvitationData>(initialData)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const updateData = (updates: Partial<ParentsInvitationData>) => {
    setData(prev => ({ ...prev, ...updates }))
  }

  const updateNestedData = (path: string, value: unknown) => {
    setData(prev => {
      const newData = { ...prev }
      const keys = path.split('.')
      let current: any = newData

      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {}
        }
        current = current[keys[i]]
      }

      current[keys[keys.length - 1]] = value
      return newData
    })
  }

  return (
    <div className="h-screen flex flex-col md:flex-row">
      {/* 에디터 패널 */}
      <div className="w-full md:w-96 lg:w-[400px] border-r">
        {isMobile ? (
          <MobileParentsEditPanel
            data={data}
            updateData={updateData}
            updateNestedData={updateNestedData}
            invitationId="123"
          />
        ) : (
          <ParentsEditPanel
            data={data}
            updateData={updateData}
            updateNestedData={updateNestedData}
            invitationId="123"
          />
        )}
      </div>

      {/* 미리보기 */}
      <div className="hidden md:block flex-1 bg-gray-50">
        <ParentsPreview data={data} />
      </div>
    </div>
  )
}
```

## 🎨 스타일 충돌 방지

모바일 컴포넌트는 독립적인 스타일을 사용하므로 기존 컴포넌트와 충돌하지 않습니다.

```tsx
// 모바일 전용 클래스 사용 예시
<div className="
  touch-manipulation          // 모바일 터치 최적화
  min-h-[48px]               // 최소 터치 타겟
  active:bg-gray-100         // 터치 피드백
">
```

## 🔍 디버깅 및 테스트

### 크롬 DevTools로 모바일 테스트

1. F12를 눌러 DevTools 열기
2. Toggle device toolbar (Ctrl+Shift+M)
3. iPhone 12 Pro 또는 Pixel 5 선택
4. 터치 이벤트 시뮬레이션

### 실제 기기 테스트

```bash
# 로컬 네트워크에서 접근 허용
npm run dev -- --host

# 출력된 IP 주소를 모바일 기기에서 접속
# 예: http://192.168.0.10:3000
```

### 반응형 체크리스트

```tsx
// 디버깅용 화면 크기 표시
export function ScreenSizeIndicator() {
  return (
    <div className="fixed bottom-4 right-4 bg-black text-white px-3 py-1 rounded text-xs">
      <span className="block sm:hidden">XS (&lt; 640px)</span>
      <span className="hidden sm:block md:hidden">SM (≥ 640px)</span>
      <span className="hidden md:block lg:hidden">MD (≥ 768px)</span>
      <span className="hidden lg:block">LG (≥ 1024px)</span>
    </div>
  )
}
```

## ⚡ 성능 최적화

### 코드 스플리팅

```tsx
import { lazy, Suspense } from 'react'

// 동적 임포트로 번들 크기 줄이기
const MobileEditPanel = lazy(() => import('@/components/mobile_version/MobileEditPanel'))
const EditPanel = lazy(() => import('@/components/editor/EditPanel'))

export default function EditorPage() {
  const [isMobile, setIsMobile] = useState(false)

  return (
    <Suspense fallback={<div>Loading...</div>}>
      {isMobile ? (
        <MobileEditPanel invitationId="123" />
      ) : (
        <EditPanel invitationId="123" />
      )}
    </Suspense>
  )
}
```

### 미리보기 숨김 (모바일)

모바일에서는 에디터만 표시하여 성능 향상:

```tsx
<div className="h-screen flex flex-col md:flex-row">
  {/* 에디터: 항상 표시 */}
  <div className="w-full md:w-96">
    <MobileEditPanel />
  </div>

  {/* 미리보기: 데스크톱에서만 표시 */}
  <div className="hidden md:block flex-1">
    <Preview />
  </div>
</div>
```

## 🐛 트러블슈팅

### 문제: iOS에서 입력 시 화면이 확대됨

```tsx
// 해결: font-size를 16px 이상으로 설정
<Input
  className="text-base"  // 16px
  style={{ fontSize: '16px' }}
/>
```

### 문제: 드래그가 스크롤과 충돌

```tsx
// 해결: activationConstraint 거리 조정
useSensor(PointerSensor, {
  activationConstraint: {
    distance: 15,  // 15px 이상 드래그 시 활성화
  },
})
```

### 문제: Switch가 너무 작아서 터치하기 어려움

```tsx
// 해결: scale-125로 크기 확대
<div className="scale-125">
  <Switch />
</div>
```

### 문제: 탭 전환이 부드럽지 않음

```tsx
// 해결: transition 추가
<TabsTrigger className="transition-all duration-200">
```

## 📊 A/B 테스트

모바일 최적화 효과를 측정하려면:

```tsx
'use client'

import { useEffect } from 'react'

export default function EditorPage() {
  const [isMobile, setIsMobile] = useState(false)
  const [useMobileVersion, setUseMobileVersion] = useState(false)

  useEffect(() => {
    // 50% 확률로 모바일 버전 사용
    setUseMobileVersion(Math.random() > 0.5)

    // 애널리틱스 이벤트 전송
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'editor_version', {
        version: useMobileVersion ? 'mobile' : 'desktop'
      })
    }
  }, [])

  return useMobileVersion ? <MobileEditPanel /> : <EditPanel />
}
```

## 🎯 다음 단계

1. **기존 에디터 페이지에 통합**
   - `app/editor/page.tsx` 수정
   - `app/editor/parents/page.tsx` 수정

2. **사용자 피드백 수집**
   - 터치 타겟 크기 적절성
   - 드래그 앤 드롭 사용성
   - 전반적인 모바일 경험

3. **성능 모니터링**
   - Core Web Vitals 측정
   - 모바일 vs 데스크톱 비교

4. **점진적 개선**
   - 사용자 피드백 반영
   - 추가 모바일 최적화

## 📝 체크리스트

통합 전 확인 사항:

- [ ] 기존 컴포넌트와 props 인터페이스 일치 확인
- [ ] 모든 필수 기능이 모바일 버전에 포함되어 있는지 확인
- [ ] 반응형 브레이크포인트 설정 (768px)
- [ ] 로딩 상태 처리
- [ ] 에러 바운더리 추가
- [ ] 접근성 테스트 (키보드, 스크린 리더)
- [ ] 실제 모바일 기기에서 테스트
- [ ] 성능 측정 (Lighthouse Mobile)
