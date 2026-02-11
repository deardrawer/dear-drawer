'use client'

import { useState } from 'react'
import { useSectionHighlight } from './SectionHighlightContext'
import { useTheme } from './ThemeContext'

interface Account {
  label?: string
  name: string
  bank: string
  account: string
}

interface AccountSectionProps {
  accounts?: Account[]
}

export default function AccountSection({
  accounts = [
    { label: '아버지', name: '이○○', bank: '국민은행', account: '123-45-6789012' },
    { label: '어머니', name: '김○○', bank: '신한은행', account: '110-456-789012' },
    { label: '신부', name: '이서연', bank: '토스뱅크', account: '1000-1234-5678' },
  ],
}: AccountSectionProps) {
  const { ref, isActive, hasAppeared } = useSectionHighlight('account')
  const theme = useTheme()
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [showAccountModal, setShowAccountModal] = useState<{ name: string; bank: string; account: string } | null>(null)

  const handleCopy = async (item: Account, index: number) => {
    const accountNumber = item.account.replace(/[^0-9]/g, '')
    let copied = false

    // 1차: navigator.clipboard (HTTPS 필요)
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      try {
        await navigator.clipboard.writeText(accountNumber)
        copied = true
      } catch {
        // clipboard API 실패 → fallback으로
      }
    }

    // 2차: execCommand fallback (iOS 대응 포함)
    if (!copied) {
      try {
        const textArea = document.createElement('textarea')
        textArea.value = accountNumber
        textArea.setAttribute('readonly', '')
        textArea.style.position = 'fixed'
        textArea.style.left = '-9999px'
        textArea.style.top = '-9999px'
        textArea.style.opacity = '0'
        document.body.appendChild(textArea)

        // iOS Safari 대응
        const range = document.createRange()
        const selection = window.getSelection()
        textArea.contentEditable = 'true'
        textArea.readOnly = false
        range.selectNodeContents(textArea)
        selection?.removeAllRanges()
        selection?.addRange(range)
        textArea.setSelectionRange(0, accountNumber.length)

        copied = document.execCommand('copy')
        document.body.removeChild(textArea)
      } catch {
        copied = false
      }
    }

    if (copied) {
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 2000)
    } else {
      // 복사 실패 시 모달로 계좌번호 표시 (사용자가 직접 복사)
      setShowAccountModal({ name: item.name, bank: item.bank, account: accountNumber })
    }
  }

  return (
    <section
      ref={ref as React.RefObject<HTMLDivElement>}
      className="px-8 py-20 transition-all duration-500 flex flex-col items-center justify-center"
      style={{
        backgroundColor: theme.background,
        opacity: hasAppeared ? (isActive ? 1 : 0.3) : 0,
        transform: hasAppeared ? 'translateY(0)' : 'translateY(20px)',
        filter: isActive ? 'none' : 'grayscale(30%)',
      }}
    >
      <h2
        className="font-serif text-lg font-semibold text-center mb-12 tracking-wider transition-colors duration-500"
        style={{ color: isActive ? theme.text : '#999' }}
      >
        마음 전하실 곳
      </h2>

      <div className="space-y-3 w-full max-w-[320px]">
        {accounts.map((item, index) => (
          <button
            key={`${item.name}-${index}`}
            onClick={() => handleCopy(item, index)}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            className="w-full p-4 rounded-lg border text-left transition-all duration-500"
            style={{
              borderColor: hoveredIndex === index ? theme.accent : '#E8E4DC',
              boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.04)' : 'none',
            }}
          >
            <div className="flex justify-between items-center">
              <div>
                {item.label && (
                  <p
                    className="text-[10px] font-medium mb-0.5 tracking-wide transition-colors duration-500"
                    style={{ color: isActive ? theme.accent : '#bbb' }}
                  >
                    {item.label}
                  </p>
                )}
                <p
                  className="font-serif text-sm mb-1 transition-colors duration-500"
                  style={{ color: isActive ? theme.text : '#999' }}
                >
                  {item.name}
                </p>
                <p className="text-xs transition-colors duration-500" style={{ color: isActive ? '#999' : '#bbb' }}>
                  {item.bank} {item.account}
                </p>
              </div>
              <span
                className="text-xs transition-colors duration-500"
                style={{ color: copiedIndex === index ? '#22c55e' : (isActive ? theme.accent : `${theme.accent}80`) }}
              >
                {copiedIndex === index ? '복사됨' : '복사'}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* 복사 실패 시 계좌번호 직접 표시 모달 */}
      {showAccountModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50"
          onClick={() => setShowAccountModal(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-[320px] w-full mx-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm font-medium text-center mb-1" style={{ color: theme.text }}>
              {showAccountModal.name}
            </p>
            <p className="text-xs text-center mb-4" style={{ color: '#999' }}>
              {showAccountModal.bank}
            </p>
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <p
                className="text-center text-base font-mono tracking-wider select-all"
                style={{ color: theme.text, userSelect: 'all', WebkitUserSelect: 'all' }}
              >
                {showAccountModal.account}
              </p>
            </div>
            <p className="text-xs text-center mb-4" style={{ color: '#999' }}>
              계좌번호를 길게 눌러 복사해주세요
            </p>
            <button
              onClick={() => setShowAccountModal(null)}
              className="w-full py-2.5 rounded-lg text-sm font-medium"
              style={{ backgroundColor: theme.primary, color: 'white' }}
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
