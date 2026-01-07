export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export type RSVPSubmission = {
  invitationId: string
  guestName: string
  guestPhone?: string
  attendance: 'attending' | 'not_attending' | 'pending'
  guestCount: number
  message?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: RSVPSubmission = await request.json()

    // Validate required fields
    if (!body.invitationId || !body.guestName || !body.attendance) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // Validate attendance value
    if (!['attending', 'not_attending', 'pending'].includes(body.attendance)) {
      return NextResponse.json(
        { error: '유효하지 않은 참석 여부입니다.' },
        { status: 400 }
      )
    }

    // Validate guest count
    const guestCount = body.attendance === 'attending' ? (body.guestCount || 1) : 0

    // Insert RSVP response
    const { data, error } = await supabase
      .from('rsvp_responses')
      .insert({
        invitation_id: body.invitationId,
        guest_name: body.guestName,
        guest_phone: body.guestPhone || null,
        attendance: body.attendance,
        guest_count: guestCount,
        message: body.message || null,
      })
      .select()
      .single()

    if (error) {
      console.error('RSVP 저장 오류:', error)
      return NextResponse.json(
        { error: '참석 여부 저장에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '참석 여부가 저장되었습니다.',
      data,
    })
  } catch (error) {
    console.error('RSVP API 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const invitationId = searchParams.get('invitationId')

    if (!invitationId) {
      return NextResponse.json(
        { error: '청첩장 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('rsvp_responses')
      .select('*')
      .eq('invitation_id', invitationId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('RSVP 조회 오류:', error)
      return NextResponse.json(
        { error: 'RSVP 조회에 실패했습니다.' },
        { status: 500 }
      )
    }

    // Calculate summary
    const summary = {
      total: data.length,
      attending: data.filter((r) => r.attendance === 'attending').length,
      notAttending: data.filter((r) => r.attendance === 'not_attending').length,
      pending: data.filter((r) => r.attendance === 'pending').length,
      totalGuests: data
        .filter((r) => r.attendance === 'attending')
        .reduce((sum, r) => sum + (r.guest_count || 1), 0),
    }

    return NextResponse.json({ data, summary })
  } catch (error) {
    console.error('RSVP GET API 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
