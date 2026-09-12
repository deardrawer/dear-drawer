/**
 * 청첩장 공개 lifecycle — 예식일(KST) 기준 +30일 공개, 31일째 00:00 KST부터 종료.
 * 별도 종료일을 저장하지 않고 wedding_date로 동적 계산(예식일 변경 시 자동 반영).
 *
 * 규칙: 예식일 = Day 0. Day 0 ~ Day 30 (예식+30일)까지 공개. Day 31부터 종료.
 *   예) wedding_date=2026-08-01 → 2026-08-31까지 공개, 2026-09-01 00:00 KST부터 종료.
 */

const GRACE_DAYS = 30

/** 'YYYY-MM-DD'(또는 시간 포함) → 해당 날짜의 "일(day) 번호"(UTC 자정 기준 epoch일). 잘못된 값이면 null. */
function toDayNumber(dateStr: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateStr)
  if (!m) return null
  const y = Number(m[1])
  const mo = Number(m[2])
  const d = Number(m[3])
  if (!y || !mo || !d) return null
  return Math.floor(Date.UTC(y, mo - 1, d) / 86400000)
}

/** 현재 KST 날짜의 "일 번호". (UTC+9 적용 후 날짜만) */
function todayKstDayNumber(): number {
  const kst = new Date(Date.now() + 9 * 3600 * 1000)
  return Math.floor(
    Date.UTC(kst.getUTCFullYear(), kst.getUTCMonth(), kst.getUTCDate()) / 86400000,
  )
}

/**
 * 공개 청첩장이 "종료(archived)" 상태인지. (예식 + GRACE_DAYS 초과)
 * - wedding_date 없음/파싱불가 → 종료하지 않음(false). 기존 동작 보호(임의로 잠그지 않음).
 * - todayKST - weddingDay > 30 이면 종료.
 */
export function isWeddingArchivedKST(weddingDate: string | null | undefined, graceDays = GRACE_DAYS): boolean {
  if (!weddingDate) return false
  const weddingDay = toDayNumber(weddingDate)
  if (weddingDay === null) return false
  const diff = todayKstDayNumber() - weddingDay
  return diff > graceDays
}

/**
 * POST DRAWER(개인 서랍 · 결혼 후 비밀번호 공유)가 활성 상태인지.
 * 규칙: 예식 다음날(Day 1)부터 활성. 예식 전/당일(diff<=0) 및 wedding_date 없음 → 비활성(준비중).
 *   diff = todayKST - weddingDay. diff >= 1 이면 활성.
 */
export function isPostDrawerActiveKST(weddingDate: string | null | undefined): boolean {
  if (!weddingDate) return false
  const weddingDay = toDayNumber(weddingDate)
  if (weddingDay === null) return false
  return todayKstDayNumber() - weddingDay >= 1
}

/** 예식일로부터 지난 일수(KST). 예식 당일=0, 다음날=1. 계산 불가면 null. */
export function daysSinceWeddingKST(weddingDate: string | null | undefined): number | null {
  if (!weddingDate) return null
  const weddingDay = toDayNumber(weddingDate)
  if (weddingDay === null) return null
  return todayKstDayNumber() - weddingDay
}

// ── 타임머신 우표(마일스톤) ─────────────────────────────────────────
export interface Milestone {
  key: string
  label: string
  kind: 'days' | 'years'
  n: number
}
/** 결혼식(Day 0) 이후 마일스톤 정의: 100일 + 1년 단위로 years개까지. 각자 그 날짜가 되면 '열림'. */
export function milestoneDefs(years: number): Milestone[] {
  const defs: Milestone[] = [{ key: 'd100', label: '100일', kind: 'days', n: 100 }]
  for (let y = 1; y <= years; y++) defs.push({ key: `y${y}`, label: `${y}년`, kind: 'years', n: y })
  return defs
}

/** 마일스톤 목표일의 day number. days=예식+n일, years=예식일 +n년(달력). */
function milestoneDayNumber(weddingDate: string, m: Milestone): number | null {
  const md = /^(\d{4})-(\d{2})-(\d{2})/.exec(weddingDate)
  if (!md) return null
  const y = Number(md[1]), mo = Number(md[2]), d = Number(md[3])
  if (!y || !mo || !d) return null
  if (m.kind === 'days') return Math.floor(Date.UTC(y, mo - 1, d) / 86400000) + m.n
  return Math.floor(Date.UTC(y + m.n, mo - 1, d) / 86400000)
}

export interface MilestoneStatus {
  key: string
  label: string
  dateIso: string | null
  dday: number // 남은 일수(양수=미래, 0/음수=열림)
  unlocked: boolean
}
/** 각 마일스톤의 D-day/열림 상태(KST). dday<=0 이면 열림. years = 표시할 연 단위 개수(기본 3). */
export function milestoneStatuses(weddingDate: string | null | undefined, years = 3): MilestoneStatus[] {
  const today = todayKstDayNumber()
  return milestoneDefs(years).map((m) => {
    const dn = weddingDate ? milestoneDayNumber(weddingDate, m) : null
    const dday = dn === null ? 99999 : dn - today
    const dateIso = dn === null ? null : new Date(dn * 86400000).toISOString().slice(0, 10)
    return { key: m.key, label: m.label, dateIso, dday, unlocked: dn !== null && dday <= 0 }
  })
}
