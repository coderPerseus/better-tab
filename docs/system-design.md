# Lucky Tab（AI 原生新标签页）系统设计 v0

> 目标：做一个“像 WeTab 一样可高度 DIY 的小组件主页”，但默认更隐私、更快、更清爽；并且把 AI 作为一等公民（AI 能力以组件形式存在、可组合、可替换、可离线）。

## 1. 调研摘要（WeTab）

从官网与 Chrome Web Store 介绍中，可归纳 WeTab 的核心形态：

- 小组件化新标签页：小组件可拖拽摆放、自由组合。
- 常见小组件：笔记、待办、天气、纪念日/倒计时、热搜/榜单、计算器、日历等。
- 美化：高清壁纸库、动态壁纸/渐变背景、暗黑/浅色（可跟随系统）。
- 常用入口：常用网站图标、底部 Dock、左侧栏/底栏可自定义显隐。
- 搜索：可切换/自定义搜索引擎。
- 跨设备：账号登录后同步/备份（WeTab 形态中是重要能力）。
- 隐私宣称：商店页声明“不收集或使用你的数据”（以其披露为准）。

## 2. 产品目标（Lucky Tab）

### 2.1 核心卖点

1) **组件系统（Widget System）是第一原则**
- 所有功能（包括 AI）都以 Widget 形式交付：可拖放、可配置、可复用、可组合。

2) **隐私优好（Privacy-first）**
- 默认本地存储；默认不上传任何数据；默认不需要账号。
- 所有联网行为可见、可控、可按组件粒度关闭；敏感凭据加密存储。

3) **性能高（Performance-first）**
- 首屏秒开：核心 Shell 极小，Widget 按需加载（code-splitting + lazy）。
- 重计算放到 Worker / Offscreen Document；渲染隔离与容错（ErrorBoundary）。

4) **AI 原生（AI-native）**
- AI = “可插拔能力层 + 一组 AI Widgets”。
- 支持**本地小模型**（离线回答简单问题）与**可选远端模型**（用户自带 Key/自建服务）。
- AI 能力可以作为“工具”被其他 Widget 调用（例如：待办自动拆解、壁纸生成、笔记总结）。

### 2.2 非目标（v0 不做）

- 不做“在线安装第三方 Widget 代码”的应用商店（Chrome 政策与安全边界不友好）。
- 不默认收集埋点；不默认做账号体系。

## 3. 总体架构（MV3 / WXT / React）

### 3.1 运行时边界

- `Newtab UI`：新标签页页面（React）——负责布局、渲染、交互、部分本地 AI（WebGPU/Worker）。
- `Background SW`：后台 Service Worker ——负责统一网络访问、定时任务、加密、跨页面共享服务（通过 oRPC）。
- `Storage`：
  - 小数据（布局/配置/偏好）：`browser.storage.local`
  - 大数据（聊天记录、模型权重、壁纸缓存等）：`IndexedDB`（通过封装统一访问）

### 3.2 模块视图（概览）

```mermaid
flowchart LR
  subgraph UI[Newtab UI (React)]
    Shell[Shell: 顶层框架/主题/编辑模式]
    Layout[Layout Engine: 网格/拖拽/响应式]
    Host[Widget Host: 按需加载/隔离渲染]
    Widgets[Built-in Widgets]
    AIWidgets[AI Widgets]
  end

  subgraph BG[Background Service Worker]
    RPC[oRPC 服务: Storage/Net/AI/Scheduler]
    Net[Network Gateway: 白名单/缓存/限流]
    Sched[Scheduler: 定时刷新/预取/清理]
    Crypto[Crypto: 凭据/备份加密]
  end

  subgraph Store[Local Data]
    Local[storage.local: 配置/布局/偏好]
    IDB[IndexedDB: 大对象/缓存/模型]
  end

  UI <-->|oRPC| BG
  BG <--> Store
  UI <--> Store
```

## 4. Widget 系统设计（关键）

### 4.1 数据模型

**WidgetDefinition（“组件类型”）**
- `id`: string（稳定、全局唯一）
- `meta`: 名称/图标/分类/i18n key
- `constraints`: 最小/最大尺寸、是否可多实例
- `configSchema`: 配置 schema（用于 UI 配置面板与校验）
- `defaultConfig`
- `permissions`: 运行所需权限/host permissions 声明（用于一键申请）
- `render`: React 组件（lazy import）

**WidgetInstance（“组件实例”）**
- `instanceId`: string
- `widgetId`: 指向 WidgetDefinition
- `layout`: `{x,y,w,h,z}` + breakpoint 变体
- `config`: 该实例的配置（经 schema 校验）
- `stateRef`: 指向大数据（如聊天记录/缓存）的引用 key（存 IDB）

**Dashboard（“主页状态”）**
- `version`: schema 版本（用于迁移）
- `pages`: 支持多页/多空间（可选）
- `instances`: WidgetInstance[]
- `theme`: 背景/颜色/字体/动效偏好
- `privacy`: 联网总开关、域名白名单、日志级别等
- `ai`: Provider 配置、默认模型、权限策略

### 4.2 运行时 API（给 Widget 的“能力注入”）

通过 React Context 提供 `WidgetRuntime`，避免 Widget 直接触碰全局：

- `storage`: `get/set/subscribe`（带 namespace、带迁移）
- `rpc`: oRPC 客户端（访问 BG 服务）
- `ai`: 统一 AI 接口（chat/image/embed/stream）
- `net`: 受控网络（可选：强制走 BG Gateway）
- `theme`: 当前主题与设置壁纸能力
- `actions`: 打开链接、发通知、复制、下载等
- `telemetry`: 仅本地（性能计时、错误统计）

### 4.3 隔离与稳定性

- 每个 Widget 包一层 `ErrorBoundary`，崩溃不影响整页。
- 每个 Widget 独立 `Suspense` + skeleton。
- 重计算（解析大数据、生成图片、模型推理）优先放 `Web Worker`；需要 WebGPU 时可用 `Offscreen Document`（Chrome）或在 UI 线程上做“低频小模型”推理（视实际可行性选择）。

## 5. AI 子系统（AI-native）

### 5.1 统一接口：AIProvider

目标：上层 Widget 不关心模型来自本地还是远端。

- `chat({messages, tools?, temperature?, stream?})`
- `image({prompt, size, style, seed?})`
- `embed({texts})`（可选，用于本地检索/记忆）
- `capabilities()`：是否支持流式、工具调用、图像等

### 5.2 Provider 类型（建议从一开始就抽象）

1) **Local Provider（隐私优先）**
- 本地小模型：用于“简单问答/改写/摘要/指令解析”等。
- 权重获取策略：
  - 方案 A：随扩展打包（体积大，不推荐）
  - 方案 B：用户首次启用后下载（存 IDB），校验 hash，支持断点续传

2) **Remote Provider（用户自带 Key）**
- OpenAI / Anthropic / Gemini 等（抽象为同一接口）。
- 网络调用统一走 BG（便于 CSP/CORS、限流、日志、密钥隔离）。

3) **Local-Server Provider（强隐私且强性能，推荐）**
- 支持连接用户本机的推理服务（例如 Ollama / LM Studio 等）。
- 需要用户授权 `http://localhost:*/*` host permission（可选权限）。

### 5.3 AI Widgets（以组件交付）

- `AI Chat`：对话 + 工具（可调用其他 Widget 能力）
- `AI Quick Ask`：一行输入，快速回答（轻量）
- `AI Wallpaper`：生成/改写背景（可带“风格卡”与 seed）
- `AI Task Helper`：把自然语言转成待办/日程/倒计时等
- `AI Notes`：对笔记做总结/提炼/生成标题

## 6. 受控联网（Network Gateway）

为“隐私优好”提供可解释的边界：

- 所有外部请求集中在 BG 的 `NetworkGateway`：
  - 域名 allowlist（按 Widget 声明 + 用户开关）
  - 统一缓存策略（ETag/TTL）、重试与超时
  - 限流（避免热搜/天气等刷新过于频繁）
  - 可选：请求审计日志（默认关闭）

Widget 侧只写“我要什么数据”，不直接写 `fetch(url)`。

## 7. 存储与迁移（Storage Layer）

### 7.1 分层
- `SettingsStore`（storage.local）：小且频繁读写（主题、布局、开关、Widget 配置）。
- `ObjectStore`（IDB）：大对象（聊天历史、模型、壁纸缓存、图片 blob）。

### 7.2 Schema 迁移
- 所有顶层状态包含 `version`。
- 每次升级提供 `migrate(version -> version+1)` 链式迁移，保证旧用户数据不丢失。

## 8. 与当前仓库结构的映射建议（WXT）

现有：`src/entrypoints/newtab/*` 已存在，可逐步演进为“薄 entrypoint + 厚业务模块”。

建议新增（仅示意）：

```
src/
  newtab/
    app/               # Shell、路由（如需要）、主题、编辑模式
    layout/            # 布局引擎（拖拽/缩放/断点）
    widgets/
      registry.ts      # WidgetDefinition 注册
      builtins/        # 内置组件（天气/待办/热搜/…）
      ai/              # AI 相关组件
    runtime/           # WidgetRuntime、contexts、hooks
  shared/
    storage/           # storage.local + IDB 抽象 + migrations
    net/               # NetworkGateway 协议与类型
    ai/                # AIProvider 接口与实现（部分在 BG）
```

BG 侧建议：

```
src/entrypoints/background/
  services/
    net.ts
    storage.ts
    ai.ts
    scheduler.ts
```

并通过 `src/shared/orpc/router.ts` 暴露服务接口给 UI。

## 9. 迭代路线（建议）

### Phase 0：可扩展骨架（1-2 周）
- WidgetDefinition/Instance/Runtime 体系跑通
- 布局引擎：拖拽 + 缩放 + 持久化 + 编辑模式
- Settings/Theme 基础（背景、暗黑、字体、动效）

### Phase 1：对标 WeTab 的核心组件（2-4 周）
- 搜索、常用网站/ Dock、笔记、待办、天气、倒计时/纪念日、热搜/榜单
- NetworkGateway + 缓存/限流 + 权限声明

### Phase 2：AI 原生（并行推进）
- AIProvider 抽象落地
- Local-Server Provider（Ollama）优先（体验与隐私都好）
- AI Chat / AI Quick Ask / AI Wallpaper 三件套

### Phase 3：高级能力（长期）
- 多空间/多设备布局（导入导出 + 端到端加密同步）
- Widget 模板与“场景一键切换”
- 本地 Embedding + 简易检索记忆（对笔记/待办/收藏）

## 10. 风险与关键决策点

- **本地模型体积**：扩展包体限制与首屏性能冲突 → 推荐“启用后下载 + hash 校验 + IDB 存储”。
- **WebGPU/Worker 支持差异**：Chrome/Edge 体验最佳；Firefox 需要降级路径（远端/本机服务）。
- **远端 AI 的隐私与成本**：默认不启用；用户自带 Key；清晰的“发送哪些内容”提示。
- **第三方 Widget 商店**：受政策与安全限制，v0 不做远端加载代码；可做“内置组件库 + 模板市场（纯数据）”。

## 11. 关键接口草案（TypeScript 方向）

> 下面是“为了后续好扩展”的最小接口形状，便于落地到 `src/shared/orpc/router.ts` 与 `src/newtab/*` 中；不要求一次性实现完。

### 11.1 Widget 类型

```ts
export type WidgetId = string
export type WidgetInstanceId = string

export type WidgetLayout = {
  x: number
  y: number
  w: number
  h: number
  z?: number
}

export type WidgetDefinition<TConfig> = {
  id: WidgetId
  titleKey: string
  descriptionKey?: string
  icon: string
  minSize?: { w: number; h: number }
  maxSize?: { w: number; h: number }
  defaultConfig: TConfig
  // 设计上建议有 schema 校验（zod/valibot/自研轻量），实现可后置
  validateConfig?: (config: unknown) => config is TConfig
  requiredPermissions?: string[]
  requiredHostPermissions?: string[]
  load: () => Promise<{ default: React.ComponentType<{ instanceId: WidgetInstanceId }> }>
}

export type WidgetInstance = {
  instanceId: WidgetInstanceId
  widgetId: WidgetId
  layout: WidgetLayout
  config: unknown
  stateRef?: string
}
```

### 11.2 Dashboard 状态

```ts
export type DashboardV1 = {
  version: 1
  instances: WidgetInstance[]
  theme: {
    mode: "light" | "dark" | "system"
    wallpaper?: { kind: "solid" | "gradient" | "image" | "ai"; value: string }
  }
  privacy: {
    networkEnabled: boolean
    allowlist: string[]
    auditLogEnabled: boolean
  }
  ai: {
    provider: "local" | "remote" | "local-server"
    remoteProvider?: "openai" | "anthropic" | "gemini"
    model?: string
  }
}
```

### 11.3 oRPC 服务边界（建议）

将“UI 直接读写 storage / fetch”的行为收敛到 BG：便于隐私控制与未来迁移。

```ts
export type StorageService = {
  dashboardGet: () => Promise<DashboardV1>
  dashboardSet: (next: DashboardV1) => Promise<void>
  // 或者更细粒度：patch / upsertInstance / removeInstance 等
}

export type NetService = {
  fetchText: (req: { url: string; ttlMs?: number }) => Promise<{ text: string }>
  fetchJson: (req: { url: string; ttlMs?: number }) => Promise<{ json: unknown }>
}

export type AiService = {
  chat: (req: { messages: Array<{ role: string; content: string }> }) => Promise<{ text: string }>
  image: (req: { prompt: string; size?: string }) => Promise<{ dataUrl: string }>
}
```
