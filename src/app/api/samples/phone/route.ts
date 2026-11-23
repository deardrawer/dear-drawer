import { NextResponse } from 'next/server'
import { phoneSampleContent } from '@/lib/sample-data'

/**
 * THE PHONE 샘플 내용 (공개 · 읽기 전용) — 새 청첩장 에디터가 처음 보여 줄 모습.
 * /i/sample-phone 과 같은 코드 속 샘플 (사진은 public/samples/phone).
 */
export async function GET() {
  return NextResponse.json({ content: JSON.stringify(phoneSampleContent) })
}
