import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { aiQuestions, familyWhyWeChoseQuestions } from '@/lib/ai-questions'
import { verifyToken, getAuthCookieName } from '@/lib/auth'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// 기본 스토리 타입 (OUR 템플릿, 인터뷰용)
// 순서: 소개(profileIntro) → 스토리(ourStory) → 인터뷰(decision) → 감사인사(thankYou)
export type GeneratedStory = {
  profileIntro: string  // 커플 소개
  ourStory: string      // 러브스토리
  decision: string      // 결혼 결심 (인터뷰용)
  thankYou: string      // 감사인사
}

// FAMILY 템플릿 "서로를 선택한 이유" 타입
export type FamilyWhyWeChoseStory = {
  groomDescription: string
  brideDescription: string
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
1. 4개의 섹션을 작성해 주세요 (순서대로):
   - profileIntro: 커플 소개글 (신랑신부가 서로를 소개하는 내용, 어떤 사람인지)
   - ourStory: 러브스토리 (두 사람의 만남과 사랑 이야기, 첫 만남, 연애 과정)
   - decision: 결혼을 결심하게 된 계기 (인터뷰 Q&A 답변 형식으로)
   - thankYou: 감사 인사 (하객분들께 전하는 따뜻한 감사의 말)

2. 각 섹션 작성 가이드:
   - profileIntro: 80-120자, 상대방의 매력과 좋은 점 위주로
   - ourStory: 120-180자, 구체적인 에피소드 중심으로
   - decision: 100-150자, 결혼을 결심한 순간과 이유
   - thankYou: 60-100자, 간결하고 진심어린 감사
   - 어조: 진솔하고 따뜻한 경어체
   - 과장되거나 뻔한 표현 지양
   - 두 사람만의 특별한 이야기가 드러나도록

3. 반드시 아래 JSON 형식으로만 응답해 주세요:
{
  "profileIntro": "텍스트",
  "ourStory": "텍스트",
  "decision": "텍스트",
  "thankYou": "텍스트"
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
        { error: 'AI 서비스 오류가 발생했습니다.' },
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
   - groomDescription: 신랑 관점에서 "나는 이런 사람인데, 상대방이 이런 부분을 채워주고, 그래서 결혼을 결심했다"
   - brideDescription: 신부 관점에서 "나는 이런 사람인데, 상대방이 이런 부분을 채워주고, 그래서 결혼을 결심했다"

2. 작성 가이드:
   - 길이: 각 150-200자, 4-6문장
   - 구조:
     1) 첫 문장: 나의 성격/특징 설명 (핵심 단어는 **굵게** 강조)
     2) 중간: 그로 인한 어려움이나 부족한 점
     3) 전환: "그런데" 또는 "그런 저에게" 같은 전환어
     4) 상대방이 어떻게 채워주는지 구체적으로
     5) 마지막: 결혼 결심 순간 또는 확신이 든 이유
   - 어조: 진솔하고 담담하게, 1인칭 시점
   - 줄바꿈: \\n으로 자연스럽게 문장 구분

3. 참고 예시 (복사 금지, 스타일만 참고):
   예시1 - 신랑:
   "저는 **신중한 편**입니다.\\n결정하는 데 시간이 오래 걸리고,\\n여러 가지를 따져본 후에야 움직이는 편이죠.\\n\\n그런 저에게 그녀는 늘 기다려주었습니다.\\n서두르지 않아도 된다고, 천천히 해도 괜찮다고.\\n그 여유로움 덕분에 저도 조금씩 편해졌습니다.\\n\\n이 사람이라면 평생 함께해도 되겠다 싶었습니다."

   예시2 - 신부:
   "저는 **말이 빠르고 마음이 앞서가는** 사람입니다.\\n빨리 결정하고 싶고, 기다리는 게 힘들어\\n상대방을 재촉할 때가 많았어요.\\n\\n그런데 그 사람은 늘 차분했습니다.\\n급한 저를 다그치지 않고,\\n한 발 물러서서 정리해주는 사람이었어요.\\n\\n힘든 시기에 아무 말 없이 곁을 지켜주는 걸 보고\\n이 사람이 맞다는 확신이 들었습니다."

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
        { error: 'AI 서비스 오류가 발생했습니다.' },
        { status: error.status || 500 }
      )
    }

    return NextResponse.json(
      { error: '스토리 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
