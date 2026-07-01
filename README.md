# CF-Navs

> 一个运行在 Cloudflare Workers 上的轻量个人导航面板。前台用于展示常用站点，后台用于管理分类、书签、主题、搜索引擎和数据备份。

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-orange.svg)
![Svelte](https://img.shields.io/badge/Svelte-4-ff3e00.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6.svg)

[快速开始](docs/QUICKSTART.md) · [部署指南](docs/DEPLOYMENT.md) · [技术细节](docs/TECHNICAL_NOTES.md) · [API 契约](docs/API_CONTRACT.md) · [问题排查](docs/TROUBLESHOOTING.md)

## 项目定位

CF-Navs 适合把个人、家庭、小团队或内部系统的常用链接整理成一个干净、快速、可自定义的导航页。它不依赖传统服务器，前端静态资源和后端 API 都部署在 Cloudflare Workers，数据存储使用 D1，登录会话使用 KV。

| 方向 | 说明 |
| --- | --- |
| 使用场景 | 个人导航、工具入口、内网系统索引、团队链接聚合 |
| 部署方式 | Wrangler CLI，或 Cloudflare 控制台导入 GitHub 仓库 |
| 数据存储 | Cloudflare D1 + KV |
| 管理模式 | 单管理员后台，可开启公开访问 |
| 迁移能力 | 支持 JSON 备份恢复和 Sun-Panel 导入 |

## 核心亮点

- **轻量部署**：Cloudflare Workers + D1 + KV，无需自建服务器。
- **清爽首页**：分类分区、响应式布局、详情/极简两种卡片样式。
- **顺手管理**：分类和书签支持新增、编辑、删除、搜索、分页和拖拽排序。
- **图标省心**：支持 favicon、文字图标、Iconify、自定义图片 URL、文字或表情。
- **主题完整**：亮色、暗色、跟随系统；背景、遮罩、卡片尺寸和图标大小都可配置。
- **搜索实用**：首页输入可筛选本地书签，也可切换外部搜索引擎。
- **数据可控**：支持导入、导出、恢复，方便备份和迁移。

## 功能概览

### 首页体验

- 分类和书签分区展示
- 首页标题、背景、遮罩、卡片样式可配置
- 关键词直接筛选标题、描述、URL 和分类
- 外部搜索引擎快速切换
- 移动端和桌面端自适应
- 生产构建提供基础 PWA app shell

### 后台管理

- 单管理员登录
- 分类和书签 CRUD
- 分类和书签拖拽排序
- 后台列表搜索、分页和内部滚动
- 首页右键快捷编辑书签
- 多来源图标候选和本地图标缓存
- 站点设置、搜索引擎、主题背景和数据备份

## 部署方式

CF-Navs 提供两条部署路线。熟悉命令行时建议使用方式一；想全程在 Cloudflare 控制台完成，可以使用方式二。

### 方式一：Wrangler CLI 部署

前置要求：

- Node.js 18+
- npm
- Cloudflare 账号

安装依赖：

```bash
npm install
```

创建 Cloudflare 资源：

```bash
npx wrangler login
npx wrangler d1 create cf-navs-db
npx wrangler kv namespace create SESSION
```

生成本地 Wrangler 配置：

```bash
npm run setup:wrangler
```

该命令会生成 Git 忽略的 `wrangler.local.toml`，用于保存真实的 D1 和 KV 资源 ID。不要把真实资源 ID 或密钥提交到公开仓库。

设置管理员密码：

```bash
npx wrangler secret put INIT_ADMIN_PASSWORD
```

初始化数据库并部署：

```bash
npm run db:init:remote
npm run deploy
```

部署成功后，访问 Wrangler 返回的 Workers URL。首次登录用户名默认为 `admin`，密码为 `INIT_ADMIN_PASSWORD`。

### 方式二：Cloudflare 控制台在线部署

这种方式适合不想在本地运行 Wrangler 的用户。Cloudflare Workers Builds 支持从 GitHub/GitLab 仓库导入项目，并在 push 后自动构建和部署。

1. 在 GitHub 上 Fork 本仓库。
2. 登录 Cloudflare 控制台，创建 D1 数据库 `cf-navs-db`，复制 `database_id`。
3. 创建 KV 命名空间 `SESSION`，复制 namespace `id`。
4. 进入 **Workers & Pages**，选择 **Create application**。
5. 在 **Import a repository** 旁选择 **Get started**，关联 GitHub 账号并选择你的 fork。
6. 创建 Worker 时，项目名使用 `cf-navs`。如果你想用其他名字，需要在构建变量里同时设置 `CF_NAVS_WORKER_NAME` 为同一个名字。
7. 构建设置建议如下：

| 配置项 | 值 |
| --- | --- |
| Production branch | `main` |
| Root directory | `/` |
| Build command | 留空 |
| Deploy command | `npm run deploy:cloudflare` |
| `CF_NAVS_D1_DATABASE_ID` | D1 数据库的 `database_id` |
| `CF_NAVS_KV_NAMESPACE_ID` | KV 命名空间的 `id` |
| `CF_NAVS_WORKER_NAME` | 可选；需要和 Cloudflare 里的 Worker 项目名一致 |

`npm run deploy:cloudflare` 会在 Cloudflare 构建环境里临时生成 `wrangler.local.toml`，执行远程 D1 初始化，然后构建并部署 Worker。真实资源 ID 只放在 Cloudflare 的 Build variables 中，不需要提交到 fork。

8. 保存并部署。部署完成后，在该 Worker 的 **Settings → Variables & Secrets** 中添加运行时 Secret：

```text
INIT_ADMIN_PASSWORD = 你的管理员密码
```

9. 重新部署或重试最近一次部署，然后访问 Workers URL。

如果你的 Cloudflare 构建 Token 没有 D1 初始化权限，可以先在 D1 控制台的 SQL Console 中执行 [schema.sql](schema.sql)，再把 Deploy command 改为：

```bash
npm run deploy:ci
```

注意：Cloudflare 要求控制台中的 Worker 名称与 Wrangler 配置里的 `name` 保持一致，否则 Git 集成构建会失败。默认项目名是 `cf-navs`。

## 本地开发

开启两个终端：

```bash
npm run dev
```

```bash
npm run dev:web
```

访问 `http://localhost:5173` 查看前端页面。验证完成后，在对应终端按 `Ctrl+C` 停止 Worker 和 Vite 服务。

## 常用命令

```bash
npm run dev                # 启动 Worker 开发服务
npm run dev:web            # 启动前端开发服务器
npm run build              # 构建前端
npm run type-check         # TypeScript 与 Svelte 类型检查
npm run setup:wrangler     # 生成本地 wrangler.local.toml
npm run setup:wrangler:ci  # 从 CI 环境变量生成 wrangler.local.toml
npm run db:init            # 初始化本地 D1
npm run db:init:remote     # 初始化远程 D1
npm run deploy             # 本地构建并部署到 Cloudflare
npm run deploy:ci          # CI 环境生成配置后部署
npm run deploy:cloudflare  # Cloudflare Git 集成部署
```

## 技术栈

- **前端**：Svelte + TypeScript + Vite
- **后端**：Hono + Cloudflare Workers
- **数据库**：Cloudflare D1
- **会话存储**：Cloudflare KV
- **排序交互**：SortableJS

## 项目结构

```text
CF-Navs/
├── src/                  # 前端源码
├── worker/               # Cloudflare Worker 后端
├── shared/               # 前后端共享类型
├── public/               # 静态资源与 PWA 文件
├── scripts/              # Wrangler 配置、导入转换和检查脚本
├── docs/                 # 项目文档
├── schema.sql            # D1 数据库结构
├── wrangler.toml         # 公开模板配置
└── package.json
```

## 文档

- [快速开始](docs/QUICKSTART.md)：从创建资源到首次部署的最短路径。
- [部署检查清单](docs/DEPLOYMENT.md)：Cloudflare Workers 部署前后验证。
- [项目概览](docs/PROJECT_OVERVIEW.md)：模块结构、功能边界和架构说明。
- [技术细节](docs/TECHNICAL_NOTES.md)：图标缓存、边缘缓存、数据读取和性能策略。
- [API 契约](docs/API_CONTRACT.md)：前后端接口约定。
- [Sun-Panel 导入](docs/SUNPANEL_IMPORT.md)：Sun-Panel 数据迁移指南。
- [问题排查](docs/TROUBLESHOOTING.md)：登录、部署、数据保存和图标显示等常见问题。

## 安全提示

- 使用强密码设置 `INIT_ADMIN_PASSWORD`。
- 不要提交 `.dev.vars`、`wrangler.local.toml` 或任何真实 Secret。
- 在线部署时，把资源 ID 放在 Cloudflare Build variables，把管理员密码放在 Runtime Secret。
- 生产环境建议定期导出备份 JSON。
- 如需额外访问控制，可以叠加 Cloudflare Access。

## 致谢

本项目参考了 [Sun-Panel](https://github.com/hslr-s/sun-panel) 的设计思路。

## License

[MIT](LICENSE)
