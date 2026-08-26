/**
 * AI 인사말 생성 프롬프트 빌더 (순수 함수 · 서버/클라이언트 공용).
 * - 서버 라우트(generate-greeting)와 클라이언트(프롬프트 복사)가 동일 프롬프트를 쓰도록 한 곳에 둔다.
 * - 서버 전용 import 없음 (client 컴포넌트에서 import 가능).
 */

export type GreetingAnswers = {
  relationship_duration: string
  relationship_character: string
  marriage_meaning: string
  greeting_style: string
  groom_name?: string
  bride_name?: string
}

const STYLE_GUIDE: Record<string, string> = {
  '따뜻하고 감성적인': '따뜻하고 진심 어린 감성을 담아, 마음이 전해지는 문장으로 작성',
  '간결하고 세련된': '군더더기 없이 세련되고 간결하게, 핵심만 담아서 작성',
  '스토리텔링 형식': '두 사람의 이야기를 짧게 풀어내는 내러티브 형식으로 작성',
  '밝고 경쾌한': '밝고 긍정적인 에너지가 느껴지도록 경쾌하게 작성',
  '전통적이고 격식있는': '격식을 갖춘 전통적인 청첩장 문구 스타일로 작성',
}

/**
 * @param answers 사용자 답변
 * @param opts.jsonOutput true(기본)=JSON 형식 응답 요구(자동 생성용), false=순수 인사말 텍스트만(수동 복사용)
 */
export function buildGreetingPrompt(
  answers: GreetingAnswers,
  opts?: { jsonOutput?: boolean },
): string {
  const jsonOutput = opts?.jsonOutput !== false
  const selectedStyle = STYLE_GUIDE[answers.greeting_style] || STYLE_GUIDE['따뜻하고 감성적인']

  const outputRule = jsonOutput
    ? `반드시 아래 JSON 형식으로만 응답해 주세요:
{
  "greeting": "인사말 텍스트 (줄바꿈은 \\n으로)"
}`
    : `인사말 본문만 출력해 주세요. 설명·따옴표·JSON 없이 인사말 텍스트만.`

  return `당신은 감성적인 청첩장 문구 전문 작가입니다. 아래 정보를 바탕으로 마음이 따뜻해지는 청첩장 인사말을 작성해 주세요.

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

${outputRule}`
}

/** 붙여넣은 AI 결과에서 인사말 텍스트를 추출 (JSON {greeting} 우선, 실패 시 원문). */
export function extractGreetingFromResult(raw: string): string {
  const text = (raw || '').trim()
  if (!text) return ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]) as { greeting?: string }
      if (parsed && typeof parsed.greeting === 'string' && parsed.greeting.trim()) {
        return parsed.greeting.trim()
      }
    } catch {
      // JSON 파싱 실패 → 원문 사용
    }
  }
  return text
}
