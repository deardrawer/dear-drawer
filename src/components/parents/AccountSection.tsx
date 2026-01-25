'use client'

import { useState } from 'react'
import { useSectionHighlight } from './SectionHighlightContext'
import { useTheme } from './ThemeContext'

interface Account {
  name: string
  bank: string
  account: string
}

interface AccountSectionProps {
  accounts?: Account[]
}

export default function AccountSection({
  accounts = [
    { name: '아버지 이○○', bank: '국민은행', account: '123-45-6789012' },
    { name: '어머니 김○○', bank: '신한은행', account: '110-456-789012' },
    { name: '신부 이서연', bank: '토스뱅크', account: '1000-1234-5678' },
  ],
}: AccountSectionProps) {
  const { ref, isActive, hasAppeared } = useSectionHighlight('account')
  const theme = useTheme()
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <section
      ref={ref as React.RefObject<HTMLDivElement>}
      className="px-8 py-20 transition-all duration-500 min-h-screen flex flex-col items-center justify-center"
      style={{
        backgroundColor: theme.background,
        opacity: hasAppeared ? (isActive ? 1 : 0.3) : 0,
        transform: hasAppeared ? 'translateY(0)' : 'translateY(20px)',
        filter: isActive ? 'none' : 'grayscale(30%)',
      }}
    >
      <h2
        className="font-serif text-lg text-center mb-12 tracking-wider transition-colors duration-500"
        style={{ color: isActive ? theme.text : '#999' }}
      >
        마음 전하실 곳
      </h2>

      <div className="space-y-3 w-full max-w-[320px]">
        {accounts.map((item, index) => (
          <button
            key={item.name}
            onClick={() => handleCopy(item.account)}
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
              <span className="text-xs transition-colors duration-500" style={{ color: isActive ? theme.accent : `${theme.accent}80` }}>
                복사
              </span>
            </div>
          </button>
        ))}
      </div>
    </section>
  )
}
