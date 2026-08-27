'use client'

import { useState } from 'react'
import type { SectionContents } from '../page'
import RsvpShareThumb from '@/components/editor/RsvpShareThumb'
import RsvpSharePreview from '@/components/editor/RsvpSharePreview'
import { shareRsvpToKakao } from '@/lib/kakaoRsvpShare'

interface RsvpEditorProps {
  value: SectionContents['rsvp']
  variant?: number
  /** 별도 RSVP 링크용 slug/id (저장 후에만 존재) */
  shareSlug?: string
  /** 썸네일 업로드용 청첩장 id */
  invitationId?: string
  onChange: (next: SectionContents['rsvp']) => void
}

export default function RsvpEditor({ value, variant = 1, shareSlug, invitationId, onChange }: RsvpEditorProps) {
  const [copied, setCopied] = useState(false)
  const rsvpUrl = shareSlug ? `https://invite.deardrawer.com/i/${shareSlug}/rsvp` : ''
  return (
    <div className="space-y-3">
      <label className="block">
        <span className="text-[10px] uppercase tracking-wider text-stone-400">타이틀</span>
        <input
          type="text"
          value={value.title}
          onChange={(e) => onChange({ ...value, title: e.target.value })}
          placeholder="R.S.V.P."
          className="mt-0.5 w-full border border-stone-200 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:border-stone-600 bg-white"
        />
      </label>
      <label className="block">
        <span className="text-[10px] uppercase tracking-wider text-stone-400">본문</span>
        <textarea
          value={value.body}
          onChange={(e) => onChange({ ...value, body: e.target.value })}
          rows={3}
          placeholder="참석 여부를 전해주시면&#10;정성껏 준비하겠습니다."
          className="mt-0.5 w-full border border-stone-200 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:border-stone-600 bg-white leading-relaxed resize-none"
        />
      </label>

      {variant === 4 ? (
        <div className="space-y-2">
          <span className="text-[10px] uppercase tracking-wider text-stone-400">듀얼 버튼 문구</span>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={value.attendLabel ?? ''}
              onChange={(e) => onChange({ ...value, attendLabel: e.target.value || undefined })}
              placeholder="Attending"
              className="w-full border border-stone-200 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:border-stone-600 bg-white"
            />
            <input
              type="text"
              value={value.regretLabel ?? ''}
              onChange={(e) => onChange({ ...value, regretLabel: e.target.value || undefined })}
              placeholder="Regrets"
              className="w-full border border-stone-200 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:border-stone-600 bg-white"
            />
          </div>
        </div>
      ) : (
        <label className="block">
          <span className="text-[10px] uppercase tracking-wider text-stone-400">버튼 문구</span>
          <input
            type="text"
            value={value.buttonLabel ?? ''}
            onChange={(e) => onChange({ ...value, buttonLabel: e.target.value || undefined })}
            placeholder="참석 회신하기"
            className="mt-0.5 w-full border border-stone-200 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:border-stone-600 bg-white"
          />
        </label>
      )}

      {/* RSVP 옵션 토글 */}
      <div className="pt-2 border-t border-stone-100">
        <span className="text-[10px] uppercase tracking-wider text-stone-400">RSVP 옵션</span>
        <div className="mt-2 space-y-2">
          <label className="flex items-center justify-between">
            <span className="text-xs text-stone-600">식사 여부 입력 허용</span>
            <button
              type="button"
              role="switch"
              aria-checked={value.showMealOption ?? false}
              onClick={() => onChange({ ...value, showMealOption: !(value.showMealOption ?? false) })}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                value.showMealOption ? 'bg-stone-800' : 'bg-stone-200'
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                  value.showMealOption ? 'translate-x-[18px]' : 'translate-x-[3px]'
                }`}
              />
            </button>
          </label>
          <label className="flex items-center justify-between">
            <span className="text-xs text-stone-600">대절버스 이용 여부 입력 허용</span>
            <button
              type="button"
              role="switch"
              aria-checked={value.showShuttleOption ?? false}
              onClick={() => onChange({ ...value, showShuttleOption: !(value.showShuttleOption ?? false) })}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                value.showShuttleOption ? 'bg-stone-800' : 'bg-stone-200'
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                  value.showShuttleOption ? 'translate-x-[18px]' : 'translate-x-[3px]'
                }`}
              />
            </button>
          </label>
          <label className="flex items-center justify-between">
            <span className="text-xs text-stone-600">애프터파티 참석 여부 입력 허용</span>
            <button
              type="button"
              role="switch"
              aria-checked={value.showAfterPartyOption ?? false}
              onClick={() => onChange({ ...value, showAfterPartyOption: !(value.showAfterPartyOption ?? false) })}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                value.showAfterPartyOption ? 'bg-stone-800' : 'bg-stone-200'
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                  value.showAfterPartyOption ? 'translate-x-[18px]' : 'translate-x-[3px]'
                }`}
              />
            </button>
          </label>
          <label className="flex items-center justify-between">
            <span className="text-xs text-stone-600">연락처 뒷자리 4자리 입력</span>
            <button
              type="button"
              role="switch"
              aria-checked={value.showPhoneOption ?? false}
              onClick={() => onChange({ ...value, showPhoneOption: !(value.showPhoneOption ?? false) })}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                value.showPhoneOption ? 'bg-stone-800' : 'bg-stone-200'
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                  value.showPhoneOption ? 'translate-x-[18px]' : 'translate-x-[3px]'
                }`}
              />
            </button>
          </label>
          <label className="flex items-center justify-between">
            <span className="text-xs text-stone-600">부모님 하객 구분</span>
            <button
              type="button"
              role="switch"
              aria-checked={value.showSideDetail ?? false}
              onClick={() => onChange({ ...value, showSideDetail: !(value.showSideDetail ?? false), ...( !(value.showSideDetail ?? false) && !value.sideDetailOptions ? { sideDetailOptions: { groomFather: true, groomMother: true, brideFather: true, brideMother: true } } : {}) })}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                value.showSideDetail ? 'bg-stone-800' : 'bg-stone-200'
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                  value.showSideDetail ? 'translate-x-[18px]' : 'translate-x-[3px]'
                }`}
              />
            </button>
          </label>
          {value.showSideDetail && (
            <div className="ml-4 space-y-1.5 pt-1">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={value.sideDetailOptions?.groomFather ?? true}
                  onChange={(e) => onChange({ ...value, sideDetailOptions: { ...value.sideDetailOptions, groomFather: e.target.checked } })}
                  className="w-3.5 h-3.5 rounded border-stone-300 text-stone-800 focus:ring-stone-500"
                />
                <span className="text-xs text-stone-600">신랑 아버지</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={value.sideDetailOptions?.groomMother ?? true}
                  onChange={(e) => onChange({ ...value, sideDetailOptions: { ...value.sideDetailOptions, groomMother: e.target.checked } })}
                  className="w-3.5 h-3.5 rounded border-stone-300 text-stone-800 focus:ring-stone-500"
                />
                <span className="text-xs text-stone-600">신랑 어머니</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={value.sideDetailOptions?.brideFather ?? true}
                  onChange={(e) => onChange({ ...value, sideDetailOptions: { ...value.sideDetailOptions, brideFather: e.target.checked } })}
                  className="w-3.5 h-3.5 rounded border-stone-300 text-stone-800 focus:ring-stone-500"
                />
                <span className="text-xs text-stone-600">신부 아버지</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={value.sideDetailOptions?.brideMother ?? true}
                  onChange={(e) => onChange({ ...value, sideDetailOptions: { ...value.sideDetailOptions, brideMother: e.target.checked } })}
                  className="w-3.5 h-3.5 rounded border-stone-300 text-stone-800 focus:ring-stone-500"
                />
                <span className="text-xs text-stone-600">신부 어머니</span>
              </label>
            </div>
          )}
        </div>
      </div>

      {/* 메시지 입력란 안내 */}
      <label className="block">
        <span className="text-[10px] uppercase tracking-wider text-stone-400">메시지 입력란 안내</span>
        <input
          type="text"
          value={value.messagePlaceholder ?? ''}
          onChange={(e) => onChange({ ...value, messagePlaceholder: e.target.value || undefined })}
          placeholder="축하 메시지 (선택)"
          className="mt-0.5 w-full border border-stone-200 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:border-stone-600 bg-white"
        />
      </label>

      {/* 안내 문구 */}
      <label className="block">
        <span className="text-[10px] uppercase tracking-wider text-stone-400">안내 문구</span>
        <textarea
          value={value.rsvpNotice ?? ''}
          onChange={(e) => onChange({ ...value, rsvpNotice: e.target.value })}
          rows={2}
          placeholder="예) 소규모로 진행되는 예식입니다.&#10;참석 여부를 미리 알려주시면 감사하겠습니다."
          className="mt-0.5 w-full border border-stone-200 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:border-stone-600 bg-white leading-relaxed resize-none"
        />
      </label>

      {/* 별도 RSVP 링크 (청첩장 전체 대신 RSVP 폼만 공유) */}
      <div className="pt-2 border-t border-stone-100">
        <label className="flex items-center justify-between">
          <span className="text-xs font-medium text-stone-700">별도 RSVP 링크</span>
          <button
            type="button"
            role="switch"
            aria-checked={value.sharedRsvpEnabled ?? false}
            onClick={() => onChange({ ...value, sharedRsvpEnabled: !(value.sharedRsvpEnabled ?? false) })}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
              value.sharedRsvpEnabled ? 'bg-stone-800' : 'bg-stone-200'
            }`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                value.sharedRsvpEnabled ? 'translate-x-[18px]' : 'translate-x-[3px]'
              }`}
            />
          </button>
        </label>
        <p className="mt-1 text-[11px] text-stone-400 leading-relaxed">
          청첩장 전체 대신 <b className="text-stone-500">RSVP 폼만</b> 별도 URL로 공유합니다. 현재 RSVP 설정을 그대로 사용합니다.
        </p>
        {value.sharedRsvpEnabled && (
          rsvpUrl ? (
            <div className="mt-2 flex items-center gap-1.5">
              <input
                type="text"
                readOnly
                value={rsvpUrl}
                onFocus={(e) => e.currentTarget.select()}
                className="flex-1 min-w-0 border border-stone-200 rounded-md px-2 py-1.5 text-[11px] text-stone-600 bg-stone-50"
              />
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(rsvpUrl).then(() => {
                    setCopied(true)
                    setTimeout(() => setCopied(false), 2000)
                  })
                }}
                className="shrink-0 rounded-md bg-stone-800 px-3 py-1.5 text-[11px] text-white"
              >
                {copied ? '복사됨' : '복사'}
              </button>
            </div>
          ) : (
            <p className="mt-2 text-[11px] text-amber-600">저장(발행) 후 링크가 생성됩니다.</p>
          )
        )}
        {value.sharedRsvpEnabled && rsvpUrl && (
          <div className="mt-2 space-y-1.5 rounded-md border border-stone-200 bg-stone-50/60 p-2.5">
            <RsvpShareThumb
              invitationId={invitationId || shareSlug}
              value={value.sharedRsvpPhoto}
              onChange={(url) => onChange({ ...value, sharedRsvpPhoto: url })}
              label="RSVP 링크 상단 사진 (선택)"
              hint="RSVP 페이지 맨 위에 원형으로 표시됩니다. 비우면 표시되지 않습니다."
              circle
            />
          </div>
        )}
        {value.sharedRsvpEnabled && rsvpUrl && (
          <div className="mt-2 space-y-1.5 rounded-md border border-stone-200 bg-stone-50/60 p-2.5">
            <p className="text-[11px] font-medium text-stone-600">카카오톡 공유 정보</p>
            <input
              type="text"
              value={value.sharedRsvpShareTitle ?? ''}
              onChange={(e) => onChange({ ...value, sharedRsvpShareTitle: e.target.value })}
              placeholder="참석 여부 안내"
              className="w-full border border-stone-200 rounded-md px-2 py-1.5 text-[11px] text-stone-700 bg-white focus:outline-none focus:border-stone-600"
            />
            <textarea
              value={value.sharedRsvpShareDesc ?? ''}
              onChange={(e) => onChange({ ...value, sharedRsvpShareDesc: e.target.value })}
              placeholder="예식 준비를 위해 참석 여부를 미리 알려주시면 감사하겠습니다."
              rows={2}
              className="w-full resize-none border border-stone-200 rounded-md px-2 py-1.5 text-[11px] text-stone-700 bg-white focus:outline-none focus:border-stone-600"
            />
            <RsvpShareThumb
              invitationId={invitationId || shareSlug}
              value={value.sharedRsvpShareImage}
              onChange={(url) => onChange({ ...value, sharedRsvpShareImage: url })}
            />
            <RsvpSharePreview image={value.sharedRsvpShareImage} title={value.sharedRsvpShareTitle} desc={value.sharedRsvpShareDesc} />
            <button
              type="button"
              onClick={() => shareRsvpToKakao({ url: rsvpUrl, title: value.sharedRsvpShareTitle, desc: value.sharedRsvpShareDesc, image: value.sharedRsvpShareImage })}
              className="w-full rounded-md bg-[#FEE500] py-2 text-[12px] font-medium text-[#3C1E1E]"
            >
              카카오톡으로 공유
            </button>
            <p className="text-[10px] leading-tight text-stone-400">
              제목·설명을 비우면 기본 문구가 사용됩니다. <b className="text-stone-500">카카오톡으로 공유</b> 버튼은 수정 즉시 반영됩니다. 링크를 복사해 붙여넣는 경우엔 <span className="text-amber-600">저장 후</span> 카카오 캐시 갱신이 필요할 수 있어요.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
