# 文脉 AI（WeChat Article Style Writer）

文脉 AI 是一个面向微信公众号内容创作的写作系统：
- 上传你的历史文章（PDF/TXT/DOCX）
- 自动学习你的写作风格（语气、结构、段落节奏、小标题偏好）
- 基于提纲与核心观点生成标题 + 正文
- 支持字数控制、生成历史管理与工作台闭环

---

## 1. 最近前端迭代（Landing Page）

本仓库已完成一版新的落地页改版，核心变更如下：

### 1.1 视觉与信息架构
- 全局采用白底 + 黑灰配色，强调信息密度与可读性
- 首页首屏聚焦转化：价值主张 + Google 登录按钮
- 中段按「流程」「功能」「常见问题」分区，支持完整上下滚动浏览
- 页脚统一为品牌信息 + 分组链接

核心文件：
- `src/app/page.tsx`

### 1.2 顶部导航（你本次要求）
- 顶部 Tab `流程 / 功能 / 常见问题` 字号已小幅调大（不破坏布局）
- 导航锚点对应页面分区滚动

代码位置：
- `src/app/page.tsx`（header nav）

### 1.3 登录按钮状态逻辑（右上角）
- 未登录：显示黑底「登录」按钮，点击触发 Google OAuth
- 已登录：显示灰色圆形按钮，内容为用户邮箱首字母大写
- 点击已登录按钮：弹出确认，确认后退出登录并恢复「登录」按钮

代码位置：
- `src/app/page.tsx`：`handleAuthButtonClick` / `getUserInitial` / header button

### 1.4 品牌与 Logo
- 落地页品牌文案统一替换为「文脉 AI」
- 新增统一 logo 组件并用于页头与页脚
- 浏览器页签 favicon 使用同款 logo

代码位置：
- `src/app/page.tsx`：`WenmaiLogo` 组件
- `src/app/icon.svg`：favicon 源文件
- `src/app/layout.tsx`：`metadata.icons` 配置

---

## 2. 整体产品实现模式与功能

## 2.1 技术架构
- 前端：Next.js 14（App Router）+ React + TypeScript + Tailwind CSS
- 鉴权：Supabase Auth（Google OAuth）
- 数据库：Supabase Postgres
- 文件存储：Supabase Storage（bucket：`user-articles`，私有）
- AI：DeepSeek 原生 API + OpenRouter API（仅服务端调用）
- 校验：Zod（请求参数与业务输入校验）

## 2.2 产品运行模式（端到端）
1. 用户登录（Google OAuth）
2. 上传历史文章文件
3. 服务端解析文本并存储（DB + Storage）
4. 触发风格画像构建（style profile）
5. 用户输入提纲/核心观点及可选约束
6. 服务端按所选模型生成标题和正文（DeepSeek 走原生 API，其它模型走 OpenRouter）
7. 结果写入生成历史并回显在工作台
8. 用户可复制、回看、删除历史记录

## 2.3 主要功能清单
- OAuth 登录
- 上传历史文章（PDF/TXT/DOCX，单文件 ≤ 10MB）
- 风格画像自动生成与查看
- 文章生成（支持 1500/2500/3500 与 1~10000 自定义）
- 模型选择（DeepSeek / Grok / GPT 5.2 / Gemini / Opus 4.6）
- 邀请码解锁（除 DeepSeek 外其余模型首次使用需验证邀请码）
- 进阶生成参数（约束性条件、作者画像、具体案例、参考来源、小标题）
- 输出复制、字数偏差展示
- 最近生成记录查看与删除

---

## 3. 工作台功能与代码实现映射

## 3.1 工作台页面装配
- 页面：`src/app/dashboard/page.tsx`
- 通过多个 Card 组件组合工作台能力：
  - `UploadCard`
  - `StyleCard`
  - `GenerateCard`
  - `OutputCard`
  - `HistoryCard`

## 3.2 上传历史文章（UploadCard）
- 前端组件：`src/components/dashboard/UploadCard.tsx`
- 后端接口：`POST /api/upload` -> `src/app/api/upload/route.ts`
- 关键逻辑：
  - 文件类型与体积校验
  - 写入 Supabase Storage
  - 文本解析（`src/lib/parse.ts`）
  - 写入 `user_articles`
  - 成功后自动触发风格画像重建（`buildStyleProfile`）

## 3.3 风格画像（StyleCard）
- 前端组件：`src/components/dashboard/StyleCard.tsx`
- 后端接口：
  - `GET /api/style-profile` -> `src/app/api/style-profile/route.ts`
  - `POST /api/style-profile/rebuild` -> `src/app/api/style-profile/rebuild/route.ts`
- 核心能力：
  - 展示风格摘要
  - 可展开查看画像 JSON
  - 显示最近更新时间

## 3.4 文章生成（GenerateCard）
- 前端组件：`src/components/dashboard/GenerateCard.tsx`
- 后端接口：`POST /api/generate` -> `src/app/api/generate/route.ts`
- 输入校验：`src/lib/zod-schemas.ts`
- 核心能力：
  - 必填：提纲 + 核心观点
  - 字数控制：预设 + 自定义（1~10000）
  - 模型切换：DeepSeek（免邀请码）/ Grok / GPT 5.2 / Gemini / Opus 4.6
  - 邀请码弹窗验证：非 DeepSeek 模型首次使用需要验证
  - 进阶参数：约束性条件、作者画像、具体案例、参考来源、小标题开关
  - 参考链接抓取与摘要拼接
  - 按风格画像提示词生成标题和正文

## 3.5 结果展示（OutputCard）
- 前端组件：`src/components/dashboard/OutputCard.tsx`
- 核心能力：
  - 展示标题与正文
  - 统计目标字数与偏差
  - 一键复制全文

## 3.6 历史记录（HistoryCard）
- 前端组件：`src/components/dashboard/HistoryCard.tsx`
- 后端接口：
  - `GET /api/generations` -> `src/app/api/generations/route.ts`
  - `DELETE /api/generations/[id]` -> `src/app/api/generations/[id]/route.ts`
- 核心能力：
  - 最近 10 条记录
  - 点选回显历史结果
  - 删除前确认

## 3.7 工作台鉴权与导航
- 工作台布局守卫：`src/app/dashboard/layout.tsx`
  - 未登录重定向到首页 `/`
- 顶部导航组件：`src/components/DashboardNav.tsx`
  - 展示用户信息
  - 支持退出登录

---

## 4. API 总览

- `POST /api/upload`：上传并解析历史文章，自动更新风格画像
- `GET /api/articles`：获取已上传文章列表
- `POST /api/articles/delete-all`：删除全部历史文章与风格画像
- `GET /api/style-profile`：获取风格画像
- `POST /api/style-profile/rebuild`：手动重建风格画像
- `POST /api/generate`：按提纲与风格生成文章
- `GET /api/generations?limit=10`：获取生成历史
- `DELETE /api/generations/[id]`：删除单条生成记录
- `GET /auth/callback`：OAuth 回调

---

## 5. 数据与存储

### 5.1 数据表（核心）
- `user_articles`：上传文件元信息 + 解析文本
- `user_style_profiles`：风格画像 JSON + 摘要
- `generations`：生成结果与元信息

### 5.2 存储策略
- Bucket：`user-articles`（Private）
- 文件路径按用户隔离：`{userId}/...`
- RLS 保证用户仅访问/操作自己的数据

迁移文件：
- `supabase/migrations/000_init.sql`
- `supabase/migrations/001_model_access_and_generation_models.sql`

存储策略说明：
- `supabase/storage_policies.md`

---

## 6. 环境变量

复制 `.env.example` 为 `.env.local`，并填写：

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL`
- `DEEPSEEK_API_KEY`
- `DEEPSEEK_BASE_URL`（可选，默认 `https://api.deepseek.com`）
- `DEEPSEEK_MODEL`（可选，默认 `deepseek-chat`）
- `OPENROUTER_API_KEY`
- `OPENROUTER_BASE_URL`（可选，默认 `https://openrouter.ai/api/v1`）
- `OPENROUTER_APP_NAME`（可选，默认 `文脉 AI`）
- `MODEL_INVITE_CODE`（可选，默认 `ocean11`）

---

## 7. 本地开发

```bash
npm install
npm run dev
```

若默认端口被占用：

```bash
npm run dev -- -p 3010
```

访问终端输出的 Local 地址，例如：
- `http://localhost:3000`
- `http://localhost:3010`

---

## 8. 部署注意事项

- 生产环境配置正确的 `NEXT_PUBLIC_SITE_URL`
- Supabase Auth 的 Redirect URLs 需覆盖生产域名
- DeepSeek / OpenRouter Key 仅放服务端环境变量，不暴露到浏览器
- 首次部署前确认 DB migration 与 Storage policy 已应用

---

## 9. 项目结构（关键目录）

```text
src/
  app/
    page.tsx                         # 落地页（品牌、登录、功能营销内容）
    icon.svg                         # favicon
    layout.tsx                       # 全局 metadata / icons
    dashboard/
      layout.tsx                     # 工作台鉴权守卫
      page.tsx                       # 工作台页面装配
    api/
      upload/route.ts
      articles/route.ts
      articles/delete-all/route.ts
      style-profile/route.ts
      style-profile/rebuild/route.ts
      generate/route.ts
      generations/route.ts
      generations/[id]/route.ts
      auth/callback/route.ts
  components/
    DashboardNav.tsx
    dashboard/
      UploadCard.tsx
      StyleCard.tsx
      GenerateCard.tsx
      OutputCard.tsx
      HistoryCard.tsx
  lib/
    build-style-profile.ts
    deepseek.ts
    parse.ts
    zod-schemas.ts
```

---

## 10. 当前品牌与命名说明

- 前端展示品牌：**文脉 AI**
- 仓库名与部分历史文件仍沿用 `WeChat-Article-Style-Writer` 命名，不影响运行
- 如需统一仓库命名，可在后续迭代执行重命名与文案清理
