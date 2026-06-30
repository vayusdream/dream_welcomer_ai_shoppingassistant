import { answerShoppingQuestion } from "@/lib/assistant";
import { getCatalogProducts } from "@/lib/db";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    message?: string;
  } | null;

  if (!body?.message?.trim()) {
    return Response.json({ error: "message is required" }, { status: 400 });
  }

  const catalog = await getCatalogProducts();
  const result = await answerShoppingQuestion(body.message.trim(), catalog);
  return Response.json(result);
}
