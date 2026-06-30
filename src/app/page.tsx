"use client";

import { useEffect, useMemo, useState } from "react";
import type * as React from "react";
import {
  formatPrice,
  type AssistantFilters,
  type Order,
  type Product,
} from "@/lib/products";

interface ProductsResponse {
  products: Product[];
}

interface AssistantResponse {
  reply: string;
  filters: AssistantFilters;
  products: Product[];
  compareProducts: Product[];
  order: Order | null;
  quickReplies: string[];
}

type ProductsStatus = "loading" | "ready" | "error";
type AssistantStatus = "idle" | "submitting";

const STARTER_PROMPTS: string[] = [
  "预算 1500 以内，适合通勤的礼物",
  "帮我找轻薄办公电脑，预算 6000",
  "推荐一款降噪耳机",
];

function describeFilters(filters: AssistantFilters): string[] {
  const items: string[] = [];

  if (filters.category) items.push(`分类：${filters.category}`);
  if (filters.maxPrice) items.push(`预算：≤ ${formatPrice(filters.maxPrice)}`);
  if (filters.minRating) items.push(`评分：≥ ${filters.minRating}`);
  if (filters.intent) items.push(`意图：${filters.intent}`);
  if (filters.tags?.length) items.push(`标签：${filters.tags.join(" / ")}`);

  return items;
}

export default function Home() {
  const [productsStatus, setProductsStatus] = useState<ProductsStatus>("loading");
  const [assistantStatus, setAssistantStatus] = useState<AssistantStatus>("idle");
  const [prompt, setPrompt] = useState<string>("");
  const [products, setProducts] = useState<Product[]>([]);
  const [assistantResult, setAssistantResult] = useState<AssistantResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    let isActive = true;

    async function loadProducts(): Promise<void> {
      setProductsStatus("loading");

      try {
        const response = await fetch("/api/products");
        const data = (await response.json()) as ProductsResponse;

        if (!response.ok) {
          throw new Error("products request failed");
        }

        if (isActive) {
          setProducts(data.products);
          setProductsStatus("ready");
        }
      } catch {
        if (isActive) {
          setProductsStatus("error");
          setErrorMessage("商品列表暂时不可用，请稍后再试。");
        }
      }
    }

    void loadProducts();

    return () => {
      isActive = false;
    };
  }, []);

  const visibleProducts = useMemo<Product[]>(() => {
    if (assistantResult?.products.length) return assistantResult.products;
    return products;
  }, [assistantResult, products]);

  const filterSummary = useMemo<string[]>(() => {
    return assistantResult ? describeFilters(assistantResult.filters) : [];
  }, [assistantResult]);

  async function submitPrompt(message: string): Promise<void> {
    const normalized = message.trim();
    if (!normalized || assistantStatus === "submitting") return;

    setAssistantStatus("submitting");
    setErrorMessage("");

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: normalized }),
      });
      const data = (await response.json()) as AssistantResponse;

      if (!response.ok) {
        throw new Error("assistant request failed");
      }

      setAssistantResult(data);
      setPrompt("");
    } catch {
      setErrorMessage("AI 导购暂时没有响应，可以先查看当前商品列表。");
    } finally {
      setAssistantStatus("idle");
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    void submitPrompt(prompt);
  }

  function handlePromptChange(e: React.ChangeEvent<HTMLTextAreaElement>): void {
    setPrompt(e.currentTarget.value);
  }

  function handleStarterClick(
    e: React.MouseEvent<HTMLButtonElement>,
    starterPrompt: string,
  ): void {
    e.preventDefault();
    void submitPrompt(starterPrompt);
  }

  return (
    <main className="mx-auto grid max-w-[1480px] gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(340px,420px)_1fr] lg:px-8">
      <section className="h-fit rounded-[8px] border border-[var(--line)] bg-[var(--panel)] p-5 shadow-[var(--shadow)] lg:sticky lg:top-6">
        <div>
          <p className="text-sm font-medium text-[var(--teal-dark)]">MVP AI 导购</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-normal text-[var(--foreground)]">
            用一句话筛出合适商品
          </h1>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            输入预算、场景或偏好，页面会调用 AI 导购接口并展示推荐结果。
          </p>
        </div>

        <form className="mt-5 grid gap-3" onSubmit={handleSubmit}>
          <label htmlFor="shopping-prompt" className="text-sm font-medium text-[var(--ink-soft)]">
            购物需求
          </label>
          <textarea
            id="shopping-prompt"
            value={prompt}
            onChange={handlePromptChange}
            className="min-h-28 resize-none rounded-[8px] border border-[var(--line)] bg-white px-3 py-3 text-sm leading-6 outline-none transition focus:border-[var(--teal)] focus:ring-4 focus:ring-[rgba(15,118,110,0.12)]"
            placeholder="例如：预算 1500 以内，适合通勤、送礼，优先降噪耳机"
          />
          <button
            type="submit"
            disabled={assistantStatus === "submitting" || !prompt.trim()}
            className="h-11 rounded-[8px] bg-[var(--teal)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--teal-dark)] disabled:hover:bg-[var(--teal)]"
          >
            {assistantStatus === "submitting" ? "正在筛选..." : "开始导购"}
          </button>
        </form>

        <div className="mt-4 flex flex-wrap gap-2">
          {STARTER_PROMPTS.map((starterPrompt) => (
            <button
              key={starterPrompt}
              type="button"
              onClick={(e: React.MouseEvent<HTMLButtonElement>) =>
                handleStarterClick(e, starterPrompt)
              }
              className="rounded-[8px] border border-[var(--line)] bg-white px-3 py-2 text-xs text-[var(--ink-soft)] transition hover:border-[var(--teal)]"
            >
              {starterPrompt}
            </button>
          ))}
        </div>

        <div className="mt-5 rounded-[8px] border border-[var(--line)] bg-white p-4">
          <p className="text-sm font-medium text-[var(--ink-soft)]">当前状态</p>
          <div className="mt-3 grid gap-2 text-sm text-[var(--muted)]">
            <p>商品数据：{productsStatus === "loading" ? "加载中" : `${products.length} 件`}</p>
            <p>推荐结果：{assistantResult ? `${visibleProducts.length} 件` : "等待输入"}</p>
          </div>
        </div>

        {errorMessage ? (
          <p className="mt-4 rounded-[8px] border border-[var(--coral)] bg-[var(--rose)] px-3 py-2 text-sm text-[var(--coral)]">
            {errorMessage}
          </p>
        ) : null}
      </section>

      <section className="min-w-0">
        <div className="mb-5 rounded-[8px] border border-[var(--line)] bg-[var(--panel)] p-5 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm font-medium text-[var(--teal-dark)]">AI 回复</p>
              <h2 className="mt-1 text-xl font-semibold tracking-normal">
                {assistantResult ? "已生成推荐" : "等待你的第一条需求"}
              </h2>
            </div>
            <span className="w-fit rounded-[8px] bg-[var(--mint)] px-3 py-1 text-sm font-medium text-[var(--teal-dark)]">
              {visibleProducts.length} 件商品
            </span>
          </div>

          <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
            {assistantResult?.reply ??
              "当前展示基础商品池。提交需求后，这里会显示导购回复、提取到的筛选条件和推荐商品。"}
          </p>

          {filterSummary.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {filterSummary.map((item) => (
                <span
                  key={item}
                  className="rounded-[8px] border border-[var(--line)] bg-white px-3 py-1.5 text-xs font-medium text-[var(--ink-soft)]"
                >
                  {item}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        {productsStatus === "loading" ? (
          <div className="rounded-[8px] border border-dashed border-[var(--line)] bg-white p-8 text-center text-sm text-[var(--muted)]">
            正在加载商品数据...
          </div>
        ) : null}

        {productsStatus !== "loading" && visibleProducts.length === 0 ? (
          <div className="rounded-[8px] border border-dashed border-[var(--line)] bg-white p-8 text-center text-sm text-[var(--muted)]">
            暂无匹配商品
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visibleProducts.map((product) => (
            <article
              key={product.id}
              className="overflow-hidden rounded-[8px] border border-[var(--line)] bg-[var(--panel)] shadow-sm"
            >
              <div className="aspect-[4/3] overflow-hidden bg-[var(--panel-strong)]">
                <img
                  src={product.image}
                  alt={product.name}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium text-[var(--teal-dark)]">
                      {product.categoryLabel}
                    </p>
                    <h3 className="mt-1 text-lg font-semibold leading-snug">
                      {product.name}
                    </h3>
                  </div>
                  <span className="font-mono text-sm font-semibold text-[var(--gold)]">
                    {product.rating}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                  {product.summary}
                </p>
                <div className="mt-4 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold">{formatPrice(product.price)}</p>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      库存 {product.stock} · {product.reviews} 条评价
                    </p>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
