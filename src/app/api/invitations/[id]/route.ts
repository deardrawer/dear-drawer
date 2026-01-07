import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

// GET /api/invitations/[id] - Get single invitation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    const { data, error } = await supabase
      .from('invitations')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: '청첩장을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // Check ownership if logged in
    if (session?.user?.id && data.user_id !== session.user.id) {
      // Allow viewing if published, but don't expose sensitive data
      if (!data.is_published) {
        return NextResponse.json(
          { error: '접근 권한이 없습니다.' },
          { status: 403 }
        )
      }
    }

    return NextResponse.json({ invitation: data })
  } catch (error) {
    console.error('Invitation fetch error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// PUT /api/invitations/[id] - Update invitation
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      )
    }

    // Check ownership
    const { data: existing } = await supabase
      .from('invitations')
      .select('user_id')
      .eq('id', id)
      .single()

    if (!existing || existing.user_id !== session.user.id) {
      return NextResponse.json(
        { error: '접근 권한이 없습니다.' },
        { status: 403 }
      )
    }

    const body = await request.json()

    const { data, error } = await supabase
      .from('invitations')
      .update({
        template_id: body.template_id,
        title: body.title,
        groom_name: body.groom_name,
        bride_name: body.bride_name,
        wedding_date: body.wedding_date,
        wedding_time: body.wedding_time,
        venue_name: body.venue_name,
        venue_address: body.venue_address,
        venue_map_url: body.venue_map_url,
        main_image_url: body.main_image_url,
        gallery_images: body.gallery_images,
        greeting_message: body.greeting_message,
        account_info: body.account_info,
        custom_styles: body.custom_styles,
        slug: body.slug,
        is_published: body.is_published,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Invitation update error:', error)
      return NextResponse.json(
        { error: '청첩장 수정에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      invitation: data,
    })
  } catch (error) {
    console.error('Invitation update API error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// DELETE /api/invitations/[id] - Delete invitation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      )
    }

    // Check ownership
    const { data: existing } = await supabase
      .from('invitations')
      .select('user_id')
      .eq('id', id)
      .single()

    if (!existing || existing.user_id !== session.user.id) {
      return NextResponse.json(
        { error: '접근 권한이 없습니다.' },
        { status: 403 }
      )
    }

    // Delete related RSVP responses first
    await supabase
      .from('rsvp_responses')
      .delete()
      .eq('invitation_id', id)

    // Delete invitation
    const { error } = await supabase
      .from('invitations')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Invitation deletion error:', error)
      return NextResponse.json(
        { error: '청첩장 삭제에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '청첩장이 삭제되었습니다.',
    })
  } catch (error) {
    console.error('Invitation deletion API error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
