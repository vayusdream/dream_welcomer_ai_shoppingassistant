import { answerShoppingQuestion } from "@/lib/assistant";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    message?: string;
  } | null;

  if (!body?.message?.trim()) {
    return Response.json({ error: "message is required" }, { status: 400 });
  }

  const result = await answerShoppingQuestion(body.message.trim());
  return Response.json(result);
}
