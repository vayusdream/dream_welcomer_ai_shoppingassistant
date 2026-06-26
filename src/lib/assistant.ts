import { z } from "zod";
import {
  filterProducts,
  getOrderById,
  products,
  type AssistantFilters,
  type Product,
  type ProductCategory,
} from "./products";

export const AssistantFilterSchema = z.object({
  query: z.string().optional(),
  category: z
    .enum(["laptop", "audio", "home", "wearable", "travel", "beauty"])
    .optional(),
  maxPrice: z.number().int().positive().optional(),
  minRating: z.number().min(0).max(5).optional(),
  tags: z.array(z.string()).optional(),
  intent: z.enum(["browse", "compare", "order", "support"]).optional(),
  compareIds: z.array(z.string()).optional(),
  orderId: z.string().optional(),
});

type AssistantResult = {
  reply: string;
  filters: AssistantFilters;
  products: Product[];
  compareProducts: Product[];
  order: ReturnType<typeof getOrderById> | null;
  quickReplies: string[];
};

const categoryKeywords: Array<[ProductCategory, string[]]> = [
  ["laptop", ["电脑", "笔记本", "laptop", "办公本", "游戏本", "剪辑", "建模"]],
  ["audio", ["耳机", "降噪", "音频", "听歌", "headphone", "earbud"]],
  ["home", ["咖啡", "家用", "厨房", "小家电", "home"]],
  ["wearable", ["手表", "运动", "健康", "穿戴", "watch"]],
  ["travel", ["背包", "旅行", "通勤包", "出差", "travel", "包"]],
  ["beauty", ["香水", "香氛", "礼物", "个护", "beauty"]],
];

const tagKeywords: Array<[string, string[]]> = [
  ["commute", ["通勤", "地铁", "上班", "commute"]],
  ["gift", ["礼物", "生日", "送人", "女友", "男友", "gift"]],
  ["budget", ["便宜", "预算", "性价比", "学生", "入门"]],
  ["performance", ["性能", "高配", "游戏", "渲染", "剪辑"]],
  ["lightweight", ["轻", "便携", "随身"]],
  ["waterproof", ["防水", "防泼水", "雨天"]],
  ["office", ["办公", "会议", "效率"]],
  ["fitness", ["运动", "健身", "跑步"]],
];

function findCategory(message: string): ProductCategory | undefined {
  const lower = message.toLowerCase();
  return categoryKeywords.find(([, keywords]) =>
    keywords.some((keyword) => lower.includes(keyword.toLowerCase())),
  )?.[0];
}

function findMaxPrice(message: string) {
  const match = message.match(/(?:预算|不超过|低于|少于|under|below)?\s*([1-9]\d{2,5})\s*(?:元|块|以内|以下|左右)?/i);
  if (!match) return undefined;

  const value = Number(match[1]);
  return Number.isFinite(value) ? value : undefined;
}

function findTags(message: string) {
  const lower = message.toLowerCase();
  return tagKeywords
    .filter(([, keywords]) => keywords.some((keyword) => lower.includes(keyword.toLowerCase())))
    .map(([tag]) => tag);
}

function findProductsByName(message: string) {
  const lower = message.toLowerCase();
  return products.filter((product) => lower.includes(product.name.toLowerCase()));
}

function parseRuleBased(message: string): AssistantFilters {
  const category = findCategory(message);
  const maxPrice = findMaxPrice(message);
  const tags = findTags(message);
  const namedProducts = findProductsByName(message);
  const orderId = message.match(/DW-\d{4}/i)?.[0]?.toUpperCase();
  const wantsCompare = /对比|比较|compare|差别|区别/i.test(message);
  const wantsOrder = /订单|物流|快递|发货|order/i.test(message);

  return AssistantFilterSchema.parse({
    query: message,
    category,
    maxPrice,
    minRating: /高评分|口碑|好评|rating/i.test(message) ? 4.6 : undefined,
    tags: tags.length > 0 ? tags : undefined,
    intent: wantsOrder ? "order" : wantsCompare ? "compare" : "browse",
    compareIds: namedProducts.map((product) => product.id),
    orderId,
  });
}

async function parseWithLangChain(message: string) {
  if (!process.env.OPENAI_API_KEY) return null;

  try {
    const langchainPackage = "@langchain/openai";
    const { ChatOpenAI } = (await import(langchainPackage)) as {
      ChatOpenAI: new (options: { model: string; temperature: number }) => {
        withStructuredOutput: (
          schema: typeof AssistantFilterSchema,
          options: { name: string },
        ) => {
          invoke: (messages: Array<[string, string]>) => Promise<AssistantFilters>;
        };
      };
    };

    const model = new ChatOpenAI({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      temperature: 0,
    });

    const structuredModel = model.withStructuredOutput(AssistantFilterSchema, {
      name: "dream_welcomer_filter",
    });

    return await structuredModel.invoke([
      [
        "system",
        "Extract e-commerce shopping filters from the user's Chinese or English message. Use only the known categories and product IDs when clear.",
      ],
      ["human", message],
    ]);
  } catch {
    return null;
  }
}

function mergeFilters(ruleBased: AssistantFilters, aiFilters: AssistantFilters | null) {
  if (!aiFilters) return ruleBased;

  return AssistantFilterSchema.parse({
    ...ruleBased,
    ...aiFilters,
    tags: [...new Set([...(ruleBased.tags ?? []), ...(aiFilters.tags ?? [])])],
    compareIds:
      aiFilters.compareIds && aiFilters.compareIds.length > 0
        ? aiFilters.compareIds
        : ruleBased.compareIds,
    orderId: aiFilters.orderId ?? ruleBased.orderId,
  });
}

function buildReply(filters: AssistantFilters, matchedProducts: Product[], compareProducts: Product[]) {
  if (filters.intent === "order" && filters.orderId) {
    const order = getOrderById(filters.orderId);
    if (order) {
      return `查到订单 ${order.id}：当前状态是${order.status}，预计 ${order.eta}。`;
    }
    return `没有找到订单 ${filters.orderId}，可以试试 DW-1001 或 DW-2048。`;
  }

  if (filters.intent === "compare" && compareProducts.length > 1) {
    const names = compareProducts.map((product) => product.name).join("、");
    return `${names} 都可以加入对比。重点看价格、适用场景、续航/规格和保修：我已经把它们放进对比栏。`;
  }

  if (matchedProducts.length === 0) {
    return "这组条件暂时没有命中商品。我建议放宽预算或去掉一个场景词，再重新筛选。";
  }

  const top = matchedProducts.slice(0, 3);
  const topNames = top.map((product) => product.name).join("、");
  const priceNote = filters.maxPrice ? `预算 ${filters.maxPrice} 元以内，` : "";
  return `${priceNote}我会优先看 ${topNames}。第一件更稳妥的是 ${top[0].name}：${top[0].summary}`;
}

export async function answerShoppingQuestion(message: string): Promise<AssistantResult> {
  const ruleBased = parseRuleBased(message);
  const aiFilters = await parseWithLangChain(message);
  const filters = mergeFilters(ruleBased, aiFilters);
  const matchedProducts = filterProducts(products, filters);
  const compareProducts =
    filters.compareIds && filters.compareIds.length > 0
      ? products.filter((product) => filters.compareIds?.includes(product.id))
      : matchedProducts.slice(0, 3);
  const order = filters.orderId ? getOrderById(filters.orderId) ?? null : null;

  return {
    reply: buildReply(filters, matchedProducts, compareProducts),
    filters,
    products: matchedProducts,
    compareProducts,
    order,
    quickReplies: [
      "预算 1500 以内的通勤礼物",
      "对比 HushWave Pro 和 AirDot Lite",
      "查订单 DW-1001",
    ],
  };
}
