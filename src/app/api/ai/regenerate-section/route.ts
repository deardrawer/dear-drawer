export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { aiQuestions } from '@/lib/ai-questions'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

type Section = 'ourStory' | 'decision' | 'invitation'

const sectionDescriptions: Record<Section, string> = {
  ourStory: '두 사람의 만남과 사랑 이야기 (첫 만남, 연애 과정)',
  decision: '결혼을 결심하게 된 계기와 서로에 대한 마음',
  invitation: '하객들에게 전하는 초대의 말씀',
}

export async function POST(request: NextRequest) {
  try {
    const { section, answers, currentContent } = await request.json() as {
      section: Section
      answers: Record<string, string>
      currentContent: string
    }

    if (!section || !answers) {
      return NextResponse.json(
        { error: '필수 파라미터가 누락되었습니다.' },
        { status: 400 }
      )
    }

    if (!['ourStory', 'decision', 'invitation'].includes(section)) {
      return NextResponse.json(
        { error: '유효하지 않은 섹션입니다.' },
        { status: 400 }
      )
    }

    // Build the answers context
    const answersContext = aiQuestions
      .map((q) => {
        const answer = answers[q.id]
        if (answer) {
          return `Q: ${q.question}\nA: ${answer}`
        }
        return null
      })
      .filter(Boolean)
      .join('\n\n')

    const prompt = `당신은 전문 청첩장 문구 작가입니다. 아래 신랑·신부의 이야기를 바탕으로 청첩장의 특정 섹션을 새롭게 작성해 주세요.

[신랑·신부 이야기]
${answersContext}

[재작성 요청 섹션]
섹션명: ${section}
설명: ${sectionDescriptions[section]}

[이전 내용 - 참고용, 다르게 작성해 주세요]
${currentContent || '없음'}

[요구사항]
1. 길이: 120-180자, 3-5문장
2. 어조: 진솔하고 따뜻한 경어체
3. 이전 내용과 다른 새로운 표현과 구조로 작성
4. 제공된 답변을 자연스럽게 녹여서 작성
5. 과장되거나 뻔한 표현 지양

반드시 아래 JSON 형식으로만 응답해 주세요:
{
  "${section}": "새로 작성된 텍스트"
}`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    // Extract text content
    const textContent = message.content.find((block) => block.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      throw new Error('AI 응답에서 텍스트를 찾을 수 없습니다.')
    }

    // Parse JSON response
    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('AI 응답에서 JSON을 찾을 수 없습니다.')
    }

    const result = JSON.parse(jsonMatch[0])

    return NextResponse.json(result)
  } catch (error) {
    console.error('AI 섹션 재생성 오류:', error)

    if (error instanceof Anthropic.APIError) {
      return NextResponse.json(
        { error: `AI API 오류: ${error.message}` },
        { status: error.status || 500 }
      )
    }

    return NextResponse.json(
      { error: '섹션 재생성 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
