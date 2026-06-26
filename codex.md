@AGENTS.md
project: dream_welcomer
version: 1.0.0-MVP
status: in-progress
lastUpdated: 2026-06-26
---

# Dream_Welcomer Codex

> **AI 驱动的电商导购平台** — 通过自然语言对话和智能筛选，帮助用户快速发现满足需求的商品。

## 目录

- [项目概述](#项目概述)
- [技术栈](#技术栈)
- [架构设计](#架构设计)
- [核心模块](#核心模块)
- [开发路线图](#开发路线图)
- [文件结构](#文件结构)
- [关键设计决策](#关键设计决策)
- [开发规范](#开发规范)

---

## 项目概述

### 目标
构建一个 MVP 级电商 AI 导购平台，通过以下核心能力简化用户购物体验：
- **AI 对话导购** — 多轮智能对话，理解用户需求（预算、场景、偏好）
- **自然语言筛选** — 将日常语言转化为多维商品筛选条件
- **智能推荐** — 基于对话上下文和行为的商品推荐
- **购物工具集** — 购物车、收藏、对比、订单查询

### 核心价值
减少用户决策时间，提升购物效率和满意度。

### 当前阶段
**MVP 完善** — 基础框架已完成，重点优化 AI 体验、UI/UX 和筛选维度。

---

## 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| **框架** | Next.js | 15.5.9 |
| **UI 框架** | React | 19.2.3 |
| **语言** | TypeScript | 5.9.3 |
| **样式** | Tailwind CSS | 4.1.18 |
| **AI/NLP** | LangChain + OpenAI | @langchain/core@1.2.0, @langchain/openai@1.5.1 |
| **数据验证** | Zod | 3.25.76 |
| **数据库** | PostgreSQL | 通过 pg@8.22.0 |
| **包管理** | pnpm | 9.15.9 |
| **图标库** | Lucide React | 0.577.0 |

### 关键依赖说明
- **LangChain**：用于结构化 AI 输出、多轮对话管理、自然语言理解
- **Zod**：运行时类型验证，确保 API 请求/响应结构安全
- **Next.js Server Components**：数据库操作（如 `getCatalogProducts()`）在服务端执行，减少客户端 bundle

---

## 架构设计

### 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                    Client (React 19)                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ DreamShop Component                                  │   │
│  │ - Chat Interface (AI 对话)                          │   │
│  │ - Product List & Filters (商品列表与筛选)          │   │
│  │ - Cart, Wishlist, Compare (购物工具)               │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                           ↓ HTTP
┌─────────────────────────────────────────────────────────────┐
│                Server (Next.js App Router)                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ API Routes (/api)                                    │   │
│  │ - POST /api/assistant/route.ts (AI 对话)           │   │
│  │ - GET /api/products/route.ts (商品列表)            │   │
│  │ - GET /api/orders/[orderId]/route.ts (订单查询)   │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Business Logic (lib/)                                │   │
│  │ - assistant.ts (AI 对话逻辑)                       │   │
│  │ - products.ts (商品数据与筛选)                      │   │
│  │ - db.ts (数据库操作)                                │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│               Data Layer (PostgreSQL / Mock)                 │
│ - Products Catalog (商品表)                                 │
│ - Orders (订单表)                                           │
│ - User Cart & Wishlist (localStorage)                       │
└─────────────────────────────────────────────────────────────┘
                           ↓
                   External APIs
                   - OpenAI GPT-4o
```

### 数据流

#### 1. AI 对话流
```
用户输入 → /api/assistant (POST)
    ↓
assistant.ts: answerShoppingQuestion()
    ├─ 自然语言理解 (NLU)
    │   ├─ 关键词匹配 → intent, category, tags
    │   └─ LangChain 结构化输出 → AssistantFilters
    ├─ 产品筛选 → filterProducts()
    ├─ 多轮对话上下文管理 (Phase 1)
    └─ 生成回复
    ↓
返回 { reply, filters, products, compareProducts, order, quickReplies }
    ↓
前端展示结果
```

#### 2. 商品筛选流
```
用户筛选 / AI 提取
    ↓
filters: { category?, maxPrice?, minRating?, tags?, colors?, brands? }
    ↓
filterProducts(catalog, filters, searchText)
    ↓
返回匹配的商品数组
    ↓
前端渲染、分页、排序
```

#### 3. 购物车与收藏流
```
用户操作 (添加/移除)
    ↓
localStorage 更新
    ↓
React state 同步
    ↓
UI 反馈 (Badge, Toast)
```

---

## 核心模块

### 1. **AI 对话模块** (`src/lib/assistant.ts`)

#### 职责
- 多轮对话管理（记住用户上下文）
- 自然语言理解（NLU）→ 转换为商品筛选条件
- 与 OpenAI LangChain 集成
- 返回结构化响应

#### 关键函数

**`answerShoppingQuestion(message: string, conversationHistory?: ChatMessage[]): Promise<AssistantResult>`**
- 输入：用户消息 + 对话历史（可选）
- 处理流程：
  1. 调用 `extractFilters()` 解析自然语言 → `AssistantFilters`
  2. 调用 `filterProducts()` 获取匹配商品
  3. 生成 AI 回复
  4. 返回 `{ reply, filters, products, compareProducts, order, quickReplies }`
- 输出：结构化响应

**`extractFilters(message: string): AssistantFilters`**（Phase 1 改进）
- 当前：关键词匹配 + Zod Schema
- 目标：LangChain + StructuredOutputParser，支持更复杂场景

**`ConversationMemory` 类**（Phase 1 新增）
- 存储对话历史
- 追踪前一次的筛选状态
- 支持上下文补全（如"太贵了" → 自动调低价格范围）

#### 数据结构

```typescript
type AssistantFilters = {
  query?: string;
  category?: ProductCategory;
  maxPrice?: number;
  minRating?: number;
  tags?: string[];
  intent?: "browse" | "compare" | "order" | "support";
  compareIds?: string[];
  orderId?: string;
  // Phase 3 扩展
  colors?: string[];
  brands?: string[];
  inStockOnly?: boolean;
  ratingRange?: [number, number];
};

type AssistantResult = {
  reply: string;
  filters: AssistantFilters;
  products: Product[];
  compareProducts: Product[];
  order: Order | null;
  quickReplies: string[];
};
```

---

### 2. **商品数据模块** (`src/lib/products.ts`)

#### 职责
- 定义商品和筛选数据结构
- 实现多维度商品筛选
- 提供商品分类和标签映射

#### 关键类型

**`Product` 类型**
```typescript
type Product = {
  id: string;                          // 唯一标识
  name: string;                        // 商品名
  category: ProductCategory;           // 分类（laptop/audio/home/wearable/travel/beauty）
  categoryLabel: string;               // 分类标签（中文）
  price: number;                       // 价格（CNY）
  rating: number;                      // 评分（0-5）
  reviews: number;                     // 评价数
  stock: number;                       // 库存
  image: string;                       // 图片 URL
  summary: string;                     // 简介
  badges: string[];                    // 标签（热卖、通勤、礼物）
  tags: string[];                      // 系统标签（用于筛选）
  specs: {                             // 规格
    fit: string;                       // 使用场景/适用人群
    battery?: string;                  // 续航
    material?: string;                 // 材质
    size?: string;                     // 尺寸
    warranty: string;                  // 保修
  };
  // Phase 3 扩展
  colors?: string[];                   // 颜色选项
  brand?: string;                      // 品牌
  shipping?: { days: number; cost: number }; // 物流信息
};
```

**`ProductCategory` 枚举**
- `laptop` — 电脑
- `audio` — 音频（耳机）
- `home` — 家用电器
- `wearable` — 智能穿戴
- `travel` — 通勤旅行
- `beauty` — 香氛个护

#### 关键函数

**`filterProducts(catalog: Product[], filters: AssistantFilters, searchText?: string): Product[]`**
- 多维度过滤商品
- 支持：分类、价格范围、评分、标签、颜色、品牌、库存状态
- 返回：符合条件的商品数组（已排序）

**`getOrderById(orderId: string): Order | null`**
- 查询订单详情（当前 mock 实现）

---

### 3. **前端主组件** (`src/components/dream-shop.tsx`)

#### 职责
- 统一的用户界面容器
- AI 对话展示与输入
- 商品列表展示
- 购物工具（购物车、收藏、对比、订单查询）

#### 主要状态管理
```typescript
type AppState = {
  query: string;                    // 搜索框内容
  assistantInput: string;           // AI 对话输入框
  filters: AssistantFilters;        // 当前筛选条件
  messages: ChatMessage[];          // 对话历史
  cart: CartState;                  // 购物车 { productId: quantity }
  wishlist: Set<string>;            // 收藏列表
  compareIds: string[];             // 对比中的商品 ID
  orderId: string;                  // 订单 ID（查询）
  order: Order | null;              // 查询到的订单
};
```

#### 关键功能

| 功能 | 实现位置 | 状态 |
|------|---------|------|
| AI 对话 | 聊天气泡区域 | ✅ 基础完成，Phase 1 优化 |
| 商品列表 | 右侧网格 | ✅ 完成 |
| 筛选器 | 顶部/侧边 | ⚠️ Phase 2 UI 优化 |
| 购物车 | Modal | ✅ 完成 |
| 收藏 | Heart Icon + 列表 | ✅ 完成 |
| 商品对比 | Table Modal | ⚠️ Phase 3 扩展 |
| 订单查询 | Accordion | ✅ 基础完成 |

#### Phase 1-3 改进计划

**Phase 1: AI 交互增强**
- [ ] 消息加载动画
- [ ] 快速回复按钮点击反馈
- [ ] 对话自动滚动

**Phase 2: UI/UX 打磨**
- [ ] 消息分离成独立组件 `<ChatMessage />`
- [ ] 商品卡片分离成组件 `<ProductCard />`
- [ ] 筛选器改为 Drawer（移动端友好）
- [ ] 购物车/收藏添加 Toast 通知
- [ ] 响应式布局完善

**Phase 3: 功能扩展**
- [ ] 对比表格完善（sticky header、导出）
- [ ] 颜色/品牌筛选 UI
- [ ] 排序功能（价格、评分、热度）

---

### 4. **数据库模块** (`src/lib/db.ts`)

#### 职责
- 数据库连接管理
- 商品目录查询

#### 当前实现
```typescript
export async function getCatalogProducts(): Promise<Product[]>
```
- 优先级：PostgreSQL (若配置了 `DATABASE_URL`)
- 降级方案：mock 数据

#### Future
- 支持分页、排序、搜索
- 缓存策略（Redis 或内存）

---

### 5. **API 路由**

#### `/api/assistant` (POST)
**请求**
```json
{
  "message": "我要找一个轻薄的商务电脑，预算 5000 块"
}
```

**响应**
```json
{
  "reply": "为您推荐 3 款轻薄高性能商务本...",
  "filters": {
    "category": "laptop",
    "maxPrice": 5000,
    "tags": ["commute", "office"]
  },
  "products": [...],
  "compareProducts": [],
  "order": null,
  "quickReplies": ["加入购物车", "对比其他", "查看评价"]
}
```

#### `/api/products` (GET)
**查询参数**
```
?category=laptop&maxPrice=6000&minRating=4.5&tags=commute,office
```

**响应**
```json
[
  { id: "...", name: "...", ... },
  ...
]
```

#### `/api/orders/[orderId]` (GET)
**响应**
```json
{
  "id": "DW-1001",
  "status": "运输中",
  "eta": "2026-06-29 18:00 前",
  "total": 1798,
  "items": [...],
  "timeline": [...]
}
```

---

## 开发路线图

### Phase 1: AI 对话体验增强（核心）
**目标**：多轮对话、高准确度的自然语言理解  
**预计**：4-6 小时

#### 1.1 多轮对话上下文
- [ ] 实现 `ConversationMemory` 类
- [ ] 存储对话历史（最近 10 轮）
- [ ] 支持上下文补全（"太贵了" → 自动降低 maxPrice）
- [ ] 测试场景：3+ 轮对话准确度验证

#### 1.2 LangChain 集成与结构化输出
- [ ] 使用 `ChatOpenAI` + `StructuredOutputParser`
- [ ] 定义 `AssistantResponseSchema` (Zod)
- [ ] 确保 JSON 返回一致
- [ ] 处理模型拒绝、超时边界情况

#### 1.3 自然语言理解增强
- [ ] 扩展关键词映射表（category, tags, intent）
- [ ] 实现模糊匹配（Jaccard 相似度/编辑距离）
- [ ] 添加 `intentResolver()` 智能识别意图
- [ ] 测试场景：5+ 种表述方式识别准确度

#### 1.4 API 层完善
- [ ] 输入验证与参数检查
- [ ] 错误处理（400/500/timeout）
- [ ] 可选：流式 SSE 响应
- [ ] Rate Limiting（防滥用）

**验证**
- [ ] 3+ 轮对话自动追踪上下文
- [ ] 100+ 测试用例准确度 > 90%
- [ ] 边界输入无异常

---

### Phase 2: UI/UX 优化与交互增强（中等）
**目标**：美观、流畅、响应式的用户界面  
**预计**：3-4 小时  
**依赖**：可与 Phase 1 并行

#### 2.1 聊天界面增强
- [ ] 消息加载动画（thinking 状态）
- [ ] 自动滚动到最新消息
- [ ] 快速回复按钮交互反馈

#### 2.2 组件拆分与独立化
- [ ] 提取 `<ProductCard />` 组件
- [ ] 提取 `<ChatMessage />` 组件
- [ ] 提取 `<FilterPanel />` 组件

#### 2.3 筛选器 UI 改进
- [ ] 改为 Drawer/Modal（移动端友好）
- [ ] 实时筛选反馈（已选标签展示）
- [ ] 清除筛选快捷方式

#### 2.4 购物工具交互优化
- [ ] 购物车添加/移除 → Toast 通知
- [ ] 收藏按钮 Heart 动画
- [ ] 商品数量 Badge 更新动画

#### 2.5 移动端适配
- [ ] Tailwind 响应式布局（md 断点）
- [ ] 按钮 ≥ 44px 大小
- [ ] 无横向滚动
- [ ] Touch 友好交互

#### 2.6 深色模式支持（可选）
- [ ] Tailwind `dark:` 前缀
- [ ] localStorage 记录用户偏好

**验证**
- [ ] 桌面端 (1920x1080) 美观
- [ ] 移动端 (375x667) 完整布局
- [ ] Slow 3G 网络下图片加载正常
- [ ] WCAG AA 对比度符合

---

### Phase 3: 商品筛选维度扩展（中等）
**目标**：多维商品筛选，提升发现体验  
**预计**：2-3 小时  
**依赖**：Phase 1（需要更好的 NLU）

#### 3.1 商品数据结构扩展
- [ ] 添加字段：`colors`, `brand`, `shipping`, `ratingRange`
- [ ] 更新 Product 类型定义
- [ ] 扩展 mock 数据集

#### 3.2 多维筛选逻辑
- [ ] `filterProducts()` 支持颜色筛选
- [ ] `filterProducts()` 支持品牌筛选
- [ ] `filterProducts()` 支持库存状态
- [ ] `filterProducts()` 支持评分段筛选

#### 3.3 自然语言→多维筛选
- [ ] 颜色关键词映射（"黑色" → black）
- [ ] 品牌关键词映射（"苹果" → Apple）
- [ ] 扩展 `AssistantFilterSchema`

#### 3.4 商品对比功能完善
- [ ] 对比表格完整展示 specs
- [ ] 表头 sticky（滚动时固定）
- [ ] 对比导出（CSV/PDF）可选

**验证**
- [ ] 5+ 新筛选维度全覆盖
- [ ] 自然语言识别准确度 > 85%
- [ ] 对比表格完整、可用

---

### Phase 4: 测试与文档完善（收尾）
**目标**：高质量 MVP，完整文档  
**预计**：1-2 小时  
**依赖**：Phases 1-3

#### 4.1 自动化测试
- [ ] API 端点单元测试（Jest/Vitest）
- [ ] 自然语言理解单元测试
- [ ] 端到端测试关键流程

#### 4.2 性能优化
- [ ] `React.memo` 优化组件重渲染
- [ ] 动态导入重操作（Code Splitting）
- [ ] Next.js Image 组件图片优化

#### 4.3 文档更新
- [ ] README 补充功能说明
- [ ] API 文档完善
- [ ] 环境变量配置指南
- [ ] 快速开始示例

#### 4.4 最终验证
- [ ] Lighthouse > 80
- [ ] 首屏加载 < 2s
- [ ] 零运行时错误

**验证清单**
- [ ] 所有 API 端点返回正确状态码
- [ ] 没有控制台错误/警告
- [ ] 功能完整性检查

---

## 文件结构

```
dream_welcomer/
├── src/
│   ├── app/
│   │   ├── globals.css           # 全局样式
│   │   ├── layout.tsx            # 根布局
│   │   ├── page.tsx              # 首页（SSR 获取初始数据）
│   │   └── api/
│   │       ├── assistant/
│   │       │   └── route.ts      # AI 对话 API
│   │       ├── products/
│   │       │   └── route.ts      # 商品列表 API
│   │       └── orders/
│   │           └── [orderId]/
│   │               └── route.ts  # 订单查询 API
│   ├── components/
│   │   ├── dream-shop.tsx        # 主容器组件
│   │   ├── product-card.tsx      # 商品卡片（Phase 2）
│   │   ├── chat-message.tsx      # 聊天消息（Phase 2）
│   │   └── filter-panel.tsx      # 筛选面板（Phase 2）
│   └── lib/
│       ├── assistant.ts          # AI 对话逻辑
│       ├── products.ts           # 商品数据与筛选
│       └── db.ts                 # 数据库操作
├── .env.example                  # 环境变量示例
├── .gitignore
├── codex.md                      # 本文档（项目设计）
├── README.md                     # 项目介绍与快速开始
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
└── postcss.config.mjs
```

---

## 关键设计决策

### 1. **Next.js App Router (Server Components)**
**决策**：使用 Next.js 15 App Router 和 React Server Components

**原因**：
- 数据库查询 (`getCatalogProducts()`) 在服务端执行，减少客户端 bundle
- 减少 waterfall（初始加载可立即获取商品列表）
- Type-safe 路由与中间件

---

### 2. **Zod 运行时验证**
**决策**：所有 API 请求/响应使用 Zod Schema

**原因**：
- LLM 可能返回不符合预期的 JSON，Zod 提前捕捉
- 类型安全与运行时安全一致
- 易于调试与错误提示

---

### 3. **Mock 数据优先，DB 无缝切换**
**决策**：`getCatalogProducts()` 默认返回 mock 数据，若 `DATABASE_URL` 可用则查询 PostgreSQL

**原因**：
- MVP 快速迭代（无需初始化 DB）
- 支持本地开发（不依赖外部服务）
- 生产就绪（可随时切换真实数据库）

---

### 4. **localStorage 存储购物车与收藏**
**决策**：购物车、收藏、订单查询历史存储在浏览器 localStorage

**原因**：
- MVP 范围内无用户认证系统
- 降低后端存储成本
- 用户返回时保留购物状态

**Future**：集成用户系统后迁移至后端

---

### 5. **自然语言理解分层**
**决策**：
- 第 1 层：关键词匹配（快速、可靠）
- 第 2 层：LangChain + GPT-4o（复杂场景）
- 第 3 层：启发式规则（边界处理）

**原因**：
- 简单场景无需调用 LLM（降低成本与延迟）
- 复杂意图交由 LLM 理解
- 规则兜底防止异常

---

### 6. **多轮对话上下文管理（Phase 1）**
**决策**：在内存中维护对话历史和筛选状态

**原因**：
- 支持用户"太贵了" → "便宜点的"这类上下文依赖的查询
- 提升用户体验（不必每次重述需求）
- 通常 MVP 用户量有限，内存足够

**Future**：集成数据库或 Redis 存储对话历史

---

## 开发规范

### TypeScript
- [ ] **严格模式**：`tsconfig.json` 设置 `"strict": true`
- [ ] **类型定义**：禁止使用 `any`，用 `unknown` + 类型守卫
- [ ] **命名约定**：
  - Type: `PascalCase` (e.g., `Product`, `AssistantFilters`)
  - Function: `camelCase` (e.g., `filterProducts()`, `formatPrice()`)
  - Constants: `UPPER_SNAKE_CASE` (e.g., `MAX_PRICE_LIMIT`)

### React Components
- [ ] **函数式组件**：禁止 Class Component
- [ ] **Hooks 规则**：遵守 ESLint React Hooks 规则
- [ ] **性能优化**：
  - 避免不必要重渲染（`React.memo`, `useMemo`, `useCallback`）
  - 大列表使用虚拟化（`react-window`，可选）
- [ ] **命名**：组件文件 `PascalCase.tsx`

### 样式与布局
- [ ] **Tailwind CSS**：优先使用 Tailwind 工具类，避免自定义 CSS
- [ ] **响应式**：`md:` 断点适配移动、平板、桌面
- [ ] **无障碍**：
  - 按钮 `aria-label`
  - 颜色对比度 WCAG AA
  - Focus state 可见

### API 设计
- [ ] **请求验证**：Zod Schema
- [ ] **错误响应**：
  ```json
  { "error": "描述", "code": "ERROR_CODE", "status": 400 }
  ```
- [ ] **日志**：关键流程记日志（便于调试）

### Git 工作流
- [ ] **分支命名**：
  - Feature: `feat/description`
  - Fix: `fix/description`
  - 例：`feat/phase1-conversation-memory`
- [ ] **Commit 信息**（参考 Conventional Commits）：
  - `feat(assistant): add conversation memory`
  - `fix(products): handle empty filter array`
  - `docs(readme): update quickstart`

### 测试
- [ ] **单元测试**：核心业务逻辑（assistant.ts, products.ts）
- [ ] **集成测试**：API 端点
- [ ] **E2E 测试**：关键用户流程（可选，MVP 后期）
- [ ] **框架**：Jest + React Testing Library（推荐）

### 文档
- [ ] **代码注释**：复杂逻辑、边界情况的为什么
- [ ] **JSDoc**：导出函数、类需要 JSDoc
- [ ] **README**：快速开始、环境配置、主要命令

---

## 环境变量

| 变量 | 描述 | 必需 | 示例 |
|------|------|------|------|
| `OPENAI_API_KEY` | OpenAI API 密钥 | ✅ | `sk-...` |
| `DATABASE_URL` | PostgreSQL 连接字符串 | ❌ | `postgresql://user:pass@host/db` |

**说明**：
- 无 `OPENAI_API_KEY`：AI 对话降级为关键词匹配
- 无 `DATABASE_URL`：使用 mock 数据
- 本地开发复制 `.env.example` → `.env`

---

## 快速开始

### 安装
```bash
corepack prepare pnpm@9.15.9 --activate
pnpm install
```

### 开发
```bash
cp .env.example .env
# 编辑 .env，填入 OPENAI_API_KEY
pnpm dev
# 打开 http://localhost:3000
```

### 构建
```bash
pnpm build
pnpm start
```

### 测试（Phase 4）
```bash
pnpm test
pnpm test:e2e
```

---

## 常见问题

### Q: 如何本地测试 AI 对话？
A: 设置 `OPENAI_API_KEY` 环境变量，然后在聊天框输入。若无 API Key，系统使用关键词匹配。

### Q: 如何切换到真实 PostgreSQL？
A: 配置 `DATABASE_URL`，`getCatalogProducts()` 自动查询 DB。

### Q: 为什么购物车在刷新后清空？
A: MVP 使用 localStorage，建议在 Phase 4 迁至后端。

### Q: 对话返回错误如何处理？
A: Phase 1 会添加重试机制和详细错误提示。

---

## 下一步

- [ ] Phase 1：AI 对话体验增强
- [ ] Phase 2：UI/UX 优化
- [ ] Phase 3：筛选维度扩展
- [ ] Phase 4：测试与文档完善

---

**最后更新**：2026-06-26  
**版本**：1.0.0-MVP  