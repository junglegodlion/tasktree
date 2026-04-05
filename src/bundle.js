// ══════════════════════════════════════════════════════════════
//  STATE - 状态管理模块
// ══════════════════════════════════════════════════════════════

const AppState = {
  DB: { users: [], tasks: [], inviteCodes: [], currentUser: null },
  currentView: 'today',
  currentDateOffset: 0,
  currentTheme: 'light',
  sidebarCollapsed: false,
  expandedNoteId: null,
  draggedTaskId: null,
  inlineAddParentId: null,
  currentDetailTaskId: null,
  detailUpdateInterval: null,
  timerState: {
    taskId: null,
    remaining: 0,
    timerSeconds: 0,
    running: false,
    interval: null,
    pausedAt: null,
    startTime: null
  }
};

const State = {
  get DB() { return AppState.DB; },
  set DB(val) { AppState.DB = val; },
  
  get currentView() { return AppState.currentView; },
  set currentView(val) { AppState.currentView = val; },
  
  get currentDateOffset() { return AppState.currentDateOffset; },
  set currentDateOffset(val) { AppState.currentDateOffset = val; },
  
  get currentTheme() { return AppState.currentTheme; },
  set currentTheme(val) { AppState.currentTheme = val; },
  
  get sidebarCollapsed() { return AppState.sidebarCollapsed; },
  set sidebarCollapsed(val) { AppState.sidebarCollapsed = val; },
  
  get expandedNoteId() { return AppState.expandedNoteId; },
  set expandedNoteId(val) { AppState.expandedNoteId = val; },
  
  get draggedTaskId() { return AppState.draggedTaskId; },
  set draggedTaskId(val) { AppState.draggedTaskId = val; },
  
  get inlineAddParentId() { return AppState.inlineAddParentId; },
  set inlineAddParentId(val) { AppState.inlineAddParentId = val; },
  
  get currentDetailTaskId() { return AppState.currentDetailTaskId; },
  set currentDetailTaskId(val) { AppState.currentDetailTaskId = val; },
  
  get detailUpdateInterval() { return AppState.detailUpdateInterval; },
  set detailUpdateInterval(val) { AppState.detailUpdateInterval = val; },
  
  get timerState() { return AppState.timerState; },
  set timerState(val) { AppState.timerState = val; },
  
  get currentUser() {
    return AppState.DB.users.find(u => u.id === AppState.DB.currentUser);
  }
};

window.AppState = AppState;
window.State = State;

// ══════════════════════════════════════════════════════════════
//  UTILS - 工具函数模块
// ══════════════════════════════════════════════════════════════

const Utils = {
  uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
  },

  hashPassword(p) {
    let h = 5381;
    for (let i = 0; i < p.length; i++) h = ((h << 5) + h) + p.charCodeAt(i);
    return (h >>> 0).toString(16);
  },

  dateKey(offset = 0) {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d.toISOString().slice(0, 10);
  },

  todayKey() {
    return this.dateKey(0);
  },

  formatDate(iso) {
    const d = new Date(iso + 'T00:00:00');
    const days = ['日','一','二','三','四','五','六'];
    return `${d.getMonth()+1}月${d.getDate()}日  周${days[d.getDay()]}`;
  },

  fmtTime(sec) {
    const m = Math.floor(Math.abs(sec) / 60).toString().padStart(2,'0');
    const s = (Math.abs(sec) % 60).toString().padStart(2,'0');
    return (sec < 0 ? '-' : '') + m + ':' + s;
  },

  applyTheme(theme) {
    State.currentTheme = theme === 'dark' ? 'dark' : 'light';
    document.documentElement.dataset.theme = State.currentTheme;
    const iconEl = document.getElementById('theme-toggle-icon');
    const badgeEl = document.getElementById('theme-toggle-badge');
    if (iconEl) iconEl.textContent = State.currentTheme === 'dark' ? '🌙' : '☀️';
    if (badgeEl) badgeEl.textContent = State.currentTheme === 'dark' ? '深色' : '浅色';
    try { localStorage.setItem('tasktree_theme', State.currentTheme); } catch {}
  },

  toggleTheme() {
    Utils.applyTheme(State.currentTheme === 'dark' ? 'light' : 'dark');
  },

  toggleSidebar() {
    State.sidebarCollapsed = !State.sidebarCollapsed;
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('collapsed', State.sidebarCollapsed);
    try { localStorage.setItem('tasktree_sidebar', State.sidebarCollapsed ? 'collapsed' : 'expanded'); } catch {}
  },

  isAncestor(ancestorId, childId) {
    if (ancestorId === childId) return true;
    const child = State.DB.tasks.find(t => t.id === childId);
    if (!child || !child.parentId) return false;
    return Utils.isAncestor(ancestorId, child.parentId);
  },

  getAllTaskIds() {
    return State.DB.tasks.map(t => t.id);
  }
};

window.Utils = Utils;

// ══════════════════════════════════════════════════════════════
//  API - 数据持久化层
// ══════════════════════════════════════════════════════════════

const Api = {
  async loadData() {
    return await api.loadData();
  },

  async saveDB() {
    await api.saveData(State.DB);
  },

  async loadDB() {
    State.DB = await Api.loadData();
    if (!State.DB.users) State.DB.users = [];
    if (!State.DB.tasks) State.DB.tasks = [];
    if (!State.DB.inviteCodes) State.DB.inviteCodes = [];
    if (State.DB.users.length === 0) {
      State.DB.users.push({ 
        id: Utils.uid(), 
        username: 'admin', 
        password: Utils.hashPassword('admin123'), 
        role: 'admin', 
        createdAt: new Date().toISOString() 
      });
      await Api.saveDB();
    }
  },

  async generateInviteCode() {
    const code = Math.random().toString(36).slice(2, 8).toUpperCase();
    State.DB.inviteCodes.push({ 
      code, 
      used: false, 
      usedBy: null, 
      createdAt: new Date().toISOString() 
    });
    await Api.saveDB();
    return code;
  }
};

window.Api = Api;

// ══════════════════════════════════════════════════════════════
//  AUTH - 认证模块
// ══════════════════════════════════════════════════════════════

let isAuthMode = 'login';

const Auth = {
  toggleMode() {
    isAuthMode = isAuthMode === 'login' ? 'register' : 'login';
    const isReg = isAuthMode === 'register';
    document.getElementById('auth-title').textContent = isReg ? '创建账号' : '欢迎回来';
    document.getElementById('auth-sub').textContent = isReg ? '使用邀请码注册' : '登录你的 TaskTree 账号';
    document.getElementById('auth-submit').textContent = isReg ? '注册' : '登录';
    document.getElementById('auth-toggle-text').textContent = isReg ? '已有账号？' : '还没有账号？';
    document.getElementById('auth-toggle-link').textContent = isReg ? '登录' : '注册';
    document.getElementById('invite-group').style.display = isReg ? '' : 'none';
    document.getElementById('auth-error').textContent = '';
  },

  async doAuth() {
    const username = document.getElementById('auth-username').value.trim();
    const password = document.getElementById('auth-password').value;
    const errEl = document.getElementById('auth-error');
    errEl.textContent = '';

    if (!username || !password) { errEl.textContent = '请填写用户名和密码'; return; }

    if (isAuthMode === 'login') {
      const user = State.DB.users.find(u => u.username === username && u.password === Utils.hashPassword(password));
      if (!user) { errEl.textContent = '用户名或密码错误'; return; }
      State.DB.currentUser = user.id;
      await Api.saveDB();
      Auth.enterApp(user);
    } else {
      const inviteCode = document.getElementById('auth-invite').value.trim();
      if (State.DB.users.find(u => u.username === username)) { errEl.textContent = '用户名已被使用'; return; }
      if (State.DB.users.length > 0) {
        const code = State.DB.inviteCodes.find(c => c.code === inviteCode && !c.used);
        if (!code) { errEl.textContent = '邀请码无效或已使用'; return; }
        code.used = true; code.usedBy = username;
      }
      const user = { 
        id: Utils.uid(), 
        username, 
        password: Utils.hashPassword(password), 
        role: 'member', 
        createdAt: new Date().toISOString() 
      };
      State.DB.users.push(user);
      State.DB.currentUser = user.id;
      await Api.saveDB();
      Auth.enterApp(user);
    }
  },

  enterApp(user) {
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('main-layout').style.display = 'flex';
    document.getElementById('user-name-display').textContent = user.username;
    document.getElementById('user-avatar').textContent = user.username[0].toUpperCase();
    document.getElementById('user-role-display').textContent = user.role === 'admin' ? '管理员' : '成员';
    if (user.role === 'admin') document.getElementById('admin-nav').style.display = '';
    State.currentDateOffset = 0;
    DateView.setView('today');
    TaskRender.renderTaskList();
    Sidebar.updateBadges();
  },

  async logout() {
    Timer.stop();
    State.DB.currentUser = null;
    await Api.saveDB();
    document.getElementById('main-layout').style.display = 'none';
    document.getElementById('auth-screen').style.display = 'flex';
    document.getElementById('auth-password').value = '';
    document.getElementById('auth-error').textContent = '';
  },

  getCurrentUser() {
    return State.DB.users.find(u => u.id === State.DB.currentUser);
  }
};

window.Auth = Auth;
window.isAuthMode = isAuthMode;

// ══════════════════════════════════════════════════════════════
//  DATEVIEW - 日期视图模块
// ══════════════════════════════════════════════════════════════

const DateView = {
  setView(view) {
    State.currentView = view;
    if (view === 'today') State.currentDateOffset = 0;
    else if (view === 'past') State.currentDateOffset = -1;
    else if (view === 'future') State.currentDateOffset = 1;
    ['past','today','future'].forEach(v => {
      document.getElementById('btn-'+v).classList.toggle('active', v === view);
    });
    DateView.updateDateDisplay();
    TaskRender.renderTaskList();
    Sidebar.updateBadges();
  },

  offsetDate(delta) {
    if (delta === 0) { State.currentDateOffset = 0; State.currentView = 'today'; }
    else State.currentDateOffset += delta;
    if (State.currentDateOffset < 0) State.currentView = 'past';
    else if (State.currentDateOffset > 0) State.currentView = 'future';
    else State.currentView = 'today';
    ['past','today','future'].forEach(v => {
      document.getElementById('btn-'+v).classList.toggle('active', v === State.currentView);
    });
    DateView.updateDateDisplay();
    TaskRender.renderTaskList();
    Sidebar.updateBadges();
  },

  updateDateDisplay() {
    const key = Utils.dateKey(State.currentDateOffset);
    let label;
    if (State.currentDateOffset === 0) label = '今天';
    else if (State.currentDateOffset === -1) label = '昨天';
    else if (State.currentDateOffset === 1) label = '明天';
    else label = Utils.formatDate(key);
    document.getElementById('date-title').textContent = label;
    document.getElementById('date-sub').textContent = Utils.formatDate(key);
  }
};

window.DateView = DateView;

// ══════════════════════════════════════════════════════════════
//  TASKS - 任务 CRUD 模块
// ══════════════════════════════════════════════════════════════

const Tasks = {
  tasksForDate(dateISO) {
    const userId = State.DB.currentUser;
    return State.DB.tasks.filter(t => t.userId === userId && t.date === dateISO && !t.abandoned);
  },

  rootTasksForDate(dateISO) {
    const tasks = Tasks.tasksForDate(dateISO);
    return tasks.filter(t => !t.parentId).sort((a,b) => (a.order || 0) - (b.order || 0));
  },

  childrenOf(parentId) {
    return State.DB.tasks.filter(t => t.parentId === parentId).sort((a,b) => (a.order || 0) - (b.order || 0));
  },

  async addTask(text, parentId = null, shouldRender = true) {
    const date = Utils.dateKey(State.currentDateOffset);
    const siblings = parentId ? Tasks.childrenOf(parentId) : Tasks.rootTasksForDate(date);
    const maxOrder = siblings.length > 0 ? Math.max(...siblings.map(t => t.order || 0)) : 0;
    const task = {
      id: Utils.uid(), 
      userId: State.DB.currentUser, 
      date, 
      parentId,
      text, 
      done: false, 
      collapsed: false,
      timerSeconds: 5 * 60, 
      timerUsed: 0, 
      estimatedSeconds: 5 * 60, 
      actualSeconds: 0,
      note: '', 
      isOvertime: false, 
      abandoned: false,
      createdAt: new Date().toISOString(),
      order: maxOrder + 1
    };
    State.DB.tasks.push(task);
    await Api.saveDB();
    Sidebar.updateBadges();
    if (shouldRender) TaskRender.renderTaskList();
    return task;
  },

  beginAddChild(parentId) {
    State.inlineAddParentId = parentId;
    const parent = State.DB.tasks.find(t => t.id === parentId);
    if (parent && parent.collapsed) parent.collapsed = false;
    Api.saveDB();
    TaskRender.renderTaskList();
    setTimeout(() => {
      const input = document.querySelector(`input[data-inline-child-for="${parentId}"]`);
      if (input) input.focus();
    }, 0);
  },

  async commitInlineChild(parentId, text) {
    const value = (text || '').trim();
    if (!value) return;
    State.inlineAddParentId = parentId;
    await Tasks.addTask(value, parentId, false);
    TaskRender.renderTaskList();
  },

  cancelInlineChild() {
    State.inlineAddParentId = null;
    TaskRender.renderTaskList();
  },

  async deleteTask(taskId) {
    const toDelete = [taskId];
    const collectChildren = (pid) => {
      Tasks.childrenOf(pid).forEach(c => { toDelete.push(c.id); collectChildren(c.id); });
    };
    collectChildren(taskId);
    State.DB.tasks = State.DB.tasks.filter(t => !toDelete.includes(t.id));
    if (State.timerState.taskId && toDelete.includes(State.timerState.taskId)) Timer.stop();
    if (State.expandedNoteId && toDelete.includes(State.expandedNoteId)) State.expandedNoteId = null;
    await Api.saveDB();
    Sidebar.updateBadges();
    TaskRender.renderTaskList();
  },

  async toggleDone(taskId) {
    const task = State.DB.tasks.find(t => t.id === taskId);
    if (!task) return;
    task.done = !task.done;
    
    if (task.done && State.timerState.taskId) {
      const isThisTask = State.timerState.taskId === taskId;
      const collectChildrenIds = (pid) => {
        const ids = [];
        Tasks.childrenOf(pid).forEach(c => { ids.push(c.id); ids.push(...collectChildrenIds(c.id)); });
        return ids;
      };
      const childIds = collectChildrenIds(taskId);
      if (isThisTask || childIds.includes(State.timerState.taskId)) {
        Timer.stop();
      }
    }
    
    const markChildren = (pid, done) => {
      Tasks.childrenOf(pid).forEach(c => { 
        c.done = done;
        markChildren(c.id, done); 
      });
    };
    markChildren(taskId, task.done);
    await Tasks.propagateParentStatus(task.parentId);
    await Api.saveDB();
    TaskRender.renderTaskList();
    Sidebar.updateProgress();
  },

  async toggleAbandoned(taskId) {
    const task = State.DB.tasks.find(t => t.id === taskId);
    if (!task) return;
    task.abandoned = !task.abandoned;
    if (task.abandoned) {
      task.abandonedAt = new Date().toISOString();
    } else {
      delete task.abandonedAt;
    }
    
    if (task.abandoned && State.timerState.taskId) {
      const isThisTask = State.timerState.taskId === taskId;
      const collectChildrenIds = (pid) => {
        const ids = [];
        Tasks.childrenOf(pid).forEach(c => { ids.push(c.id); ids.push(...collectChildrenIds(c.id)); });
        return ids;
      };
      const childIds = collectChildrenIds(taskId);
      if (isThisTask || childIds.includes(State.timerState.taskId)) {
        Timer.stop();
      }
    }
    
    const markChildrenAbandoned = (pid, abandoned) => {
      Tasks.childrenOf(pid).forEach(c => { 
        c.abandoned = abandoned;
        if (abandoned) {
          c.abandonedAt = new Date().toISOString();
        } else {
          delete c.abandonedAt;
        }
        markChildrenAbandoned(c.id, abandoned); 
      });
    };
    markChildrenAbandoned(taskId, task.abandoned);
    await Api.saveDB();
    TaskRender.renderTaskList();
    Sidebar.updateProgress();
  },

  async propagateParentStatus(parentId) {
    if (!parentId) return;
    const parent = State.DB.tasks.find(t => t.id === parentId);
    if (!parent) return;
    const children = Tasks.childrenOf(parentId);
    if (children.length === 0) return;
    const allDone = children.every(c => c.done);
    parent.done = allDone;
    await Tasks.propagateParentStatus(parent.parentId);
  },

  async renameTask(taskId, newText) {
    const task = State.DB.tasks.find(t => t.id === taskId);
    if (task) { task.text = newText; await Api.saveDB(); }
  },

  async toggleCollapse(taskId) {
    const task = State.DB.tasks.find(t => t.id === taskId);
    if (task) { task.collapsed = !task.collapsed; await Api.saveDB(); TaskRender.renderTaskList(); }
  },

  toggleNotePanel(taskId) {
    if (State.expandedNoteId === taskId) {
      State.expandedNoteId = null;
    } else {
      State.expandedNoteId = taskId;
    }
    TaskRender.renderTaskList();
    if (State.expandedNoteId) {
      setTimeout(() => {
        const ta = document.querySelector(`#note-panel-${taskId} .task-note-textarea`);
        if (ta) ta.focus();
      }, 0);
    }
  },

  taskCheckState(taskId) {
    const children = Tasks.childrenOf(taskId);
    if (children.length === 0) {
      return State.DB.tasks.find(t => t.id === taskId)?.done ? 'checked' : '';
    }
    const doneCount = children.filter(c => c.done).length;
    if (doneCount === 0) return '';
    if (doneCount === children.length) return 'checked';
    return 'partial';
  },

  async reorderTask(taskId, targetId, position) {
    const task = State.DB.tasks.find(t => t.id === taskId);
    const target = State.DB.tasks.find(t => t.id === targetId);
    if (!task || !target) return;
    
    const targetParentId = target.parentId;
    task.parentId = targetParentId;
    
    const siblings = targetParentId 
      ? Tasks.childrenOf(targetParentId)
      : Tasks.rootTasksForDate(task.date);
    
    const targetOrder = target.order || 9999;
    
    siblings.forEach(t => {
      if (t.id === taskId) return;
      if (position === 'before') {
        if ((t.order || 0) >= targetOrder && t.id !== taskId) {
          t.order = (t.order || 0) + 1;
        }
      } else {
        if ((t.order || 0) > targetOrder) {
          t.order = (t.order || 0) + 1;
        }
      }
    });
    
    if (position === 'before') {
      task.order = targetOrder - 0.5;
    } else {
      task.order = targetOrder + 0.5;
    }
    
    Tasks.normalizeOrder(targetParentId, task.date);
    
    await Api.saveDB();
    TaskRender.renderTaskList();
  },

  async reparentTask(taskId, newParentId) {
    const task = State.DB.tasks.find(t => t.id === taskId);
    if (!task) return;
    task.parentId = newParentId;
    Tasks.normalizeOrder(newParentId, task.date);
    await Api.saveDB();
    TaskRender.renderTaskList();
  },

  normalizeOrder(parentId, date) {
    const siblings = parentId 
      ? Tasks.childrenOf(parentId)
      : State.DB.tasks.filter(t => t.userId === State.DB.currentUser && !t.parentId && t.date === date);
    
    siblings.sort((a, b) => (a.order || 0) - (b.order || 0));
    siblings.forEach((t, idx) => {
      t.order = idx + 1;
    });
  }
};

window.Tasks = Tasks;

// ══════════════════════════════════════════════════════════════
//  SIDEBAR - 侧边栏模块
// ══════════════════════════════════════════════════════════════

const Sidebar = {
  updateBadges() {
    const uid = State.DB.currentUser;
    const today = Utils.todayKey();
    const myTasks = State.DB.tasks.filter(t => t.userId === uid);
    const past   = myTasks.filter(t => t.date < today).length;
    const todayC = myTasks.filter(t => t.date === today).length;
    const future = myTasks.filter(t => t.date > today).length;
    document.getElementById('badge-past').textContent   = past;
    document.getElementById('badge-today').textContent  = todayC;
    document.getElementById('badge-future').textContent = future;
    Sidebar.updateProgress();
  },

  updateProgress() {
    const key = Utils.todayKey();
    const userId = State.DB.currentUser || (State.DB.users[0] && State.DB.users[0].id);
    if (!userId) return;
    
    const userTodayTasks = State.DB.tasks.filter(t => t.userId === userId && t.date === key);
    const activeTasks = userTodayTasks.filter(t => !t.abandoned);
    
    const completedTasks = activeTasks.filter(t => t.done).length;
    const totalTasks = activeTasks.filter(t => !t.done).length;
    const overtimeTasks = activeTasks.filter(t => t.isOvertime).length;
    const abandonedTasks = State.DB.tasks.filter(t => t.userId === userId && t.abandoned && 
      t.abandonedAt && t.abandonedAt.startsWith(key)).length;
    
    const total = totalTasks + completedTasks;
    const percent = total > 0 ? Math.round((completedTasks / total) * 100) : 0;
    
    document.getElementById('progress-percent').textContent = percent + '%';
    document.getElementById('stat-completed').textContent = completedTasks;
    document.getElementById('stat-active').textContent = totalTasks;
    document.getElementById('stat-overtime').textContent = overtimeTasks;
    document.getElementById('stat-abandoned').textContent = abandonedTasks;
    document.getElementById('stat-total').textContent = total;
    
    const ringFill = document.getElementById('progress-ring-fill');
    ringFill.setAttribute('stroke-dasharray', percent + ', 100');
  }
};

window.Sidebar = Sidebar;

// ══════════════════════════════════════════════════════════════
//  RENDER - 渲染模块
// ══════════════════════════════════════════════════════════════

const TaskRender = {
  renderTaskList() {
    const date = Utils.dateKey(State.currentDateOffset);
    if (State.inlineAddParentId && !Tasks.tasksForDate(date).some(t => t.id === State.inlineAddParentId)) {
      State.inlineAddParentId = null;
    }
    if (State.expandedNoteId && !State.DB.tasks.find(t => t.id === State.expandedNoteId)) {
      State.expandedNoteId = null;
    }
    const roots = Tasks.rootTasksForDate(date);
    const container = document.getElementById('task-list');

    if (roots.length === 0) {
      container.innerHTML = `<div class="empty-state">
        <div class="empty-icon">🌱</div>
        <p>今天还没有任务，添加第一个吧</p>
      </div>`;
      Sidebar.updateProgress();
      return;
    }

    container.innerHTML = '';
    roots.forEach(task => container.appendChild(TaskRender.renderNode(task)));
    Sidebar.updateProgress();
    
    if (State.inlineAddParentId) {
      setTimeout(() => {
        const input = document.querySelector(`input[data-inline-child-for="${State.inlineAddParentId}"]`);
        if (input) input.focus();
      }, 0);
    }
  },

  renderNode(task) {
    const children = Tasks.childrenOf(task.id);
    const wantsInlineAdd = State.inlineAddParentId === task.id;
    const hasChildren = children.length > 0 || wantsInlineAdd;
    const checkState = Tasks.taskCheckState(task.id);
    const isRunning = State.timerState.taskId === task.id && State.timerState.running;

    const node = document.createElement('div');
    node.className = 'task-node';
    node.dataset.id = task.id;

    const row = document.createElement('div');
    row.className = 'task-row' + (task.abandoned ? ' abandoned' : '');
    row.dataset.id = task.id;
    row.addEventListener('mouseenter', () => row.dataset.hovered = '1');
    row.addEventListener('mouseleave', () => row.dataset.hovered = '0');

    // Toggle
    const toggle = document.createElement('div');
    toggle.className = 'task-toggle' + (task.collapsed ? ' collapsed' : '');
    toggle.innerHTML = hasChildren ? (task.collapsed ? '▶' : '▼') : '&nbsp;';
    if (hasChildren) toggle.onclick = () => Tasks.toggleCollapse(task.id);
    row.appendChild(toggle);

    // Check
    const check = document.createElement('div');
    check.className = 'task-check ' + checkState;
    check.innerHTML = '<span class="check-icon">' + (checkState === 'partial' ? '−' : '✓') + '</span>';
    if (!task.abandoned) check.onclick = () => Tasks.toggleDone(task.id);
    else check.style.cursor = 'default';
    row.appendChild(check);

    // Label
    const label = document.createElement('div');
    label.className = 'task-label' + (task.done ? ' done' : '') + (task.abandoned ? ' abandoned' : '');
    
    const labelContent = document.createElement('span');
    labelContent.textContent = task.text;
    labelContent.title = '双击修改任务名称';
    label.appendChild(labelContent);
    
    if (task.abandoned) {
      const abandonedTag = document.createElement('span');
      abandonedTag.className = 'abandoned-tag';
      abandonedTag.innerHTML = '<span class="abandoned-icon">✕</span>已放弃';
      abandonedTag.style.cssText = 'font-size: 10px; padding: 1px 6px; background: rgba(239,68,68,0.15); color: var(--red); border-radius: 4px; margin-left: 8px;';
      label.appendChild(abandonedTag);
    }
    
    if (task.isOvertime) {
      const overtimeTag = document.createElement('span');
      overtimeTag.className = 'overtime-tag';
      overtimeTag.textContent = task.done ? '✓曾超时' : '⚠️超时';
      overtimeTag.style.cssText = 'font-size: 10px; padding: 1px 6px; background: ' + (task.done ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)') + '; color: ' + (task.done ? 'var(--emerald)' : 'var(--amber)') + '; border-radius: 4px; margin-left: 8px;';
      label.appendChild(overtimeTag);
    }
    
    label.title = '';
    if (!task.abandoned) {
      label.ondblclick = () => TaskRender.startEditLabel(label, task.id);
    }
    row.appendChild(label);

    // Timer display
    if (task.timerSeconds > 0 && !task.abandoned) {
      const taskRemaining = task.timerSeconds - task.timerUsed;
      const isThisTask = State.timerState.taskId === task.id;
      const displayRemaining = isThisTask ? State.timerState.remaining : (task.done ? 0 : taskRemaining);
      
      const td = document.createElement('div');
      td.className = 'task-timer-display' + (isThisTask && isRunning ? ' running' : '') + (displayRemaining > 0 && displayRemaining < 60 ? ' urgent' : '') + (task.done ? ' done' : '');
      td.textContent = task.done ? '完成' : Utils.fmtTime(displayRemaining);
      td.style.cursor = 'pointer';
      td.title = task.done ? '任务已完成' : (isThisTask ? '点击暂停' : '点击恢复计时');
      td.onclick = () => {
        if (task.done) return;
        if (isThisTask && isRunning) Timer.togglePause();
        else Timer.start(task.id);
      };
      row.appendChild(td);
    }

    // Actions
    const actions = document.createElement('div');
    actions.className = 'task-actions';

    // Timer btn
    const timerBtn = document.createElement('button');
    timerBtn.className = 'action-btn ' + (isRunning ? 'running' : 'run');
    timerBtn.title = task.abandoned ? '无法为已放弃的任务计时' : (isRunning ? '暂停计时' : '开始计时');
    timerBtn.textContent = isRunning ? '⏸' : '▶';
    if (!task.abandoned) {
      timerBtn.onclick = () => {
        if (State.timerState.taskId === task.id) Timer.togglePause();
        else Timer.start(task.id);
      };
    } else {
      timerBtn.style.opacity = '0.3';
    }
    actions.appendChild(timerBtn);

    // Add child btn
    const addBtn = document.createElement('button');
    addBtn.className = 'action-btn';
    addBtn.title = task.abandoned ? '无法为已放弃的任务添加子任务' : '添加子任务';
    addBtn.textContent = '＋';
    if (!task.abandoned) addBtn.onclick = () => Tasks.beginAddChild(task.id);
    else addBtn.style.opacity = '0.3';
    actions.appendChild(addBtn);

    // Note btn
    const noteBtn = document.createElement('button');
    noteBtn.className = 'action-btn note';
    noteBtn.title = task.note ? '查看/编辑备注' : '添加备注';
    noteBtn.textContent = task.note ? '📝' : '📋';
    noteBtn.onclick = () => Tasks.toggleNotePanel(task.id);
    actions.appendChild(noteBtn);

    // Detail btn
    const detailBtn = document.createElement('button');
    detailBtn.className = 'action-btn';
    detailBtn.title = '查看详情';
    detailBtn.textContent = '🔍';
    detailBtn.onclick = () => Modals.showTaskDetail(task.id);
    actions.appendChild(detailBtn);

    // Abandon btn
    const abandonBtn = document.createElement('button');
    abandonBtn.className = 'action-btn abandon' + (task.abandoned ? ' abandoned' : '');
    abandonBtn.title = task.abandoned ? '恢复任务' : '放弃任务';
    abandonBtn.textContent = task.abandoned ? '↺' : '⚐';
    abandonBtn.onclick = () => Tasks.toggleAbandoned(task.id);
    actions.appendChild(abandonBtn);

    // Delete btn
    const delBtn = document.createElement('button');
    delBtn.className = 'action-btn del';
    delBtn.title = '删除任务';
    delBtn.textContent = '🗑';
    delBtn.onclick = () => Tasks.deleteTask(task.id);
    actions.appendChild(delBtn);

    row.appendChild(actions);

    // Drag events
    DragDrop.attachDragEvents(row, task.id);

    node.appendChild(row);

    // Note panel
    const notePanel = document.createElement('div');
    notePanel.className = 'task-note-panel' + (State.expandedNoteId === task.id ? ' visible' : '');
    notePanel.id = 'note-panel-' + task.id;
    const noteTextarea = document.createElement('textarea');
    noteTextarea.className = 'task-note-textarea';
    noteTextarea.placeholder = '添加备注...';
    noteTextarea.value = task.note || '';
    noteTextarea.oninput = async (e) => {
      task.note = e.target.value;
      await Api.saveDB();
    };
    noteTextarea.onkeydown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        State.expandedNoteId = null;
        TaskRender.renderTaskList();
      }
    };
    notePanel.appendChild(noteTextarea);
    const noteHint = document.createElement('div');
    noteHint.className = 'task-note-hint';
    noteHint.textContent = '按 Esc 关闭备注面板';
    notePanel.appendChild(noteHint);
    node.appendChild(notePanel);

    // Children
    if (hasChildren && !task.collapsed) {
      const childContainer = document.createElement('div');
      childContainer.className = 'task-children';

      if (wantsInlineAdd) {
        childContainer.appendChild(TaskRender.renderInlineAdd(task.id));
      }

      children.forEach(c => childContainer.appendChild(TaskRender.renderNode(c)));
      node.appendChild(childContainer);
    }

    return node;
  },

  renderInlineAdd(parentId) {
    const wrap = document.createElement('div');
    wrap.className = 'task-row';
    wrap.style.background = 'var(--bg2)';
    wrap.style.border = '1px solid var(--border)';
    wrap.style.margin = '6px 0';
    wrap.style.padding = '8px 10px';

    const spacer = document.createElement('div');
    spacer.style.width = '16px';
    wrap.appendChild(spacer);

    const dot = document.createElement('div');
    dot.style.width = '18px';
    dot.style.height = '18px';
    dot.style.borderRadius = '5px';
    dot.style.border = '2px dashed var(--border2)';
    dot.style.opacity = '0.7';
    wrap.appendChild(dot);

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = '输入子任务，Enter 创建，Esc 取消…';
    input.dataset.inlineChildFor = parentId;
    input.dataset.inlineCommitted = '0';
    input.style.flex = '1';
    input.style.background = 'transparent';
    input.style.border = 'none';
    input.style.color = 'var(--text)';
    input.style.fontSize = '13.5px';
    input.onkeydown = async (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        Tasks.cancelInlineChild();
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        if (input.dataset.inlineCommitted === '1') return;
        input.dataset.inlineCommitted = '1';
        const v = e.target.value;
        State.inlineAddParentId = null;
        await Tasks.commitInlineChild(parentId, v);
        TaskRender.renderTaskList();
      }
    };
    input.onblur = async (e) => {
      if (input.dataset.inlineCommitted === '1') return;
      input.dataset.inlineCommitted = '1';
      const v = e.target.value;
      State.inlineAddParentId = null;
      if (v && v.trim()) await Tasks.commitInlineChild(parentId, v);
      TaskRender.renderTaskList();
    };
    wrap.appendChild(input);

    return wrap;
  },

  startEditLabel(labelEl, taskId) {
    labelEl.contentEditable = 'true';
    labelEl.focus();
    const range = document.createRange();
    range.selectNodeContents(labelEl);
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);
    const finish = async () => {
      labelEl.contentEditable = 'false';
      const newText = labelEl.textContent.trim();
      if (newText) await Tasks.renameTask(taskId, newText);
      else TaskRender.renderTaskList();
    };
    labelEl.onblur = finish;
    labelEl.onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); labelEl.blur(); } };
  }
};

window.TaskRender = TaskRender;

// ══════════════════════════════════════════════════════════════
//  TIMER - 计时器模块
// ══════════════════════════════════════════════════════════════

let titleFlash = null;

const Timer = {
  start(taskId) {
    if (State.timerState.interval) clearInterval(State.timerState.interval);

    if (State.timerState.taskId && State.timerState.taskId !== taskId) {
      const prevTask = State.DB.tasks.find(t => t.id === State.timerState.taskId);
      if (prevTask) {
        const elapsed = State.timerState.running 
          ? Math.floor((Date.now() - State.timerState.startTime) / 1000)
          : State.timerState.pausedAt || 0;
        prevTask.timerUsed = Math.min(prevTask.timerSeconds, elapsed);
        Api.saveDB();
      }
    }

    const task = State.DB.tasks.find(t => t.id === taskId);
    if (!task) return;

    const remaining = task.timerSeconds - task.timerUsed;
    State.timerState = {
      taskId,
      remaining: Math.max(remaining, 0),
      timerSeconds: task.timerSeconds,
      running: true,
      interval: null,
      pausedAt: task.timerUsed,
      startTime: Date.now()
    };
    State.timerState.interval = setInterval(Timer.tick, 100);

    Timer.updatePanel();
    TaskRender.renderTaskList();
  },

  tick() {
    if (!State.timerState.running) return;
    
    const elapsed = Math.floor((Date.now() - State.timerState.startTime) / 1000);
    State.timerState.remaining = Math.max(State.timerState.timerSeconds - State.timerState.pausedAt - elapsed, 0);

    const task = State.DB.tasks.find(t => t.id === State.timerState.taskId);
    if (task) {
      task.timerUsed = State.timerState.timerSeconds - State.timerState.remaining;
      task.actualSeconds = task.timerUsed;
      if (State.timerState.remaining % 5 === 0) Api.saveDB();
    }

    Timer.updatePanel();

    const node = document.querySelector(`.task-node[data-id="${State.timerState.taskId}"]`);
    if (node) {
      const td = node.querySelector('.task-timer-display');
      if (td) { td.textContent = Utils.fmtTime(State.timerState.remaining); }
    }

    if (State.timerState.remaining <= 0) {
      Timer.onExpired();
    }
  },

  togglePause() {
    if (!State.timerState.taskId) return;
    if (State.timerState.running) {
      State.timerState.running = false;
      State.timerState.pausedAt = (State.timerState.pausedAt || 0) + Math.floor((Date.now() - State.timerState.startTime) / 1000);
      clearInterval(State.timerState.interval);
      document.getElementById('timer-pause-btn').textContent = '继续';
      Api.saveDB();
    } else {
      State.timerState.running = true;
      State.timerState.startTime = Date.now();
      State.timerState.interval = setInterval(Timer.tick, 100);
      document.getElementById('timer-pause-btn').textContent = '暂停';
    }
  },

  stop() {
    if (State.timerState.taskId) {
      const task = State.DB.tasks.find(t => t.id === State.timerState.taskId);
      if (task) {
        const elapsed = State.timerState.running 
          ? Math.floor((Date.now() - State.timerState.startTime) / 1000)
          : State.timerState.pausedAt || 0;
        task.timerUsed = Math.min(task.timerSeconds, elapsed);
        task.actualSeconds = task.timerUsed;
        Api.saveDB();
      }
    }
    clearInterval(State.timerState.interval);
    State.timerState = { taskId: null, remaining: 0, timerSeconds: 0, running: false, interval: null, pausedAt: null, startTime: null };
    document.getElementById('timer-panel').classList.remove('visible');
    Timer.stopTitleFlash();
    TaskRender.renderTaskList();
  },

  adjust(deltaMins) {
    if (!State.timerState.taskId) return;
    const newSeconds = deltaMins * 60;
    const task = State.DB.tasks.find(t => t.id === State.timerState.taskId);
    if (task) {
      State.timerState.remaining += newSeconds;
      if (State.timerState.remaining < 0) State.timerState.remaining = 0;
      
      task.timerSeconds += newSeconds;
      task.estimatedSeconds = task.timerSeconds;
      if (task.timerSeconds < 60) task.timerSeconds = 60;
      if (task.estimatedSeconds < 60) task.estimatedSeconds = 60;
      if (task.timerSeconds - task.timerUsed < 0) task.timerUsed = 0;
      
      State.timerState.timerSeconds = task.timerSeconds;
      
      if (State.timerState.running) {
        State.timerState.startTime = Date.now() - ((State.timerState.timerSeconds - State.timerState.remaining - (State.timerState.pausedAt || 0)) * 1000);
      }
      Api.saveDB();
    }
    Timer.updatePanel();
  },

  showTimeInput() {
    if (!State.timerState.taskId) return;
    const input = document.getElementById('timer-input');
    const field = document.getElementById('timer-input-field');
    const mins = Math.ceil(Math.max(State.timerState.remaining / 60, 1));
    field.value = mins;
    field.min = 1;
    field.max = 180;
    input.classList.add('visible');
    field.focus();
    field.select();
  },

  hideTimeInput() {
    const input = document.getElementById('timer-input');
    const field = document.getElementById('timer-input-field');
    field.value = '';
    input.classList.remove('visible');
  },

  confirmTime() {
    const field = document.getElementById('timer-input-field');
    const mins = parseInt(field.value);
    if (mins >= 1 && mins <= 180 && !isNaN(mins)) {
      const task = State.DB.tasks.find(t => t.id === State.timerState.taskId);
      if (task) {
        if (!task.estimatedSeconds || task.estimatedSeconds === 5 * 60) {
          task.estimatedSeconds = mins * 60;
        }
        task.timerSeconds = mins * 60;
        task.timerUsed = 0;
        State.timerState.remaining = task.timerSeconds;
        State.timerState.timerSeconds = task.timerSeconds;
        if (State.timerState.running) {
          State.timerState.startTime = Date.now();
          State.timerState.pausedAt = 0;
        } else {
          State.timerState.pausedAt = 0;
        }
        Api.saveDB();
      } else {
        State.timerState.remaining = mins * 60;
        State.timerState.timerSeconds = mins * 60;
      }
      Timer.updatePanel();
      Timer.hideTimeInput();
    }
  },

  updatePanel() {
    const panel = document.getElementById('timer-panel');
    if (!State.timerState.taskId) { panel.classList.remove('visible'); return; }
    panel.classList.add('visible');

    const task = State.DB.tasks.find(t => t.id === State.timerState.taskId);
    document.getElementById('timer-task-name-txt').textContent = task?.text || '-';

    const clock = document.getElementById('timer-clock');
    clock.textContent = Utils.fmtTime(State.timerState.remaining);
    clock.className = 'timer-clock' + (State.timerState.running ? ' running' : '') + (State.timerState.remaining < 60 && State.timerState.remaining > 0 ? ' urgent' : '');
    document.getElementById('timer-pause-btn').textContent = State.timerState.running ? '暂停' : '继续';
    
    const estimatedEl = document.getElementById('timer-estimated');
    const actualEl = document.getElementById('timer-actual');
    if (task) {
      estimatedEl.textContent = Utils.fmtTime(task.estimatedSeconds || task.timerSeconds);
      const actual = task.actualSeconds || task.timerUsed || 0;
      actualEl.textContent = Utils.fmtTime(actual);
    } else {
      estimatedEl.textContent = '5分钟';
      actualEl.textContent = '0分钟';
    }
  },

  onExpired() {
    clearInterval(State.timerState.interval);
    State.timerState.running = false;

    const task = State.DB.tasks.find(t => t.id === State.timerState.taskId);

    Modals.showTimerExpired(task?.text || '');

    const flash = document.getElementById('alert-flash');
    flash.classList.add('active');

    let alt = true;
    titleFlash = setInterval(() => {
      api.setTitle(alt ? '⏰ 时间到！TaskTree' : 'TaskTree');
      alt = !alt;
    }, 400);

    api.notify({ title: '⏰ 时间到！', body: `任务「${task?.text || ''}」计时结束` });
    api.flashFrame();
    api.playSound('alarm');
    
    setTimeout(() => { api.focusWindow(); }, 500);

    Timer.updatePanel();
  },

  stopTitleFlash() {
    if (titleFlash) { clearInterval(titleFlash); titleFlash = null; }
    api.setTitle('TaskTree');
  },

  async confirmExpired() {
    const task = State.DB.tasks.find(t => t.id === State.timerState.taskId);
    if (task) {
      task.actualSeconds = task.timerUsed;
      task.done = true;
    }
    clearInterval(State.timerState.interval);
    State.timerState = { taskId: null, remaining: 0, timerSeconds: 0, running: false, interval: null, pausedAt: null, startTime: null };
    document.getElementById('timer-panel').classList.remove('visible');
    Modals.closeTimerExpired();
    const flash = document.getElementById('alert-flash');
    flash.classList.remove('active');
    Timer.stopTitleFlash();
    await Api.saveDB();
    TaskRender.renderTaskList();
    Sidebar.updateProgress();
  },

  async abandonTask() {
    const task = State.DB.tasks.find(t => t.id === State.timerState.taskId);
    if (task) {
      task.abandoned = true;
      task.abandonedAt = new Date().toISOString();
    }
    clearInterval(State.timerState.interval);
    State.timerState = { taskId: null, remaining: 0, timerSeconds: 0, running: false, interval: null, pausedAt: null, startTime: null };
    document.getElementById('timer-panel').classList.remove('visible');
    Modals.closeTimerExpired();
    const flash = document.getElementById('alert-flash');
    flash.classList.remove('active');
    Timer.stopTitleFlash();
    await Api.saveDB();
    TaskRender.renderTaskList();
    Sidebar.updateProgress();
  },

  async delay5MinWithReason() {
    const task = State.DB.tasks.find(t => t.id === State.timerState.taskId);
    if (!task) return;
    
    const reasonInput = document.getElementById('delay-reason-input');
    const reason = reasonInput.value.trim();
    
    task.actualSeconds = task.timerUsed;
    if (!task.isOvertime) {
      task.isOvertime = true;
    }
    
    if (reason) {
      if (!task.delayHistory) task.delayHistory = [];
      task.delayHistory.push({
        delayMinutes: 5,
        reason: reason,
        delayedAt: new Date().toISOString()
      });
    }
    
    const addSeconds = 5 * 60;
    task.timerSeconds += addSeconds;
    State.timerState.remaining += addSeconds;
    State.timerState.timerSeconds = task.timerSeconds;
    
    State.timerState.running = true;
    State.timerState.startTime = Date.now();
    State.timerState.pausedAt = task.timerUsed;
    State.timerState.interval = setInterval(Timer.tick, 100);
    
    await Api.saveDB();
    Timer.updatePanel();
    TaskRender.renderTaskList();
    Sidebar.updateProgress();
    
    Modals.closeTimerExpired();
    const flash = document.getElementById('alert-flash');
    flash.classList.remove('active');
    Timer.stopTitleFlash();
    
    api.notify({ title: '⏱ 延时5分钟', body: `任务「${task.text}」已延长5分钟${reason ? '，原因：' + reason : ''}` });
  },

  async completeFromTimer() {
    const task = State.DB.tasks.find(t => t.id === State.timerState.taskId);
    if (task) {
      task.actualSeconds = task.timerUsed;
      task.done = true;
    }
    clearInterval(State.timerState.interval);
    State.timerState = { taskId: null, remaining: 0, timerSeconds: 0, running: false, interval: null, pausedAt: null, startTime: null };
    document.getElementById('timer-panel').classList.remove('visible');
    Timer.stopTitleFlash();
    await Api.saveDB();
    TaskRender.renderTaskList();
    Sidebar.updateProgress();
    
    api.notify({ title: '✓ 任务完成', body: `任务「${task?.text || ''}」已完成` });
  }
};

window.Timer = Timer;

// ══════════════════════════════════════════════════════════════
//  DRAGDROP - 拖拽排序模块
// ══════════════════════════════════════════════════════════════

const DragDrop = {
  handleDragStart(e, taskId) {
    State.draggedTaskId = taskId;
    e.target.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', taskId);
  },

  handleDragEnd(e) {
    e.target.classList.remove('dragging');
    document.querySelectorAll('.task-row.drag-over, .task-row.drop-allowed, .task-row.drop-forbidden').forEach(el => {
      el.classList.remove('drag-over', 'drop-allowed', 'drop-forbidden');
    });
    State.draggedTaskId = null;
  },

  handleDragOver(e) {
    e.preventDefault();
    const targetRow = e.target.closest('.task-row');
    if (!targetRow || !State.draggedTaskId) return;
    const targetId = targetRow.closest('.task-node')?.dataset.id;
    if (!targetId || targetId === State.draggedTaskId) return;
    
    document.querySelectorAll('.task-row.drag-over, .task-row.drop-allowed, .task-row.drop-forbidden, .task-row.drop-reorder-before, .task-row.drop-reorder-after, .task-row.drop-reparent').forEach(el => {
      el.classList.remove('drag-over', 'drop-allowed', 'drop-forbidden', 'drop-reorder-before', 'drop-reorder-after', 'drop-reparent');
    });
    
    if (Utils.isAncestor(State.draggedTaskId, targetId)) {
      targetRow.classList.add('drop-forbidden');
      return;
    }
    
    const rect = targetRow.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const isRightHalf = offsetX > rect.width * 0.4;
    const isLeftHalf = offsetX < rect.width * 0.2;
    
    if (e.ctrlKey || e.metaKey || isRightHalf) {
      targetRow.classList.add('drop-reparent');
    } else if (isLeftHalf) {
      targetRow.classList.add('drop-reorder-before');
    } else {
      targetRow.classList.add('drop-reorder-after');
    }
    targetRow.classList.add('drag-over');
  },

  handleDragLeave(e) {
    const targetRow = e.target.closest('.task-row');
    if (targetRow) {
      targetRow.classList.remove('drag-over', 'drop-allowed', 'drop-forbidden');
    }
  },

  handleDrop(e, targetTaskId) {
    e.preventDefault();
    const targetRow = e.target.closest('.task-row');
    if (targetRow) {
      targetRow.classList.remove('drag-over', 'drop-allowed', 'drop-forbidden', 'drop-reorder-before', 'drop-reorder-after', 'drop-reparent');
    }
    
    if (!State.draggedTaskId || !targetTaskId || State.draggedTaskId === targetTaskId) return;
    if (Utils.isAncestor(State.draggedTaskId, targetTaskId)) return;
    
    const targetTask = State.DB.tasks.find(t => t.id === targetTaskId);
    if (!targetTask) return;
    
    const rect = targetRow ? targetRow.getBoundingClientRect() : null;
    const offsetX = rect ? e.clientX - rect.left : 0;
    const isRightHalf = rect && offsetX > rect.width * 0.4;
    const isLeftHalf = rect && offsetX < rect.width * 0.2;
    
    if (e.ctrlKey || e.metaKey || isRightHalf) {
      Tasks.reparentTask(State.draggedTaskId, targetTaskId);
    } else if (isLeftHalf) {
      Tasks.reorderTask(State.draggedTaskId, targetTaskId, 'before');
    } else {
      Tasks.reorderTask(State.draggedTaskId, targetTaskId, 'after');
    }
  },

  attachDragEvents(row, taskId) {
    row.draggable = true;
    row.addEventListener('dragstart', e => DragDrop.handleDragStart(e, taskId));
    row.addEventListener('dragend', DragDrop.handleDragEnd);
    row.addEventListener('dragover', DragDrop.handleDragOver);
    row.addEventListener('dragleave', DragDrop.handleDragLeave);
    row.addEventListener('drop', e => DragDrop.handleDrop(e, taskId));
  }
};

window.DragDrop = DragDrop;

// ══════════════════════════════════════════════════════════════
//  MODALS - 弹窗模块
// ══════════════════════════════════════════════════════════════

const Modals = {
  showAdmin() {
    Modals.renderInviteList();
    Modals.renderUserList();
    document.getElementById('admin-modal').style.display = 'flex';
  },

  closeAdmin() {
    document.getElementById('admin-modal').style.display = 'none';
  },

  showTimerExpired(taskName) {
    document.getElementById('timer-expired-task-name').textContent = `任务「${taskName}」已完成计时时长`;
    document.querySelector('.timer-expired-actions').style.display = 'flex';
    document.querySelector('.overtime-warning').style.display = 'flex';
    document.getElementById('delay-reason-container').style.display = 'none';
    document.getElementById('delay-reason-input').value = '';
    document.getElementById('timer-expired-modal').style.display = 'flex';
  },

  closeTimerExpired() {
    document.getElementById('timer-expired-modal').style.display = 'none';
    document.getElementById('delay-reason-container').style.display = 'none';
    document.getElementById('delay-reason-input').value = '';
  },

  showDelayReasonInput() {
    document.querySelector('.timer-expired-actions').style.display = 'none';
    document.querySelector('.overtime-warning').style.display = 'none';
    document.getElementById('delay-reason-container').style.display = 'flex';
    document.getElementById('delay-reason-input').focus();
  },

  hideDelayReasonInput() {
    document.querySelector('.timer-expired-actions').style.display = 'flex';
    document.querySelector('.overtime-warning').style.display = 'flex';
    document.getElementById('delay-reason-container').style.display = 'none';
    document.getElementById('delay-reason-input').value = '';
  },

  showTaskDetail(taskId) {
    State.currentDetailTaskId = taskId;
    const task = State.DB.tasks.find(t => t.id === taskId);
    if (!task) return;

    document.getElementById('task-detail-title').textContent = task.text;
    document.getElementById('detail-note').textContent = task.note || '无备注';

    Modals.renderDelayHistory(task);

    State.detailUpdateInterval = setInterval(() => {
      if (document.getElementById('task-detail-modal').style.display !== 'none') {
        Modals.updateTaskDetailDisplay();
      }
    }, 1000);

    document.getElementById('task-detail-modal').style.display = 'flex';
  },

  updateTaskDetailDisplay() {
    if (!State.currentDetailTaskId) return;
    const task = State.DB.tasks.find(t => t.id === State.currentDetailTaskId);
    if (!task) return;

    const estimated = task.estimatedSeconds || task.timerSeconds || 300;
    const isThisTask = State.timerState.taskId === State.currentDetailTaskId;
    const used = isThisTask && State.timerState.running
      ? Math.floor((Date.now() - State.timerState.startTime) / 1000) + (State.timerState.pausedAt || 0)
      : task.timerUsed || 0;
    const remaining = isThisTask && State.timerState.running
      ? Math.max(State.timerState.remaining, 0)
      : Math.max(task.timerSeconds - task.timerUsed, 0);

    document.getElementById('detail-estimated').textContent = Utils.fmtTime(estimated);
    document.getElementById('detail-overtime').textContent = task.isOvertime ? '已超时' : '-';
    document.getElementById('detail-overtime').className = 'detail-value' + (task.isOvertime ? ' warning' : '');
    document.getElementById('detail-actual').textContent = Utils.fmtTime(used);
    document.getElementById('detail-remaining').textContent = task.done ? '已完成' : Utils.fmtTime(remaining);

    const remainingEl = document.getElementById('detail-remaining');
    if (task.done) {
      remainingEl.className = 'detail-value success';
    } else if (remaining < 60 && remaining > 0) {
      remainingEl.className = 'detail-value warning';
    } else {
      remainingEl.className = 'detail-value';
    }
  },

  closeTaskDetail() {
    if (State.detailUpdateInterval) {
      clearInterval(State.detailUpdateInterval);
      State.detailUpdateInterval = null;
    }
    document.getElementById('task-detail-modal').style.display = 'none';
    State.currentDetailTaskId = null;
  },

  openSetTimerFromDetail() {
    if (!State.currentDetailTaskId) return;
    const task = State.DB.tasks.find(t => t.id === State.currentDetailTaskId);
    if (!task) return;
    Modals.closeTaskDetail();
    Timer.start(State.currentDetailTaskId);
    Timer.showTimeInput();
  },

  renderDelayHistory(task) {
    const section = document.getElementById('delay-history-section');
    const list = document.getElementById('delay-history-list');
    
    if (!task.delayHistory || task.delayHistory.length === 0) {
      section.style.display = 'none';
      return;
    }
    
    section.style.display = 'block';
    list.innerHTML = '';
    
    task.delayHistory.slice().reverse().forEach(delay => {
      const div = document.createElement('div');
      div.className = 'delay-history-item';
      const time = new Date(delay.delayedAt).toLocaleString('zh-CN', { 
        month: 'numeric', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      div.innerHTML = `
        <div class="delay-time">+${delay.delayMinutes}分钟 · ${time}</div>
        <div class="delay-reason">${delay.reason}</div>
      `;
      list.appendChild(div);
    });
  },

  renderInviteList() {
    const el = document.getElementById('invite-list');
    el.innerHTML = '';
    State.DB.inviteCodes.forEach(c => {
      const div = document.createElement('div');
      div.className = 'invite-code-item';
      div.innerHTML = `<code>${c.code}</code>
        <span class="code-status ${c.used ? 'used' : ''}">${c.used ? '已使用 by '+c.usedBy : '未使用'}</span>`;
      el.appendChild(div);
    });
    if (State.DB.inviteCodes.length === 0) el.innerHTML = '<p style="color:var(--text3);font-size:13px">暂无邀请码</p>';
  },

  renderUserList() {
    const el = document.getElementById('user-list');
    el.innerHTML = '';
    State.DB.users.forEach(u => {
      const div = document.createElement('div');
      div.className = 'user-list-item';
      div.innerHTML = `<div class="user-avatar" style="width:28px;height:28px;font-size:12px">${u.username[0].toUpperCase()}</div>
        <span class="user-list-name">${u.username}</span>
        <span class="user-list-role">${u.role === 'admin' ? '管理员' : '成员'}</span>`;
      el.appendChild(div);
    });
  },

  async generateInviteCode() {
    await Api.generateInviteCode();
    Modals.renderInviteList();
  }
};

window.Modals = Modals;

// ══════════════════════════════════════════════════════════════
//  INIT - 初始化模块
// ══════════════════════════════════════════════════════════════

const Init = {
  boot() {
    Init.bindWindowControls();
    Init.bindEvents();
    Init.bindDateNav();
    Init.bindSidebarEvents();
    Init.bindTimerEvents();
    Init.bindModalEvents();
    Init.loadTheme();
    Init.loadSidebarState();
    DateView.updateDateDisplay();
    Init.autoLogin();
  },

  bindWindowControls() {
    document.getElementById('btn-minimize').onclick = () => api.minimize();
    document.getElementById('btn-maximize').onclick = () => api.maximize();
    document.getElementById('btn-close').onclick = () => api.close();
  },

  bindEvents() {
    document.getElementById('auth-toggle-link').onclick = () => Auth.toggleMode();
    document.getElementById('auth-submit').onclick = () => Auth.doAuth();
    ['auth-username','auth-password','auth-invite'].forEach(id => {
      document.getElementById(id).addEventListener('keydown', e => { if (e.key === 'Enter') Auth.doAuth(); });
    });

    document.getElementById('new-task-input').addEventListener('keydown', async e => {
      if (e.key === 'Enter') {
        const text = e.target.value.trim();
        if (text) { await Tasks.addTask(text); e.target.value = ''; }
      }
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Enter' && e.ctrlKey) {
        const hoveredRow = document.querySelector('.task-row[data-hovered="1"]');
        if (hoveredRow && hoveredRow.dataset.id) {
          const task = State.DB.tasks.find(t => t.id === hoveredRow.dataset.id);
          if (task && !task.abandoned) {
            e.preventDefault();
            Tasks.beginAddChild(task.id);
          }
        }
      }
    });
  },

  bindDateNav() {
    document.getElementById('btn-past').onclick = () => DateView.setView('past');
    document.getElementById('btn-today').onclick = () => DateView.setView('today');
    document.getElementById('btn-future').onclick = () => DateView.setView('future');
    document.getElementById('btn-prev-day').onclick = () => DateView.offsetDate(-1);
    document.getElementById('btn-next-day').onclick = () => DateView.offsetDate(1);
  },

  bindSidebarEvents() {
    document.getElementById('sidebar-toggle').onclick = () => Utils.toggleSidebar();
    document.getElementById('theme-toggle-btn').onclick = () => Utils.toggleTheme();
    document.getElementById('btn-logout').onclick = () => Auth.logout();
    document.getElementById('admin-nav').onclick = () => Modals.showAdmin();
  },

  bindTimerEvents() {
    document.getElementById('timer-btn-minus5').onclick = () => Timer.adjust(-5);
    document.getElementById('timer-btn-plus5').onclick = () => Timer.adjust(5);
    document.getElementById('timer-btn-set').onclick = () => Timer.showTimeInput();
    document.getElementById('timer-pause-btn').onclick = () => Timer.togglePause();
    document.getElementById('timer-stop-btn').onclick = () => Timer.stop();
    document.getElementById('timer-complete-btn').onclick = () => Timer.completeFromTimer();
    document.getElementById('timer-confirm-btn').onclick = () => Timer.confirmTime();
    document.getElementById('timer-cancel-btn').onclick = () => Timer.hideTimeInput();
    document.getElementById('timer-input-field').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') Timer.confirmTime();
      else if (e.key === 'Escape') Timer.hideTimeInput();
    });
  },

  bindModalEvents() {
    document.getElementById('admin-modal-close').onclick = () => Modals.closeAdmin();
    document.getElementById('admin-modal').onclick = (e) => { if(e.target.id === 'admin-modal') Modals.closeAdmin(); };
    document.getElementById('btn-gen-code').onclick = () => Modals.generateInviteCode();
    
    document.getElementById('task-detail-close').onclick = () => Modals.closeTaskDetail();
    document.getElementById('task-detail-modal').onclick = (e) => { if(e.target.id === 'task-detail-modal') Modals.closeTaskDetail(); };
    document.getElementById('btn-set-timer').onclick = () => Modals.openSetTimerFromDetail();
    
    document.getElementById('btn-timer-confirm').onclick = () => Timer.confirmExpired();
    document.getElementById('btn-timer-delay').onclick = () => Modals.showDelayReasonInput();
    document.getElementById('btn-timer-abandon').onclick = () => Timer.abandonTask();
    document.getElementById('btn-confirm-delay').onclick = () => Timer.delay5MinWithReason();
    document.getElementById('btn-cancel-delay').onclick = () => Modals.hideDelayReasonInput();
  },

  loadTheme() {
    try {
      const t = localStorage.getItem('tasktree_theme');
      if (t) Utils.applyTheme(t);
      else Utils.applyTheme('light');
    } catch {
      Utils.applyTheme('light');
    }
  },

  loadSidebarState() {
    try {
      const s = localStorage.getItem('tasktree_sidebar');
      if (s === 'collapsed') {
        State.sidebarCollapsed = true;
        document.getElementById('sidebar').classList.add('collapsed');
      }
    } catch {}
  },

  async autoLogin() {
    await Api.loadDB();
    if (State.DB.currentUser) {
      const user = State.DB.users.find(u => u.id === State.DB.currentUser);
      if (user) { Auth.enterApp(user); return; }
    }
    document.getElementById('auth-screen').style.display = 'flex';
  }
};

window.Init = Init;

