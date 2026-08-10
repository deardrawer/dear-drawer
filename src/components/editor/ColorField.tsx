'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

/** hex → HSL */
function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const h = (hex || '').replace('#', '')
  let r = 0, g = 0, b = 0
  if (h.length === 3) { r = parseInt(h[0] + h[0], 16); g = parseInt(h[1] + h[1], 16); b = parseInt(h[2] + h[2], 16) }
  else if (h.length >= 6) { r = parseInt(h.slice(0, 2), 16); g = parseInt(h.slice(2, 4), 16); b = parseInt(h.slice(4, 6), 16) }
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let hh = 0, s = 0
  const l = (max + min) / 2
  const d = max - min
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    if (max === r) hh = (g - b) / d + (g < b ? 6 : 0)
    else if (max === g) hh = (b - r) / d + 2
    else hh = (r - g) / d + 4
    hh *= 60
  }
  return { h: Math.round(hh), s: Math.round(s * 100), l: Math.round(l * 100) }
}

/** HSL → hex */
function hslToHex(h: number, s: number, l: number): string {
  s /= 100; l /= 100
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  let r = 0, g = 0, b = 0
  if (h < 60) { r = c; g = x } else if (h < 120) { r = x; g = c } else if (h < 180) { g = c; b = x }
  else if (h < 240) { g = x; b = c } else if (h < 300) { r = x; b = c } else { r = c; b = x }
  const to = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, '0')
  return '#' + to(r) + to(g) + to(b)
}

const DEFAULT_PRESETS = [
  '#FFFFFF', '#F5F0EB', '#E3E0D9', '#D5CBC5', '#C9B8A8', '#B8956A',
  '#726565', '#7A6A5A', '#8A9A7B', '#6B7A8A', '#3A4A5A', '#7A2E39',
]

interface ColorFieldProps {
  value: string
  onChange: (hex: string) => void
  label?: string
  presets?: string[]
  className?: string
}

/**
 * 모바일 친화 컬러 피커 — 스와치 버튼 탭 → 하단 시트(프리셋 + 색상/채도/명도 슬라이더 + HEX)
 * 네이티브 <input type="color"> 대체용.
 */
export default function ColorField({ value, onChange, label, presets = DEFAULT_PRESETS, className }: ColorFieldProps) {
  const [open, setOpen] = useState(false)
  const v = value || '#FFFFFF'
  const { h, s, l } = hexToHsl(v)
  const [hexText, setHexText] = useState(v)
  useEffect(() => { setHexText(v) }, [v])

  const setHSL = (nh: number, ns: number, nl: number) => onChange(hslToHex(nh, ns, nl))

  const hueBg = 'linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)'
  const satBg = `linear-gradient(to right, hsl(${h},0%,${l}%), hsl(${h},100%,${l}%))`
  const lightBg = `linear-gradient(to right, #000, hsl(${h},${s}%,50%), #fff)`

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 hover:border-gray-400 transition-colors ${className || ''}`}
      >
        <span className="w-6 h-6 rounded-md border border-gray-300 flex-shrink-0" style={{ background: v }} />
        <span className="text-xs text-gray-600 font-mono">{v.toUpperCase()}</span>
      </button>

      {open && createPortal(
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative w-full sm:max-w-sm bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl p-5 pb-7 space-y-4 safe-area-bottom"
            onClick={(e) => e.stopPropagation()}
          >
            <style>{`
              .cf-slider { -webkit-appearance: none; appearance: none; }
              .cf-slider::-webkit-slider-runnable-track { height: 12px; border-radius: 9999px; background: var(--cf-bg); }
              .cf-slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 20px; height: 20px; border-radius: 9999px; background: #fff; border: 2px solid rgba(0,0,0,0.25); box-shadow: 0 1px 4px rgba(0,0,0,0.35); margin-top: -4px; }
              .cf-slider::-moz-range-track { height: 12px; border-radius: 9999px; background: var(--cf-bg); }
              .cf-slider::-moz-range-thumb { width: 20px; height: 20px; border-radius: 9999px; background: #fff; border: 2px solid rgba(0,0,0,0.25); box-shadow: 0 1px 4px rgba(0,0,0,0.35); }
            `}</style>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-800">{label || '색상 선택'}</span>
              <button type="button" onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-700 text-xl leading-none px-1">×</button>
            </div>

            {/* 미리보기 + HEX */}
            <div className="flex items-center gap-3">
              <span className="w-12 h-12 rounded-lg border border-gray-200 flex-shrink-0" style={{ background: v }} />
              <div className="flex-1">
                <label className="text-[10px] text-gray-400 uppercase tracking-wider">HEX</label>
                <input
                  type="text"
                  value={hexText.toUpperCase()}
                  onChange={(e) => {
                    let val = e.target.value.trim()
                    if (val && !val.startsWith('#')) val = '#' + val
                    setHexText(val)
                    // 유효한 6자리 hex일 때만 실제 값 반영 (미완성/오입력 저장 방지)
                    if (/^#[0-9A-Fa-f]{6}$/.test(val)) onChange(val)
                  }}
                  onBlur={() => setHexText(v)}
                  className="mt-0.5 w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm font-mono focus:outline-none focus:border-gray-600"
                  placeholder="#FFFFFF"
                  maxLength={7}
                />
              </div>
            </div>

            {/* 프리셋 */}
            <div>
              <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1.5">프리셋</div>
              <div className="grid grid-cols-6 gap-2">
                {presets.map((p) => {
                  const active = p.toLowerCase() === v.toLowerCase()
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => onChange(p)}
                      className={`aspect-square rounded-lg border-2 transition-all ${active ? 'border-gray-900 scale-105' : 'border-gray-200'}`}
                      style={{ background: p }}
                    />
                  )
                })}
              </div>
            </div>

            {/* 슬라이더: 색상 / 채도 / 명도 */}
            <div className="space-y-3 pt-1">
              <Slider label="색상" min={0} max={360} value={h} bg={hueBg} onChange={(nv) => setHSL(nv, s, l)} />
              <Slider label="채도" min={0} max={100} value={s} bg={satBg} onChange={(nv) => setHSL(h, nv, l)} />
              <Slider label="명도" min={0} max={100} value={l} bg={lightBg} onChange={(nv) => setHSL(h, s, nv)} />
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="w-full py-3 rounded-xl bg-gray-900 text-white text-sm font-semibold"
            >
              완료
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

function Slider({ label, min, max, value, bg, onChange }: { label: string; min: number; max: number; value: number; bg: string; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] text-gray-500">{label}</span>
        <span className="text-[11px] text-gray-400 font-mono tabular-nums">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="cf-slider w-full h-5 appearance-none bg-transparent cursor-pointer"
        style={{ ['--cf-bg' as string]: bg }}
      />
    </div>
  )
}
