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
