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
  },

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
};

window.Utils = Utils;
