# AGENTS.md - TaskTree 开发指南

## 项目概述

TaskTree 是一个基于 Electron 的桌面任务管理应用，支持任务树形拆解、倒计时、延时、备注、拖拽排序、多用户认证和主题切换等功能。使用原生 JavaScript (CommonJS)，无现代前端框架。

## 构建命令

```bash
# 启动开发模式
npm start

# 生成应用图标（SVG → PNG + ICO）
npm run icons

# 构建当前平台安装包
npm run build

# 构建 Windows 便携版 exe
npm run build:win

# 构建 macOS dmg
npm run build:mac
```

### 构建产物

- Windows: `dist/TaskTree-1.1.0.exe` (便携版)
- macOS: `dist/TaskTree-1.1.0.dmg`

## 项目结构

```
tasktree/
├── package.json           # Electron 配置和构建脚本
├── scripts/
│   └── generate-icons.js  # 图标生成脚本（SVG → PNG/ICO）
├── src/
│   ├── main.js           # Electron 主进程（窗口管理、IPC 处理器、数据持久化）
│   ├── preload.js        # 安全 IPC 桥接（contextBridge）
│   ├── index.html        # 主页面入口（HTML + CSS + 引用 bundle.js）
│   ├── bundle.js         # 渲染进程业务代码（modules/ 合并打包，1808 行）
│   ├── icon.svg          # 应用图标源文件
│   └── flash.html        # 闪烁通知窗口（计时到期提醒）
├── build/                # 构建产物目录（icon.png, icon.ico）
└── dist/                 # 安装包输出目录
```

### 渲染进程模块（src/modules/）

| 模块 | 行数 | 职责 |
|------|------|------|
| `state.js` | 67 | 全局状态管理（AppState + State 代理） |
| `api.js` | 44 | 数据持久化层（loadDB/saveDB/generateInviteCode） |
| `auth.js` | 85 | 用户认证（登录/注册/邀请码/登出） |
| `tasks.js` | 294 | 任务 CRUD（增删改查/完成/放弃/排序/重排） |
| `timer.js` | 329 | 倒计时器（启动/暂停/停止/延时/到期处理） |
| `render.js` | 305 | 任务列表渲染（树形节点/内联添加/编辑） |
| `sidebar.js` | 135 | 侧边栏（进度统计/徽章/历史未完成任务） |
| `dateView.js` | 34 | 日期视图切换（过去/今天/未来） |
| `dragdrop.js` | 96 | 拖拽排序（重排序/重排父级） |
| `modals.js` | 173 | 弹窗管理（管理员/计时到期/任务详情/延时历史） |
| `init.js` | 130 | 初始化入口（事件绑定/主题/侧边栏状态/自动登录） |
| `utils.js` | 77 | 工具函数（uid/hash/日期/时间格式化/主题/HTML转义） |

## 代码规范

### JavaScript 版本与模块系统

- 使用 **CommonJS** (`require`/`module.exports`) - Electron 28 项目
- 渲染进程模块通过 `window.ModuleName = ModuleName` 暴露为全局对象
- 禁止使用 ES modules、TypeScript
- 禁止使用构建工具（webpack、vite 等）

### 命名约定

- **变量/函数**: `camelCase`（如 `loadData`、`ensureDataDir`）
- **常量**: `UPPER_SNAKE_CASE`（如 `DATA_DIR`、`DATA_FILE`）
- **文件**: 小写字母，可用连字符（如 `main.js`、`preload.js`）
- **模块对象**: `PascalCase`（如 `Tasks`、`Timer`、`TaskRender`）

### 函数规范

- 保持函数短小专注（单一职责）
- 适当使用 async/callback 模式
- 优雅处理错误（见下文错误处理章节）

### 错误处理

- 文件 I/O 和 JSON 解析必须使用 `try/catch`
- 错误时返回默认值（如空数据对象）
- 禁止向用户暴露堆栈跟踪

```javascript
function loadData() {
  ensureDataDir();
  if (!fs.existsSync(DATA_FILE)) return defaultData;
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  } catch { return defaultData; }
}
```

### 文件操作

- 操作前必须使用 `fs.existsSync()` 检查路径
- 创建目录时使用 `{ recursive: true }` 递归创建
- 使用 `path.join()` 实现跨平台路径拼接

### IPC 通信（主进程 ↔ 渲染进程）

- 使用 `ipcMain.handle()` 处理请求-响应模式
- 使用 `contextIsolation: true` 和 preload 脚本保障安全
- 所有 IPC 通道必须在 `preload.js` 中注册

#### 已注册的 IPC 通道

| 通道 | 方向 | 用途 |
|------|------|------|
| `data:load` | 渲染→主 | 加载数据库 |
| `data:save` | 渲染→主 | 保存数据库 |
| `notify` | 渲染→主 | 系统通知 |
| `window:setTitle` | 渲染→主 | 设置窗口标题 |
| `window:minimize` | 渲染→主 | 最小化窗口 |
| `window:maximize` | 渲染→主 | 最大化/还原窗口 |
| `window:close` | 渲染→主 | 关闭窗口 |
| `window:flashFrame` | 渲染→主 | 任务栏闪烁 |
| `window:focus` | 渲染→主 | 聚焦窗口 |
| `window:restore` | 渲染→主 | 还原并聚焦窗口 |
| `playSound` | 渲染→主 | 播放系统音效（仅 Windows） |

### Electron 窗口配置

- 使用无边框窗口配合自定义标题栏：`frame: false`、`titleBarStyle: 'hiddenInset'`
- 窗口尺寸：1100×780，最小 800×600
- 内置图标不存在时必须提供备用图标
- 背景色：`#f6f7fb`

### UI/HTML 规范

- 所有 UI 位于 `index.html` - 使用原生 DOM API
- CSS 可内联或放在 `<style>` 标签中
- 无需外部 UI 框架
- 保持 HTML 语义化和可访问性
- 支持明暗主题切换（`data-theme` 属性 + CSS 变量）

## 数据模型

### 数据存储

- 数据保存在: `{userData}/tasktree-data/data.json`
- JSON 格式顶层字段：`users`、`tasks`、`inviteCodes`、`currentUser`

### 任务对象字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 唯一标识 |
| `userId` | string | 所属用户 |
| `date` | string | 日期键（YYYY-MM-DD） |
| `parentId` | string\|null | 父任务 ID（树形结构） |
| `text` | string | 任务文本 |
| `done` | boolean | 是否完成 |
| `collapsed` | boolean | 是否折叠子任务 |
| `timerSeconds` | number | 计时总秒数 |
| `timerUsed` | number | 已使用秒数 |
| `estimatedSeconds` | number | 预估秒数 |
| `actualSeconds` | number | 实际使用秒数 |
| `note` | string | 备注 |
| `isOvertime` | boolean | 是否超时 |
| `abandoned` | boolean | 是否放弃 |
| `abandonedAt` | string\|undefined | 放弃时间戳（ISO） |
| `delayHistory` | array\|undefined | 延时历史记录 |
| `createdAt` | string | 创建时间（ISO） |
| `order` | number | 排序权重 |

### 用户对象字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 唯一标识 |
| `username` | string | 用户名 |
| `password` | string | 密码哈希（DJB2 算法） |
| `role` | string | 角色（admin/member） |
| `createdAt` | string | 创建时间（ISO） |

### 邀请码对象字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `code` | string | 6 位大写字母数字码 |
| `used` | boolean | 是否已使用 |
| `usedBy` | string\|null | 使用者用户名 |
| `createdAt` | string | 创建时间（ISO） |

## 数据联动

左侧今日进度面板、任务面板和倒计时完成弹窗中的数据通过 `Sidebar.updateProgress()`、`TaskRender.renderTaskList()` 和 `Api.saveDB()` 形成实时联动：

- 任务状态变化（完成/放弃/超时）时需同时调用这三个函数
- 放弃任务需要设置 `task.abandonedAt` 时间戳，以便正确统计当日放弃数量
- 恢复任务时需删除 `task.abandonedAt` 字段
- 倒计时弹窗操作完成后也要触发数据刷新，确保统计数据准确
- 父任务完成状态会通过 `Tasks.propagateParentStatus()` 向上传播

## 状态管理

使用 `AppState` 对象 + `State` 代理模式管理全局状态：

- `State.DB` - 数据库对象（通过 IPC 与主进程同步）
- `State.currentView` - 当前视图（past/today/future）
- `State.currentDateOffset` - 日期偏移量
- `State.currentTheme` - 当前主题（light/dark）
- `State.sidebarCollapsed` - 侧边栏是否折叠
- `State.timerState` - 计时器状态（taskId/remaining/running/interval/pausedAt/startTime）
- `State.expandedNoteId` - 当前展开备注的任务 ID
- `State.draggedTaskId` - 当前拖拽的任务 ID
- `State.inlineAddParentId` - 当前内联添加子任务的父 ID

## 关键文件参考

| 文件 | 用途 |
|------|------|
| `src/main.js` | 主进程 - 窗口管理、IPC 处理器、数据读写 |
| `src/preload.js` | 安全 IPC 桥接，暴露 11 个 API 方法 |
| `src/index.html` | 主页面入口，UI 结构 + CSS + 引用 bundle.js |
| `src/bundle.js` | 渲染进程业务代码（由 modules/ 合并打包） |
| `src/flash.html` | 计时到期闪烁通知窗口 |
| `src/modules/state.js` | 全局状态定义和代理 |
| `src/modules/tasks.js` | 任务核心逻辑（最复杂模块，294 行） |
| `src/modules/timer.js` | 计时器核心逻辑（329 行） |
| `src/modules/render.js` | DOM 渲染逻辑（305 行） |
| `scripts/generate-icons.js` | 图标生成（SVG→PNG+ICO，依赖 sharp + png-to-ico） |

## 常见开发任务

### 添加新的 IPC 处理器

1. 在 `main.js` 中使用 `ipcMain.handle('channel-name', ...)` 添加处理器
2. 在 `preload.js` 中通过 `contextBridge.exposeInMainWorld` 暴露
3. 在渲染进程中使用 `window.api.channelName()` 调用

### 添加新的渲染进程模块

1. 在 `src/modules/` 下创建新模块文件
2. 使用 `window.ModuleName = ModuleName` 暴露为全局对象
3. 将模块内容追加到 `src/bundle.js`（手动合并）
4. 在 `init.js` 中绑定相关事件

### 修改 UI

编辑 `src/index.html` - 包含所有 HTML 结构、CSS 样式和引用 bundle.js 入口。

### 发布构建

```bash
npm run build:win   # Windows exe（NSIS 安装器 + 便携版）
npm run build:mac   # macOS dmg（x64 + arm64）
```

## 测试

- **未配置测试框架** - 无自动化测试
- 目前通过 `npm start` 手动验证更改

## 依赖库

| 依赖 | 版本 | 用途 |
|------|------|------|
| electron | ^28.0.0 | 桌面应用框架 |
| electron-builder | ^26.8.1 | 打包/构建工具 |
| electron-packager | ^17.1.2 | 备用打包工具 |
| sharp | ^0.33.0 | 图片处理（SVG→PNG） |
| png-to-ico | ^2.1.8 | PNG→ICO 转换 |

无测试或代码检查库。
