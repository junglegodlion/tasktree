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

打包完成后，可执行文件位于：`dist/TaskTree-win32-x64/TaskTree.exe`

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
| 计时 | 鼠标悬停 → 点击「▶」启动 |
| 调整时长 | 底部计时栏点击 −5 / +5 |
| 备注 | 鼠标悬停 → 点击「📋」打开备注面板 |
| 切换日期 | 顶部 ‹ / ● / › 箭头 |
| 管理员 | 左下角"管理面板"→ 生成邀请码、查看用户 |

### 计时器
- 每个任务默认 5 分钟（可实时调整）
- 关闭重开后进度不丢失
- 计时归零：全屏绿色呼吸特效 + 标题闪烁 + 系统通知
- 任务标记完成时，自动停止计时

### 数据存储
数据保存在系统的 userData 目录中：
- **macOS**: `~/Library/Application Support/tasktree/tasktree-data/data.json`
- **Windows**: `%APPDATA%\tasktree\tasktree-data\data.json`
- **Linux**: `~/.config/tasktree/tasktree-data/data.json`

---

## 项目结构

```
tasktree/
├── package.json
├── src/
│   ├── main.js      # Electron 主进程
│   ├── preload.js   # 安全 IPC 桥接
│   └── index.html   # 全部 UI + 业务逻辑
├── build/           # 应用图标
├── scripts/         # 构建脚本
└── README.md
```
