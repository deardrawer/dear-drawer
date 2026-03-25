'use client'

import { useEditorStore } from '@/store/editorStore'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { SAMPLE_DIRECTIONS } from '@/lib/sampleData'
import { SortableList, SortableItem } from '@/components/ui/sortable-list'

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
    'premiere', 'guidance', 'credits', 'gift', 'guestbook', 'rsvp'
  ]
  const FILM_SECTION_LABELS: Record<string, string> = {
    chapterTwo: '커플 소개',
    filmScenes: '러브스토리',
    chapterThree: '갤러리',
    video: '영상',
    premiere: '예식 정보',
    guidance: '결혼식 안내',
    credits: '감사 인사',
    gift: '마음 전하실 곳',
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
    gift: 'sectionBg',
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
    gift: {
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
      <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
        <p className="text-base text-purple-800 font-medium mb-1">추가 기능 설정</p>
        <p className="text-sm text-purple-700">
          오시는 길, 연락처, RSVP, 마음 전하실 곳 등을 설정해주세요.
        </p>
      </div>

      {/* 메뉴 버튼 스타일 */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-900 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 15h18" />
          </svg>
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
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="w-full flex justify-center mb-2">{opt.icon}</div>
              <p className={`text-xs font-medium ${(invitation.navStyle || 'hamburger') === opt.value ? 'text-purple-700' : 'text-gray-700'}`}>{opt.label}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">{opt.desc}</p>
            </button>
          ))}
        </div>
      </section>

      {/* 섹션 순서 변경 (매거진/필름) */}
      {sectionConfig && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-900 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <line x1="3" y1="6" x2="3.01" y2="6" />
                <line x1="3" y1="12" x2="3.01" y2="12" />
                <line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
              섹션 순서 변경
            </h3>
            <button
              onClick={handleResetSections}
              className="text-xs text-gray-500 hover:text-purple-600 transition-colors"
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
            {/* 고정: 인사말 */}
            <div className="flex items-center gap-3 px-3 py-2.5 bg-gray-100 rounded-lg opacity-60">
              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span className="text-sm text-gray-500">인사말 (고정)</span>
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
          </div>
        </section>
      )}

      {/* 오시는 길 안내 */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-900 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          오시는 길
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-blue-600">
              <svg className="w-3.5 h-3.5 text-gray-900 inline -mt-0.5 mr-0.5" viewBox="0 0 24 24" fill="rgba(0,0,0,0.1)" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4" />
                <path d="M12 8h.01" />
              </svg>
              교통 안내 정보를 입력해주세요.
            </p>
            {!invitation.wedding.directions.car && !invitation.wedding.directions.publicTransport && !invitation.wedding.directions.train && !invitation.wedding.directions.expressBus && (
              <button onClick={applySampleDirections} className="text-xs text-blue-600 hover:underline">
                샘플 적용
              </button>
            )}
          </div>

          <div className="p-4 bg-gray-50 rounded-lg space-y-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">자가용 / 주차 <span className="text-red-500">*</span></Label>
              <Textarea
                value={invitation.wedding.directions.car}
                onChange={(e) => updateNestedField('wedding.directions.car', e.target.value)}
                placeholder={SAMPLE_DIRECTIONS.car}
                rows={3}
                className="resize-none"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">대중교통 (버스/지하철)</Label>
              <Textarea
                value={invitation.wedding.directions.publicTransport}
                onChange={(e) => updateNestedField('wedding.directions.publicTransport', e.target.value)}
                placeholder={SAMPLE_DIRECTIONS.publicTransport}
                rows={3}
                className="resize-none"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">기차 (KTX/SRT)</Label>
              <Textarea
                value={invitation.wedding.directions.train || ''}
                onChange={(e) => updateNestedField('wedding.directions.train', e.target.value)}
                placeholder="예: KTX 서울역에서 하차 후 3번 출구에서 셔틀버스 이용 (15분 소요)"
                rows={2}
                className="resize-none"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">고속버스</Label>
              <Textarea
                value={invitation.wedding.directions.expressBus || ''}
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
                  checked={invitation.wedding.directions.extraInfoEnabled || false}
                  onCheckedChange={(checked) => updateNestedField('wedding.directions.extraInfoEnabled', checked)}
                />
              </div>
              {invitation.wedding.directions.extraInfoEnabled && (
                <div className="space-y-2">
                  <Input
                    value={invitation.wedding.directions.extraInfoTitle || ''}
                    onChange={(e) => updateNestedField('wedding.directions.extraInfoTitle', e.target.value)}
                    placeholder="제목 (기본: 추가 안내사항)"
                  />
                  <Textarea
                    value={invitation.wedding.directions.extraInfoText || ''}
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
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-900 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            축하전하기
          </h3>
          <Switch
            checked={invitation.sectionVisibility.contacts}
            onCheckedChange={() => toggleSectionVisibility('contacts')}
          />
        </div>
        <p className="text-sm text-blue-600">
          <svg className="w-3.5 h-3.5 text-gray-900 inline -mt-0.5 mr-0.5" viewBox="0 0 24 24" fill="rgba(0,0,0,0.1)" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
          </svg>
          하객분들이 축하 전화를 드릴 수 있는 연락처를 입력해주세요. 입력된 연락처만 표시됩니다.
        </p>
        <p className="text-xs text-gray-500">부모님 성함은 이전 단계(스토리)에서 입력한 이름이 자동 연동됩니다.</p>

        <div className="space-y-4">
          {/* 신랑측 연락처 */}
          <div className="p-4 bg-blue-50 rounded-lg space-y-4">
            <p className="font-semibold text-blue-800">신랑측</p>
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
          <div className="p-4 bg-pink-50 rounded-lg space-y-4">
            <p className="font-semibold text-pink-800">신부측</p>
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
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-900 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
              <path d="m15 5 4 4" />
            </svg>
            RSVP (참석 여부)
          </h3>
          <Switch
            checked={invitation.rsvpEnabled}
            onCheckedChange={(checked) => updateField('rsvpEnabled', checked)}
          />
        </div>

        {invitation.rsvpEnabled && (isMagazine || isFilm) && (
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
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
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
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
          </div>
        )}
      </section>

      {/* 마음 전하실 곳 */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-900 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="4" width="22" height="16" rx="2" />
              <path d="M1 10h22" />
            </svg>
            마음 전하실 곳
          </h3>
          <Switch
            checked={invitation.sectionVisibility.bankAccounts}
            onCheckedChange={() => toggleSectionVisibility('bankAccounts')}
          />
        </div>

        {invitation.sectionVisibility.bankAccounts && (isMagazine || isFilm) && (
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
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
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-700">ON/OFF로 청첩장 본문에서 마음 전하실 곳 섹션을 표시하거나 숨길 수 있습니다.</p>
          </div>
        )}

        {invitation.sectionVisibility.bankAccounts && (
          <div className="space-y-4">
            <p className="text-xs text-gray-500">부모님 성함은 이전 단계(스토리)에서 입력한 이름이 자동 연동됩니다.</p>
            {/* 신랑측 계좌 */}
            <div className="p-4 bg-blue-50 rounded-lg space-y-4">
              <p className="font-semibold text-blue-800">신랑측</p>

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
            <div className="p-4 bg-pink-50 rounded-lg space-y-4">
              <p className="font-semibold text-pink-800">신부측</p>

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
