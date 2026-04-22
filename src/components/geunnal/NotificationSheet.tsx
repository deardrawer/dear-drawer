'use client'
import { useState, useEffect, useRef } from 'react'
import { Check, ChevronDown, Loader2 } from 'lucide-react'
import BottomSheet from './BottomSheet'
import { geunnalFetch, SessionExpiredError } from '@/lib/geunnalFetch'

interface NotificationSheetProps {
  open: boolean
  onClose: () => void
  pageId: string
  token: string
  onSessionExpired?: () => void
}

// 브라우저/환경 감지 헬퍼
function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

function isInAppBrowser(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  return /KAKAOTALK|NAVER|Line|Instagram|FBAN|FBAV/i.test(ua)
}

function isPWAInstalled(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  )
}

type EnvWarning = 'inapp' | 'ios-not-pwa' | null

const DAY_OPTIONS = [
  { value: 'none', label: '알림 없음' },
  { value: '0d', label: '당일' },
  { value: '1d', label: '하루 전' },
  { value: '2d', label: '이틀 전' },
] as const

type DayValue = (typeof DAY_OPTIONS)[number]['value']

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => ({
  value: String(i).padStart(2, '0'),
  label: String(i).padStart(2, '0'),
}))

const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, i) => ({
  value: String(i).padStart(2, '0'),
  label: String(i).padStart(2, '0'),
}))

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) outputArray[i] = rawData.charCodeAt(i)
  return outputArray
}

export default function NotificationSheet({
  open,
  onClose,
  pageId,
  token,
  onSessionExpired,
}: NotificationSheetProps) {
  const [selectedDay, setSelectedDay] = useState<DayValue>('none')
  const [selectedTime, setSelectedTime] = useState('09:00')
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)
  const [pushError, setPushError] = useState<string | null>(null)
  const [envWarning, setEnvWarning] = useState<EnvWarning>(null)
  const loadedRef = useRef(false)

  // 열릴 때: 서버 설정 로드 (fallback: localStorage)
  useEffect(() => {
    if (!open) {
      loadedRef.current = false
      return
    }
    if (loadedRef.current) return
    loadedRef.current = true

    setPermissionDenied(
      typeof Notification !== 'undefined' && Notification.permission === 'denied'
    )
    setPushError(null)

    // 환경 감지: 인앱 브라우저 또는 iOS 비-PWA
    if (isInAppBrowser()) {
      setEnvWarning('inapp')
    } else if (isIOS() && !isPWAInstalled()) {
      setEnvWarning('ios-not-pwa')
    } else {
      setEnvWarning(null)
    }

    // Try loading from server first
    if (token) {
      setLoading(true)
      geunnalFetch('/api/geunnal/push/subscribe', { token, pageId }, onSessionExpired)
        .then(res => res.ok ? res.json() as Promise<{ dayBefore?: string; notifyTime?: string }> : null)
        .then(data => {
          if (data) {
            setSelectedDay((data.dayBefore as DayValue) || 'none')
            setSelectedTime(data.notifyTime || '09:00')
          } else {
            loadFromLocalStorage()
          }
        })
        .catch((err) => { if (!(err instanceof SessionExpiredError)) loadFromLocalStorage() })
        .finally(() => setLoading(false))
    } else {
      loadFromLocalStorage()
    }

    function loadFromLocalStorage() {
      const saved = localStorage.getItem(`geunnal-notify-${pageId}`)
      if (saved) {
        const [day, time] = saved.split('|')
        setSelectedDay((day as DayValue) || 'none')
        setSelectedTime(time || '09:00')
      } else {
        setSelectedDay('none')
        setSelectedTime('09:00')
      }
    }
  }, [open, pageId, token])

  const handleDaySelect = async (value: DayValue) => {
    if (value !== 'none' && typeof Notification !== 'undefined') {
      if (Notification.permission === 'denied') {
        setPermissionDenied(true)
        return
      }
      if (Notification.permission === 'default') {
        const result = await Notification.requestPermission()
        if (result === 'denied') {
          setPermissionDenied(true)
          return
        }
      }
    }
    setSelectedDay(value)
    setPermissionDenied(false)
  }

  const handleSave = async () => {
    setSaving(true)
    setPushError(null)
    let failed = false

    try {
      if (selectedDay === 'none') {
        // 알림 해제
        localStorage.setItem(`geunnal-notify-${pageId}`, 'none|')

        if (token) {
          // Unsubscribe from push on server
          let endpoint = ''
          try {
            const sw = await navigator.serviceWorker?.ready
            const sub = await sw?.pushManager?.getSubscription()
            endpoint = sub?.endpoint || ''
          } catch { /* no SW */ }

          await geunnalFetch('/api/geunnal/push/subscribe', {
            method: 'DELETE',
            token, pageId,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ endpoint }),
          }, onSessionExpired).catch((err) => { if (err instanceof SessionExpiredError) throw err })
        }
      } else {
        // 알림 설정: SW 등록 → Push 구독 → 서버 저장
        localStorage.setItem(`geunnal-notify-${pageId}`, `${selectedDay}|${selectedTime}`)

        if (token && VAPID_PUBLIC_KEY && 'serviceWorker' in navigator) {
          try {
            const registration = await navigator.serviceWorker.register('/sw.js')
            await navigator.serviceWorker.ready

            const subscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY).buffer as ArrayBuffer,
            })

            const subJson = subscription.toJSON()
            await geunnalFetch('/api/geunnal/push/subscribe', {
              method: 'POST',
              token, pageId,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                endpoint: subJson.endpoint,
                p256dh: subJson.keys?.p256dh || '',
                auth: subJson.keys?.auth || '',
                dayBefore: selectedDay,
                notifyTime: selectedTime,
              }),
            }, onSessionExpired)
          } catch (err) {
            console.error('Push subscription failed:', err)
            setPushError('알림 등록에 실패했습니다. 잠시 후 다시 시도해주세요.')
            failed = true
          }
        }
      }
    } finally {
      setSaving(false)
      if (!failed) onClose()
    }
  }

  const needsTime = selectedDay !== 'none'

  return (
    <BottomSheet open={open} onClose={onClose} title="모임 알림 시간">
      <div className="flex flex-col gap-4">
        <p className="text-[13px] text-[#9B8CC4]">
          모임 시작 전 알림을 받을 시간을 선택하세요.
        </p>

        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 size={20} className="animate-spin text-[#8B75D0]" />
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-1">
              {DAY_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => handleDaySelect(value)}
                  disabled={saving}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl text-[14px] transition-colors ${
                    selectedDay === value
                      ? 'bg-[#EDE9FA] text-[#8B75D0] font-medium'
                      : 'text-[#2A2240] hover:bg-[#F9F7FD]'
                  }`}
                >
                  <span>{label}</span>
                  {selectedDay === value && <Check size={18} strokeWidth={2} className="text-[#8B75D0]" />}
                </button>
              ))}
            </div>

            {needsTime && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-[#2A2240] px-1">알림 시각</label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <select
                      value={selectedTime.split(':')[0]}
                      onChange={e => setSelectedTime(`${e.target.value}:${selectedTime.split(':')[1]}`)}
                      disabled={saving}
                      className="w-full appearance-none px-4 py-3 text-[14px] text-[#2A2240] bg-[#F9F7FD] border border-[#E8E4F0] rounded-xl focus:outline-none focus:border-[#8B75D0] transition-colors pr-10"
                    >
                      {HOUR_OPTIONS.map(({ value, label }) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                    <ChevronDown size={16} strokeWidth={1.5} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9B8CC4] pointer-events-none" />
                  </div>
                  <span className="text-[16px] font-medium text-[#2A2240]">:</span>
                  <div className="relative flex-1">
                    <select
                      value={selectedTime.split(':')[1]}
                      onChange={e => setSelectedTime(`${selectedTime.split(':')[0]}:${e.target.value}`)}
                      disabled={saving}
                      className="w-full appearance-none px-4 py-3 text-[14px] text-[#2A2240] bg-[#F9F7FD] border border-[#E8E4F0] rounded-xl focus:outline-none focus:border-[#8B75D0] transition-colors pr-10"
                    >
                      {MINUTE_OPTIONS.map(({ value, label }) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                    <ChevronDown size={16} strokeWidth={1.5} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9B8CC4] pointer-events-none" />
                  </div>
                </div>
                <p className="text-[11px] text-[#C5BAE8] px-1">
                  {selectedDay === '0d' && `모임 당일 ${selectedTime}에 알림을 보냅니다.`}
                  {selectedDay === '1d' && `모임 하루 전 ${selectedTime}에 알림을 보냅니다.`}
                  {selectedDay === '2d' && `모임 이틀 전 ${selectedTime}에 알림을 보냅니다.`}
                </p>
              </div>
            )}

            {envWarning === 'inapp' && (
              <div className="rounded-xl bg-[#FFF8E7] border border-[#F0DFA0] px-4 py-3">
                <p className="text-[12px] text-[#8B6914] font-medium mb-1">
                  외부 브라우저에서 열어주세요
                </p>
                <p className="text-[11px] text-[#A68A3E] leading-relaxed">
                  카카오톡/네이버 등 앱 내 브라우저에서는 알림을 설정할 수 없습니다.
                  우측 상단 메뉴에서 &quot;Safari로 열기&quot; 또는 &quot;Chrome으로 열기&quot;를 선택해주세요.
                </p>
              </div>
            )}

            {envWarning === 'ios-not-pwa' && (
              <div className="rounded-xl bg-[#F0F4FF] border border-[#C7D4F0] px-4 py-3">
                <p className="text-[12px] text-[#3B5998] font-medium mb-1">
                  홈 화면에 추가해주세요
                </p>
                <p className="text-[11px] text-[#5B7DB8] leading-relaxed">
                  iPhone에서 알림을 받으려면 먼저 이 페이지를 홈 화면에 추가해야 합니다.
                  Safari 하단의 공유 버튼(&#x2191;)을 누른 후 &quot;홈 화면에 추가&quot;를 선택해주세요.
                </p>
              </div>
            )}

            {permissionDenied && (
              <p className="text-[12px] text-[#D4899A] px-1">
                알림 권한이 차단되어 있습니다. 브라우저 설정에서 알림을 허용해주세요.
              </p>
            )}

            {pushError && (
              <p className="text-[12px] text-[#D4899A] px-1">
                {pushError}
              </p>
            )}

            <button
              onClick={handleSave}
              disabled={saving || envWarning === 'inapp'}
              className="w-full py-3 text-[14px] font-medium text-white rounded-xl transition-colors disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #8B75D0, #B87AAB)' }}
            >
              {saving ? '저장 중...' : '저장'}
            </button>
          </>
        )}
      </div>
    </BottomSheet>
  )
}
