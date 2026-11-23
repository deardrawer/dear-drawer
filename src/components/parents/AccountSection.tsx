'use client'

import { useState } from 'react'
import { useSectionHighlight } from './SectionHighlightContext'
import { C_FIELD, C_TXT, C_HAIR, C_SANS, C_TXT_SUB, cBody, cCaption, cDim, cMiniPill, cPill, cStagger, C_WHITE_ISLAND } from './cStyle'

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
    { label: '신부', name: '윤서연', bank: '토스뱅크', account: '1000-1234-5678' },
  ],
}: AccountSectionProps) {
  const { ref, isActive, hasAppeared } = useSectionHighlight('account')
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
      style={{ backgroundColor: 'transparent', padding: '72px 28px 80px', ...cDim(isActive) }}
    >
      <p style={{ ...cCaption, ...cStagger(hasAppeared, 0) }}>마음 전하실 곳</p>
      <p style={{ ...cBody(12), fontFamily: C_SANS, ...cStagger(hasAppeared, 0.15) }}>참석이 어려우신 분들을 위해 계좌번호를 함께 적어 두었습니다.</p>

      <div style={{ marginTop: 22 }}>
        {accounts.map((item, index) => (
          <div
            key={`${item.name}-${index}`}
            onClick={() => handleCopy(item, index)}
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 0', borderTop: `1px solid ${C_HAIR}`, cursor: 'pointer', ...cStagger(hasAppeared, 0.3 + index * 0.12) }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, color: C_TXT_SUB }}>
                {[item.label, item.name].filter(Boolean).join(' ')}
              </div>
              <div style={{ fontSize: 15.5, marginTop: 3, color: C_TXT, wordBreak: 'break-all' }}>
                {item.bank} {item.account}
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleCopy(item, index) }}
              style={cMiniPill(copiedIndex === index)}
            >
              {copiedIndex === index ? '복사됨' : '복사'}
            </button>
          </div>
        ))}
        <div style={{ borderTop: `1px solid ${C_HAIR}` }} />
      </div>

      {/* 복사가 안 될 때 — 직접 길게 눌러 복사 */}
      {showAccountModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{ backgroundColor: 'rgba(31,29,26,0.45)' }}
          onClick={() => setShowAccountModal(null)}
        >
          <div
            style={{ ...C_WHITE_ISLAND, backgroundColor: '#FFFFFF', borderRadius: 8, padding: '28px 24px 22px', maxWidth: 320, width: '100%', margin: '0 16px', fontFamily: C_SANS }}
            onClick={(e) => e.stopPropagation()}
          >
            <p style={{ margin: 0, textAlign: 'center', fontSize: 15, fontWeight: 600, color: C_TXT }}>
              {showAccountModal.name}
            </p>
            <p style={{ margin: '4px 0 0', textAlign: 'center', fontSize: 13, color: C_TXT_SUB }}>
              {showAccountModal.bank}
            </p>
            <div style={{ backgroundColor: C_FIELD, borderRadius: 6, padding: '12px 10px', marginTop: 16 }}>
              <p
                style={{ margin: 0, textAlign: 'center', fontSize: 17, letterSpacing: '0.04em', color: C_TXT, userSelect: 'all', WebkitUserSelect: 'all' }}
              >
                {showAccountModal.account}
              </p>
            </div>
            <p style={{ margin: '14px 0 0', textAlign: 'center', fontSize: 13, color: C_TXT_SUB }}>
              계좌번호를 길게 눌러 복사해 주세요
            </p>
            <div style={{ display: 'flex', marginTop: 18 }}>
              <button type="button" onClick={() => setShowAccountModal(null)} style={cPill(true, 46)}>
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
