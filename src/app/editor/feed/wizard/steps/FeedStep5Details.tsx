'use client'

import type { FeedInvitationData } from '../../page'

interface StepProps {
  data: FeedInvitationData
  updateData: (updates: Partial<FeedInvitationData>) => void
  updateNestedData: (path: string, value: unknown) => void
  invitationId: string | null
}

const inputClass =
  'w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black'
const labelClass = 'block text-xs font-medium text-gray-600 mb-1.5'

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-5 rounded-full transition-colors ${checked ? 'bg-black' : 'bg-gray-300'}`}
      aria-pressed={checked}
    >
      <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${checked ? 'translate-x-5' : ''}`} />
    </button>
  )
}

// 계좌번호 포맷팅
const formatAccount = (value: string) => {
  return value.replace(/[^\d-]/g, '')
}

export default function FeedStep5Details({
  data,
  updateData,
  updateNestedData,
}: StepProps) {
  // RSVP 마감일 기본값 (결혼식 7일 전)
  const getDefaultRsvpDeadline = () => {
    if (data.wedding.date) {
      const weddingDate = new Date(data.wedding.date)
      weddingDate.setDate(weddingDate.getDate() - 7)
      return weddingDate.toISOString().split('T')[0]
    }
    return ''
  }


  return (
    <div className="p-6 space-y-8">
      {/* 안내 */}
      <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
        <p className="text-base text-purple-800 font-medium mb-1">추가 기능 설정</p>
        <p className="text-sm text-purple-700">
          부모님 성함, 마음 전하실 곳, RSVP 등을 설정해주세요.
        </p>
      </div>

      {/* 부모님 성함 */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          👨‍👩‍👧 부모님 성함
        </h3>
        <p className="text-sm text-blue-600">선택사항 · 입력된 성함만 표시됩니다.</p>

        <div className="space-y-4">
          {/* 신랑측 */}
          <div className="p-4 bg-blue-50 rounded-lg space-y-3">
            <p className="text-sm font-semibold text-blue-800">신랑측</p>
            <div className="space-y-1.5">
              <label className={labelClass}>아버지 성함</label>
              <input
                className={inputClass}
                value={data.groom.father.name}
                onChange={(e) => updateNestedData('groom.father.name', e.target.value)}
                placeholder="홍OO"
              />
            </div>
            <div className="space-y-1.5">
              <label className={labelClass}>어머니 성함</label>
              <input
                className={inputClass}
                value={data.groom.mother.name}
                onChange={(e) => updateNestedData('groom.mother.name', e.target.value)}
                placeholder="OOO"
              />
            </div>
          </div>

          {/* 신부측 */}
          <div className="p-4 bg-pink-50 rounded-lg space-y-3">
            <p className="text-sm font-semibold text-pink-800">신부측</p>
            <div className="space-y-1.5">
              <label className={labelClass}>아버지 성함</label>
              <input
                className={inputClass}
                value={data.bride.father.name}
                onChange={(e) => updateNestedData('bride.father.name', e.target.value)}
                placeholder="김OO"
              />
            </div>
            <div className="space-y-1.5">
              <label className={labelClass}>어머니 성함</label>
              <input
                className={inputClass}
                value={data.bride.mother.name}
                onChange={(e) => updateNestedData('bride.mother.name', e.target.value)}
                placeholder="OOO"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 마음 전하실 곳 */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          💳 마음 전하실 곳
        </h3>

        <div className="space-y-4">
          {/* 신랑측 계좌 */}
          <div className="p-4 bg-blue-50 rounded-lg space-y-4">
            <p className="font-semibold text-blue-800">신랑측</p>

            {/* 신랑 본인 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <ToggleSwitch
                  checked={data.groom.bank.enabled}
                  onChange={(checked) => updateNestedData('groom.bank.enabled', checked)}
                />
                <span className="text-sm font-medium text-gray-700">신랑</span>
              </div>
              {data.groom.bank.enabled && (
                <div className="grid grid-cols-3 gap-2">
                  <input className={inputClass} value={data.groom.bank.bank} onChange={(e) => updateNestedData('groom.bank.bank', e.target.value)} placeholder="은행" />
                  <input className={inputClass} value={data.groom.bank.account} onChange={(e) => updateNestedData('groom.bank.account', formatAccount(e.target.value))} placeholder="계좌번호" />
                  <input className={inputClass} value={data.groom.bank.holder} onChange={(e) => updateNestedData('groom.bank.holder', e.target.value)} placeholder="예금주" />
                </div>
              )}
            </div>

            {/* 신랑 아버지 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <ToggleSwitch
                  checked={data.groom.father.bank?.enabled ?? false}
                  onChange={(checked) => updateNestedData('groom.father.bank.enabled', checked)}
                />
                <span className="text-sm font-medium text-gray-700">아버지{data.groom.father.name ? ` (${data.groom.father.name})` : ''}</span>
              </div>
              {data.groom.father.bank?.enabled && (
                <div className="grid grid-cols-3 gap-2">
                  <input className={inputClass} value={data.groom.father.bank.bank} onChange={(e) => updateNestedData('groom.father.bank.bank', e.target.value)} placeholder="은행" />
                  <input className={inputClass} value={data.groom.father.bank.account} onChange={(e) => updateNestedData('groom.father.bank.account', formatAccount(e.target.value))} placeholder="계좌번호" />
                  <input className={inputClass} value={data.groom.father.bank.holder} onChange={(e) => updateNestedData('groom.father.bank.holder', e.target.value)} placeholder="예금주" />
                </div>
              )}
            </div>

            {/* 신랑 어머니 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <ToggleSwitch
                  checked={data.groom.mother.bank?.enabled ?? false}
                  onChange={(checked) => updateNestedData('groom.mother.bank.enabled', checked)}
                />
                <span className="text-sm font-medium text-gray-700">어머니{data.groom.mother.name ? ` (${data.groom.mother.name})` : ''}</span>
              </div>
              {data.groom.mother.bank?.enabled && (
                <div className="grid grid-cols-3 gap-2">
                  <input className={inputClass} value={data.groom.mother.bank.bank} onChange={(e) => updateNestedData('groom.mother.bank.bank', e.target.value)} placeholder="은행" />
                  <input className={inputClass} value={data.groom.mother.bank.account} onChange={(e) => updateNestedData('groom.mother.bank.account', formatAccount(e.target.value))} placeholder="계좌번호" />
                  <input className={inputClass} value={data.groom.mother.bank.holder} onChange={(e) => updateNestedData('groom.mother.bank.holder', e.target.value)} placeholder="예금주" />
                </div>
              )}
            </div>
          </div>

          {/* 신부측 계좌 */}
          <div className="p-4 bg-pink-50 rounded-lg space-y-4">
            <p className="font-semibold text-pink-800">신부측</p>

            {/* 신부 본인 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <ToggleSwitch
                  checked={data.bride.bank.enabled}
                  onChange={(checked) => updateNestedData('bride.bank.enabled', checked)}
                />
                <span className="text-sm font-medium text-gray-700">신부</span>
              </div>
              {data.bride.bank.enabled && (
                <div className="grid grid-cols-3 gap-2">
                  <input className={inputClass} value={data.bride.bank.bank} onChange={(e) => updateNestedData('bride.bank.bank', e.target.value)} placeholder="은행" />
                  <input className={inputClass} value={data.bride.bank.account} onChange={(e) => updateNestedData('bride.bank.account', formatAccount(e.target.value))} placeholder="계좌번호" />
                  <input className={inputClass} value={data.bride.bank.holder} onChange={(e) => updateNestedData('bride.bank.holder', e.target.value)} placeholder="예금주" />
                </div>
              )}
            </div>

            {/* 신부 아버지 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <ToggleSwitch
                  checked={data.bride.father.bank?.enabled ?? false}
                  onChange={(checked) => updateNestedData('bride.father.bank.enabled', checked)}
                />
                <span className="text-sm font-medium text-gray-700">아버지{data.bride.father.name ? ` (${data.bride.father.name})` : ''}</span>
              </div>
              {data.bride.father.bank?.enabled && (
                <div className="grid grid-cols-3 gap-2">
                  <input className={inputClass} value={data.bride.father.bank.bank} onChange={(e) => updateNestedData('bride.father.bank.bank', e.target.value)} placeholder="은행" />
                  <input className={inputClass} value={data.bride.father.bank.account} onChange={(e) => updateNestedData('bride.father.bank.account', formatAccount(e.target.value))} placeholder="계좌번호" />
                  <input className={inputClass} value={data.bride.father.bank.holder} onChange={(e) => updateNestedData('bride.father.bank.holder', e.target.value)} placeholder="예금주" />
                </div>
              )}
            </div>

            {/* 신부 어머니 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <ToggleSwitch
                  checked={data.bride.mother.bank?.enabled ?? false}
                  onChange={(checked) => updateNestedData('bride.mother.bank.enabled', checked)}
                />
                <span className="text-sm font-medium text-gray-700">어머니{data.bride.mother.name ? ` (${data.bride.mother.name})` : ''}</span>
              </div>
              {data.bride.mother.bank?.enabled && (
                <div className="grid grid-cols-3 gap-2">
                  <input className={inputClass} value={data.bride.mother.bank.bank} onChange={(e) => updateNestedData('bride.mother.bank.bank', e.target.value)} placeholder="은행" />
                  <input className={inputClass} value={data.bride.mother.bank.account} onChange={(e) => updateNestedData('bride.mother.bank.account', formatAccount(e.target.value))} placeholder="계좌번호" />
                  <input className={inputClass} value={data.bride.mother.bank.holder} onChange={(e) => updateNestedData('bride.mother.bank.holder', e.target.value)} placeholder="예금주" />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* RSVP 설정 */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            📝 RSVP (참석 여부)
          </h3>
          <ToggleSwitch
            checked={data.rsvpEnabled}
            onChange={(checked) => updateData({ rsvpEnabled: checked })}
          />
        </div>

        {data.rsvpEnabled && (
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <div className="space-y-1.5">
              <label className={labelClass}>마감일</label>
              <input
                type="date"
                className={inputClass}
                value={data.rsvpDeadline || getDefaultRsvpDeadline()}
                onChange={(e) => updateData({ rsvpDeadline: e.target.value })}
              />
              <p className="text-xs text-gray-500">마감일이 지나면 참석 여부 응답이 불가합니다.</p>
            </div>

            <div className="flex items-center gap-3">
              <ToggleSwitch
                checked={data.rsvpAllowGuestCount}
                onChange={(checked) => updateData({ rsvpAllowGuestCount: checked })}
              />
              <span className="text-sm text-gray-700">동반 인원 입력 허용</span>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
