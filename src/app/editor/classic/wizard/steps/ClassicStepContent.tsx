'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import ColorField from '@/components/editor/ColorField'
import ClassicPhotoField from '../../ClassicPhotoField'
import ClassicGuideEditor from '../../ClassicGuideEditor'
import type { ClassicInvitationData, ClassicBank } from '../../page'

interface Props {
  data: ClassicInvitationData
  updateData: (updates: Partial<ClassicInvitationData>) => void
  updateNestedData: (path: string, value: unknown) => void
  invitationId: string | null
}

const formatAccount = (value: string) => value.replace(/[^\d-]/g, '')

const CONTENT_SECTIONS: { key: string; label: string }[] = [
  { key: 'letter', label: '인사말' },
  { key: 'intro', label: '신랑 · 신부 소개' },
  { key: 'interstitials', label: '사진 간지' },
  { key: 'gallery', label: '갤러리' },
  { key: 'date', label: '예식 일정' },
  { key: 'directions', label: '오시는 길' },
  { key: 'guide', label: '결혼식 안내' },
  { key: 'accounts', label: '마음 전하실 곳' },
  { key: 'links', label: '공유' },
  { key: 'rsvp', label: '참석 여부 (RSVP)' },
]

export default function ClassicStepContent({ data, updateNestedData, invitationId }: Props) {
  const infoOp = Math.round((data.content.classicInfoSectionOverlayOpacity ?? 0) * 100)

  const DEFAULT_ORDER = CONTENT_SECTIONS.map((s) => s.key)
  const savedOrder = (data.content.classicContentOrder || []).filter((k) => DEFAULT_ORDER.includes(k))
  // 모든 키를 포함한 완전한 순서만 사용 (레거시 부분 순서는 폐기)
  const orderComplete = savedOrder.length === DEFAULT_ORDER.length && DEFAULT_ORDER.every((k) => savedOrder.includes(k))
  const sectionOrder = orderComplete ? savedOrder : [...DEFAULT_ORDER]
  const labelOf = (k: string) => CONTENT_SECTIONS.find((s) => s.key === k)?.label || k

  const hiddenSections = data.content.classicHiddenSections || []
  const isHidden = (k: string) => hiddenSections.includes(k)
  const toggleSection = (k: string) => {
    const next = isHidden(k) ? hiddenSections.filter((x) => x !== k) : [...hiddenSections, k]
    updateNestedData('content.classicHiddenSections', next)
  }

  // 기본↔틴티드 배경 전환 가능 섹션 (인사말 제외)
  const TINTABLE = new Set(['intro', 'gallery', 'directions', 'guide', 'accounts', 'links', 'date', 'rsvp', 'interstitials'])
  const sectionBgMap = data.content.classicSectionBgMap || {}
  const isTintedMode = (k: string) => sectionBgMap[k] === 'tinted'
  const setBgMode = (k: string, tinted: boolean) => {
    const next: Record<string, 'tinted'> = { ...sectionBgMap }
    if (tinted) next[k] = 'tinted'
    else delete next[k]
    updateNestedData('content.classicSectionBgMap', next)
  }

  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)
  const moveSection = (from: number, to: number) => {
    if (from === to || to < 0 || to >= sectionOrder.length) return
    const next = [...sectionOrder]
    const [m] = next.splice(from, 1)
    next.splice(to, 0, m)
    updateNestedData('content.classicContentOrder', next)
  }

  const renderBankFields = (person: ClassicBank, path: string, label: string, name?: string) => (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Switch checked={person.enabled} onCheckedChange={(v) => updateNestedData(`${path}.enabled`, v)} />
        <span className="text-sm font-medium text-gray-700">{label}{name ? ` (${name})` : ''}</span>
      </div>
      {person.enabled && (
        <div className="grid grid-cols-3 gap-2">
          <Input value={person.bank} onChange={(e) => updateNestedData(`${path}.bank`, e.target.value)} placeholder="은행" />
          <Input value={person.account} onChange={(e) => updateNestedData(`${path}.account`, formatAccount(e.target.value))} placeholder="계좌번호" />
          <Input value={person.holder} onChange={(e) => updateNestedData(`${path}.holder`, e.target.value)} placeholder="예금주" />
        </div>
      )}
    </div>
  )

  return (
    <div className="p-6 space-y-8">
      {/* 안내 배너 */}
      <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
        <p className="text-base text-orange-800 font-medium mb-1">추가 정보</p>
        <p className="text-sm text-orange-700">
          갤러리, 오시는 길, 계좌, 결혼식 안내, 공유 정보를 입력하세요.
        </p>
      </div>

      {/* 오시는 길 */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-900 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          오시는 길
        </h3>
        <div className="rounded-lg border border-gray-200 p-4 bg-gray-50/50 space-y-3">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">배경 사진 (선택)</Label>
            <p className="text-[10px] text-gray-400 leading-tight">상단 배경으로 쓸 사진. 비우면 갤러리 첫 사진이 흑백으로 사용됩니다.</p>
            <ClassicPhotoField
              value={data.content.classicDirectionsBg}
              onChange={(p) => updateNestedData('content.classicDirectionsBg', p)}
              invitationId={invitationId || undefined}
              aspectRatio={16 / 9}
              containerWidth={220}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">자가용 / 주차</Label>
            <Textarea
              value={data.wedding.directions.car}
              onChange={(e) => updateNestedData('wedding.directions.car', e.target.value)}
              placeholder="예: 건물 지하 1~3층 주차 · 안내 데스크에서 3시간 무료"
              rows={3}
              className="resize-none"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">대중교통 (버스/지하철)</Label>
            <Textarea
              value={data.wedding.directions.publicTransport}
              onChange={(e) => updateNestedData('wedding.directions.publicTransport', e.target.value)}
              placeholder="예: 1·2호선 시청역 4번 출구에서 도보 5분"
              rows={3}
              className="resize-none"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">기차 (KTX/SRT)</Label>
            <Textarea
              value={data.wedding.directions.train}
              onChange={(e) => updateNestedData('wedding.directions.train', e.target.value)}
              placeholder="예: KTX 서울역에서 하차 후 3번 출구에서 셔틀버스 이용 (15분 소요)"
              rows={2}
              className="resize-none"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">고속버스</Label>
            <Textarea
              value={data.wedding.directions.expressBus}
              onChange={(e) => updateNestedData('wedding.directions.expressBus', e.target.value)}
              placeholder="예: 고속버스터미널에서 하차 후 택시로 10분 소요"
              rows={2}
              className="resize-none"
            />
          </div>
        </div>
      </section>

      {/* 마음 전하실 곳 (계좌) */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-900 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="4" width="22" height="16" rx="2" />
            <path d="M1 10h22" />
          </svg>
          마음 전하실 곳
        </h3>
        <p className="text-sm text-gray-500">토글을 켠 계좌만 청첩장 &quot;마음 전하실 곳&quot;에 표시됩니다.</p>

        <div className="space-y-3 p-4 bg-blue-50 rounded-lg">
          <p className="font-semibold text-blue-800">신랑측</p>
          {renderBankFields(data.groom.bank, 'groom.bank', '신랑 계좌', data.groom.name)}
          {renderBankFields(data.groom.father.bank, 'groom.father.bank', '아버지 계좌', data.groom.father.name)}
          {renderBankFields(data.groom.mother.bank, 'groom.mother.bank', '어머니 계좌', data.groom.mother.name)}
        </div>

        <div className="space-y-3 p-4 bg-pink-50 rounded-lg">
          <p className="font-semibold text-pink-800">신부측</p>
          {renderBankFields(data.bride.bank, 'bride.bank', '신부 계좌', data.bride.name)}
          {renderBankFields(data.bride.father.bank, 'bride.father.bank', '아버지 계좌', data.bride.father.name)}
          {renderBankFields(data.bride.mother.bank, 'bride.mother.bank', '어머니 계좌', data.bride.mother.name)}
        </div>
      </section>

      {/* 결혼식 안내 (Information) */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-900 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
          </svg>
          결혼식 안내
        </h3>
        <p className="text-sm text-gray-500">예정된 안내는 토글로 켜서 사용하고, 필요하면 항목을 추가하세요.</p>

        <ClassicGuideEditor
          sectionEnabled={data.content.classicGuideEnabled ?? false}
          items={data.content.classicGuide}
          onSectionToggle={(v) => updateNestedData('content.classicGuideEnabled', v)}
          onChange={(items) => updateNestedData('content.classicGuide', items)}
          invitationId={invitationId || undefined}
        />

        {/* 섹션 배경 · 오버레이 */}
        <div className="space-y-3 rounded-lg border border-gray-200 p-4 bg-gray-50/50">
          <div>
            <p className="text-sm font-medium text-gray-700">안내 섹션 배경 (선택)</p>
            <p className="text-[10px] text-gray-400 leading-tight">결혼식 안내 섹션 전체 배경 사진 + 오버레이</p>
          </div>
          <ClassicPhotoField
            value={data.content.classicInfoSectionBg}
            onChange={(p) => updateNestedData('content.classicInfoSectionBg', p)}
            invitationId={invitationId || undefined}
            aspectRatio={16 / 10}
            containerWidth={200}
          />
          <div className="flex items-center gap-3">
            <ColorField
              label="오버레이 색상"
              value={data.content.classicInfoSectionOverlayColor || '#1C100D'}
              onChange={(hex) => updateNestedData('content.classicInfoSectionOverlayColor', hex)}
            />
            <div className="flex-1">
              <div className="flex justify-between text-[11px] text-gray-500 mb-1"><span>오버레이 투명도</span><span>{infoOp}%</span></div>
              <input type="range" min={0} max={100} value={infoOp} onChange={(e) => updateNestedData('content.classicInfoSectionOverlayOpacity', Number(e.target.value) / 100)} className="w-full accent-gray-900" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ColorField label="이미지 배경 텍스트" value={data.content.classicInfoImgTextColor || '#FFFFFF'} onChange={(hex) => updateNestedData('content.classicInfoImgTextColor', hex)} />
            <div className="flex flex-col">
              <span className="text-sm text-gray-700">이미지 배경 텍스트</span>
              <span className="text-[10px] text-gray-400 leading-tight">배경 사진 위 제목 글자색</span>
            </div>
          </div>
        </div>
      </section>

      {/* RSVP */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-900 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
          </svg>
          참석 여부 (RSVP)
        </h3>
        <p className="text-sm text-gray-500">참석 여부 버튼을 누르면 상세 입력 폼이 열립니다. 받을 항목을 선택하세요.</p>

        <div className="space-y-3 rounded-lg border border-gray-200 p-4 bg-gray-50/50">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">상단 안내문구</Label>
            <Textarea
              value={data.content.classicRsvpNotice || ''}
              onChange={(e) => updateNestedData('content.classicRsvpNotice', e.target.value)}
              placeholder={'참석 여부를 미리 알려주시면\n준비에 큰 도움이 됩니다.'}
              rows={2}
              className="resize-none"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">축하 메시지 안내문구 (placeholder)</Label>
            <Input
              value={data.content.classicRsvpMessagePlaceholder || ''}
              onChange={(e) => updateNestedData('content.classicRsvpMessagePlaceholder', e.target.value)}
              placeholder="축하의 마음을 전해주세요."
            />
          </div>
          {([
            { key: 'classicRsvpMeal', label: '식사 여부 입력 받기' },
            { key: 'classicRsvpShuttle', label: '대절버스 이용 여부 입력 받기' },
            { key: 'classicRsvpPhone', label: '연락처 뒷자리(4자리) 입력 받기' },
            { key: 'classicRsvpSideDetail', label: '본인 / 아버지 / 어머니 구분 받기' },
          ] as const).map((opt) => (
            <label key={opt.key} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" checked={!!data.content[opt.key]} onChange={(e) => updateNestedData(`content.${opt.key}`, e.target.checked)} />
              {opt.label}
            </label>
          ))}
          {data.content.classicRsvpSideDetail && (
            <div className="pl-6 space-y-1.5 border-l-2 border-gray-200">
              <p className="text-sm font-medium text-gray-700">표시할 항목 선택</p>
              {([
                { key: 'groomSelf', label: '신랑' },
                { key: 'groomFather', label: '신랑 아버지' },
                { key: 'groomMother', label: '신랑 어머니' },
                { key: 'brideSelf', label: '신부' },
                { key: 'brideFather', label: '신부 아버지' },
                { key: 'brideMother', label: '신부 어머니' },
              ] as const).map((item) => (
                <label key={item.key} className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={data.content.classicRsvpSideDetailOptions?.[item.key] ?? true}
                    onChange={(e) => updateNestedData('content.classicRsvpSideDetailOptions', { ...data.content.classicRsvpSideDetailOptions, [item.key]: e.target.checked })}
                    className="w-3.5 h-3.5"
                  />
                  {item.label}
                </label>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 섹션 순서 (가장 마지막) */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-900 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
          </svg>
          섹션 순서
        </h3>
        <p className="text-sm text-gray-500">청첩장에 표시되는 순서입니다. 항목을 끌어서 원하는 위치로 옮기세요.</p>
        <div className="space-y-2">
          {sectionOrder.map((key, i) => (
            <div
              key={key}
              draggable
              onDragStart={() => setDragIndex(i)}
              onDragEnter={() => setOverIndex(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => { if (dragIndex !== null) moveSection(dragIndex, i); setDragIndex(null); setOverIndex(null) }}
              onDragEnd={() => { setDragIndex(null); setOverIndex(null) }}
              className={`flex items-center gap-3 rounded-lg border bg-white px-4 py-3 cursor-grab active:cursor-grabbing select-none transition-all ${dragIndex === i ? 'opacity-40' : ''} ${overIndex === i && dragIndex !== null && dragIndex !== i ? 'border-gray-900 ring-1 ring-gray-900' : 'border-gray-200'}`}
            >
              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="9" cy="6" r="1.6" /><circle cx="15" cy="6" r="1.6" /><circle cx="9" cy="12" r="1.6" /><circle cx="15" cy="12" r="1.6" /><circle cx="9" cy="18" r="1.6" /><circle cx="15" cy="18" r="1.6" />
              </svg>
              <span className="w-5 text-center text-xs font-medium text-gray-400">{i + 1}</span>
              <span className={`flex-1 text-sm ${isHidden(key) ? 'text-gray-400 line-through' : 'text-gray-800'}`}>{labelOf(key)}</span>
              {TINTABLE.has(key) && !isHidden(key) && (
                <div className="flex rounded-md border border-gray-200 overflow-hidden text-[11px] shrink-0" onDragStart={(e) => e.preventDefault()}>
                  <button type="button" draggable={false} onClick={() => setBgMode(key, false)} className={`px-2 py-1 transition-colors ${!isTintedMode(key) ? 'bg-gray-900 text-white' : 'bg-white text-gray-500'}`}>기본</button>
                  <button type="button" draggable={false} onClick={() => setBgMode(key, true)} className={`px-2 py-1 transition-colors ${isTintedMode(key) ? 'bg-gray-900 text-white' : 'bg-white text-gray-500'}`}>틴티드</button>
                </div>
              )}
              <button
                type="button"
                draggable={false}
                onClick={() => toggleSection(key)}
                onDragStart={(e) => e.preventDefault()}
                aria-label={isHidden(key) ? '표시' : '숨김'}
                className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${isHidden(key) ? 'bg-gray-300' : 'bg-gray-900'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${isHidden(key) ? '' : 'translate-x-4'}`} />
              </button>
            </div>
          ))}
        </div>
      </section>

    </div>
  )
}
