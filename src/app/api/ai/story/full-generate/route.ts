import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import type { AllFormData, GeneratedContent } from '@/types/ai-generator'
import { generateFullPrompt, generateFamilyFullPrompt } from '@/lib/ai-prompts'
import { verifyToken, getAuthCookieName } from '@/lib/auth'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

interface GenerateRequest {
  formData: AllFormData
  groomName: string
  brideName: string
  templateId?: string // 'narrative-family' for FAMILY template
}

/**
 * 생성된 콘텐츠 검증 (OUR 템플릿)
 */
function validateGeneratedContent(content: unknown): asserts content is GeneratedContent {
  if (!content || typeof content !== 'object') {
    throw new Error('응답 형식 오류')
  }

  const obj = content as Record<string, unknown>
  const required = ['greeting', 'thanks', 'groomProfile', 'brideProfile', 'story', 'interview']

  for (const field of required) {
    if (!obj[field]) {
      throw new Error(`필수 필드 누락: ${field}`)
    }
  }

  // story 구조 검증
  const story = obj.story as Record<string, unknown>
  if (!story.first || !story.together || !story.preparation) {
    throw new Error('스토리 구조 오류')
  }

  // interview 배열 검증
  if (!Array.isArray(obj.interview) || obj.interview.length === 0) {
    throw new Error('인터뷰 데이터 오류')
  }
}

/**
 * 생성된 콘텐츠 검증 (FAMILY 템플릿)
 */
function validateFamilyGeneratedContent(content: unknown): asserts content is GeneratedContent {
  if (!content || typeof content !== 'object') {
    throw new Error('응답 형식 오류')
  }

  const obj = content as Record<string, unknown>
  const required = ['greeting', 'thanks', 'whyWeChose', 'interview']

  for (const field of required) {
    if (!obj[field]) {
      throw new Error(`필수 필드 누락: ${field}`)
    }
  }

  // whyWeChose 구조 검증
  const whyWeChose = obj.whyWeChose as Record<string, unknown>
  if (!whyWeChose.groomDescription || !whyWeChose.brideDescription) {
    throw new Error('서로를 선택한 이유 구조 오류')
  }

  // interview 배열 검증
  if (!Array.isArray(obj.interview) || obj.interview.length === 0) {
    throw new Error('인터뷰 데이터 오류')
  }
}

/**
 * JSON 파싱 (마크다운 백틱 제거)
 */
function parseJsonResponse(text: string): unknown {
  // Remove markdown code blocks if present
  let jsonText = text.trim()
  jsonText = jsonText.replace(/^```(?:json)?\s*\n?/i, '')
  jsonText = jsonText.replace(/\n?```\s*$/i, '')
  jsonText = jsonText.trim()

  // Try to extract JSON object
  const jsonMatch = jsonText.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('JSON 형식을 찾을 수 없습니다.')
  }

  return JSON.parse(jsonMatch[0])
}

export async function POST(request: NextRequest) {
  try {
    // 인증 확인
    const cookieName = getAuthCookieName()
    const token = request.cookies.get(cookieName)?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const authPayload = await verifyToken(token)
    if (!authPayload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // API 키 확인
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('ANTHROPIC_API_KEY is not set')
      return NextResponse.json(
        { error: 'AI 서비스가 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const body: GenerateRequest = await request.json()
    const { formData, groomName, brideName, templateId } = body

    // FAMILY 템플릿 여부 확인
    const isFamilyTemplate = templateId === 'narrative-family'

    // 입력 검증
    if (!formData) {
      return NextResponse.json(
        { error: '폼 데이터가 누락되었습니다.' },
        { status: 400 }
      )
    }

    if (!groomName || !brideName) {
      return NextResponse.json(
        { error: '신랑/신부 이름이 누락되었습니다.' },
        { status: 400 }
      )
    }

    // 프롬프트 생성 (템플릿에 따라 다른 프롬프트 사용)
    const prompt = isFamilyTemplate
      ? generateFamilyFullPrompt(formData, groomName, brideName)
      : generateFullPrompt(formData, groomName, brideName)

    // Anthropic API 호출 (Haiku 모델)
    const message = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 4000,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    // 텍스트 응답 추출
    const textContent = message.content.find((block) => block.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      throw new Error('AI 응답에서 텍스트를 찾을 수 없습니다.')
    }

    // JSON 파싱
    const parsedContent = parseJsonResponse(textContent.text)

    // 결과 검증 (템플릿에 따라 다른 검증 사용)
    if (isFamilyTemplate) {
      validateFamilyGeneratedContent(parsedContent)
    } else {
      validateGeneratedContent(parsedContent)
    }

    const generatedContent = parsedContent as GeneratedContent

    // FAMILY 템플릿의 경우 빈 필드 기본값 설정
    if (isFamilyTemplate) {
      generatedContent.groomProfile = generatedContent.groomProfile || ''
      generatedContent.brideProfile = generatedContent.brideProfile || ''
      generatedContent.story = generatedContent.story || { first: '', together: '', preparation: '' }
    }

    return NextResponse.json(generatedContent)
  } catch (error) {
    console.error('AI 전체 생성 오류:', error)

    // Anthropic API 에러
    if (error instanceof Anthropic.APIError) {
      const statusCode = error.status || 500
      let message = 'AI 서비스 오류가 발생했습니다.'

      if (statusCode === 401) {
        message = 'AI 서비스 인증 오류입니다.'
      } else if (statusCode === 429) {
        message = '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.'
      } else if (statusCode === 500) {
        message = 'AI 서비스가 일시적으로 불안정합니다.'
      }

      return NextResponse.json(
        { error: message },
        { status: statusCode }
      )
    }

    // JSON 파싱 에러
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'AI 응답 형식 오류입니다. 다시 시도해주세요.' },
        { status: 500 }
      )
    }

    // 기타 에러
    return NextResponse.json(
      { error: '콘텐츠 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
