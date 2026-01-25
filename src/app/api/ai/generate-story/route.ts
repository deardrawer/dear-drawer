import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { aiQuestions, familyWhyWeChoseQuestions } from '@/lib/ai-questions'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// 기본 스토리 타입 (OUR 템플릿, 인터뷰용)
export type GeneratedStory = {
  ourStory: string
  decision: string
  invitation: string
}

// FAMILY 템플릿 "서로를 선택한 이유" 타입
export type FamilyWhyWeChoseStory = {
  groomDescription: string
  brideDescription: string
}

export async function POST(request: NextRequest) {
  try {
    const { answers, templateType } = await request.json() as {
      answers: Record<string, string>
      templateType?: 'default' | 'family-why-we-chose'
    }

    if (!answers || Object.keys(answers).length === 0) {
      return NextResponse.json(
        { error: '답변이 제공되지 않았습니다.' },
        { status: 400 }
      )
    }

    // FAMILY 템플릿 "서로를 선택한 이유" 생성
    if (templateType === 'family-why-we-chose') {
      return generateFamilyWhyWeChose(answers)
    }

    // 기본: OUR 템플릿 / 인터뷰용 스토리 생성
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

// FAMILY 템플릿 "서로를 선택한 이유" 생성 함수
async function generateFamilyWhyWeChose(answers: Record<string, string>) {
  try {
    // Build the answers context
    const answersContext = familyWhyWeChoseQuestions
      .map((q) => {
        const answer = answers[q.id]
        if (answer) {
          return `Q: ${q.question}\nA: ${answer}`
        }
        return null
      })
      .filter(Boolean)
      .join('\n\n')

    const prompt = `당신은 전문 청첩장 문구 작가입니다. 아래 신랑·신부의 이야기를 바탕으로 "서로를 선택한 이유" 섹션의 문구를 작성해 주세요.

[신랑·신부 이야기]
${answersContext}

[요구사항]
1. 2개의 섹션을 작성해 주세요:
   - groomDescription: 신랑 관점에서 "나는 이런 사람인데, 이런 부족함을 채워주는 사람을 만났다"는 내용
   - brideDescription: 신부 관점에서 "나는 이런 사람인데, 이런 부족함을 채워주는 사람을 만났다"는 내용

2. 작성 가이드:
   - 길이: 각 80-120자, 3-4문장
   - 형식:
     첫 문장: "저는 **[성격/특징]** 사람입니다." (핵심 키워드는 ** 로 강조)
     중간: 부족한 점이나 약점 언급
     마지막: 상대방이 어떻게 채워주는지 또는 어떤 사람을 만났는지
   - 어조: 진솔하고 담백하게, 1인칭 시점
   - 줄바꿈: \\n 으로 문장 구분

3. 예시:
   "저는 **급하고 걱정이 많은** 사람입니다.\\n작은 일에도 쉽게 불안해하고,\\n혼자 끙끙 앓는 버릇이 있었습니다.\\n\\n그런 저에게 그녀는 늘 **차분하게 괜찮다고** 말해주었습니다.\\n나의 부족함을 채워주는 사람을 만났습니다."

4. 반드시 아래 JSON 형식으로만 응답해 주세요:
{
  "groomDescription": "텍스트",
  "brideDescription": "텍스트"
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

    const generatedStory: FamilyWhyWeChoseStory = JSON.parse(jsonMatch[0])

    return NextResponse.json(generatedStory)
  } catch (error) {
    console.error('FAMILY 스토리 생성 오류:', error)

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
