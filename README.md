# CF-Navs

一个部署在 **Cloudflare Workers** 上的轻量级个人导航面板。前台适合做公开或私有的常用站点入口，后台提供分类、书签、主题、搜索引擎和数据备份管理。

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-orange.svg)
![Svelte](https://img.shields.io/badge/Svelte-4-ff3e00.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6.svg)

## 亮点

- **部署简单**：基于 Cloudflare Workers、D1 和 KV，无需自建服务器。
- **界面清爽**：响应式首页、分类分区、两种卡片样式、亮色/暗色/跟随系统主题。
- **管理顺手**：分类和书签支持新增、编辑、删除、搜索、分页和拖拽排序。
- **图标友好**：支持网站 favicon、文字图标、Iconify、自定义 URL、文字或表情。
- **个性化完整**：可配置站点标题、首页标题样式、背景、遮罩、卡片尺寸、图标大小和搜索引擎。
- **数据可迁移**：支持 JSON 导入导出，也内置 Sun-Panel 数据导入转换。
- **适合公开或私用**：可开启公开模式，也可以保持仅管理员可见。

## 适合用来做什么

- 个人常用网站导航
- 家庭或小团队工具入口
- 内部系统、运维面板、文档链接聚合页
- 从 Sun-Panel 迁移到 Cloudflare 边缘部署的轻量替代方案

## 功能概览

### 首页体验

- 分类书签分区展示
- 首页搜索框直接筛选本地书签，也可使用外部搜索引擎
- 详情卡片和极简卡片两种风格
- 前台右上角快速切换亮暗模式
- 移动端和桌面端自适应
- 生产构建提供基础 PWA app shell

### 后台管理

- 单管理员登录
- 分类和书签 CRUD
- 书签列表搜索、分页、内部滚动
- 分类和书签拖拽排序
- 首页右键快捷编辑书签
- 站点设置、主题背景、搜索引擎、卡片样式配置
- 数据备份、恢复和 Sun-Panel 导入

## 快速开始

### 前置要求

- Node.js 18+
- npm
- Cloudflare 账号

### 安装依赖

```bash
npm install
```

### 创建 Cloudflare 资源

```bash
npx wrangler login
npx wrangler d1 create cf-navs-db
npx wrangler kv namespace create SESSION
```

### 生成本地 Wrangler 配置

```bash
npm run setup:wrangler
```

该命令会生成 Git 忽略的 `wrangler.local.toml`，用于保存真实的 D1 和 KV 资源 ID，避免把私密配置提交到仓库。

### 设置管理员密码

```bash
npx wrangler secret put INIT_ADMIN_PASSWORD
```

首次登录用户名默认为 `admin`，密码为这里设置的 Secret。

### 初始化数据库并部署

```bash
npm run db:init:remote
npm run deploy
```

部署成功后访问 Wrangler 返回的 Workers URL。更完整的步骤见 [docs/QUICKSTART.md](docs/QUICKSTART.md) 和 [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)。

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
npm run dev              # 启动 Worker 开发服务
npm run dev:web          # 启动前端开发服务器
npm run build            # 构建前端
npm run type-check       # TypeScript 与 Svelte 类型检查
npm run db:init          # 初始化本地 D1
npm run db:init:remote   # 初始化远程 D1
npm run deploy           # 构建并部署到 Cloudflare
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
- 生产环境建议定期导出备份 JSON。
- 如需额外访问控制，可以叠加 Cloudflare Access。

## 致谢

本项目参考了 [Sun-Panel](https://github.com/hslr-s/sun-panel) 的设计思路。

## License

[MIT](LICENSE)
