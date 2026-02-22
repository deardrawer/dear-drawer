'use client'

import { useEditorStore } from '@/store/editorStore'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { SAMPLE_DIRECTIONS } from '@/lib/sampleData'

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

  return (
    <div className="p-6 space-y-8">
      {/* 안내 */}
      <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
        <p className="text-base text-purple-800 font-medium mb-1">추가 기능 설정</p>
        <p className="text-sm text-purple-700">
          오시는 길, 연락처, RSVP, 마음 전하실 곳 등을 설정해주세요.
        </p>
      </div>

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
