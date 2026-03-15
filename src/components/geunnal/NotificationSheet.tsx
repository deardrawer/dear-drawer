'use client'
import { useState, useEffect, useRef } from 'react'
import { Check, ChevronDown, Loader2 } from 'lucide-react'
import BottomSheet from './BottomSheet'

interface NotificationSheetProps {
  open: boolean
  onClose: () => void
  pageId: string
  token: string
}

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
}: NotificationSheetProps) {
  const [selectedDay, setSelectedDay] = useState<DayValue>('none')
  const [selectedTime, setSelectedTime] = useState('09:00')
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)
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

    // Try loading from server first
    if (token) {
      setLoading(true)
      fetch('/api/geunnal/push/subscribe', {
        headers: { 'Authorization': `Bearer ${token}` },
      })
        .then(res => res.ok ? res.json() as Promise<{ dayBefore?: string; notifyTime?: string }> : null)
        .then(data => {
          if (data) {
            setSelectedDay((data.dayBefore as DayValue) || 'none')
            setSelectedTime(data.notifyTime || '09:00')
          } else {
            loadFromLocalStorage()
          }
        })
        .catch(() => loadFromLocalStorage())
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

          await fetch('/api/geunnal/push/subscribe', {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ endpoint }),
          }).catch(() => {})
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
            await fetch('/api/geunnal/push/subscribe', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                endpoint: subJson.endpoint,
                p256dh: subJson.keys?.p256dh || '',
                auth: subJson.keys?.auth || '',
                dayBefore: selectedDay,
                notifyTime: selectedTime,
              }),
            })
          } catch (err) {
            console.error('Push subscription failed:', err)
            // Still saved in localStorage as fallback
          }
        }
      }
    } finally {
      setSaving(false)
      onClose()
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

            {permissionDenied && (
              <p className="text-[12px] text-[#D4899A] px-1">
                알림 권한이 차단되어 있습니다. 브라우저 설정에서 알림을 허용해주세요.
              </p>
            )}

            <button
              onClick={handleSave}
              disabled={saving}
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
