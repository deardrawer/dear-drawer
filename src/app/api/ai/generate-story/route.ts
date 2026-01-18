import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { aiQuestions } from '@/lib/ai-questions'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export type GeneratedStory = {
  ourStory: string
  decision: string
  invitation: string
}

export async function POST(request: NextRequest) {
  try {
    const { answers } = await request.json() as { answers: Record<string, string> }

    if (!answers || Object.keys(answers).length === 0) {
      return NextResponse.json(
        { error: '답변이 제공되지 않았습니다.' },
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

    const prompt = `당신은 전문 청첩장 문구 작가입니다. 아래 신랑·신부의 이야기를 바탕으로 감동적인 청첩장 문구를 작성해 주세요.

[신랑·신부 이야기]
${answersContext}

[요구사항]
1. 3개의 섹션을 작성해 주세요:
   - ourStory: 두 사람의 만남과 사랑 이야기 (첫 만남, 연애 과정)
   - decision: 결혼을 결심하게 된 계기와 서로에 대한 마음
   - invitation: 하객들에게 전하는 초대의 말씀

2. 각 섹션 작성 가이드:
   - 길이: 각 120-180자, 3-5문장
   - 어조: 진솔하고 따뜻한 경어체
   - 내용: 제공된 답변을 자연스럽게 녹여서 작성
   - 과장되거나 뻔한 표현 지양
   - 두 사람만의 특별한 이야기가 드러나도록

3. 반드시 아래 JSON 형식으로만 응답해 주세요:
{
  "ourStory": "텍스트",
  "decision": "텍스트",
  "invitation": "텍스트"
}`

    const message = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1024,
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

    const generatedStory: GeneratedStory = JSON.parse(jsonMatch[0])

    return NextResponse.json(generatedStory)
  } catch (error) {
    console.error('AI 스토리 생성 오류:', error)

    if (error instanceof Anthropic.APIError) {
      return NextResponse.json(
        { error: `AI API 오류: ${error.message}` },
        { status: error.status || 500 }
      )
    }

    return NextResponse.json(
      { error: '스토리 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
