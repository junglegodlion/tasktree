# AGENTS.md - TaskTree 开发指南

## 项目概述

TaskTree 是一个基于 Electron 的桌面任务管理应用，支持任务拆解、计时和记录功能。使用原生 JavaScript (CommonJS)，无现代前端框架。

## 构建命令

```bash
# 启动开发模式
npm start

# 生成应用图标
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
├── package.json           # Electron 配置和脚本
├── src/
│   ├── main.js           # Electron 主进程
│   ├── preload.js        # 安全 IPC 桥接
│   ├── index.html        # 全部 UI + 业务逻辑（单页应用）
│   └── flash.html        # 闪烁通知窗口
├── build/                # 应用图标
├── scripts/              # 构建脚本
└── README.md
```

## 代码规范

### JavaScript 版本与模块系统

- 使用 **CommonJS** (`require`/`module.exports`) - 这是 Electron 28 项目
- 禁止使用 ES modules、TypeScript
- 禁止使用构建工具（webpack、vite 等）

### 命名约定

- **变量/函数**: `camelCase`（如 `loadData`、`ensureDataDir`）
- **常量**: `UPPER_SNAKE_CASE`（如 `DATA_DIR`、`DATA_FILE`）
- **文件**: 小写字母，可用连字符（如 `main.js`、`preload.js`）

### 函数规范

- 保持函数短小专注（单一职责）
- 适当使用 async/callback 模式
- 优雅处理错误（见下文错误处理章节）

### 错误处理

- 文件 I/O 和 JSON 解析必须使用 `try/catch`
- 错误时返回默认值（如空数据对象）
- 禁止向用户暴露堆栈跟踪

```javascript
// 正确的错误处理示例
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

### Electron 窗口配置

- 使用无边框窗口配合自定义标题栏：`frame: false`、`titleBarStyle: 'hiddenInset'`
- 内置图标不存在时必须提供备用图标
- 设置最小窗口尺寸防止 UI 错乱

### UI/HTML 规范

- 所有 UI 位于 `index.html` - 使用原生 DOM API
- CSS 可内联或放在 `<style>` 标签中
- 无需外部 UI 框架
- 保持 HTML 语义化和可访问性

## 测试

- **未配置测试框架** - 无自动化测试
- 目前通过 `npm start` 手动验证更改

## 数据存储

- 数据保存在: `{userData}/tasktree-data/data.json`
- JSON 格式包含 `users`、`tasks`、`inviteCodes`、`currentUser` 字段

## 关键文件参考

| 文件 | 用途 |
|------|------|
| `src/main.js:1` | 主进程 - 窗口管理、IPC 处理器 |
| `src/preload.js` | 安全 IPC 桥接，暴露安全 API |
| `src/index.html` | 所有 UI 渲染和用户交互逻辑 |

## 常见开发任务

### 添加新的 IPC 处理器

1. 在 `main.js` 中使用 `ipcMain.handle('channel-name', ...)` 添加处理器
2. 在 `preload.js` 中通过 `contextBridge.exposeInMainWorld` 暴露
3. 在渲染进程中使用 `window.api.channelName()` 调用

### 修改 UI

编辑 `src/index.html` - 包含所有 HTML、CSS 和渲染进程 JavaScript。

### 发布构建

```bash
npm run build:win   # Windows exe
npm run build:mac   # macOS dmg
```

## 依赖库

- **Electron 28** - 桌面应用框架
- **electron-builder 26** - 打包/构建工具
- **sharp** - 图片处理（用于生成图标）

无其他测试或代码检查库。
