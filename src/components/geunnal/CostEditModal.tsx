'use client'
import { useState, useEffect } from 'react'
import { DollarSign } from 'lucide-react'
import BottomSheet from './BottomSheet'
import { GeunnalEvent } from '@/types/geunnal'

interface CostEditModalProps {
  open: boolean
  onClose: () => void
  event: GeunnalEvent | null
  guestCount: number
  token: string
  onSave: () => void
}

export default function CostEditModal({
  open,
  onClose,
  event,
  guestCount,
  token,
  onSave,
}: CostEditModalProps) {
  const [totalCost, setTotalCost] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (event) {
      setTotalCost(event.total_cost ? String(event.total_cost) : '')
    }
  }, [event])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!event) return

    const costValue = totalCost.trim() === '' ? null : parseInt(totalCost.replace(/,/g, ''))

    if (costValue !== null && (isNaN(costValue) || costValue < 0)) {
      alert('올바른 금액을 입력해주세요.')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/geunnal/events/${event.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          total_cost: costValue,
        }),
      })

      if (!response.ok) {
        throw new Error('비용 저장에 실패했습니다.')
      }

      onSave()
      onClose()
    } catch (error) {
      console.error('Cost save error:', error)
      alert(error instanceof Error ? error.message : '비용 저장 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: string) => {
    const number = parseInt(value.replace(/,/g, ''))
    if (isNaN(number)) return ''
    return number.toLocaleString('ko-KR')
  }

  const handleCostChange = (value: string) => {
    const cleaned = value.replace(/[^\d]/g, '')
    setTotalCost(cleaned)
  }

  const perPersonCost = totalCost.trim() === '' || guestCount === 0
    ? 0
    : Math.round(parseInt(totalCost.replace(/,/g, '')) / guestCount)

  return (
    <BottomSheet open={open} onClose={onClose} title="비용 입력">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Event Info */}
        {event && (
          <div className="p-4 bg-[#F9F7FD] rounded-xl border border-[#E8E4F0]">
            <h4 className="font-semibold text-[#2A2240] mb-1">{event.name}</h4>
            <p className="text-sm text-[#5A5270]">
              예상 인원: {guestCount}명
            </p>
          </div>
        )}

        {/* Total Cost Input */}
        <div>
          <label className="block text-sm font-medium text-[#2A2240] mb-2">
            총 비용
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9B8CC4]" />
            <input
              type="text"
              value={formatCurrency(totalCost)}
              onChange={(e) => handleCostChange(e.target.value)}
              placeholder="0"
              className="w-full pl-10 pr-12 py-3 bg-[#F9F7FD] border border-[#E8E4F0] rounded-xl text-[#2A2240] placeholder:text-[#C5BAE8] focus:outline-none focus:border-[#8B75D0] focus:ring-2 focus:ring-[#8B75D0]/20 text-right"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#5A5270] text-sm">
              원
            </span>
          </div>
        </div>

        {/* Per Person Calculation */}
        {totalCost.trim() !== '' && guestCount > 0 && (
          <div className="p-4 bg-[#EDE9FA] rounded-xl border border-[#8B75D0]/20">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#5A5270]">1인당 비용</span>
              <span className="text-lg font-semibold text-[#8B75D0]">
                {perPersonCost.toLocaleString('ko-KR')}원
              </span>
            </div>
          </div>
        )}

        {/* Note */}
        <p className="text-xs text-[#9B8CC4]">
          💡 비용을 비워두면 미입력 상태로 저장됩니다.
        </p>

        {/* Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-[#F9F7FD] text-[#5A5270] rounded-xl font-medium hover:bg-[#EDE9FA] transition-colors"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-3 bg-[#8B75D0] text-white rounded-xl font-medium hover:bg-[#7A64BF] transition-colors disabled:opacity-50"
          >
            {loading ? '저장 중...' : '저장'}
          </button>
        </div>
      </form>
    </BottomSheet>
  )
}
