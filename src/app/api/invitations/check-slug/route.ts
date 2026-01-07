export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')

    if (!slug) {
      return NextResponse.json(
        { error: 'slug 파라미터가 필요합니다.' },
        { status: 400 }
      )
    }

    // Check if slug is already used
    const { data, error } = await supabase
      .from('invitations')
      .select('id')
      .eq('slug', slug)
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "not found" which means slug is available
      console.error('Slug check error:', error)
      return NextResponse.json(
        { error: '확인 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      available: !data,
      slug,
    })
  } catch (error) {
    console.error('Slug check error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
