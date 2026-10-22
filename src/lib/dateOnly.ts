// 날짜만 있는 문자열("2027-01-09")을 시간대와 무관한 '달력 날짜'로 읽는다.
// new Date('2027-01-09') 는 UTC 자정으로 해석돼, 한국보다 시간이 늦은 지역(미국 등)에서는 전날로 보인다.
// 이 함수는 보는 사람의 시간대와 상관없이 항상 2027년 1월 9일(로컬 자정)을 돌려준다.
// 시간이 포함된 값(ISO 날짜시간 등)은 기존처럼 new Date 로 읽는다.

const DATE_ONLY = /^(\d{4})-(\d{1,2})-(\d{1,2})$/

export function parseDateOnly(value: string | number | Date | null | undefined): Date {
  if (value instanceof Date) return new Date(value.getTime())
  if (typeof value === 'string') {
    const m = value.trim().match(DATE_ONLY)
    if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  }
  return new Date(value as string | number)
}
