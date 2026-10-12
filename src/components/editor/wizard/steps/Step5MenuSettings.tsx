'use client'

import { useEditorStore } from '@/store/editorStore'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { SAMPLE_DIRECTIONS } from '@/lib/sampleData'
import { SortableList, SortableItem } from '@/components/ui/sortable-list'
import SharedRsvpLinkField from '@/components/editor/SharedRsvpLinkField'
import { Lock } from 'lucide-react'

// 전화번호 포맷팅 함수
const formatPhone = (value: string) => {
  const numbers = value.replace(/[^\d]/g, '')
  if (numbers.length <= 3) return numbers
  if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`
  return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`
}

// 계좌번호 포맷팅 함수
const formatAccount = (value: string) => {
  return value.replace(/[^\d-]/g, '')
}

export default function Step5MenuSettings() {
  const { invitation, updateField, updateNestedField, toggleSectionVisibility } = useEditorStore()

  if (!invitation) return null

  const isMagazine = invitation.templateId === 'narrative-magazine'
  const isFilm = invitation.templateId === 'narrative-film'
  const isRecord = invitation.templateId === 'narrative-record'

  // RSVP 마감일 기본값 (결혼식 7일 전)
  const getDefaultRsvpDeadline = () => {
    if (invitation.wedding.date) {
      const weddingDate = new Date(invitation.wedding.date)
      weddingDate.setDate(weddingDate.getDate() - 7)
      return weddingDate.toISOString().split('T')[0]
    }
    return ''
  }

  // 전화번호 변경 핸들러
  const handlePhoneChange = (path: string, value: string) => {
    updateNestedField(path, formatPhone(value))
  }

  // 계좌번호 변경 핸들러
  const handleAccountChange = (path: string, value: string) => {
    updateNestedField(path, formatAccount(value))
  }

  // 샘플 오시는 길 적용
  const applySampleDirections = () => {
    updateNestedField('wedding.directions.car', SAMPLE_DIRECTIONS.car)
    updateNestedField('wedding.directions.publicTransport', SAMPLE_DIRECTIONS.publicTransport)
    updateNestedField('wedding.directions.train', SAMPLE_DIRECTIONS.train)
    updateNestedField('wedding.directions.expressBus', SAMPLE_DIRECTIONS.expressBus)
  }

  const isOurOrFamily = invitation.templateId === 'narrative-our' || invitation.templateId === 'narrative-family'

  // 매거진/필름 섹션 순서 관련 설정
  const MAGAZINE_DEFAULT_SECTION_ORDER = [
    'meetTheCouple', 'featureInterview', 'photoSpread', 'youtube',
    'theDetails', 'guidance', 'thankYou', 'contacts', 'guestbook', 'rsvp'
  ]
  const MAGAZINE_SECTION_LABELS: Record<string, string> = {
    meetTheCouple: '커플 소개',
    featureInterview: '인터뷰',
    photoSpread: '갤러리',
    youtube: '영상',
    theDetails: '예식 정보',
    guidance: '결혼식 안내',
    thankYou: '감사 인사',
    contacts: '마음 전하실 곳',
    guestbook: '방명록',
    rsvp: 'RSVP',
  }
  const MAGAZINE_DEFAULT_BG: Record<string, 'background' | 'sectionBg'> = {
    meetTheCouple: 'sectionBg',
    featureInterview: 'sectionBg',
    photoSpread: 'background',
    youtube: 'sectionBg',
    theDetails: 'background',
    guidance: 'sectionBg',
    thankYou: 'background',
    contacts: 'sectionBg',
    guestbook: 'background',
    rsvp: 'sectionBg',
  }
  const MAGAZINE_TOGGLEABLE: Record<string, { read: () => boolean; write: (checked: boolean) => void }> = {
    meetTheCouple: {
      read: () => (invitation.sectionVisibility as any)?.meetTheCouple !== false,
      write: (checked) => updateNestedField('sectionVisibility.meetTheCouple', checked),
    },
    featureInterview: {
      read: () => (invitation.sectionVisibility as any)?.interview !== false,
      write: (checked) => updateNestedField('sectionVisibility.interview', checked),
    },
    photoSpread: {
      read: () => (invitation.sectionVisibility as any)?.gallery !== false,
      write: (checked) => updateNestedField('sectionVisibility.gallery', checked),
    },
    theDetails: {
      read: () => (invitation.sectionVisibility as any)?.info !== false,
      write: (checked) => updateNestedField('sectionVisibility.info', checked),
    },
    thankYou: {
      read: () => (invitation.sectionVisibility as any)?.thankyou !== false,
      write: (checked) => updateNestedField('sectionVisibility.thankyou', checked),
    },
    youtube: {
      read: () => (invitation as any).youtube?.enabled || false,
      write: (checked) => updateNestedField('youtube.enabled', checked),
    },
    guidance: {
      read: () => invitation.sectionVisibility.guidance !== false,
      write: () => toggleSectionVisibility('guidance'),
    },
    contacts: {
      read: () => invitation.sectionVisibility.bankAccounts !== false,
      write: () => toggleSectionVisibility('bankAccounts'),
    },
    guestbook: {
      read: () => invitation.sectionVisibility.guestbook !== false,
      write: () => toggleSectionVisibility('guestbook'),
    },
    rsvp: {
      read: () => invitation.rsvpEnabled,
      write: (checked) => updateField('rsvpEnabled', checked),
    },
  }

  const FILM_DEFAULT_SECTION_ORDER = [
    'chapterTwo', 'filmScenes', 'chapterThree', 'video',
    'premiere', 'guidance', 'credits', 'guestbook', 'rsvp'
  ]
  const FILM_SECTION_LABELS: Record<string, string> = {
    chapterTwo: '커플 소개',
    filmScenes: '러브스토리',
    chapterThree: '갤러리',
    video: '영상',
    premiere: '예식 정보',
    guidance: '결혼식 안내',
    credits: '감사 인사',
    guestbook: '방명록',
    rsvp: 'RSVP',
  }
  const FILM_DEFAULT_BG: Record<string, 'background' | 'sectionBg'> = {
    chapterTwo: 'sectionBg',
    filmScenes: 'sectionBg',
    chapterThree: 'background',
    video: 'background',
    premiere: 'sectionBg',
    guidance: 'background',
    credits: 'sectionBg',
    guestbook: 'background',
    rsvp: 'sectionBg',
  }
  const FILM_TOGGLEABLE: Record<string, { read: () => boolean; write: (checked: boolean) => void }> = {
    video: {
      read: () => (invitation as any).youtube?.enabled || false,
      write: (checked) => updateNestedField('youtube.enabled', checked),
    },
    guidance: {
      read: () => invitation.sectionVisibility.guidance !== false,
      write: () => toggleSectionVisibility('guidance'),
    },
    guestbook: {
      read: () => invitation.sectionVisibility.guestbook !== false,
      write: () => toggleSectionVisibility('guestbook'),
    },
    rsvp: {
      read: () => invitation.rsvpEnabled,
      write: (checked) => updateField('rsvpEnabled', checked),
    },
  }

  const RECORD_DEFAULT_SECTION_ORDER = [
    'trackCouple', 'trackOurJourney', 'trackGallery', 'video',
    'trackWeddingDay', 'guidance', 'bonusTrack', 'gift', 'fanMail', 'rsvp'
  ]
  const RECORD_SECTION_LABELS: Record<string, string> = {
    trackCouple: '커플 소개',
    trackOurJourney: '러브스토리',
    trackGallery: '갤러리',
    video: '영상',
    trackWeddingDay: '예식 정보',
    guidance: '결혼식 안내',
    bonusTrack: '감사 인사',
    gift: '마음 전하실 곳',
    fanMail: '방명록',
    rsvp: 'RSVP',
  }
  const RECORD_DEFAULT_BG: Record<string, 'background' | 'sectionBg'> = {
    trackCouple: 'background',
    trackOurJourney: 'background',
    trackGallery: 'sectionBg',
    video: 'background',
    trackWeddingDay: 'background',
    guidance: 'background',
    bonusTrack: 'background',
    gift: 'background',
    fanMail: 'background',
    rsvp: 'background',
  }
  const RECORD_TOGGLEABLE: Record<string, { read: () => boolean; write: (checked: boolean) => void }> = {
    video: {
      read: () => (invitation as any).youtube?.enabled || false,
      write: (checked) => updateNestedField('youtube.enabled', checked),
    },
    guidance: {
      read: () => invitation.sectionVisibility.guidance !== false,
      write: () => toggleSectionVisibility('guidance'),
    },
    gift: {
      read: () => invitation.sectionVisibility.bankAccounts !== false,
      write: () => toggleSectionVisibility('bankAccounts'),
    },
    fanMail: {
      read: () => invitation.sectionVisibility.guestbook !== false,
      write: () => toggleSectionVisibility('guestbook'),
    },
    rsvp: {
      read: () => invitation.rsvpEnabled,
      write: (checked) => updateField('rsvpEnabled', checked),
    },
  }

  // 템플릿에 따른 섹션 설정 선택
  const sectionConfig = isMagazine
    ? { order: MAGAZINE_DEFAULT_SECTION_ORDER, labels: MAGAZINE_SECTION_LABELS, bg: MAGAZINE_DEFAULT_BG, toggles: MAGAZINE_TOGGLEABLE, showBgToggle: true }
    : isFilm
    ? { order: FILM_DEFAULT_SECTION_ORDER, labels: FILM_SECTION_LABELS, bg: FILM_DEFAULT_BG, toggles: FILM_TOGGLEABLE, showBgToggle: true }
    : isRecord
    ? { order: RECORD_DEFAULT_SECTION_ORDER, labels: RECORD_SECTION_LABELS, bg: RECORD_DEFAULT_BG, toggles: RECORD_TOGGLEABLE, showBgToggle: false }
    : null

  const magazineSectionOrder = invitation.magazineSectionOrder || (sectionConfig?.order ?? MAGAZINE_DEFAULT_SECTION_ORDER)
  const magazineSectionBgMap = invitation.magazineSectionBgMap || (sectionConfig?.bg ?? MAGAZINE_DEFAULT_BG)
  const activeToggles = sectionConfig?.toggles ?? MAGAZINE_TOGGLEABLE
  const activeLabels = sectionConfig?.labels ?? MAGAZINE_SECTION_LABELS
  const activeDefaultBg = sectionConfig?.bg ?? MAGAZINE_DEFAULT_BG

  const handleResetSections = () => {
    updateField('magazineSectionOrder', undefined as any)
    updateField('magazineSectionBgMap', undefined as any)
  }

  const handleToggleBg = (sectionId: string) => {
    const currentBg = magazineSectionBgMap[sectionId] || activeDefaultBg[sectionId] || 'sectionBg'
    const newBg = currentBg === 'background' ? 'sectionBg' : 'background'
    updateField('magazineSectionBgMap', { ...magazineSectionBgMap, [sectionId]: newBg })
  }

  // 박스가 있는 섹션 (오시는길=theDetails, 예식정보=guidance, 계좌=contacts, RSVP, 방명록=guestbook)
  const BOX_SECTIONS = new Set(['theDetails', 'guidance', 'contacts', 'rsvp', 'guestbook'])
  const boxContrastMap: Record<string, boolean> = (invitation as any).magazineBoxContrastMap || {}
  const handleToggleBoxContrast = (sectionId: string) => {
    const current = boxContrastMap[sectionId] !== false // 기본 true(반대색)
    updateField('magazineBoxContrastMap' as any, { ...boxContrastMap, [sectionId]: !current })
  }

  const navStyleOptions: { value: 'hamburger' | 'bottom-nav' | 'bottom-mini'; label: string; desc: string; icon: React.ReactNode }[] = [
    {
      value: 'hamburger',
      label: '햄버거 버튼',
      desc: '우측 하단 원형 메뉴',
      icon: (
        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
          <svg className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <line x1="4" y1="6" x2="20" y2="6" strokeLinecap="round" />
            <line x1="4" y1="12" x2="20" y2="12" strokeLinecap="round" />
            <line x1="4" y1="18" x2="14" y2="18" strokeLinecap="round" />
          </svg>
        </div>
      ),
    },
    {
      value: 'bottom-nav' as const,
      label: '하단 네비바',
      desc: '아이콘+텍스트 고정 바',
      icon: (
        <div className="w-full h-10 rounded-lg bg-gray-200 flex items-center justify-center gap-3 px-2">
          {['축하', '참석', '길'].map((t) => (
            <div key={t} className="flex flex-col items-center">
              <div className="w-3 h-3 rounded-full bg-gray-400" />
              <span className="text-[8px] text-gray-500 mt-0.5">{t}</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      value: 'bottom-mini',
      label: '미니 네비바',
      desc: '아이콘만, 반투명',
      icon: (
        <div className="w-full h-8 rounded-full bg-gray-200/70 backdrop-blur flex items-center justify-center gap-4 px-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-3.5 h-3.5 rounded-full bg-gray-400" />
          ))}
        </div>
      ),
    },
  ]

  return (
    <div className="p-6 space-y-8">
      {/* 안내 */}
      <p className="text-sm" style={{ color: 'var(--ed-text-muted)' }}>
        오시는 길, 연락처, RSVP, 마음 전하실 곳 등을 설정해주세요.
      </p>

      {/* 메뉴 버튼 스타일 */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900">
          메뉴 버튼 스타일
        </h3>
        {isOurOrFamily && (
          <p className="text-xs text-gray-500">인트로 페이지에서는 항상 하단 네비바가 표시됩니다. 메인 페이지의 스타일을 선택해주세요.</p>
        )}
        <div className={`grid gap-3 ${navStyleOptions.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
          {navStyleOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => updateField('navStyle', opt.value)}
              className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all ${
                (invitation.navStyle || 'hamburger') === opt.value
                  ? 'bg-stone-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
              style={(invitation.navStyle || 'hamburger') === opt.value ? { borderColor: 'var(--ed-accent)' } : undefined}
            >
              <div className="w-full flex justify-center mb-2">{opt.icon}</div>
              <p className={`text-xs font-medium ${(invitation.navStyle || 'hamburger') === opt.value ? '' : 'text-gray-700'}`} style={(invitation.navStyle || 'hamburger') === opt.value ? { color: 'var(--ed-accent)' } : undefined}>{opt.label}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">{opt.desc}</p>
            </button>
          ))}
        </div>
      </section>

      {/* 섹션 순서 변경 (매거진/필름) */}
      {sectionConfig && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900">
              섹션 순서 변경
            </h3>
            <button
              onClick={handleResetSections}
              className="text-xs text-stone-500 hover:text-stone-700 transition-colors"
            >
              초기화
            </button>
          </div>
          <p className="text-sm text-gray-500">
            드래그하여 섹션 순서를 변경할 수 있습니다. 인사말은 항상 최상단에 고정됩니다.
          </p>
          {sectionConfig?.showBgToggle && (
            <div className="flex items-center gap-3 text-[10px] text-gray-400 px-1">
              <span className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 rounded-full border border-gray-300 bg-white" /> 흰색 배경
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 rounded-full border border-gray-300 bg-gray-100" /> 틴티드 배경
              </span>
            </div>
          )}
          <div className="space-y-1">
            {/* 고정: 인사말 (순서는 고정, Film은 배경 틴티드/기본 선택 가능) */}
            <div className={`flex items-center gap-3 px-3 py-2.5 bg-gray-100 rounded-lg ${(isFilm || isMagazine) && sectionConfig?.showBgToggle ? '' : 'opacity-60'}`}>
              <Lock className="w-4 h-4 text-gray-400 flex-shrink-0" strokeWidth={1.75} />
              <span className="text-sm text-gray-500 flex-1">인사말 (고정)</span>
              {(isFilm || isMagazine) && sectionConfig?.showBgToggle && (() => {
                const gBg = magazineSectionBgMap['greeting'] || 'background'
                return (
                  <button
                    onClick={(e) => { e.stopPropagation(); updateField('magazineSectionBgMap', { ...magazineSectionBgMap, greeting: gBg === 'sectionBg' ? 'background' : 'sectionBg' }) }}
                    className="w-5 h-5 rounded-full border border-gray-300 flex-shrink-0 transition-colors"
                    style={{ backgroundColor: gBg === 'sectionBg' ? '#f0f0f0' : '#ffffff' }}
                    title={gBg === 'sectionBg' ? '틴티드 배경' : '흰색 배경'}
                  />
                )
              })()}
            </div>
            {/* 드래그 가능 섹션 */}
            <SortableList
              items={magazineSectionOrder}
              onReorder={(newOrder) => updateField('magazineSectionOrder', newOrder)}
              renderDragOverlay={(activeId) => (
                <div className="flex items-center gap-3 px-3 py-2.5">
                  <span className="text-sm font-medium text-gray-800">
                    {activeLabels[activeId] || activeId}
                  </span>
                </div>
              )}
            >
              {magazineSectionOrder.map((sectionId) => {
                const toggle = activeToggles[sectionId]
                const isOn = toggle ? toggle.read() : true
                const currentBg = magazineSectionBgMap[sectionId] || activeDefaultBg[sectionId] || 'sectionBg'
                return (
                  <SortableItem key={sectionId} id={sectionId}>
                    <div className={`flex items-center gap-2 px-3 py-2.5 bg-white border border-gray-200 rounded-lg mb-1 transition-opacity ${!isOn ? 'opacity-50' : ''}`}>
                      {/* 섹션명 */}
                      <span className="text-sm font-medium text-gray-800 flex-1">
                        {activeLabels[sectionId] || sectionId}
                      </span>
                      {/* ON/OFF 스위치 (해당 섹션만) */}
                      {toggle && (
                        <Switch
                          checked={isOn}
                          onCheckedChange={(checked) => toggle.write(checked)}
                          className="scale-75 origin-right"
                        />
                      )}
                      {/* 박스 반대색 토글 (박스 있는 섹션만) */}
                      {isMagazine && BOX_SECTIONS.has(sectionId) && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleToggleBoxContrast(sectionId) }}
                          className={`text-[10px] px-1.5 py-1 rounded border flex-shrink-0 transition-colors ${boxContrastMap[sectionId] !== false ? 'text-white' : 'border-gray-300 bg-white text-gray-500'}`}
                          style={boxContrastMap[sectionId] !== false ? { background: 'var(--ed-accent)', borderColor: 'var(--ed-accent)' } : undefined}
                          title="박스 배경: 섹션과 반대색 / 동일 톤"
                        >
                          {boxContrastMap[sectionId] !== false ? '박스 반대' : '박스 동일'}
                        </button>
                      )}
                      {/* 배경색 토글 */}
                      {sectionConfig?.showBgToggle && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleToggleBg(sectionId) }}
                          className="w-5 h-5 rounded-full border border-gray-300 flex-shrink-0 transition-colors"
                          style={{ backgroundColor: currentBg === 'sectionBg' ? '#f0f0f0' : '#ffffff' }}
                          title={currentBg === 'sectionBg' ? '틴티드 배경' : '흰색 배경'}
                        />
                      )}
                    </div>
                  </SortableItem>
                )
              })}
            </SortableList>
            {/* Film: 마음 전하실 곳은 RSVP 하단 고정 */}
            {isFilm && (
              <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg mt-1">
                <Lock className="w-4 h-4 text-gray-400 flex-shrink-0" strokeWidth={1.75} />
                <span className="text-sm text-gray-500 flex-1">마음 전하실 곳 (RSVP 하단 고정)</span>
                <Switch
                  checked={invitation.sectionVisibility.bankAccounts !== false}
                  onCheckedChange={() => toggleSectionVisibility('bankAccounts')}
                  className="scale-75 origin-right"
                />
              </div>
            )}
          </div>
        </section>
      )}

      {/* 매거진 섹션 제목 편집 */}
      {isMagazine && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900">
              섹션 제목 편집
            </h3>
            <button
              onClick={() => updateNestedField('magazineSectionTitles', undefined)}
              className="text-xs text-stone-500 hover:text-stone-700 transition-colors"
            >
              초기화
            </button>
          </div>
          <p className="text-xs text-gray-500">비워두면 해당 제목이 숨겨집니다.</p>

          <div className="space-y-4">
            {/* Editor's Note */}
            <div className="p-3 bg-gray-50 rounded-lg space-y-2">
              <p className="text-sm font-medium text-gray-700">Editor&apos;s Note</p>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">제목</Label>
                <Input
                  value={(invitation as any).magazineSectionTitles?.editorsNote?.main ?? "EDITOR'S NOTE"}
                  onChange={(e) => updateNestedField('magazineSectionTitles.editorsNote.main', e.target.value)}
                  placeholder="비우면 숨김"
                />
              </div>
            </div>

            {/* 커플 소개 */}
            <div className="p-3 bg-gray-50 rounded-lg space-y-2">
              <p className="text-sm font-medium text-gray-700">커플 소개</p>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">서브</Label>
                <Input
                  value={(invitation as any).magazineSectionTitles?.meetTheCouple?.sub ?? 'INTERVIEWEE'}
                  onChange={(e) => updateNestedField('magazineSectionTitles.meetTheCouple.sub', e.target.value)}
                  placeholder="비우면 숨김"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">메인</Label>
                <Input
                  value={(invitation as any).magazineSectionTitles?.meetTheCouple?.main ?? 'MEET THE COUPLE'}
                  onChange={(e) => updateNestedField('magazineSectionTitles.meetTheCouple.main', e.target.value)}
                  placeholder="비우면 숨김"
                />
              </div>
            </div>

            {/* 갤러리 */}
            <div className="p-3 bg-gray-50 rounded-lg space-y-2">
              <p className="text-sm font-medium text-gray-700">갤러리</p>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">서브</Label>
                <Input
                  value={(invitation as any).magazineSectionTitles?.photoSpread?.sub ?? 'GALLERY'}
                  onChange={(e) => updateNestedField('magazineSectionTitles.photoSpread.sub', e.target.value)}
                  placeholder="비우면 숨김"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">메인</Label>
                <Input
                  value={(invitation as any).magazineSectionTitles?.photoSpread?.main ?? 'PHOTO SPREAD'}
                  onChange={(e) => updateNestedField('magazineSectionTitles.photoSpread.main', e.target.value)}
                  placeholder="비우면 숨김"
                />
              </div>
            </div>

            {/* 예식 정보 */}
            <div className="p-3 bg-gray-50 rounded-lg space-y-2">
              <p className="text-sm font-medium text-gray-700">예식 정보</p>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">서브</Label>
                <Input
                  value={(invitation as any).magazineSectionTitles?.theDetails?.sub ?? 'DETAILS'}
                  onChange={(e) => updateNestedField('magazineSectionTitles.theDetails.sub', e.target.value)}
                  placeholder="비우면 숨김"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">메인</Label>
                <Input
                  value={(invitation as any).magazineSectionTitles?.theDetails?.main ?? 'THE WEDDING'}
                  onChange={(e) => updateNestedField('magazineSectionTitles.theDetails.main', e.target.value)}
                  placeholder="비우면 숨김"
                />
              </div>
            </div>

            {/* 안내 */}
            {invitation.sectionVisibility.guidance !== false && (
            <div className="p-3 bg-gray-50 rounded-lg space-y-2">
              <p className="text-sm font-medium text-gray-700">안내</p>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">서브</Label>
                <Input
                  value={(invitation as any).magazineSectionTitles?.guidance?.sub ?? 'FOR YOUR HAPPY TIME'}
                  onChange={(e) => updateNestedField('magazineSectionTitles.guidance.sub', e.target.value)}
                  placeholder="비우면 숨김"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">메인</Label>
                <Input
                  value={(invitation as any).magazineSectionTitles?.guidance?.main ?? 'INFORMATION'}
                  onChange={(e) => updateNestedField('magazineSectionTitles.guidance.main', e.target.value)}
                  placeholder="비우면 숨김"
                />
              </div>
            </div>
            )}
          </div>
        </section>
      )}

      {/* 오시는 길 안내 */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900">
          오시는 길
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm" style={{ color: 'var(--ed-text-muted)' }}>
              교통 안내 정보를 입력해주세요.
            </p>
            {!invitation.wedding.directions?.car && !invitation.wedding.directions?.publicTransport && !invitation.wedding.directions?.train && !invitation.wedding.directions?.expressBus && (
              <button onClick={applySampleDirections} className="text-xs text-stone-500 hover:text-stone-700">
                샘플 적용
              </button>
            )}
          </div>

          <div className="p-4 bg-gray-50 rounded-lg space-y-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">자가용 / 주차 <span className="text-red-500">*</span></Label>
              <Textarea
                value={invitation.wedding.directions?.car}
                onChange={(e) => updateNestedField('wedding.directions.car', e.target.value)}
                placeholder={SAMPLE_DIRECTIONS.car}
                rows={3}
                className="resize-none"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">대중교통 (버스/지하철)</Label>
              <Textarea
                value={invitation.wedding.directions?.publicTransport}
                onChange={(e) => updateNestedField('wedding.directions.publicTransport', e.target.value)}
                placeholder={SAMPLE_DIRECTIONS.publicTransport}
                rows={3}
                className="resize-none"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">기차 (KTX/SRT)</Label>
              <Textarea
                value={invitation.wedding.directions?.train || ''}
                onChange={(e) => updateNestedField('wedding.directions.train', e.target.value)}
                placeholder="예: KTX 서울역에서 하차 후 3번 출구에서 셔틀버스 이용 (15분 소요)"
                rows={2}
                className="resize-none"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">고속버스</Label>
              <Textarea
                value={invitation.wedding.directions?.expressBus || ''}
                onChange={(e) => updateNestedField('wedding.directions.expressBus', e.target.value)}
                placeholder="예: 고속버스터미널에서 하차 후 택시로 10분 소요"
                rows={2}
                className="resize-none"
              />
            </div>
            {/* 추가 안내사항 */}
            <div className="border-t pt-4 mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">추가 안내사항</Label>
                <Switch
                  checked={invitation.wedding.directions?.extraInfoEnabled || false}
                  onCheckedChange={(checked) => updateNestedField('wedding.directions.extraInfoEnabled', checked)}
                />
              </div>
              {invitation.wedding.directions?.extraInfoEnabled && (
                <div className="space-y-2">
                  <Input
                    value={invitation.wedding.directions?.extraInfoTitle || ''}
                    onChange={(e) => updateNestedField('wedding.directions.extraInfoTitle', e.target.value)}
                    placeholder="제목 (기본: 추가 안내사항)"
                  />
                  <Textarea
                    value={invitation.wedding.directions?.extraInfoText || ''}
                    onChange={(e) => updateNestedField('wedding.directions.extraInfoText', e.target.value)}
                    placeholder="예: 주차권은 안내데스크에서 수령 / 혼잡 시간대는 대중교통 추천 / 예식장 입구는 ○○문입니다"
                    rows={3}
                    className="resize-none"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 연락처 */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900">
            축하전하기
          </h3>
          <Switch
            checked={invitation.sectionVisibility.contacts}
            onCheckedChange={() => toggleSectionVisibility('contacts')}
          />
        </div>
        <p className="text-sm" style={{ color: 'var(--ed-text-muted)' }}>
          하객분들이 축하 전화를 드릴 수 있는 연락처를 입력해주세요. 입력된 연락처만 표시됩니다.
        </p>
        <p className="text-xs text-gray-500">부모님 성함은 이전 단계(스토리)에서 입력한 이름이 자동 연동됩니다.</p>

        <div className="space-y-4">
          {/* 신랑측 연락처 */}
          <div className="p-4 rounded-lg space-y-4" style={{ background: 'var(--ed-surface-2)' }}>
            <p className="font-semibold" style={{ color: 'var(--ed-text)' }}>신랑측</p>
            <div className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={(invitation.groom as any).phoneEnabled !== false}
                    onCheckedChange={(checked) => updateNestedField('groom.phoneEnabled', checked)}
                  />
                  <span className="text-sm font-medium text-gray-700">신랑{invitation.groom.name ? ` (${invitation.groom.name})` : ''}</span>
                </div>
                {(invitation.groom as any).phoneEnabled !== false && (
                  <Input
                    value={invitation.groom.phone}
                    onChange={(e) => handlePhoneChange('groom.phone', e.target.value)}
                    placeholder="010-0000-0000"
                  />
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={(invitation.groom.father as any).phoneEnabled !== false}
                    onCheckedChange={(checked) => updateNestedField('groom.father.phoneEnabled', checked)}
                  />
                  <span className="text-sm font-medium text-gray-700">아버지{invitation.groom.father.name ? ` (${invitation.groom.father.name})` : ''}</span>
                </div>
                {(invitation.groom.father as any).phoneEnabled !== false && (
                  <Input
                    value={invitation.groom.father.phone}
                    onChange={(e) => handlePhoneChange('groom.father.phone', e.target.value)}
                    placeholder="010-0000-0000"
                  />
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={(invitation.groom.mother as any).phoneEnabled !== false}
                    onCheckedChange={(checked) => updateNestedField('groom.mother.phoneEnabled', checked)}
                  />
                  <span className="text-sm font-medium text-gray-700">어머니{invitation.groom.mother.name ? ` (${invitation.groom.mother.name})` : ''}</span>
                </div>
                {(invitation.groom.mother as any).phoneEnabled !== false && (
                  <Input
                    value={invitation.groom.mother.phone}
                    onChange={(e) => handlePhoneChange('groom.mother.phone', e.target.value)}
                    placeholder="010-0000-0000"
                  />
                )}
              </div>
            </div>
          </div>

          {/* 신부측 연락처 */}
          <div className="p-4 rounded-lg space-y-4" style={{ background: 'var(--ed-surface-2)' }}>
            <p className="font-semibold" style={{ color: 'var(--ed-text)' }}>신부측</p>
            <div className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={(invitation.bride as any).phoneEnabled !== false}
                    onCheckedChange={(checked) => updateNestedField('bride.phoneEnabled', checked)}
                  />
                  <span className="text-sm font-medium text-gray-700">신부{invitation.bride.name ? ` (${invitation.bride.name})` : ''}</span>
                </div>
                {(invitation.bride as any).phoneEnabled !== false && (
                  <Input
                    value={invitation.bride.phone}
                    onChange={(e) => handlePhoneChange('bride.phone', e.target.value)}
                    placeholder="010-0000-0000"
                  />
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={(invitation.bride.father as any).phoneEnabled !== false}
                    onCheckedChange={(checked) => updateNestedField('bride.father.phoneEnabled', checked)}
                  />
                  <span className="text-sm font-medium text-gray-700">아버지{invitation.bride.father.name ? ` (${invitation.bride.father.name})` : ''}</span>
                </div>
                {(invitation.bride.father as any).phoneEnabled !== false && (
                  <Input
                    value={invitation.bride.father.phone}
                    onChange={(e) => handlePhoneChange('bride.father.phone', e.target.value)}
                    placeholder="010-0000-0000"
                  />
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={(invitation.bride.mother as any).phoneEnabled !== false}
                    onCheckedChange={(checked) => updateNestedField('bride.mother.phoneEnabled', checked)}
                  />
                  <span className="text-sm font-medium text-gray-700">어머니{invitation.bride.mother.name ? ` (${invitation.bride.mother.name})` : ''}</span>
                </div>
                {(invitation.bride.mother as any).phoneEnabled !== false && (
                  <Input
                    value={invitation.bride.mother.phone}
                    onChange={(e) => handlePhoneChange('bride.mother.phone', e.target.value)}
                    placeholder="010-0000-0000"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* RSVP 설정 */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900">
            RSVP (참석 여부)
          </h3>
          <Switch
            checked={invitation.rsvpEnabled}
            onCheckedChange={(checked) => updateField('rsvpEnabled', checked)}
          />
        </div>

        {invitation.rsvpEnabled && (isMagazine || isFilm) && (
          <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--ed-surface-2)', border: '1px solid var(--ed-border)' }}>
            <div>
              <p className="text-sm font-medium text-gray-800">청첩장 본문에 표시</p>
              <p className="text-xs text-gray-500">{(invitation as any).magazineLayout?.rsvpInMain !== false ? 'ON: 스크롤 본문에 노출' : 'OFF: 우측 상단 ☰ 메뉴에서만 접근'}</p>
            </div>
            <Switch
              checked={(invitation as any).magazineLayout?.rsvpInMain !== false}
              onCheckedChange={(checked) => updateNestedField('magazineLayout.rsvpInMain', checked)}
            />
          </div>
        )}

        {invitation.rsvpEnabled && isRecord && (
          <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--ed-surface-2)', border: '1px solid var(--ed-border)' }}>
            <div>
              <p className="text-sm font-medium text-gray-800">청첩장 본문에 표시</p>
              <p className="text-xs text-gray-500">{invitation.sectionVisibility.rsvp !== false ? 'ON: 본문에 노출' : 'OFF: 본문에서 숨김'}</p>
            </div>
            <Switch
              checked={invitation.sectionVisibility.rsvp !== false}
              onCheckedChange={() => toggleSectionVisibility('rsvp')}
            />
          </div>
        )}

        {/* 별도 RSVP 링크 — 본문 RSVP(rsvpEnabled) 유무와 독립적으로 항상 표시 */}
        <div>
          <div className="flex items-center gap-3">
            <Switch
              checked={invitation.sharedRsvpEnabled ?? false}
              onCheckedChange={(checked) => updateField('sharedRsvpEnabled', checked)}
            />
            <span className="text-sm text-gray-700">별도 RSVP 링크 (RSVP 폼만 공유)</span>
          </div>
          <SharedRsvpLinkField
            enabled={invitation.sharedRsvpEnabled ?? false}
            shareTitle={invitation.sharedRsvpShareTitle}
            shareDesc={invitation.sharedRsvpShareDesc}
            shareImage={invitation.sharedRsvpShareImage}
            pagePhoto={invitation.sharedRsvpPhoto}
            onShareChange={(p) => {
              if ('shareTitle' in p) updateField('sharedRsvpShareTitle', p.shareTitle ?? '')
              else if ('shareDesc' in p) updateField('sharedRsvpShareDesc', p.shareDesc ?? '')
              else if ('shareImage' in p) updateField('sharedRsvpShareImage', p.shareImage ?? '')
              else if ('pagePhoto' in p) updateField('sharedRsvpPhoto', p.pagePhoto ?? '')
            }}
          />
        </div>

        {invitation.rsvpEnabled && (
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">마감일</Label>
              <Input
                type="date"
                value={invitation.rsvpDeadline || getDefaultRsvpDeadline()}
                onChange={(e) => updateField('rsvpDeadline', e.target.value)}
              />
              <p className="text-xs text-gray-500">마감일이 지나면 참석 여부 응답이 불가합니다.</p>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={invitation.rsvpAllowGuestCount}
                onCheckedChange={(checked) => updateField('rsvpAllowGuestCount', checked)}
              />
              <span className="text-sm text-gray-700">동반 인원 입력 허용</span>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={invitation.rsvpMealOption ?? false}
                onCheckedChange={(checked) => updateField('rsvpMealOption', checked)}
              />
              <span className="text-sm text-gray-700">식사 여부 입력 허용</span>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={invitation.rsvpShuttleOption ?? false}
                onCheckedChange={(checked) => updateField('rsvpShuttleOption', checked)}
              />
              <span className="text-sm text-gray-700">대절버스 이용 여부 입력 허용</span>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={invitation.rsvpAfterPartyOption ?? false}
                onCheckedChange={(checked) => updateField('rsvpAfterPartyOption', checked)}
              />
              <span className="text-sm text-gray-700">애프터파티 참석 여부 입력 허용</span>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={invitation.rsvpPhoneOption ?? false}
                onCheckedChange={(checked) => updateField('rsvpPhoneOption', checked)}
              />
              <span className="text-sm text-gray-700">연락처 뒷자리 4자리 입력</span>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={invitation.rsvpSideDetail ?? false}
                onCheckedChange={(checked) => updateField('rsvpSideDetail', checked)}
              />
              <span className="text-sm text-gray-700">부모님 하객 구분 (아버지/어머니)</span>
            </div>

            {invitation.rsvpSideDetail && (
              <div className="ml-4 p-3 bg-white rounded-lg border space-y-2">
                <p className="text-xs text-gray-500 mb-2">표시할 구분 항목을 선택하세요</p>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={invitation.rsvpSideDetailOptions?.groomSelf ?? true}
                    onChange={(e) => updateField('rsvpSideDetailOptions', {
                      ...invitation.rsvpSideDetailOptions,
                      groomSelf: e.target.checked,
                    })}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">신랑</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={invitation.rsvpSideDetailOptions?.groomFather ?? true}
                    onChange={(e) => updateField('rsvpSideDetailOptions', {
                      ...invitation.rsvpSideDetailOptions,
                      groomFather: e.target.checked,
                    })}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">신랑 아버지</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={invitation.rsvpSideDetailOptions?.groomMother ?? true}
                    onChange={(e) => updateField('rsvpSideDetailOptions', {
                      ...invitation.rsvpSideDetailOptions,
                      groomMother: e.target.checked,
                    })}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">신랑 어머니</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={invitation.rsvpSideDetailOptions?.brideSelf ?? true}
                    onChange={(e) => updateField('rsvpSideDetailOptions', {
                      ...invitation.rsvpSideDetailOptions,
                      brideSelf: e.target.checked,
                    })}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">신부</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={invitation.rsvpSideDetailOptions?.brideFather ?? true}
                    onChange={(e) => updateField('rsvpSideDetailOptions', {
                      ...invitation.rsvpSideDetailOptions,
                      brideFather: e.target.checked,
                    })}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">신부 아버지</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={invitation.rsvpSideDetailOptions?.brideMother ?? true}
                    onChange={(e) => updateField('rsvpSideDetailOptions', {
                      ...invitation.rsvpSideDetailOptions,
                      brideMother: e.target.checked,
                    })}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">신부 어머니</span>
                </label>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">축하 메시지 placeholder</Label>
              <Input
                value={invitation.rsvpMessagePlaceholder ?? ''}
                onChange={(e) => updateField('rsvpMessagePlaceholder', e.target.value)}
                placeholder="신랑 신부에게 전할 축하 메시지를 남겨주세요"
              />
              <p className="text-xs text-gray-500">축하 메시지 입력란에 표시되는 안내 문구입니다. 비워두면 기본 문구가 표시됩니다.</p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">안내 문구</Label>
              <Textarea
                value={invitation.rsvpNotice ?? ''}
                onChange={(e) => updateField('rsvpNotice', e.target.value)}
                placeholder="예) 소규모로 진행되는 예식입니다.&#10;참석 여부를 미리 알려주시면 감사하겠습니다."
                rows={2}
                className="resize-none"
              />
              <p className="text-xs text-gray-500">RSVP 폼 상단에 표시됩니다. 비워두면 표시되지 않습니다.</p>
            </div>
          </div>
        )}
      </section>

      {/* 마음 전하실 곳 */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900">
            마음 전하실 곳
          </h3>
          <Switch
            checked={invitation.sectionVisibility.bankAccounts}
            onCheckedChange={() => toggleSectionVisibility('bankAccounts')}
          />
        </div>

        {invitation.sectionVisibility.bankAccounts && (isMagazine || isFilm) && (
          <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--ed-surface-2)', border: '1px solid var(--ed-border)' }}>
            <div>
              <p className="text-sm font-medium text-gray-800">청첩장 본문에 표시</p>
              <p className="text-xs text-gray-500">{(invitation as any).magazineLayout?.bankAccountsInMain !== false ? 'ON: 스크롤 본문에 노출' : 'OFF: 우측 상단 ☰ 메뉴에서만 접근'}</p>
            </div>
            <Switch
              checked={(invitation as any).magazineLayout?.bankAccountsInMain !== false}
              onCheckedChange={(checked) => updateNestedField('magazineLayout.bankAccountsInMain', checked)}
            />
          </div>
        )}

        {invitation.sectionVisibility.bankAccounts && isRecord && (
          <div className="space-y-3">
            <p className="text-sm" style={{ color: 'var(--ed-text-muted)' }}>ON/OFF로 청첩장 본문에서 마음 전하실 곳 섹션을 표시하거나 숨길 수 있습니다.</p>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">안내 문구</Label>
              <Textarea
                value={invitation.giftNotice ?? ''}
                onChange={(e) => updateField('giftNotice', e.target.value)}
                placeholder="예) 참석이 어려우신 분들을 위해 기재했습니다.&#10;너그러운 마음으로 양해 부탁드립니다."
                rows={2}
                className="resize-none"
              />
              <p className="text-xs text-gray-500">마음 전하실 곳 하단에 표시됩니다. 비워두면 표시되지 않습니다.</p>
            </div>
          </div>
        )}

        {invitation.sectionVisibility.bankAccounts && (
          <div className="space-y-4">
            <p className="text-xs text-gray-500">부모님 성함은 이전 단계(스토리)에서 입력한 이름이 자동 연동됩니다.</p>
            {/* 신랑측 계좌 */}
            <div className="p-4 rounded-lg space-y-4" style={{ background: 'var(--ed-surface-2)' }}>
              <p className="font-semibold" style={{ color: 'var(--ed-text)' }}>신랑측</p>

              {/* 신랑 본인 계좌 */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={invitation.groom.bank.enabled}
                    onCheckedChange={(checked) => updateNestedField('groom.bank.enabled', checked)}
                  />
                  <span className="text-sm font-medium text-gray-700">신랑 계좌{invitation.groom.name ? ` (${invitation.groom.name})` : ''}</span>
                </div>
                {invitation.groom.bank.enabled && (
                  <div className="grid grid-cols-3 gap-2">
                    <Input
                      value={invitation.groom.bank.bank}
                      onChange={(e) => updateNestedField('groom.bank.bank', e.target.value)}
                      placeholder="은행"
                    />
                    <Input
                      value={invitation.groom.bank.account}
                      onChange={(e) => handleAccountChange('groom.bank.account', e.target.value)}
                      placeholder="계좌번호"
                    />
                    <Input
                      value={invitation.groom.bank.holder}
                      onChange={(e) => updateNestedField('groom.bank.holder', e.target.value)}
                      placeholder="예금주"
                    />
                  </div>
                )}
              </div>

              {/* 신랑 아버지 계좌 */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={invitation.groom.father.bank.enabled}
                    onCheckedChange={(checked) => updateNestedField('groom.father.bank.enabled', checked)}
                  />
                  <span className="text-sm font-medium text-gray-700">아버지 계좌{invitation.groom.father.name ? ` (${invitation.groom.father.name})` : ''}</span>
                </div>
                {invitation.groom.father.bank.enabled && (
                  <div className="grid grid-cols-3 gap-2">
                    <Input
                      value={invitation.groom.father.bank.bank}
                      onChange={(e) => updateNestedField('groom.father.bank.bank', e.target.value)}
                      placeholder="은행"
                    />
                    <Input
                      value={invitation.groom.father.bank.account}
                      onChange={(e) => handleAccountChange('groom.father.bank.account', e.target.value)}
                      placeholder="계좌번호"
                    />
                    <Input
                      value={invitation.groom.father.bank.holder}
                      onChange={(e) => updateNestedField('groom.father.bank.holder', e.target.value)}
                      placeholder="예금주"
                    />
                  </div>
                )}
              </div>

              {/* 신랑 어머니 계좌 */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={invitation.groom.mother.bank.enabled}
                    onCheckedChange={(checked) => updateNestedField('groom.mother.bank.enabled', checked)}
                  />
                  <span className="text-sm font-medium text-gray-700">어머니 계좌{invitation.groom.mother.name ? ` (${invitation.groom.mother.name})` : ''}</span>
                </div>
                {invitation.groom.mother.bank.enabled && (
                  <div className="grid grid-cols-3 gap-2">
                    <Input
                      value={invitation.groom.mother.bank.bank}
                      onChange={(e) => updateNestedField('groom.mother.bank.bank', e.target.value)}
                      placeholder="은행"
                    />
                    <Input
                      value={invitation.groom.mother.bank.account}
                      onChange={(e) => handleAccountChange('groom.mother.bank.account', e.target.value)}
                      placeholder="계좌번호"
                    />
                    <Input
                      value={invitation.groom.mother.bank.holder}
                      onChange={(e) => updateNestedField('groom.mother.bank.holder', e.target.value)}
                      placeholder="예금주"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* 신부측 계좌 */}
            <div className="p-4 rounded-lg space-y-4" style={{ background: 'var(--ed-surface-2)' }}>
              <p className="font-semibold" style={{ color: 'var(--ed-text)' }}>신부측</p>

              {/* 신부 본인 계좌 */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={invitation.bride.bank.enabled}
                    onCheckedChange={(checked) => updateNestedField('bride.bank.enabled', checked)}
                  />
                  <span className="text-sm font-medium text-gray-700">신부 계좌{invitation.bride.name ? ` (${invitation.bride.name})` : ''}</span>
                </div>
                {invitation.bride.bank.enabled && (
                  <div className="grid grid-cols-3 gap-2">
                    <Input
                      value={invitation.bride.bank.bank}
                      onChange={(e) => updateNestedField('bride.bank.bank', e.target.value)}
                      placeholder="은행"
                    />
                    <Input
                      value={invitation.bride.bank.account}
                      onChange={(e) => handleAccountChange('bride.bank.account', e.target.value)}
                      placeholder="계좌번호"
                    />
                    <Input
                      value={invitation.bride.bank.holder}
                      onChange={(e) => updateNestedField('bride.bank.holder', e.target.value)}
                      placeholder="예금주"
                    />
                  </div>
                )}
              </div>

              {/* 신부 아버지 계좌 */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={invitation.bride.father.bank.enabled}
                    onCheckedChange={(checked) => updateNestedField('bride.father.bank.enabled', checked)}
                  />
                  <span className="text-sm font-medium text-gray-700">아버지 계좌{invitation.bride.father.name ? ` (${invitation.bride.father.name})` : ''}</span>
                </div>
                {invitation.bride.father.bank.enabled && (
                  <div className="grid grid-cols-3 gap-2">
                    <Input
                      value={invitation.bride.father.bank.bank}
                      onChange={(e) => updateNestedField('bride.father.bank.bank', e.target.value)}
                      placeholder="은행"
                    />
                    <Input
                      value={invitation.bride.father.bank.account}
                      onChange={(e) => handleAccountChange('bride.father.bank.account', e.target.value)}
                      placeholder="계좌번호"
                    />
                    <Input
                      value={invitation.bride.father.bank.holder}
                      onChange={(e) => updateNestedField('bride.father.bank.holder', e.target.value)}
                      placeholder="예금주"
                    />
                  </div>
                )}
              </div>

              {/* 신부 어머니 계좌 */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={invitation.bride.mother.bank.enabled}
                    onCheckedChange={(checked) => updateNestedField('bride.mother.bank.enabled', checked)}
                  />
                  <span className="text-sm font-medium text-gray-700">어머니 계좌{invitation.bride.mother.name ? ` (${invitation.bride.mother.name})` : ''}</span>
                </div>
                {invitation.bride.mother.bank.enabled && (
                  <div className="grid grid-cols-3 gap-2">
                    <Input
                      value={invitation.bride.mother.bank.bank}
                      onChange={(e) => updateNestedField('bride.mother.bank.bank', e.target.value)}
                      placeholder="은행"
                    />
                    <Input
                      value={invitation.bride.mother.bank.account}
                      onChange={(e) => handleAccountChange('bride.mother.bank.account', e.target.value)}
                      placeholder="계좌번호"
                    />
                    <Input
                      value={invitation.bride.mother.bank.holder}
                      onChange={(e) => updateNestedField('bride.mother.bank.holder', e.target.value)}
                      placeholder="예금주"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </section>

    </div>
  )
}
