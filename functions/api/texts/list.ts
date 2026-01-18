/**
 * AI 생성 텍스트 목록 조회 API
 * GET /api/texts/list?userId=xxx
 */

interface Env {
  DB: D1Database
}

interface ListItem {
  id: string
  greeting: string | null
  tone: string | null
  created_at: string
  updated_at: string
}

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
}

// GET: 사용자의 모든 생성물 조회
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { request, env } = context
    const url = new URL(request.url)
    const userId = url.searchParams.get('userId')
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 100)
    const offset = parseInt(url.searchParams.get('offset') || '0', 10)

    if (!userId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'userId가 필요합니다.'
        }),
        { status: 400, headers }
      )
    }

    // 목록 조회
    const result = await env.DB.prepare(`
      SELECT
        id,
        greeting,
        tone,
        created_at,
        updated_at
      FROM ai_generated_texts
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ?
      OFFSET ?
    `)
      .bind(userId, limit, offset)
      .all<ListItem>()

    // 전체 개수 조회
    const countResult = await env.DB.prepare(`
      SELECT COUNT(*) as total
      FROM ai_generated_texts
      WHERE user_id = ?
    `)
      .bind(userId)
      .first<{ total: number }>()

    const items = result.results || []
    const total = countResult?.total || 0

    return new Response(
      JSON.stringify({
        success: true,
        data: items.map((item) => ({
          id: item.id,
          greeting: item.greeting ? truncateText(item.greeting, 50) : '',
          tone: item.tone,
          createdAt: item.created_at,
          updatedAt: item.updated_at
        })),
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + items.length < total
        }
      }),
      { headers }
    )
  } catch (error) {
    console.error('목록 조회 오류:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : '목록 조회 중 오류가 발생했습니다.'
      }),
      { status: 500, headers }
    )
  }
}

// OPTIONS: CORS preflight
export const onRequestOptions: PagesFunction<Env> = async () => {
  return new Response(null, { headers })
}

// 텍스트 자르기 헬퍼
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}
