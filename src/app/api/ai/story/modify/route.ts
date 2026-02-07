import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { MODIFICATION_PROMPTS } from "@/lib/openrouter";
import { verifyToken, getAuthCookieName } from "@/lib/auth";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

type ModificationType = "romantic" | "concise" | "humorous" | "grammar" | "custom";

interface ModifyRequest {
  text: string;
  modificationType: ModificationType;
  customInstruction?: string;
}

export async function POST(request: NextRequest) {
  try {
    // 인증 확인
    const cookieName = getAuthCookieName();
    const token = request.cookies.get(cookieName)?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const authPayload = await verifyToken(token);
    if (!authPayload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const body: ModifyRequest = await request.json();
    const { text, modificationType, customInstruction } = body;

    if (!text || !modificationType) {
      return NextResponse.json(
        { error: "필수 정보가 누락되었습니다." },
        { status: 400 }
      );
    }

    let systemPrompt: string;

    if (modificationType === "custom") {
      if (!customInstruction) {
        return NextResponse.json(
          { error: "수정 지시사항을 입력해주세요." },
          { status: 400 }
        );
      }
      systemPrompt = `다음 글을 사용자의 요청에 맞게 수정해주세요.
수정 요청: ${customInstruction}

원본 글의 핵심 내용은 유지하면서 요청에 맞게 다듬어주세요.
결과물만 출력해주세요.`;
    } else {
      systemPrompt = MODIFICATION_PROMPTS[modificationType];
      if (!systemPrompt) {
        return NextResponse.json(
          { error: "유효하지 않은 수정 타입입니다." },
          { status: 400 }
        );
      }
      systemPrompt += "\n\n결과물만 출력해주세요.";
    }

    const message = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 2000,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: text,
        },
      ],
    });

    const textContent = message.content.find((block) => block.type === "text");
    if (!textContent || textContent.type !== "text") {
      throw new Error("AI 응답에서 텍스트를 찾을 수 없습니다.");
    }

    return NextResponse.json({ content: textContent.text });
  } catch (error) {
    console.error("Text modification error:", error);

    if (error instanceof Anthropic.APIError) {
      return NextResponse.json(
        { error: 'AI 서비스 오류가 발생했습니다.' },
        { status: error.status || 500 }
      );
    }

    return NextResponse.json(
      { error: '텍스트 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
