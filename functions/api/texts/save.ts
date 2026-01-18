/**
 * AI 생성 텍스트 저장 API
 * POST /api/texts/save
 */

interface Env {
  DB: D1Database
}

interface SaveRequest {
  formData: {
    greeting: {
      greetingTone: string
    }
    groomProfile: {
      version: string
      name?: string
    }
    brideProfile: {
      version: string
      name?: string
    }
    story: {
      version: string
    }
    interview: {
      version?: string
    }
  }
  generatedContent: {
    greeting: string
    thanks: string
    groomProfile: string
    brideProfile: string
    story: {
      first: string
      together: string
      preparation: string
    }
    interview: Array<{
      question: string
      answer: string
      speaker?: string
    }>
  }
  userId: string
  regenCounts?: Record<string, number>
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  }

  // CORS preflight
  if (context.request.method === 'OPTIONS') {
    return new Response(null, { headers })
  }

  try {
    const { request, env } = context
    const body: SaveRequest = await request.json()

    const { formData, generatedContent, userId, regenCounts } = body

    // 유효성 검증
    if (!formData || !generatedContent) {
      return new Response(
        JSON.stringify({
          success: false,
          error: '필수 데이터가 누락되었습니다.'
        }),
        { status: 400, headers }
      )
    }

    // ID 생성 (타임스탬프 + 랜덤)
    const id = `gen_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`

    // DB 삽입
    const result = await env.DB.prepare(`
      INSERT INTO ai_generated_texts (
        id, user_id, form_data,
        greeting, thanks, groom_profile, bride_profile,
        story_first, story_together, story_preparation,
        interview,
        greeting_version, profile_version, story_version, interview_version,
        tone, regen_counts
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
      .bind(
        id,
        userId || 'anonymous',
        JSON.stringify(formData),
        generatedContent.greeting || '',
        generatedContent.thanks || '',
        generatedContent.groomProfile || '',
        generatedContent.brideProfile || '',
        generatedContent.story?.first || '',
        generatedContent.story?.together || '',
        generatedContent.story?.preparation || '',
        JSON.stringify(generatedContent.interview || []),
        'short', // greeting_version
        formData.groomProfile?.version || 'short',
        formData.story?.version || 'short',
        formData.interview?.version || 'short',
        formData.greeting?.greetingTone || 'warm',
        JSON.stringify(regenCounts || {})
      )
      .run()

    if (!result.success) {
      throw new Error('데이터베이스 저장 실패')
    }

    return new Response(
      JSON.stringify({
        success: true,
        id,
        message: '저장되었습니다'
      }),
      { headers }
    )
  } catch (error) {
    console.error('저장 오류:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : '저장 중 오류가 발생했습니다.'
      }),
      { status: 500, headers }
    )
  }
}
