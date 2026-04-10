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

const stagger = (hasAppeared: boolean, delay: number) => ({
  opacity: hasAppeared ? 1 : 0,
  transform: hasAppeared ? 'translateY(0)' : 'translateY(18px)',
  transition: 'opacity 0.8s ease, transform 0.8s ease',
  transitionDelay: hasAppeared ? `${delay}s` : '0s',
})

export default function AccountSection({
  accounts = [
    { label: '아버지', name: '이○○', bank: '국민은행', account: '123-45-6789012' },
    { label: '어머니', name: '김○○', bank: '신한은행', account: '110-456-789012' },
    { label: '신부', name: '이서연', bank: '토스뱅크', account: '1000-1234-5678' },
  ],
}: AccountSectionProps) {
  const { ref, isActive, hasAppeared } = useSectionHighlight('account')
  const theme = useTheme()
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [showAccountModal, setShowAccountModal] = useState<{ name: string; bank: string; account: string } | null>(null)

  const handleCopy = async (item: Account, index: number) => {
    const accountNumber = item.account.replace(/[^0-9]/g, '')
    let copied = false

    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      try {
        await navigator.clipboard.writeText(accountNumber)
        copied = true
      } catch {
        // clipboard API failed
      }
    }

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
      setShowAccountModal({ name: item.name, bank: item.bank, account: accountNumber })
    }
  }

  return (
    <section
      ref={ref as React.RefObject<HTMLDivElement>}
      className="px-6 py-16 flex flex-col items-center justify-center"
      style={{
        backgroundColor: theme.background,
        filter: isActive ? 'none' : 'grayscale(30%)',
        opacity: isActive ? 1 : 0.3,
        transition: 'filter 0.5s, opacity 0.5s',
      }}
    >
      {/* GIFT label */}
      <p
        className="text-[10px] tracking-[6px] mb-3"
        style={{
          color: isActive ? `${theme.accent}80` : '#bbb',
          fontWeight: 300,
          ...stagger(hasAppeared, 0),
        }}
      >
        GIFT
      </p>

      <h2
        className="font-serif text-[16px] text-center mb-8 tracking-[1px]"
        style={{
          color: isActive ? theme.text : '#999',
          fontWeight: 300,
          ...stagger(hasAppeared, 0.15),
        }}
      >
        마음 전하실 곳
      </h2>

      <div className="space-y-2 w-full max-w-[340px]">
        {accounts.map((item, index) => (
          <button
            key={`${item.name}-${index}`}
            onClick={() => handleCopy(item, index)}
            className="w-full px-5 py-4 rounded-xl text-left transition-all duration-300"
            style={{
              backgroundColor: '#FFFFFF',
              boxShadow: isActive ? '0 1px 8px rgba(0,0,0,0.03)' : 'none',
              ...stagger(hasAppeared, 0.3 + index * 0.12),
            }}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 2px 16px rgba(0,0,0,0.06)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = isActive ? '0 1px 8px rgba(0,0,0,0.03)' : 'none'; }}
          >
            <div className="flex justify-between items-center">
              <div>
                {item.label && (
                  <p
                    className="text-[10px] mb-1 tracking-[1px]"
                    style={{ color: isActive ? theme.primary : '#bbb' }}
                  >
                    {item.label}
                  </p>
                )}
                <p
                  className="font-serif text-sm mb-0.5"
                  style={{ color: isActive ? theme.text : '#999', fontWeight: 400 }}
                >
                  {item.name}
                </p>
                <p
                  className="text-[11px]"
                  style={{ color: isActive ? `${theme.accent}80` : '#bbb' }}
                >
                  {item.bank} {item.account}
                </p>
              </div>
              <span
                className="px-3.5 py-1.5 rounded-lg text-[11px] tracking-[0.5px] transition-all duration-300"
                style={{
                  backgroundColor: copiedIndex === index ? '#22c55e' : theme.background,
                  color: copiedIndex === index ? '#FFFFFF' : (isActive ? theme.textLight : '#aaa'),
                }}
              >
                {copiedIndex === index ? '복사됨' : '복사'}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Copy failure modal */}
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
