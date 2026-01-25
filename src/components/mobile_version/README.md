# 모바일 최적화 컴포넌트

웨딩 청첩장 에디터의 모바일 최적화 버전입니다.

## 📂 파일 구조

```
mobile_version/
├── MobileSortableList.tsx        # 모바일 최적화 드래그 앤 드롭 리스트
├── MobileEditPanel.tsx            # OUR/FAMILY 템플릿용 모바일 에디터
├── MobileParentsEditPanel.tsx     # PARENTS 템플릿용 모바일 에디터
└── README.md                      # 이 파일
```

## 🎯 주요 모바일 최적화 사항

### 1. 터치 타겟 최적화
- **최소 크기**: 44px (iOS) / 48px (Material Design 권장)
- **드래그 핸들**: 48px 너비로 충분한 터치 영역 확보
- **버튼**: 최소 높이 44px-48px
- **아코디언 트리거**: 최소 높이 56px

```tsx
// 예시: 터치 타겟 최소 크기
<button className="min-h-[48px] w-12 touch-manipulation">
  <GripVertical className="w-5 h-5" />
</button>
```

### 2. 터치 인터랙션
- **드래그 활성화 거리**: 15px (스크롤과 구분)
- **햅틱 피드백**: 지원 기기에서 진동 제공
- **터치 하이라이트**: `touch-manipulation` CSS 클래스 사용
- **탭 하이라이트 제거**: `WebkitTapHighlightColor: 'transparent'`

```tsx
// 드래그 센서 설정
useSensor(PointerSensor, {
  activationConstraint: {
    distance: 15,  // 15px 이상 드래그해야 활성화
  },
})
```

### 3. 입력 필드 최적화
- **font-size**: 최소 16px (iOS 자동 줌 방지)
- **높이**: 최소 44px-48px
- **border-radius**: 8px-12px (모바일 친화적)

```tsx
<Input
  className="text-base h-12 rounded-lg"
  style={{ fontSize: '16px' }}  // iOS 줌 방지
/>
```

### 4. Switch 컴포넌트
- **크기 확대**: `scale-125` (125% 크기)
- **탭 영역**: 충분한 여백 확보

```tsx
<div className="scale-125">
  <Switch checked={enabled} onCheckedChange={setEnabled} />
</div>
```

### 5. 탭 네비게이션
- **레이아웃**: 아이콘 중심, 간결한 텍스트
- **반응형**: 화면 폭에 따라 아이콘만 표시 가능
- **Sticky 헤더**: 스크롤 시에도 항상 표시

```tsx
<TabsTrigger className="flex flex-col items-center gap-1 py-3 min-h-[48px]">
  <Palette className="w-5 h-5" />
  <span className="text-xs">디자인</span>
</TabsTrigger>
```

### 6. 아코디언 최적화
- **전체 너비 탭 영역**: 터치하기 쉽게
- **충분한 패딩**: px-5 py-4 (20px 16px)
- **시각적 피드백**: hover:bg-gray-50

## 🔧 사용 방법

### MobileSortableList 사용

```tsx
import { MobileSortableList, MobileSortableItem } from '@/components/mobile_version/MobileSortableList'

function MyComponent() {
  const [items, setItems] = useState(['item-1', 'item-2', 'item-3'])

  return (
    <MobileSortableList
      items={items}
      onReorder={setItems}
      renderDragOverlay={(activeId) => (
        <div>Dragging: {activeId}</div>
      )}
    >
      {items.map((id) => (
        <MobileSortableItem key={id} id={id}>
          <div className="p-4">Item content</div>
        </MobileSortableItem>
      ))}
    </MobileSortableList>
  )
}
```

### MobileEditPanel 사용

```tsx
import MobileEditPanel from '@/components/mobile_version/MobileEditPanel'

function EditorPage() {
  return (
    <div className="h-screen">
      <MobileEditPanel
        invitationId="123"
        templateId="OUR"
        onOpenIntroSelector={() => {}}
      />
    </div>
  )
}
```

### MobileParentsEditPanel 사용

```tsx
import MobileParentsEditPanel from '@/components/mobile_version/MobileParentsEditPanel'

function ParentsEditorPage() {
  const [data, setData] = useState<ParentsInvitationData>(initialData)

  const updateData = (updates: Partial<ParentsInvitationData>) => {
    setData(prev => ({ ...prev, ...updates }))
  }

  const updateNestedData = (path: string, value: unknown) => {
    // 중첩 경로 업데이트 로직
  }

  return (
    <div className="h-screen">
      <MobileParentsEditPanel
        data={data}
        updateData={updateData}
        updateNestedData={updateNestedData}
        invitationId="123"
      />
    </div>
  )
}
```

## 📱 반응형 브레이크포인트

Tailwind CSS 기본 브레이크포인트 사용:

- **default**: < 640px (모바일 세로)
- **sm**: ≥ 640px (모바일 가로, 작은 태블릿)
- **md**: ≥ 768px (태블릿)
- **lg**: ≥ 1024px (데스크톱)

```tsx
// 예시: 모바일에서 48px, 데스크톱에서 40px
<div className="w-12 md:w-10">
```

## ✅ 접근성 (a11y)

### 키보드 접근성
- **드래그 앤 드롭**: 스페이스바로 선택, 화살표로 이동, 스페이스바로 놓기
- **ARIA 레이블**: 모든 인터랙티브 요소에 명확한 레이블

```tsx
<div
  role="button"
  aria-label="드래그하여 순서 변경. 스페이스바로 선택, 화살표로 이동, 스페이스바로 놓기"
  tabIndex={0}
>
```

### 포커스 관리
- **Focus Ring**: `focus:ring-2 focus:ring-blue-500`
- **Focus Visible**: 키보드 탐색 시에만 표시

### 색상 대비
- **텍스트**: 최소 4.5:1 (WCAG AA)
- **대형 텍스트**: 최소 3:1
- **아이콘**: 충분한 크기와 대비

## 🎨 성능 최적화

### 1. 리렌더링 방지
```tsx
// useMemo, useCallback 활용
const memoizedValue = useMemo(() => computeExpensiveValue(a, b), [a, b])
const memoizedCallback = useCallback(() => doSomething(a, b), [a, b])
```

### 2. 이미지 최적화
- Next.js Image 컴포넌트 사용
- Lazy loading 적용
- 적절한 크기 지정

### 3. 스크롤 성능
- `overflow-y-auto` 사용
- 가상 스크롤 고려 (긴 리스트의 경우)

## 🐛 알려진 제한사항

1. **iOS Safari**: 드래그 중 스크롤이 일시적으로 비활성화될 수 있음
2. **Android Chrome**: 햅틱 피드백이 모든 기기에서 지원되지 않음
3. **오래된 브라우저**: `touch-manipulation` CSS가 지원되지 않을 수 있음

## 🔄 기존 컴포넌트와의 차이점

| 기능 | 기존 버전 | 모바일 버전 |
|------|----------|------------|
| 드래그 핸들 너비 | 40px | 48px |
| 최소 터치 타겟 | 36px | 48px |
| Input font-size | 14px | 16px |
| Switch 크기 | 기본 | 125% |
| 탭 높이 | 기본 | 48px |
| border-radius | 8px | 12px |
| 햅틱 피드백 | ❌ | ✅ |

## 📝 테스트 체크리스트

모바일 최적화 컴포넌트를 사용할 때 다음 사항을 확인하세요:

- [ ] 모든 버튼과 링크의 터치 영역이 최소 44px인가?
- [ ] 입력 필드의 font-size가 16px 이상인가? (iOS 줌 방지)
- [ ] 드래그 앤 드롭이 스크롤과 명확히 구분되는가?
- [ ] Switch와 같은 작은 컨트롤이 터치하기 쉬운가?
- [ ] 키보드로 모든 기능에 접근 가능한가?
- [ ] 색상 대비가 충분한가? (4.5:1 이상)
- [ ] 실제 모바일 기기에서 테스트했는가?
  - [ ] iPhone (Safari)
  - [ ] Android (Chrome)
  - [ ] 태블릿

## 🛠️ 개발 가이드

### 새로운 모바일 컴포넌트 추가

1. **터치 타겟 크기 확인**
   ```tsx
   // 최소 44px-48px 확보
   <button className="min-h-[48px] min-w-[48px]">
   ```

2. **입력 필드 스타일**
   ```tsx
   <Input
     className="text-base h-12"
     style={{ fontSize: '16px' }}
   />
   ```

3. **터치 최적화 클래스**
   ```tsx
   <div className="touch-manipulation active:bg-gray-100">
   ```

4. **반응형 디자인**
   ```tsx
   <div className="w-12 sm:w-10 md:w-8">
   ```

## 📚 참고 자료

- [iOS Human Interface Guidelines - Touch Targets](https://developer.apple.com/design/human-interface-guidelines/inputs/touchscreen-gestures)
- [Material Design - Touch Targets](https://m3.material.io/foundations/interaction/gestures/touch-targets)
- [WCAG 2.1 - Target Size](https://www.w3.org/WAI/WCAG21/Understanding/target-size.html)
- [Tailwind CSS - Touch Action](https://tailwindcss.com/docs/touch-action)

## 📄 라이선스

이 컴포넌트는 프로젝트의 메인 라이선스를 따릅니다.
