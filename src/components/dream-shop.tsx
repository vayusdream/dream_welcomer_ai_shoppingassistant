"use client";

import {
  ArrowUpRight,
  Bot,
  Heart,
  PackageCheck,
  Search,
  Send,
  ShoppingCart,
  SlidersHorizontal,
  Sparkles,
  Star,
  Trash2,
  X,
  Scale,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  categoryOptions,
  filterProducts,
  formatPrice,
  type AssistantFilters,
  type Order,
  type Product,
  type ProductCategory,
} from "@/lib/products";

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  content: string;
};

type AssistantResponse = {
  reply: string;
  filters: AssistantFilters;
  products: Product[];
  compareProducts: Product[];
  order: Order | null;
  quickReplies: string[];
};

type CartState = Record<string, number>;

const starterMessages: ChatMessage[] = [
  {
    id: "m-1",
    role: "assistant",
    content: "你好，我是 dream_welcomer。告诉我预算、场景和偏好，我会直接筛商品。",
  },
];

function createMessage(role: ChatMessage["role"], content: string): ChatMessage {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    role,
    content,
  };
}

function toStorageSet(value: string | null) {
  if (!value) return new Set<string>();

  try {
    return new Set(JSON.parse(value) as string[]);
  } catch {
    return new Set<string>();
  }
}

function toStorageCart(value: string | null): CartState {
  if (!value) return {};

  try {
    return JSON.parse(value) as CartState;
  } catch {
    return {};
  }
}

export function DreamShop({ initialProducts }: { initialProducts: Product[] }) {
  const [query, setQuery] = useState("");
  const [assistantInput, setAssistantInput] = useState("");
  const [filters, setFilters] = useState<AssistantFilters>({});
  const [messages, setMessages] = useState<ChatMessage[]>(starterMessages);
  const [isThinking, setIsThinking] = useState(false);
  const [cart, setCart] = useState<CartState>({});
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [orderId, setOrderId] = useState("DW-1001");
  const [order, setOrder] = useState<Order | null>(null);
  const [orderError, setOrderError] = useState("");

  useEffect(() => {
    setWishlist(toStorageSet(window.localStorage.getItem("dream_wishlist")));
    setCart(toStorageCart(window.localStorage.getItem("dream_cart")));
  }, []);

  useEffect(() => {
    window.localStorage.setItem("dream_wishlist", JSON.stringify([...wishlist]));
  }, [wishlist]);

  useEffect(() => {
    window.localStorage.setItem("dream_cart", JSON.stringify(cart));
  }, [cart]);

  const visibleProducts = useMemo(
    () => filterProducts(initialProducts, filters, query),
    [filters, initialProducts, query],
  );

  const productsById = useMemo(() => {
    return new Map(initialProducts.map((product) => [product.id, product]));
  }, [initialProducts]);

  const compareProducts = compareIds
    .map((id) => productsById.get(id))
    .filter((product): product is Product => Boolean(product));

  const cartLines = Object.entries(cart)
    .map(([id, quantity]) => {
      const product = productsById.get(id);
      return product ? { product, quantity } : null;
    })
    .filter((line): line is { product: Product; quantity: number } => Boolean(line));

  const cartTotal = cartLines.reduce(
    (total, line) => total + line.product.price * line.quantity,
    0,
  );

  function setCategory(category?: ProductCategory) {
    setFilters((current) => ({
      ...current,
      category,
    }));
  }

  function addToCart(productId: string) {
    setCart((current) => ({
      ...current,
      [productId]: (current[productId] ?? 0) + 1,
    }));
  }

  function removeFromCart(productId: string) {
    setCart((current) => {
      const next = { ...current };
      delete next[productId];
      return next;
    });
  }

  function toggleWishlist(productId: string) {
    setWishlist((current) => {
      const next = new Set(current);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  }

  function toggleCompare(productId: string) {
    setCompareIds((current) => {
      if (current.includes(productId)) {
        return current.filter((id) => id !== productId);
      }
      return [...current.slice(-2), productId];
    });
  }

  function clearFilters() {
    setFilters({});
    setQuery("");
  }

  async function askAssistant(message = assistantInput.trim()) {
    if (!message || isThinking) return;

    setAssistantInput("");
    setIsThinking(true);
    setMessages((current) => [...current, createMessage("user", message)]);

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) throw new Error("assistant failed");

      const data = (await response.json()) as AssistantResponse;
      setFilters(data.filters);

      if (data.compareProducts.length > 1) {
        setCompareIds(data.compareProducts.map((product) => product.id).slice(0, 3));
      }

      if (data.order) {
        setOrder(data.order);
        setOrderError("");
      }

      setMessages((current) => [...current, createMessage("assistant", data.reply)]);
    } catch {
      setMessages((current) => [
        ...current,
        createMessage("assistant", "导购服务暂时没有响应，本地商品列表仍可继续筛选。"),
      ]);
    } finally {
      setIsThinking(false);
    }
  }

  async function lookupOrder() {
    const normalized = orderId.trim();
    if (!normalized) return;

    setOrderError("");
    setOrder(null);

    try {
      const response = await fetch(`/api/orders/${encodeURIComponent(normalized)}`);
      const data = (await response.json()) as { order?: Order; error?: string };

      if (!response.ok || !data.order) {
        setOrderError("没有找到这个订单");
        return;
      }

      setOrder(data.order);
    } catch {
      setOrderError("订单查询暂时不可用");
    }
  }

  return (
    <main className="min-h-screen">
      <header className="border-b border-[var(--line)] bg-[rgba(255,253,248,0.84)]">
        <div className="mx-auto flex max-w-[1480px] flex-col gap-5 px-4 py-5 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
          <div>
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-[8px] bg-[var(--teal)] text-white shadow-sm">
                <Sparkles size={22} aria-hidden="true" />
              </span>
              <div>
                <h1 className="text-2xl font-semibold tracking-normal text-[var(--foreground)]">
                  dream_welcomer
                </h1>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  电商 AI 导购工作台
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-[minmax(220px,360px)_auto]">
            <label className="relative block">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
                size={18}
                aria-hidden="true"
              />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="h-11 w-full rounded-[8px] border border-[var(--line)] bg-white pl-10 pr-3 text-sm outline-none transition focus:border-[var(--teal)] focus:ring-4 focus:ring-[rgba(15,118,110,0.12)]"
                placeholder="搜索商品、场景、标签"
              />
            </label>
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-[8px] border border-[var(--line)] bg-white px-4 text-sm font-medium text-[var(--ink-soft)] transition hover:border-[var(--teal)]"
            >
              <X size={17} aria-hidden="true" />
              清空
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1480px] gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_390px] lg:px-8">
        <section className="min-w-0">
          <div className="mb-5 flex flex-col gap-4 rounded-[8px] border border-[var(--line)] bg-[var(--panel)] p-4 shadow-[var(--shadow)] xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-[8px] bg-[var(--mint)] text-[var(--teal-dark)]">
                <SlidersHorizontal size={19} aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-base font-semibold">商品列表</h2>
                <p className="text-sm text-[var(--muted)]">
                  {visibleProducts.length} / {initialProducts.length} 件商品
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setCategory(undefined)}
                className={`h-9 rounded-[8px] border px-3 text-sm ${
                  !filters.category
                    ? "border-[var(--teal)] bg-[var(--teal)] text-white"
                    : "border-[var(--line)] bg-white text-[var(--ink-soft)]"
                }`}
              >
                全部
              </button>
              {categoryOptions.map((category) => (
                <button
                  key={category.value}
                  type="button"
                  onClick={() => setCategory(category.value)}
                  className={`h-9 rounded-[8px] border px-3 text-sm ${
                    filters.category === category.value
                      ? "border-[var(--teal)] bg-[var(--teal)] text-white"
                      : "border-[var(--line)] bg-white text-[var(--ink-soft)]"
                  }`}
                >
                  {category.label}
                </button>
              ))}
            </div>
          </div>

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
                    className="h-full w-full object-cover transition duration-300 hover:scale-[1.03]"
                    loading="lazy"
                  />
                </div>

                <div className="p-4">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-medium uppercase text-[var(--teal-dark)]">
                        {product.categoryLabel}
                      </p>
                      <h3 className="mt-1 text-lg font-semibold leading-snug">
                        {product.name}
                      </h3>
                    </div>
                    <div className="flex items-center gap-1 whitespace-nowrap text-sm font-medium text-[var(--gold)]">
                      <Star size={15} fill="currentColor" aria-hidden="true" />
                      {product.rating}
                    </div>
                  </div>

                  <p className="min-h-12 text-sm leading-6 text-[var(--muted)]">
                    {product.summary}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {product.badges.map((badge) => (
                      <span
                        key={badge}
                        className="rounded-[8px] bg-[var(--panel-strong)] px-2.5 py-1 text-xs font-medium text-[var(--ink-soft)]"
                      >
                        {badge}
                      </span>
                    ))}
                  </div>

                  <div className="mt-4 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-xl font-semibold">{formatPrice(product.price)}</p>
                      <p className="mt-1 text-xs text-[var(--muted)]">
                        库存 {product.stock} · {product.reviews} 条评价
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        title="加入对比"
                        onClick={() => toggleCompare(product.id)}
                        className={`grid size-10 place-items-center rounded-[8px] border transition ${
                          compareIds.includes(product.id)
                            ? "border-[var(--teal)] bg-[var(--mint)] text-[var(--teal-dark)]"
                            : "border-[var(--line)] bg-white text-[var(--ink-soft)] hover:border-[var(--teal)]"
                        }`}
                      >
                        <Scale size={18} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        title="收藏"
                        onClick={() => toggleWishlist(product.id)}
                        className={`grid size-10 place-items-center rounded-[8px] border transition ${
                          wishlist.has(product.id)
                            ? "border-[var(--coral)] bg-[var(--rose)] text-[var(--coral)]"
                            : "border-[var(--line)] bg-white text-[var(--ink-soft)] hover:border-[var(--coral)]"
                        }`}
                      >
                        <Heart
                          size={18}
                          fill={wishlist.has(product.id) ? "currentColor" : "none"}
                          aria-hidden="true"
                        />
                      </button>
                      <button
                        type="button"
                        title="加入购物车"
                        onClick={() => addToCart(product.id)}
                        className="grid size-10 place-items-center rounded-[8px] border border-[var(--teal)] bg-[var(--teal)] text-white transition hover:bg-[var(--teal-dark)]"
                      >
                        <ShoppingCart size={18} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {visibleProducts.length === 0 ? (
            <div className="mt-4 rounded-[8px] border border-dashed border-[var(--line)] bg-white p-8 text-center text-sm text-[var(--muted)]">
              没有商品命中当前条件
            </div>
          ) : null}

          {compareProducts.length > 0 ? (
            <section className="mt-6 rounded-[8px] border border-[var(--line)] bg-[var(--panel)] p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-[8px] bg-[var(--rose)] text-[var(--coral)]">
                    <Scale size={18} aria-hidden="true" />
                  </span>
                  <h2 className="text-base font-semibold">商品对比</h2>
                </div>
                <button
                  type="button"
                  title="清空对比"
                  onClick={() => setCompareIds([])}
                  className="grid size-10 place-items-center rounded-[8px] border border-[var(--line)] bg-white text-[var(--ink-soft)]"
                >
                  <X size={18} aria-hidden="true" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-[var(--line)] text-left text-[var(--muted)]">
                      <th className="w-28 py-3 font-medium">维度</th>
                      {compareProducts.map((product) => (
                        <th key={product.id} className="py-3 pr-5 font-medium">
                          {product.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="align-top">
                    {[
                      ["价格", (product: Product) => formatPrice(product.price)],
                      ["场景", (product: Product) => product.specs.fit],
                      ["评分", (product: Product) => `${product.rating} / 5`],
                      ["规格", (product: Product) => product.specs.size ?? product.specs.material ?? "-"],
                      ["保修", (product: Product) => product.specs.warranty],
                    ].map(([label, render]) => (
                      <tr key={label as string} className="border-b border-[var(--line)]">
                        <td className="py-3 font-medium text-[var(--ink-soft)]">
                          {label as string}
                        </td>
                        {compareProducts.map((product) => (
                          <td key={product.id} className="py-3 pr-5 text-[var(--muted)]">
                            {(render as (product: Product) => string)(product)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}
        </section>

        <aside className="grid h-fit gap-4 lg:sticky lg:top-6">
          <section className="rounded-[8px] border border-[var(--line)] bg-[var(--panel)] p-4 shadow-[var(--shadow)]">
            <div className="mb-4 flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-[8px] bg-[var(--mint)] text-[var(--teal-dark)]">
                <Bot size={19} aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-base font-semibold">AI 问答导购</h2>
                <p className="text-sm text-[var(--muted)]">自然语言筛选</p>
              </div>
            </div>

            <div className="grid max-h-[360px] gap-3 overflow-y-auto pr-1">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`rounded-[8px] px-3 py-2 text-sm leading-6 ${
                    message.role === "assistant"
                      ? "bg-[var(--panel-strong)] text-[var(--ink-soft)]"
                      : "ml-6 bg-[var(--teal)] text-white"
                  }`}
                >
                  {message.content}
                </div>
              ))}
              {isThinking ? (
                <div className="rounded-[8px] bg-[var(--panel-strong)] px-3 py-2 text-sm text-[var(--muted)]">
                  正在筛选...
                </div>
              ) : null}
            </div>

            <form
              className="mt-4 grid grid-cols-[1fr_44px] gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                void askAssistant();
              }}
            >
              <input
                value={assistantInput}
                onChange={(event) => setAssistantInput(event.target.value)}
                className="h-11 min-w-0 rounded-[8px] border border-[var(--line)] bg-white px-3 text-sm outline-none transition focus:border-[var(--teal)] focus:ring-4 focus:ring-[rgba(15,118,110,0.12)]"
                placeholder="预算 1500，通勤，送礼"
              />
              <button
                type="submit"
                title="发送"
                disabled={isThinking}
                className="grid size-11 place-items-center rounded-[8px] bg-[var(--teal)] text-white transition hover:bg-[var(--teal-dark)]"
              >
                <Send size={18} aria-hidden="true" />
              </button>
            </form>

            <div className="mt-3 flex flex-wrap gap-2">
              {["预算 1500 以内的通勤礼物", "对比 HushWave Pro 和 AirDot Lite", "查订单 DW-1001"].map(
                (item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => void askAssistant(item)}
                    className="rounded-[8px] border border-[var(--line)] bg-white px-3 py-1.5 text-xs text-[var(--ink-soft)] transition hover:border-[var(--teal)]"
                  >
                    {item}
                  </button>
                ),
              )}
            </div>
          </section>

          <section className="rounded-[8px] border border-[var(--line)] bg-[var(--panel)] p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-[8px] bg-[var(--rose)] text-[var(--coral)]">
                  <ShoppingCart size={18} aria-hidden="true" />
                </span>
                <h2 className="text-base font-semibold">购物车</h2>
              </div>
              <span className="font-mono text-sm text-[var(--muted)]">{cartLines.length}</span>
            </div>

            <div className="grid gap-3">
              {cartLines.length === 0 ? (
                <p className="text-sm text-[var(--muted)]">购物车为空</p>
              ) : (
                cartLines.map(({ product, quantity }) => (
                  <div
                    key={product.id}
                    className="grid grid-cols-[1fr_auto] gap-3 border-b border-[var(--line)] pb-3 last:border-b-0 last:pb-0"
                  >
                    <div>
                      <p className="text-sm font-medium">{product.name}</p>
                      <p className="mt-1 text-xs text-[var(--muted)]">
                        {formatPrice(product.price)} x {quantity}
                      </p>
                    </div>
                    <button
                      type="button"
                      title="移除"
                      onClick={() => removeFromCart(product.id)}
                      className="grid size-9 place-items-center rounded-[8px] border border-[var(--line)] bg-white text-[var(--muted)]"
                    >
                      <Trash2 size={16} aria-hidden="true" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-[var(--line)] pt-3">
              <span className="text-sm text-[var(--muted)]">合计</span>
              <span className="text-lg font-semibold">{formatPrice(cartTotal)}</span>
            </div>
          </section>

          <section className="rounded-[8px] border border-[var(--line)] bg-[var(--panel)] p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-[8px] bg-[var(--panel-strong)] text-[var(--coral)]">
                <Heart size={18} aria-hidden="true" />
              </span>
              <h2 className="text-base font-semibold">收藏</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {[...wishlist].length === 0 ? (
                <p className="text-sm text-[var(--muted)]">还没有收藏商品</p>
              ) : (
                [...wishlist].map((id) => {
                  const product = productsById.get(id);
                  if (!product) return null;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => toggleWishlist(id)}
                      className="inline-flex max-w-full items-center gap-2 rounded-[8px] bg-[var(--rose)] px-3 py-2 text-sm text-[var(--coral)]"
                    >
                      <span className="truncate">{product.name}</span>
                      <X size={14} aria-hidden="true" />
                    </button>
                  );
                })
              )}
            </div>
          </section>

          <section className="rounded-[8px] border border-[var(--line)] bg-[var(--panel)] p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-[8px] bg-[var(--mint)] text-[var(--teal-dark)]">
                <PackageCheck size={18} aria-hidden="true" />
              </span>
              <h2 className="text-base font-semibold">订单查询</h2>
            </div>

            <div className="grid grid-cols-[1fr_44px] gap-2">
              <input
                value={orderId}
                onChange={(event) => setOrderId(event.target.value)}
                className="h-11 min-w-0 rounded-[8px] border border-[var(--line)] bg-white px-3 text-sm uppercase outline-none transition focus:border-[var(--teal)] focus:ring-4 focus:ring-[rgba(15,118,110,0.12)]"
              />
              <button
                type="button"
                title="查询订单"
                onClick={() => void lookupOrder()}
                className="grid size-11 place-items-center rounded-[8px] bg-[var(--teal)] text-white transition hover:bg-[var(--teal-dark)]"
              >
                <ArrowUpRight size={18} aria-hidden="true" />
              </button>
            </div>

            {orderError ? (
              <p className="mt-3 text-sm text-[var(--coral)]">{orderError}</p>
            ) : null}

            {order ? (
              <div className="mt-4 border-t border-[var(--line)] pt-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-mono text-sm font-semibold">{order.id}</p>
                  <span className="rounded-[8px] bg-[var(--mint)] px-2.5 py-1 text-xs font-medium text-[var(--teal-dark)]">
                    {order.status}
                  </span>
                </div>
                <p className="mt-2 text-sm text-[var(--muted)]">预计 {order.eta}</p>
                <p className="mt-1 text-sm font-medium">{formatPrice(order.total)}</p>
                <ol className="mt-3 grid gap-2 text-sm text-[var(--muted)]">
                  {order.timeline.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-[var(--teal)]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}
          </section>
        </aside>
      </div>
    </main>
  );
}
