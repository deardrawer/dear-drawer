'use client'

import { useState, useEffect, useRef } from 'react'
import QRCode from 'qrcode'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface ShareModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  invitationId: string
  groomName: string
  brideName: string
  weddingDate: string
  weddingTime?: string
  venueName?: string
  venueAddress?: string
  currentSlug?: string
  onSlugChange?: (slug: string) => void
  thumbnailUrl?: string
  shareTitle?: string
  shareDescription?: string
  templateType?: 'our' | 'family' | 'parents' | 'magazine' | 'film' | 'record' | 'exhibit'
}

export default function ShareModal({
  open,
  onOpenChange,
  invitationId,
  groomName,
  brideName,
  weddingDate,
  weddingTime,
  venueName,
  venueAddress,
  currentSlug,
  onSlugChange,
  thumbnailUrl,
  shareTitle,
  shareDescription,
  templateType,
}: ShareModalProps) {
  const [slug, setSlug] = useState(currentSlug || '')
  const [slugError, setSlugError] = useState('')
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [qrColor, setQrColor] = useState('#000000')
  const [copied, setCopied] = useState(false)
  const [isSavingSlug, setIsSavingSlug] = useState(false)
  const [slugSaved, setSlugSaved] = useState(false)
  const [activeTab, setActiveTab] = useState('share')
  const [pageViews, setPageViews] = useState({ total: 0, today: 0 })
  const qrCanvasRef = useRef<HTMLCanvasElement>(null)

  // 공유 URL은 프로덕션 도메인 사용 (카카오 공유 호환성)
  const baseUrl = 'https://invite.deardrawer.com'
  // 템플릿에 따라 경로 분기: Parents는 /invite/, 나머지는 /i/
  const urlPath = templateType === 'parents' ? '/invite/' : '/i/'
  const invitationUrl = `${baseUrl}${urlPath}${currentSlug || invitationId}`

  // Generate default slug
  useEffect(() => {
    if (!slug && groomName && brideName) {
      const year = weddingDate ? new Date(weddingDate).getFullYear() : new Date().getFullYear()
      const defaultSlug = `${groomName}-${brideName}-${year}`.toLowerCase().replace(/\s/g, '')
      setSlug(defaultSlug)
    }
  }, [groomName, brideName, weddingDate, slug])

  // Generate QR code when QR tab is active and canvas is available
  useEffect(() => {
    if (activeTab !== 'qr' || !invitationUrl) return

    // Wait for canvas to mount after tab switch
    const timer = setTimeout(() => {
      if (qrCanvasRef.current) {
        QRCode.toCanvas(qrCanvasRef.current, invitationUrl, {
          width: 256,
          margin: 2,
          color: {
            dark: qrColor,
            light: '#FFFFFF',
          },
        })

        QRCode.toDataURL(invitationUrl, {
          width: 1024,
          margin: 2,
          color: {
            dark: qrColor,
            light: '#FFFFFF',
          },
        }).then(setQrCodeUrl)
      }
    }, 50)

    return () => clearTimeout(timer)
  }, [invitationUrl, qrColor, activeTab])

  const handleSlugChange = (value: string) => {
    const sanitized = value.toLowerCase().replace(/[^a-z0-9-]/g, '')
    setSlug(sanitized)
    setSlugError('')
    setSlugSaved(false)
  }

  const handleSaveSlug = async () => {
    if (!slug.trim() || !invitationId) return

    const slugRegex = /^[a-z0-9-]+$/
    if (!slugRegex.test(slug)) {
      setSlugError('영문 소문자, 숫자, 하이픈(-)만 사용할 수 있습니다')
      return
    }

    setIsSavingSlug(true)
    setSlugError('')

    try {
      // 중복 확인
      const checkRes = await fetch(`/api/invitations/check-slug?slug=${encodeURIComponent(slug)}&excludeId=${invitationId}`)
      const checkData: { available?: boolean } = await checkRes.json()
      if (!checkData.available) {
        setSlugError('이미 사용 중인 주소입니다')
        setIsSavingSlug(false)
        return
      }

      // 저장
      const response = await fetch(`/api/invitations/${invitationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug }),
      })

      if (response.ok) {
        setSlugSaved(true)
        if (onSlugChange) {
          onSlugChange(slug)
        }
        setTimeout(() => setSlugSaved(false), 3000)
      } else {
        setSlugError('주소 변경에 실패했습니다')
      }
    } catch {
      setSlugError('주소 변경에 실패했습니다')
    } finally {
      setIsSavingSlug(false)
    }
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(invitationUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownloadQR = () => {
    if (qrCodeUrl) {
      const link = document.createElement('a')
      link.download = `qrcode-${slug || invitationId}.png`
      link.href = qrCodeUrl
      link.click()
    }
  }

  const handleKakaoShare = () => {
    // Kakao SDK share
    const kakaoWindow = window as typeof window & {
      Kakao?: {
        isInitialized?: () => boolean
        init?: (key: string) => void
        Share?: { sendDefault: (config: object) => void }
      }
    }

    if (typeof window === 'undefined' || !kakaoWindow.Kakao) {
      navigator.clipboard.writeText(invitationUrl)
      alert('카카오톡 공유를 사용할 수 없어 링크가 복사되었습니다.\n카카오톡에서 직접 붙여넣기 해주세요.')
      return
    }

    try {
      // SDK 초기화 확인 및 재초기화
      if (!kakaoWindow.Kakao.isInitialized?.()) {
        const kakaoKey = process.env.NEXT_PUBLIC_KAKAO_JS_KEY || '0890847927f3189d845391481ead8ecc'
        kakaoWindow.Kakao.init?.(kakaoKey)
      }

      if (!kakaoWindow.Kakao.Share?.sendDefault) {
        navigator.clipboard.writeText(invitationUrl)
        alert('카카오톡 공유 준비 중입니다. 링크가 복사되었습니다.')
        return
      }

      // 날짜 포맷팅
      const formattedDate = weddingDate
        ? new Date(weddingDate).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
          })
        : '날짜 미정'

      // 시간 포맷팅
      const formattedTime = weddingTime || '시간 미정'

      // 장소 포맷팅
      const venueDisplay = venueName || '장소 미정'
      const venueDetail = venueAddress ? `\n${venueAddress}` : ''

      // 기본 이미지
      const defaultImage = 'https://invite.deardrawer.com/og-image.png'
      // 카카오 공유에 사용할 이미지 URL 결정
      let imageUrl = defaultImage

      if (thumbnailUrl) {
        if (thumbnailUrl.startsWith('https://')) {
          imageUrl = thumbnailUrl
        } else if (thumbnailUrl.startsWith('/')) {
          const productionUrl = 'https://invite.deardrawer.com'
          imageUrl = `${productionUrl}${thumbnailUrl}`
        }
      }

      // 공유 제목 (커스텀 제목이 있으면 사용, 없으면 기본 형식)
      const displayTitle = shareTitle || `${groomName || '신랑'} ❤️ ${brideName || '신부'}의 결혼식`

      // 공유 설명 (커스텀 설명이 있으면 사용, 없으면 날짜/시간/장소 조합)
      const displayDescription = shareDescription ||
        `${formattedDate} ${formattedTime}\n${venueDisplay}${venueDetail}`

      kakaoWindow.Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
          title: displayTitle,
          description: displayDescription,
          imageUrl,
          link: {
            mobileWebUrl: invitationUrl,
            webUrl: invitationUrl,
          },
        },
        buttons: [
          {
            title: '모바일 청첩장 보기',
            link: {
              mobileWebUrl: invitationUrl,
              webUrl: invitationUrl,
            },
          },
        ],
      })
    } catch (error) {
      console.error('Kakao share error:', error)
      navigator.clipboard.writeText(invitationUrl)
      alert('카카오톡 공유에 실패했습니다. 링크가 복사되었습니다.')
    }
  }

  const handleSMSShare = () => {
    const smsTitle = shareTitle || `${groomName || '신랑'} ♥ ${brideName || '신부'} 결혼합니다`

    // 날짜/시간/장소 정보 포맷팅
    const formattedDate = weddingDate
      ? new Date(weddingDate).toLocaleDateString('ko-KR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          weekday: 'long'
        })
      : ''
    const formattedTime = weddingTime || ''
    const formattedVenue = venueName || ''

    // 공유 설명이 있으면 사용, 없으면 날짜/시간/장소 조합
    let smsDescription = shareDescription
    if (!smsDescription) {
      const details = [formattedDate, formattedTime, formattedVenue].filter(Boolean).join(' / ')
      smsDescription = details || '저희 결혼식에 초대합니다.'
    }

    const message = `${smsTitle}\n\n${smsDescription}\n\n청첩장 보기: ${invitationUrl}`
    window.open(`sms:?body=${encodeURIComponent(message)}`)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>청첩장 공유하기</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="share">공유하기</TabsTrigger>
            <TabsTrigger value="qr">QR 코드</TabsTrigger>
          </TabsList>

          {/* QR Code Tab */}
          <TabsContent value="qr" className="space-y-4 mt-4">
            <div className="flex justify-center">
              <canvas ref={qrCanvasRef} className="rounded-lg" />
            </div>

            <div className="space-y-2">
              <Label>QR 코드 색상</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={qrColor}
                  onChange={(e) => setQrColor(e.target.value)}
                  className="w-10 h-10 rounded border cursor-pointer"
                />
                <Input
                  value={qrColor}
                  onChange={(e) => setQrColor(e.target.value)}
                  className="flex-1 font-mono"
                />
              </div>
            </div>

            <Button onClick={handleDownloadQR} className="w-full">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              PNG 다운로드 (1024x1024)
            </Button>
          </TabsContent>

          {/* Share Tab */}
          <TabsContent value="share" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>청첩장 링크</Label>
              <div className="flex gap-2">
                <Input value={invitationUrl} readOnly className="flex-1" />
                <Button onClick={handleCopyLink}>
                  {copied ? '복사됨!' : '복사'}
                </Button>
              </div>
            </div>

            <div className="flex gap-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex-1 text-center">
                <p className="text-xs text-gray-500">총 방문자</p>
                <p className="text-lg font-semibold">{pageViews.total}명</p>
              </div>
              <div className="w-px bg-gray-200" />
              <div className="flex-1 text-center">
                <p className="text-xs text-gray-500">오늘 방문자</p>
                <p className="text-lg font-semibold">{pageViews.today}명</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={handleKakaoShare}
                className="h-16 flex-col gap-1 bg-[#FEE500] hover:bg-[#FDD835] border-[#FEE500] hover:border-[#FDD835]"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#3C1E1E">
                  <path d="M12 3C6.477 3 2 6.463 2 10.691c0 2.643 1.765 4.966 4.412 6.286l-.893 3.27a.3.3 0 00.455.334l3.862-2.552c.67.097 1.357.148 2.055.148 5.523 0 10-3.463 10-7.777C22 6.463 17.523 3 12 3z" />
                </svg>
                <span className="text-xs text-[#3C1E1E]">카카오톡</span>
              </Button>

              <Button
                variant="outline"
                onClick={handleSMSShare}
                className="h-16 flex-col gap-1"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <span className="text-xs">문자 메시지</span>
                <span className="text-[10px] text-gray-400">(모바일만 가능)</span>
              </Button>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 font-medium mb-2">문자 메시지 템플릿</p>
              <p className="text-sm text-gray-500">
                {shareTitle || `${groomName || '신랑'} ♥ ${brideName || '신부'} 결혼합니다`}
                <br /><br />
                {shareDescription || (() => {
                  const date = weddingDate
                    ? new Date(weddingDate).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })
                    : ''
                  const details = [date, weddingTime, venueName].filter(Boolean).join(' / ')
                  return details || '저희 결혼식에 초대합니다.'
                })()}
                <br /><br />
                청첩장 보기: {invitationUrl}
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
