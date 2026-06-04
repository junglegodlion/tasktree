# TaskTree v1.1

**任务拆解 · 计时 · 记录 一体化工具**

## 快速启动

### 开发模式

```bash
cd tasktree
npm install
npm start
```

### 打包为桌面应用

#### Windows

```bash
npm run build:win
```

打包完成后，便携版位于：`dist/TaskTree-1.1.0.exe`

#### macOS

⚠️ **需要Mac系统环境**

```bash
npm run build:mac
```

打包完成后，安装包位于：`dist/TaskTree-1.1.0.dmg`

#### 通用打包命令

```bash
npm run build
```

---

## 功能说明

### 默认账号
- 用户名：`admin`
- 密码：`admin123`
- ⚠️ 首次登录后请在"管理面板"生成邀请码，邀请其他人注册

### 核心功能

| 功能 | 操作方式 |
|------|----------|
| 添加任务 | 在顶部输入框输入，按 Enter |
| 拆解子任务 | 鼠标悬停任务行 → 点击「＋」按钮 |
| 重命名任务 | 双击任务文字 |
| 拖拽排序 | 拖动任务行到目标位置 |
| 拖拽为子任务 | 拖到目标右侧区域，或 Ctrl+拖 |
| 计时 | 鼠标悬停 → 点击「▶」启动 |
| 调整时长 | 底部计时栏点击 −5 / +5 |
| 延时 | 计时到期弹窗中设置延时分钟数 |
| 备注 | 鼠标悬停 → 点击「📋」打开备注面板 |
| 切换日期 | 顶部 ‹ / ● / › 箭头 |
| 主题切换 | 左下角明暗主题切换 |
| 管理员 | 左下角"管理面板"→ 生成邀请码、查看用户 |

### 计时器
- 每个任务默认 5 分钟（可实时调整）
- 关闭重开后进度不丢失
- 计时归零：全屏绿色呼吸特效 + 标题闪烁 + 系统通知
- 任务标记完成时，自动停止计时
- 支持延时功能，到期后可追加时间

### 数据存储
数据保存在系统的 userData 目录中：
- **macOS**: `~/Library/Application Support/tasktree/tasktree-data/data.json`
- **Windows**: `%APPDATA%\tasktree\tasktree-data\data.json`
- **Linux**: `~/.config/tasktree/tasktree-data/data.json`

---

## 项目结构

```
tasktree/
├── package.json           # Electron 配置和构建脚本
├── scripts/
│   └── generate-icons.js  # 图标生成脚本（SVG → PNG/ICO）
├── src/
│   ├── main.js            # Electron 主进程（窗口管理、IPC 处理器、数据持久化）
│   ├── preload.js         # 安全 IPC 桥接（contextBridge）
│   ├── index.html         # 主页面入口（HTML + CSS + 引用 bundle.js）
│   ├── bundle.js          # 渲染进程业务代码（modules/ 合并打包）
│   ├── icon.svg           # 应用图标源文件
│   ├── flash.html         # 闪烁通知窗口（计时到期提醒）
│   └── modules/           # 渲染进程模块
│       ├── state.js       # 全局状态管理（AppState + State 代理）
│       ├── api.js         # 数据持久化层（loadDB/saveDB/generateInviteCode）
│       ├── auth.js        # 用户认证（登录/注册/邀请码/登出）
│       ├── tasks.js       # 任务 CRUD（增删改查/完成/放弃/排序/重排）
│       ├── timer.js       # 倒计时器（启动/暂停/停止/延时/到期处理）
│       ├── render.js      # 任务列表渲染（树形节点/内联添加/编辑）
│       ├── sidebar.js     # 侧边栏（进度统计/徽章/历史未完成任务）
│       ├── dateView.js    # 日期视图切换（过去/今天/未来）
│       ├── dragdrop.js    # 拖拽排序（重排序/重排父级）
│       ├── modals.js      # 弹窗管理（管理员/计时到期/任务详情/延时历史）
│       ├── init.js        # 初始化入口（事件绑定/主题/侧边栏状态/自动登录）
│       └── utils.js       # 工具函数（uid/hash/日期/时间格式化/主题/HTML转义）
├── build/                 # 构建产物目录（icon.png, icon.ico）
└── dist/                  # 安装包输出目录
```

---

## 技术栈

| 依赖 | 版本 | 用途 |
|------|------|------|
| Electron | ^28.0.0 | 桌面应用框架 |
| electron-builder | ^26.8.1 | 打包/构建工具 |
| sharp | ^0.33.0 | 图片处理（SVG→PNG） |
| png-to-ico | ^2.1.8 | PNG→ICO 转换 |

---

## 数据模型

### 任务对象

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
| `note` | string | 备注 |
| `isOvertime` | boolean | 是否超时 |
| `abandoned` | boolean | 是否放弃 |
| `delayHistory` | array\|undefined | 延时历史记录 |
| `createdAt` | string | 创建时间（ISO） |
| `order` | number | 排序权重 |

### 用户对象

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 唯一标识 |
| `username` | string | 用户名 |
| `password` | string | 密码哈希（DJB2 算法） |
| `role` | string | 角色（admin/member） |
| `createdAt` | string | 创建时间（ISO） |

---

## IPC 通信通道

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
| `playSound` | 渲染→主 | 播放系统音效 |
