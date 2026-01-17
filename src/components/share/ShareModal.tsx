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
}: ShareModalProps) {
  const [slug, setSlug] = useState(currentSlug || '')
  const [isCheckingSlug, setIsCheckingSlug] = useState(false)
  const [slugError, setSlugError] = useState('')
  const [slugAvailable, setSlugAvailable] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [qrColor, setQrColor] = useState('#000000')
  const [copied, setCopied] = useState(false)
  const [pageViews, setPageViews] = useState({ total: 0, today: 0 })
  const qrCanvasRef = useRef<HTMLCanvasElement>(null)

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const invitationUrl = `${baseUrl}/invitation/${invitationId}`

  // Generate default slug
  useEffect(() => {
    if (!slug && groomName && brideName) {
      const year = weddingDate ? new Date(weddingDate).getFullYear() : new Date().getFullYear()
      const defaultSlug = `${groomName}-${brideName}-${year}`.toLowerCase().replace(/\s/g, '')
      setSlug(defaultSlug)
    }
  }, [groomName, brideName, weddingDate, slug])

  // Generate QR code
  useEffect(() => {
    if (invitationUrl && qrCanvasRef.current) {
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
  }, [invitationUrl, qrColor])

  const checkSlugAvailability = async () => {
    if (!slug) return

    setIsCheckingSlug(true)
    setSlugError('')
    setSlugAvailable(false)

    try {
      const response = await fetch(`/api/invitations/check-slug?slug=${encodeURIComponent(slug)}`)
      const data: { available?: boolean } = await response.json()

      if (data.available) {
        setSlugAvailable(true)
      } else {
        setSlugError('이미 사용 중인 URL입니다.')
      }
    } catch {
      setSlugError('확인 중 오류가 발생했습니다.')
    } finally {
      setIsCheckingSlug(false)
    }
  }

  const handleSlugChange = (value: string) => {
    // Only allow lowercase letters, numbers, and hyphens
    const sanitized = value.toLowerCase().replace(/[^a-z0-9-]/g, '')
    setSlug(sanitized)
    setSlugAvailable(false)
    setSlugError('')
  }

  const handleSaveSlug = () => {
    if (slugAvailable && onSlugChange) {
      onSlugChange(slug)
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
        Share?: { sendDefault: (config: object) => void }
      }
    }

    if (typeof window !== 'undefined' && kakaoWindow.Kakao?.Share && kakaoWindow.Kakao.isInitialized?.()) {
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
      const defaultImage = 'https://developers.kakao.com/assets/img/about/logos/kakaolink/kakaolink_btn_medium.png'
      // 카카오 공유에 사용할 이미지 URL 결정
      let imageUrl = defaultImage

      if (thumbnailUrl) {
        if (thumbnailUrl.startsWith('https://')) {
          // 이미 https URL인 경우 그대로 사용
          imageUrl = thumbnailUrl
        } else if (thumbnailUrl.startsWith('/uploads/') || thumbnailUrl.startsWith('/api/r2/')) {
          // 업로드된 이미지 (상대 경로)를 절대 URL로 변환
          // localhost에서는 외부 접근 불가하므로 production URL 사용
          const productionUrl = 'https://dear-drawer.pages.dev'
          imageUrl = `${productionUrl}${thumbnailUrl}`
        }
        // /demo/ 경로 이미지는 기본 이미지 사용 (외부 접근 불가)
      }

      // 세로형 리스트 템플릿 (objectType: 'list')
      kakaoWindow.Kakao.Share.sendDefault({
        objectType: 'list',
        headerTitle: `${groomName} ❤️ ${brideName}의 결혼식`,
        headerLink: {
          mobileWebUrl: invitationUrl,
          webUrl: invitationUrl,
        },
        contents: [
          {
            title: '📅 날짜',
            description: formattedDate,
            imageUrl,
            link: {
              mobileWebUrl: invitationUrl,
              webUrl: invitationUrl,
            },
          },
          {
            title: '🕐 시간',
            description: formattedTime,
            imageUrl,
            link: {
              mobileWebUrl: invitationUrl,
              webUrl: invitationUrl,
            },
          },
          {
            title: '📍 장소',
            description: `${venueDisplay}${venueDetail}`,
            imageUrl,
            link: {
              mobileWebUrl: invitationUrl,
              webUrl: invitationUrl,
            },
          },
        ],
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
    } else {
      // 카카오 SDK 미초기화 시 링크 복사로 대체
      navigator.clipboard.writeText(invitationUrl)
      alert('카카오톡 공유를 사용할 수 없어 링크가 복사되었습니다.\n카카오톡에서 직접 붙여넣기 해주세요.')
    }
  }

  const handleSMSShare = () => {
    const message = `${groomName} ♥ ${brideName} 결혼합니다\n\n저희 결혼식에 초대합니다.\n청첩장 보기: ${invitationUrl}`
    window.open(`sms:?body=${encodeURIComponent(message)}`)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>청첩장 공유하기</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="url" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="url">URL 설정</TabsTrigger>
            <TabsTrigger value="qr">QR 코드</TabsTrigger>
            <TabsTrigger value="share">공유하기</TabsTrigger>
          </TabsList>

          {/* URL Tab */}
          <TabsContent value="url" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>커스텀 URL</Label>
              <div className="flex gap-2">
                <div className="flex-1 flex items-center bg-gray-100 rounded-lg px-3">
                  <span className="text-gray-500 text-sm">invite.deardrawer.com/</span>
                  <Input
                    value={slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    className="border-0 bg-transparent px-1 focus-visible:ring-0"
                    placeholder="custom-url"
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={checkSlugAvailability}
                  disabled={isCheckingSlug || !slug}
                >
                  {isCheckingSlug ? '확인 중...' : '중복 확인'}
                </Button>
              </div>
              {slugError && (
                <p className="text-sm text-red-500">{slugError}</p>
              )}
              {slugAvailable && (
                <p className="text-sm text-green-500">사용 가능한 URL입니다!</p>
              )}
            </div>

            {slugAvailable && (
              <Button onClick={handleSaveSlug} className="w-full">
                URL 저장하기
              </Button>
            )}

            <div className="pt-4 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">총 방문자 수</span>
                <span className="font-medium">{pageViews.total}명</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-gray-500">오늘 방문자</span>
                <span className="font-medium">{pageViews.today}명</span>
              </div>
            </div>
          </TabsContent>

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

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={handleKakaoShare}
                className="h-16 flex-col gap-1"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#3C1E1E">
                  <path d="M12 3C6.477 3 2 6.463 2 10.691c0 2.643 1.765 4.966 4.412 6.286l-.893 3.27a.3.3 0 00.455.334l3.862-2.552c.67.097 1.357.148 2.055.148 5.523 0 10-3.463 10-7.777C22 6.463 17.523 3 12 3z" />
                </svg>
                <span className="text-xs">카카오톡</span>
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
              </Button>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 font-medium mb-2">문자 메시지 템플릿</p>
              <p className="text-sm text-gray-500">
                {groomName} ♥ {brideName} 결혼합니다
                <br /><br />
                저희 결혼식에 초대합니다.
                <br />
                청첩장 보기: {invitationUrl}
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
