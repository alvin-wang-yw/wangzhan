# Foreign Trade Store - 外贸独立站

一个基于 Next.js 14 的外贸电商独立站项目，支持中英双语，包含完整的产品管理、购物车、订单系统、博客、询盘和后台管理功能。

## 🚀 功能特性

### 前台功能
- 🛒 **产品展示** - 产品分类、筛选、排序、搜索、详情页
- 🛍️ **购物车** - 添加/删除/修改数量、本地存储+登录同步
- 💳 **订单系统** - 下单、订单查询、订单状态跟踪
- 📝 **博客系统** - 文章列表、分类、标签、详情页
- 📨 **询盘系统** - 产品询盘、联系表单
- 🌍 **多语言支持** - 中英双语（next-intl）
- 🔍 **SEO 优化** - 动态 meta 标签、sitemap、robots.txt
- 📱 **响应式设计** - 适配桌面/平板/手机

### 后台管理
- 📊 **数据仪表盘** - 订单、销售额、用户、产品实时统计
- 📦 **产品管理** - 增删改查、分类管理、标签管理
- 📋 **订单管理** - 订单列表、详情、状态变更
- ✉️ **询盘管理** - 查看、标记已读/回复
- 📝 **博客管理** - 文章发布、分类、标签
- ⚙️ **系统设置** - 网站基本信息、支付配置、运费设置
- 🔐 **权限控制** - 管理员角色验证

### 用户中心
- 👤 **个人资料** - 查看和修改个人信息
- 📦 **我的订单** - 订单列表和详情
- 📍 **收货地址** - 地址管理、默认地址设置
- 🔑 **修改密码** - 安全密码修改

## 🛠️ 技术栈

| 技术 | 版本 | 说明 |
|------|------|------|
| Next.js | 14 | React 全栈框架，App Router |
| TypeScript | 5+ | 类型安全 |
| Tailwind CSS | 3+ | 原子化 CSS 框架 |
| Prisma | 5+ | ORM 数据库工具 |
| SQLite | - | 开发环境数据库 |
| Auth.js (NextAuth) | 5+ | 用户认证 |
| next-intl | 3+ | 国际化方案 |
| bcryptjs | - | 密码哈希 |
| lucide-react | - | 图标库 |
| clsx + tailwind-merge | - | 类名合并 |

## 📁 项目目录结构

```
foreign-trade-store/
├── prisma/
│   ├── schema.prisma       # 数据库模型定义
│   └── seed.ts             # 种子数据
├── public/                 # 静态资源
├── src/
│   ├── app/
│   │   ├── [locale]/       # 国际化路由
│   │   │   ├── admin/      # 后台管理页面
│   │   │   ├── account/    # 用户中心页面
│   │   │   ├── products/   # 产品页面
│   │   │   ├── blog/       # 博客页面
│   │   │   ├── cart/       # 购物车
│   │   │   ├── checkout/   # 结账页
│   │   │   ├── contact/    # 联系我们
│   │   │   ├── about/      # 关于我们（含隐私/条款/FAQ）
│   │   │   └── ...
│   │   └── api/            # API 路由
│   │       ├── admin/      # 后台 API
│   │       ├── account/    # 用户中心 API
│   │       ├── auth/       # 认证 API
│   │       ├── products/   # 产品 API
│   │       ├── orders/     # 订单 API
│   │       ├── cart/       # 购物车 API
│   │       ├── inquiries/  # 询盘 API
│   │       └── blog/       # 博客 API
│   ├── components/         # 组件
│   │   ├── admin/          # 后台组件
│   │   ├── account/        # 用户中心组件
│   │   ├── products/       # 产品组件
│   │   ├── cart/           # 购物车组件
│   │   └── ...
│   ├── lib/                # 工具库
│   │   ├── prisma.ts       # Prisma 客户端
│   │   ├── utils.ts        # 工具函数
│   │   ├── cart.ts         # 购物车工具
│   │   └── stripe.ts       # Stripe 配置
│   ├── messages/           # 多语言文案
│   │   ├── en.json         # 英文
│   │   └── zh.json         # 中文
│   └── auth.ts             # Auth.js 配置
├── middleware.ts           # Next.js 中间件（语言路由）
├── tailwind.config.ts      # Tailwind 配置
├── next.config.mjs         # Next.js 配置
├── package.json
└── README.md
```

## 🚀 本地运行

### 前置要求
- Node.js >= 18.17
- npm / pnpm / yarn

### 安装步骤

1. **克隆项目**
```bash
git clone <repository-url>
cd foreign-trade-store
```

2. **安装依赖**
```bash
npm install
# 或
pnpm install
```

3. **配置环境变量**

复制 `.env.example` 为 `.env` 并填写：
```bash
cp .env.example .env
```

环境变量说明：
```env
# 数据库连接（开发用 SQLite）
DATABASE_URL="file:./dev.db"

# Auth.js 密钥（生成命令：openssl rand -hex 32）
AUTH_SECRET="your-secret-key-here"

# 站点 URL
NEXTAUTH_URL="http://localhost:3000"

# Stripe 支付（可选）
STRIPE_SECRET_KEY=""
STRIPE_PUBLISHABLE_KEY=""
STRIPE_WEBHOOK_SECRET=""
```

4. **初始化数据库**
```bash
# 生成 Prisma Client
npx prisma generate

# 执行数据库迁移
npx prisma migrate dev --name init

# 填充种子数据
npx prisma db seed
```

5. **启动开发服务器**
```bash
npm run dev
```

访问 http://localhost:3000 查看站点。

### 可用脚本

```bash
npm run dev          # 启动开发服务器
npm run build        # 构建生产版本
npm run start        # 启动生产服务器
npm run lint         # 代码检查
npm run prisma:generate  # 生成 Prisma Client
npm run prisma:migrate   # 执行数据库迁移
npm run prisma:seed      # 填充种子数据
npm run prisma:studio    # 打开 Prisma Studio（数据库可视化）
```

## 🔑 测试账号

| 角色 | 邮箱 | 密码 |
|------|------|------|
| 管理员 | admin@example.com | admin123 |
| 普通用户 | user@example.com | user123 |

后台地址：`/en/admin` 或 `/zh/admin`

## 🌐 部署指南

### 部署到 Vercel（推荐）

#### 1. 准备数据库

开发使用 SQLite，生产环境建议使用 PostgreSQL。推荐以下服务：

- **Neon** - 免费的 Serverless PostgreSQL
- **Supabase** - 完整的 BaaS 平台，含 PostgreSQL

#### 2. 获取数据库连接串

以 Neon 为例：
1. 注册 https://neon.tech
2. 创建新项目
3. 复制数据库连接串（格式：`postgresql://user:pass@host/dbname?sslmode=require`）

#### 3. 配置 Vercel

1. 将项目推送到 GitHub
2. 在 Vercel 中 Import 项目
3. 配置环境变量：
   - `DATABASE_URL` - PostgreSQL 连接串
   - `AUTH_SECRET` - 生成密钥
   - `NEXTAUTH_URL` - 你的站点域名

4. 在 Build Command 中添加数据库迁移：
   ```bash
   npx prisma migrate deploy && npx prisma generate && next build
   ```

5. 点击 Deploy

#### 4. 初始化数据

部署完成后，进入项目控制台，在终端中运行：
```bash
npx prisma db seed
```

### Docker 部署（自托管）

```dockerfile
FROM node:18-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate && npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
```

## 🗄️ 数据库迁移

### 添加新字段或模型后
```bash
# 1. 修改 prisma/schema.prisma

# 2. 创建迁移
npx prisma migrate dev --name <migration-name>

# 3. 如果有种子数据更新，重新填充
npx prisma db seed
```

### 生产环境迁移
```bash
npx prisma migrate deploy
```

## ❓ 常见问题

### Q: 开发时数据库报错？
A: 检查 `.env` 中 `DATABASE_URL` 是否正确配置，运行 `npx prisma generate` 和 `npx prisma migrate dev` 初始化。

### Q: 登录后无法访问后台？
A: 确认用户角色为 `ADMIN`。可以用种子数据中的管理员账号登录：admin@example.com / admin123

### Q: 如何添加新的语言？
1. 在 `src/messages/` 中新建语言文件（如 `ja.json`）
2. 在 `middleware.ts` 中添加语言代码
3. 在相关页面/组件中补充翻译

### Q: 如何修改网站 Logo 和名称？
登录后台 → 设置 → 网站设置，即可修改网站名称、Logo、联系方式等。

### Q: 支付功能怎么开通？
登录后台 → 设置 → 支付设置，开启对应的支付方式并填写 API Key 等配置。

### Q: Stripe Webhook 怎么配置？
1. 在 Stripe Dashboard 创建 Webhook，Endpoint URL 填 `/api/orders/webhook`
2. 监听 `checkout.session.completed` 事件
3. 将 Webhook Secret 填入后台支付设置

### Q: 图片上传怎么处理？
当前版本使用 URL 方式引用图片，推荐使用：
- 七牛云 / 阿里云 OSS / AWS S3
- Cloudinary
- Imgur 等图床服务

## 📄 License

MIT
