// OpenRouter API Client
// Using meta-llama/llama-3.3-70b-instruct:free model

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "meta-llama/llama-3.3-70b-instruct:free";

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OpenRouterResponse {
  id: string;
  choices: {
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export async function callOpenRouter(
  messages: Message[],
  options?: {
    maxTokens?: number;
    temperature?: number;
  }
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }

  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://dear-drawer.pages.dev",
      "X-Title": "Dear Drawer Wedding Invitation",
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      max_tokens: options?.maxTokens || 2000,
      temperature: options?.temperature || 0.7,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("OpenRouter API error:", errorText);
    throw new Error(`OpenRouter API error: ${response.status}`);
  }

  const data: OpenRouterResponse = await response.json();

  if (!data.choices || data.choices.length === 0) {
    throw new Error("No response from OpenRouter");
  }

  return data.choices[0].message.content;
}

// 스토리 생성을 위한 시스템 프롬프트
export const STORY_SYSTEM_PROMPT = `당신은 결혼식 청첩장을 위한 감성적인 스토리 작가입니다.
커플의 이야기를 듣고 아름답고 진심 어린 글을 작성해주세요.

작성 지침:
- 한국어로 작성합니다
- 따뜻하고 진심 어린 톤을 유지합니다
- 구체적인 에피소드를 자연스럽게 녹여냅니다
- 너무 길지 않게, 읽기 좋은 분량으로 작성합니다
- 과장되지 않고 진솔한 느낌을 줍니다`;

// 수정 옵션별 프롬프트
export const MODIFICATION_PROMPTS: Record<string, string> = {
  romantic: `다음 글을 더 로맨틱하고 감성적으로 수정해주세요.
사랑스러운 표현과 따뜻한 감정을 더해주되, 과하지 않게 자연스럽게 작성해주세요.`,

  concise: `다음 글을 더 간결하게 수정해주세요.
핵심 메시지는 유지하면서 불필요한 부분을 줄이고, 임팩트 있게 다듬어주세요.`,

  humorous: `다음 글을 더 유머러스하고 재치있게 수정해주세요.
웃음 포인트를 자연스럽게 넣되, 결혼식의 격식은 유지해주세요.`,

  grammar: `다음 글의 문법과 맞춤법을 교정해주세요.
자연스러운 문장 흐름도 함께 다듬어주세요. 내용은 최대한 유지합니다.`,
};

// 스토리 타입별 질문 목록
export interface StoryQuestion {
  id: string;
  question: string;
  placeholder: string;
  required?: boolean;
}

export const COUPLE_INTRO_QUESTIONS: StoryQuestion[] = [
  {
    id: "personality_groom",
    question: "신랑은 어떤 사람인가요?",
    placeholder: "예: 유머 감각이 넘치고 따뜻한 사람이에요",
    required: true,
  },
  {
    id: "personality_bride",
    question: "신부는 어떤 사람인가요?",
    placeholder: "예: 섬세하고 배려심이 깊은 사람이에요",
    required: true,
  },
  {
    id: "first_impression",
    question: "서로의 첫인상은 어땠나요?",
    placeholder: "예: 처음엔 무뚝뚝해 보였는데 알고 보니 다정한 사람이었어요",
  },
  {
    id: "charm_point",
    question: "상대방의 가장 좋아하는 점은?",
    placeholder: "예: 힘들 때 항상 곁에 있어주는 점이요",
  },
];

export const OUR_STORY_QUESTIONS: StoryQuestion[] = [
  {
    id: "how_met",
    question: "처음 어떻게 만났나요?",
    placeholder: "예: 대학교 동아리에서 처음 만났어요",
    required: true,
  },
  {
    id: "first_date",
    question: "첫 데이트는 어땠나요?",
    placeholder: "예: 한강에서 치킨 먹으며 밤새 이야기했어요",
  },
  {
    id: "memorable_moment",
    question: "가장 기억에 남는 순간은?",
    placeholder: "예: 비 오는 날 우산 하나로 같이 걸었던 날",
  },
  {
    id: "proposal",
    question: "프로포즈는 어떻게 했나요?",
    placeholder: "예: 첫 데이트 장소에서 깜짝 프로포즈했어요",
    required: true,
  },
  {
    id: "dating_period",
    question: "연애 기간은 얼마나 되었나요?",
    placeholder: "예: 3년 6개월",
  },
];

export const INTERVIEW_QUESTIONS: StoryQuestion[] = [
  {
    id: "why_marriage",
    question: "결혼을 결심한 이유는?",
    placeholder: "예: 이 사람이 아니면 안 될 것 같았어요",
    required: true,
  },
  {
    id: "future_dream",
    question: "함께 이루고 싶은 꿈은?",
    placeholder: "예: 작은 정원이 있는 집에서 강아지와 함께 살고 싶어요",
  },
  {
    id: "message_to_partner",
    question: "상대방에게 하고 싶은 말은?",
    placeholder: "예: 항상 고맙고 사랑해",
    required: true,
  },
  {
    id: "message_to_guests",
    question: "하객분들께 전하고 싶은 말은?",
    placeholder: "예: 저희의 시작을 함께해주셔서 감사합니다",
  },
];

// 스토리 생성 프롬프트 빌더
export function buildStoryPrompt(
  type: "couple_intro" | "our_story" | "interview",
  answers: Record<string, string>,
  groomName: string,
  brideName: string
): string {
  let prompt = `신랑 ${groomName}님과 신부 ${brideName}님의 `;

  switch (type) {
    case "couple_intro":
      prompt += `커플 소개글을 작성해주세요.\n\n`;
      prompt += `신랑 소개와 신부 소개를 각각 2-3문장으로 작성해주세요.\n\n`;
      break;
    case "our_story":
      prompt += `연애 스토리를 작성해주세요.\n\n`;
      prompt += `처음 만남부터 프로포즈까지의 이야기를 3-4개 단락으로 작성해주세요.\n\n`;
      break;
    case "interview":
      prompt += `인터뷰 형식의 글을 작성해주세요.\n\n`;
      prompt += `Q&A 형식으로 3-4개의 질문과 답변을 작성해주세요.\n\n`;
      break;
  }

  prompt += `커플이 제공한 정보:\n`;
  for (const [key, value] of Object.entries(answers)) {
    if (value.trim()) {
      prompt += `- ${key}: ${value}\n`;
    }
  }

  return prompt;
}
