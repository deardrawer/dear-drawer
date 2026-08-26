'use client'

import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import ColorField from '@/components/editor/ColorField'
import ClassicPhotoField from '../../ClassicPhotoField'
import ClassicGalleryEditor from '../../ClassicGalleryEditor'
import ClassicInterstitialEditor from '../../ClassicInterstitialEditor'
import type { ClassicInvitationData } from '../../page'

interface Props {
  data: ClassicInvitationData
  updateData: (updates: Partial<ClassicInvitationData>) => void
  updateNestedData: (path: string, value: unknown) => void
  invitationId: string | null
}

export default function ClassicStepGreeting({ data, updateNestedData, invitationId }: Props) {
  const greetingOp = Math.round((data.content.classicGreetingOverlayOpacity ?? 0.5) * 100)
  const introSecOp = Math.round((data.content.classicIntroSectionOverlayOpacity ?? 0) * 100)
  const thanksSecOp = Math.round((data.content.classicThanksSectionOverlayOpacity ?? 0) * 100)
  return (
    <div className="p-6 space-y-8">
      {/* 안내 배너 */}
      <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
        <p className="text-base text-orange-800 font-medium mb-1">인사말</p>
        <p className="text-sm text-orange-700">
          비워두면 THE CLASSIC 기본 문구가 대신 표시됩니다.
        </p>
      </div>

      {/* 인사말 */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-900 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
          </svg>
          인사말
        </h3>
        <p className="text-sm text-gray-500">청첩장 상단(Letter 섹션)에 표시되는 초대 문구입니다.</p>
        {/* 인사말 카드 프레임 (본문 위) */}
        <div className="space-y-3 rounded-lg border border-gray-200 p-4 bg-gray-50/50">
          <div>
            <p className="text-sm font-medium text-gray-700">인사말 카드 프레임</p>
            <p className="text-[10px] text-gray-400 leading-tight">인사말 텍스트를 감싸는 카드 프레임을 선택하세요.</p>
          </div>
          <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden">
            {([
              { id: 'wave', label: '웨이브' },
              { id: 'wavy', label: '물결' },
              { id: 'lace', label: '레이스' },
              { id: 'scallop', label: '스캘럽' },
              { id: 'paper', label: '종이' },
              { id: 'none', label: '없음' },
            ] as const).map((opt) => {
              const active = (data.content.classicLetterFrame || 'wave') === opt.id
              return (
                <button key={opt.id} type="button" onClick={() => updateNestedData('content.classicLetterFrame', opt.id)} className={`px-4 py-1.5 text-xs transition-colors ${active ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 hover:text-gray-800'}`}>
                  {opt.label}
                </button>
              )
            })}
          </div>
          {data.content.classicLetterFrame === 'none' && (
            <div className="pt-1">
              <ColorField label="인사말 텍스트 색상" value={data.content.classicLetterTextColor || '#F7F3EC'} onChange={(hex) => updateNestedData('content.classicLetterTextColor', hex)} />
              <p className="text-[10px] text-gray-400 leading-tight mt-1">프레임이 없으면 배경 위에 바로 놓이므로 배경과 대비되는 색을 골라주세요.</p>
            </div>
          )}
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">인사말 본문</Label>
          <Textarea
            value={data.content.greeting}
            onChange={(e) => updateNestedData('content.greeting', e.target.value)}
            placeholder={'오랜 시간 나란히 걸어온 두 사람이\n이제 하나의 이름으로\n같은 길을 걸으려 합니다.\n\n귀한 걸음으로 오시어\n저희의 시작을 축복해 주세요.'}
            rows={7}
          />
        </div>

        {/* 혼주 표시 옵션 */}
        <div className="space-y-3 rounded-lg border border-gray-200 p-4 bg-gray-50/50">
          <div>
            <span className="text-sm font-medium text-gray-700">인사말 서명</span>
            <div className="mt-1.5 flex flex-col gap-1.5">
              {([
                { id: 'parents', label: '부모님 성함 (양가)' },
                { id: 'couple', label: '신랑 · 신부 올림' },
                { id: 'hosts', label: '신랑측 / 신부측 혼주 올림' },
                { id: 'none', label: '서명 없음' },
              ] as const).map((opt) => {
                const active = (data.content.classicLetterSign || 'parents') === opt.id
                return (
                  <button key={opt.id} type="button" onClick={() => updateNestedData('content.classicLetterSign', opt.id)} className={`text-left px-3 py-2 rounded-lg border text-sm transition-colors ${active ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 bg-white text-gray-600 hover:text-gray-900'}`}>
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>
          {(data.content.classicLetterSign || 'parents') === 'hosts' && (
            <div>
              <span className="text-sm font-medium text-gray-700">혼주 (표시할 측)</span>
              <div className="mt-1 inline-flex rounded-lg border border-gray-200 overflow-hidden">
                {([
                  { id: 'groom', label: '신랑측' },
                  { id: 'bride', label: '신부측' },
                ] as const).map((opt) => {
                  const active = (data.content.classicHostSide || 'groom') === opt.id
                  return (
                    <button key={opt.id} type="button" onClick={() => updateNestedData('content.classicHostSide', opt.id)} className={`px-4 py-1.5 text-xs transition-colors ${active ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 hover:text-gray-800'}`}>
                      {opt.label}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
          {(data.content.classicLetterSign || 'parents') === 'parents' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">신랑 호칭</Label>
                <Input value={data.content.classicGroomTitle ?? '아들'} onChange={(e) => updateNestedData('content.classicGroomTitle', e.target.value)} placeholder="아들" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">신부 호칭</Label>
                <Input value={data.content.classicBrideTitle ?? '딸'} onChange={(e) => updateNestedData('content.classicBrideTitle', e.target.value)} placeholder="딸" />
              </div>
            </div>
          )}
          {['parents', 'hosts'].includes(data.content.classicLetterSign || 'parents') && (
          <div>
            <span className="text-sm font-medium text-gray-700">고인 표시 스타일</span>
            <div className="mt-1 inline-flex rounded-lg border border-gray-200 overflow-hidden">
              {([
                { id: 'flower', label: '국화꽃' },
                { id: 'hanja', label: '故 한자' },
              ] as const).map((opt) => {
                const active = (data.content.classicDeceasedStyle || 'flower') === opt.id
                return (
                  <button key={opt.id} type="button" onClick={() => updateNestedData('content.classicDeceasedStyle', opt.id)} className={`px-4 py-1.5 text-xs transition-colors ${active ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 hover:text-gray-800'}`}>
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>
          )}
        </div>

        {/* 인사말 배경 */}
        <div className="space-y-3 rounded-lg border border-gray-200 p-4 bg-gray-50/50">
          <div>
            <p className="text-sm font-medium text-gray-700">배경 사진 · 오버레이</p>
            <p className="text-[10px] text-gray-400 leading-tight">비우면 갤러리 첫 사진이 사용됩니다. 오버레이로 글자 가독성을 조절하세요.</p>
          </div>
          <ClassicPhotoField
            value={data.content.classicGreetingBgImage}
            onChange={(p) => updateNestedData('content.classicGreetingBgImage', p)}
            invitationId={invitationId || undefined}
            aspectRatio={4 / 3}
            containerWidth={200}
          />
          <div className="flex items-center gap-3">
            <ColorField
              label="오버레이 색상"
              value={data.content.classicGreetingOverlayColor || '#241610'}
              onChange={(hex) => updateNestedData('content.classicGreetingOverlayColor', hex)}
            />
            <div className="flex-1">
              <div className="flex justify-between text-[11px] text-gray-500 mb-1"><span>오버레이 투명도</span><span>{greetingOp}%</span></div>
              <input
                type="range"
                min={0}
                max={100}
                value={greetingOp}
                onChange={(e) => updateNestedData('content.classicGreetingOverlayOpacity', Number(e.target.value) / 100)}
                className="w-full accent-gray-900"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 신랑 · 신부 소개 */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-900 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
          </svg>
          신랑 · 신부 소개
        </h3>
        <p className="text-sm text-gray-500">소개 방식을 선택하세요. 사진은 드래그·확대로 크롭할 수 있습니다.</p>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium">섹션 제목</Label>
          <p className="text-[10px] text-gray-400 leading-tight">소개 섹션 맨 위에 표시됩니다. 비우면 표시되지 않습니다.</p>
          <Input
            value={data.content.classicIntroTitle ?? ''}
            onChange={(e) => updateNestedData('content.classicIntroTitle', e.target.value)}
            placeholder="예: 신랑 · 신부를 소개합니다"
          />
        </div>

        <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden">
          {([
            { id: 'each', label: '각자' },
            { id: 'together', label: '함께' },
            { id: 'nameOnly', label: '이름만' },
          ] as const).map((opt) => {
            const active = (data.content.classicIntroMode || 'each') === opt.id
            return (
              <button key={opt.id} type="button" onClick={() => updateNestedData('content.classicIntroMode', opt.id)} className={`px-6 py-1.5 text-xs transition-colors ${active ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 hover:text-gray-800'}`}>
                {opt.label}
              </button>
            )
          })}
        </div>

        <div className="space-y-2 rounded-lg border border-gray-200 p-3 bg-gray-50/50">
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={data.content.classicIntroShowParents !== false} onChange={(e) => updateNestedData('content.classicIntroShowParents', e.target.checked)} />
            소개 상단에 부모님 성함 표시
          </label>
          {data.content.classicIntroShowParents !== false && (
            <div className="pl-6 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">신랑 호칭</Label>
                  <Input value={data.content.classicGroomTitle ?? '아들'} onChange={(e) => updateNestedData('content.classicGroomTitle', e.target.value)} placeholder="아들" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">신부 호칭</Label>
                  <Input value={data.content.classicBrideTitle ?? '딸'} onChange={(e) => updateNestedData('content.classicBrideTitle', e.target.value)} placeholder="딸" />
                </div>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">고인 표시 스타일</span>
                <div className="mt-1 inline-flex rounded-lg border border-gray-200 overflow-hidden">
                  {([
                    { id: 'flower', label: '국화꽃' },
                    { id: 'hanja', label: '故 한자' },
                  ] as const).map((opt) => {
                    const active = (data.content.classicDeceasedStyle || 'flower') === opt.id
                    return (
                      <button key={opt.id} type="button" onClick={() => updateNestedData('content.classicDeceasedStyle', opt.id)} className={`px-4 py-1.5 text-xs transition-colors ${active ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 hover:text-gray-800'}`}>
                        {opt.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {(data.content.classicIntroMode || 'each') === 'each' ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-gray-200 p-4 bg-gray-50/50 space-y-3">
              <p className="text-sm font-medium text-gray-700">카드 프레임</p>
              <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden">
                {([
                  { id: 'plaque', label: '웨이브 플라크' },
                  { id: 'stamp', label: '우표' },
                  { id: 'box', label: '종이' },
                ] as const).map((opt) => {
                  const active = (data.content.classicIntroEachFrame || 'plaque') === opt.id
                  return (
                    <button key={opt.id} type="button" onClick={() => updateNestedData('content.classicIntroEachFrame', opt.id)} className={`px-4 py-1.5 text-xs transition-colors ${active ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 hover:text-gray-800'}`}>
                      {opt.label}
                    </button>
                  )
                })}
              </div>
              {(data.content.classicIntroEachFrame || 'plaque') === 'box' && (
                <div className="space-y-1.5 pt-1">
                  <p className="text-xs font-medium text-gray-600">종이 레이아웃</p>
                  <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden">
                    {([
                      { id: 'v', label: '세로 (사진 옆 텍스트)' },
                      { id: 'h', label: '가로 (사진 위 텍스트)' },
                    ] as const).map((opt) => {
                      const active = (data.content.classicIntroEachBoxLayout || 'v') === opt.id
                      return (
                        <button key={opt.id} type="button" onClick={() => updateNestedData('content.classicIntroEachBoxLayout', opt.id)} className={`px-4 py-1.5 text-xs transition-colors ${active ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 hover:text-gray-800'}`}>
                          {opt.label}
                        </button>
                      )
                    })}
                  </div>
                  <p className="text-[10px] text-gray-400 leading-tight">가로형은 사진을 가로로 크게 넣고 이름·소개글을 아래에 배치합니다. 소개글이 길 때 적합합니다.</p>
                </div>
              )}
            </div>
            <div className="rounded-lg border border-gray-200 p-4 bg-gray-50/50 space-y-3">
              <p className="text-sm font-medium text-gray-700">신랑</p>
              <div className="flex gap-4">
                <ClassicPhotoField
                  value={data.content.classicGroomPhoto}
                  onChange={(p) => updateNestedData('content.classicGroomPhoto', p)}
                  invitationId={invitationId || undefined}
                  aspectRatio={116 / 92}
                  containerWidth={130}
                />
                <div className="flex-1 space-y-1.5">
                  <Label className="text-sm font-medium">소개 한마디</Label>
                  <Textarea
                    value={data.content.classicGroomIntro || ''}
                    onChange={(e) => updateNestedData('content.classicGroomIntro', e.target.value)}
                    placeholder={'다정하고 든든한 사람입니다.'}
                    rows={4}
                  />
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-gray-200 p-4 bg-gray-50/50 space-y-3">
              <p className="text-sm font-medium text-gray-700">신부</p>
              <div className="flex gap-4">
                <ClassicPhotoField
                  value={data.content.classicBridePhoto}
                  onChange={(p) => updateNestedData('content.classicBridePhoto', p)}
                  invitationId={invitationId || undefined}
                  aspectRatio={116 / 92}
                  containerWidth={130}
                />
                <div className="flex-1 space-y-1.5">
                  <Label className="text-sm font-medium">소개 한마디</Label>
                  <Textarea
                    value={data.content.classicBrideIntro || ''}
                    onChange={(e) => updateNestedData('content.classicBrideIntro', e.target.value)}
                    placeholder={'따뜻하고 밝은 사람입니다.'}
                    rows={4}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (data.content.classicIntroMode || 'each') === 'together' ? (
          <div className="rounded-lg border border-gray-200 p-4 bg-gray-50/50 space-y-3">
            <p className="text-sm font-medium text-gray-700">함께 사진 · 소개 문구</p>
            <div>
              <span className="text-sm font-medium text-gray-700">함께 소개 프레임</span>
              <div className="mt-1 inline-flex rounded-lg border border-gray-200 overflow-hidden">
                {([
                  { id: 'pearl', label: '진주' },
                  { id: 'filigree', label: '필리그리' },
                  { id: 'oval', label: '오벌' },
                ] as const).map((opt) => {
                  const active = (data.content.classicIntroTogetherFrame || 'pearl') === opt.id
                  return (
                    <button key={opt.id} type="button" onClick={() => updateNestedData('content.classicIntroTogetherFrame', opt.id)} className={`px-4 py-1.5 text-xs transition-colors ${active ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 hover:text-gray-800'}`}>
                      {opt.label}
                    </button>
                  )
                })}
              </div>
              {data.content.classicIntroTogetherFrame === 'oval' && (
                <div className="pt-2">
                  <ColorField label="프레임 색상" value={data.content.classicIntroTogetherFrameColor || '#DDD1BB'} onChange={(hex) => updateNestedData('content.classicIntroTogetherFrameColor', hex)} />
                  <p className="text-[10px] text-gray-400 leading-tight mt-1">비우면 기본(아이보리) 색으로 표시됩니다.</p>
                </div>
              )}
            </div>
            <ClassicPhotoField
              value={data.content.classicTogetherPhoto}
              onChange={(p) => updateNestedData('content.classicTogetherPhoto', p)}
              invitationId={invitationId || undefined}
              aspectRatio={5 / 4}
              containerWidth={200}
            />
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">소개 문구</Label>
              <Textarea
                value={data.content.coupleTogetherText}
                onChange={(e) => updateNestedData('content.coupleTogetherText', e.target.value)}
                placeholder={'오랜 시간 함께 걸어온 두 사람이\n이제 같은 이름으로 살아가려 합니다.'}
                rows={4}
              />
            </div>
          </div>
        ) : null}

        <div className="space-y-3 rounded-lg border border-gray-200 p-4 bg-gray-50/50">
          <div>
            <p className="text-sm font-medium text-gray-700">섹션 배경 (선택)</p>
            <p className="text-[10px] text-gray-400 leading-tight">커플소개 섹션 전체 배경 사진 + 오버레이. 배경을 넣으면 아래에서 글자색을 지정하세요.</p>
          </div>
          <ClassicPhotoField
            value={data.content.classicIntroSectionBg}
            onChange={(p) => updateNestedData('content.classicIntroSectionBg', p)}
            invitationId={invitationId || undefined}
            aspectRatio={16 / 10}
            containerWidth={200}
          />
          <div className="flex items-center gap-3">
            <ColorField label="오버레이 색상" value={data.content.classicIntroSectionOverlayColor || '#1C100D'} onChange={(hex) => updateNestedData('content.classicIntroSectionOverlayColor', hex)} />
            <div className="flex-1">
              <div className="flex justify-between text-[11px] text-gray-500 mb-1"><span>오버레이 투명도</span><span>{introSecOp}%</span></div>
              <input type="range" min={0} max={100} value={introSecOp} onChange={(e) => updateNestedData('content.classicIntroSectionOverlayOpacity', Number(e.target.value) / 100)} className="w-full accent-gray-900" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ColorField label="이미지 배경 텍스트" value={data.content.classicIntroImgTextColor || '#FFFFFF'} onChange={(hex) => updateNestedData('content.classicIntroImgTextColor', hex)} />
            <div className="flex flex-col">
              <span className="text-sm text-gray-700">이미지 배경 텍스트</span>
              <span className="text-[10px] text-gray-400 leading-tight">배경 사진 위 글자색</span>
            </div>
          </div>
        </div>
      </section>

      {/* 갤러리 */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-900 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
          갤러리 <span className="text-xs font-normal text-gray-500">(최대 30장)</span>
        </h3>
        <p className="text-sm text-gray-500">청첩장 갤러리 섹션에 사용되는 사진들입니다. 각 사진을 드래그·확대하여 원하는 부분을 보여줄 수 있습니다.</p>

        {/* 갤러리 타입 */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">갤러리 타입</p>
          <p className="text-[10px] text-gray-400 leading-tight">갤러리 섹션의 레이아웃을 선택하세요.</p>
          <div className="grid grid-cols-5 gap-1.5">
            {([
              { id: 'default', label: '기본' },
              { id: 'album', label: '앨범' },
              { id: 'fullbleed', label: '풀블리드' },
              { id: 'swipe', label: '스와이프' },
              { id: 'film', label: '필름' },
            ] as const).map((opt) => {
              const active = (data.content.classicGalleryType || 'default') === opt.id
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => updateNestedData('content.classicGalleryType', opt.id)}
                  className={`px-2 py-2 rounded-lg border text-[11px] transition-colors ${active ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 bg-white text-gray-600 hover:text-gray-900'}`}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* 갤러리 캡션 */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">갤러리 캡션</Label>
          <Input
            value={data.content.classicGalleryCaption || ''}
            onChange={(e) => updateNestedData('content.classicGalleryCaption', e.target.value)}
            placeholder="a quiet afternoon in June"
          />
        </div>

        <ClassicGalleryEditor
          images={data.gallery.images || []}
          onChange={(images) => updateNestedData('gallery.images', images)}
          invitationId={invitationId || undefined}
          maxImages={30}
        />

        {/* 라이트박스 스타일 */}
        <div className="space-y-2 pt-3 border-t border-gray-100">
          <Label className="text-sm font-medium">라이트박스 스타일</Label>
          <p className="text-[10px] text-gray-400 leading-tight">갤러리 사진을 누르면 열리는 전체화면 보기 스타일입니다.</p>
          <div className="grid grid-cols-4 gap-1.5">
            {([
              { id: 1, label: '에디토리얼' },
              { id: 2, label: '글라스' },
              { id: 4, label: '룩북' },
              { id: 5, label: '시네마' },
              { id: 6, label: '미니멀' },
              { id: 7, label: '매거진' },
              { id: 9, label: '필름' },
            ] as const).map((opt) => {
              const active = (data.content.classicLightboxVariant ?? 1) === opt.id
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => updateNestedData('content.classicLightboxVariant', opt.id)}
                  className={`px-2 py-2 rounded-lg border text-[11px] transition-colors ${active ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 bg-white text-gray-600 hover:text-gray-900'}`}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* 간지 */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-900 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="9" cy="9" r="2" />
            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
          </svg>
          간지 (사이 페이지)
        </h3>
        <p className="text-sm text-gray-500">섹션 사이에 들어가는 사진/인용 페이지입니다. 타입별로 사진을 추가하세요.</p>
        <ClassicInterstitialEditor
          value={data.content.classicInterstitials}
          onChange={(list) => updateNestedData('content.classicInterstitials', list)}
          invitationId={invitationId || undefined}
        />
      </section>

      {/* 예식 일정 사진 */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-900 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
          </svg>
          예식 일정
        </h3>
        {/* 달력 디자인 선택 */}
        <div className="space-y-2 rounded-lg border border-gray-200 p-4 bg-gray-50/50">
          <p className="text-sm font-medium text-gray-700">달력 디자인</p>
          <div className="grid grid-cols-3 gap-1.5">
            {([
              { id: 'classic', label: '기본' },
              { id: '2b', label: '풀 그리드' },
              { id: '2c', label: '다크' },
              { id: '2d', label: '티켓' },
              { id: '2e', label: '에디토리얼' },
            ] as const).map((opt) => {
              const active = (data.content.classicDateStyle || 'classic') === opt.id
              return (
                <button key={opt.id} type="button" onClick={() => updateNestedData('content.classicDateStyle', opt.id)} className={`px-2 py-2 rounded-md border text-xs transition-colors ${active ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-400'}`}>
                  {opt.label}
                </button>
              )
            })}
          </div>
          <p className="text-[10px] text-gray-400 leading-tight">기본 외 디자인(풀그리드·다크·티켓·에디토리얼)은 각자 고유 색상·레이아웃을 사용하며, 사진 없이 타이포 중심입니다.</p>
          <div className="pt-1">
            <ColorField label="포인트 색상 (예식일 강조·하트·디데이)" value={data.content.classicDatePointColor || '#c06a5b'} onChange={(hex) => updateNestedData('content.classicDatePointColor', hex)} />
          </div>
          <div className="pt-1">
            <p className="text-sm font-medium text-gray-700 mb-1.5">달력 숫자 폰트</p>
            <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden">
              {([
                { id: 'display', label: '영문 폰트' },
                { id: 'body', label: '한글 폰트' },
              ] as const).map((opt) => {
                const active = (data.content.classicDateNumFont || 'display') === opt.id
                return (
                  <button key={opt.id} type="button" onClick={() => updateNestedData('content.classicDateNumFont', opt.id)} className={`px-4 py-1.5 text-xs transition-colors ${active ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 hover:text-gray-800'}`}>
                    {opt.label}
                  </button>
                )
              })}
            </div>
            <p className="text-[10px] text-gray-400 leading-tight mt-1">달력 날짜 숫자에 적용할 폰트 (기본: 영문 디스플레이 폰트)</p>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">상단 문구</Label>
          <Input
            value={data.content.classicDateHeading || ''}
            onChange={(e) => updateNestedData('content.classicDateHeading', e.target.value)}
            placeholder="저희가 하나 되는 날"
          />
        </div>
        {(data.content.classicDateStyle || 'classic') === 'classic' && (
        <div className="space-y-3 rounded-lg border border-gray-200 p-4 bg-gray-50/50">
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={data.content.classicDatePhotoEnabled !== false} onChange={(e) => updateNestedData('content.classicDatePhotoEnabled', e.target.checked)} />
            사진 표시
          </label>
          {data.content.classicDatePhotoEnabled !== false && (
            <div className="space-y-3 pt-3 border-t border-gray-200">
              <div>
                <span className="text-sm font-medium text-gray-700">사진 프레임</span>
              </div>
              <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden">
                {([
                  { id: 'heart', label: '하트' },
                  { id: 'stamp', label: '우표' },
                ] as const).map((opt) => {
                  const active = (data.content.classicDateFrame || 'heart') === opt.id
                  return (
                    <button key={opt.id} type="button" onClick={() => updateNestedData('content.classicDateFrame', opt.id)} className={`px-4 py-1.5 text-xs transition-colors ${active ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 hover:text-gray-800'}`}>
                      {opt.label}
                    </button>
                  )
                })}
              </div>
              <ClassicPhotoField
                value={data.content.classicDatePhoto}
                onChange={(p) => updateNestedData('content.classicDatePhoto', p)}
                invitationId={invitationId || undefined}
                aspectRatio={5 / 4}
                containerWidth={150}
              />
            </div>
          )}
          {data.content.classicDatePhotoEnabled === false && (
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer pt-3 border-t border-gray-200">
              <input type="checkbox" checked={data.content.classicDateBird !== false} onChange={(e) => updateNestedData('content.classicDateBird', e.target.checked)} />
              비둘기 장식 표시
            </label>
          )}
        </div>
        )}
      </section>

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
            <div className="flex items-center gap-3 pt-1">
              <ColorField
                label="오버레이 색상"
                value={data.content.classicDirectionsOverlayColor || '#1C100D'}
                onChange={(hex) => updateNestedData('content.classicDirectionsOverlayColor', hex)}
              />
              <div className="flex-1">
                <div className="flex justify-between text-[11px] text-gray-500 mb-1"><span>오버레이 투명도</span><span>{Math.round((data.content.classicDirectionsOverlayOpacity ?? 0) * 100)}%</span></div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={Math.round((data.content.classicDirectionsOverlayOpacity ?? 0) * 100)}
                  onChange={(e) => updateNestedData('content.classicDirectionsOverlayOpacity', Number(e.target.value) / 100)}
                  className="w-full accent-gray-900"
                />
              </div>
            </div>
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
          <div className="space-y-1.5 pt-3 border-t border-gray-200">
            <Label className="text-sm font-medium">추가 안내 (선택)</Label>
            <p className="text-[10px] text-gray-400 leading-tight">필요시 제목과 내용을 넣으면 오시는 길 하단에 표시됩니다.</p>
            <Input
              value={data.content.classicDirectionsExtraTitle || ''}
              onChange={(e) => updateNestedData('content.classicDirectionsExtraTitle', e.target.value)}
              placeholder="예: 주차 안내 / 셔틀버스 운행"
            />
            <Textarea
              value={data.content.classicDirectionsExtraBody || ''}
              onChange={(e) => updateNestedData('content.classicDirectionsExtraBody', e.target.value)}
              placeholder="예: 예식 30분 전부터 정문 앞에서 셔틀버스를 운행합니다."
              rows={3}
              className="resize-none"
            />
          </div>
        </div>
      </section>

      {/* 마무리 감사 인사 */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-900 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          마무리 감사 인사
        </h3>
        <p className="text-sm text-gray-500">청첩장 마지막(공유) 섹션에 표시되는 감사 인사입니다.</p>
        <Textarea
          value={data.content.classicThankYou || ''}
          onChange={(e) => updateNestedData('content.classicThankYou', e.target.value)}
          placeholder={'귀한 걸음으로 축복해 주시는\n모든 분께 진심으로 감사드립니다.'}
          rows={3}
          className="resize-none"
        />
        <div className="space-y-3 rounded-lg border border-gray-200 p-4 bg-gray-50/50">
          <span className="text-sm font-medium text-gray-700">감사 인사 프레임</span>
          <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden">
            {([
              { id: 'none', label: '없음' },
              { id: 'doily', label: '도일리' },
            ] as const).map((opt) => {
              const active = (data.content.classicThanksFrame || 'none') === opt.id
              return (
                <button key={opt.id} type="button" onClick={() => updateNestedData('content.classicThanksFrame', opt.id)} className={`px-4 py-1.5 text-xs transition-colors ${active ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 hover:text-gray-800'}`}>
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="space-y-2 rounded-lg border border-gray-200 p-4 bg-gray-50/50">
          <span className="text-sm font-medium text-gray-700">배치</span>
          <p className="text-[10px] text-gray-400 leading-tight">배경 사진 구도에 맞춰 문구·버튼 위치를 선택하세요.</p>
          <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden">
            {([
              { id: 'center', label: '중간' },
              { id: 'top', label: '상단(버튼 하단)' },
              { id: 'bottom', label: '둘다 하단' },
            ] as const).map((opt) => {
              const active = (data.content.classicThanksLayout || 'center') === opt.id
              return (
                <button key={opt.id} type="button" onClick={() => updateNestedData('content.classicThanksLayout', opt.id)} className={`px-3 py-1.5 text-xs transition-colors ${active ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 hover:text-gray-800'}`}>
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="space-y-3 rounded-lg border border-gray-200 p-4 bg-gray-50/50">
          <div>
            <p className="text-sm font-medium text-gray-700">섹션 배경 (선택)</p>
            <p className="text-[10px] text-gray-400 leading-tight">감사 인사(공유) 섹션 전체 배경 사진 + 오버레이. 배경을 넣으면 아래에서 글자색을 지정하세요.</p>
          </div>
          <ClassicPhotoField
            value={data.content.classicThanksSectionBg}
            onChange={(p) => updateNestedData('content.classicThanksSectionBg', p)}
            invitationId={invitationId || undefined}
            aspectRatio={16 / 10}
            containerWidth={200}
          />
          <div className="flex items-center gap-3">
            <ColorField label="오버레이 색상" value={data.content.classicThanksSectionOverlayColor || '#1C100D'} onChange={(hex) => updateNestedData('content.classicThanksSectionOverlayColor', hex)} />
            <div className="flex-1">
              <div className="flex justify-between text-[11px] text-gray-500 mb-1"><span>오버레이 투명도</span><span>{thanksSecOp}%</span></div>
              <input type="range" min={0} max={100} value={thanksSecOp} onChange={(e) => updateNestedData('content.classicThanksSectionOverlayOpacity', Number(e.target.value) / 100)} className="w-full accent-gray-900" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ColorField label="이미지 배경 텍스트" value={data.content.classicThanksImgTextColor || '#FFFFFF'} onChange={(hex) => updateNestedData('content.classicThanksImgTextColor', hex)} />
            <div className="flex flex-col">
              <span className="text-sm text-gray-700">이미지 배경 텍스트</span>
              <span className="text-[10px] text-gray-400 leading-tight">배경 사진 위 글자색</span>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
