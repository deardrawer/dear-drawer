'use client'

import { useState } from 'react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useEditorStore } from '@/store/editorStore'
import StoryGeneratorModal from '@/components/ai/StoryGeneratorModal'
import { GeneratedStory } from '@/app/api/ai/generate-story/route'

export default function EditPanel() {
  const { invitation, updateField, updateNestedField, applyAIStory, addStory, removeStory, addInterview, removeInterview } = useEditorStore()
  const [isAIModalOpen, setIsAIModalOpen] = useState(false)

  if (!invitation) return null

  const handleAIComplete = (story: GeneratedStory) => {
    applyAIStory(story)
  }

  // 헬퍼 함수: 스토리 필드 업데이트
  const updateStoryField = (index: number, field: string, value: string) => {
    const stories = [...invitation.relationship.stories]
    stories[index] = { ...stories[index], [field]: value }
    updateNestedField('relationship.stories', stories)
  }

  // 헬퍼 함수: 인터뷰 필드 업데이트
  const updateInterviewField = (index: number, field: string, value: string) => {
    const interviews = [...invitation.content.interviews]
    interviews[index] = { ...interviews[index], [field]: value }
    updateNestedField('content.interviews', interviews)
  }

  // 헬퍼 함수: 인터뷰 이미지 업데이트
  const updateInterviewImages = (index: number, images: string[]) => {
    const interviews = [...invitation.content.interviews]
    interviews[index] = { ...interviews[index], images }
    updateNestedField('content.interviews', interviews)
  }

  // 헬퍼 함수: 인터뷰 이미지 추가 (최대 3장)
  const addInterviewImage = (interviewIndex: number, imageUrl: string) => {
    const interviews = [...invitation.content.interviews]
    const currentImages = interviews[interviewIndex].images || []
    if (currentImages.length < 3) {
      interviews[interviewIndex] = {
        ...interviews[interviewIndex],
        images: [...currentImages, imageUrl]
      }
      updateNestedField('content.interviews', interviews)
    }
  }

  // 헬퍼 함수: 인터뷰 이미지 삭제
  const removeInterviewImage = (interviewIndex: number, imageIndex: number) => {
    const interviews = [...invitation.content.interviews]
    const currentImages = [...(interviews[interviewIndex].images || [])]
    currentImages.splice(imageIndex, 1)
    interviews[interviewIndex] = { ...interviews[interviewIndex], images: currentImages }
    updateNestedField('content.interviews', interviews)
  }
  // 헬퍼 함수: 전화번호 포맷팅 (숫자만 입력, 자동 하이픈)
  const formatPhoneNumber = (value: string): string => {
    const numbers = value.replace(/[^0-9]/g, '').slice(0, 11)
    if (numbers.length <= 3) return numbers
    if (numbers.length <= 6) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`
    if (numbers.length <= 10) return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6)}`
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`
  }

  const handlePhoneChange = (field: string, value: string) => {
    updateNestedField(field, formatPhoneNumber(value))
  }

  return (
    <div className="h-full overflow-y-auto bg-white border-r">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold text-gray-900">청첩장 편집</h2>
        <p className="text-sm text-gray-500">내용을 입력하면 실시간으로 미리보기에 반영됩니다</p>
      </div>

      <Accordion type="multiple" defaultValue={['couple-basic']} className="px-4">

        {/* ===== 1. 신랑신부 기본정보 ===== */}
        <AccordionItem value="couple-basic">
          <AccordionTrigger className="text-base font-medium">
            👫 신랑신부 기본정보
          </AccordionTrigger>
          <AccordionContent className="space-y-6 pb-4">
            {/* 신랑 */}
            <div className="space-y-3 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm font-semibold text-blue-800">신랑</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">이름</Label>
                  <Input
                    value={invitation.groom.name}
                    onChange={(e) => updateNestedField('groom.name', e.target.value)}
                    placeholder="홍길동"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">영문 이름</Label>
                  <Input
                    value={invitation.groom.nameEn}
                    onChange={(e) => updateNestedField('groom.nameEn', e.target.value)}
                    placeholder="GIL DONG"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">연락처</Label>
                <Input
                  value={invitation.groom.phone}
                    onChange={(e) => handlePhoneChange('groom.phone', e.target.value)}
                  placeholder="010-1234-5678"
                />
              </div>
            </div>

            {/* 신부 */}
            <div className="space-y-3 p-4 bg-pink-50 rounded-lg">
              <p className="text-sm font-semibold text-pink-800">신부</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">이름</Label>
                  <Input
                    value={invitation.bride.name}
                    onChange={(e) => updateNestedField('bride.name', e.target.value)}
                    placeholder="김영희"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">영문 이름</Label>
                  <Input
                    value={invitation.bride.nameEn}
                    onChange={(e) => updateNestedField('bride.nameEn', e.target.value)}
                    placeholder="YOUNG HEE"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">연락처</Label>
                <Input
                  value={invitation.bride.phone}
                    onChange={(e) => handlePhoneChange('bride.phone', e.target.value)}
                  placeholder="010-8765-4321"
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* ===== 2. 가족 정보 ===== */}
        <AccordionItem value="family">
          <AccordionTrigger className="text-base font-medium">
            👨‍👩‍👧‍👦 가족 정보
          </AccordionTrigger>
          <AccordionContent className="space-y-6 pb-4">
            {/* 신랑측 */}
            <div className="space-y-3 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm font-semibold text-blue-800">신랑측</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">아버지 성함</Label>
                  <Input
                    value={invitation.groom.father.name}
                    onChange={(e) => updateNestedField('groom.father.name', e.target.value)}
                    placeholder="홍판서"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">아버지 연락처</Label>
                  <Input
                    value={invitation.groom.father.phone}
                    onChange={(e) => handlePhoneChange('groom.father.phone', e.target.value)}
                    placeholder="010-0000-0000"
                  />
                  <div className="flex items-center gap-2 mt-1">
                    <Switch
                      checked={invitation.groom.father.deceased || false}
                      onCheckedChange={(checked) => updateNestedField('groom.father.deceased', checked)}
                    />
                    <span className="text-xs text-gray-500">고인</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">어머니 성함</Label>
                  <Input
                    value={invitation.groom.mother.name}
                    onChange={(e) => updateNestedField('groom.mother.name', e.target.value)}
                    placeholder="김순자"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">어머니 연락처</Label>
                  <Input
                    value={invitation.groom.mother.phone}
                    onChange={(e) => handlePhoneChange('groom.mother.phone', e.target.value)}
                    placeholder="010-0000-0000"
                  />
                  <div className="flex items-center gap-2 mt-1">
                    <Switch
                      checked={invitation.groom.mother.deceased || false}
                      onCheckedChange={(checked) => updateNestedField('groom.mother.deceased', checked)}
                    />
                    <span className="text-xs text-gray-500">고인</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 신부측 */}
            <div className="space-y-3 p-4 bg-pink-50 rounded-lg">
              <p className="text-sm font-semibold text-pink-800">신부측</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">아버지 성함</Label>
                  <Input
                    value={invitation.bride.father.name}
                    onChange={(e) => updateNestedField('bride.father.name', e.target.value)}
                    placeholder="김도현"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">아버지 연락처</Label>
                  <Input
                    value={invitation.bride.father.phone}
                    onChange={(e) => handlePhoneChange('bride.father.phone', e.target.value)}
                    placeholder="010-0000-0000"
                  />
                  <div className="flex items-center gap-2 mt-1">
                    <Switch
                      checked={invitation.bride.father.deceased || false}
                      onCheckedChange={(checked) => updateNestedField('bride.father.deceased', checked)}
                    />
                    <span className="text-xs text-gray-500">고인</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">어머니 성함</Label>
                  <Input
                    value={invitation.bride.mother.name}
                    onChange={(e) => updateNestedField('bride.mother.name', e.target.value)}
                    placeholder="윤서연"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">어머니 연락처</Label>
                  <Input
                    value={invitation.bride.mother.phone}
                    onChange={(e) => handlePhoneChange('bride.mother.phone', e.target.value)}
                    placeholder="010-0000-0000"
                  />
                  <div className="flex items-center gap-2 mt-1">
                    <Switch
                      checked={invitation.bride.mother.deceased || false}
                      onCheckedChange={(checked) => updateNestedField('bride.mother.deceased', checked)}
                    />
                    <span className="text-xs text-gray-500">고인</span>
                  </div>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* ===== 3. 커플 소개 (프로필) ===== */}
        <AccordionItem value="profile">
          <AccordionTrigger className="text-base font-medium">
            💑 커플 소개
          </AccordionTrigger>
          <AccordionContent className="space-y-6 pb-4">
            {/* 신랑 소개 */}
            <div className="space-y-3 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm font-semibold text-blue-800">신랑 소개 (신부가 작성)</p>
              <div className="space-y-1">
                <Label className="text-xs">소개 라벨</Label>
                <Input
                  value={invitation.groom.profile.aboutLabel}
                  onChange={(e) => updateNestedField('groom.profile.aboutLabel', e.target.value)}
                  placeholder="ABOUT GIL DONG"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">서브타이틀</Label>
                <Input
                  value={invitation.groom.profile.subtitle}
                  onChange={(e) => updateNestedField('groom.profile.subtitle', e.target.value)}
                  placeholder="영희가 소개하는 '길동'"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">소개글</Label>
                <Textarea
                  value={invitation.groom.profile.intro}
                  onChange={(e) => updateNestedField('groom.profile.intro', e.target.value)}
                  placeholder="신랑에 대한 소개글을 작성해주세요..."
                  rows={6}
                  className="resize-none text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">태그 (특징)</Label>
                <Input
                  value={invitation.groom.profile.tag}
                  onChange={(e) => updateNestedField('groom.profile.tag', e.target.value)}
                  placeholder="특징 | 말보다 행동파, 은근 먹보"
                />
              </div>
            </div>

            {/* 신부 소개 */}
            <div className="space-y-3 p-4 bg-pink-50 rounded-lg">
              <p className="text-sm font-semibold text-pink-800">신부 소개 (신랑이 작성)</p>
              <div className="space-y-1">
                <Label className="text-xs">소개 라벨</Label>
                <Input
                  value={invitation.bride.profile.aboutLabel}
                  onChange={(e) => updateNestedField('bride.profile.aboutLabel', e.target.value)}
                  placeholder="ABOUT YOUNG HEE"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">서브타이틀</Label>
                <Input
                  value={invitation.bride.profile.subtitle}
                  onChange={(e) => updateNestedField('bride.profile.subtitle', e.target.value)}
                  placeholder="길동이 소개하는 '영희'"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">소개글</Label>
                <Textarea
                  value={invitation.bride.profile.intro}
                  onChange={(e) => updateNestedField('bride.profile.intro', e.target.value)}
                  placeholder="신부에 대한 소개글을 작성해주세요..."
                  rows={6}
                  className="resize-none text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">태그 (특징)</Label>
                <Input
                  value={invitation.bride.profile.tag}
                  onChange={(e) => updateNestedField('bride.profile.tag', e.target.value)}
                  placeholder="특징 | 생각 많음 주의보"
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* ===== 4. 결혼식 정보 ===== */}
        <AccordionItem value="wedding">
          <AccordionTrigger className="text-base font-medium">
            💒 결혼식 정보
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">결혼식 날짜</Label>
                <Input
                  type="date"
                  value={invitation.wedding.date}
                  onChange={(e) => updateNestedField('wedding.date', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">결혼식 시간</Label>
                <Input
                  type="time"
                  value={invitation.wedding.time}
                  onChange={(e) => updateNestedField('wedding.time', e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">시간 표시</Label>
                <Input
                  value={invitation.wedding.timeDisplay}
                  onChange={(e) => updateNestedField('wedding.timeDisplay', e.target.value)}
                  placeholder="오후 4시"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">요일</Label>
                <Input
                  value={invitation.wedding.dayOfWeek}
                  onChange={(e) => updateNestedField('wedding.dayOfWeek', e.target.value)}
                  placeholder="토요일"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">예식장명</Label>
              <Input
                value={invitation.wedding.venue.name}
                onChange={(e) => updateNestedField('wedding.venue.name', e.target.value)}
                placeholder="디어드로어 웨딩홀"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">층/홀</Label>
              <Input
                value={invitation.wedding.venue.hall}
                onChange={(e) => updateNestedField('wedding.venue.hall', e.target.value)}
                placeholder="6층 그랜드홀"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">주소</Label>
              <Input
                value={invitation.wedding.venue.address}
                onChange={(e) => updateNestedField('wedding.venue.address', e.target.value)}
                placeholder="서울시 강남구 테헤란로 123"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">네이버 지도 URL</Label>
                <Input
                  value={invitation.wedding.venue.naverMapUrl}
                  onChange={(e) => updateNestedField('wedding.venue.naverMapUrl', e.target.value)}
                  placeholder="https://map.naver.com/..."
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">카카오 지도 URL</Label>
                <Input
                  value={invitation.wedding.venue.kakaoMapUrl}
                  onChange={(e) => updateNestedField('wedding.venue.kakaoMapUrl', e.target.value)}
                  placeholder="https://map.kakao.com/..."
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* ===== 5. 오시는 길 ===== */}
        <AccordionItem value="directions">
          <AccordionTrigger className="text-base font-medium">
            🚗 오시는 길
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            {/* 자가용 */}
            <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs font-semibold text-gray-700">🚙 자가용</p>
              <Input
                value={invitation.wedding.directions.car.desc}
                onChange={(e) => updateNestedField('wedding.directions.car.desc', e.target.value)}
                placeholder="주차장 안내"
              />
              <Textarea
                value={invitation.wedding.directions.car.route}
                onChange={(e) => updateNestedField('wedding.directions.car.route', e.target.value)}
                placeholder="오시는 경로 안내"
                rows={2}
                className="resize-none text-sm"
              />
            </div>

            {/* 지하철 */}
            <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs font-semibold text-gray-700">🚇 지하철</p>
              <Textarea
                value={invitation.wedding.directions.subway.join('\n')}
                onChange={(e) => updateNestedField('wedding.directions.subway', e.target.value.split('\n'))}
                placeholder="2호선 삼성역 5번 출구 도보 5분&#10;9호선 봉은사역 1번 출구 도보 8분"
                rows={3}
                className="resize-none text-sm"
              />
              <p className="text-[10px] text-gray-400">한 줄에 하나씩 입력</p>
            </div>

            {/* 버스 */}
            <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs font-semibold text-gray-700">🚌 버스</p>
              <div className="space-y-1">
                <Label className="text-[10px]">간선버스</Label>
                <Input
                  value={invitation.wedding.directions.bus.main.join(', ')}
                  onChange={(e) => updateNestedField('wedding.directions.bus.main', e.target.value.split(', ').filter(Boolean))}
                  placeholder="146, 341, 360"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px]">지선버스</Label>
                <Input
                  value={invitation.wedding.directions.bus.branch.join(', ')}
                  onChange={(e) => updateNestedField('wedding.directions.bus.branch', e.target.value.split(', ').filter(Boolean))}
                  placeholder="3412, 4412"
                />
              </div>
            </div>

            {/* 주차 */}
            <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs font-semibold text-gray-700">🅿️ 주차</p>
              <Input
                value={invitation.wedding.directions.parking.location}
                onChange={(e) => updateNestedField('wedding.directions.parking.location', e.target.value)}
                placeholder="건물 지하 1~3층 주차장"
              />
              <Input
                value={invitation.wedding.directions.parking.fee}
                onChange={(e) => updateNestedField('wedding.directions.parking.fee', e.target.value)}
                placeholder="3시간 무료"
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* ===== 6. 우리의 이야기 ===== */}
        <AccordionItem value="stories">
          <AccordionTrigger className="text-base font-medium">
            💕 우리의 이야기
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            <div className="space-y-1">
              <Label className="text-xs">처음 만난 날</Label>
              <Input
                type="date"
                value={invitation.relationship.startDate}
                onChange={(e) => updateNestedField('relationship.startDate', e.target.value)}
              />
            </div>

            {invitation.relationship.stories.map((story, index) => (
              <div key={index} className="space-y-3 p-4 bg-rose-50 rounded-lg relative">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-rose-800">스토리 {index + 1}</p>
                  {invitation.relationship.stories.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeStory(index)}
                      className="text-rose-500 hover:text-rose-700 h-6 px-2"
                    >
                      삭제
                    </Button>
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">날짜/기간</Label>
                  <Input
                    value={story.date}
                    onChange={(e) => updateStoryField(index, 'date', e.target.value)}
                    placeholder="2013. 11. 04 또는 2013 - 2025"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">제목</Label>
                  <Input
                    value={story.title}
                    onChange={(e) => updateStoryField(index, 'title', e.target.value)}
                    placeholder="우리 연애의 시작"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">내용</Label>
                  <Textarea
                    value={story.desc}
                    onChange={(e) => updateStoryField(index, 'desc', e.target.value)}
                    placeholder="스토리 내용을 작성해주세요..."
                    rows={4}
                    className="resize-none text-sm"
                  />
                </div>
              </div>
            ))}

            <Button
              variant="outline"
              size="sm"
              onClick={addStory}
              className="w-full border-dashed"
            >
              + 스토리 추가
            </Button>
          </AccordionContent>
        </AccordionItem>

        {/* ===== 7. 인사말 ===== */}
        <AccordionItem value="greeting">
          <AccordionTrigger className="text-base font-medium">
            ✉️ 인사말
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAIModalOpen(true)}
                className="text-rose-600 border-rose-200 hover:bg-rose-50"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                AI로 문구 작성하기
              </Button>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">인사말</Label>
              <Textarea
                value={invitation.content.greeting}
                onChange={(e) => updateNestedField('content.greeting', e.target.value)}
                placeholder="저희 두 사람이 사랑과 믿음으로 한 가정을 이루게 되었습니다..."
                rows={8}
                className="resize-none"
              />
            </div>

            <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs font-semibold text-gray-700">명언</p>
              <Textarea
                value={invitation.content.quote.text}
                onChange={(e) => updateNestedField('content.quote.text', e.target.value)}
                placeholder='"사랑은 우리를 더 나은 사람으로 만들어 줍니다."'
                rows={2}
                className="resize-none text-sm"
              />
              <Input
                value={invitation.content.quote.author}
                onChange={(e) => updateNestedField('content.quote.author', e.target.value)}
                placeholder="- 노트북"
              />
            </div>

            <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs font-semibold text-gray-700">감사 인사</p>
              <Textarea
                value={invitation.content.thankYou.message}
                onChange={(e) => updateNestedField('content.thankYou.message', e.target.value)}
                placeholder="지금까지 저희를 아껴주신 모든 분들께 감사드립니다."
                rows={3}
                className="resize-none text-sm"
              />
              <Input
                value={invitation.content.thankYou.sign}
                onChange={(e) => updateNestedField('content.thankYou.sign', e.target.value)}
                placeholder="길동 & 영희 올림"
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* ===== 8. 인터뷰 ===== */}
        <AccordionItem value="interviews">
          <AccordionTrigger className="text-base font-medium">
            🎤 인터뷰
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            {invitation.content.interviews.map((interview, index) => (
              <div key={index} className="space-y-3 p-4 bg-amber-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-amber-800">인터뷰 {index + 1}</p>
                  {invitation.content.interviews.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeInterview(index)}
                      className="text-amber-600 hover:text-amber-800 h-6 px-2"
                    >
                      삭제
                    </Button>
                  )}
                </div>

                {/* 인터뷰 사진 (1~3장) */}
                <div className="space-y-2">
                  <Label className="text-xs">사진 (1~3장)</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {[0, 1, 2].map((imgIndex) => {
                      const imageUrl = interview.images?.[imgIndex]
                      return (
                        <div key={imgIndex} className="relative">
                          {imageUrl ? (
                            <div className="relative group">
                              <div
                                className="aspect-square rounded-lg bg-cover bg-center border border-amber-200"
                                style={{ backgroundImage: `url(${imageUrl})` }}
                              />
                              <button
                                onClick={() => removeInterviewImage(index, imgIndex)}
                                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                ×
                              </button>
                            </div>
                          ) : (
                            <label className="aspect-square border-2 border-dashed border-amber-200 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-amber-400 transition-colors bg-white/50">
                              <svg className="w-5 h-5 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                              <span className="text-[10px] text-amber-400 mt-1">추가</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (file) {
                                    // TODO: 실제 업로드 로직으로 교체
                                    const reader = new FileReader()
                                    reader.onload = (event) => {
                                      const result = event.target?.result as string
                                      addInterviewImage(index, result)
                                    }
                                    reader.readAsDataURL(file)
                                  }
                                }}
                              />
                            </label>
                          )}
                        </div>
                      )
                    })}
                  </div>
                  <p className="text-[10px] text-amber-600">
                    인터뷰와 함께 보여줄 사진을 추가하세요
                  </p>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">질문</Label>
                  <Input
                    value={interview.question}
                    onChange={(e) => updateInterviewField(index, 'question', e.target.value)}
                    placeholder="결혼 준비는 어떠했나요?"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">답변</Label>
                  <Textarea
                    value={interview.answer}
                    onChange={(e) => updateInterviewField(index, 'answer', e.target.value)}
                    placeholder="답변 내용을 작성해주세요..."
                    rows={5}
                    className="resize-none text-sm"
                  />
                </div>
              </div>
            ))}

            <Button
              variant="outline"
              size="sm"
              onClick={addInterview}
              className="w-full border-dashed"
            >
              + 인터뷰 추가
            </Button>
          </AccordionContent>
        </AccordionItem>

        {/* ===== 9. 갤러리 ===== */}
        <AccordionItem value="gallery">
          <AccordionTrigger className="text-base font-medium">
            🖼️ 갤러리
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            <div className="space-y-2">
              <Label>대표 이미지</Label>
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center hover:border-rose-300 transition-colors cursor-pointer">
                <svg className="w-8 h-8 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm text-gray-500">클릭하여 이미지 업로드</p>
                <p className="text-xs text-gray-400 mt-1">JPG, PNG (최대 5MB)</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>갤러리 이미지 (최대 6장)</Label>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="aspect-square border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center hover:border-rose-300 transition-colors cursor-pointer"
                  >
                    <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                ))}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* ===== 10. 계좌 정보 ===== */}
        <AccordionItem value="account">
          <AccordionTrigger className="text-base font-medium">
            💳 축의금 계좌
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            {/* 신랑 */}
            <div className="space-y-3 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm font-semibold text-blue-800">신랑측</p>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="은행명"
                  value={invitation.groom.bank.bank}
                  onChange={(e) => updateNestedField('groom.bank.bank', e.target.value)}
                />
                <Input
                  placeholder="예금주"
                  value={invitation.groom.bank.holder}
                  onChange={(e) => updateNestedField('groom.bank.holder', e.target.value)}
                />
              </div>
              <Input
                placeholder="계좌번호"
                value={invitation.groom.bank.account}
                onChange={(e) => updateNestedField('groom.bank.account', e.target.value)}
              />
            </div>

            {/* 신부 */}
            <div className="space-y-3 p-4 bg-pink-50 rounded-lg">
              <p className="text-sm font-semibold text-pink-800">신부측</p>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="은행명"
                  value={invitation.bride.bank.bank}
                  onChange={(e) => updateNestedField('bride.bank.bank', e.target.value)}
                />
                <Input
                  placeholder="예금주"
                  value={invitation.bride.bank.holder}
                  onChange={(e) => updateNestedField('bride.bank.holder', e.target.value)}
                />
              </div>
              <Input
                placeholder="계좌번호"
                value={invitation.bride.bank.account}
                onChange={(e) => updateNestedField('bride.bank.account', e.target.value)}
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* ===== 11. RSVP ===== */}
        <AccordionItem value="rsvp">
          <AccordionTrigger className="text-base font-medium">
            📋 RSVP 설정
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="rsvpEnabled">참석 여부 받기</Label>
                <p className="text-xs text-gray-400">하객이 참석 여부를 회신할 수 있습니다</p>
              </div>
              <Switch
                id="rsvpEnabled"
                checked={invitation.rsvpEnabled}
                onCheckedChange={(checked) => updateNestedField('rsvpEnabled', checked)}
              />
            </div>

            {invitation.rsvpEnabled && (
              <div className="space-y-1">
                <Label className="text-xs">회신 마감일</Label>
                <Input
                  type="date"
                  value={invitation.rsvpDeadline}
                  onChange={(e) => updateNestedField('rsvpDeadline', e.target.value)}
                />
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* ===== 12. 폰트 스타일 ===== */}
        <AccordionItem value="font-style">
          <AccordionTrigger className="text-base font-medium">
            🔤 폰트 스타일
          </AccordionTrigger>
          <AccordionContent className="space-y-3 pb-4">
            <p className="text-xs text-gray-500 mb-3">청첩장의 전체 분위기를 결정하는 폰트 스타일을 선택하세요</p>
            <div className="grid gap-2">
              {/* Classic */}
              <div
                onClick={() => updateField('fontStyle', 'classic')}
                className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  invitation.fontStyle === 'classic'
                    ? 'border-gray-900 bg-gray-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">클래식 엘레강스</span>
                    {invitation.fontStyle === 'classic' && (
                      <span className="text-[10px] bg-gray-900 text-white px-1.5 py-0.5 rounded">선택됨</span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5">Playfair Display + 나눔명조</p>
                  <p style={{ fontFamily: "'Playfair Display', serif" }} className="text-xs mt-1 text-gray-700">
                    The Wedding Day
                  </p>
                </div>
              </div>

              {/* Modern */}
              <div
                onClick={() => updateField('fontStyle', 'modern')}
                className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  invitation.fontStyle === 'modern'
                    ? 'border-gray-900 bg-gray-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">모던 미니멀</span>
                    {invitation.fontStyle === 'modern' && (
                      <span className="text-[10px] bg-gray-900 text-white px-1.5 py-0.5 rounded">선택됨</span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5">Montserrat + 본고딕</p>
                  <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500 }} className="text-xs mt-1 text-gray-700">
                    The Wedding Day
                  </p>
                </div>
              </div>

              {/* Romantic */}
              <div
                onClick={() => updateField('fontStyle', 'romantic')}
                className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  invitation.fontStyle === 'romantic'
                    ? 'border-gray-900 bg-gray-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">로맨틱</span>
                    {invitation.fontStyle === 'romantic' && (
                      <span className="text-[10px] bg-gray-900 text-white px-1.5 py-0.5 rounded">선택됨</span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5">Lora + 고운바탕</p>
                  <p style={{ fontFamily: "'Lora', serif" }} className="text-xs mt-1 text-gray-700 italic">
                    The Wedding Day
                  </p>
                </div>
              </div>

              {/* Contemporary */}
              <div
                onClick={() => updateField('fontStyle', 'contemporary')}
                className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  invitation.fontStyle === 'contemporary'
                    ? 'border-gray-900 bg-gray-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">세련된 현대</span>
                    {invitation.fontStyle === 'contemporary' && (
                      <span className="text-[10px] bg-gray-900 text-white px-1.5 py-0.5 rounded">선택됨</span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5">Cinzel + 고운돋움</p>
                  <p style={{ fontFamily: "'Cinzel', serif" }} className="text-xs mt-1 text-gray-700 tracking-wider">
                    THE WEDDING DAY
                  </p>
                </div>
              </div>

              {/* Luxury */}
              <div
                onClick={() => updateField('fontStyle', 'luxury')}
                className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  invitation.fontStyle === 'luxury'
                    ? 'border-gray-900 bg-gray-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">프리미엄 럭셔리</span>
                    {invitation.fontStyle === 'luxury' && (
                      <span className="text-[10px] bg-gray-900 text-white px-1.5 py-0.5 rounded">선택됨</span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5">EB Garamond + 나눔명조</p>
                  <p style={{ fontFamily: "'EB Garamond', serif" }} className="text-sm mt-1 text-gray-700 italic">
                    The Wedding Day
                  </p>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* ===== 13. 색상 테마 ===== */}
        <AccordionItem value="color-theme">
          <AccordionTrigger className="text-base font-medium">
            🎨 색상 테마
          </AccordionTrigger>
          <AccordionContent className="space-y-3 pb-4">
            <p className="text-xs text-gray-500 mb-3">청첩장의 전체 색상 분위기를 선택하세요</p>
            <div className="grid grid-cols-2 gap-2">
              {/* Classic Rose */}
              <div
                onClick={() => updateField('colorTheme', 'classic-rose')}
                className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  invitation.colorTheme === 'classic-rose'
                    ? 'border-gray-900'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex gap-1 mb-2">
                  <div className="w-5 h-5 rounded-full" style={{ background: '#E91E63' }} />
                  <div className="w-5 h-5 rounded-full" style={{ background: '#D4A574' }} />
                  <div className="w-5 h-5 rounded-full" style={{ background: '#FFF8F5' }} />
                </div>
                <p className="text-xs font-medium">클래식 로즈</p>
                {invitation.colorTheme === 'classic-rose' && (
                  <span className="text-[9px] bg-gray-900 text-white px-1 py-0.5 rounded mt-1 inline-block">선택됨</span>
                )}
              </div>

              {/* Modern Black */}
              <div
                onClick={() => updateField('colorTheme', 'modern-black')}
                className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  invitation.colorTheme === 'modern-black'
                    ? 'border-gray-900'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex gap-1 mb-2">
                  <div className="w-5 h-5 rounded-full" style={{ background: '#1A1A1A' }} />
                  <div className="w-5 h-5 rounded-full" style={{ background: '#888888' }} />
                  <div className="w-5 h-5 rounded-full border border-gray-200" style={{ background: '#FFFFFF' }} />
                </div>
                <p className="text-xs font-medium">모던 블랙</p>
                {invitation.colorTheme === 'modern-black' && (
                  <span className="text-[9px] bg-gray-900 text-white px-1 py-0.5 rounded mt-1 inline-block">선택됨</span>
                )}
              </div>

              {/* Romantic Blush */}
              <div
                onClick={() => updateField('colorTheme', 'romantic-blush')}
                className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  invitation.colorTheme === 'romantic-blush'
                    ? 'border-gray-900'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex gap-1 mb-2">
                  <div className="w-5 h-5 rounded-full" style={{ background: '#D4A5A5' }} />
                  <div className="w-5 h-5 rounded-full" style={{ background: '#C9B8A8' }} />
                  <div className="w-5 h-5 rounded-full" style={{ background: '#FDF8F6' }} />
                </div>
                <p className="text-xs font-medium">로맨틱 블러쉬</p>
                {invitation.colorTheme === 'romantic-blush' && (
                  <span className="text-[9px] bg-gray-900 text-white px-1 py-0.5 rounded mt-1 inline-block">선택됨</span>
                )}
              </div>

              {/* Nature Green */}
              <div
                onClick={() => updateField('colorTheme', 'nature-green')}
                className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  invitation.colorTheme === 'nature-green'
                    ? 'border-gray-900'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex gap-1 mb-2">
                  <div className="w-5 h-5 rounded-full" style={{ background: '#6B8E6B' }} />
                  <div className="w-5 h-5 rounded-full" style={{ background: '#A8B5A0' }} />
                  <div className="w-5 h-5 rounded-full" style={{ background: '#F5F7F4' }} />
                </div>
                <p className="text-xs font-medium">네이처 그린</p>
                {invitation.colorTheme === 'nature-green' && (
                  <span className="text-[9px] bg-gray-900 text-white px-1 py-0.5 rounded mt-1 inline-block">선택됨</span>
                )}
              </div>

              {/* Luxury Navy */}
              <div
                onClick={() => updateField('colorTheme', 'luxury-navy')}
                className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  invitation.colorTheme === 'luxury-navy'
                    ? 'border-gray-900'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex gap-1 mb-2">
                  <div className="w-5 h-5 rounded-full" style={{ background: '#1E3A5F' }} />
                  <div className="w-5 h-5 rounded-full" style={{ background: '#C9A96E' }} />
                  <div className="w-5 h-5 rounded-full" style={{ background: '#F8F9FA' }} />
                </div>
                <p className="text-xs font-medium">럭셔리 네이비</p>
                {invitation.colorTheme === 'luxury-navy' && (
                  <span className="text-[9px] bg-gray-900 text-white px-1 py-0.5 rounded mt-1 inline-block">선택됨</span>
                )}
              </div>

              {/* Sunset Coral */}
              <div
                onClick={() => updateField('colorTheme', 'sunset-coral')}
                className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  invitation.colorTheme === 'sunset-coral'
                    ? 'border-gray-900'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex gap-1 mb-2">
                  <div className="w-5 h-5 rounded-full" style={{ background: '#E8846B' }} />
                  <div className="w-5 h-5 rounded-full" style={{ background: '#F5C7A9' }} />
                  <div className="w-5 h-5 rounded-full" style={{ background: '#FFFAF7' }} />
                </div>
                <p className="text-xs font-medium">선셋 코랄</p>
                {invitation.colorTheme === 'sunset-coral' && (
                  <span className="text-[9px] bg-gray-900 text-white px-1 py-0.5 rounded mt-1 inline-block">선택됨</span>
                )}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* ===== 14. 기타 설정 ===== */}
        <AccordionItem value="settings">
          <AccordionTrigger className="text-base font-medium">
            ⚙️ 기타 설정
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            {/* 드레스코드 */}
            <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-700">👗 드레스코드 안내</p>
                <Switch
                  checked={invitation.content.info.dressCode.enabled}
                  onCheckedChange={(checked) => updateNestedField('content.info.dressCode.enabled', checked)}
                />
              </div>
              {invitation.content.info.dressCode.enabled && (
                <Textarea
                  value={invitation.content.info.dressCode.content}
                  onChange={(e) => updateNestedField('content.info.dressCode.content', e.target.value)}
                  placeholder="드레스코드 안내 내용..."
                  rows={3}
                  className="resize-none text-sm"
                />
              )}
            </div>

            {/* 포토 공유 */}
            <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-700">📸 사진 공유</p>
                <Switch
                  checked={invitation.content.info.photoShare.enabled}
                  onCheckedChange={(checked) => updateNestedField('content.info.photoShare.enabled', checked)}
                />
              </div>
              {invitation.content.info.photoShare.enabled && (
                <>
                  <Textarea
                    value={invitation.content.info.photoShare.content}
                    onChange={(e) => updateNestedField('content.info.photoShare.content', e.target.value)}
                    placeholder="사진 공유 안내 내용..."
                    rows={2}
                    className="resize-none text-sm"
                  />
                  <Input
                    value={invitation.content.info.photoShare.url}
                    onChange={(e) => updateNestedField('content.info.photoShare.url', e.target.value)}
                    placeholder="공유 링크 URL"
                  />
                </>
              )}
            </div>

            {/* 포토부스 */}
            <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-700">📷 포토부스 안내</p>
                <Switch
                  checked={invitation.content.info.photoBooth?.enabled || false}
                  onCheckedChange={(checked) => updateNestedField('content.info.photoBooth.enabled', checked)}
                />
              </div>
              {invitation.content.info.photoBooth?.enabled && (
                <Textarea
                  value={invitation.content.info.photoBooth?.content || ''}
                  onChange={(e) => updateNestedField('content.info.photoBooth.content', e.target.value)}
                  placeholder="예: 1층 로비에 포토부스가 준비되어 있습니다. 즐거운 추억을 남겨주세요!"
                  rows={3}
                  className="resize-none text-sm"
                />
              )}
            </div>

            {/* 화동 안내 */}
            <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-700">🌸 화동 안내</p>
                <Switch
                  checked={invitation.content.info.flowerChild?.enabled || false}
                  onCheckedChange={(checked) => updateNestedField('content.info.flowerChild.enabled', checked)}
                />
              </div>
              {invitation.content.info.flowerChild?.enabled && (
                <Textarea
                  value={invitation.content.info.flowerChild?.content || ''}
                  onChange={(e) => updateNestedField('content.info.flowerChild.content', e.target.value)}
                  placeholder="예: 화동으로 참여해주실 어린이를 모집합니다. (3~7세)"
                  rows={3}
                  className="resize-none text-sm"
                />
              )}
            </div>

            {/* 커스텀 안내 항목들 */}
            {(invitation.content.info.customItems || []).map((item, index) => (
              <div key={item.id} className="space-y-3 p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <Input
                    value={item.title}
                    onChange={(e) => {
                      const items = [...(invitation.content.info.customItems || [])]
                      items[index] = { ...items[index], title: e.target.value }
                      updateNestedField('content.info.customItems', items)
                    }}
                    placeholder="항목 제목"
                    className="text-xs font-semibold flex-1 mr-2 h-7"
                  />
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={item.enabled}
                      onCheckedChange={(checked) => {
                        const items = [...(invitation.content.info.customItems || [])]
                        items[index] = { ...items[index], enabled: checked }
                        updateNestedField('content.info.customItems', items)
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const items = (invitation.content.info.customItems || []).filter((_, i) => i !== index)
                        updateNestedField('content.info.customItems', items)
                      }}
                      className="text-red-500 hover:text-red-700 h-6 px-2"
                    >
                      삭제
                    </Button>
                  </div>
                </div>
                {item.enabled && (
                  <Textarea
                    value={item.content}
                    onChange={(e) => {
                      const items = [...(invitation.content.info.customItems || [])]
                      items[index] = { ...items[index], content: e.target.value }
                      updateNestedField('content.info.customItems', items)
                    }}
                    placeholder="안내 내용을 입력하세요..."
                    rows={3}
                    className="resize-none text-sm"
                  />
                )}
              </div>
            ))}

            {/* 커스텀 항목 추가 버튼 */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const newItem = {
                  id: `custom-${Date.now()}`,
                  title: '',
                  content: '',
                  enabled: true,
                }
                const items = [...(invitation.content.info.customItems || []), newItem]
                updateNestedField('content.info.customItems', items)
              }}
              className="w-full border-dashed"
            >
              + 커스텀 안내 항목 추가
            </Button>
          </AccordionContent>
        </AccordionItem>

      </Accordion>

      <StoryGeneratorModal
        open={isAIModalOpen}
        onOpenChange={setIsAIModalOpen}
        onComplete={handleAIComplete}
      />
    </div>
  )
}
