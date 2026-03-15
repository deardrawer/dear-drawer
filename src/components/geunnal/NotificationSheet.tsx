'use client'
import { useState, useEffect } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import BottomSheet from './BottomSheet'

interface NotificationSheetProps {
  open: boolean
  onClose: () => void
  pageId: string
}

const DAY_OPTIONS = [
  { value: 'none', label: '알림 없음' },
  { value: '0d', label: '당일' },
  { value: '1d', label: '하루 전' },
  { value: '2d', label: '이틀 전' },
] as const

type DayValue = (typeof DAY_OPTIONS)[number]['value']

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => {
  const h = String(i).padStart(2, '0')
  return { value: `${h}:00`, label: `${h}:00` }
})

export default function NotificationSheet({
  open,
  onClose,
  pageId,
}: NotificationSheetProps) {
  const [selectedDay, setSelectedDay] = useState<DayValue>('none')
  const [selectedTime, setSelectedTime] = useState('09:00')
  const [permissionDenied, setPermissionDenied] = useState(false)

  useEffect(() => {
    if (open) {
      const saved = localStorage.getItem(`geunnal-notify-${pageId}`)
      if (saved) {
        const [day, time] = saved.split('|')
        setSelectedDay((day as DayValue) || 'none')
        setSelectedTime(time || '09:00')
      } else {
        setSelectedDay('none')
        setSelectedTime('09:00')
      }
      setPermissionDenied(
        typeof Notification !== 'undefined' && Notification.permission === 'denied'
      )
    }
  }, [open, pageId])

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

  const handleSave = () => {
    if (selectedDay === 'none') {
      localStorage.setItem(`geunnal-notify-${pageId}`, 'none|')
    } else {
      localStorage.setItem(`geunnal-notify-${pageId}`, `${selectedDay}|${selectedTime}`)
    }
    onClose()
  }

  const needsTime = selectedDay !== 'none'

  return (
    <BottomSheet open={open} onClose={onClose} title="모임 알림 시간">
      <div className="flex flex-col gap-4">
        <p className="text-[13px] text-[#9B8CC4]">
          모임 시작 전 알림을 받을 시간을 선택하세요.
        </p>

        <div className="flex flex-col gap-1">
          {DAY_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => handleDaySelect(value)}
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
            <div className="relative">
              <select
                value={selectedTime}
                onChange={e => setSelectedTime(e.target.value)}
                className="w-full appearance-none px-4 py-3 text-[14px] text-[#2A2240] bg-[#F9F7FD] border border-[#E8E4F0] rounded-xl focus:outline-none focus:border-[#8B75D0] transition-colors pr-10"
              >
                {HOUR_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <ChevronDown size={16} strokeWidth={1.5} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9B8CC4] pointer-events-none" />
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
          className="w-full py-3 text-[14px] font-medium text-white rounded-xl transition-colors"
          style={{ background: 'linear-gradient(135deg, #8B75D0, #B87AAB)' }}
        >
          저장
        </button>
      </div>
    </BottomSheet>
  )
}
