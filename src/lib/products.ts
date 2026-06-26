export type ProductCategory =
  | "laptop"
  | "audio"
  | "home"
  | "wearable"
  | "travel"
  | "beauty";

export type Product = {
  id: string;
  name: string;
  category: ProductCategory;
  categoryLabel: string;
  price: number;
  currency: "CNY";
  rating: number;
  reviews: number;
  stock: number;
  image: string;
  summary: string;
  badges: string[];
  tags: string[];
  specs: {
    fit: string;
    battery?: string;
    material?: string;
    size?: string;
    warranty: string;
  };
};

export type AssistantFilters = {
  query?: string;
  category?: ProductCategory;
  maxPrice?: number;
  minRating?: number;
  tags?: string[];
  intent?: "browse" | "compare" | "order" | "support";
  compareIds?: string[];
  orderId?: string;
};

export type Order = {
  id: string;
  status: string;
  eta: string;
  total: number;
  items: Array<{
    productId: string;
    name: string;
    quantity: number;
  }>;
  timeline: string[];
};

export const products: Product[] = [
  {
    id: "dw-laptop-arc-14",
    name: "ArcBook 14 Air",
    category: "laptop",
    categoryLabel: "轻薄电脑",
    price: 5299,
    currency: "CNY",
    rating: 4.8,
    reviews: 1248,
    stock: 18,
    image:
      "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=80",
    summary: "1.18kg 轻薄机身，适合通勤、学习和轻办公。",
    badges: ["热卖", "通勤"],
    tags: ["commute", "office", "student", "lightweight"],
    specs: {
      fit: "通勤办公 / 学生党",
      battery: "14 小时",
      material: "铝合金",
      size: "14 英寸",
      warranty: "2 年整机保修",
    },
  },
  {
    id: "dw-laptop-pro-16",
    name: "Nebula Pro 16",
    category: "laptop",
    categoryLabel: "性能电脑",
    price: 8999,
    currency: "CNY",
    rating: 4.9,
    reviews: 786,
    stock: 9,
    image:
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=900&q=80",
    summary: "高亮大屏与独显性能，剪辑、建模和游戏都从容。",
    badges: ["高性能", "创作"],
    tags: ["creator", "gaming", "performance", "screen"],
    specs: {
      fit: "创作设计 / 游戏",
      battery: "9 小时",
      material: "镁铝合金",
      size: "16 英寸",
      warranty: "2 年上门保修",
    },
  },
  {
    id: "dw-audio-hush",
    name: "HushWave Pro",
    category: "audio",
    categoryLabel: "降噪耳机",
    price: 1299,
    currency: "CNY",
    rating: 4.7,
    reviews: 2190,
    stock: 42,
    image:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80",
    summary: "主动降噪和通透模式切换顺滑，地铁和办公室都安静。",
    badges: ["降噪", "礼物"],
    tags: ["commute", "audio", "gift", "noise-canceling"],
    specs: {
      fit: "通勤 / 专注办公",
      battery: "38 小时",
      material: "亲肤蛋白皮",
      warranty: "1 年换新",
    },
  },
  {
    id: "dw-home-brew",
    name: "MornCup Mini",
    category: "home",
    categoryLabel: "家用电器",
    price: 699,
    currency: "CNY",
    rating: 4.6,
    reviews: 654,
    stock: 31,
    image:
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80",
    summary: "小户型友好的胶囊咖啡机，3 分钟出杯。",
    badges: ["小户型", "早餐"],
    tags: ["home", "compact", "gift", "morning"],
    specs: {
      fit: "厨房 / 办公室茶水间",
      material: "食品级 ABS",
      size: "18cm x 32cm",
      warranty: "1 年保修",
    },
  },
  {
    id: "dw-wear-loop",
    name: "LoopFit Watch",
    category: "wearable",
    categoryLabel: "智能穿戴",
    price: 1599,
    currency: "CNY",
    rating: 4.8,
    reviews: 1337,
    stock: 25,
    image:
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80",
    summary: "运动、睡眠和压力监测完整，续航一周。",
    badges: ["健康", "运动"],
    tags: ["fitness", "health", "gift", "waterproof"],
    specs: {
      fit: "运动健康 / 礼物",
      battery: "7 天",
      material: "不锈钢 + 氟橡胶",
      size: "42mm",
      warranty: "1 年保修",
    },
  },
  {
    id: "dw-travel-pack",
    name: "CloudPack 28",
    category: "travel",
    categoryLabel: "通勤旅行",
    price: 499,
    currency: "CNY",
    rating: 4.5,
    reviews: 842,
    stock: 57,
    image:
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=80",
    summary: "可扩容背包，电脑仓、防泼水和快取口袋齐全。",
    badges: ["防泼水", "轻旅行"],
    tags: ["travel", "commute", "waterproof", "laptop"],
    specs: {
      fit: "通勤 / 周末短途",
      material: "再生尼龙",
      size: "28L",
      warranty: "3 年质保",
    },
  },
  {
    id: "dw-beauty-veil",
    name: "MoonVeil Eau",
    category: "beauty",
    categoryLabel: "香氛个护",
    price: 899,
    currency: "CNY",
    rating: 4.7,
    reviews: 512,
    stock: 16,
    image:
      "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=900&q=80",
    summary: "木质花香调，留香柔和，适合作为生日礼物。",
    badges: ["礼物", "温柔"],
    tags: ["beauty", "gift", "daily", "premium"],
    specs: {
      fit: "日常通勤 / 生日礼物",
      material: "木质花香调",
      size: "50ml",
      warranty: "正品溯源",
    },
  },
  {
    id: "dw-audio-pod",
    name: "AirDot Lite",
    category: "audio",
    categoryLabel: "真无线耳机",
    price: 399,
    currency: "CNY",
    rating: 4.4,
    reviews: 1754,
    stock: 73,
    image:
      "https://images.unsplash.com/photo-1606400082777-ef05f3c5cde2?auto=format&fit=crop&w=900&q=80",
    summary: "轻巧入耳，低延迟模式，适合预算友好的日常听歌。",
    badges: ["高性价比", "轻巧"],
    tags: ["audio", "budget", "student", "portable"],
    specs: {
      fit: "学生 / 日常通勤",
      battery: "24 小时",
      material: "磨砂 PC",
      warranty: "1 年保修",
    },
  },
];

export const orders: Order[] = [
  {
    id: "DW-1001",
    status: "运输中",
    eta: "2026-06-29 18:00 前",
    total: 1798,
    items: [
      { productId: "dw-audio-hush", name: "HushWave Pro", quantity: 1 },
      { productId: "dw-travel-pack", name: "CloudPack 28", quantity: 1 },
    ],
    timeline: ["已付款", "仓库已打包", "已交给承运商", "正在派往上海分拨中心"],
  },
  {
    id: "DW-2048",
    status: "待发货",
    eta: "2026-06-30 12:00 前",
    total: 5299,
    items: [{ productId: "dw-laptop-arc-14", name: "ArcBook 14 Air", quantity: 1 }],
    timeline: ["已付款", "等待仓库拣货"],
  },
];

export const categoryOptions: Array<{ value: ProductCategory; label: string }> = [
  { value: "laptop", label: "电脑" },
  { value: "audio", label: "音频" },
  { value: "home", label: "家居" },
  { value: "wearable", label: "穿戴" },
  { value: "travel", label: "通勤" },
  { value: "beauty", label: "个护" },
];

export function formatPrice(price: number) {
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
    maximumFractionDigits: 0,
  }).format(price);
}

export function filterProducts(
  catalog: Product[],
  filters: AssistantFilters,
  searchText = "",
) {
  const text = searchText.trim().toLowerCase();
  const tags = new Set((filters.tags ?? []).map((tag) => tag.toLowerCase()));

  return catalog.filter((product) => {
    if (filters.category && product.category !== filters.category) return false;
    if (filters.maxPrice && product.price > filters.maxPrice) return false;
    if (filters.minRating && product.rating < filters.minRating) return false;
    if (tags.size > 0 && !product.tags.some((tag) => tags.has(tag.toLowerCase()))) {
      return false;
    }
    if (!text) return true;

    const haystack = [
      product.name,
      product.categoryLabel,
      product.summary,
      ...product.badges,
      ...product.tags,
      product.specs.fit,
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(text);
  });
}

export function getOrderById(orderId: string) {
  return orders.find((order) => order.id.toLowerCase() === orderId.toLowerCase());
}
