import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { verifyToken, getAuthCookieName } from '@/lib/auth'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// 인사말 생성 질문 목록
export const greetingQuestions = [
  {
    id: 'relationship_duration',
    question: '두 분은 얼마나 사귀셨나요?',
    options: ['1년 미만', '1~3년', '3~5년', '5년 이상', '10년 이상'],
  },
  {
    id: 'relationship_character',
    question: '두 분의 관계를 가장 잘 표현하는 건?',
    options: ['서로의 가장 친한 친구', '서로를 성장시키는 파트너', '편안한 일상의 동반자', '설레는 연인', '운명 같은 만남'],
  },
  {
    id: 'marriage_meaning',
    question: '두 분에게 결혼은 어떤 의미인가요?',
    options: ['새로운 가정을 이루는 시작', '서로에 대한 약속과 책임', '평생 함께 걸어갈 동반자', '두 가족이 하나가 되는 것', '사랑의 완성'],
  },
  {
    id: 'greeting_style',
    question: '어떤 분위기의 인사말을 원하세요?',
    options: ['따뜻하고 감성적인', '간결하고 세련된', '스토리텔링 형식', '밝고 경쾌한', '전통적이고 격식있는'],
  },
]

export type GreetingAnswers = {
  relationship_duration: string
  relationship_character: string
  marriage_meaning: string
  greeting_style: string
  groom_name?: string
  bride_name?: string
}

export async function POST(request: NextRequest) {
  try {
    // 인증 확인
    const cookieName = getAuthCookieName()
    const token = request.cookies.get(cookieName)?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { answers } = await request.json() as { answers: GreetingAnswers }

    if (!answers || Object.keys(answers).length === 0) {
      return NextResponse.json(
        { error: '답변이 제공되지 않았습니다.' },
        { status: 400 }
      )
    }

    // 스타일별 톤 설명
    const styleGuide: Record<string, string> = {
      '따뜻하고 감성적인': '따뜻하고 진심 어린 감성을 담아, 마음이 전해지는 문장으로 작성',
      '간결하고 세련된': '군더더기 없이 세련되고 간결하게, 핵심만 담아서 작성',
      '스토리텔링 형식': '두 사람의 이야기를 짧게 풀어내는 내러티브 형식으로 작성',
      '밝고 경쾌한': '밝고 긍정적인 에너지가 느껴지도록 경쾌하게 작성',
      '전통적이고 격식있는': '격식을 갖춘 전통적인 청첩장 문구 스타일로 작성',
    }

    const selectedStyle = styleGuide[answers.greeting_style] || styleGuide['따뜻하고 감성적인']

    const prompt = `당신은 감성적인 청첩장 문구 전문 작가입니다. 아래 정보를 바탕으로 마음이 따뜻해지는 청첩장 인사말을 작성해 주세요.

[커플 정보]
- 연애 기간: ${answers.relationship_duration}
- 관계 특징: ${answers.relationship_character}
- 결혼의 의미: ${answers.marriage_meaning}
- 원하는 스타일: ${answers.greeting_style}
${answers.groom_name ? `- 신랑 이름: ${answers.groom_name}` : ''}
${answers.bride_name ? `- 신부 이름: ${answers.bride_name}` : ''}

[작성 가이드]
1. 스타일: ${selectedStyle}

2. 줄바꿈 규칙 (매우 중요):
   - 한 줄에 10-20자 이내로 짧게
   - 의미 단위로 자연스럽게 끊기
   - 문단 사이에는 빈 줄 추가
   - 시적인 리듬감 있게

3. 어순과 표현:
   - 자연스러운 한국어 어순 유지
   - "~합니다", "~입니다" 등 경어체 사용
   - 주어-목적어-서술어 순서 준수
   - 관형절이 너무 길어지지 않게

4. 감성적 표현:
   - 두 사람의 관계 특징을 감성적으로 풀어내기
   - 추상적 표현보다 구체적인 이미지 사용
   - 과장 없이 진솔하게
   - 마지막에 초대의 말로 마무리

[좋은 예시]
서로의 가장 좋은 친구이자
든든한 지지자였던 두 사람이
이제 평생의 동반자가 되려 합니다.

함께 웃고, 함께 울며
같은 방향을 바라보던 시간들이
저희를 여기까지 이끌었습니다.

새로운 시작을 함께해 주세요.

[피해야 할 표현]
- "~하는" 관형절이 3개 이상 연속되는 문장
- 한 문장이 40자를 넘는 경우
- "저희 두 사람은 ~하고 ~하며 ~한 사람들입니다" 같은 나열식

반드시 아래 JSON 형식으로만 응답해 주세요:
{
  "greeting": "인사말 텍스트 (줄바꿈은 \\n으로)"
}`

    const message = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
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

    const generated = JSON.parse(jsonMatch[0]) as { greeting: string }

    return NextResponse.json({
      greeting: generated.greeting,
    })
  } catch (error) {
    console.error('Greeting generation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '인사말 생성에 실패했습니다.' },
      { status: 500 }
    )
  }
}
