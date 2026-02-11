# WeChat Article Style Writer

## 产品定位

**产品名**：WeChat Article Style Writer（微信公众号风格写作助手）

**定位**：微信公众号文章输出工具。用户上传自己历史的公众号文章（PDF / TXT / Word(.docx)），系统提取并学习其写作风格（语气、结构、小标题密度、常用表达、段落节奏、开头/结尾模板），用户再输入「文章提纲 + 核心观点」，并选择目标字数（1500 / 2500 / 3500），系统生成：标题 + 正文（符合字数与风格）。

---

## 功能列表

- **OAuth 登录**：使用 Google 登录（可扩展 GitHub），Supabase Auth
- **上传历史文章**：拖拽/选择上传 PDF、TXT、DOCX，单文件 ≤ 10MB，存储至 Supabase Storage（私有）
- **风格库**：解析并清洗文本，展示文件列表（文件名、字数、预览前 500 字）
- **风格画像**：基于所有历史文章生成 style_profile（JSON）+ 可读摘要，支持重新生成
- **生成文章**：
  - 输入提纲 + 核心观点
  - 选择字数：预设（1500/2500/3500）或自定义（1-10000字）
  - 自定义字数超过10000时显示提示："请输入10000字以下的目标字数"
  - 调用 DeepSeek 生成标题与正文，字数允许 ±10%，可二次扩写/压缩
- **输出与历史**：
  - 展示标题、正文、复制、字数统计
  - 最近 10 条生成记录可查看详情
  - 每条记录支持删除，删除前弹出确认对话框

---

## 技术栈

- **前端**：Next.js 14+ App Router、TypeScript、Tailwind
- **鉴权**：Supabase Auth（OAuth：Google）
- **数据库**：Supabase Postgres
- **文件存储**：Supabase Storage（bucket: `user-articles`，私有）
- **AI**：DeepSeek 原生 API（仅服务端调用）
- **校验**：Zod（前后端）

---

## 环境变量

请复制 `.env.example` 为 `.env.local` 并填写以下变量（**必须提供**）：

| 变量名 | 说明 |
|--------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目 URL（Dashboard → Settings → API） |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 匿名公钥（同上） |
| `NEXT_PUBLIC_SITE_URL` | 站点 URL，开发时填 `http://localhost:3000`，生产填 `https://your-domain.com` |
| `DEEPSEEK_API_KEY` | DeepSeek API Key（仅服务端使用，不要暴露到浏览器） |
| `DEEPSEEK_BASE_URL` | 可选，默认 `https://api.deepseek.com` |
| `DEEPSEEK_MODEL` | 可选，默认 `deepseek-chat` |

---

## Supabase 初始化步骤

### 1. 创建项目

在 [Supabase Dashboard](https://supabase.com/dashboard) 创建新项目，记下 **Project URL** 和 **anon key**。

### 2. Auth Provider（Google OAuth）

- **Authentication → Providers**：开启 **Google**
- 在 [Google Cloud Console](https://console.cloud.google.com/) 创建 OAuth 2.0 客户端（Web 应用），获取 **Client ID** 和 **Client Secret**
- **Authorized redirect URIs** 必须包含 Supabase 提供的回调地址，形如：  
  `https://<your-project-ref>.supabase.co/auth/v1/callback`
- 将 Client ID / Client Secret 填回 Supabase Google Provider

### 3. Site URL 与 Redirect URLs

- **Authentication → URL Configuration**：
  - **Site URL**：开发填 `http://localhost:3000`，生产填 `https://your-domain.com`
  - **Redirect URLs** 需包含：
    - `http://localhost:3000/**`
    - `https://your-domain.com/**`（生产域名）

### 4. 数据库与 RLS

执行项目中的迁移文件创建表并开启 RLS：

```bash
# 在 Supabase SQL Editor 中执行
# 文件：supabase/migrations/000_init.sql
```

或使用 Supabase CLI 链接项目后执行 `supabase db push`。

### 5. Storage

- **Storage**：新建 bucket，名称 **`user-articles`**，设为 **Private**
- 按照 `supabase/storage_policies.md` 配置 Policy，使用户仅能访问自己前缀 `{userId}/` 下的对象

---

## OAuth（仅 Web）配置说明

### Supabase Dashboard

- **Site URL**：与前端访问地址一致（如 `http://localhost:3000` 或 `https://your-domain.com`）
- **Redirect URLs** 需包含：
  - `http://localhost:3000/**`
  - `https://your-domain.com/**`

### Google Cloud Console

- 创建 OAuth 2.0 客户端（类型：Web 应用）
- **Authorized redirect URIs** 填写 Supabase 提供的回调：  
  `https://<project-ref>.supabase.co/auth/v1/callback`  
  （在 Supabase → Authentication → Providers → Google 中可见）

### Next.js 中 signInWithOAuth 的 redirectTo

- 登录成功后希望跳转到工作台时，`redirectTo` 设为：  
  `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`  
- 这样 OAuth 回调后会重定向到 `/dashboard`

---

## DeepSeek 配置说明

- **仅服务端使用**：所有 DeepSeek 请求在 Next.js API Route（`/api/generate`）内完成，API Key 不暴露给浏览器。
- 环境变量：`DEEPSEEK_API_KEY`（必填），`DEEPSEEK_BASE_URL`、`DEEPSEEK_MODEL` 可选。
- 默认 Base URL：`https://api.deepseek.com`，默认模型：`deepseek-chat`。

---

## 启动方式

```bash
pnpm install
pnpm dev
```

或使用 npm：

```bash
npm install
npm run dev
```

浏览器访问：`http://localhost:3000`（或你配置的 `NEXT_PUBLIC_SITE_URL`）。

---

## 目录结构

```
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── articles/route.ts      # GET 文章列表
│   │   │   ├── generate/route.ts      # POST 生成文章
│   │   │   ├── generations/route.ts  # GET 最近生成
│   │   │   ├── generations/[id]/route.ts  # DELETE 删除单条生成记录
│   │   │   ├── style-profile/route.ts        # GET 风格画像
│   │   │   ├── style-profile/rebuild/route.ts # POST 重建风格
│   │   │   └── upload/route.ts        # POST 上传文件
│   │   ├── auth/callback/route.ts    # OAuth 回调
│   │   ├── dashboard/
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx                  # Landing
│   ├── components/
│   │   ├── DashboardNav.tsx
│   │   └── dashboard/
│   │       ├── GenerateCard.tsx
│   │       ├── HistoryCard.tsx
│   │       ├── OutputCard.tsx
│   │       ├── StyleCard.tsx
│   │       └── UploadCard.tsx
│   ├── lib/
│   │   ├── api-response.ts
│   │   ├── build-style-profile.ts
│   │   ├── deepseek.ts
│   │   ├── parse.ts
│   │   ├── supabase/client.ts
│   │   ├── supabase/middleware.ts
│   │   ├── supabase/server.ts
│   │   └── zod-schemas.ts
│   └── middleware.ts
├── supabase/
│   ├── migrations/000_init.sql
│   └── storage_policies.md
├── .env.example
├── .gitignore
├── next.config.js
├── package.json
├── postcss.config.js
├── README.md
├── tailwind.config.ts
└── tsconfig.json
```
