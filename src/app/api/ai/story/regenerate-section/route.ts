import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import type { AllFormData, GeneratedContent } from '@/types/ai-generator'
import { generateRegeneratePrompt } from '@/lib/ai-prompts'
import { verifyToken, getAuthCookieName } from '@/lib/auth'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

interface RegenerateRequest {
  section: string
  formData: AllFormData
  groomName: string
  brideName: string
  currentContent: GeneratedContent
}

/**
 * JSON 파싱 (배열 또는 객체)
 */
function parseJsonIfNeeded(text: string): unknown {
  let jsonText = text.trim()

  // Remove markdown code blocks
  jsonText = jsonText.replace(/^```(?:json)?\s*\n?/i, '')
  jsonText = jsonText.replace(/\n?```\s*$/i, '')
  jsonText = jsonText.trim()

  // Check if it looks like JSON
  if (jsonText.startsWith('[') || jsonText.startsWith('{')) {
    const match = jsonText.match(/[\[{][\s\S]*[\]}]/)
    if (match) {
      return JSON.parse(match[0])
    }
  }

  // Return as plain text
  return jsonText
}

/**
 * 스토리 전체 재생성 프롬프트
 */
function generateStoryRegenPrompt(
  formData: AllFormData,
  groomName: string,
  brideName: string,
  currentContent: GeneratedContent
): string {
  const { story, greeting } = formData
  const mainTone = greeting.greetingTone

  return `당신은 감성적인 한국 웨딩 스토리 전문 작가입니다.

═══════════════════════════════════════════════════
기존 생성 콘텐츠 (톤 참고용)
═══════════════════════════════════════════════════

기본 정보: 신랑(${groomName}), 신부(${brideName})
전체 톤: ${mainTone === 'sincere' ? '진솔하고 깊이있는' : mainTone === 'warm' ? '따뜻하고 감성적인' : mainTone === 'cheerful' ? '유머러스하고 밝은' : '간결하고 단정한'}

[기존 인사말 (톤 참고)]
${currentContent.greeting?.substring(0, 150)}...

═══════════════════════════════════════════════════
러브스토리 전체 재생성
═══════════════════════════════════════════════════

**중요**: 기존 콘텐츠와 동일한 톤/스타일 유지하면서, 새로운 표현으로 작성

[입력 정보]
1단계 - 연애의 시작:
- 첫 만남: ${story.firstMeetDate.year}년 ${story.firstMeetDate.month}월
- 만난 장소: ${story.firstMeetPlace}
- 사귀게 된 계기: ${story.howStarted}

2단계 - 함께 성장한 시간:
- 관계 기간: ${story.relationshipDuration.years}년 ${story.relationshipDuration.months}개월
- 기억에 남는 일: ${story.memorableEvents.join(', ')}
${story.specificEpisodes ? `- 에피소드: ${story.specificEpisodes}` : ''}

3단계 - 결혼 준비:
${story.proposalStory ? `- 프로포즈: ${story.proposalStory}` : ''}
- 준비 기간: ${story.preparationDuration.years}년 ${story.preparationDuration.months}개월
${story.preparationFeeling ? `- 느낌: ${story.preparationFeeling}` : ''}

[출력 형식]
JSON 형식으로만 출력:
{
  "first": "연애 시작 이야기 (2-3문단)",
  "together": "함께 성장한 시간 이야기 (2-3문단)",
  "preparation": "결혼 준비 이야기 (2-3문단)"
}`
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
      return NextResponse.json(
        { error: 'AI 서비스가 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const body: RegenerateRequest = await request.json()
    const { section, formData, groomName, brideName, currentContent } = body

    // 입력 검증
    if (!section || !formData || !currentContent) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // 지원하는 섹션 확인
    const validSections = [
      'greeting',
      'thanks',
      'groomProfile',
      'brideProfile',
      'story', // 전체 스토리
      'story.first',
      'story.together',
      'story.preparation',
      'interview'
    ]

    if (!validSections.includes(section)) {
      return NextResponse.json(
        { error: '유효하지 않은 섹션입니다.' },
        { status: 400 }
      )
    }

    // 프롬프트 생성 (story 전체는 별도 처리)
    let prompt: string
    if (section === 'story') {
      prompt = generateStoryRegenPrompt(
        formData,
        groomName || '',
        brideName || '',
        currentContent
      )
    } else {
      prompt = generateRegeneratePrompt(
        section,
        formData,
        groomName || '',
        brideName || '',
        currentContent as unknown as Record<string, unknown>
      )
    }

    if (!prompt) {
      return NextResponse.json(
        { error: '프롬프트 생성 오류' },
        { status: 500 }
      )
    }

    console.log(`AI 섹션 재생성 시작: ${section}`)

    // Anthropic API 호출 (재생성시 약간 더 높은 temperature)
    const message = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 2500,
      temperature: 0.8, // 재생성시 더 창의적으로
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

    console.log(`AI 섹션 재생성 완료: ${section}`)

    // 섹션에 따라 다른 파싱
    if (section === 'interview') {
      // 인터뷰는 JSON 배열
      const interview = parseJsonIfNeeded(textContent.text)
      return NextResponse.json({ interview })
    } else if (section === 'story') {
      // 스토리 전체는 JSON 객체
      const story = parseJsonIfNeeded(textContent.text) as GeneratedContent['story']
      return NextResponse.json({ story })
    } else if (section.startsWith('story.')) {
      // 스토리 하위 섹션은 텍스트
      let content = textContent.text.trim()
      // JSON으로 파싱 시도 후 실패하면 텍스트 그대로
      try {
        const parsed = JSON.parse(content)
        if (typeof parsed === 'string') {
          content = parsed
        }
      } catch {
        // 텍스트 그대로 사용
      }
      return NextResponse.json({ content })
    } else {
      // 나머지는 텍스트
      let content = textContent.text.trim()
      // JSON 형식으로 감싸진 경우 처리
      if (content.startsWith('"') && content.endsWith('"')) {
        try {
          content = JSON.parse(content)
        } catch {
          // 그대로 사용
        }
      }
      return NextResponse.json({ content })
    }
  } catch (error) {
    console.error('AI 섹션 재생성 오류:', error)

    if (error instanceof Anthropic.APIError) {
      return NextResponse.json(
        { error: `AI 서비스 오류: ${error.message}` },
        { status: error.status || 500 }
      )
    }

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'AI 응답 형식 오류입니다. 다시 시도해주세요.' },
        { status: 500 }
      )
    }

    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류'
    return NextResponse.json(
      { error: `재생성 실패: ${errorMessage}` },
      { status: 500 }
    )
  }
}
