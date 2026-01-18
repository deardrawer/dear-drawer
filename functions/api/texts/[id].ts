/**
 * AI 생성 텍스트 조회/삭제 API
 * GET /api/texts/:id - 단건 조회
 * DELETE /api/texts/:id - 삭제
 */

interface Env {
  DB: D1Database
}

interface DBRow {
  id: string
  user_id: string
  form_data: string
  greeting: string | null
  thanks: string | null
  groom_profile: string | null
  bride_profile: string | null
  story_first: string | null
  story_together: string | null
  story_preparation: string | null
  interview: string | null
  greeting_version: string | null
  profile_version: string | null
  story_version: string | null
  interview_version: string | null
  tone: string | null
  regen_counts: string | null
  created_at: string
  updated_at: string
}

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
}

// GET: ID로 조회
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { params, env } = context
    const id = params.id as string

    if (!id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'ID가 필요합니다.'
        }),
        { status: 400, headers }
      )
    }

    const result = await env.DB.prepare(`
      SELECT * FROM ai_generated_texts WHERE id = ?
    `)
      .bind(id)
      .first<DBRow>()

    if (!result) {
      return new Response(
        JSON.stringify({
          success: false,
          error: '데이터를 찾을 수 없습니다.'
        }),
        { status: 404, headers }
      )
    }

    // 응답 데이터 구성
    const data = {
      id: result.id,
      userId: result.user_id,
      formData: safeJsonParse(result.form_data, {}),
      generatedContent: {
        greeting: result.greeting || '',
        thanks: result.thanks || '',
        groomProfile: result.groom_profile || '',
        brideProfile: result.bride_profile || '',
        story: {
          first: result.story_first || '',
          together: result.story_together || '',
          preparation: result.story_preparation || ''
        },
        interview: safeJsonParse(result.interview, [])
      },
      metadata: {
        greetingVersion: result.greeting_version,
        profileVersion: result.profile_version,
        storyVersion: result.story_version,
        interviewVersion: result.interview_version,
        tone: result.tone
      },
      regenCounts: safeJsonParse(result.regen_counts, {}),
      createdAt: result.created_at,
      updatedAt: result.updated_at
    }

    return new Response(
      JSON.stringify({
        success: true,
        data
      }),
      { headers }
    )
  } catch (error) {
    console.error('조회 오류:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : '조회 중 오류가 발생했습니다.'
      }),
      { status: 500, headers }
    )
  }
}

// DELETE: ID로 삭제
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  try {
    const { params, env } = context
    const id = params.id as string

    if (!id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'ID가 필요합니다.'
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

    // 삭제 실행
    await env.DB.prepare(`
      DELETE FROM ai_generated_texts WHERE id = ?
    `)
      .bind(id)
      .run()

    return new Response(
      JSON.stringify({
        success: true,
        message: '삭제되었습니다.'
      }),
      { headers }
    )
  } catch (error) {
    console.error('삭제 오류:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : '삭제 중 오류가 발생했습니다.'
      }),
      { status: 500, headers }
    )
  }
}

// OPTIONS: CORS preflight
export const onRequestOptions: PagesFunction<Env> = async () => {
  return new Response(null, { headers })
}

// JSON 안전 파싱 헬퍼
function safeJsonParse<T>(json: string | null, fallback: T): T {
  if (!json) return fallback
  try {
    return JSON.parse(json)
  } catch {
    return fallback
  }
}
