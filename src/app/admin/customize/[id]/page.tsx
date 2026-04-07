'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import type { StyleOverrides } from '@/lib/styleOverrides'
import { getTemplateSections, getHideableAreas, getFontSizeDefs } from '@/lib/styleOverrides'

const InvitationClientRecord = dynamic(() => import('@/app/i/[slug]/InvitationClientRecord'), { ssr: false })
const InvitationClient = dynamic(() => import('@/app/i/[slug]/InvitationClient'), { ssr: false })
const InvitationClientFamily = dynamic(() => import('@/app/i/[slug]/InvitationClientFamily'), { ssr: false })
const InvitationClientFilm = dynamic(() => import('@/app/i/[slug]/InvitationClientFilm'), { ssr: false })
const InvitationClientMagazine = dynamic(() => import('@/app/i/[slug]/InvitationClientMagazine'), { ssr: false })

interface InvitationRow {
  id: string
  user_id: string
  template_id: string
  slug: string | null
  groom_name: string | null
  bride_name: string | null
  wedding_date: string | null
  wedding_time: string | null
  is_paid: number
  is_published: number
  content: string
  created_at: string
}

export default function AdminCustomizePage() {
  const params = useParams()
  const router = useRouter()
  const invitationId = params.id as string

  const [password, setPassword] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [saveMessage, setSaveMessage] = useState('')

  // Invitation data
  const [invitation, setInvitation] = useState<InvitationRow | null>(null)
  const [parsedContent, setParsedContent] = useState<Record<string, unknown> | null>(null)

  // Derive styleOverrides from parsedContent (single source of truth)
  const styleOverrides: StyleOverrides = (parsedContent?.styleOverrides as StyleOverrides) || {}

  const fetchInvitation = useCallback(async (pw: string) => {
    setIsLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/invitations/${invitationId}`, {
        headers: { 'x-admin-password': pw },
      })
      if (res.status === 401) {
        setIsAuthenticated(false)
        setError('인증 실패')
        setIsLoading(false)
        return
      }
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json() as { invitation: InvitationRow }
      const inv = data.invitation
      setInvitation(inv)
      setIsAuthenticated(true)

      // Parse content
      try {
        const content = JSON.parse(inv.content)
        setParsedContent(content)
      } catch {
        setError('콘텐츠 파싱 실패')
      }
    } catch {
      setError('데이터를 불러오는데 실패했습니다')
    } finally {
      setIsLoading(false)
    }
  }, [invitationId])

  // Check saved auth
  useEffect(() => {
    const savedPassword = localStorage.getItem('admin_password')
    if (savedPassword) {
      setPassword(savedPassword)
      fetchInvitation(savedPassword)
    } else {
      setIsLoading(false)
    }
  }, [invitationId, fetchInvitation])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password) return
    localStorage.setItem('admin_password', password)
    fetchInvitation(password)
  }

  // Helper: update styleOverrides within parsedContent (single source of truth)
  const updateOverrides = useCallback((fn: (prev: StyleOverrides) => StyleOverrides) => {
    setParsedContent(pc => {
      if (!pc) return pc
      const currentSo = (pc.styleOverrides as StyleOverrides) || {}
      const newSo = fn(currentSo)
      return { ...pc, styleOverrides: newSo }
    })
  }, [])

  // Section spacing handlers
  const setSectionPadding = useCallback((sectionId: string, field: 'paddingTop' | 'paddingBottom', value: number) => {
    updateOverrides(prev => {
      const newSpacing = { ...prev.sectionSpacing }
      newSpacing[sectionId] = { ...newSpacing[sectionId], [field]: value }
      return { ...prev, sectionSpacing: newSpacing }
    })
  }, [updateOverrides])

  const resetSectionPadding = useCallback((sectionId: string) => {
    updateOverrides(prev => {
      const newSpacing = { ...prev.sectionSpacing }
      delete newSpacing[sectionId]
      return { ...prev, sectionSpacing: newSpacing }
    })
  }, [updateOverrides])

  // Hidden areas handlers
  const toggleHiddenArea = useCallback((areaId: string) => {
    updateOverrides(prev => {
      const hidden = prev.hiddenAreas || []
      const newHidden = hidden.includes(areaId)
        ? hidden.filter(h => h !== areaId)
        : [...hidden, areaId]
      return { ...prev, hiddenAreas: newHidden }
    })
  }, [updateOverrides])

  // Font size handlers
  const setFontSizeOverride = useCallback((key: string, value: number) => {
    updateOverrides(prev => ({
      ...prev,
      fontSizes: { ...prev.fontSizes, [key]: value }
    }))
  }, [updateOverrides])

  const resetFontSize = useCallback((key: string) => {
    updateOverrides(prev => {
      const newFonts = { ...prev.fontSizes }
      delete newFonts[key]
      return { ...prev, fontSizes: newFonts }
    })
  }, [updateOverrides])

  // Reset all overrides
  const resetAll = useCallback(() => {
    if (!confirm('모든 커스텀 설정을 초기화하시겠습니까?')) return
    setParsedContent(pc => pc ? { ...pc, styleOverrides: {} } : pc)
  }, [])

  // Save - parsedContent already contains styleOverrides
  const handleSave = useCallback(async () => {
    if (!invitation || !parsedContent) return
    setIsSaving(true)
    setSaveMessage('')
    try {
      const res = await fetch(`/api/invitations/${invitationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password,
        },
        body: JSON.stringify({ content: JSON.stringify(parsedContent) }),
      })
      if (!res.ok) throw new Error('Save failed')
      setSaveMessage('저장 완료!')
      setTimeout(() => setSaveMessage(''), 3000)
    } catch {
      setSaveMessage('저장 실패')
    } finally {
      setIsSaving(false)
    }
  }, [invitation, parsedContent, invitationId, password])

  // Template info
  const templateId = (parsedContent?.templateId as string) || invitation?.template_id || ''
  const sections = useMemo(() => getTemplateSections(templateId), [templateId])
  const hideableAreas = useMemo(() => getHideableAreas(templateId), [templateId])
  const fontSizeDefs = useMemo(() => getFontSizeDefs(templateId), [templateId])

  // Preview content - direct state (no defer for immediate feedback)

  // Login screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F3EE' }}>
        {isLoading ? (
          <p style={{ color: '#888' }}>로딩중...</p>
        ) : (
          <form onSubmit={handleLogin} className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-sm">
            <h1 className="text-xl font-bold mb-6 text-center" style={{ color: '#2C2C2C' }}>
              관리자 로그인
            </h1>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="관리자 비밀번호"
              className="w-full px-4 py-3 rounded-xl border mb-4"
              style={{ borderColor: '#E8E4DD' }}
              autoFocus
            />
            {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
            <button
              type="submit"
              disabled={!password}
              className="w-full py-3 rounded-xl font-semibold text-white disabled:opacity-50"
              style={{ backgroundColor: '#C9A962' }}
            >
              로그인
            </button>
          </form>
        )}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F3EE' }}>
        <p style={{ color: '#888' }}>청첩장 로딩중...</p>
      </div>
    )
  }

  if (!invitation || !parsedContent) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F3EE' }}>
        <p className="text-red-500">{error || '청첩장을 찾을 수 없습니다'}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F3EE' }}>
      {/* Header */}
      <header className="sticky top-0 z-40 px-6 py-3 flex items-center justify-between" style={{ backgroundColor: '#FFF', borderBottom: '1px solid #E8E4DD' }}>
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/admin')} className="text-sm px-3 py-1 rounded-lg" style={{ backgroundColor: '#F5F3EE', color: '#666' }}>
            &larr; 목록
          </button>
          <div>
            <div className="text-xs tracking-[2px]" style={{ color: '#C9A962' }}>CUSTOMIZE</div>
            <h1 className="text-sm font-semibold" style={{ color: '#2C2C2C' }}>
              {invitation.groom_name} & {invitation.bride_name}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {saveMessage && (
            <span className="text-sm" style={{ color: saveMessage === '저장 완료!' ? '#16a34a' : '#dc2626' }}>
              {saveMessage}
            </span>
          )}
          <button onClick={resetAll} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ backgroundColor: '#F5F3EE', color: '#666' }}>
            초기화
          </button>
          <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50" style={{ backgroundColor: '#C9A962' }}>
            {isSaving ? '저장중...' : '저장'}
          </button>
        </div>
      </header>

      {/* Main Content - Left/Right Split */}
      <div className="flex" style={{ height: 'calc(100vh - 57px)' }}>
        {/* Left Panel - Controls */}
        <div className="w-[420px] overflow-y-auto p-6 space-y-6 shrink-0" style={{ borderRight: '1px solid #E8E4DD' }}>
          {/* Basic Info (read-only) */}
          <CollapsibleSection title="기본 정보" defaultOpen>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <InfoField label="ID" value={invitation.id.slice(0, 8)} />
              <InfoField label="템플릿" value={templateId} />
              <InfoField label="슬러그" value={invitation.slug || '-'} />
              <InfoField label="결제" value={invitation.is_paid ? '완료' : '미결제'} />
              <InfoField label="발행" value={invitation.is_published ? '완료' : '미발행'} />
              <InfoField label="생성일" value={new Date(invitation.created_at).toLocaleDateString('ko-KR')} />
            </div>
          </CollapsibleSection>

          {/* Section Spacing */}
          <CollapsibleSection title="섹션 간격">
            <div className="space-y-4">
              {sections.map(sec => {
                const override = styleOverrides.sectionSpacing?.[sec.id]
                const hasOverride = !!override
                return (
                  <div key={sec.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium" style={{ color: '#2C2C2C' }}>{sec.label}</span>
                      {hasOverride && (
                        <button onClick={() => resetSectionPadding(sec.id)} className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: '#FEE2E2', color: '#DC2626' }}>
                          리셋
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <SliderField
                        label="상단"
                        value={override?.paddingTop ?? sec.defaultTop}
                        min={0} max={200}
                        onChange={v => setSectionPadding(sec.id, 'paddingTop', v)}
                        isOverridden={override?.paddingTop !== undefined}
                      />
                      <SliderField
                        label="하단"
                        value={override?.paddingBottom ?? sec.defaultBottom}
                        min={0} max={200}
                        onChange={v => setSectionPadding(sec.id, 'paddingBottom', v)}
                        isOverridden={override?.paddingBottom !== undefined}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </CollapsibleSection>

          {/* Hidden Areas */}
          <CollapsibleSection title="영역 숨기기">
            <div className="space-y-2">
              {hideableAreas.map(area => {
                const isChecked = styleOverrides.hiddenAreas?.includes(area.id) || false
                return (
                  <label key={area.id} className="flex items-center gap-3 py-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleHiddenArea(area.id)}
                      className="w-4 h-4 rounded"
                      style={{ accentColor: '#C9A962' }}
                    />
                    <span className="text-sm" style={{ color: isChecked ? '#DC2626' : '#2C2C2C' }}>
                      {area.label}
                      {isChecked && ' (숨김)'}
                    </span>
                  </label>
                )
              })}
            </div>
          </CollapsibleSection>

          {/* Font Sizes */}
          <CollapsibleSection title="폰트 크기">
            <div className="space-y-4">
              {fontSizeDefs.map(fd => {
                const override = styleOverrides.fontSizes?.[fd.key]
                const hasOverride = override !== undefined
                return (
                  <div key={fd.key} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium" style={{ color: '#2C2C2C' }}>{fd.label}</span>
                      {hasOverride && (
                        <button onClick={() => resetFontSize(fd.key)} className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: '#FEE2E2', color: '#DC2626' }}>
                          리셋
                        </button>
                      )}
                    </div>
                    <SliderField
                      label={`${override ?? fd.defaultPx}px`}
                      value={override ?? fd.defaultPx}
                      min={fd.min} max={fd.max}
                      onChange={v => setFontSizeOverride(fd.key, v)}
                      isOverridden={hasOverride}
                    />
                  </div>
                )
              })}
            </div>
          </CollapsibleSection>

          {/* Raw JSON (debug) */}
          <CollapsibleSection title="현재 styleOverrides (JSON)">
            <pre className="text-xs p-3 rounded-lg overflow-auto max-h-[200px]" style={{ backgroundColor: '#F5F3EE', color: '#666' }}>
              {JSON.stringify(styleOverrides, null, 2)}
            </pre>
          </CollapsibleSection>
        </div>

        {/* Right Panel - Preview */}
        <div className="flex-1 overflow-hidden flex items-start justify-center p-6">
          <div className="w-[375px] shadow-2xl bg-white border border-gray-200" style={{ height: 'calc(100vh - 57px - 48px)', overflow: 'auto' }}>
            {parsedContent && (
              <PreviewRenderer invitation={invitation} content={parsedContent} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ===== Preview Renderer =====
function PreviewRenderer({ invitation, content }: { invitation: InvitationRow; content: Record<string, unknown> }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const c = content as Record<string, any>

  // Re-compute every render (no useMemo) to guarantee fresh data
  const invitationData = {
    id: invitation.id,
    user_id: invitation.user_id,
    template_id: invitation.template_id,
    slug: invitation.slug,
    groom_name: invitation.groom_name,
    bride_name: invitation.bride_name,
    wedding_date: invitation.wedding_date,
    wedding_time: invitation.wedding_time,
    venue_name: c.wedding?.venue?.name || '',
    venue_address: c.wedding?.venue?.address || '',
    greeting_message: c.content?.greeting || '',
    content: JSON.stringify(content),
    is_paid: invitation.is_paid,
    is_published: invitation.is_published,
  }

  const tid = (c.templateId as string) || invitation.template_id
  let ClientComponent
  switch (tid) {
    case 'narrative-record': ClientComponent = InvitationClientRecord; break
    case 'narrative-family': ClientComponent = InvitationClientFamily; break
    case 'narrative-film': ClientComponent = InvitationClientFilm; break
    case 'narrative-magazine': ClientComponent = InvitationClientMagazine; break
    default: ClientComponent = InvitationClient
  }

  // Debug: show override hash to confirm re-renders
  const so = c.styleOverrides
  const overrideCount = (so?.hiddenAreas?.length || 0) +
    Object.keys(so?.sectionSpacing || {}).length +
    Object.keys(so?.fontSizes || {}).length

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {overrideCount > 0 && (
        <div style={{
          position: 'absolute', top: 4, right: 4, zIndex: 9999,
          background: '#C9A962', color: '#fff', fontSize: 10, padding: '2px 6px',
          borderRadius: 4, pointerEvents: 'none',
        }}>
          overrides: {overrideCount}
        </div>
      )}
      <ClientComponent
        key={JSON.stringify(so || {})}
        invitation={invitationData as any} // eslint-disable-line @typescript-eslint/no-explicit-any
        content={content as any} // eslint-disable-line @typescript-eslint/no-explicit-any
        isPaid={true}
        isPreview={true}
        skipIntro={true}
      />
    </div>
  )
}

// ===== Collapsible Section =====
function CollapsibleSection({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #E8E4DD' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
        style={{ borderBottom: isOpen ? '1px solid #E8E4DD' : 'none' }}
      >
        <span className="text-sm font-semibold" style={{ color: '#2C2C2C' }}>{title}</span>
        <span className="text-xs" style={{ color: '#888' }}>{isOpen ? '접기' : '펼치기'}</span>
      </button>
      {isOpen && <div className="p-4">{children}</div>}
    </div>
  )
}

// ===== Info Field (read-only) =====
function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs mb-0.5" style={{ color: '#888' }}>{label}</div>
      <div className="text-sm font-mono" style={{ color: '#2C2C2C' }}>{value}</div>
    </div>
  )
}

// ===== Slider Field =====
function SliderField({ label, value, min, max, onChange, isOverridden }: {
  label: string; value: number; min: number; max: number; onChange: (v: number) => void; isOverridden?: boolean
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs" style={{ color: isOverridden ? '#C9A962' : '#888' }}>{label}</span>
        <span className="text-xs font-mono" style={{ color: isOverridden ? '#C9A962' : '#888' }}>{value}</span>
      </div>
      <input
        type="range"
        min={min} max={max} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, ${isOverridden ? '#C9A962' : '#888'} ${((value - min) / (max - min)) * 100}%, #E8E4DD ${((value - min) / (max - min)) * 100}%)`,
          accentColor: '#C9A962',
        }}
      />
    </div>
  )
}
