/**
 * AI 생성 텍스트 수정 API
 * PUT /api/texts/update
 */

interface Env {
  DB: D1Database
}

interface UpdateRequest {
  id: string
  generatedContent: {
    greeting?: string
    thanks?: string
    groomProfile?: string
    brideProfile?: string
    story?: {
      first?: string
      together?: string
      preparation?: string
    }
    interview?: Array<{
      question: string
      answer: string
      speaker?: string
    }>
  }
  regenCounts?: Record<string, number>
}

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
}

export const onRequestPut: PagesFunction<Env> = async (context) => {
  try {
    const { request, env } = context
    const body: UpdateRequest = await request.json()

    const { id, generatedContent, regenCounts } = body

    if (!id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'ID가 필요합니다.'
        }),
        { status: 400, headers }
      )
    }

    if (!generatedContent) {
      return new Response(
        JSON.stringify({
          success: false,
          error: '수정할 콘텐츠가 필요합니다.'
        }),
        { status: 400, headers }
      )
    }

    // 존재 여부 확인
    const existing = await env.DB.prepare(`
      SELECT id FROM ai_generated_texts WHERE id = ?
    `)
      .bind(id)
      .first()

    if (!existing) {
      return new Response(
        JSON.stringify({
          success: false,
          error: '데이터를 찾을 수 없습니다.'
        }),
        { status: 404, headers }
      )
    }

    // 업데이트 쿼리 구성
    const updateFields: string[] = []
    const updateValues: (string | null)[] = []

    if (generatedContent.greeting !== undefined) {
      updateFields.push('greeting = ?')
      updateValues.push(generatedContent.greeting)
    }

    if (generatedContent.thanks !== undefined) {
      updateFields.push('thanks = ?')
      updateValues.push(generatedContent.thanks)
    }

    if (generatedContent.groomProfile !== undefined) {
      updateFields.push('groom_profile = ?')
      updateValues.push(generatedContent.groomProfile)
    }

    if (generatedContent.brideProfile !== undefined) {
      updateFields.push('bride_profile = ?')
      updateValues.push(generatedContent.brideProfile)
    }

    if (generatedContent.story?.first !== undefined) {
      updateFields.push('story_first = ?')
      updateValues.push(generatedContent.story.first)
    }

    if (generatedContent.story?.together !== undefined) {
      updateFields.push('story_together = ?')
      updateValues.push(generatedContent.story.together)
    }

    if (generatedContent.story?.preparation !== undefined) {
      updateFields.push('story_preparation = ?')
      updateValues.push(generatedContent.story.preparation)
    }

    if (generatedContent.interview !== undefined) {
      updateFields.push('interview = ?')
      updateValues.push(JSON.stringify(generatedContent.interview))
    }

    if (regenCounts !== undefined) {
      updateFields.push('regen_counts = ?')
      updateValues.push(JSON.stringify(regenCounts))
    }

    // updated_at 자동 갱신
    updateFields.push('updated_at = CURRENT_TIMESTAMP')

    if (updateFields.length === 1) {
      // updated_at만 있는 경우 - 실제 변경 없음
      return new Response(
        JSON.stringify({
          success: true,
          message: '변경할 내용이 없습니다.'
        }),
        { headers }
      )
    }

    // ID 추가
    updateValues.push(id)

    // DB 업데이트
    const query = `
      UPDATE ai_generated_texts
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `

    await env.DB.prepare(query).bind(...updateValues).run()

    return new Response(
      JSON.stringify({
        success: true,
        message: '수정되었습니다.'
      }),
      { headers }
    )
  } catch (error) {
    console.error('수정 오류:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : '수정 중 오류가 발생했습니다.'
      }),
      { status: 500, headers }
    )
  }
}

// OPTIONS: CORS preflight
export const onRequestOptions: PagesFunction<Env> = async () => {
  return new Response(null, { headers })
}
