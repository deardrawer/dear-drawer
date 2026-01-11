import { NextRequest, NextResponse } from "next/server";
import { callOpenRouter, MODIFICATION_PROMPTS } from "@/lib/openrouter";

export const runtime = "edge";

type ModificationType = "romantic" | "concise" | "humorous" | "grammar" | "custom";

interface ModifyRequest {
  text: string;
  modificationType: ModificationType;
  customInstruction?: string;
}

export async function POST(request: NextRequest) {
  try {
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

    const content = await callOpenRouter([
      { role: "system", content: systemPrompt },
      { role: "user", content: text },
    ]);

    return NextResponse.json({ content });
  } catch (error) {
    console.error("Text modification error:", error);
    return NextResponse.json(
      { error: "텍스트 수정 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
