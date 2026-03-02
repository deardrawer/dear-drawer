'use client'

import { useState } from 'react'
import { Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { SAMPLE_DIRECTIONS } from '@/lib/sampleData'
import type { EssayInvitationData } from '../../page'

interface StepProps {
  data: EssayInvitationData
  updateData: (updates: Partial<EssayInvitationData>) => void
  updateNestedData: (path: string, value: unknown) => void
  invitationId: string | null
}

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className={`relative w-10 h-5 rounded-full transition-colors ${checked ? 'bg-black' : 'bg-gray-300'}`} aria-pressed={checked}>
      <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${checked ? 'translate-x-5' : ''}`} />
    </button>
  )
}

const formatPhone = (value: string) => {
  const numbers = value.replace(/[^\d]/g, '')
  if (numbers.length <= 3) return numbers
  if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`
  return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`
}

const formatAccount = (value: string) => value.replace(/[^\d-]/g, '')

export default function EssayStep3Details({ data, updateData, updateNestedData }: StepProps) {
  const getDefaultRsvpDeadline = () => {
    if (data.wedding.date) {
      const d = new Date(data.wedding.date)
      d.setDate(d.getDate() - 7)
      return d.toISOString().split('T')[0]
    }
    return ''
  }

  const applySampleDirections = () => {
    updateNestedData('wedding.directions.car', SAMPLE_DIRECTIONS.car)
    updateNestedData('wedding.directions.publicTransport', SAMPLE_DIRECTIONS.publicTransport)
    updateNestedData('wedding.directions.train', SAMPLE_DIRECTIONS.train)
    updateNestedData('wedding.directions.expressBus', SAMPLE_DIRECTIONS.expressBus)
  }

  const defaultInfoOrder = ['dressCode', 'photoBooth', 'photoShare', 'flowerGift', 'flowerChild', 'wreath', 'shuttle', 'reception']

  const infoItemConfigs: Record<string, { label: string; placeholder: string; sampleContent: string }> = {
    dressCode: { label: '드레스코드', placeholder: '단정한 복장으로 와주세요.', sampleContent: '결혼식에 맞는 옷차림을 고민하지 않으셔도 괜찮아요.\n여러분이 가장 좋아하는 옷,\n가장 여러분다운 모습으로 오셔서\n함께 웃고 즐겨주신다면 그걸로 충분합니다.' },
    photoBooth: { label: '포토부스 안내', placeholder: '로비에서 포토부스를 즐겨보세요!', sampleContent: '소중한 하루를 오래 기억할 수 있도록\n포토부스가 준비되어 있습니다.\n즐거운 추억을 사진으로 남겨주세요.' },
    photoShare: { label: '사진 공유', placeholder: '결혼식에서 찍은 사진들을 공유해주세요!', sampleContent: '결혼식에서 찍은 사진들을 공유해주세요!\n여러분의 시선으로 담긴 우리의 결혼식,\n소중한 추억으로 간직하겠습니다.' },
    flowerGift: { label: '꽃 답례품', placeholder: '꽃 답례품 안내를 입력해주세요.', sampleContent: '예식 후 하객분들께 감사의 마음을 전하기 위해\n계절의 꽃으로 만든 작은 꽃다발을 준비했습니다.\n소중한 발걸음에 대한 감사의 선물로 받아주세요.' },
    flowerChild: { label: '화동 안내', placeholder: '화동 안내를 입력해주세요.', sampleContent: '본 예식에는\n소중한 반려견 푸코가 화동으로 함께합니다.\n혹시 강아지를 무서워 하는 분이 계신다면\n너른 마음으로 양해부탁 드리겠습니다.' },
    wreath: { label: '화환 안내', placeholder: '화환 대신 축의금으로 마음을 전해주시면 감사하겠습니다.', sampleContent: '마음만 감사히 받겠습니다.\n화환은 정중히 사양하오니\n너른 양해 부탁드립니다.' },
    shuttle: { label: '셔틀버스 안내', placeholder: '셔틀버스 운행 안내를 입력해주세요.', sampleContent: '[출발 일시]\n0000년 0월 0일 (0요일) 오전 00시 00분 출발\n\n[탑승 장소]\n00시 00구 00역 0번 출구 앞\n\n[복귀 일시]\n예식 종료 후 오후 00시 00분 출발 예정' },
    reception: { label: '피로연 안내', placeholder: '피로연 안내를 입력해주세요.', sampleContent: '먼 걸음이 어려우신 분들을 모시고자\n피로연 자리를 마련하였습니다.\n\n참석하시어 두 사람의 앞날을\n따뜻한 축복으로 함께해 주시면\n감사하겠습니다.' },
  }

  const infoItemOrder: string[] = (data.info as any)?.itemOrder || defaultInfoOrder

  const moveInfoItem = (itemId: string, direction: 'up' | 'down') => {
    const currentIndex = infoItemOrder.indexOf(itemId)
    if (currentIndex === -1) return
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (newIndex < 0 || newIndex >= infoItemOrder.length) return
    const newOrder = [...infoItemOrder]
    ;[newOrder[currentIndex], newOrder[newIndex]] = [newOrder[newIndex], newOrder[currentIndex]]
    updateNestedData('info.itemOrder', newOrder)
  }

  const hasNoDirections = !data.wedding.directions.car && !data.wedding.directions.publicTransport && !data.wedding.directions.train && !data.wedding.directions.expressBus

  return (
    <div className="p-6 space-y-8">
      <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
        <p className="text-base text-purple-800 font-medium mb-1">부가 기능 설정</p>
        <p className="text-sm text-purple-700">오시는 길, 연락처, RSVP, 마음 전하실 곳 등을 설정해주세요.</p>
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

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-blue-600">
              <svg className="w-3.5 h-3.5 text-gray-900 inline -mt-0.5 mr-0.5" viewBox="0 0 24 24" fill="rgba(0,0,0,0.1)" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
              교통 안내 정보를 입력해주세요.
            </p>
            {hasNoDirections && (
              <button onClick={applySampleDirections} className="text-xs text-blue-600 hover:underline">
                샘플 적용
              </button>
            )}
          </div>

          <div className="p-4 bg-gray-50 rounded-lg space-y-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">자가용 / 주차 <span className="text-red-500">*</span></Label>
              <Textarea
                value={data.wedding.directions.car}
                onChange={e => updateNestedData('wedding.directions.car', e.target.value)}
                placeholder={SAMPLE_DIRECTIONS.car}
                rows={3}
                className="resize-none"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">대중교통 (버스/지하철)</Label>
              <Textarea
                value={data.wedding.directions.publicTransport}
                onChange={e => updateNestedData('wedding.directions.publicTransport', e.target.value)}
                placeholder={SAMPLE_DIRECTIONS.publicTransport}
                rows={3}
                className="resize-none"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">기차 (KTX/SRT)</Label>
              <Textarea
                value={data.wedding.directions.train || ''}
                onChange={e => updateNestedData('wedding.directions.train', e.target.value)}
                placeholder="예: KTX 서울역에서 하차 후 3번 출구에서 셔틀버스 이용 (15분 소요)"
                rows={2}
                className="resize-none"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">고속버스</Label>
              <Textarea
                value={data.wedding.directions.expressBus || ''}
                onChange={e => updateNestedData('wedding.directions.expressBus', e.target.value)}
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
                  checked={data.wedding.directions.extraInfoEnabled || false}
                  onCheckedChange={(checked) => updateNestedData('wedding.directions.extraInfoEnabled', checked)}
                />
              </div>
              {data.wedding.directions.extraInfoEnabled && (
                <div className="space-y-2">
                  <Input
                    value={data.wedding.directions.extraInfoTitle || ''}
                    onChange={e => updateNestedData('wedding.directions.extraInfoTitle', e.target.value)}
                    placeholder="제목 (기본: 추가 안내사항)"
                  />
                  <Textarea
                    value={data.wedding.directions.extraInfoText || ''}
                    onChange={e => updateNestedData('wedding.directions.extraInfoText', e.target.value)}
                    placeholder="예: 주차권은 안내데스크에서 수령 / 혼잡 시간대는 대중교통 추천"
                    rows={3}
                    className="resize-none"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 축하전하기 (연락처) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-900 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            축하전하기
          </h3>
          <Switch
            checked={data.sectionVisibility.contacts}
            onCheckedChange={(checked) => updateNestedData('sectionVisibility.contacts', checked)}
          />
        </div>
        <p className="text-sm text-blue-600">
          <svg className="w-3.5 h-3.5 text-gray-900 inline -mt-0.5 mr-0.5" viewBox="0 0 24 24" fill="rgba(0,0,0,0.1)" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
          하객분들이 축하 전화를 드릴 수 있는 연락처를 입력해주세요. 입력된 연락처만 표시됩니다.
        </p>

        {data.sectionVisibility.contacts && (
          <div className="space-y-4">
            {/* 연락처 에세이 */}
            <div className="p-4 bg-gray-50 rounded-lg space-y-2">
              <Label className="text-sm font-medium">연락처 안내 문구</Label>
              <p className="text-xs text-gray-500">북 컨셉에서 연락처 섹션 상단에 표시되는 에세이입니다.</p>
              <Textarea
                rows={4}
                value={data.content.contactsEssay}
                onChange={e => updateNestedData('content.contactsEssay', e.target.value)}
                placeholder={'축하의 마음을 전하고 싶으시다면,\n편하게 연락해 주세요.\n\n한 통의 전화, 짧은 문자 하나에도\n저희는 크게 웃을 수 있답니다.'}
                className="resize-none"
              />
            </div>
            {/* 신랑측 연락처 */}
            <div className="p-4 bg-blue-50 rounded-lg space-y-4">
              <p className="font-semibold text-blue-800">신랑측</p>
              <div className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Switch checked={data.groom.phoneEnabled !== false} onCheckedChange={(checked) => updateNestedData('groom.phoneEnabled', checked)} />
                    <span className="text-sm font-medium text-gray-700">신랑{data.groom.name ? ` (${data.groom.name})` : ''}</span>
                  </div>
                  {data.groom.phoneEnabled !== false && (
                    <Input value={data.groom.phone} onChange={e => updateNestedData('groom.phone', formatPhone(e.target.value))} placeholder="010-0000-0000" />
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Switch checked={data.groom.father.phoneEnabled !== false} onCheckedChange={(checked) => updateNestedData('groom.father.phoneEnabled', checked)} />
                    <span className="text-sm font-medium text-gray-700">아버지{data.groom.father.name ? ` (${data.groom.father.name})` : ''}</span>
                  </div>
                  {data.groom.father.phoneEnabled !== false && (
                    <Input value={data.groom.father.phone} onChange={e => updateNestedData('groom.father.phone', formatPhone(e.target.value))} placeholder="010-0000-0000" />
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Switch checked={data.groom.mother.phoneEnabled !== false} onCheckedChange={(checked) => updateNestedData('groom.mother.phoneEnabled', checked)} />
                    <span className="text-sm font-medium text-gray-700">어머니{data.groom.mother.name ? ` (${data.groom.mother.name})` : ''}</span>
                  </div>
                  {data.groom.mother.phoneEnabled !== false && (
                    <Input value={data.groom.mother.phone} onChange={e => updateNestedData('groom.mother.phone', formatPhone(e.target.value))} placeholder="010-0000-0000" />
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
                    <Switch checked={data.bride.phoneEnabled !== false} onCheckedChange={(checked) => updateNestedData('bride.phoneEnabled', checked)} />
                    <span className="text-sm font-medium text-gray-700">신부{data.bride.name ? ` (${data.bride.name})` : ''}</span>
                  </div>
                  {data.bride.phoneEnabled !== false && (
                    <Input value={data.bride.phone} onChange={e => updateNestedData('bride.phone', formatPhone(e.target.value))} placeholder="010-0000-0000" />
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Switch checked={data.bride.father.phoneEnabled !== false} onCheckedChange={(checked) => updateNestedData('bride.father.phoneEnabled', checked)} />
                    <span className="text-sm font-medium text-gray-700">아버지{data.bride.father.name ? ` (${data.bride.father.name})` : ''}</span>
                  </div>
                  {data.bride.father.phoneEnabled !== false && (
                    <Input value={data.bride.father.phone} onChange={e => updateNestedData('bride.father.phone', formatPhone(e.target.value))} placeholder="010-0000-0000" />
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Switch checked={data.bride.mother.phoneEnabled !== false} onCheckedChange={(checked) => updateNestedData('bride.mother.phoneEnabled', checked)} />
                    <span className="text-sm font-medium text-gray-700">어머니{data.bride.mother.name ? ` (${data.bride.mother.name})` : ''}</span>
                  </div>
                  {data.bride.mother.phoneEnabled !== false && (
                    <Input value={data.bride.mother.phone} onChange={e => updateNestedData('bride.mother.phone', formatPhone(e.target.value))} placeholder="010-0000-0000" />
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* RSVP */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-900 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
              <path d="m15 5 4 4" />
            </svg>
            참석 여부 (RSVP)
          </h3>
          <Switch checked={data.rsvpEnabled} onCheckedChange={v => updateData({ rsvpEnabled: v })} />
        </div>
        {data.rsvpEnabled && (
          <div className="space-y-1.5 p-4 bg-gray-50 rounded-lg">
            <Label className="text-sm font-medium">마감일</Label>
            <Input type="date" value={data.rsvpDeadline || getDefaultRsvpDeadline()} onChange={e => updateData({ rsvpDeadline: e.target.value })} />
            <p className="text-xs text-gray-500">마감일이 지나면 참석 여부 응답이 불가합니다.</p>
          </div>
        )}
      </section>

      {/* 마음 전하실 곳 (계좌) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-900 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="4" width="22" height="16" rx="2" />
              <path d="M1 10h22" />
            </svg>
            마음 전하실 곳
          </h3>
          <Switch checked={data.sectionVisibility.bankAccounts} onCheckedChange={v => updateNestedData('sectionVisibility.bankAccounts', v)} />
        </div>

        {data.sectionVisibility.bankAccounts && (
          <div className="space-y-4">
            {/* 마음전하기 에세이 */}
            <div className="p-4 bg-gray-50 rounded-lg space-y-2">
              <Label className="text-sm font-medium">마음전하기 안내 문구</Label>
              <p className="text-xs text-gray-500">북 컨셉에서 계좌 섹션 상단에 표시되는 에세이입니다.</p>
              <Textarea
                rows={4}
                value={data.content.bankEssay}
                onChange={e => updateNestedData('content.bankEssay', e.target.value)}
                placeholder={'직접 찾아뵙고 감사 인사 드려야 하나\n여의치 않아 이렇게 글로 대신합니다.\n\n넓은 마음으로 양해 부탁드립니다.'}
                className="resize-none"
              />
            </div>
            {/* 신랑측 계좌 */}
            <div className="p-4 bg-blue-50 rounded-lg space-y-4">
              <p className="font-semibold text-blue-800">신랑측</p>

              {/* 신랑 본인 계좌 */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Switch checked={data.groom.bank.enabled} onCheckedChange={v => updateNestedData('groom.bank.enabled', v)} />
                  <span className="text-sm font-medium text-gray-700">신랑 계좌{data.groom.name ? ` (${data.groom.name})` : ''}</span>
                </div>
                {data.groom.bank.enabled && (
                  <div className="grid grid-cols-3 gap-2">
                    <Input value={data.groom.bank.bank} onChange={e => updateNestedData('groom.bank.bank', e.target.value)} placeholder="은행" />
                    <Input value={data.groom.bank.account} onChange={e => updateNestedData('groom.bank.account', formatAccount(e.target.value))} placeholder="계좌번호" />
                    <Input value={data.groom.bank.holder} onChange={e => updateNestedData('groom.bank.holder', e.target.value)} placeholder="예금주" />
                  </div>
                )}
              </div>

              {/* 신랑 아버지 계좌 */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Switch checked={data.groom.father.bank.enabled} onCheckedChange={v => updateNestedData('groom.father.bank.enabled', v)} />
                  <span className="text-sm font-medium text-gray-700">아버지 계좌{data.groom.father.name ? ` (${data.groom.father.name})` : ''}</span>
                </div>
                {data.groom.father.bank.enabled && (
                  <div className="grid grid-cols-3 gap-2">
                    <Input value={data.groom.father.bank.bank} onChange={e => updateNestedData('groom.father.bank.bank', e.target.value)} placeholder="은행" />
                    <Input value={data.groom.father.bank.account} onChange={e => updateNestedData('groom.father.bank.account', formatAccount(e.target.value))} placeholder="계좌번호" />
                    <Input value={data.groom.father.bank.holder} onChange={e => updateNestedData('groom.father.bank.holder', e.target.value)} placeholder="예금주" />
                  </div>
                )}
              </div>

              {/* 신랑 어머니 계좌 */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Switch checked={data.groom.mother.bank.enabled} onCheckedChange={v => updateNestedData('groom.mother.bank.enabled', v)} />
                  <span className="text-sm font-medium text-gray-700">어머니 계좌{data.groom.mother.name ? ` (${data.groom.mother.name})` : ''}</span>
                </div>
                {data.groom.mother.bank.enabled && (
                  <div className="grid grid-cols-3 gap-2">
                    <Input value={data.groom.mother.bank.bank} onChange={e => updateNestedData('groom.mother.bank.bank', e.target.value)} placeholder="은행" />
                    <Input value={data.groom.mother.bank.account} onChange={e => updateNestedData('groom.mother.bank.account', formatAccount(e.target.value))} placeholder="계좌번호" />
                    <Input value={data.groom.mother.bank.holder} onChange={e => updateNestedData('groom.mother.bank.holder', e.target.value)} placeholder="예금주" />
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
                  <Switch checked={data.bride.bank.enabled} onCheckedChange={v => updateNestedData('bride.bank.enabled', v)} />
                  <span className="text-sm font-medium text-gray-700">신부 계좌{data.bride.name ? ` (${data.bride.name})` : ''}</span>
                </div>
                {data.bride.bank.enabled && (
                  <div className="grid grid-cols-3 gap-2">
                    <Input value={data.bride.bank.bank} onChange={e => updateNestedData('bride.bank.bank', e.target.value)} placeholder="은행" />
                    <Input value={data.bride.bank.account} onChange={e => updateNestedData('bride.bank.account', formatAccount(e.target.value))} placeholder="계좌번호" />
                    <Input value={data.bride.bank.holder} onChange={e => updateNestedData('bride.bank.holder', e.target.value)} placeholder="예금주" />
                  </div>
                )}
              </div>

              {/* 신부 아버지 계좌 */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Switch checked={data.bride.father.bank.enabled} onCheckedChange={v => updateNestedData('bride.father.bank.enabled', v)} />
                  <span className="text-sm font-medium text-gray-700">아버지 계좌{data.bride.father.name ? ` (${data.bride.father.name})` : ''}</span>
                </div>
                {data.bride.father.bank.enabled && (
                  <div className="grid grid-cols-3 gap-2">
                    <Input value={data.bride.father.bank.bank} onChange={e => updateNestedData('bride.father.bank.bank', e.target.value)} placeholder="은행" />
                    <Input value={data.bride.father.bank.account} onChange={e => updateNestedData('bride.father.bank.account', formatAccount(e.target.value))} placeholder="계좌번호" />
                    <Input value={data.bride.father.bank.holder} onChange={e => updateNestedData('bride.father.bank.holder', e.target.value)} placeholder="예금주" />
                  </div>
                )}
              </div>

              {/* 신부 어머니 계좌 */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Switch checked={data.bride.mother.bank.enabled} onCheckedChange={v => updateNestedData('bride.mother.bank.enabled', v)} />
                  <span className="text-sm font-medium text-gray-700">어머니 계좌{data.bride.mother.name ? ` (${data.bride.mother.name})` : ''}</span>
                </div>
                {data.bride.mother.bank.enabled && (
                  <div className="grid grid-cols-3 gap-2">
                    <Input value={data.bride.mother.bank.bank} onChange={e => updateNestedData('bride.mother.bank.bank', e.target.value)} placeholder="은행" />
                    <Input value={data.bride.mother.bank.account} onChange={e => updateNestedData('bride.mother.bank.account', formatAccount(e.target.value))} placeholder="계좌번호" />
                    <Input value={data.bride.mother.bank.holder} onChange={e => updateNestedData('bride.mother.bank.holder', e.target.value)} placeholder="예금주" />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 방명록 */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900">방명록</h3>
          <ToggleSwitch checked={data.sectionVisibility.guestbook} onChange={v => updateNestedData('sectionVisibility.guestbook', v)} />
        </div>
        {data.sectionVisibility.guestbook && (
          <div className="p-4 bg-gray-50 rounded-lg space-y-2">
            <Label className="text-sm font-medium">방명록 안내 문구</Label>
            <p className="text-xs text-gray-500">북 컨셉에서 방명록 섹션 상단에 표시되는 에세이입니다.</p>
            <Textarea
              rows={4}
              value={data.content.guestbookEssay}
              onChange={e => updateNestedData('content.guestbookEssay', e.target.value)}
              placeholder={'이야기의 마지막 페이지는\n여러분의 따뜻한 한 마디로 채워집니다.\n\n축하, 응원, 혹은 그냥 안부 한 줄도\n저희에게는 소중한 선물이에요.'}
              className="resize-none"
            />
          </div>
        )}
      </section>

      {/* 안내 항목 */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900">안내 항목</h3>
        <p className="text-xs text-gray-500">필요한 안내를 켜고 내용을 작성하세요. 화살표로 순서를 변경할 수 있습니다.</p>
        <div className="space-y-3">
          {infoItemOrder.map((itemId, index) => {
            const config = infoItemConfigs[itemId]
            if (!config) return null
            const item = (data.info as Record<string, any>)?.[itemId] || { title: config.label, content: '', enabled: false }
            return (
              <div key={itemId} className="p-4 bg-gray-50 rounded-lg space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <div className="flex flex-col">
                      <button
                        onClick={() => moveInfoItem(itemId, 'up')}
                        disabled={index === 0}
                        className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => moveInfoItem(itemId, 'down')}
                        disabled={index === infoItemOrder.length - 1}
                        className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <Label className="text-sm font-medium">{config.label}</Label>
                  </div>
                  <Switch
                    checked={item.enabled || false}
                    onCheckedChange={(checked) => {
                      updateNestedData(`info.${itemId}.enabled`, checked)
                      if (checked && !item.content) {
                        updateNestedData(`info.${itemId}.title`, config.label)
                        updateNestedData(`info.${itemId}.content`, config.sampleContent)
                      }
                    }}
                  />
                </div>
                {item.enabled && (
                  <div className="space-y-2 pl-7">
                    <Input value={item.title || ''} onChange={e => updateNestedData(`info.${itemId}.title`, e.target.value)} placeholder="항목 제목" />
                    <Textarea
                      rows={3}
                      value={item.content || ''}
                      onChange={e => updateNestedData(`info.${itemId}.content`, e.target.value)}
                      placeholder={config.placeholder}
                      className="resize-none"
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* 보너스 인터뷰 */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900">보너스 인터뷰</h3>
        <p className="text-xs text-gray-500">책의 끝에 추가되는 보너스 챕터입니다. (선택)</p>
        {(data.content.bonusInterviews || []).map((qa, i) => (
          <div key={i} className="p-3 border border-gray-200 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Bonus Q.{i + 1}</span>
              <button onClick={() => {
                const updated = [...data.content.bonusInterviews]
                updated.splice(i, 1)
                updateNestedData('content.bonusInterviews', updated)
              }} className="text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
            <Input value={qa.question} onChange={e => {
              const updated = [...data.content.bonusInterviews]
              updated[i] = { ...updated[i], question: e.target.value }
              updateNestedData('content.bonusInterviews', updated)
            }} placeholder="질문" />
            <Textarea rows={3} value={qa.answer} onChange={e => {
              const updated = [...data.content.bonusInterviews]
              updated[i] = { ...updated[i], answer: e.target.value }
              updateNestedData('content.bonusInterviews', updated)
            }} placeholder="답변" className="resize-none" />
          </div>
        ))}
        <button onClick={() => {
          const updated = [...(data.content.bonusInterviews || []), { question: '', answer: '', answerer: 'both' as const }]
          updateNestedData('content.bonusInterviews', updated)
        }} className="flex items-center gap-1 text-xs text-gray-600 hover:text-black transition-colors px-3 py-1.5 border border-gray-200 rounded-lg">
          <Plus className="w-3.5 h-3.5" />보너스 인터뷰 추가
        </button>
      </section>
    </div>
  )
}
