import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

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

    // Create CSV content
    const headers = ['이름', '연락처', '참석여부', '동반인원', '메시지', '응답일시']

    const getAttendanceLabel = (attendance: string) => {
      switch (attendance) {
        case 'attending': return '참석'
        case 'not_attending': return '불참'
        case 'pending': return '미정'
        default: return attendance
      }
    }

    const rows = data.map((r: {
      guest_name: string
      guest_phone: string | null
      attendance: string
      guest_count: number
      message: string | null
      created_at: string
    }) => [
      r.guest_name,
      r.guest_phone || '',
      getAttendanceLabel(r.attendance),
      r.attendance === 'attending' ? r.guest_count.toString() : '',
      (r.message || '').replace(/"/g, '""'),
      new Date(r.created_at).toLocaleString('ko-KR'),
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n')

    // Add BOM for Excel Korean support
    const bom = '\uFEFF'
    const csvWithBom = bom + csvContent

    return new NextResponse(csvWithBom, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="rsvp_responses_${invitationId}.csv"`,
      },
    })
  } catch (error) {
    console.error('CSV export error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
