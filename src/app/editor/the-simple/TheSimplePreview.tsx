'use client'

import { useMemo, useRef, useEffect, useState, useCallback } from 'react'
import type { TheSimpleInvitationData, ImageWithSettings, TheSimpleImageSettings, GalleryImage } from './page'
import { getSectionType } from './utils'
import { useCroppedImageStyle, getImageCropStyleFallback } from '@/hooks/useCroppedImageStyle'
import { resolveDisplayFontFamily, resolveKoreanFontFamily } from './fontOptions'
import { loadKakaoMapSDK } from '@/lib/geunnalKakaoMap'
import { ParkingIcon, BusIcon, SubwayIcon, TrainIcon, ExpressBusIcon, InfoIcon } from '@/components/parents/icons'
import './the-simple-preview.css'

interface TheSimplePreviewProps {
  data: TheSimpleInvitationData
  fullscreen?: boolean
  /** 커버가 활성화된 상태 — 인트로 배경 fade-in 생략 (즉시 표시) */
  skipIntroBgFade?: boolean
}

/* ==========================================================================
 * useContainedOverlay — 에디터 폰 프레임 안에서 모달 오버레이 위치 고정
 * 스크롤 컨테이너를 찾아 absolute 포지셔닝 + 스크롤 잠금 처리.
 * 게스트 뷰(전체 화면)에서는 position:fixed가 유지됨.
 * ========================================================================== */
function useContainedOverlay(
  ref: React.RefObject<HTMLDivElement | null>,
  isOpen: boolean,
) {
  useEffect(() => {
    if (!isOpen || !ref.current) return
    const el = ref.current

    // 가장 가까운 overflow-y:auto/scroll 부모 찾기
    let scrollParent: HTMLElement | null = el.parentElement
    while (scrollParent) {
      const ov = getComputedStyle(scrollParent).overflowY
      if (ov === 'auto' || ov === 'scroll') break
      scrollParent = scrollParent.parentElement
    }

    // body/html이 아닌 스크롤 컨테이너 = 에디터 폰 프레임
    if (
      scrollParent &&
      scrollParent !== document.documentElement &&
      scrollParent !== document.body
    ) {
      const top = scrollParent.scrollTop
      const height = scrollParent.clientHeight
      // 에디터 폰 프레임의 둥근 모서리(border-radius) 안쪽으로 오프셋
      const frameRadius = parseFloat(getComputedStyle(scrollParent.parentElement || scrollParent).borderRadius) || 0
      const inset = Math.ceil(frameRadius)

      el.style.position = 'absolute'
      el.style.top = `${top + inset}px`
      el.style.left = '0'
      el.style.right = '0'
      el.style.bottom = 'auto'
      el.style.height = `${height - inset}px`
      el.style.width = '100%'

      const prev = scrollParent.style.overflowY
      scrollParent.style.overflowY = 'hidden'
      return () => { scrollParent!.style.overflowY = prev }
    }
    // 게스트 뷰: CSS의 position:fixed 그대로 사용
  }, [isOpen, ref])
}

/* ==========================================================================
 * IntersectionObserver 훅 — 한 번 화면에 들어오면 inView=true
 * ========================================================================== */
function useInView<T extends HTMLElement>(
  options?: IntersectionObserverInit
): [React.RefObject<T | null>, boolean] {
  const ref = useRef<T | null>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          io.disconnect()
        }
      },
      { threshold: 0.05, rootMargin: '0px 0px -20% 0px', ...options }
    )
    io.observe(el)
    return () => io.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return [ref, inView]
}

/* ==========================================================================
 * PhotoBox — 신랑/신부 사진 공통 렌더러
 * photo가 없으면 .ts-ph placeholder로 graceful fallback.
 * ========================================================================== */
type PhotoShape = 'circle' | 'square' | 'portrait' | 'arch'

interface PhotoBoxProps {
  photo?: ImageWithSettings
  shape: PhotoShape
  size: number | string
  className?: string
  rounded?: number
}

function PhotoBox({ photo, shape, size, className = '', rounded }: PhotoBoxProps) {
  const aspect = shape === 'arch' ? '5/7' : shape === 'portrait' ? '3/4' : '1/1'
  const radius = shape === 'circle' ? '50%' : shape === 'arch' ? '50% 50% 0 0 / 36% 36% 0 0' : rounded ?? 2
  const widthStyle = typeof size === 'number' ? `${size}px` : size

  const containerStyle: React.CSSProperties = {
    width: widthStyle,
    height: shape === 'arch' || shape === 'portrait' ? 'auto' : undefined,
    aspectRatio: aspect,
    borderRadius: radius,
    overflow: 'hidden',
    position: 'relative',
    flexShrink: 0,
  }

  if (!photo?.url) {
    return <div className={`ts-ph ${className}`} style={containerStyle} />
  }

  return (
    <CropBg
      src={photo.url}
      settings={photo.settings as TheSimpleImageSettings}
      className={className}
      style={containerStyle}
    />
  )
}

/* ==========================================================================
 * getPhotos — photos 배열 우선, 없으면 기존 photo를 배열로 변환
 * ========================================================================== */
function getPhotos(person: { photo?: ImageWithSettings; photos?: ImageWithSettings[] }): ImageWithSettings[] {
  if (person.photos && person.photos.length > 0) return person.photos
  if (person.photo) return [person.photo]
  return []
}

/* ==========================================================================
 * PhotoSlideBox — fade 기반 자동 슬라이드 커플 사진 컴포넌트
 * 1장 이하: 단일 PhotoBox, 2장 이상: fade auto-slide + dot indicators
 * ========================================================================== */
function PhotoSlideBox({
  photos,
  shape,
  size,
  className = '',
  rounded,
  delay = 0,
}: {
  photos: ImageWithSettings[]
  shape: PhotoShape
  size: number | string
  className?: string
  rounded?: number
  delay?: number
}) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [started, setStarted] = useState(delay === 0)
  const resetKey = useRef(0)

  // 초기 지연 타이머
  useEffect(() => {
    if (delay <= 0) return
    const t = setTimeout(() => setStarted(true), delay)
    return () => clearTimeout(t)
  }, [delay])

  // 자동 전환 (5초 간격) — resetKey 변경 시 타이머 재시작
  useEffect(() => {
    if (!started || photos.length <= 1) return
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % photos.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [started, photos.length, resetKey.current]) // eslint-disable-line react-hooks/exhaustive-deps

  // 클릭 시 다음 사진으로 전환 + 자동 슬라이드 타이머 리셋
  const handleClick = () => {
    setCurrentIndex((prev) => (prev + 1) % photos.length)
    resetKey.current += 1
  }

  // 1장 이하: 기존 PhotoBox와 동일
  if (photos.length <= 1) {
    return <PhotoBox photo={photos[0]} shape={shape} size={size} className={className} rounded={rounded} />
  }

  const aspect = shape === 'arch' ? '5/7' : shape === 'portrait' ? '3/4' : '1/1'
  const radius = shape === 'circle' ? '50%' : shape === 'arch' ? '50% 50% 0 0 / 36% 36% 0 0' : rounded ?? 2
  const widthStyle = typeof size === 'number' ? `${size}px` : size

  return (
    <div className={className} style={{ position: 'relative', width: widthStyle, flexShrink: 0 }}>
      <div
        onClick={handleClick}
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: aspect,
          borderRadius: radius,
          overflow: 'hidden',
          cursor: 'pointer',
        }}
      >
        {photos.map((photo, i) => (
          <CropBg
            key={i}
            src={photo.url}
            settings={photo.settings as TheSimpleImageSettings}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              opacity: i === currentIndex ? 1 : 0,
              transition: 'opacity 0.8s ease-in-out',
            }}
          />
        ))}
      </div>
      {/* Dot indicators */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 4,
          marginTop: 6,
        }}
      >
        {photos.map((_, i) => (
          <div
            key={i}
            style={{
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: i === currentIndex ? 'var(--ink, #333)' : 'var(--ink, #333)',
              opacity: i === currentIndex ? 0.7 : 0.2,
              transition: 'opacity 0.3s',
            }}
          />
        ))}
      </div>
    </div>
  )
}

/* ==========================================================================
 * GalleryImg — 갤러리 이미지 공통 렌더러 (imageSettings 적용)
 * ========================================================================== */
interface GalleryImgProps {
  src?: string | null
  settings?: TheSimpleImageSettings
  aspectRatio?: string | number
  className?: string
  style?: React.CSSProperties
  onClick?: () => void
}

function GalleryImg({ src, settings, aspectRatio = '1 / 1', className = '', style, onClick }: GalleryImgProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const exactStyle = useCroppedImageStyle(src ?? undefined, settings, containerRef)

  const containerStyle: React.CSSProperties = {
    aspectRatio: typeof aspectRatio === 'number' ? String(aspectRatio) : aspectRatio,
    background: '#eee',
    overflow: 'hidden',
    position: 'relative',
    cursor: onClick ? 'pointer' : undefined,
    ...style,
  }
  if (!src) return <div className={className} style={containerStyle} />

  // 픽셀 정확값 우선, 없으면 fallback
  const bg = exactStyle || getImageCropStyleFallback(src, settings ?? { scale: 1, positionX: 0, positionY: 0 })
  return (
    <div
      ref={containerRef}
      className={className}
      onClick={onClick}
      style={{
        ...containerStyle,
        ...bg,
      }}
    />
  )
}

/* ==========================================================================
 * CropBg — 크롭 설정을 픽셀 정확하게 렌더링하는 배경 div
 * ========================================================================== */
interface CropBgProps {
  src: string
  settings?: TheSimpleImageSettings
  className?: string
  style?: React.CSSProperties
}

function CropBg({ src, settings, className, style }: CropBgProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const exactStyle = useCroppedImageStyle(src, settings, containerRef)
  const bg = exactStyle || getImageCropStyleFallback(src, settings ?? { scale: 1, positionX: 0, positionY: 0 })
  return <div ref={containerRef} className={className} style={{ ...bg, ...style }} />
}

/* ==========================================================================
 * SectionToggle — 접기/펼치기 토글 래퍼
 * ========================================================================== */
function SectionToggle({
  enabled,
  label,
  children,
  btnStyle = 1,
}: {
  enabled: boolean
  label: string
  children: React.ReactNode
  btnStyle?: number
}) {
  const [open, setOpen] = useState(!enabled) // 토글 비활성이면 항상 열림

  if (!enabled) return <>{children}</>

  const getButtonStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      fontFamily: 'var(--font-ko)',
      fontSize: 12,
      cursor: 'pointer',
      transition: 'all 0.2s',
    }
    switch (btnStyle) {
      case 2:
        return { ...base, background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 20, padding: '8px 24px' }
      case 3:
        return { ...base, background: 'transparent', color: 'var(--mute)', border: 'none', padding: '6px 0', textDecoration: 'underline', textUnderlineOffset: '3px' }
      case 4:
        return { ...base, background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 28px' }
      default:
        return { ...base, color: 'var(--mute)', border: '1px solid var(--line)', borderRadius: 20, padding: '8px 24px', background: 'transparent' }
    }
  }

  const buttonLabel = open
    ? (btnStyle === 3 ? '접기 ▲' : '접기')
    : (btnStyle === 3 ? `${label} ▼` : label)

  return (
    <div>
      {open && children}
      <div style={{ textAlign: 'center', padding: open ? '8px 0 0' : '0' }}>
        <button
          type="button"
          onClick={() => setOpen((p) => !p)}
          style={getButtonStyle()}
        >
          {buttonLabel}
        </button>
      </div>
    </div>
  )
}

/* ==========================================================================
 * AnimatedSection — 각 섹션 variant 컨테이너에 useInView 적용
 * ========================================================================== */
interface AnimatedSectionProps {
  className?: string
  style?: React.CSSProperties
  children: React.ReactNode
}

function AnimatedSection({ className = '', style, children }: AnimatedSectionProps) {
  const [ref, inView] = useInView<HTMLElement>()
  const [settled, setSettled] = useState(false)
  const settledRef = useRef(false)
  const sectionRef = useRef<HTMLElement | null>(null)

  // inView 전환 후 모든 자식 animation이 끝나면 settled → 재트리거 방지
  useEffect(() => {
    if (!inView || settledRef.current) return
    const el = sectionRef.current
    if (!el) return
    const pending = new Set<HTMLElement>()
    el.querySelectorAll<HTMLElement>('[class*="ts-anim-"], [class*="ts-in-anim"]').forEach((child) => {
      if (getComputedStyle(child).animationName !== 'none') pending.add(child)
    })
    if (pending.size === 0) { settledRef.current = true; setSettled(true); return }
    const onEnd = (e: AnimationEvent) => {
      pending.delete(e.target as HTMLElement)
      if (pending.size === 0) {
        settledRef.current = true
        setSettled(true)
        el.removeEventListener('animationend', onEnd)
      }
    }
    el.addEventListener('animationend', onEnd)
    // 안전장치: 4초 후 강제 settled (카운트다운 등 3s+ delay 애니메이션 보호)
    const t = setTimeout(() => { if (!settledRef.current) { settledRef.current = true; setSettled(true); el.removeEventListener('animationend', onEnd) } }, 4000)
    return () => { clearTimeout(t); el.removeEventListener('animationend', onEnd) }
  }, [inView])

  const setRefs = useCallback((el: HTMLElement | null) => {
    sectionRef.current = el
    ;(ref as React.MutableRefObject<HTMLElement | null>).current = el
  }, [ref])

  // inView 전까지 인라인 opacity:0 으로 확실히 숨김 (CSS 로딩 타이밍 무관)
  const mergedStyle: React.CSSProperties = {
    ...style,
    ...(!inView ? { opacity: 0 } : {}),
  }

  return (
    <section ref={setRefs} className={`${className} ${inView ? 'in-view' : ''} ${settled ? 'ts-settled' : ''}`} style={mergedStyle}>
      {children}
    </section>
  )
}

/* ==========================================================================
 * FamilyContactSheet — 연락하기 버튼 + 인라인 펼침 (variant별 레이아웃)
 * V1 클래식: 세로 리스트 (그룹 라벨 + 카드 행)
 * V2 카드: 좌우 2열 그리드 (신랑측 왼쪽 · 신부측 오른쪽)
 * V3 가로: 컴팩트 가로 나열 (이름 + 아이콘만)
 * ========================================================================== */
interface ContactPerson { role: string; name: string; phone: string }

function FamilyContactSheet({
  variant = 1,
  groomName, brideName, groomPhone, bridePhone,
  groomFather, groomMother, brideFather, brideMother,
}: {
  variant?: number
  groomName: string; brideName: string
  groomPhone?: string; bridePhone?: string
  groomFather?: { name: string; phone?: string }
  groomMother?: { name: string; phone?: string }
  brideFather?: { name: string; phone?: string }
  brideMother?: { name: string; phone?: string }
}) {
  const [open, setOpen] = useState(false)

  const groom: ContactPerson[] = [
    groomPhone ? { role: '신랑', name: groomName, phone: groomPhone } : null,
    groomFather?.phone ? { role: '아버지', name: groomFather.name, phone: groomFather.phone } : null,
    groomMother?.phone ? { role: '어머니', name: groomMother.name, phone: groomMother.phone } : null,
  ].filter((c): c is ContactPerson => c !== null)

  const bride: ContactPerson[] = [
    bridePhone ? { role: '신부', name: brideName, phone: bridePhone } : null,
    brideFather?.phone ? { role: '아버지', name: brideFather.name, phone: brideFather.phone } : null,
    brideMother?.phone ? { role: '어머니', name: brideMother.name, phone: brideMother.phone } : null,
  ].filter((c): c is ContactPerson => c !== null)

  if (groom.length === 0 && bride.length === 0) return null

  const smsIcon = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
  const phoneIcon = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  )
  const phoneIconSm = (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  )

  /* V1 — 리스트 (아이콘 + 라벨/이름 + 액션, 구분선) */
  const userIcon = (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  )
  const allV1 = [
    ...groom.map((c) => ({ ...c, group: '신랑측' })),
    ...bride.map((c) => ({ ...c, group: '신부측' })),
  ]
  const renderV1 = () => (
    <div className="ts-fcs-panel ts-fcs-panel--v1">
      {allV1.map((c, i) => {
        const prevGroup = i > 0 ? allV1[i - 1].group : null
        const showLabel = c.group !== prevGroup
        return (
          <div key={`${c.group}-${c.role}`}>
            {showLabel && (
              <div className="ts-fcs-v1-group">{c.group}</div>
            )}
            <div className="ts-fcs-v1-item">
              <div className="ts-fcs-v1-icon">{userIcon}</div>
              <div className="ts-fcs-v1-info">
                <div className="ts-fcs-v1-label">{c.role}</div>
                <div className="ts-fcs-v1-name">{c.name}</div>
              </div>
              <div className="ts-fcs-actions">
                <a href={`sms:${c.phone}`} className="ts-fcs-btn">{smsIcon}</a>
                <a href={`tel:${c.phone}`} className="ts-fcs-btn">{phoneIcon}</a>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )

  /* V2 — 심플 리스트 (신랑측/신부측 구분) */
  const renderV2 = () => (
    <div className="ts-fcs-panel ts-fcs-panel--v2">
      {[{ label: '신랑측', list: groom }, { label: '신부측', list: bride }].map((side) =>
        side.list.length > 0 ? (
          <div key={side.label} className="ts-fcs-simple-group">
            <div className="ts-fcs-simple-label">{side.label}</div>
            {side.list.map((c, i) => (
              <div key={`${side.label}-${i}`} className="ts-fcs-simple-row">
                <div className="ts-fcs-simple-info">
                  <span className="ts-fcs-simple-name">{c.name}</span>
                  <span className="ts-fcs-simple-role">{c.role}</span>
                </div>
                <div className="ts-fcs-actions-sm">
                  <a href={`sms:${c.phone}`} className="ts-fcs-btn-sm">{smsIcon}</a>
                  <a href={`tel:${c.phone}`} className="ts-fcs-btn-sm">{phoneIcon}</a>
                </div>
              </div>
            ))}
          </div>
        ) : null
      )}
    </div>
  )

  /* V3 — 좌우 2열 (신랑측 · 신부측 미러링) */
  const renderV3 = () => (
    <div className="ts-fcs-panel ts-fcs-panel--v3">
      <div className="ts-fcs-grid3">
        {[{ list: groom }, { list: bride }].map((side, si) =>
          side.list.length > 0 ? (
            <div key={si} className="ts-fcs-col3">
              {side.list.map((c) => (
                <div key={`${si}-${c.role}`} className="ts-fcs-row3">
                  <div className="ts-fcs-row3-info">
                    <span className="ts-fcs-row3-name">{c.name}</span>
                    <span className="ts-fcs-row3-role">{c.role}</span>
                  </div>
                  <div className="ts-fcs-actions-sm">
                    <a href={`sms:${c.phone}`} className="ts-fcs-btn-sm">{smsIcon}</a>
                    <a href={`tel:${c.phone}`} className="ts-fcs-btn-sm">{phoneIcon}</a>
                  </div>
                </div>
              ))}
            </div>
          ) : null
        )}
      </div>
    </div>
  )

  return (
    <div className="ts-fcs-wrap ts-anim-item">
      <button type="button" className="ts-fam-contact-btn" onClick={() => setOpen(!open)}>
        <svg className="ts-fam-contact-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
        연락하기
        <svg
          width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          className={`ts-fam-contact-chevron ${open ? 'ts-fam-contact-chevron--open' : ''}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (variant === 3 ? renderV3() : variant === 2 ? renderV2() : renderV1())}
    </div>
  )
}

/* ==========================================================================
 * AccountTabbed — GROOM/BRIDE 탭 전환 + 역할별 계좌 목록 + 복사
 * ========================================================================== */
function AccountTabbed({
  groomRole,
  brideRole,
  groomAccounts,
  brideAccounts,
  groomFather,
  groomMother,
  brideFather,
  brideMother,
  groomFatherName,
  groomMotherName,
  brideFatherName,
  brideMotherName,
  variant = 1,
}: {
  groomRole: string
  brideRole: string
  groomAccounts: Array<{ bank: string; number: string; holder: string }>
  brideAccounts: Array<{ bank: string; number: string; holder: string }>
  groomFather: Array<{ bank: string; number: string; holder: string }>
  groomMother: Array<{ bank: string; number: string; holder: string }>
  brideFather: Array<{ bank: string; number: string; holder: string }>
  brideMother: Array<{ bank: string; number: string; holder: string }>
  groomFatherName?: string
  groomMotherName?: string
  brideFatherName?: string
  brideMotherName?: string
  variant?: number
}) {
  const [tab, setTab] = useState<'groom' | 'bride' | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  const copyAccount = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(text)
      setTimeout(() => setCopied(null), 1500)
    }).catch(() => {})
  }

  const hasGroom = groomAccounts.length > 0 || groomFather.length > 0 || groomMother.length > 0
  const hasBride = brideAccounts.length > 0 || brideFather.length > 0 || brideMother.length > 0

  const rows: Array<{ role: string; name?: string; accounts: Array<{ bank: string; number: string; holder: string }> }> = []
  if (tab === 'groom') {
    if (groomAccounts.length > 0) rows.push({ role: groomRole || '신랑', accounts: groomAccounts })
    if (groomFather.length > 0) rows.push({ role: '아버지', name: groomFatherName, accounts: groomFather })
    if (groomMother.length > 0) rows.push({ role: '어머니', name: groomMotherName, accounts: groomMother })
  } else if (tab === 'bride') {
    if (brideAccounts.length > 0) rows.push({ role: brideRole || '신부', accounts: brideAccounts })
    if (brideFather.length > 0) rows.push({ role: '아버지', name: brideFatherName, accounts: brideFather })
    if (brideMother.length > 0) rows.push({ role: '어머니', name: brideMotherName, accounts: brideMother })
  }

  /* ── 탭 버튼 스타일 (variant별) ── */
  const tabBase: React.CSSProperties = {
    fontFamily: 'var(--font-display)',
    cursor: 'pointer',
    textTransform: 'uppercase',
    transition: 'all 0.2s',
  }

  const getTabStyle = (side: 'groom' | 'bride'): React.CSSProperties => {
    const active = tab === side
    const isRight = side === 'bride'

    // V2 · 둥근 필 탭
    if (variant === 2) {
      return {
        ...tabBase,
        fontSize: 11,
        letterSpacing: '0.12em',
        padding: '9px 0',
        borderRadius: isRight ? '0 20px 20px 0' : '20px 0 0 20px',
        border: '1px solid var(--line)',
        borderLeft: isRight ? 'none' : '1px solid var(--line)',
        background: active ? 'var(--accent)' : 'transparent',
        color: active ? '#fff' : 'var(--mute)',
      }
    }

    // V4 · 언더라인 탭
    if (variant === 4) {
      return {
        ...tabBase,
        fontSize: 11,
        letterSpacing: '0.2em',
        padding: '8px 0 10px',
        border: 'none',
        borderBottom: active ? '2px solid var(--accent)' : '1px solid var(--line)',
        background: 'transparent',
        color: active ? 'var(--accent)' : 'var(--mute)',
      }
    }

    // V5 · 중앙 필 캡슐
    if (variant === 5) {
      return {
        ...tabBase,
        fontSize: 10,
        letterSpacing: '0.25em',
        padding: '8px 0',
        border: 'none',
        background: active ? 'var(--accent)' : 'var(--bg, #f5f5f0)',
        color: active ? '#fff' : 'var(--mute)',
        borderRadius: isRight ? '0 4px 4px 0' : '4px 0 0 4px',
      }
    }

    // V1 · 기본 (직각 보더)
    return {
      ...tabBase,
      fontSize: 12,
      letterSpacing: '0.15em',
      padding: '10px 0',
      border: '1px solid var(--accent)',
      borderLeft: isRight ? 'none' : '1px solid var(--accent)',
      background: active ? 'var(--accent)' : 'transparent',
      color: active ? '#fff' : 'var(--accent)',
    }
  }

  /* ── 리스트 래퍼 스타일 (variant별) ── */
  const getListStyle = (): React.CSSProperties => {
    if (variant === 2) return { padding: '0 4px' }
    if (variant === 4) return {}
    if (variant === 5) return {}
    return { border: '1px solid var(--line)', padding: '0 14px' }
  }

  /* ── 행 구분선 스타일 ── */
  const getRowBorder = (isLast: boolean): React.CSSProperties => {
    if (isLast) return {}
    if (variant === 5) return { borderBottom: '1px dashed var(--line)' }
    return { borderBottom: '1px solid var(--line)' }
  }

  /* ── COPY 버튼 스타일 ── */
  const getCopyStyle = (num: string): React.CSSProperties => {
    const done = copied === num
    if (variant === 2) {
      return {
        fontFamily: 'var(--font-display)',
        fontSize: 9,
        letterSpacing: '0.1em',
        color: done ? 'var(--accent)' : 'var(--mute)',
        background: 'transparent',
        border: '1px solid var(--line)',
        borderRadius: 12,
        padding: '4px 12px',
        cursor: 'pointer',
        flexShrink: 0,
        marginLeft: 10,
        textTransform: 'uppercase' as const,
      }
    }
    if (variant === 4) {
      return {
        fontFamily: 'var(--font-display)',
        fontSize: 10,
        letterSpacing: '0.08em',
        color: done ? 'var(--accent)' : 'var(--accent)',
        background: 'transparent',
        border: 'none',
        borderBottom: '1px solid var(--accent)',
        padding: '2px 0',
        cursor: 'pointer',
        flexShrink: 0,
        marginLeft: 10,
        textTransform: 'uppercase' as const,
      }
    }
    if (variant === 5) {
      return {
        fontFamily: 'var(--font-display)',
        fontSize: 9,
        letterSpacing: '0.15em',
        color: done ? 'var(--accent)' : '#fff',
        background: done ? 'transparent' : 'var(--accent)',
        border: done ? '1px solid var(--accent)' : 'none',
        borderRadius: 2,
        padding: '5px 14px',
        cursor: 'pointer',
        flexShrink: 0,
        marginLeft: 10,
        textTransform: 'uppercase' as const,
      }
    }
    return {
      fontFamily: 'var(--font-display)',
      fontSize: 10,
      letterSpacing: '0.1em',
      color: done ? 'var(--accent)' : 'var(--accent)',
      background: 'transparent',
      border: '1px solid var(--line)',
      padding: '5px 12px',
      cursor: 'pointer',
      flexShrink: 0,
      marginLeft: 10,
      textTransform: 'uppercase' as const,
    }
  }

  return (
    <div>
      {/* 탭 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', marginBottom: 16 }}>
        <button type="button" onClick={() => setTab('groom')} style={getTabStyle('groom')}>
          {groomRole || 'Groom'}
        </button>
        <button type="button" onClick={() => setTab('bride')} style={getTabStyle('bride')}>
          {brideRole || 'Bride'}
        </button>
      </div>

      {/* 계좌 목록 */}
      {tab !== null && (tab === 'groom' ? hasGroom : hasBride) && rows.length > 0 ? (
        <div style={getListStyle()}>
          {rows.map((group, gi) =>
            group.accounts.map((acc, ai) => {
              const isLast = gi === rows.length - 1 && ai === group.accounts.length - 1
              return (
                <div
                  key={`${gi}-${ai}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 0',
                    ...getRowBorder(isLast),
                  }}
                >
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontFamily: 'var(--font-ko)', fontSize: 12, color: 'var(--mute)', marginBottom: 2 }}>
                      {group.role}{group.name ? ` · ${group.name}` : ''}
                    </div>
                    <div style={{ fontFamily: 'var(--font-ko)', fontSize: 12, color: 'var(--ink)', lineHeight: 1.5 }}>
                      <span style={{ color: 'var(--mute)' }}>{acc.bank}</span>
                      <span style={{ marginLeft: 4 }}>{acc.number}</span>
                      {acc.holder && <span style={{ color: 'var(--mute)', marginLeft: 4 }}>({acc.holder})</span>}
                    </div>
                  </div>
                  <button type="button" onClick={() => copyAccount(acc.number)} style={getCopyStyle(acc.number)}>
                    {copied === acc.number ? 'DONE' : 'COPY'}
                  </button>
                </div>
              )
            })
          )}
        </div>
      ) : tab !== null ? (
        <p style={{ textAlign: 'center', fontSize: 11, color: '#b8b0a6', marginTop: 8 }}>
          계좌를 추가하면 여기에 표시됩니다
        </p>
      ) : null}
    </div>
  )
}

/* ==========================================================================
 * TransportInfo — 교통편 안내 (Direction 섹션 공통)
 * ========================================================================== */
const TRANSPORT_ITEMS: Array<{
  key: keyof NonNullable<import('./page').SectionContents['direction']['transport']>
  icon: (props: { size?: number; color?: string }) => React.JSX.Element
  label: string
}> = [
  { key: 'car', icon: ParkingIcon, label: '자가용/주차' },
  { key: 'bus', icon: BusIcon, label: '버스' },
  { key: 'subway', icon: SubwayIcon, label: '지하철' },
  { key: 'train', icon: TrainIcon, label: '기차' },
  { key: 'expressBus', icon: ExpressBusIcon, label: '고속버스' },
]

function TransportInfo({ transport }: { transport?: Record<string, string | undefined> }) {
  if (!transport) return null
  // custom 항목은 customLabel이 있으면 해당 제목 사용
  const allItems = [
    ...TRANSPORT_ITEMS,
    ...(transport.custom ? [{ key: 'custom' as const, icon: InfoIcon, label: transport.customLabel || '안내' }] : []),
  ]
  const items = allItems.filter((t) => transport[t.key])
  if (items.length === 0) return null

  return (
    <div className="ts-transport" style={{ marginTop: 16, textAlign: 'left' }}>
      <div style={{ borderTop: '1px solid var(--line)', paddingTop: 16 }}>
        {items.map((item, i) => {
          const Icon = item.icon
          return (
            <div
              key={item.key}
              style={{
                display: 'flex',
                gap: 10,
                padding: '10px 0',
                borderBottom: i < items.length - 1 ? '1px solid var(--line)' : 'none',
              }}
            >
              <div style={{ flexShrink: 0, paddingTop: 1 }}>
                <Icon size={16} color="var(--accent)" />
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 10, letterSpacing: '0.15em', color: 'var(--accent)', marginBottom: 3 }}>
                  {item.label}
                </div>
                <div style={{ fontFamily: 'var(--font-ko)', fontSize: 12, color: '#5d5850', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
                  {transport[item.key]}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function NavButtons({ address }: { address: string }) {
  const encoded = encodeURIComponent(address)
  const links = [
    { label: '카카오맵', url: `https://map.kakao.com/link/search/${encoded}` },
    { label: '네이버지도', url: `https://map.naver.com/v5/search/${encoded}` },
    { label: '티맵', url: `https://tmap.life/search?query=${encoded}` },
  ]
  return (
    <div className="ts-nav-buttons" style={{ display: 'flex', gap: 8, marginTop: 12 }}>
      {links.map((l) => (
        <a
          key={l.label}
          href={l.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            flex: 1,
            textAlign: 'center',
            padding: '8px 0',
            border: 'none',
            background: 'var(--point)',
            fontFamily: 'var(--font-ko)',
            fontSize: 11,
            color: '#fff',
            textDecoration: 'none',
            letterSpacing: '0.02em',
          }}
        >
          {l.label}
        </a>
      ))}
    </div>
  )
}

/* ==========================================================================
 * GalleryV1Feature — 피처+썸네일 자동 슬라이드 (V1)
 * 메인 이미지 자동 페이드 전환 + 하단 썸네일 클릭 네비게이션.
 * ========================================================================== */
interface GalleryAutoSlideProps {
  images: GalleryImage[]
  galleryEyebrow: string
  onOpenLightbox?: (images: string[], index: number) => void
}

function GalleryV1Feature({ images, galleryEyebrow, onOpenLightbox }: GalleryAutoSlideProps) {
  const total = images.length
  const [activeIdx, setActiveIdx] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined)

  const resetTimer = useCallback(() => {
    clearInterval(intervalRef.current)
    if (total > 1) {
      intervalRef.current = setInterval(() => {
        setActiveIdx(p => (p + 1) % total)
      }, 3500)
    }
  }, [total])

  useEffect(() => {
    resetTimer()
    return () => clearInterval(intervalRef.current)
  }, [resetTimer])

  useEffect(() => {
    if (total > 0 && activeIdx >= total) setActiveIdx(0)
  }, [total, activeIdx])

  const settingsFor = (i: number): TheSimpleImageSettings =>
    images[i]?.settings ?? { scale: 1, positionX: 0, positionY: 0 }

  if (total === 0) {
    return (
      <AnimatedSection className="ts-sec ts-gallery ts-anim-gallery-v1">
        {galleryEyebrow && <div className="ts-eyebrow">{galleryEyebrow}</div>}
        <div style={{ aspectRatio: '4/5', background: '#eee', marginBottom: 6 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6 }}>
          {[0,1,2,3].map(i => <div key={i} style={{ aspectRatio: '1/1', background: '#eee' }} />)}
        </div>
      </AnimatedSection>
    )
  }

  // 하단 썸네일: 현재 이미지 다음 장들 (순환)
  const thumbIndices: number[] = []
  for (let t = 1; t <= Math.min(total - 1, 4); t++) {
    thumbIndices.push((activeIdx + t) % total)
  }

  const webUrls = images.map(img => img.webUrl).filter(Boolean) as string[]

  return (
    <AnimatedSection className="ts-sec ts-gallery ts-anim-gallery-v1">
      {galleryEyebrow && <div className="ts-eyebrow">{galleryEyebrow}</div>}
      {/* 메인 피처 — 무한 루프 페이드 전환 */}
      <div
        className="ts-anim-item ts-anim-delay-1"
        style={{ position: 'relative', aspectRatio: '4/5', overflow: 'hidden', background: '#eee', marginBottom: 6, cursor: 'pointer' }}
        onClick={() => onOpenLightbox?.(webUrls, activeIdx)}
      >
        {images.map((img, i) => (
          <div key={img.id} style={{
            position: 'absolute', inset: 0,
            opacity: i === activeIdx ? 1 : 0,
            transition: 'opacity 0.8s ease',
          }}>
            <GalleryImg
              src={img.webUrl}
              settings={settingsFor(i)}
              aspectRatio="4/5"
              style={{ width: '100%', height: '100%' }}
            />
          </div>
        ))}
        {total > 1 && (
          <div style={{
            position: 'absolute', bottom: 8, right: 10, zIndex: 2,
            background: 'rgba(0,0,0,0.45)', borderRadius: 10,
            padding: '2px 8px', fontSize: 10, color: '#fff',
            letterSpacing: '0.05em',
          }}>
            {activeIdx + 1} / {total}
          </div>
        )}
      </div>
      {/* 다음 장 썸네일 (자동 갱신) */}
      {thumbIndices.length > 0 && (
        <div
          className="ts-anim-item ts-anim-delay-2"
          style={{ display: 'grid', gridTemplateColumns: `repeat(${thumbIndices.length},1fr)`, gap: 6 }}
        >
          {thumbIndices.map((imgIdx) => (
            <div
              key={images[imgIdx].id}
              onClick={() => { onOpenLightbox?.(webUrls, imgIdx) }}
              style={{ cursor: 'pointer' }}
            >
              <GalleryImg src={images[imgIdx].webUrl} settings={settingsFor(imgIdx)} aspectRatio="1/1" />
            </div>
          ))}
        </div>
      )}
    </AnimatedSection>
  )
}

/* ==========================================================================
 * GalleryShowMore — V3/V4/V5 커스텀 레이아웃 + 사진 더보기 접기/펼치기
 * showMoreRow=0 → 전체 표시, 1~N → 해당 행까지만 보이고 "사진 더보기" 버튼
 * ========================================================================== */
function GalleryShowMore({
  instanceId,
  rows,
  showMoreRow,
  v,
  gap,
  galleryEyebrow,
  aspectForCount,
  settingsFor,
  keyFor,
  validSrcs,
  openLightbox,
}: {
  instanceId: string
  rows: Array<{ count: number; items: Array<{ src: string | null; idx: number }> }>
  showMoreRow: number
  v: number
  gap: number
  galleryEyebrow: string
  aspectForCount: (n: number) => string
  settingsFor: (idx: number) => TheSimpleImageSettings | undefined
  keyFor: (idx: number) => string
  validSrcs: string[]
  openLightbox: (srcs: string[], idx: number) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const expandRef = useRef<HTMLDivElement>(null)
  const hasFold = showMoreRow > 0 && rows.length > showMoreRow
  const initialRows = hasFold ? rows.slice(0, showMoreRow) : rows
  const hiddenRows = hasFold ? rows.slice(showMoreRow) : []
  const hiddenCount = hasFold ? hiddenRows.reduce((sum, r) => sum + r.items.filter(i => i.src).length, 0) : 0

  // Animate expand/collapse height
  useEffect(() => {
    const el = expandRef.current
    if (!el) return
    if (expanded) {
      el.style.height = el.scrollHeight + 'px'
      const onEnd = () => { el.style.height = 'auto' }
      el.addEventListener('transitionend', onEnd, { once: true })
    } else {
      if (el.style.height === 'auto') {
        el.style.height = el.scrollHeight + 'px'
        el.offsetHeight // force reflow
      }
      el.style.height = '0px'
    }
  }, [expanded])

  let imgCounter = 0
  return (
    <AnimatedSection className={`ts-sec ts-gallery ts-anim-gallery-v${v}`} key={instanceId}>
      {galleryEyebrow && <div className="ts-eyebrow">{galleryEyebrow}</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap }}>
        {initialRows.map((row, rowIdx) => (
          <div
            key={rowIdx}
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${row.count}, 1fr)`,
              gap,
            }}
          >
            {row.items.map((item) => {
              const delay = imgCounter * (v === 5 ? 180 : 100)
              imgCounter++
              return (
                <div key={keyFor(item.idx)} className="ts-anim-item" style={{ animationDelay: `${delay}ms` }}>
                  <GalleryImg
                    src={item.src}
                    settings={settingsFor(item.idx)}
                    aspectRatio={aspectForCount(row.count)}
                    onClick={item.src ? () => openLightbox(validSrcs, validSrcs.indexOf(item.src!)) : undefined}
                  />
                </div>
              )
            })}
          </div>
        ))}
      </div>
      {hasFold && (
        <>
          <div
            ref={expandRef}
            style={{
              height: 0,
              overflow: 'hidden',
              transition: 'height 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap, paddingTop: gap }}>
              {hiddenRows.map((row, rowIdx) => {
                return (
                  <div
                    key={rowIdx}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: `repeat(${row.count}, 1fr)`,
                      gap,
                      opacity: expanded ? 1 : 0,
                      transform: expanded ? 'translateY(0)' : 'translateY(12px)',
                      transition: `opacity 0.4s ease ${rowIdx * 0.08}s, transform 0.4s ease ${rowIdx * 0.08}s`,
                    }}
                  >
                    {row.items.map((item) => {
                      imgCounter++
                      return (
                        <div key={keyFor(item.idx)}>
                          <GalleryImg
                            src={item.src}
                            settings={settingsFor(item.idx)}
                            aspectRatio={aspectForCount(row.count)}
                            onClick={item.src ? () => openLightbox(validSrcs, validSrcs.indexOf(item.src!)) : undefined}
                          />
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              width: '100%',
              marginTop: 12,
              padding: '10px 0',
              border: '1px solid var(--ink, #333)',
              borderRadius: 4,
              background: 'transparent',
              color: 'var(--ink, #333)',
              fontFamily: 'var(--font-ko)',
              fontSize: 12,
              letterSpacing: '0.03em',
              cursor: 'pointer',
              opacity: 0.7,
              transition: 'opacity 0.2s',
            }}
          >
            {expanded ? '접기' : `사진 더보기 (+${hiddenCount})`}
            <span style={{
              display: 'inline-block',
              transition: 'transform 0.3s',
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              fontSize: 10,
            }}>
              ▼
            </span>
          </button>
        </>
      )}
    </AnimatedSection>
  )
}

/* ==========================================================================
 * GalleryV2Slideshow — 풀 슬라이드쇼 자동 전환 (V2)
 * 자동 스크롤 + 도트 인디케이터 + 좌우 화살표 네비게이션.
 * ========================================================================== */
function GalleryV2Slideshow({ images, galleryEyebrow, onOpenLightbox }: GalleryAutoSlideProps) {
  const total = images.length
  const [activeIdx, setActiveIdx] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined)

  const settingsFor = (i: number): TheSimpleImageSettings =>
    images[i]?.settings ?? { scale: 1, positionX: 0, positionY: 0 }

  const resetTimer = useCallback(() => {
    clearInterval(intervalRef.current)
    if (total > 1) {
      intervalRef.current = setInterval(() => {
        setActiveIdx(prev => (prev + 1) % total)
      }, 3500)
    }
  }, [total])

  useEffect(() => {
    resetTimer()
    return () => clearInterval(intervalRef.current)
  }, [resetTimer])

  useEffect(() => {
    if (total > 0 && activeIdx >= total) setActiveIdx(0)
  }, [total, activeIdx])

  const goPrev = () => {
    setActiveIdx(p => (p - 1 + total) % total)
    resetTimer()
  }
  const goNext = () => {
    setActiveIdx(p => (p + 1) % total)
    resetTimer()
  }

  // placeholder
  if (total === 0) {
    return (
      <AnimatedSection className="ts-sec ts-gallery ts-anim-gallery-v2">
        {galleryEyebrow && <div className="ts-eyebrow">{galleryEyebrow}</div>}
        <div style={{ aspectRatio: '4/5', background: '#eee' }} />
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 12 }}>
          {[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: i === 0 ? '#1a1a1a' : '#d4d4d4' }} />)}
        </div>
      </AnimatedSection>
    )
  }

  const webUrls = images.map(img => img.webUrl).filter(Boolean) as string[]

  return (
    <AnimatedSection className="ts-sec ts-gallery ts-anim-gallery-v2">
      {galleryEyebrow && <div className="ts-eyebrow">{galleryEyebrow}</div>}
      {/* 무한 루프 페이드 슬라이드 + 화살표 */}
      <div style={{ position: 'relative' }}>
        <div
          className="ts-anim-item ts-anim-delay-1"
          style={{ position: 'relative', aspectRatio: '4/5', overflow: 'hidden', background: '#eee', cursor: 'pointer' }}
          onClick={() => onOpenLightbox?.(webUrls, activeIdx)}
        >
          {images.map((img, i) => (
            <div key={img.id} style={{
              position: 'absolute', inset: 0,
              opacity: i === activeIdx ? 1 : 0,
              transition: 'opacity 0.8s ease',
            }}>
              <GalleryImg
                src={img.webUrl}
                settings={settingsFor(i)}
                aspectRatio="4/5"
                style={{ width: '100%', height: '100%' }}
              />
            </div>
          ))}
        </div>
        {/* 좌우 화살표 */}
        {total > 1 && (
          <>
            <button
              type="button"
              onClick={goPrev}
              aria-label="이전"
              style={{
                position: 'absolute', left: 4, top: '50%', transform: 'translateY(-50%)',
                width: 28, height: 28, borderRadius: '50%',
                background: 'rgba(255,255,255,0.65)', border: 'none',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, color: '#333', zIndex: 2,
              }}
            >
              ‹
            </button>
            <button
              type="button"
              onClick={goNext}
              aria-label="다음"
              style={{
                position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)',
                width: 28, height: 28, borderRadius: '50%',
                background: 'rgba(255,255,255,0.65)', border: 'none',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, color: '#333', zIndex: 2,
              }}
            >
              ›
            </button>
          </>
        )}
      </div>
      {/* 도트 인디케이터 */}
      {total > 1 && (
        <div
          className="ts-anim-item ts-anim-delay-2"
          style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 12 }}
        >
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => { setActiveIdx(i); resetTimer() }}
              style={{
                width: 6, height: 6, borderRadius: '50%', padding: 0, border: 'none',
                background: i === activeIdx ? '#1a1a1a' : '#d4d4d4',
                transition: 'background 0.3s', cursor: 'pointer',
              }}
            />
          ))}
        </div>
      )}
    </AnimatedSection>
  )
}

/* ==========================================================================
 * CountingNumber — 0 → target 까지 숫자가 올라가는 카운터
 * 화면에 보이는 순간 requestAnimationFrame 으로 카운팅 시작.
 * easeOutCubic 으로 처음 빠르게, 끝에서 천천히.
 * ========================================================================== */
function CountingNumber({ target, className }: { target: number; className?: string }) {
  const [ref, inView] = useInView<HTMLSpanElement>()
  const [current, setCurrent] = useState(0)
  const hasAnimated = useRef(false)
  const prevTarget = useRef(target)

  useEffect(() => {
    // target 변경 시 재애니메이션 허용
    if (prevTarget.current !== target) {
      hasAnimated.current = false
      prevTarget.current = target
    }
    if (!inView || hasAnimated.current) return
    hasAnimated.current = true

    const duration = 1600
    const start = performance.now()

    function tick(now: number) {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // easeOutCubic
      setCurrent(Math.round(eased * target))
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [inView, target])

  // 목표와 동일한 자릿수로 패딩
  const targetLen = String(target).length
  const digits = String(current).padStart(targetLen, '0').split('')

  return (
    <span ref={ref} className={className}>
      {digits.map((d, i) => (
        <span key={i} className="ts-i5-n ts-count-digit">{d}</span>
      ))}
    </span>
  )
}

/* ==========================================================================
 * LiveCountdown — 실시간 카운트다운 (DAYS : HOUR : MIN : SEC)
 * 1초마다 갱신. 결혼식 전/당일/후 상태별 메시지 표시.
 * ========================================================================== */
function LiveCountdown({ targetDate, beforeMsg, todayMsg, afterMsg }: {
  targetDate: Date
  beforeMsg: string
  todayMsg: string
  afterMsg: string
}) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // 결혼식 시각 기준 판정
  const timeDiff = targetDate.getTime() - now.getTime()
  const isPast = timeDiff <= 0 // 결혼식 시간 지남

  // 날짜 기준 D-day (문구용)
  const todayMid = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const targetMid = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate())
  const dayDiff = Math.round((targetMid.getTime() - todayMid.getTime()) / (1000 * 60 * 60 * 24))
  const isToday = dayDiff === 0 && !isPast

  // 실시간 시분초 계산 (결혼식 시각까지)
  const absDiff = Math.max(0, timeDiff)
  const days = Math.floor(absDiff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((absDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((absDiff % (1000 * 60)) / 1000)

  const pad = (n: number) => String(n).padStart(2, '0')

  // 상태별 메시지
  let message: string
  if (isPast) {
    message = afterMsg
  } else if (isToday) {
    message = todayMsg
  } else {
    message = beforeMsg.replace('{d}', String(dayDiff))
  }

  return (
    <div className="ts-live-countdown">
      {!isPast && (
        <>
          <div className="ts-lcd-labels">
            <span>DAYS</span><span>HOUR</span><span>MIN</span><span>SEC</span>
          </div>
          <div className="ts-lcd-digits">
            <span className="ts-lcd-num">{days}</span>
            <span className="ts-lcd-sep">:</span>
            <span className="ts-lcd-num">{pad(hours)}</span>
            <span className="ts-lcd-sep">:</span>
            <span className="ts-lcd-num">{pad(minutes)}</span>
            <span className="ts-lcd-sep">:</span>
            <span className="ts-lcd-num">{pad(seconds)}</span>
          </div>
        </>
      )}
      <p className="ts-lcd-msg">{message}</p>
    </div>
  )
}

/* ==========================================================================
 * KakaoMapBox — 주소 기반 카카오맵 렌더링
 * Geocoder로 주소→좌표 변환 후 지도 + 마커 표시.
 * SDK 실패 시 회색 placeholder 표시.
 * ========================================================================== */
/* ==========================================================================
 * YouTubeLite — 썸네일 클릭 시 재생 (다른 템플릿과 동일 패턴)
 * ========================================================================== */
function YouTubeLite({ videoId }: { videoId: string }) {
  const [playing, setPlaying] = useState(false)
  const [thumbErr, setThumbErr] = useState(false)

  if (playing) {
    return (
      <div style={{ aspectRatio: '16/9', width: '100%' }}>
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{ width: '100%', height: '100%', border: 'none' }}
          title="YouTube video"
        />
      </div>
    )
  }

  return (
    <div
      onClick={() => setPlaying(true)}
      style={{ aspectRatio: '16/9', width: '100%', position: 'relative', cursor: 'pointer', background: '#000' }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={thumbErr
          ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
          : `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
        onError={() => setThumbErr(true)}
        alt=""
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
      {/* 재생 버튼 오버레이 */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'rgba(0,0,0,0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>
    </div>
  )
}

function KakaoMapBox({
  address,
  venueName,
  aspectRatio = '16 / 10',
  className = '',
}: {
  address: string
  venueName?: string
  aspectRatio?: string
  className?: string
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<unknown>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    // 주소 변경 시 기존 맵 제거 후 재생성
    if (mapRef.current) {
      mapRef.current = null
      if (containerRef.current) containerRef.current.innerHTML = ''
    }
    setFailed(false)
    if (!address || !containerRef.current) return
    let cancelled = false

    loadKakaoMapSDK()
      .then(() => {
        if (cancelled || !containerRef.current) return
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const kakao = (window as any).kakao
        if (!kakao?.maps) { setFailed(true); return }

        const geocoder = new kakao.maps.services.Geocoder()
        geocoder.addressSearch(address, (result: { x: string; y: string }[], status: string) => {
          if (cancelled || !containerRef.current) return
          if (status !== kakao.maps.services.Status.OK || !result[0]) {
            // fallback: 키워드 검색
            const places = new kakao.maps.services.Places()
            const keyword = venueName ? `${venueName} ${address}` : address
            places.keywordSearch(keyword, (pResult: { x: string; y: string }[], pStatus: string) => {
              if (cancelled || !containerRef.current) return
              if (pStatus !== kakao.maps.services.Status.OK || !pResult[0]) {
                setFailed(true)
                return
              }
              createMap(kakao, containerRef.current!, pResult[0].y, pResult[0].x)
            })
            return
          }
          createMap(kakao, containerRef.current!, result[0].y, result[0].x)
        })
      })
      .catch(() => { if (!cancelled) setFailed(true) })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function createMap(kakao: any, el: HTMLDivElement, lat: string, lng: string) {
      const pos = new kakao.maps.LatLng(parseFloat(lat), parseFloat(lng))
      const map = new kakao.maps.Map(el, { center: pos, level: 3 })
      new kakao.maps.Marker({ position: pos, map })
      mapRef.current = map
    }

    return () => { cancelled = true }
  }, [address, venueName])

  if (failed || !address) {
    return (
      <div
        className={`ts-ph ${className}`}
        style={{ aspectRatio, background: 'linear-gradient(135deg, #e8e8e8 0%, #d4d4d4 100%)' }}
      />
    )
  }

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ aspectRatio, width: '100%', background: '#eee' }}
    />
  )
}

/* ==========================================================================
 * AddressCopy — 주소 텍스트 + 📋 복사 버튼
 * ========================================================================== */
function AddressCopy({ address, className = '' }: { address: string; className?: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(() => {
    if (!address) return
    navigator.clipboard.writeText(address).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }, [address])

  return (
    <span className={`ts-addr-copy ${className}`}>
      <span className="ts-addr-text">{address}</span>
      <button type="button" className="ts-addr-btn" onClick={handleCopy} title="주소 복사">
        {copied ? (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
        ) : (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
        )}
      </button>
    </span>
  )
}

/* ==========================================================================
 * GuestbookForm — 방명록 글쓰기 폼
 * invitationId가 있으면 실제 API 호출, 없으면 시각적 표시만.
 * ========================================================================== */
function GuestbookForm({
  invitationId,
  onSubmitted,
}: {
  invitationId?: string
  onSubmitted?: () => void
}) {
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = useCallback(async () => {
    if (!name.trim() || !message.trim() || submitting) return
    if (!invitationId) return // 에디터 프리뷰에서는 작동하지 않음
    setSubmitting(true)
    try {
      const res = await fetch('/api/guestbook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invitationId,
          guestName: name.trim(),
          message: message.trim(),
        }),
      })
      if (res.ok) {
        setName('')
        setMessage('')
        setDone(true)
        setTimeout(() => setDone(false), 2000)
        onSubmitted?.()
      }
    } catch {
      // silently fail
    } finally {
      setSubmitting(false)
    }
  }, [name, message, invitationId, submitting, onSubmitted])

  return (
    <div className="ts-gb-form">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="이름"
        maxLength={50}
        className="ts-gb-input"
      />
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="축하 메시지를 남겨주세요"
        maxLength={500}
        rows={3}
        className="ts-gb-textarea"
      />
      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting || !name.trim() || !message.trim()}
        className="ts-gb-submit"
      >
        {done ? '등록 완료!' : submitting ? '등록 중...' : '등록'}
      </button>
    </div>
  )
}

/* ==========================================================================
 * RsvpModal — 참석 의사 모달
 * .ts-preview 안에 absolute로 배치되며, 현재 보이는 영역(스크롤 위치)에
 * 모달을 표시. 모바일 키보드에 의해 필드가 가려지지 않도록 visualViewport 대응.
 * ========================================================================== */
function RsvpModal({
  open,
  onClose,
  invitationId,
  showMealOption,
  showShuttleOption,
  showSideOption,
  rsvpNotice,
}: {
  open: boolean
  onClose: () => void
  invitationId?: string
  showMealOption?: boolean
  showShuttleOption?: boolean
  showSideOption?: boolean
  rsvpNotice?: string
}) {
  const [name, setName] = useState('')
  const [attendance, setAttendance] = useState<'attending' | 'not_attending' | 'undecided'>('attending')
  const [count, setCount] = useState(1)
  const [mealAttendance, setMealAttendance] = useState<'yes' | 'no'>('yes')
  const [shuttleBus, setShuttleBus] = useState<'yes' | 'no'>('no')
  const [side, setSide] = useState<'groom' | 'bride'>('groom')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useContainedOverlay(overlayRef, open)

  // 모바일 키보드 대응 + body 스크롤 잠금
  useEffect(() => {
    if (!open) return
    // body 스크롤 잠금
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const vv = window.visualViewport
    if (vv) {
      const handleVVResize = () => {
        if (!contentRef.current) return
        contentRef.current.style.maxHeight = `${(vv.height ?? window.innerHeight) - 40}px`
      }
      vv.addEventListener('resize', handleVVResize)
      handleVVResize()
      return () => {
        document.body.style.overflow = prev
        vv.removeEventListener('resize', handleVVResize)
      }
    }

    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  const handleSubmit = useCallback(async () => {
    if (!name.trim() || submitting) return
    if (!invitationId) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invitationId,
          guestName: name.trim(),
          attendance,
          guestCount: attendance === 'attending' ? count : 0,
          message: message.trim() || undefined,
          ...(showMealOption && attendance === 'attending' ? { mealAttendance } : {}),
          ...(showShuttleOption && attendance === 'attending' ? { shuttleBus } : {}),
          ...(showSideOption ? { side } : {}),
        }),
      })
      if (res.ok) {
        setDone(true)
        setTimeout(() => {
          onClose()
          setDone(false)
          setName('')
          setAttendance('attending')
          setCount(1)
          setMealAttendance('yes')
          setShuttleBus('no')
          setSide('groom')
          setMessage('')
        }, 1500)
      }
    } catch {
      // silently fail
    } finally {
      setSubmitting(false)
    }
  }, [name, attendance, count, mealAttendance, shuttleBus, side, message, invitationId, submitting, onClose, showMealOption, showShuttleOption, showSideOption])

  const [closing, setClosing] = useState(false)

  const handleClose = useCallback(() => {
    setClosing(true)
    setTimeout(() => {
      setClosing(false)
      onClose()
    }, 350)
  }, [onClose])

  if (!open) return null

  return (
    <div
      ref={overlayRef}
      className={`ts-rsvp-modal-overlay ${closing ? 'ts-rsvp-modal-overlay--closing' : ''}`}
      onClick={(e) => { if (e.target === overlayRef.current) handleClose() }}
    >
      <div ref={contentRef} className={`ts-rsvp-modal ${closing ? 'ts-rsvp-modal--closing' : ''}`}>
        <div className="ts-rsvp-modal-header">
          <button type="button" className="ts-rsvp-modal-close" onClick={handleClose}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {done ? (
          <div className="ts-rsvp-modal-done">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent, #888)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <div style={{ marginTop: 12, fontFamily: 'var(--font-ko)', fontSize: 14, color: 'var(--ink)' }}>
              감사합니다!
            </div>
          </div>
        ) : (
          <div className="ts-rsvp-modal-body">
            <div className="ts-rsvp-modal-title">참석 의사 전달</div>
            {rsvpNotice && (
              <p style={{
                fontFamily: 'var(--font-ko)',
                fontSize: 11,
                color: 'var(--mute)',
                lineHeight: 1.6,
                marginBottom: 12,
                textAlign: 'center',
                whiteSpace: 'pre-line',
              }}>
                {rsvpNotice}
              </p>
            )}
            <div className="ts-rsvp-modal-fields">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="이름"
                maxLength={50}
                className="ts-rsvp-modal-input"
              />
              {showSideOption && (
                <div>
                  <span style={{ fontFamily: 'var(--font-ko)', fontSize: 13, color: 'var(--ink)', display: 'block', marginBottom: 6 }}>하객 구분</span>
                  <div className="ts-rsvp-modal-toggle">
                    <button type="button" className={`ts-rsvp-modal-opt ${side === 'groom' ? 'active' : ''}`} onClick={() => setSide('groom')}>신랑측</button>
                    <button type="button" className={`ts-rsvp-modal-opt ${side === 'bride' ? 'active' : ''}`} onClick={() => setSide('bride')}>신부측</button>
                  </div>
                </div>
              )}
              <div className="ts-rsvp-modal-toggle ts-rsvp-modal-toggle--3">
                <button
                  type="button"
                  className={`ts-rsvp-modal-opt ${attendance === 'attending' ? 'active' : ''}`}
                  onClick={() => setAttendance('attending')}
                >
                  참석
                </button>
                <button
                  type="button"
                  className={`ts-rsvp-modal-opt ${attendance === 'undecided' ? 'active' : ''}`}
                  onClick={() => setAttendance('undecided')}
                >
                  미정
                </button>
                <button
                  type="button"
                  className={`ts-rsvp-modal-opt ${attendance === 'not_attending' ? 'active' : ''}`}
                  onClick={() => setAttendance('not_attending')}
                >
                  불참
                </button>
              </div>
              {attendance === 'attending' && (
                <div className="ts-rsvp-modal-count">
                  <span style={{ fontFamily: 'var(--font-ko)', fontSize: 13, color: 'var(--ink)' }}>참석 인원</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button
                      type="button"
                      className="ts-rsvp-modal-cnt-btn"
                      onClick={() => setCount((c) => Math.max(1, c - 1))}
                    >
                      -
                    </button>
                    <span style={{ fontFamily: 'var(--font-ko)', fontSize: 16, fontWeight: 600, minWidth: 20, textAlign: 'center' }}>{count}</span>
                    <button
                      type="button"
                      className="ts-rsvp-modal-cnt-btn"
                      onClick={() => setCount((c) => Math.min(10, c + 1))}
                    >
                      +
                    </button>
                  </div>
                </div>
              )}
              {showMealOption && attendance === 'attending' && (
                <div>
                  <span style={{ fontFamily: 'var(--font-ko)', fontSize: 13, color: 'var(--ink)', display: 'block', marginBottom: 6 }}>식사 여부</span>
                  <div className="ts-rsvp-modal-toggle">
                    <button type="button" className={`ts-rsvp-modal-opt ${mealAttendance === 'yes' ? 'active' : ''}`} onClick={() => setMealAttendance('yes')}>식사 예정</button>
                    <button type="button" className={`ts-rsvp-modal-opt ${mealAttendance === 'no' ? 'active' : ''}`} onClick={() => setMealAttendance('no')}>식사 안 함</button>
                  </div>
                </div>
              )}
              {showShuttleOption && attendance === 'attending' && (
                <div>
                  <span style={{ fontFamily: 'var(--font-ko)', fontSize: 13, color: 'var(--ink)', display: 'block', marginBottom: 6 }}>대절버스 이용</span>
                  <div className="ts-rsvp-modal-toggle">
                    <button type="button" className={`ts-rsvp-modal-opt ${shuttleBus === 'yes' ? 'active' : ''}`} onClick={() => setShuttleBus('yes')}>이용 예정</button>
                    <button type="button" className={`ts-rsvp-modal-opt ${shuttleBus === 'no' ? 'active' : ''}`} onClick={() => setShuttleBus('no')}>이용 안 함</button>
                  </div>
                </div>
              )}
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="축하 메시지 (선택)"
                maxLength={500}
                rows={2}
                className="ts-rsvp-modal-textarea"
              />
            </div>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || !name.trim()}
              className="ts-rsvp-modal-submit"
            >
              {submitting ? '전송 중...' : '전송하기'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * THE SIMPLE 청첩장 프리뷰
 *
 * 각 섹션 렌더러는 `variant` 번호를 받아 UI 대안을 분기합니다.
 * 아직 포팅되지 않은 variant는 자동으로 V1 JSX로 폴백합니다.
 */
export default function TheSimplePreview({ data, skipIntroBgFade }: TheSimplePreviewProps) {
  const [rsvpOpen, setRsvpOpen] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [lightboxImages, setLightboxImages] = useState<string[]>([])

  // 게스트북 메시지 fetch (실제 청첩장에서만)
  const [guestbookMessages, setGuestbookMessages] = useState<{ name: string; date: string; text: string }[]>([])
  const [gbFetchKey, setGbFetchKey] = useState(0)

  useEffect(() => {
    if (!data.id) return
    let cancelled = false
    fetch(`/api/guestbook?invitationId=${data.id}`)
      .then((r) => r.ok ? r.json() as Promise<{ data: { guest_name: string; message: string; created_at: string }[] }> : null)
      .then((json) => {
        if (cancelled || !json?.data) return
        setGuestbookMessages(
          json.data.map((m) => {
            const d = new Date(m.created_at)
            return {
              name: m.guest_name,
              date: `${d.getMonth() + 1}.${String(d.getDate()).padStart(2, '0')}`,
              text: m.message,
            }
          }),
        )
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [data.id, gbFetchKey])

  const handleGuestbookSubmitted = useCallback(() => {
    setGbFetchKey((k) => k + 1)
  }, [])

  const openLightbox = useCallback((images: string[], index: number) => {
    setLightboxImages(images)
    setLightboxIndex(index)
    setLightboxOpen(true)
  }, [])

  const weddingMeta = useMemo(() => {
    const date = data.wedding.date ? new Date(data.wedding.date) : new Date('2026-05-16')
    const y = date.getFullYear()
    const m = date.getMonth() + 1
    const d = date.getDate()
    const monthName = date.toLocaleString('en-US', { month: 'long' }).toUpperCase()
    const weekday = date.toLocaleString('ko-KR', { weekday: 'long' })
    return { y, m, d, monthName, weekday }
  }, [data.wedding.date])

  // Variant 1 · 달력 생성 (전체 월)
  const calendar = useMemo(() => {
    const date = data.wedding.date ? new Date(data.wedding.date) : new Date('2026-05-16')
    const year = date.getFullYear()
    const month = date.getMonth()
    const target = date.getDate()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const cells: { day: number | null; pick: boolean }[] = []
    for (let i = 0; i < firstDay; i++) cells.push({ day: null, pick: false })
    for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, pick: d === target })
    while (cells.length % 7 !== 0) cells.push({ day: null, pick: false })
    const rows: { day: number | null; pick: boolean }[][] = []
    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7))
    return rows
  }, [data.wedding.date])

  const groomName = data.groom.name || '한지훈'
  const brideName = data.bride.name || '윤서연'
  const groomNameEn = data.groom.nameEn || ''
  const brideNameEn = data.bride.nameEn || ''
  const venueName = data.wedding.venue.name || '그랜드 하얏트 서울'
  const venueHall = data.wedding.venue.hall || ''
  const venueAddress = data.wedding.venue.address || '서울특별시 용산구 소월로 322'
  const intro = data.sections.intro
  const greeting = data.sections.greeting
  const couple = data.sections.couple
  const info = data.sections.info
  const direction = data.sections.direction
  const interview = data.sections.interview
  const guide = data.sections.guide
  const video = data.sections.video
  const account = data.sections.account
  const rsvp = data.sections.rsvp
  const thanks = data.sections.thanks
  const family = data.sections.family

  // 섹션 렌더러 매핑 — variant 번호에 따라 분기
  // 포팅되지 않은 variant는 V1 JSX로 자동 폴백
  // 두 번째 인자는 섹션 인스턴스 ID (예: 'gallery', 'gallery-1734567890')
  const renderers: Record<string, (variant: number, instanceId: string) => React.ReactNode> = {
    intro: (v) => {
      // 공통 데이터 포맷
      const mm = String(weddingMeta.m).padStart(2, '0')
      const dd = String(weddingMeta.d).padStart(2, '0')
      const yy = weddingMeta.y
      const monthUpper = (weddingMeta.monthName || '').toUpperCase()
      const weekdayUpper = (weddingMeta.weekday || '').toUpperCase()
      const timeDisplay = data.wedding.timeDisplay || '오후 1시'
      const initials = `${groomName.slice(0, 1)}&${brideName.slice(0, 1)}`
      const showNames = intro.showNames || 'korean'
      const textPos = intro.textPosition || 'center'
      const textPosCls = textPos !== 'center' ? ` ts-text-${textPos}` : ''

      // IntroBg 헬퍼 — 사진 or 블랙 배경 렌더링 (V1~V5 공통)
      const introBg = () => {
        const photo = intro.photo
        if (photo?.url) {
          return <CropBg src={photo.url} settings={photo.settings} className="ts-in-bg" style={{ position: 'absolute', inset: 0 }} />
        }
        return <div className="ts-in-bg ts-in-bg--black" />
      }

      // 이름 렌더링 헬퍼 — showNames 값에 따라 렌더
      // mode: 'stack' (줄바꿈), 'inline' (한 줄)
      const renderNames = (mode: 'stack' | 'inline' = 'stack') => {
        if (showNames === 'english') {
          const gEn = groomNameEn || groomName
          const bEn = brideNameEn || brideName
          return mode === 'stack' ? <>{gEn}<br />&amp; {bEn}</> : <>{gEn} &amp; {bEn}</>
        }
        if (showNames === 'custom') {
          const custom = intro.customNames || `${groomName} & ${brideName}`
          const lines = custom.split('\n')
          return <>{lines.map((l, i) => <span key={i}>{i > 0 && <br />}{l}</span>)}</>
        }
        // korean (기본)
        return mode === 'stack' ? <>{groomName}<br />&amp; {brideName}</> : <>{groomName} &amp; {brideName}</>
      }

      // 한글 이름일 때 폰트 크기 축소용 클래스
      const namesCls = showNames === 'english' ? '' : ' ts-names-ko'

      // V1 · Editorial Cover (photo background)
      if (v === 1) {
        const photo = intro.photo
        return (
          <AnimatedSection className="ts-sec" key={`intro-${v}`} style={{ padding: 0 }}>
            <div className={`ts-in1${textPosCls}`}>
              {photo?.url
                ? <CropBg src={photo.url} settings={photo.settings} className={`bg ${skipIntroBgFade ? 'ts-in-anim-cover' : 'ts-in-anim'}`} style={{ position: 'absolute', inset: 0 }} />
                : <div className={`bg ${skipIntroBgFade ? 'ts-in-anim-cover' : 'ts-in-anim'}`} />
              }
              <div className="content">
                <div className="top ts-in-anim">
                  <div>
                    Vol. I
                    <br />
                    <b>MMXXVI</b>
                  </div>
                  <div className="r">
                    <b>Wedding</b>
                    Invitation
                  </div>
                </div>
                <div className="center">
                  <div className="kicker ts-in-anim">{intro.eyebrow || 'The Simple'}</div>
                  <div className="rule ts-in-anim" />
                  <h3 className={`ts-in-anim${namesCls}`}>
                    {renderNames('stack')}
                  </h3>
                  <div className="sub ts-in-anim">
                    {yy} · {mm} · {dd}
                  </div>
                </div>
                <div className="bottom ts-in-anim">
                  <div>
                    <b>Save the Date</b>
                    {weekdayUpper} · {timeDisplay}
                  </div>
                  <div className="r">
                    <b>{venueName}</b>
                    {venueHall && venueHall}
                  </div>
                </div>
              </div>
            </div>
          </AnimatedSection>
        )
      }

      // V2 · Cinematic Fade (다크 배경)
      if (v === 2) {
        const splitBottom = textPos === 'top'
        return (
          <AnimatedSection className="ts-sec" key={`intro-${v}`} style={{ padding: 0 }}>
            <div className={`ts-in2${textPosCls}`}>
              {introBg()}
              <div className="ts-in2-content">
                <div className="eng ts-in-anim">{intro.eyebrow || 'We Invite You'}</div>
                <h3 className={`ts-in-anim${namesCls}`}>
                  {renderNames('stack')}
                </h3>
                {!splitBottom && (
                  <>
                    <div className="rule ts-in-anim" />
                    <div className="date ts-in-anim">{yy} · {mm} · {dd}</div>
                    <div className="day ts-in-anim">{weekdayUpper} · {timeDisplay}</div>
                  </>
                )}
              </div>
              {splitBottom && (
                <div className="ts-in2-bottom ts-in-anim">
                  <div className="date">{yy} · {mm} · {dd}</div>
                  <div className="day">{weekdayUpper} · {timeDisplay}</div>
                </div>
              )}
            </div>
          </AnimatedSection>
        )
      }

      // V3 · Minimal Frame (다크 배경 + 화이트 프레임)
      if (v === 3) {
        return (
          <AnimatedSection className="ts-sec" key={`intro-${v}`} style={{ padding: 0 }}>
            <div className={`ts-in3${textPosCls}`}>
              {introBg()}
              <div className="ts-in3-frame ts-in-anim">
                <div className="ts-in3-inner">
                  <div className="eng ts-in-child">{intro.eyebrow || 'Save the Date'}</div>
                  <h3 className={`ts-in-child${namesCls}`}>
                    {renderNames('inline')}
                  </h3>
                  <div className="date ts-in-child">
                    {monthUpper} · {dd} · {yy}
                  </div>
                </div>
              </div>
            </div>
          </AnimatedSection>
        )
      }

      // V4 · Arch Doorway (아치 문)
      if (v === 4) {
        return (
          <AnimatedSection className="ts-sec" key={`intro-${v}`} style={{ padding: 0 }}>
            <div className="ts-in4">
              <div className="ts-in4-gate ts-in-anim">
                {introBg()}
                <div className="ts-in4-gate-overlay" />
                <div className="ts-in4-gate-text">
                  <div className="eyebrow ts-in-anim">{intro.eyebrow || 'Save the Date'}</div>
                  <div className={`names ts-in-anim${namesCls}`}>
                    {renderNames('stack')}
                  </div>
                  <div className="date ts-in-anim">
                    {monthUpper} · {dd} · {yy}
                  </div>
                </div>
              </div>
              <div className="ts-in4-below">
                <div className="venue ts-in-anim">{venueName}{venueHall && ` · ${venueHall}`}</div>
              </div>
            </div>
          </AnimatedSection>
        )
      }

      // V5 · Editorial Giant Date (에디토리얼)
      if (v === 5) {
        const digits = dd.split('')
        const splitBottom5 = textPos === 'top'
        return (
          <AnimatedSection className="ts-sec" key={`intro-${v}`} style={{ padding: 0 }}>
            <div className={`ts-in5${textPosCls}`}>
              {introBg()}
              <div className="ts-in5-top-bar ts-in-anim">
                <span>청첩장 &mdash; No. 001</span>
                <span>{yy}년 {weddingMeta.m}월</span>
              </div>
              <div className="ts-in5-content">
                <div className="big-number ts-in-anim">
                  {digits.map((d, i) => <span key={i}>{d}</span>)}
                </div>
                <div className="ts-in5-title-block">
                  <div className="eyebrow ts-in-anim">{intro.eyebrow || 'Wedding Ceremony'}</div>
                  <div className={`names ts-in-anim${namesCls}`}>{renderNames('inline')}</div>
                  {!splitBottom5 && (
                    <>
                      <div className="divider ts-in-anim" />
                      <div className="venue-info ts-in-anim">
                        {weekdayUpper} · {timeDisplay}<br />
                        {venueName}{venueHall && ` · ${venueHall}`}
                      </div>
                    </>
                  )}
                </div>
              </div>
              {splitBottom5 && (
                <div className="ts-in5-bottom-info ts-in-anim">
                  <div className="venue-info">
                    {weekdayUpper} · {timeDisplay}
                  </div>
                  <div className="venue-name">
                    {venueName}{venueHall && ` · ${venueHall}`}
                  </div>
                </div>
              )}
              <div className="ts-in5-bottom-bar ts-in-anim">
                <div className="open-label">
                  열기
                  <div className="arrow-line" />
                </div>
                <div className="page-num">01 / 01</div>
              </div>
            </div>
          </AnimatedSection>
        )
      }

      // V6 · Ticket Band (티켓)
      if (v === 6) {
        const tickerItems = [
          intro.eyebrow || 'Save the Date',
          `${monthUpper} ${dd}, ${yy}`,
          renderNames('inline'),
          venueName,
        ]
        const tickerBottom = [
          weekdayUpper,
          venueHall || 'Grand Ballroom',
          timeDisplay,
          `${groomName} & ${brideName}`,
        ]
        return (
          <AnimatedSection className="ts-sec" key={`intro-${v}`} style={{ padding: 0 }}>
            <div className="ts-in6">
              {introBg()}
              <div className="ts-in6-band ts-in-anim">
                <div className="ts-in6-band-inner">
                  {tickerItems.map((item, i) => <span key={i}>{item}</span>)}
                  {tickerItems.map((item, i) => <span key={`dup-${i}`}>{item}</span>)}
                </div>
              </div>
              <div className="ts-in6-center">
                <div className="eyebrow ts-in-anim">{intro.eyebrow || 'Wedding Invitation'}</div>
                <div className={`names ts-in-anim${namesCls}`}>{renderNames('inline')}</div>
                <div className="rule ts-in-anim" />
                <div className="date ts-in-anim">
                  {yy} · {mm} · {dd}
                </div>
              </div>
              <div className="ts-in6-band ts-in-anim">
                <div className="ts-in6-band-inner reverse">
                  {tickerBottom.map((item, i) => <span key={i}>{item}</span>)}
                  {tickerBottom.map((item, i) => <span key={`dup-${i}`}>{item}</span>)}
                </div>
              </div>
            </div>
          </AnimatedSection>
        )
      }

      // V7 · Crosshair Grid (그리드)
      if (v === 7) {
        return (
          <AnimatedSection className="ts-sec" key={`intro-${v}`} style={{ padding: 0 }}>
            <div className={`ts-in7${textPosCls}`}>
              {introBg()}
              <div className="h-line ts-in-anim" />
              <div className="h-line ts-in-anim" />
              <div className="v-line ts-in-anim" />
              <div className="v-line ts-in-anim" />
              <div className="corner corner--tl ts-in-anim" />
              <div className="corner corner--tr ts-in-anim" />
              <div className="corner corner--bl ts-in-anim" />
              <div className="corner corner--br ts-in-anim" />
              <div className="ts-in7-content">
                <div className="tag ts-in-anim">No. 001 — {intro.eyebrow || 'Wedding Invitation'}</div>
                <div className={`names ts-in-anim${namesCls}`}>{renderNames('inline')}</div>
                <div className="date ts-in-anim">{monthUpper} {dd}, {yy} · {weekdayUpper}</div>
              </div>
            </div>
          </AnimatedSection>
        )
      }

      // V8 · Monogram Seal (실) — 항상 영문 이니셜
      if (v === 8) {
        const gEn = groomNameEn || groomName
        const bEn = brideNameEn || brideName
        const enInitials = `${gEn.slice(0, 1).toUpperCase()}&${bEn.slice(0, 1).toUpperCase()}`
        return (
          <AnimatedSection className="ts-sec" key={`intro-${v}`} style={{ padding: 0 }}>
            <div className="ts-in8">
              <div className="seal ts-in-anim">
                <div className="monogram">{enInitials}</div>
              </div>
              <div className="ts-in8-below">
                <div className="names ts-in-anim">{gEn.toUpperCase()} &amp; {bEn.toUpperCase()}</div>
                <div className="rule ts-in-anim" />
                <div className="date ts-in-anim">{monthUpper} · {dd} · {yy}</div>
                <div className="venue ts-in-anim">{venueName}</div>
              </div>
            </div>
          </AnimatedSection>
        )
      }

      // V9 · Horizontal Rule Stack (룰스택)
      if (v === 9) {
        return (
          <AnimatedSection className="ts-sec" key={`intro-${v}`} style={{ padding: 0 }}>
            <div className={`ts-in9${textPosCls}`}>
              {introBg()}
              <div className="ts-in9-stack">
                <div className="h-line ts-in-anim" />
                <div className="h-row eyebrow ts-in-anim">{intro.eyebrow || 'Wedding Invitation'}</div>
                <div className="h-line ts-in-anim" />
                <div className={`h-row names ts-in-anim${namesCls}`}>
                  {renderNames('stack')}
                </div>
                <div className="h-line ts-in-anim" />
                <div className="h-row meta ts-in-anim">
                  {yy} · {mm} · {dd} · {weekdayUpper}
                  <span>{venueName}{venueHall && ` · ${venueHall}`}</span>
                </div>
                <div className="h-line ts-in-anim" />
              </div>
            </div>
          </AnimatedSection>
        )
      }

      // Fallback to V1
      return null
    },

    greeting: (v) => {
      // V2 · Karaoke Fill (회색→검정 채워지기, 줄 단위 stagger)
      if (v === 2) {
        const bodyLines = (greeting.body || '').split('\n')
        const ruleDelay = 800 + bodyLines.length * 550
        return (
          <AnimatedSection className="ts-sec ts-greet ts-greet--v2 ts-anim-greet-v2" key={`greeting-${v}`} style={{ textAlign: 'left' }}>
            <div className="ts-greet-label ts-anim-item">{greeting.label}</div>
            <div className="ts-greet-title ts-anim-item" style={{ marginTop: 14, marginBottom: 24 }}>
              {greeting.title}
            </div>
            {bodyLines.map((line, i) => (
              <div
                className="ts-g2-karaoke"
                key={i}
                style={{ animationDelay: `${800 + i * 550}ms`, minHeight: line.trim() ? undefined : '0.5em' }}
              >
                {line}
              </div>
            ))}
            <div
              className="ts-greet-rule ts-anim-rule"
              style={{ marginLeft: 0, marginTop: 28, animationDelay: `${ruleDelay}ms` }}
            />
          </AnimatedSection>
        )
      }
      // V3 · 인용 블록 (이탤릭 quote + attribution)
      if (v === 3) {
        return (
          <AnimatedSection className="ts-sec ts-greet ts-greet--v3 ts-anim-greet-v3" key={`greeting-${v}`}>
            <blockquote className="ts-g3-quote ts-anim-item">
              {greeting.body}
              <span className="ts-g3-attr">— {greeting.label || 'INVITATION'} —</span>
            </blockquote>
          </AnimatedSection>
        )
      }
      // V4 · 프레임 박스
      if (v === 4) {
        return (
          <AnimatedSection className="ts-sec ts-greet ts-greet--v4 ts-anim-greet-v4" key={`greeting-${v}`}>
            <div className="ts-g4-frame ts-anim-card">
              <div
                className="ts-greet-title ts-anim-item"
                style={{ fontFamily: 'var(--font-display)', fontSize: 22, letterSpacing: '0.12em', marginBottom: 14 }}
              >
                {greeting.title || 'SAVE THE DATE'}
              </div>
              <p className="ts-greet-body ts-anim-item" style={{ fontSize: 13, lineHeight: 2 }}>
                {greeting.body}
              </p>
              <div
                className="ts-anim-item"
                style={{
                  marginTop: 18,
                  fontFamily: 'var(--font-ko)',
                  fontSize: 13,
                  color: 'var(--mute)',
                }}
              >
                {groomName} · {brideName}
              </div>
            </div>
          </AnimatedSection>
        )
      }
      // V5 · Vertical Rule (좌측 세로선 + 우측 텍스트)
      if (v === 5) {
        return (
          <AnimatedSection
            className="ts-sec ts-greet ts-greet--v5 ts-anim-greet-v5"
            key={`greeting-${v}`}
          >
            <div className="ts-g5-bar ts-anim-vline" />
            <div className="ts-g5-txt">
              <div className="ts-greet-label ts-anim-item" style={{ textAlign: 'left' }}>
                {greeting.label || 'WE INVITE YOU'}
              </div>
              <div
                className="ts-greet-title ts-anim-item"
                style={{ textAlign: 'left', fontSize: 17, lineHeight: 1.9, margin: '10px 0 14px' }}
              >
                {greeting.title}
              </div>
              <p
                className="ts-greet-body ts-anim-item"
                style={{ textAlign: 'left', fontSize: 13, lineHeight: 2 }}
              >
                {greeting.body}
              </p>
            </div>
          </AnimatedSection>
        )
      }
      // V1 (default · classic centered)
      return (
        <AnimatedSection className="ts-sec ts-greet ts-anim-greet-v1" key={`greeting-${v}`}>
          <div className="ts-greet-label ts-anim-item">{greeting.label}</div>
          <div className="ts-greet-title ts-anim-item" style={{ margin: '14px 0 18px' }}>{greeting.title}</div>
          <p className="ts-greet-body ts-anim-item" style={{ marginBottom: 12 }}>{greeting.body}</p>
        </AnimatedSection>
      )
    },

    couple: (v) => {
      // 순서 변경 지원 — bride-first이면 신부/신랑 순
      const bf = couple.order === 'bride-first'
      const first = bf ? { side: 'bride' as const, role: couple.bride.role, name: brideName, bio: couple.bride.bio, photos: getPhotos(couple.bride), tags: couple.bride.tags } : { side: 'groom' as const, role: couple.groom.role, name: groomName, bio: couple.groom.bio, photos: getPhotos(couple.groom), tags: couple.groom.tags }
      const second = bf ? { side: 'groom' as const, role: couple.groom.role, name: groomName, bio: couple.groom.bio, photos: getPhotos(couple.groom), tags: couple.groom.tags } : { side: 'bride' as const, role: couple.bride.role, name: brideName, bio: couple.bride.bio, photos: getPhotos(couple.bride), tags: couple.bride.tags }
      const pair = [first, second]

      // 태그 렌더 헬퍼 (V3 제외 모든 variant에서 사용)
      const renderTags = (tags?: string[], variant?: string, align?: 'left' | 'right' | 'center') => {
        if (!tags || tags.length === 0) return null
        const cls = variant ? `ts-c-tags ts-c-tags--${variant}` : 'ts-c-tags'
        const st = align ? { justifyContent: align === 'right' ? 'flex-end' : align === 'center' ? 'center' : 'flex-start' } : undefined
        return (
          <div className={cls} style={st}>
            {tags.map((tag, ti) => (
              <span key={ti}>{tag.startsWith('#') ? tag : `#${tag}`}</span>
            ))}
          </div>
        )
      }

      // V2 · 세로 스택 · 큰 포토 프레임
      if (v === 2) {
        return (
          <AnimatedSection className="ts-sec ts-couple ts-couple--v2 ts-anim-couple-v2" key={`couple-${v}`}>
            <div className="ts-eyebrow">{couple.eyebrow}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
              {pair.map((p, i) => (
                <div
                  key={i}
                  className={`ts-anim-row ts-anim-delay-${i + 1}`}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '88px 1fr',
                    gap: 18,
                    alignItems: 'center',
                  }}
                >
                  <PhotoSlideBox photos={p.photos} shape="circle" size={88} delay={i * 500} />
                  <div style={{ textAlign: 'left' }}>
                    <div className="ts-couple-role" style={{ marginBottom: 4 }}>{p.role}</div>
                    <div className="ts-couple-name" style={{ fontSize: 18 }}>{p.name}</div>
                    <p className="ts-couple-bio" style={{ textAlign: 'left', maxWidth: '100%', marginTop: 6 }}>{p.bio}</p>
                    {renderTags(p.tags, 'v2', 'left')}
                  </div>
                </div>
              ))}
            </div>
          </AnimatedSection>
        )
      }
      // V3 · 오버랩 포트레이트 (사진 겹침 + 하단 이름/bio — 태그 없음)
      if (v === 3) {
        return (
          <AnimatedSection className="ts-sec ts-couple ts-couple--v3 ts-anim-couple-v3" key={`couple-${v}`}>
            <div className="ts-eyebrow">{couple.eyebrow}</div>
            <div className="ts-c3-photos">
              <div className="ts-c3-photo ts-c3-photo--left ts-anim-photo-l">
                <PhotoSlideBox photos={first.photos} shape="portrait" size="100%" rounded={4} delay={0} />
              </div>
              <div className="ts-c3-photo ts-c3-photo--right ts-anim-photo-r">
                <PhotoSlideBox photos={second.photos} shape="portrait" size="100%" rounded={4} delay={500} />
              </div>
            </div>
            <div className="ts-c3-names ts-anim-item">
              <span className="ts-c3-name">{first.name}</span>
              <span className="ts-c3-amp">&amp;</span>
              <span className="ts-c3-name">{second.name}</span>
            </div>
            {(first.bio || second.bio) && (
              <div className="ts-c3-bio ts-anim-item">
                {first.bio && <p>{first.bio}</p>}
                {second.bio && <p>{second.bio}</p>}
              </div>
            )}
          </AnimatedSection>
        )
      }
      // V4 · 카드 그리드 (박스 + 상단 풀 3:4 사진)
      if (v === 4) {
        return (
          <AnimatedSection className="ts-sec ts-couple ts-couple--v4 ts-anim-couple-v4" key={`couple-${v}`}>
            <div className="ts-eyebrow">{couple.eyebrow}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {pair.map((p, i) => (
                <div
                  key={i}
                  className={`ts-anim-card ts-anim-delay-${i + 1}`}
                  style={{ padding: 0, textAlign: 'center', overflow: 'hidden' }}
                >
                  <PhotoSlideBox photos={p.photos} shape="portrait" size="100%" rounded={0} delay={i * 500} />
                  <div style={{ padding: '14px 12px 18px' }}>
                    <div className="ts-couple-role">{p.role}</div>
                    <div className="ts-couple-name" style={{ marginTop: 2 }}>{p.name}</div>
                    <p className="ts-couple-bio" style={{ margin: '8px auto 0', fontSize: 11 }}>{p.bio}</p>
                    {renderTags(p.tags, 'v4', 'center')}
                  </div>
                </div>
              ))}
            </div>
          </AnimatedSection>
        )
      }
      // V5 · 좌우 분할 + 센터 라인
      if (v === 5) {
        return (
          <AnimatedSection className="ts-sec ts-couple ts-couple--v5 ts-anim-couple-v5" key={`couple-${v}`}>
            <div className="ts-eyebrow">{couple.eyebrow}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1px 1fr', alignItems: 'start', gap: 18 }}>
              {/* 좌측 */}
              <div className="ts-anim-left" style={{ textAlign: 'right', paddingRight: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
                  <PhotoSlideBox photos={first.photos} shape="square" size={100} delay={0} />
                </div>
                <div className="ts-couple-role">{first.role}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, lineHeight: 1.2, margin: '4px 0' }}>{first.name}</div>
                <p className="ts-couple-bio" style={{ textAlign: 'right', maxWidth: '100%', marginLeft: 'auto', fontSize: 11 }}>{first.bio}</p>
                {renderTags(first.tags, 'v5', 'right')}
              </div>
              {/* 세로선 */}
              <div className="ts-anim-vline" style={{ background: 'var(--accent)', width: 1, minHeight: 180, opacity: 0.3 }} />
              {/* 우측 */}
              <div className="ts-anim-right" style={{ textAlign: 'left', paddingLeft: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 10 }}>
                  <PhotoSlideBox photos={second.photos} shape="square" size={100} delay={500} />
                </div>
                <div className="ts-couple-role">{second.role}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, lineHeight: 1.2, margin: '4px 0' }}>{second.name}</div>
                <p className="ts-couple-bio" style={{ textAlign: 'left', maxWidth: '100%', fontSize: 11 }}>{second.bio}</p>
                {renderTags(second.tags, 'v5', 'left')}
              </div>
            </div>
          </AnimatedSection>
        )
      }
      // V1 (default) · 좌우 원형 아바타 + & + 이름
      return (
        <AnimatedSection className="ts-sec ts-couple ts-anim-couple-v1" key={`couple-${v}`}>
          <div className="ts-eyebrow">{couple.eyebrow}</div>
          <div className="ts-couple-grid">
            <div className="ts-couple-cell ts-anim-left">
              <PhotoSlideBox photos={first.photos} shape="arch" size={120} className="ts-couple-avatar" delay={0} />
              <div className="ts-couple-role">{first.role}</div>
              <div className="ts-couple-name">{first.name}</div>
              <p className="ts-couple-bio">{first.bio}</p>
              {renderTags(first.tags, 'v1', 'center')}
            </div>
            <div className="ts-couple-amp ts-anim-amp">&amp;</div>
            <div className="ts-couple-cell ts-anim-right">
              <PhotoSlideBox photos={second.photos} shape="arch" size={120} className="ts-couple-avatar" delay={500} />
              <div className="ts-couple-role">{second.role}</div>
              <div className="ts-couple-name">{second.name}</div>
              <p className="ts-couple-bio">{second.bio}</p>
              {renderTags(second.tags, 'v1', 'center')}
            </div>
          </div>
        </AnimatedSection>
      )
    },

    family: (v) => {
      if (!family) return null
      const decStyle = family.deceasedStyle || 'flower'

      const decIcon = (deceased?: boolean) => {
        if (!deceased) return null
        if (decStyle === 'hanja') return <span className="ts-fam-deceased">故</span>
        return (
          <img
            src="/icons/chrysanthemum.svg"
            alt="고인"
            className="ts-fam-chrysanthemum"
          />
        )
      }

      const renderParentLine = (
        father: { name: string; phone?: string; deceased?: boolean } | undefined,
        mother: { name: string; phone?: string; deceased?: boolean } | undefined,
      ) => {
        const parts: React.ReactNode[] = []
        if (father?.name) {
          parts.push(<span key="f">{decIcon(father.deceased)}{father.name}</span>)
        }
        if (mother?.name) {
          if (parts.length > 0) parts.push(<span key="dot" className="ts-fam-dot"> · </span>)
          parts.push(<span key="m">{decIcon(mother.deceased)}{mother.name}</span>)
        }
        if (parts.length === 0) return null
        return <span className="ts-fam-parents">{parts}</span>
      }

      const renderRelation = (
        father: { name: string; deceased?: boolean } | undefined,
        mother: { name: string; deceased?: boolean } | undefined,
        childName: string,
        gender: 'son' | 'daughter',
      ) => {
        const parentLine = renderParentLine(father, mother)
        if (!parentLine) return null
        return (
          <span className="ts-fam-line">
            <span className="ts-fam-parents">
              {parentLine}
              <span className="ts-fam-relation">의 {gender === 'son' ? '아들' : '딸'}</span>
            </span>
            <span className="ts-fam-child">{childName}</span>
          </span>
        )
      }

      const contactSheet = family.showContact ? (
        <FamilyContactSheet
          variant={v}
          groomName={groomName || '신랑'}
          brideName={brideName || '신부'}
          groomPhone={data.groom.phone}
          bridePhone={data.bride.phone}
          groomFather={family.groomFather}
          groomMother={family.groomMother}
          brideFather={family.brideFather}
          brideMother={family.brideMother}
        />
      ) : null

      const famPhoto = (aspectClass: string) => {
        if (!family.photo?.url) return (
          <div className={`ts-fam-photo ${aspectClass} ts-ph ts-anim-item`} />
        )
        return (
          <div className={`ts-fam-photo ${aspectClass} ts-anim-item`}>
            <CropBg
              src={family.photo.url}
              settings={family.photo.settings as TheSimpleImageSettings}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
            />
          </div>
        )
      }

      // V2 · 카드 — 사진 + 양가 정보 하나의 카드
      if (v === 2) {
        const groomParent = renderParentLine(family.groomFather, family.groomMother)
        const brideParent = renderParentLine(family.brideFather, family.brideMother)
        const hasPhoto = !!family.photo?.url
        return (
          <AnimatedSection className="ts-sec ts-fam ts-fam--v2 ts-anim-fam-v2" key={`family-${v}`}>
            <div className="ts-eyebrow ts-anim-item">{family.eyebrow}</div>
            <div className="ts-fam-card ts-anim-item">
              {/* 사진 (카드 상단, 좌우 여백 없이) */}
              {hasPhoto ? (
                <div className="ts-fam-card-photo">
                  <CropBg
                    src={family.photo!.url}
                    settings={family.photo!.settings as TheSimpleImageSettings}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
                  />
                </div>
              ) : (
                <div className="ts-fam-card-photo ts-ph" />
              )}
              {/* 텍스트 영역 — 좌우 그리드 */}
              <div className="ts-fam-card-body">
                <div className="ts-fam-card-grid">
                  <div className="ts-fam-card-cell">
                    {groomParent && (
                      <div className="ts-fam-card-parents">
                        {groomParent}<span className="ts-fam-relation">의 아들</span>
                      </div>
                    )}
                    <div className="ts-fam-card-name">{groomName || '신랑'}</div>
                  </div>
                  <div className="ts-fam-card-heart">&#9829;</div>
                  <div className="ts-fam-card-cell">
                    {brideParent && (
                      <div className="ts-fam-card-parents">
                        {brideParent}<span className="ts-fam-relation">의 딸</span>
                      </div>
                    )}
                    <div className="ts-fam-card-name">{brideName || '신부'}</div>
                  </div>
                </div>
              </div>
            </div>
            {contactSheet}
          </AnimatedSection>
        )
      }

      // V3 · 가로사진 + 좌우 하트
      if (v === 3) {
        const groomParent = renderParentLine(family.groomFather, family.groomMother)
        const brideParent = renderParentLine(family.brideFather, family.brideMother)
        return (
          <AnimatedSection className="ts-sec ts-fam ts-fam--v3 ts-anim-fam-v3" key={`family-${v}`}>
            <div className="ts-eyebrow ts-anim-item">{family.eyebrow}</div>
            {famPhoto('ts-fam-photo--landscape')}
            <div className="ts-fam-v3-grid ts-anim-item">
              <div className="ts-fam-v3-cell">
                {groomParent && (
                  <div className="ts-fam-v3-role">
                    {groomParent}<span className="ts-fam-relation">의 아들</span>
                  </div>
                )}
                <div className="ts-fam-child">{groomName || '신랑'}</div>
              </div>
              <div className="ts-fam-v3-heart">&#9829;</div>
              <div className="ts-fam-v3-cell">
                {brideParent && (
                  <div className="ts-fam-v3-role">
                    {brideParent}<span className="ts-fam-relation">의 딸</span>
                  </div>
                )}
                <div className="ts-fam-child">{brideName || '신부'}</div>
              </div>
            </div>
            {contactSheet}
          </AnimatedSection>
        )
      }

      // V1 · 클래식 (default) — 세로사진 + 세로나열
      return (
        <AnimatedSection className="ts-sec ts-fam ts-fam--v1 ts-anim-fam-v1" key={`family-${v}`}>
          <div className="ts-eyebrow ts-anim-item">{family.eyebrow}</div>
          {famPhoto('ts-fam-photo--portrait')}
          <div className="ts-fam-row ts-anim-item">
            {renderRelation(family.groomFather, family.groomMother, groomName || '신랑', 'son')}
          </div>
          <div className="ts-fam-row ts-anim-item">
            {renderRelation(family.brideFather, family.brideMother, brideName || '신부', 'daughter')}
          </div>
          {contactSheet}
        </AnimatedSection>
      )
    },

    info: (v) => {
      const timeDisplay = data.wedding.timeDisplay || '오후 1시'

      // V2 · Big Date (큰 날짜 + 메타 그리드)
      if (v === 2) {
        const dayStr = String(weddingMeta.d).padStart(2, '0')
        return (
          <AnimatedSection className="ts-sec ts-info ts-anim-info-v2" key={`info-${v}`}>
            <div className="ts-i2">
              <div className="ts-i2-top ts-anim-item">{weddingMeta.y}. {String(weddingMeta.m).padStart(2, '0')}</div>
              <div className="ts-i2-day ts-anim-item">
                {dayStr.split('').map((ch, i) => (
                  <span key={i} className="ts-digit" style={{ animationDelay: `${280 + i * 120}ms` }}>{ch}</span>
                ))}
              </div>
              <div className="ts-i2-bot ts-anim-item">{weddingMeta.weekday}</div>
              <div className="ts-i2-divider ts-anim-item" />
              <div className="ts-i2-meta ts-anim-item">
                <div><b>TIME</b>{timeDisplay}</div>
                {data.sections.info.showVenue && <div><b>PLACE</b>{venueName}</div>}
                {data.sections.info.showVenue && venueHall && <div><b>HALL</b>{venueHall}</div>}
              </div>
              {data.sections.info.showCountdown && (
                <div className="ts-countdown-inline ts-cd-v2 ts-anim-item">
                  <LiveCountdown
                    targetDate={(() => { const d = data.wedding.date || '2026-05-16'; const t = data.wedding.time || '13:00'; return new Date(`${d}T${t}`) })()}
                    beforeMsg={data.sections.info.countdownBeforeMsg || `${brideName}, ${groomName}의 결혼식이 {d}일 남았습니다.`}
                    todayMsg={data.sections.info.countdownTodayMsg || '오늘 결혼합니다.'}
                    afterMsg={data.sections.info.countdownAfterMsg || '행복하고 따뜻하게 살겠습니다.'}
                  />
                </div>
              )}
            </div>
          </AnimatedSection>
        )
      }

      // V3 · Week Strip (주간 캘린더 스트립)
      if (v === 3) {
        // 예식일이 속한 주(일~토) 추출
        const wDate = data.wedding.date ? new Date(data.wedding.date) : new Date('2026-05-16')
        const dayOfWeek = wDate.getDay()
        const weekStart = new Date(wDate)
        weekStart.setDate(wDate.getDate() - dayOfWeek)
        const weekDays = Array.from({ length: 7 }, (_, i) => {
          const d = new Date(weekStart)
          d.setDate(weekStart.getDate() + i)
          return { day: d.getDate(), isTarget: d.getDate() === wDate.getDate() && d.getMonth() === wDate.getMonth() }
        })
        const dows = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
        return (
          <AnimatedSection className="ts-sec ts-info ts-anim-info-v3" key={`info-${v}`}>
            <div className="ts-i3">
              <div className="ts-i3-title ts-anim-item">
                <div className="ts-i3-month">{weddingMeta.y}. {String(weddingMeta.m).padStart(2, '0')}</div>
              </div>
              <div className="ts-i3-week ts-anim-item">
                {dows.map((dow, i) => (
                  <div className="ts-i3-dow ts-i3-cell" key={dow} style={{ animationDelay: `${350 + i * 50}ms` }}>{dow}</div>
                ))}
                {weekDays.map((wd, i) => (
                  <div className={`ts-i3-dd ts-i3-cell${wd.isTarget ? ' mark' : ''}`} key={i} style={{ animationDelay: `${700 + i * 70}ms` }}>
                    {wd.isTarget ? <span>{wd.day}</span> : wd.day}
                  </div>
                ))}
              </div>
              <div className="ts-i3-foot ts-anim-item">
                <b>{weddingMeta.weekday} · {timeDisplay}</b>
                {data.sections.info.showVenue && (
                  <div className="ts-i3-venue">
                    <span className="ts-venue-name">{venueName}</span>
                    {venueHall && <><br /><span className="ts-venue-hall">{venueHall}</span></>}
                  </div>
                )}
              </div>
              {data.sections.info.showCountdown && (
                <div className="ts-countdown-inline ts-cd-v3 ts-anim-item">
                  <LiveCountdown
                    targetDate={(() => { const d = data.wedding.date || '2026-05-16'; const t = data.wedding.time || '13:00'; return new Date(`${d}T${t}`) })()}
                    beforeMsg={data.sections.info.countdownBeforeMsg || `${brideName}, ${groomName}의 결혼식이 {d}일 남았습니다.`}
                    todayMsg={data.sections.info.countdownTodayMsg || '오늘 결혼합니다.'}
                    afterMsg={data.sections.info.countdownAfterMsg || '행복하고 따뜻하게 살겠습니다.'}
                  />
                </div>
              )}
            </div>
          </AnimatedSection>
        )
      }

      // V4 · Ticket (티켓 스타일)
      if (v === 4) {
        return (
          <AnimatedSection className="ts-sec ts-info ts-anim-info-v4" key={`info-${v}`}>
            <div className="ts-i4">
              <div className="ts-i4-ticket ts-anim-card">
                <div className="ts-i4-top">
                  <div className="ts-i4-cap ts-anim-item">WEDDING INVITATION</div>
                  <div className="ts-i4-names ts-anim-item">{groomName.toUpperCase()} &amp; {brideName.toUpperCase()}</div>
                </div>
                <div className="ts-i4-bot ts-anim-item">
                  <div><b>Date</b>{weddingMeta.y}.{String(weddingMeta.m).padStart(2, '0')}.{String(weddingMeta.d).padStart(2, '0')} {weddingMeta.weekday}</div>
                  <div><b>Time</b>{timeDisplay}</div>
                  {data.sections.info.showVenue && <div><b>Venue</b>{venueName}</div>}
                  {data.sections.info.showVenue && venueHall && <div><b>Hall</b>{venueHall}</div>}
                </div>
              </div>
              {data.sections.info.showCountdown && (
                <div className="ts-countdown-inline ts-cd-v4 ts-anim-item">
                  <LiveCountdown
                    targetDate={(() => { const d = data.wedding.date || '2026-05-16'; const t = data.wedding.time || '13:00'; return new Date(`${d}T${t}`) })()}
                    beforeMsg={data.sections.info.countdownBeforeMsg || `${brideName}, ${groomName}의 결혼식이 {d}일 남았습니다.`}
                    todayMsg={data.sections.info.countdownTodayMsg || '오늘 결혼합니다.'}
                    afterMsg={data.sections.info.countdownAfterMsg || '행복하고 따뜻하게 살겠습니다.'}
                  />
                </div>
              )}
            </div>
          </AnimatedSection>
        )
      }

      // V5 · Countdown Hero (D-Day 카운트다운 + 정보 행)
      if (v === 5) {
        const target = data.wedding.date ? new Date(data.wedding.date) : new Date('2026-05-16')
        // 날짜 기준 계산 (시/분/초 무시)
        const todayMid = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate())
        const targetMid = new Date(target.getFullYear(), target.getMonth(), target.getDate())
        const diff = Math.round((targetMid.getTime() - todayMid.getTime()) / (1000 * 60 * 60 * 24))
        const isToday = diff === 0
        const isPast = diff < 0 && !isToday
        const dNum = Math.abs(diff)
        return (
          <AnimatedSection className="ts-sec ts-info ts-anim-info-v5" key={`info-${v}`}>
            <div className="ts-i5">
              <div className="ts-i5-cap ts-anim-item">
                {isToday ? 'TODAY IS THE DAY' : isPast ? 'WE GOT MARRIED' : 'COUNTDOWN TO THE DAY'}
              </div>
              <div className="ts-i5-box ts-anim-item">
                <div className="ts-i5-count">
                  {isToday ? (
                    <div className="ts-i5-dash ts-digit" style={{ animationDelay: '200ms', fontSize: 'calc(48px * var(--ts-font-scale, 1))' }}>D-DAY</div>
                  ) : isPast ? (
                    <>
                      <div className="ts-i5-dash ts-digit" style={{ animationDelay: '200ms' }}>D+</div>
                      <CountingNumber target={dNum} className="ts-i5-counter" />
                    </>
                  ) : (
                    <>
                      <div className="ts-i5-dash ts-digit" style={{ animationDelay: '200ms' }}>D—</div>
                      <CountingNumber target={dNum} className="ts-i5-counter" />
                    </>
                  )}
                </div>
                <div className="ts-i5-note">
                  {weddingMeta.monthName} {weddingMeta.d}, {weddingMeta.y}
                </div>
              </div>
              <div className="ts-i5-rule ts-anim-item" />
              <div className="ts-i5-rows ts-anim-item">
                <div className="ts-i5-row"><b>DATE</b><span>{weddingMeta.m}월 {weddingMeta.d}일 {weddingMeta.weekday}</span></div>
                <div className="ts-i5-row"><b>TIME</b><span>{timeDisplay}</span></div>
                {data.sections.info.showVenue && <div className="ts-i5-row"><b>VENUE</b><span>{venueName}</span></div>}
                {data.sections.info.showVenue && venueHall && <div className="ts-i5-row"><b>HALL</b><span>{venueHall}</span></div>}
              </div>
              {data.sections.info.showCountdown && (
                <div className="ts-countdown-inline ts-cd-v5 ts-anim-item">
                  <LiveCountdown
                    targetDate={(() => { const d = data.wedding.date || '2026-05-16'; const t = data.wedding.time || '13:00'; return new Date(`${d}T${t}`) })()}
                    beforeMsg={data.sections.info.countdownBeforeMsg || `${brideName}, ${groomName}의 결혼식이 {d}일 남았습니다.`}
                    todayMsg={data.sections.info.countdownTodayMsg || '오늘 결혼합니다.'}
                    afterMsg={data.sections.info.countdownAfterMsg || '행복하고 따뜻하게 살겠습니다.'}
                  />
                </div>
              )}
            </div>
          </AnimatedSection>
        )
      }

      // V1 · Calendar (기본 — 풀 캘린더)
      {
        const dateStr = `${weddingMeta.y}.${String(weddingMeta.m).padStart(2, '0')}.${String(weddingMeta.d).padStart(2, '0')}`
        return (
        <AnimatedSection className="ts-sec ts-info ts-anim-info-v1" key={`info-${v}`}>
          <div className="ts-eyebrow">{info.eyebrow}</div>
          <div className="ts-i1">
            <div className="ts-i1-big ts-anim-item">
              {dateStr.split('').map((ch, i) => (
                <span key={i} className={ch === '.' ? 'ts-dot' : 'ts-digit'} style={{ animationDelay: `${180 + i * 60}ms` }}>{ch}</span>
              ))}
            </div>
            <div className="ts-i1-sub ts-anim-item">{weddingMeta.weekday} · {timeDisplay}</div>
          </div>
          <div className="ts-cal ts-anim-item">
            <div className="ts-cal-head">
              {['S','M','T','W','T','F','S'].map((d, i) => <span key={i}>{d}</span>)}
            </div>
            {calendar.map((row, i) => (
              <div className="ts-cal-row" key={i}>
                {row.map((cell, j) => (
                  <span key={j} className={cell.day === null ? 'mute' : cell.pick ? 'pick' : ''}>
                    {cell.day ?? ''}
                    {cell.pick && (
                      <svg className="ts-circle-draw" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="20" cy="20" r="15" fill="none" stroke="var(--point)" strokeWidth="1.5" />
                      </svg>
                    )}
                  </span>
                ))}
              </div>
            ))}
          </div>
          {data.sections.info.showVenue && (
            <div className="ts-i1-venue ts-anim-item">
              <span className="ts-venue-name">{venueName}</span>
              {venueHall && <><br /><span className="ts-venue-hall">{venueHall}</span></>}
            </div>
          )}
          {data.sections.info.showCountdown && (
            <div className="ts-countdown-inline ts-cd-v1 ts-anim-item">
              <LiveCountdown
                targetDate={(() => { const d = data.wedding.date || '2026-05-16'; const t = data.wedding.time || '13:00'; return new Date(`${d}T${t}`) })()}
                beforeMsg={data.sections.info.countdownBeforeMsg || `${brideName}, ${groomName}의 결혼식이 {d}일 남았습니다.`}
                todayMsg={data.sections.info.countdownTodayMsg || '오늘 결혼합니다.'}
                afterMsg={data.sections.info.countdownAfterMsg || '행복하고 따뜻하게 살겠습니다.'}
              />
            </div>
          )}
        </AnimatedSection>
      )
      }
    },

    direction: (v) => {
      // V2 · Full Map · 하단 정보 박스
      if (v === 2) {
        return (
          <AnimatedSection className="ts-sec ts-dir ts-anim-dir-v2" key={`direction-${v}`}>
            <div className="ts-eyebrow">{direction.eyebrow}</div>
            {direction.showMap !== false && (
              <div className="ts-anim-item" style={{ marginBottom: 10 }}>
                <KakaoMapBox address={venueAddress} venueName={venueName} aspectRatio="4 / 3" />
              </div>
            )}
            <div className="ts-anim-item" style={{ border: '1px solid var(--line)', padding: '18px 16px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, letterSpacing: '0.08em', color: 'var(--ink)', marginBottom: 4 }}>
                {venueName}
              </div>
              {venueHall && <div style={{ fontFamily: 'var(--font-ko)', fontSize: 12, color: 'var(--mute)', marginBottom: 10 }}>
                {venueHall}
              </div>}
              <div style={{ width: 24, height: 1, background: 'var(--line)', margin: '0 auto 10px' }} />
              <AddressCopy address={venueAddress} />
            </div>
            {direction.showNavButtons !== false && <NavButtons address={venueAddress} />}
            <TransportInfo transport={direction.transport} />
          </AnimatedSection>
        )
      }

      // V3 · 정보 상단 · 맵 하단
      if (v === 3) {
        return (
          <AnimatedSection className="ts-sec ts-dir ts-anim-dir-v3" key={`direction-${v}`}>
            <div className="ts-eyebrow">{direction.eyebrow}</div>
            <div className="ts-anim-item" style={{ textAlign: 'center', padding: '12px 0 18px' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, letterSpacing: '0.06em', color: 'var(--point)', marginBottom: venueHall ? 4 : 6 }}>
                {venueName}
              </div>
              {venueHall && <p style={{ fontFamily: 'var(--font-display)', fontSize: 10, letterSpacing: '0.2em', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 6 }}>
                {venueHall}
              </p>}
              <div style={{ width: 30, height: 1, background: 'var(--line)', margin: '0 auto 10px' }} />
              <AddressCopy address={venueAddress} />
            </div>
            {direction.showMap !== false && (
              <div className="ts-anim-item">
                <KakaoMapBox address={venueAddress} venueName={venueName} aspectRatio="16 / 9" />
              </div>
            )}
            {direction.showNavButtons !== false && <NavButtons address={venueAddress} />}
            <TransportInfo transport={direction.transport} />
          </AnimatedSection>
        )
      }

      // V4 · 맵 + 정보 카드
      if (v === 4) {
        return (
          <AnimatedSection className="ts-sec ts-dir ts-anim-dir-v4" key={`direction-${v}`}>
            <div className="ts-eyebrow">{direction.eyebrow}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12, marginTop: 8 }}>
              {direction.showMap !== false && (
                <div className="ts-anim-item">
                  <KakaoMapBox address={venueAddress} venueName={venueName} aspectRatio="3 / 2" />
                </div>
              )}
              <div className="ts-anim-card" style={{ border: '1px solid var(--line)', padding: '16px 14px', background: 'var(--card)' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 9, letterSpacing: '0.2em', color: 'var(--point)', textTransform: 'uppercase', marginBottom: 4 }}>
                  Venue
                </div>
                <div style={{ fontFamily: 'var(--font-ko)', fontSize: 15, fontWeight: 600, color: 'var(--ink)', marginBottom: 2 }}>
                  {venueName}
                </div>
                {venueHall && <div style={{ fontFamily: 'var(--font-ko)', fontSize: 12, color: 'var(--mute)', marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid var(--line)' }}>
                  {venueHall}
                </div>}
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 9, letterSpacing: '0.2em', color: 'var(--point)', textTransform: 'uppercase', marginBottom: 4 }}>
                  Address
                </div>
                <AddressCopy address={venueAddress} />
              </div>
            </div>
            {direction.showNavButtons !== false && <NavButtons address={venueAddress} />}
            <TransportInfo transport={direction.transport} />
          </AnimatedSection>
        )
      }

      // V5 · 좌측 라벨 · 우측 정보 · 맵 풀 폭
      if (v === 5) {
        return (
          <AnimatedSection className="ts-sec ts-dir ts-anim-dir-v5" key={`direction-${v}`}>
            <div className="ts-eyebrow">{direction.eyebrow}</div>
            {direction.showMap !== false && (
              <div className="ts-anim-item" style={{ marginBottom: 14 }}>
                <KakaoMapBox address={venueAddress} venueName={venueName} aspectRatio="16 / 10" />
              </div>
            )}
            <div className="ts-anim-item" style={{ display: 'flex', alignItems: 'baseline', gap: 16, padding: '14px 0', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 10, letterSpacing: '0.2em', color: 'var(--mute)', textTransform: 'uppercase', flexShrink: 0, width: 70 }}>
                Venue
              </div>
              <div style={{ fontFamily: 'var(--font-ko)', fontSize: 13, fontWeight: 500, color: 'var(--ink)', lineHeight: 1.5 }}>
                {venueName}{venueHall && ` · ${venueHall}`}
              </div>
            </div>
            <div className="ts-anim-item" style={{ display: 'flex', alignItems: 'baseline', gap: 16, padding: '14px 0', borderBottom: '1px solid var(--line)' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 10, letterSpacing: '0.2em', color: 'var(--mute)', textTransform: 'uppercase', flexShrink: 0, width: 70 }}>
                Address
              </div>
              <AddressCopy address={venueAddress} />
            </div>
            {direction.showNavButtons !== false && <NavButtons address={venueAddress} />}
            <TransportInfo transport={direction.transport} />
          </AnimatedSection>
        )
      }

      // V1 · Map Card (기본)
      return (
        <AnimatedSection className="ts-sec ts-dir ts-anim-dir-v1" key={`direction-${v}`}>
          <div className="ts-eyebrow">{direction.eyebrow}</div>
          {direction.showMap !== false && (
            <div className="ts-anim-item">
              <KakaoMapBox address={venueAddress} venueName={venueName} className="ts-dir-map" />
            </div>
          )}
          <div className="ts-dir-name ts-anim-item">
            {venueName}
            {venueHall && <div style={{ fontFamily: 'var(--font-ko)', fontSize: 13, fontStyle: 'normal', color: 'var(--mute)', marginTop: 2 }}>{venueHall}</div>}
          </div>
          <div className="ts-dir-addr ts-anim-item">
            <AddressCopy address={venueAddress} />
          </div>
          {direction.showNavButtons !== false && <NavButtons address={venueAddress} />}
          <TransportInfo transport={direction.transport} />
        </AnimatedSection>
      )
    },

    interview: (v) => {
      const intvToggle = interview.toggle
      // V2 · 번호 매김 · 라인 구분
      if (v === 2) {
        return (
          <AnimatedSection className={`ts-sec ts-interview ts-anim-intv-v${v}`} key={`interview-${v}`}>
            <div className="ts-eyebrow">{interview.eyebrow}</div>
            <SectionToggle enabled={intvToggle?.enabled ?? false} label={intvToggle?.label || '인터뷰 보기'} btnStyle={intvToggle?.style}>
            <div style={{ marginTop: 8 }}>
              {interview.items.map((item, i) => (
                <div
                  key={i}
                  style={{
                    padding: '20px 0',
                    borderBottom:
                      i === interview.items.length - 1 ? 'none' : '1px solid var(--line)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 10 }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 22,
                        color: 'var(--accent)',
                        lineHeight: 1,
                      }}
                    >
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--font-ko)',
                        fontSize: 14,
                        fontWeight: 500,
                        color: 'var(--ink)',
                      }}
                    >
                      {item.question}
                    </span>
                  </div>
                  <p
                    style={{
                      fontFamily: 'var(--font-ko)',
                      fontSize: 13,
                      color: '#5d5850',
                      lineHeight: 1.85,
                      paddingLeft: 34,
                      whiteSpace: 'pre-line',
                    }}
                  >
                    {item.answer}
                  </p>
                </div>
              ))}
            </div>
            </SectionToggle>
          </AnimatedSection>
        )
      }

      // V3 · 말풍선 · 좌우 교차
      if (v === 3) {
        return (
          <AnimatedSection className={`ts-sec ts-interview ts-anim-intv-v${v}`} key={`interview-${v}`}>
            <div className="ts-eyebrow">{interview.eyebrow}</div>
            <SectionToggle enabled={intvToggle?.enabled ?? false} label={intvToggle?.label || '인터뷰 보기'} btnStyle={intvToggle?.style}>
            <div style={{ marginTop: 12 }}>
              {interview.items.map((item, i) => (
                <div key={i} style={{ marginBottom: 24 }}>
                  <div
                    style={{
                      background: 'var(--card)',
                      border: '1px solid var(--line)',
                      borderRadius: 16,
                      padding: '12px 16px',
                      marginBottom: 8,
                      marginRight: 40,
                      position: 'relative',
                    }}
                  >
                    <div
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 10,
                        letterSpacing: '0.2em',
                        color: 'var(--accent)',
                        marginBottom: 4,
                      }}
                    >
                      QUESTION
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--font-ko)',
                        fontSize: 13,
                        color: 'var(--ink)',
                      }}
                    >
                      {item.question}
                    </div>
                  </div>
                  <div
                    style={{
                      background: '#fff',
                      border: '1px solid var(--line)',
                      borderRadius: 16,
                      padding: '12px 16px',
                      marginLeft: 40,
                    }}
                  >
                    <div
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 10,
                        letterSpacing: '0.2em',
                        color: 'var(--mute)',
                        marginBottom: 4,
                      }}
                    >
                      ANSWER
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--font-ko)',
                        fontSize: 13,
                        color: '#3d3d3d',
                        lineHeight: 1.75,
                        whiteSpace: 'pre-line',
                      }}
                    >
                      {item.answer}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            </SectionToggle>
          </AnimatedSection>
        )
      }

      // V4 · 인용 타이포 · 풀번드너리스
      if (v === 4) {
        return (
          <AnimatedSection className={`ts-sec ts-interview ts-anim-intv-v${v}`} key={`interview-${v}`}>
            <div className="ts-eyebrow">{interview.eyebrow}</div>
            <SectionToggle enabled={intvToggle?.enabled ?? false} label={intvToggle?.label || '인터뷰 보기'} btnStyle={intvToggle?.style}>
            <div style={{ marginTop: 12 }}>
              {interview.items.map((item, i) => (
                <div
                  key={i}
                  style={{
                    textAlign: 'center',
                    padding: '20px 0',
                    borderTop: i === 0 ? 'none' : '1px solid var(--line)',
                  }}
                >
                  <div
                    style={{
                      fontFamily: 'var(--font-serif)',
                      fontSize: 14,
                      fontStyle: 'italic',
                      color: 'var(--mute)',
                      marginBottom: 10,
                    }}
                  >
                    "{item.question}"
                  </div>
                  <p
                    style={{
                      fontFamily: 'var(--font-ko)',
                      fontSize: 14,
                      color: 'var(--ink)',
                      lineHeight: 1.85,
                      fontWeight: 500,
                      whiteSpace: 'pre-line',
                    }}
                  >
                    {item.answer}
                  </p>
                </div>
              ))}
            </div>
            </SectionToggle>
          </AnimatedSection>
        )
      }

      // V5 · 카드 · 라벨 분리
      if (v === 5) {
        return (
          <AnimatedSection className={`ts-sec ts-interview ts-anim-intv-v${v}`} key={`interview-${v}`}>
            <div className="ts-eyebrow">{interview.eyebrow}</div>
            <SectionToggle enabled={intvToggle?.enabled ?? false} label={intvToggle?.label || '인터뷰 보기'} btnStyle={intvToggle?.style}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
              {interview.items.map((item, i) => (
                <div
                  key={i}
                  style={{
                    border: '1px solid var(--line)',
                    padding: '16px 14px',
                    background: 'var(--card)',
                  }}
                >
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '50px 1fr',
                      gap: 10,
                      alignItems: 'start',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 10,
                        letterSpacing: '0.2em',
                        color: 'var(--accent)',
                        paddingTop: 2,
                      }}
                    >
                      Q.
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--font-ko)',
                        fontSize: 13,
                        color: 'var(--ink)',
                        fontWeight: 500,
                      }}
                    >
                      {item.question}
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 10,
                        letterSpacing: '0.2em',
                        color: 'var(--mute)',
                        borderTop: '1px solid var(--line)',
                        paddingTop: 12,
                        marginTop: 10,
                      }}
                    >
                      A.
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--font-ko)',
                        fontSize: 13,
                        color: '#5d5850',
                        lineHeight: 1.75,
                        borderTop: '1px solid var(--line)',
                        paddingTop: 12,
                        marginTop: 10,
                        whiteSpace: 'pre-line',
                      }}
                    >
                      {item.answer}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            </SectionToggle>
          </AnimatedSection>
        )
      }

      // V1 · 기본
      return (
        <AnimatedSection className={`ts-sec ts-interview ts-anim-intv-v${v}`} key={`interview-${v}`}>
          <div className="ts-eyebrow">{interview.eyebrow}</div>
          <SectionToggle enabled={intvToggle?.enabled ?? false} label={intvToggle?.label || '인터뷰 보기'} btnStyle={intvToggle?.style}>
          {interview.items.map((item, i) => (
            <div className="ts-qa" key={i}>
              <div className="ts-q">
                <b>Q.</b> {item.question}
              </div>
              <p className="ts-a">{item.answer}</p>
            </div>
          ))}
          </SectionToggle>
        </AnimatedSection>
      )
    },

    gallery: (v, instanceId) => {
      const images = data.galleries?.[instanceId] ?? []
      const srcs: (string | null)[] =
        images.length > 0 ? images.map((img) => img.webUrl) : [null, null, null, null, null, null]
      const keyFor = (i: number) => images[i]?.id ?? `ph-${i}`
      const settingsFor = (i: number): TheSimpleImageSettings =>
        images[i]?.settings ?? { scale: 1, positionX: 0, positionY: 0 }
      const galleryEyebrow = data.galleryEyebrows?.[instanceId] ?? 'Gallery'

      // V1 · 피처 포토 + 하단 썸네일 (자동 페이드 전환)
      if (v === 1) {
        return <GalleryV1Feature key={instanceId} images={images} galleryEyebrow={galleryEyebrow} onOpenLightbox={openLightbox} />
      }

      // V2 · 풀 슬라이드쇼 (자동 스크롤 + 도트 + 화살표)
      if (v === 2) {
        return <GalleryV2Slideshow key={instanceId} images={images} galleryEyebrow={galleryEyebrow} onOpenLightbox={openLightbox} />
      }

      // V3 / V4 / V5 · 커스텀 행 패턴 레이아웃 (비율 차별화)
      {
        const defaultPatterns: Record<number, number[]> = {
          3: [1, 2, 1],
          4: [1, 2, 1],
          5: [1, 3, 2, 1],
        }
        const rowPattern = data.galleryRowPatterns?.[instanceId] ?? defaultPatterns[v] ?? [1]
        const gap = 6

        // V3: 전부 16:9, V4: 전부 3:4, V5: 행별 가변
        const aspectForCount = (n: number): string => {
          if (v === 3) return '16 / 9'
          if (v === 4) return '3 / 4'
          // V5 혼합: 1장=16:9, 2장=4:5, 3+장=1:1
          if (n === 1) return '16 / 9'
          if (n === 2) return '4 / 5'
          return '1 / 1'
        }

        // 이미지를 행 패턴에 따라 배분 (패턴 순환 반복)
        const rows: Array<{ count: number; items: Array<{ src: string | null; idx: number }> }> = []
        let imgIdx = 0
        const totalImages = srcs.length
        if (totalImages === 0) {
          for (const count of rowPattern) {
            const items: Array<{ src: string | null; idx: number }> = []
            for (let c = 0; c < count; c++) {
              items.push({ src: null, idx: imgIdx++ })
            }
            rows.push({ count, items })
          }
        } else {
          let patternIdx = 0
          while (imgIdx < totalImages) {
            const count = rowPattern[patternIdx % rowPattern.length]
            const items: Array<{ src: string | null; idx: number }> = []
            for (let c = 0; c < count && imgIdx < totalImages; c++) {
              items.push({ src: srcs[imgIdx], idx: imgIdx })
              imgIdx++
            }
            rows.push({ count, items })
            patternIdx++
          }
        }

        const validSrcs = srcs.filter(Boolean) as string[]
        let imgCounter = 0
        const showMoreRow = data.galleryShowMoreRow?.[instanceId] ?? 0
        return (
          <GalleryShowMore
            key={instanceId}
            instanceId={instanceId}
            rows={rows}
            showMoreRow={showMoreRow}
            v={v}
            gap={gap}
            galleryEyebrow={galleryEyebrow}
            aspectForCount={aspectForCount}
            settingsFor={settingsFor}
            keyFor={keyFor}
            validSrcs={validSrcs}
            openLightbox={openLightbox}
          />
        )
      }
    },

    video: (v) => {
      const videoUrl = video?.url || ''
      const videoMatch = videoUrl.match(
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/|youtube\.com\/live\/)([a-zA-Z0-9_-]+)/
      )
      const videoId = videoMatch?.[1]

      // URL이 없거나 유효하지 않으면 placeholder
      if (!videoId) {
        return (
          <AnimatedSection className={`ts-sec ts-video ts-anim-vid-v${v}`} key={`video-${v}`}>
            <div className="ts-eyebrow">{video?.eyebrow || 'Video'}</div>
            <div
              style={{
                aspectRatio: '16/9',
                background: 'linear-gradient(135deg, #e8e8e8, #d4d4d4)',
                borderRadius: v === 1 ? 8 : 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#aaa',
                fontFamily: 'var(--font-ko)',
                fontSize: 12,
              }}
            >
              유튜브 URL을 입력하세요
            </div>
          </AnimatedSection>
        )
      }

      const thumbEl = <YouTubeLite videoId={videoId} />

      // V2 · 풀폭 (패딩 없음)
      if (v === 2) {
        return (
          <AnimatedSection className={`ts-sec ts-video ts-anim-vid-v${v}`} key={`video-${v}`} style={{ padding: 0 }}>
            {video?.eyebrow && (
              <div className="ts-eyebrow" style={{ padding: '0 26px', paddingTop: 'calc(56px * var(--ts-spacing-scale))' }}>
                {video.eyebrow}
              </div>
            )}
            <div style={{ marginTop: video?.eyebrow ? 18 : 0 }}>
              {thumbEl}
            </div>
          </AnimatedSection>
        )
      }

      // V3 · 시네마 (어두운 배경 + letterbox)
      if (v === 3) {
        return (
          <AnimatedSection
            className={`ts-sec ts-video ts-anim-vid-v${v}`}
            key={`video-${v}`}
            style={{ background: '#111', padding: '40px 0' }}
          >
            {video?.eyebrow && (
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 11,
                  letterSpacing: '0.32em',
                  color: 'rgba(255,255,255,0.5)',
                  textTransform: 'uppercase',
                  textAlign: 'center',
                  marginBottom: 18,
                }}
              >
                {video.eyebrow}
              </div>
            )}
            <div style={{ padding: '0 16px' }}>
              <div style={{ borderRadius: 4, overflow: 'hidden' }}>
                {thumbEl}
              </div>
            </div>
          </AnimatedSection>
        )
      }

      // V1 · 기본 (패딩 + 라운드)
      return (
        <AnimatedSection className={`ts-sec ts-video ts-anim-vid-v${v}`} key={`video-${v}`}>
          <div className="ts-eyebrow">{video?.eyebrow || 'Video'}</div>
          <div style={{ borderRadius: 8, overflow: 'hidden', marginTop: 18 }}>
            {thumbEl}
          </div>
        </AnimatedSection>
      )
    },

    guide: (v) => {
      /** 링크 버튼 공통 렌더러 */
      const renderLink = (link: string | undefined, small = false) => {
        if (!link) return null
        return (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-block',
              marginTop: 8,
              fontFamily: 'var(--font-display)',
              fontSize: small ? 10 : 11,
              letterSpacing: '0.12em',
              color: 'var(--accent)',
              borderBottom: '1px solid var(--accent)',
              paddingBottom: 1,
              textDecoration: 'none',
            }}
          >
            LINK →
          </a>
        )
      }

      // V2 · 세로 리스트 · 아이콘 슬롯
      if (v === 2) {
        return (
          <AnimatedSection className={`ts-sec ts-guide ts-anim-guide-v${v}`} key={`guide-${v}`}>
            <div className="ts-eyebrow">{guide.eyebrow}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 8 }}>
              {guide.items.map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '40px 1fr',
                    gap: 12,
                    padding: '16px 0',
                    borderBottom:
                      i === guide.items.length - 1 ? 'none' : '1px solid var(--line)',
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      background: '#f5f5f5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: 'var(--font-display)',
                      fontSize: 14,
                      color: 'var(--accent)',
                    }}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <div>
                    <div
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 9,
                        letterSpacing: '0.2em',
                        color: 'var(--mute)',
                        textTransform: 'uppercase',
                        marginBottom: 2,
                      }}
                    >
                      {item.label}
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--font-ko)',
                        fontSize: 14,
                        fontWeight: 600,
                        color: 'var(--ink)',
                        marginBottom: 4,
                      }}
                    >
                      {item.title}
                    </div>
                    <p
                      style={{
                        fontFamily: 'var(--font-ko)',
                        fontSize: 12,
                        color: '#5d5850',
                        lineHeight: 1.75,
                        whiteSpace: 'pre-line',
                      }}
                    >
                      {item.body}
                    </p>
                    {renderLink(item.link)}
                  </div>
                </div>
              ))}
            </div>
          </AnimatedSection>
        )
      }

      // V3 · 아코디언 느낌 · 좌측 라벨
      if (v === 3) {
        return (
          <AnimatedSection className={`ts-sec ts-guide ts-anim-guide-v${v}`} key={`guide-${v}`}>
            <div className="ts-eyebrow">{guide.eyebrow}</div>
            <div style={{ marginTop: 8 }}>
              {guide.items.map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '90px 1fr',
                    padding: '18px 0',
                    borderBottom: '1px solid var(--line)',
                    borderTop: i === 0 ? '1px solid var(--line)' : 'none',
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 10,
                        letterSpacing: '0.2em',
                        color: 'var(--accent)',
                        textTransform: 'uppercase',
                        marginBottom: 4,
                      }}
                    >
                      {item.label}
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--font-ko)',
                        fontSize: 13,
                        fontWeight: 600,
                        color: 'var(--ink)',
                      }}
                    >
                      {item.title}
                    </div>
                  </div>
                  <div>
                    <p
                      style={{
                        fontFamily: 'var(--font-ko)',
                        fontSize: 12,
                        color: '#5d5850',
                        lineHeight: 1.85,
                        whiteSpace: 'pre-line',
                      }}
                    >
                      {item.body}
                    </p>
                    {renderLink(item.link)}
                  </div>
                </div>
              ))}
            </div>
          </AnimatedSection>
        )
      }

      // V4 · 베이지 배경 카드 2열
      if (v === 4) {
        return (
          <AnimatedSection className={`ts-sec ts-guide ts-anim-guide-v${v}`} key={`guide-${v}`}>
            <div className="ts-eyebrow">{guide.eyebrow}</div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 8,
                marginTop: 10,
              }}
            >
              {guide.items.map((item, i) => (
                <div
                  key={i}
                  style={{
                    background: 'var(--card)',
                    padding: '20px 14px',
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 9,
                      letterSpacing: '0.2em',
                      color: 'var(--accent)',
                      textTransform: 'uppercase',
                      marginBottom: 8,
                    }}
                  >
                    {item.label}
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-ko)',
                      fontSize: 14,
                      fontWeight: 600,
                      color: 'var(--ink)',
                      marginBottom: 8,
                    }}
                  >
                    {item.title}
                  </div>
                  <div
                    style={{
                      width: 20,
                      height: 1,
                      background: 'var(--line)',
                      margin: '0 auto 8px',
                    }}
                  />
                  <p
                    style={{
                      fontFamily: 'var(--font-ko)',
                      fontSize: 11,
                      color: '#5d5850',
                      lineHeight: 1.75,
                      whiteSpace: 'pre-line',
                    }}
                  >
                    {item.body}
                  </p>
                  {renderLink(item.link, true)}
                </div>
              ))}
            </div>
          </AnimatedSection>
        )
      }

      // V5 · 노트 스타일 · 좌측 정렬 리스트
      if (v === 5) {
        return (
          <AnimatedSection className={`ts-sec ts-guide ts-anim-guide-v${v}`} key={`guide-${v}`}>
            <div className="ts-eyebrow">{guide.eyebrow}</div>
            <div
              style={{
                marginTop: 10,
                padding: '20px 18px',
                border: '1px solid var(--line)',
                background: 'var(--card)',
              }}
            >
              {guide.items.map((item, i) => (
                <div
                  key={i}
                  style={{
                    paddingBottom: i === guide.items.length - 1 ? 0 : 14,
                    marginBottom: i === guide.items.length - 1 ? 0 : 14,
                    borderBottom:
                      i === guide.items.length - 1 ? 'none' : '1px dashed var(--line)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: 8,
                      marginBottom: 4,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 11,
                        color: 'var(--accent)',
                        letterSpacing: '0.15em',
                        textTransform: 'uppercase',
                      }}
                    >
                      — {item.label}
                    </span>
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-ko)',
                      fontSize: 14,
                      fontWeight: 600,
                      color: 'var(--ink)',
                      marginBottom: 4,
                    }}
                  >
                    {item.title}
                  </div>
                  <p
                    style={{
                      fontFamily: 'var(--font-ko)',
                      fontSize: 12,
                      color: '#5d5850',
                      lineHeight: 1.75,
                      whiteSpace: 'pre-line',
                    }}
                  >
                    {item.body}
                  </p>
                  {renderLink(item.link)}
                </div>
              ))}
            </div>
          </AnimatedSection>
        )
      }

      // V1 · 기본
      return (
        <AnimatedSection className={`ts-sec ts-guide ts-anim-guide-v${v}`} key={`guide-${v}`}>
          <div className="ts-eyebrow">{guide.eyebrow}</div>
          <div className="ts-guide-grid">
            {guide.items.map((item, i) => (
              <div className="ts-guide-cell" key={i}>
                <div className="ts-guide-label">{item.label}</div>
                <b>{item.title}</b>
                <p style={{ whiteSpace: 'pre-line' }}>{item.body}</p>
                {renderLink(item.link)}
              </div>
            ))}
          </div>
        </AnimatedSection>
      )
    },

    account: (v) => {
      const guideText = account.guide || ''
      const accountGuideEl = guideText ? (
        <p style={{
          fontFamily: 'var(--font-ko)',
          fontSize: 11,
          color: 'var(--mute)',
          textAlign: 'center',
          lineHeight: 1.8,
          marginBottom: 16,
          opacity: 0.8,
          whiteSpace: 'pre-line',
        }}>
          {guideText}
        </p>
      ) : null
      const tabbedProps = {
        groomRole: couple.groom.role,
        brideRole: couple.bride.role,
        groomAccounts: account.groom,
        brideAccounts: account.bride,
        groomFather: account.groomFather || [],
        groomMother: account.groomMother || [],
        brideFather: account.brideFather || [],
        brideMother: account.brideMother || [],
        groomFatherName: account.groomFatherName,
        groomMotherName: account.groomMotherName,
        brideFatherName: account.brideFatherName,
        brideMotherName: account.brideMotherName,
        variant: v,
      }

      // V2 · 베이지 카드
      if (v === 2) {
        return (
          <AnimatedSection className={`ts-sec ts-account ts-anim-acc-v${v}`} key={`account-${v}`}>
            <div className="ts-eyebrow">{account.eyebrow}</div>
            <div style={{ background: 'var(--card)', padding: '20px 16px', marginTop: 8 }}>
              {accountGuideEl}
              <AccountTabbed {...tabbedProps} />
            </div>
          </AnimatedSection>
        )
      }

      // V3 · 전체 펼침 · 계좌번호 바로 표시 (탭 없이)
      if (v === 3) {
        const allList: Array<{
          side: string
          role: string
          name: string
          accounts: typeof account.groom
        }> = []
        if (account.groom.length > 0)
          allList.push({ side: 'groom', role: couple.groom.role, name: groomName, accounts: account.groom })
        if ((account.groomFather || []).length > 0)
          allList.push({ side: 'groomFather', role: '아버지', name: account.groomFatherName || '', accounts: account.groomFather || [] })
        if ((account.groomMother || []).length > 0)
          allList.push({ side: 'groomMother', role: '어머니', name: account.groomMotherName || '', accounts: account.groomMother || [] })
        if (account.bride.length > 0)
          allList.push({ side: 'bride', role: couple.bride.role, name: brideName, accounts: account.bride })
        if ((account.brideFather || []).length > 0)
          allList.push({ side: 'brideFather', role: '아버지', name: account.brideFatherName || '', accounts: account.brideFather || [] })
        if ((account.brideMother || []).length > 0)
          allList.push({ side: 'brideMother', role: '어머니', name: account.brideMotherName || '', accounts: account.brideMother || [] })
        return (
          <AnimatedSection className={`ts-sec ts-account ts-anim-acc-v${v}`} key={`account-${v}`}>
            <div className="ts-eyebrow">{account.eyebrow}</div>
            <div style={{ marginTop: 8 }}>
              {accountGuideEl}
              {allList.length === 0 ? (
                <p style={{ textAlign: 'center', fontSize: 11, color: '#b8b0a6', marginTop: 8 }}>
                  계좌를 추가하면 여기에 표시됩니다
                </p>
              ) : (
                <div>
                  {allList.map((group, gi) => (
                    <div
                      key={gi}
                      style={{
                        padding: '16px 0',
                        borderBottom:
                          gi === allList.length - 1 ? 'none' : '1px solid var(--line)',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'baseline',
                          gap: 8,
                          marginBottom: 10,
                        }}
                      >
                        <span
                          style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: 10,
                            letterSpacing: '0.2em',
                            color: 'var(--accent)',
                            textTransform: 'uppercase',
                          }}
                        >
                          {group.role}
                        </span>
                        {group.name && (
                          <span
                            style={{
                              fontFamily: 'var(--font-ko)',
                              fontSize: 14,
                              fontWeight: 600,
                              color: 'var(--ink)',
                            }}
                          >
                            {group.name}
                          </span>
                        )}
                      </div>
                      {group.accounts.map((acc, i) => (
                        <div
                          key={i}
                          style={{
                            fontFamily: 'var(--font-ko)',
                            fontSize: 12,
                            color: '#5d5850',
                            lineHeight: 1.9,
                            paddingLeft: 2,
                          }}
                        >
                          <span style={{ color: 'var(--mute)', marginRight: 6 }}>{acc.bank}</span>
                          <span style={{ fontFamily: 'var(--font-mono), monospace' }}>{acc.number}</span>
                          {acc.holder && (
                            <span style={{ color: 'var(--mute)', marginLeft: 6 }}>· {acc.holder}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </AnimatedSection>
        )
      }

      // V4 · 보더 카드
      if (v === 4) {
        return (
          <AnimatedSection className={`ts-sec ts-account ts-anim-acc-v${v}`} key={`account-${v}`}>
            <div className="ts-eyebrow">{account.eyebrow}</div>
            <div style={{ border: '1px solid var(--line)', padding: '20px 16px', marginTop: 8 }}>
              {accountGuideEl}
              <AccountTabbed {...tabbedProps} />
            </div>
          </AnimatedSection>
        )
      }

      // V5 · 세로 스택 · 중앙정렬
      if (v === 5) {
        return (
          <AnimatedSection className={`ts-sec ts-account ts-anim-acc-v${v}`} key={`account-${v}`}>
            <div className="ts-eyebrow">{account.eyebrow}</div>
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              {accountGuideEl}
              <AccountTabbed {...tabbedProps} />
            </div>
          </AnimatedSection>
        )
      }

      // V1 · 기본
      return (
        <AnimatedSection className={`ts-sec ts-account ts-anim-acc-v${v}`} key={`account-${v}`}>
          <div className="ts-eyebrow">{account.eyebrow}</div>
          <div style={{ marginTop: 8 }}>
            {accountGuideEl}
            <AccountTabbed {...tabbedProps} />
          </div>
        </AnimatedSection>
      )
    },

    rsvp: (v) => {
      // V2 · 베이지 블록 · 큰 필기체
      if (v === 2) {
        return (
          <AnimatedSection className={`ts-sec ts-rsvp ts-anim-rsvp-v${v}`} key={`rsvp-${v}`}>
            <div
              style={{
                background: 'var(--card)',
                padding: '36px 24px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: 40,
                  fontStyle: 'italic',
                  color: 'var(--accent)',
                  lineHeight: 1,
                  marginBottom: 10,
                }}
              >
                R.s.v.p
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 11,
                  letterSpacing: '0.25em',
                  color: 'var(--mute)',
                  textTransform: 'uppercase',
                  marginBottom: 16,
                }}
              >
                Kindly Respond
              </div>
              <p
                style={{
                  fontFamily: 'var(--font-ko)',
                  fontSize: 12,
                  color: '#5d5850',
                  lineHeight: 1.8,
                  marginBottom: 18,
                  whiteSpace: 'pre-line',
                }}
              >
                {rsvp.body}
              </p>
              <span
                onClick={() => setRsvpOpen(true)}
                style={{
                  display: 'inline-block',
                  fontFamily: 'var(--font-display)',
                  fontSize: 10,
                  letterSpacing: '0.3em',
                  color: '#fff',
                  background: 'var(--accent)',
                  padding: '10px 24px',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                }}
              >
                Reply
              </span>
            </div>
          </AnimatedSection>
        )
      }

      // V3 · 미니멀 · 중앙 라인 · 얇은 버튼
      if (v === 3) {
        return (
          <AnimatedSection className={`ts-sec ts-rsvp ts-anim-rsvp-v${v}`} key={`rsvp-${v}`}>
            <div style={{ textAlign: 'center', padding: '40px 24px' }}>
              <div
                style={{
                  width: 1,
                  height: 30,
                  background: 'var(--line)',
                  margin: '0 auto 16px',
                }}
              />
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 14,
                  letterSpacing: '0.4em',
                  color: 'var(--ink)',
                  textTransform: 'uppercase',
                  marginBottom: 12,
                }}
              >
                R S V P
              </div>
              <p
                style={{
                  fontFamily: 'var(--font-ko)',
                  fontSize: 12,
                  color: 'var(--mute)',
                  lineHeight: 1.8,
                  marginBottom: 20,
                  whiteSpace: 'pre-line',
                }}
              >
                {rsvp.body}
              </p>
              <span
                onClick={() => setRsvpOpen(true)}
                style={{
                  display: 'inline-block',
                  fontFamily: 'var(--font-display)',
                  fontSize: 11,
                  letterSpacing: '0.2em',
                  color: 'var(--accent)',
                  borderBottom: '1px solid var(--accent)',
                  padding: '2px 4px 4px',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                }}
              >
                Reply Here
              </span>
              <div
                style={{
                  width: 1,
                  height: 30,
                  background: 'var(--line)',
                  margin: '16px auto 0',
                }}
              />
            </div>
          </AnimatedSection>
        )
      }

      // V4 · 듀얼 버튼 · 참석/불참 (YES / NO)
      if (v === 4) {
        return (
          <AnimatedSection className={`ts-sec ts-rsvp ts-anim-rsvp-v${v}`} key={`rsvp-${v}`}>
            <div
              style={{
                border: '1px solid var(--line)',
                padding: '32px 20px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 22,
                  letterSpacing: '0.2em',
                  color: 'var(--point)',
                  marginBottom: 6,
                }}
              >
                {rsvp.title || 'R.S.V.P.'}
              </div>
              <p
                style={{
                  fontFamily: 'var(--font-ko)',
                  fontSize: 12,
                  color: 'var(--mute)',
                  lineHeight: 1.75,
                  marginBottom: 20,
                  whiteSpace: 'pre-line',
                }}
              >
                {rsvp.body}
              </p>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 8,
                }}
              >
                <span
                  onClick={() => setRsvpOpen(true)}
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 11,
                    letterSpacing: '0.2em',
                    color: '#fff',
                    background: 'var(--accent)',
                    padding: '12px 0',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                  }}
                >
                  Attending
                </span>
                <span
                  onClick={() => setRsvpOpen(true)}
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 11,
                    letterSpacing: '0.2em',
                    color: 'var(--accent)',
                    background: 'transparent',
                    border: '1px solid var(--accent)',
                    padding: '11px 0',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                  }}
                >
                  Regrets
                </span>
              </div>
            </div>
          </AnimatedSection>
        )
      }

      // V5 · 상단 라벨 · 카드 프레임 · 액센트 버튼
      if (v === 5) {
        return (
          <AnimatedSection className={`ts-sec ts-rsvp ts-anim-rsvp-v${v}`} key={`rsvp-${v}`}>
            <div style={{ position: 'relative', padding: '32px 20px' }}>
              <div
                style={{
                  position: 'absolute',
                  top: 22,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: '#fff',
                  padding: '0 14px',
                  fontFamily: 'var(--font-display)',
                  fontSize: 10,
                  letterSpacing: '0.3em',
                  color: 'var(--accent)',
                  textTransform: 'uppercase',
                }}
              >
                Save the Date
              </div>
              <div
                style={{
                  border: '1px solid var(--accent)',
                  padding: '32px 20px 28px',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: 28,
                    fontStyle: 'italic',
                    color: 'var(--point)',
                    marginBottom: 14,
                  }}
                >
                  Will you join us?
                </div>
                <p
                  style={{
                    fontFamily: 'var(--font-ko)',
                    fontSize: 12,
                    color: 'var(--mute)',
                    lineHeight: 1.8,
                    marginBottom: 20,
                    whiteSpace: 'pre-line',
                  }}
                >
                  {rsvp.body}
                </p>
                <span
                  onClick={() => setRsvpOpen(true)}
                  style={{
                    display: 'inline-block',
                    fontFamily: 'var(--font-display)',
                    fontSize: 11,
                    letterSpacing: '0.25em',
                    color: 'var(--accent)',
                    border: '1px solid var(--accent)',
                    padding: '10px 28px',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                  }}
                >
                  Reply
                </span>
              </div>
            </div>
          </AnimatedSection>
        )
      }

      // V1 · 기본
      return (
        <AnimatedSection className={`ts-sec ts-rsvp ts-anim-rsvp-v${v}`} key={`rsvp-${v}`}>
          <div className="ts-rsvp-box">
            <div className="ts-rsvp-title">{rsvp.title || 'R.S.V.P.'}</div>
            <p className="ts-rsvp-sub" style={{ whiteSpace: 'pre-line' }}>
              {rsvp.body}
            </p>
            <span className="ts-rsvp-btn" onClick={() => setRsvpOpen(true)} style={{ cursor: 'pointer' }}>참석 회신하기</span>
          </div>
        </AnimatedSection>
      )
    },

    guestbook: (v) => {
      const samples = [
        { name: '민지', date: '5.12', text: '두 분의 시작을 진심으로 축하드려요. 행복하세요!' },
        { name: '지훈', date: '5.13', text: '결혼 축하드립니다. 늘 행복한 일만 가득하길 바랍니다.' },
        { name: '수현', date: '5.14', text: '아름다운 두 분, 앞으로도 서로를 아끼며 살아가시길!' },
      ]
      const entries = data.id && guestbookMessages.length > 0 ? guestbookMessages : !data.id ? samples : guestbookMessages

      // V2 · 카드 그리드 · 베이지 톤
      if (v === 2) {
        return (
          <AnimatedSection className={`ts-sec ts-guestbook ts-anim-gb-v${v}`} key={`guestbook-${v}`}>
            <div style={{ textAlign: 'center', marginBottom: 14 }}>
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 22,
                  letterSpacing: '0.08em',
                  color: 'var(--point)',
                  marginBottom: 4,
                }}
              >
                Guestbook
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-ko)',
                  fontSize: 11,
                  color: 'var(--mute)',
                }}
              >
                따뜻한 한 마디를 남겨주세요
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              {entries.slice(0, 2).map((s, i) => (
                <div
                  key={i}
                  style={{
                    background: 'var(--card)',
                    padding: '14px 14px',
                    borderLeft: '3px solid var(--accent)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'baseline',
                      marginBottom: 6,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'var(--font-ko)',
                        fontSize: 12,
                        fontWeight: 600,
                        color: 'var(--ink)',
                      }}
                    >
                      {s.name}
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 10,
                        color: 'var(--mute)',
                      }}
                    >
                      {s.date}
                    </span>
                  </div>
                  <p
                    style={{
                      fontFamily: 'var(--font-ko)',
                      fontSize: 12,
                      color: '#5d5850',
                      lineHeight: 1.75,
                    }}
                  >
                    {s.text}
                  </p>
                </div>
              ))}
            </div>
            <div
              style={{
                textAlign: 'center',
                marginTop: 14,
                fontFamily: 'var(--font-display)',
                fontSize: 10,
                letterSpacing: '0.25em',
                color: 'var(--accent)',
                textTransform: 'uppercase',
              }}
            >
              + Write a Message
            </div>
            <GuestbookForm invitationId={data.id} onSubmitted={handleGuestbookSubmitted} />
          </AnimatedSection>
        )
      }

      // V3 · 타임라인 스타일 · 좌측 도트
      if (v === 3) {
        return (
          <AnimatedSection className={`ts-sec ts-guestbook ts-anim-gb-v${v}`} key={`guestbook-${v}`}>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 10,
                letterSpacing: '0.25em',
                color: 'var(--accent)',
                textTransform: 'uppercase',
                marginBottom: 14,
              }}
            >
              Messages
            </div>
            <div style={{ position: 'relative', paddingLeft: 20 }}>
              <div
                style={{
                  position: 'absolute',
                  left: 4,
                  top: 4,
                  bottom: 4,
                  width: 1,
                  background: 'var(--line)',
                }}
              />
              {entries.map((s, i) => (
                <div
                  key={i}
                  style={{
                    position: 'relative',
                    marginBottom: i === entries.length - 1 ? 0 : 18,
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      left: -20,
                      top: 6,
                      width: 9,
                      height: 9,
                      borderRadius: '50%',
                      background: '#fff',
                      border: '1px solid var(--accent)',
                    }}
                  />
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: 8,
                      marginBottom: 4,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'var(--font-ko)',
                        fontSize: 13,
                        fontWeight: 600,
                        color: 'var(--ink)',
                      }}
                    >
                      {s.name}
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 10,
                        color: 'var(--mute)',
                      }}
                    >
                      {s.date}
                    </span>
                  </div>
                  <p
                    style={{
                      fontFamily: 'var(--font-ko)',
                      fontSize: 12,
                      color: '#5d5850',
                      lineHeight: 1.75,
                    }}
                  >
                    {s.text}
                  </p>
                </div>
              ))}
            </div>
            <GuestbookForm invitationId={data.id} onSubmitted={handleGuestbookSubmitted} />
          </AnimatedSection>
        )
      }

      // V4 · 편지지 스타일 · 가운데 인용
      if (v === 4) {
        return (
          <AnimatedSection className={`ts-sec ts-guestbook ts-anim-gb-v${v}`} key={`guestbook-${v}`}>
            {entries.length > 0 && (
              <div
                style={{
                  border: '1px solid var(--line)',
                  padding: '24px 20px',
                  textAlign: 'center',
                  background: 'var(--card)',
                }}
              >
                <div
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: 28,
                    fontStyle: 'italic',
                    color: 'var(--accent)',
                    lineHeight: 0.5,
                    marginBottom: 14,
                  }}
                >
                  &ldquo;
                </div>
                <p
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: 14,
                    fontStyle: 'italic',
                    color: 'var(--ink)',
                    lineHeight: 1.8,
                    marginBottom: 12,
                  }}
                >
                  {entries[0].text}
                </p>
                <div
                  style={{
                    width: 20,
                    height: 1,
                    background: 'var(--line)',
                    margin: '0 auto 8px',
                  }}
                />
                <div
                  style={{
                    fontFamily: 'var(--font-ko)',
                    fontSize: 11,
                    color: 'var(--mute)',
                  }}
                >
                  {entries[0].name} · {entries[0].date}
                </div>
              </div>
            )}
            <div
              style={{
                textAlign: 'center',
                marginTop: 14,
                fontFamily: 'var(--font-display)',
                fontSize: 10,
                letterSpacing: '0.25em',
                color: 'var(--accent)',
                textTransform: 'uppercase',
              }}
            >
              View All Messages
            </div>
            <GuestbookForm invitationId={data.id} onSubmitted={handleGuestbookSubmitted} />
          </AnimatedSection>
        )
      }

      // V5 · 컴팩트 리스트 · 라인 구분 · 우측 화살표
      if (v === 5) {
        return (
          <AnimatedSection className={`ts-sec ts-guestbook ts-anim-gb-v${v}`} key={`guestbook-${v}`}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginBottom: 10,
                paddingBottom: 10,
                borderBottom: '1px solid var(--accent)',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 16,
                  letterSpacing: '0.1em',
                  color: 'var(--point)',
                }}
              >
                Guestbook
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 10,
                  letterSpacing: '0.2em',
                  color: 'var(--accent)',
                  textTransform: 'uppercase',
                }}
              >
                + New
              </div>
            </div>
            {entries.map((s, i) => (
              <div
                key={i}
                style={{
                  padding: '14px 0',
                  borderBottom:
                    i === entries.length - 1 ? 'none' : '1px solid var(--line)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    justifyContent: 'space-between',
                    marginBottom: 4,
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-ko)',
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'var(--ink)',
                    }}
                  >
                    {s.name}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 10,
                      color: 'var(--mute)',
                    }}
                  >
                    {s.date}
                  </span>
                </div>
                <p
                  style={{
                    fontFamily: 'var(--font-ko)',
                    fontSize: 12,
                    color: '#5d5850',
                    lineHeight: 1.7,
                  }}
                >
                  {s.text}
                </p>
              </div>
            ))}
            <GuestbookForm invitationId={data.id} onSubmitted={handleGuestbookSubmitted} />
          </AnimatedSection>
        )
      }

      // V1 · 기본
      return (
        <AnimatedSection className={`ts-sec ts-guestbook ts-anim-gb-v${v}`} key={`guestbook-${v}`}>
          <div className="ts-gb-head">
            <div className="ts-gb-title">Guestbook</div>
            <div className="ts-gb-sub">따뜻한 한 마디를 남겨주세요</div>
          </div>
          {entries.map((s, i) => (
            <div key={i} className="ts-gb-entry">
              <div className="ts-gb-meta">{s.name} · {s.date}</div>
              <p className="ts-gb-text">{s.text}</p>
            </div>
          ))}
          <GuestbookForm invitationId={data.id} onSubmitted={handleGuestbookSubmitted} />
        </AnimatedSection>
      )
    },

    lovestory: (v) => {
      const ls = data.sections.lovestory
      const lsToggle = ls?.toggle
      const items = ls?.items ?? []
      if (items.length === 0) return null

      /** 아이템별 사진 배열 추출 헬퍼 */
      const getPhotos = (item: typeof items[number]) =>
        [item.photo1, item.photo2].filter((p): p is ImageWithSettings => !!p?.url)

      /** 아이템 하나를 렌더링하는 공통 블록 (사진 위 + 텍스트 아래) */
      const renderItemV1 = (item: typeof items[number], idx: number) => {
        const photos = getPhotos(item)
        return (
          <div key={idx} className="ts-ls-stagger" style={{ '--ls-i': idx, marginTop: idx > 0 ? 28 : 0 } as React.CSSProperties}>
            {photos.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                {photos.map((p, i) => (
                  <CropBg
                    key={i}
                    src={p.url}
                    settings={p.settings}
                    style={{
                      flex: 1,
                      aspectRatio: photos.length === 1 ? '16/9' : '4/3',
                      borderRadius: 4,
                      overflow: 'hidden',
                    }}
                  />
                ))}
              </div>
            )}
            {item.body && (
              <p style={{ fontFamily: 'var(--font-ko)', fontSize: 13, lineHeight: 2, color: '#5d5850', whiteSpace: 'pre-line' }}>
                {item.body}
              </p>
            )}
          </div>
        )
      }

      // V2 · 좌우 교차 레이아웃 (홀수: 좌 사진 + 우 텍스트, 짝수: 좌 텍스트 + 우 사진)
      if (v === 2) {
        return (
          <AnimatedSection className={`ts-sec ts-anim-ls-v2`} key={`lovestory-${v}`}>
            <div className="ts-eyebrow ts-anim-item">{ls.eyebrow}</div>
            <SectionToggle enabled={lsToggle?.enabled ?? false} label={lsToggle?.label || '스토리 보기'} btnStyle={lsToggle?.style}>
            {items.map((item, idx) => {
              const photos = getPhotos(item)
              const isReversed = idx % 2 === 1
              return (
                <div
                  key={idx}
                  className="ts-ls-stagger"
                  style={{
                    '--ls-i': idx,
                    display: photos.length > 0 ? 'flex' : 'block',
                    flexDirection: isReversed ? 'row-reverse' : 'row',
                    gap: 16,
                    marginTop: idx === 0 ? 16 : 28,
                  } as React.CSSProperties}
                >
                  {photos.length > 0 && (
                    <div style={{ width: 140, flexShrink: 0 }}>
                      <CropBg
                        src={photos[0].url}
                        settings={photos[0].settings}
                        style={{
                          width: '100%', aspectRatio: '3/4', borderRadius: 4, overflow: 'hidden',
                        }}
                      />
                    </div>
                  )}
                  {item.body && (
                    <p style={{ fontFamily: 'var(--font-ko)', fontSize: 13, lineHeight: 2, color: '#5d5850', whiteSpace: 'pre-line', flex: 1 }}>
                      {item.body}
                    </p>
                  )}
                </div>
              )
            })}
            </SectionToggle>
          </AnimatedSection>
        )
      }

      // V3 · 풀폭 사진 배경 + 오버레이 (모든 아이템 각각 배경)
      if (v === 3) {
        return (
          <AnimatedSection className={`ts-sec ts-anim-ls-v3`} key={`lovestory-${v}`} style={{ padding: 0 }}>
            <SectionToggle enabled={lsToggle?.enabled ?? false} label={lsToggle?.label || '스토리 보기'} btnStyle={lsToggle?.style}>
            {items.map((item, idx) => {
              const photos = getPhotos(item)
              const photo = photos[0]
              if (photo) {
                return (
                  <div key={idx} className="ts-ls-stagger" style={{ '--ls-i': idx, position: 'relative', width: '100%', minHeight: 320, overflow: 'hidden' } as React.CSSProperties}>
                    <CropBg src={photo.url} settings={photo.settings} style={{ position: 'absolute', inset: 0 }} />
                    <div
                      style={{
                        position: 'relative', zIndex: 1, background: 'rgba(0,0,0,0.35)',
                        minHeight: 320, display: 'flex', flexDirection: 'column', justifyContent: 'center',
                        padding: '40px 28px', color: '#fff',
                      }}
                    >
                      {idx === 0 && (
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: 10, letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 16, opacity: 0.85 }}>
                          {ls.eyebrow}
                        </div>
                      )}
                      {item.body && (
                        <p style={{ fontFamily: 'var(--font-ko)', fontSize: 13, lineHeight: 2, whiteSpace: 'pre-line', opacity: 0.92 }}>
                          {item.body}
                        </p>
                      )}
                    </div>
                  </div>
                )
              }
              // 사진 없는 아이템: 텍스트만
              return item.body ? (
                <div key={idx} className="ts-ls-stagger" style={{ '--ls-i': idx, padding: '24px 28px' } as React.CSSProperties}>
                  <p style={{ fontFamily: 'var(--font-ko)', fontSize: 13, lineHeight: 2, color: '#5d5850', whiteSpace: 'pre-line' }}>
                    {item.body}
                  </p>
                </div>
              ) : null
            })}
            </SectionToggle>
          </AnimatedSection>
        )
      }

      // V4 · 카드 레이아웃 (아이템별 카드)
      if (v === 4) {
        return (
          <AnimatedSection className={`ts-sec ts-anim-ls-v4`} key={`lovestory-${v}`}>
            <div className="ts-eyebrow ts-anim-item">{ls.eyebrow}</div>
            <SectionToggle enabled={lsToggle?.enabled ?? false} label={lsToggle?.label || '스토리 보기'} btnStyle={lsToggle?.style}>
            {items.map((item, idx) => {
              const photos = getPhotos(item)
              return (
                <div
                  key={idx}
                  className="ts-ls-stagger"
                  style={{
                    '--ls-i': idx,
                    marginTop: idx === 0 ? 16 : 16,
                    border: '1px solid var(--line)',
                    borderRadius: 4,
                    overflow: 'hidden',
                  } as React.CSSProperties}
                >
                  {photos.length > 0 && (
                    <div style={{ display: 'flex', gap: 0 }}>
                      {photos.map((p, i) => (
                        <CropBg key={i} src={p.url} settings={p.settings} style={{ flex: 1, aspectRatio: '4/3' }} />
                      ))}
                    </div>
                  )}
                  {item.body && (
                    <div style={{ padding: '20px 20px', background: 'var(--card)' }}>
                      <p style={{ fontFamily: 'var(--font-ko)', fontSize: 13, lineHeight: 2, color: '#5d5850', whiteSpace: 'pre-line' }}>
                        {item.body}
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
            </SectionToggle>
          </AnimatedSection>
        )
      }

      // V5 · 타임라인 스타일 (dot + vertical line + 타이틀 라벨 + 사진)
      if (v === 5) {
        return (
          <AnimatedSection className={`ts-sec ts-anim-ls-v5`} key={`lovestory-${v}`}>
            <div className="ts-eyebrow ts-anim-item">{ls.eyebrow}</div>
            <SectionToggle enabled={lsToggle?.enabled ?? false} label={lsToggle?.label || '스토리 보기'} btnStyle={lsToggle?.style}>
            <div style={{ marginTop: 24, textAlign: 'left' }}>
              {items.map((item, idx) => {
                const isLast = idx === items.length - 1
                const photos = getPhotos(item)
                return (
                  <div
                    key={idx}
                    className="ts-ls-stagger"
                    style={{
                      '--ls-i': idx,
                      position: 'relative',
                      paddingLeft: 28,
                      paddingBottom: isLast ? 0 : 32,
                    } as React.CSSProperties}
                  >
                    {/* 타임라인 세로선 */}
                    {!isLast && (
                      <div style={{
                        position: 'absolute', left: 6, top: 10, bottom: 0, width: 1,
                        background: 'color-mix(in srgb, var(--point) 30%, transparent)',
                      }} />
                    )}
                    {/* 타임라인 dot */}
                    <div style={{
                      position: 'absolute', left: 1, top: 6,
                      width: 11, height: 11, borderRadius: '50%',
                      border: '2px solid var(--point)',
                      background: 'var(--bg, #fff)',
                    }} />
                    {/* 타이틀 라벨 */}
                    {item.title && (
                      <div style={{
                        fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 500,
                        letterSpacing: '0.1em', textTransform: 'uppercase',
                        color: 'var(--point)', marginBottom: 8,
                      }}>
                        {item.title}
                      </div>
                    )}
                    {item.body && (
                      <p style={{ fontFamily: 'var(--font-ko)', fontSize: 13, lineHeight: 2, color: '#5d5850', whiteSpace: 'pre-line' }}>
                        {item.body}
                      </p>
                    )}
                    {photos.length > 0 && (
                      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                        {photos.map((p, i) => (
                          <CropBg
                            key={i}
                            src={p.url}
                            settings={p.settings}
                            style={{ flex: 1, aspectRatio: '4/3', borderRadius: 4, overflow: 'hidden' }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            </SectionToggle>
          </AnimatedSection>
        )
      }

      // V1 · 기본 (사진 위 + 텍스트 아래, 아이템별 반복)
      return (
        <AnimatedSection className={`ts-sec ts-anim-ls-v1`} key={`lovestory-${v}`}>
          <div className="ts-eyebrow ts-anim-item">{ls.eyebrow}</div>
          <SectionToggle enabled={lsToggle?.enabled ?? false} label={lsToggle?.label || '스토리 보기'} btnStyle={lsToggle?.style}>
          {items.map((item, idx) => renderItemV1(item, idx))}
          </SectionToggle>
        </AnimatedSection>
      )
    },

    thanks: (v) => {
      // V2 · 미니멀 · 이름 + 얇은 라인
      if (v === 2) {
        return (
          <AnimatedSection className={`ts-thanks ts-anim-thx-v${v}`} key={`thanks-${v}`} style={{ textAlign: 'center', padding: '40px 24px' }}>
            <div
              style={{
                fontFamily: 'var(--font-ko)',
                fontSize: 13,
                color: 'var(--mute)',
                lineHeight: 2,
                whiteSpace: 'pre-line',
                marginBottom: 24,
              }}
            >
              {thanks.body}
            </div>
            <div
              style={{
                width: 30,
                height: 1,
                background: 'var(--line)',
                margin: '0 auto 20px',
              }}
            />
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 15,
                letterSpacing: '0.1em',
                color: 'var(--ink)',
              }}
            >
              {groomName} &middot; {brideName}
            </div>
          </AnimatedSection>
        )
      }

      // V3 · 스크립트 마크 · 큰 타이틀
      if (v === 3) {
        return (
          <AnimatedSection className={`ts-thanks ts-anim-thx-v${v}`} key={`thanks-${v}`} style={{ textAlign: 'center', padding: '48px 24px' }}>
            <div
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 32,
                fontStyle: 'italic',
                color: 'var(--accent)',
                lineHeight: 1,
                marginBottom: 16,
              }}
            >
              {thanks.mark || 'Thank you'}
            </div>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 13,
                letterSpacing: '0.3em',
                color: 'var(--ink)',
                textTransform: 'uppercase',
                marginBottom: 20,
              }}
            >
              {thanks.title}
            </div>
            <p
              style={{
                fontFamily: 'var(--font-ko)',
                fontSize: 13,
                color: 'var(--mute)',
                lineHeight: 1.9,
                whiteSpace: 'pre-line',
                marginBottom: 24,
              }}
            >
              {thanks.body}
            </p>
            <div
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 16,
                fontStyle: 'italic',
                color: 'var(--ink)',
              }}
            >
              {groomName} &amp; {brideName}
            </div>
          </AnimatedSection>
        )
      }

      // V4 · 카드 프레임 · 베이지 박스
      if (v === 4) {
        return (
          <AnimatedSection className={`ts-thanks ts-anim-thx-v${v}`} key={`thanks-${v}`} style={{ padding: '32px 20px' }}>
            <div
              style={{
                background: 'var(--card)',
                border: '1px solid var(--line)',
                padding: '36px 24px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 11,
                  letterSpacing: '0.3em',
                  color: 'var(--accent)',
                  textTransform: 'uppercase',
                  marginBottom: 14,
                }}
              >
                {thanks.mark || 'With Gratitude'}
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 20,
                  color: 'var(--ink)',
                  letterSpacing: '0.05em',
                  marginBottom: 16,
                }}
              >
                {thanks.title}
              </div>
              <p
                style={{
                  fontFamily: 'var(--font-ko)',
                  fontSize: 13,
                  color: '#5d5850',
                  lineHeight: 1.9,
                  whiteSpace: 'pre-line',
                  marginBottom: 20,
                }}
              >
                {thanks.body}
              </p>
              <div
                style={{
                  width: 24,
                  height: 1,
                  background: 'var(--accent)',
                  margin: '0 auto 12px',
                }}
              />
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 18,
                  letterSpacing: '0.1em',
                  color: 'var(--ink)',
                }}
              >
                {groomName} &amp; {brideName}
              </div>
            </div>
          </AnimatedSection>
        )
      }

      // V5 · 센터 스탬프 · 데코 보더
      if (v === 5) {
        return (
          <AnimatedSection className={`ts-thanks ts-anim-thx-v${v}`} key={`thanks-${v}`} style={{ padding: '48px 24px', textAlign: 'center' }}>
            <div
              style={{
                display: 'inline-block',
                border: '1px double var(--accent)',
                padding: '28px 32px',
                minWidth: 220,
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 11,
                  letterSpacing: '0.4em',
                  color: 'var(--mute)',
                  textTransform: 'uppercase',
                  marginBottom: 10,
                }}
              >
                {thanks.mark || 'Thank You'}
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 18,
                  color: 'var(--ink)',
                  letterSpacing: '0.08em',
                  marginBottom: 14,
                }}
              >
                {thanks.title}
              </div>
              <div
                style={{
                  width: 40,
                  height: 1,
                  background: 'var(--line)',
                  margin: '0 auto 12px',
                }}
              />
              <div
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: 14,
                  fontStyle: 'italic',
                  color: 'var(--ink)',
                }}
              >
                {groomName} &amp; {brideName}
              </div>
            </div>
            <p
              style={{
                fontFamily: 'var(--font-ko)',
                fontSize: 12,
                color: 'var(--mute)',
                lineHeight: 1.9,
                whiteSpace: 'pre-line',
                marginTop: 20,
              }}
            >
              {thanks.body}
            </p>
          </AnimatedSection>
        )
      }

      // V1 · 기본
      return (
        <AnimatedSection className={`ts-thanks ts-anim-thx-v${v}`} key={`thanks-${v}`}>
          <div className="ts-thanks-mark">{thanks.mark}</div>
          <div className="ts-thanks-title">{thanks.title}</div>
          <div className="ts-thanks-rule" />
          <p className="ts-thanks-body" style={{ whiteSpace: 'pre-line' }}>
            {thanks.body}
          </p>
          <div className="ts-thanks-sign">
            {groomName} &amp; {brideName}
          </div>
        </AnimatedSection>
      )
    },
  }

  // 숨김 섹션 필터링
  const visibleSections = data.sectionOrder.filter((id) => !data.hiddenSections.includes(id))

  // 폰트 설정 (에디터에서 선택) → CSS 변수로 주입
  const displayFontFamily = resolveDisplayFontFamily(data.displayFont)
  const koreanFontFamily = resolveKoreanFontFamily(data.fontStyle)
  const fontScale = typeof data.fontScale === 'number' ? data.fontScale : 1
  const spacingScale = typeof data.sectionSpacing === 'number' ? data.sectionSpacing : 1
  const dividerV = data.dividerVariant ?? 1
  const pointColor = data.pointColor || '#B8A88A'
  const cardBg = data.cardBg || '#f5f5f5'
  const previewFontStyle = {
    ['--font-display' as string]: displayFontFamily,
    ['--font-ko' as string]: koreanFontFamily,
    ['--font-sans' as string]: koreanFontFamily,
    ['--font-serif' as string]: koreanFontFamily,
    ['--ts-font-scale' as string]: String(fontScale),
    ['--ts-spacing-scale' as string]: String(spacingScale),
    ['--point' as string]: pointColor,
    ['--card' as string]: cardBg,
  } as React.CSSProperties

  return (
    <div className="ts-preview" style={previewFontStyle}>
      {/* 인트로는 sticky로 화면에 고정 — 본문이 그 위를 덮으며 올라옴 */}
      <div className="ts-intro-sticky">
        {(() => {
          const introId = visibleSections.find((id) => getSectionType(id) === 'intro')
          if (!introId) return null
          const introVariant = data.sectionVariants[introId] ?? 1
          return (
            <>
              {renderers.intro(introVariant, introId)}
              {/* 스크롤 유도 인디케이터 — 인트로 애니메이션 완료 후 등장 */}
              <div className="ts-scroll-hint" aria-hidden="true">
                <span className="ts-scroll-hint-label">SCROLL</span>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="7 10 12 15 17 10" />
                </svg>
              </div>
            </>
          )
        })()}
      </div>
      {/* 본문 래퍼 — 인트로 위로 겹쳐 올라오는 오버랩 */}
      <div className="ts-body-wrap">
      {(() => {
        const bodySections = visibleSections.filter((id) => getSectionType(id) !== 'intro')
        // 각 섹션의 틴트 여부를 미리 계산
        const tintedColor = data.tintedColor || '#FAF8F5'
        const isSectionTinted = (sId: string) => {
          const override = data.sectionBgMap?.[sId]
          if (override === 'tinted') return true
          if (override === 'default') return false
          return data.sectionBgMode === 'tinted' && data.sectionOrder.indexOf(sId) % 2 === 1
        }
        return bodySections.map((id, _filteredIndex) => {
          const type = getSectionType(id)
          const renderer = renderers[type]
          if (!renderer) return null
          const variant = data.sectionVariants[id] ?? 1
          const isTinted = isSectionTinted(id)
          const sectionBg = isTinted ? tintedColor : '#ffffff'
          // 디바이더 배경: 위쪽 절반은 이전 섹션 색, 아래쪽 절반은 현재 섹션 색
          // → 디바이더 라인이 정확히 배경색 전환 경계가 됨
          const prevId = _filteredIndex > 0 ? bodySections[_filteredIndex - 1] : null
          const prevTinted = prevId ? isSectionTinted(prevId) : false
          const topColor = prevTinted ? tintedColor : '#ffffff'
          const bottomColor = isTinted ? tintedColor : '#ffffff'
          const needsDividerGradient = topColor !== bottomColor
          const dividerStyle = needsDividerGradient
            ? { background: `linear-gradient(to bottom, ${topColor} 50%, ${bottomColor} 50%)` }
            : topColor !== '#ffffff' ? { background: topColor } : undefined
          return (
            <div key={id}>
              {_filteredIndex > 0 && !(data.hiddenDividers || []).includes(id) && (
                <div style={dividerStyle}>
                  <div className="ts-sec ts-sec--compact" aria-hidden="true">
                    <Divider variant={dividerV} />
                  </div>
                </div>
              )}
              <div style={isTinted ? { background: tintedColor } : undefined}>
                {renderer(variant, id)}
              </div>
            </div>
          )
        })
      })()}
      {/* 공유 버튼 + 푸터 */}
      <div
        style={{
          textAlign: 'center',
          padding: '32px 24px 20px',
          borderTop: '1px solid var(--line)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 10,
            marginBottom: 28,
          }}
        >
          {/* 카카오 공유 */}
          <button
            type="button"
            onClick={() => {
              const kakaoWindow = window as typeof window & {
                Kakao?: {
                  isInitialized?: () => boolean
                  Share?: { sendDefault: (config: object) => void }
                }
              }
              const url = typeof window !== 'undefined' ? window.location.href : ''
              const gN = data.groom?.name || '신랑'
              const bN = data.bride?.name || '신부'

              // 크롭된 카카오 > 카카오 원본 > 크롭된 OG > OG 원본 > 인트로 사진 > 갤러리 첫 번째
              const firstGalleryUrl = (() => {
                if (!data.galleries) return ''
                for (const key of Object.keys(data.galleries)) {
                  const imgs = data.galleries[key]
                  if (Array.isArray(imgs) && imgs.length > 0) return (imgs[0] as { webUrl?: string })?.webUrl || ''
                }
                return ''
              })()
              const rawImg = data.meta?.kakaoThumbnailCropped
                || data.meta?.kakaoThumbnail?.url
                || data.meta?.ogImageCropped
                || (typeof data.meta?.ogImage === 'string' && data.meta.ogImage ? data.meta.ogImage : data.meta?.ogImage && typeof data.meta.ogImage === 'object' ? data.meta.ogImage.url : '')
                || data.sections?.intro?.photo?.url
                || firstGalleryUrl
                || ''
              // 카카오는 절대 URL만 인식 - 상대경로를 절대경로로 변환
              const toAbsolute = (u: string) => {
                if (!u) return ''
                if (u.startsWith('https://') || u.startsWith('http://')) return u
                return `https://invite.deardrawer.com${u.startsWith('/') ? '' : '/'}${u}`
              }
              const kakaoImg = toAbsolute(rawImg)
              const shareTitle = data.meta?.title || `${gN} ♥ ${bN} 결혼합니다`
              // 설명: 커스텀 설명 > 날짜+시간+장소 자동생성 > 장소명만
              let shareDesc = data.meta?.description || ''
              if (!shareDesc && data.wedding?.date) {
                const d = new Date(data.wedding.date + 'T00:00:00')
                if (!isNaN(d.getTime())) {
                  const wd = ['일','월','화','수','목','금','토']
                  shareDesc = `${d.getFullYear()}년 ${d.getMonth()+1}월 ${d.getDate()}일 ${wd[d.getDay()]}요일`
                  if (data.wedding.timeDisplay) shareDesc += ` ${data.wedding.timeDisplay}`
                  if (data.wedding.venue?.name) shareDesc += `\n${data.wedding.venue.name}`
                }
              }
              if (!shareDesc) shareDesc = data.wedding?.venue?.name || ''

              if (kakaoWindow.Kakao?.Share && kakaoWindow.Kakao.isInitialized?.()) {
                const kakaoRatioSizes: Record<string, { w: number; h: number }> = { '3:4': { w: 900, h: 1200 }, '1:1': { w: 800, h: 800 }, '3:2': { w: 1200, h: 800 } }
                const kakaoImgSize = kakaoRatioSizes[data.meta?.kakaoThumbnailRatio || '1:1']

                kakaoWindow.Kakao.Share.sendDefault({
                  objectType: 'feed',
                  content: {
                    title: shareTitle,
                    description: shareDesc,
                    imageUrl: kakaoImg || 'https://invite.deardrawer.com/og-image.png',
                    imageWidth: kakaoImgSize.w,
                    imageHeight: kakaoImgSize.h,
                    link: { mobileWebUrl: url, webUrl: url },
                  },
                  buttons: [{ title: '청첩장 보기', link: { mobileWebUrl: url, webUrl: url } }],
                })
              } else {
                navigator.clipboard.writeText(url)
                alert('카카오톡 공유를 사용할 수 없어 링크가 복사��었습니다.')
              }
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontFamily: 'var(--font-ko)',
              fontSize: 12,
              color: 'var(--ink)',
              border: '1px solid var(--line)',
              borderRadius: 6,
              padding: '10px 18px',
              background: '#fff',
              cursor: 'pointer',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3C6.48 3 2 6.58 2 10.94c0 2.8 1.86 5.27 4.66 6.67l-.9 3.33c-.07.28.24.51.48.36l3.87-2.57c.6.08 1.23.13 1.89.13 5.52 0 10-3.58 10-7.92S17.52 3 12 3z" /></svg>
            카카오톡 공유
          </button>
          {/* 링크 복사 */}
          <button
            type="button"
            onClick={() => {
              const url = typeof window !== 'undefined' ? window.location.href : ''
              navigator.clipboard.writeText(url).then(() => {
                setLinkCopied(true)
                setTimeout(() => setLinkCopied(false), 2000)
              })
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontFamily: 'var(--font-ko)',
              fontSize: 12,
              color: 'var(--ink)',
              border: '1px solid var(--line)',
              borderRadius: 6,
              padding: '10px 18px',
              background: '#fff',
              cursor: 'pointer',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
            {linkCopied ? '복사됨!' : '링크 복사'}
          </button>
        </div>
        {/* dear drawer 푸터 */}
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 10,
            letterSpacing: '0.2em',
            color: '#bbb',
            textTransform: 'uppercase',
          }}
        >
          dear drawer
        </div>
      </div>
      </div>{/* /ts-body-wrap */}
      <RsvpModal open={rsvpOpen} onClose={() => setRsvpOpen(false)} invitationId={data.id} showMealOption={data.sections.rsvp.showMealOption} showShuttleOption={data.sections.rsvp.showShuttleOption} showSideOption={data.sections.rsvp.showSideOption} rsvpNotice={data.sections.rsvp.rsvpNotice} />
      <GalleryLightbox images={lightboxImages} isOpen={lightboxOpen} initialIndex={lightboxIndex} onClose={() => setLightboxOpen(false)} variant={data.lightboxVariant ?? 1} />
    </div>
  )
}

/* ==========================================================================
 * GalleryLightbox — 9 variant 갤러리 뷰어
 * ========================================================================== */
function GalleryLightbox({ images, isOpen, initialIndex, onClose, variant = 1 }: {
  images: string[]
  isOpen: boolean
  initialIndex: number
  onClose: () => void
  variant?: number
}) {
  const [idx, setIdx] = useState(initialIndex)
  const [animClass, setAnimClass] = useState('')
  const [transitioning, setTransitioning] = useState(false)
  const touchStartX = useRef(0)
  const overlayRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  // V9: 오버레이 전환용 — 새 사진이 기존 위에 페이드인
  const [v9Next, setV9Next] = useState<number | null>(null)

  useContainedOverlay(overlayRef, isOpen)

  useEffect(() => {
    if (isOpen) {
      setIdx(initialIndex)
      setAnimClass('')
      setTransitioning(false)
    }
  }, [initialIndex, isOpen, variant])

  const goTo = useCallback((nextIdx: number, dir: 'next' | 'prev') => {
    if (transitioning || nextIdx === idx) return
    setTransitioning(true)
    // V5(시네마틱) 페이드 전환
    if (variant === 5) {
      setAnimClass('ts-lb-img--fade-out')
      setTimeout(() => {
        setIdx(nextIdx)
        setAnimClass('ts-lb-img--fade-in')
        setTimeout(() => { setAnimClass(''); setTransitioning(false) }, 500)
      }, 500)
      return
    }
    // V9: 기존 사진 위에 새 사진 오버레이 페이드인
    if (variant === 9) {
      setV9Next(nextIdx)
      setTimeout(() => {
        setIdx(nextIdx)
        setV9Next(null)
        setTransitioning(false)
      }, 500)
      return
    }
    // 기본 슬라이드 전환
    setAnimClass(`ts-lb-img--exit-${dir}`)
    setTimeout(() => {
      setIdx(nextIdx)
      setAnimClass(`ts-lb-img--enter-${dir}`)
      setTimeout(() => { setAnimClass(''); setTransitioning(false) }, 350)
    }, 350)
  }, [transitioning, idx, variant])

  const goNext = useCallback(() => {
    goTo((idx + 1) % images.length, 'next')
  }, [goTo, idx, images.length])

  const goPrev = useCallback(() => {
    goTo((idx - 1 + images.length) % images.length, 'prev')
  }, [goTo, idx, images.length])

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (variant !== 4) {
        if (e.key === 'ArrowRight') goNext()
        if (e.key === 'ArrowLeft') goPrev()
      }
    }
    const onGesture = (e: Event) => e.preventDefault()
    const onTouchMove = (e: TouchEvent) => { if (e.touches.length > 1) e.preventDefault() }
    window.addEventListener('keydown', onKey)
    document.addEventListener('gesturestart', onGesture, { passive: false })
    document.addEventListener('gesturechange', onGesture, { passive: false })
    document.addEventListener('touchmove', onTouchMove, { passive: false })
    return () => {
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('gesturestart', onGesture)
      document.removeEventListener('gesturechange', onGesture)
      document.removeEventListener('touchmove', onTouchMove)
    }
  }, [isOpen, onClose, goNext, goPrev, variant])


  if (!isOpen || images.length === 0) return null

  const pad = (n: number) => String(n).padStart(2, '0')
  const v = variant

  // === V4: 룩북 스크롤 (전체 이미지 세로 나열) ===
  if (v === 4) {
    return (
      <div ref={overlayRef} className="ts-lightbox ts-lb--v4" onClick={onClose}>
        <button className="ts-lb-v4-close" onClick={onClose}>&times;</button>
        <div ref={scrollRef} className="ts-lb-v4-scroll" onClick={e => e.stopPropagation()}>
          {images.map((src, i) => (
            <img key={i} src={src} alt="" className="ts-lb-v4-img" draggable={false} />
          ))}
        </div>
      </div>
    )
  }

  // 공통 터치/스와이프 핸들러
  const touchProps = {
    onTouchStart: (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX },
    onTouchEnd: (e: React.TouchEvent) => {
      const diff = e.changedTouches[0].clientX - touchStartX.current
      if (Math.abs(diff) > 50) { diff < 0 ? goNext() : goPrev() }
    },
  }

  // === V9: 필름 스트립 (좌우 캐러셀 — 중앙 사진 슬라이드) ===
  if (v === 9) {
    const prevIdx = (idx - 1 + images.length) % images.length
    const nextIdx = (idx + 1) % images.length
    return (
      <div ref={overlayRef} className="ts-lightbox ts-lb--v9" onClick={onClose}>
        <button className="ts-lb-topbar-close ts-lb-v9-close" onClick={onClose}>&times;</button>
        <div className="ts-lb-v9-carousel" onClick={e => e.stopPropagation()} {...touchProps}>
          <div className="ts-lb-v9-side ts-lb-v9-side--prev" onClick={goPrev}>
            <img src={images[prevIdx]} alt="" draggable={false} />
          </div>
          <div className="ts-lb-v9-current">
            <img src={images[idx]} alt="" draggable={false} />
            {v9Next !== null && (
              <img src={images[v9Next]} alt="" draggable={false} className="ts-lb-v9-overlay" />
            )}
          </div>
          <div className="ts-lb-v9-side ts-lb-v9-side--next" onClick={goNext}>
            <img src={images[nextIdx]} alt="" draggable={false} />
          </div>
        </div>
        <div className="ts-lb-counter">{pad(idx + 1)} / {pad(images.length)}</div>
      </div>
    )
  }

  // === V1: 에디토리얼 (기존) ===
  if (v === 1) {
    return (
      <div ref={overlayRef} className="ts-lightbox ts-lb--v1" onClick={onClose}>
        <div className="ts-lb-topbar">
          <span className="ts-lb-topbar-title">Gallery</span>
          <button className="ts-lb-topbar-close" onClick={onClose}>&times;</button>
        </div>
        <div className="ts-lb-image-wrap" onClick={e => e.stopPropagation()} {...touchProps}>
          {images[idx] && <img src={images[idx]} alt="" className={`ts-lb-img ${animClass}`} onClick={goNext} draggable={false} />}
        </div>
        <div className="ts-lb-counter">{pad(idx + 1)} / {pad(images.length)}</div>
        <div className="ts-lb-progress">
          <div className="ts-lb-progress-fill" style={{ width: `${((idx + 1) / images.length) * 100}%` }} />
        </div>
      </div>
    )
  }

  // === V2: 글라스모피즘 ===
  if (v === 2) {
    return (
      <div ref={overlayRef} className="ts-lightbox ts-lb--v2" onClick={onClose}>
        <button className="ts-lb-topbar-close ts-lb-v2-close" onClick={onClose}>&times;</button>
        <div className="ts-lb-image-wrap ts-lb-v2-wrap" onClick={e => e.stopPropagation()} {...touchProps}>
          {images[idx] && <img src={images[idx]} alt="" className={`ts-lb-img ts-lb-v2-img ${animClass}`} onClick={goNext} draggable={false} />}
        </div>
        <div className="ts-lb-v2-dots">
          {images.map((_, i) => (
            <span key={i} className={`ts-lb-v2-dot ${i === idx ? 'ts-lb-v2-dot--active' : ''}`} onClick={e => { e.stopPropagation(); if (i !== idx) goTo(i, i > idx ? 'next' : 'prev') }} />
          ))}
        </div>
      </div>
    )
  }

  // === V5: 시네마틱 페이드 ===
  if (v === 5) {
    return (
      <div ref={overlayRef} className="ts-lightbox ts-lb--v5" onClick={onClose}>
        <div className="ts-lb-image-wrap ts-lb-v5-wrap" onClick={e => e.stopPropagation()} {...touchProps}>
          {images[idx] && <img src={images[idx]} alt="" className={`ts-lb-img ts-lb-v5-img ${animClass}`} onClick={goNext} draggable={false} />}
        </div>
      </div>
    )
  }

  // === V6: 미니멀 화이트 ===
  if (v === 6) {
    return (
      <div ref={overlayRef} className="ts-lightbox ts-lb--v6" onClick={onClose}>
        <button className="ts-lb-topbar-close ts-lb-v6-close" onClick={onClose}>&times;</button>
        <div className="ts-lb-image-wrap ts-lb-v6-wrap" onClick={e => e.stopPropagation()} {...touchProps}>
          <button className="ts-lb-v6-arrow ts-lb-v6-arrow--prev" onClick={e => { e.stopPropagation(); goPrev() }} aria-label="이전">&#8249;</button>
          {images[idx] && <img src={images[idx]} alt="" className={`ts-lb-img ${animClass}`} draggable={false} />}
          <button className="ts-lb-v6-arrow ts-lb-v6-arrow--next" onClick={e => { e.stopPropagation(); goNext() }} aria-label="다음">&#8250;</button>
        </div>
        <div className="ts-lb-v6-counter">{idx + 1} / {images.length}</div>
      </div>
    )
  }

  // === V7: 매거진 (썸네일 스트립) ===
  if (v === 7) {
    return (
      <div ref={overlayRef} className="ts-lightbox ts-lb--v7" onClick={onClose}>
        <button className="ts-lb-topbar-close ts-lb-v7-close" onClick={onClose}>&times;</button>
        <div className="ts-lb-image-wrap ts-lb-v7-wrap" onClick={e => e.stopPropagation()} {...touchProps}>
          <button className="ts-lb-v7-arrow ts-lb-v7-arrow--prev" onClick={e => { e.stopPropagation(); goPrev() }} aria-label="이전">&#8249;</button>
          {images[idx] && <img src={images[idx]} alt="" className={`ts-lb-img ${animClass}`} draggable={false} />}
          <button className="ts-lb-v7-arrow ts-lb-v7-arrow--next" onClick={e => { e.stopPropagation(); goNext() }} aria-label="다음">&#8250;</button>
        </div>
        <div className="ts-lb-v7-thumbs" onClick={e => e.stopPropagation()}>
          {(() => {
            const total = images.length
            const visible: number[] = []
            for (let offset = -2; offset <= 2; offset++) {
              visible.push(((idx + offset) % total + total) % total)
            }
            return visible.map((i) => (
              <div key={i} className={`ts-lb-v7-thumb ${i === idx ? 'ts-lb-v7-thumb--active' : ''}`} onClick={() => { if (i !== idx) goTo(i, i > idx ? 'next' : 'prev') }}>
                <img src={images[i]} alt="" draggable={false} />
              </div>
            ))
          })()}
        </div>
      </div>
    )
  }

  // fallback → V1
  return (
    <div ref={overlayRef} className="ts-lightbox ts-lb--v1" onClick={onClose}>
      <div className="ts-lb-topbar">
        <span className="ts-lb-topbar-title">Gallery</span>
        <button className="ts-lb-topbar-close" onClick={onClose}>&times;</button>
      </div>
      <div className="ts-lb-image-wrap" onClick={e => e.stopPropagation()} {...touchProps}>
        {images[idx] && <img src={images[idx]} alt="" className={`ts-lb-img ${animClass}`} onClick={goNext} draggable={false} />}
      </div>
      <div className="ts-lb-counter">{pad(idx + 1)} / {pad(images.length)}</div>
      <div className="ts-lb-progress">
        <div className="ts-lb-progress-fill" style={{ width: `${((idx + 1) / images.length) * 100}%` }} />
      </div>
    </div>
  )
}

/**
 * 섹션 사이 구분선 · 6 variants
 * 0=none, 1=line, 2=dots, 3=dashed, 4=double, 5=ornament
 */
function Divider({ variant }: { variant: number }) {
  switch (variant) {
    case 0:
      return null
    case 2:
      return (
        <div className="ts-divider--v2" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      )
    case 3:
      return <div className="ts-divider--v3" aria-hidden="true" />
    case 4:
      return <div className="ts-divider--v4" aria-hidden="true" />
    case 5:
      return (
        <div className="ts-divider--v5" aria-hidden="true">
          <i />
        </div>
      )
    case 1:
    default:
      return <div className="ts-divider--v1" aria-hidden="true" />
  }
}
