import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

// GET /api/invitations - List user's invitations
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      )
    }

    const { data, error } = await supabase
      .from('invitations')
      .select('*')
      .eq('user_id', session.user.id)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Invitations fetch error:', error)
      return NextResponse.json(
        { error: '청첩장 조회에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ invitations: data })
  } catch (error) {
    console.error('Invitations API error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// POST /api/invitations - Create new invitation
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      )
    }

    const body = await request.json()

    // Generate unique slug
    const baseSlug = `${body.groom_name || 'groom'}-${body.bride_name || 'bride'}-${new Date().getFullYear()}`
      .toLowerCase()
      .replace(/\s/g, '')

    let slug = baseSlug
    let counter = 1

    // Check for slug uniqueness
    while (true) {
      const { data: existing } = await supabase
        .from('invitations')
        .select('id')
        .eq('slug', slug)
        .single()

      if (!existing) break
      slug = `${baseSlug}-${counter}`
      counter++
    }

    const { data, error } = await supabase
      .from('invitations')
      .insert({
        user_id: session.user.id,
        template_id: body.template_id,
        title: body.title || `${body.groom_name} & ${body.bride_name}`,
        groom_name: body.groom_name || '',
        bride_name: body.bride_name || '',
        wedding_date: body.wedding_date || '',
        wedding_time: body.wedding_time || '',
        venue_name: body.venue_name || '',
        venue_address: body.venue_address || '',
        venue_map_url: body.venue_map_url || null,
        main_image_url: body.main_image_url || null,
        gallery_images: body.gallery_images || [],
        greeting_message: body.greeting_message || '',
        account_info: body.account_info || null,
        custom_styles: body.custom_styles || null,
        slug,
        is_published: body.is_published || false,
      })
      .select()
      .single()

    if (error) {
      console.error('Invitation creation error:', error)
      return NextResponse.json(
        { error: '청첩장 생성에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      invitation: data,
    })
  } catch (error) {
    console.error('Invitation creation API error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
