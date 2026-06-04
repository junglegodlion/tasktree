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
    Sidebar.updateHistoricalTasks();
  },

  getHistoricalIncompleteTasks() {
    const uid = State.DB.currentUser;
    const today = Utils.todayKey();
    return State.DB.tasks.filter(t => 
      t.userId === uid && 
      t.date < today && 
      !t.done && 
      !t.abandoned
    );
  },

  updateHistoricalTasks() {
    const section = document.getElementById('historical-tasks-section');
    const listContainer = document.getElementById('historical-tasks-list');
    const countBadge = document.getElementById('historical-count');
    
    const tasks = Sidebar.getHistoricalIncompleteTasks();
    
    if (tasks.length === 0) {
      section.style.display = 'none';
      return;
    }
    
    section.style.display = 'block';
    countBadge.textContent = tasks.length;
    
    listContainer.innerHTML = tasks.map(t => {
      const dateObj = new Date(t.date + 'T00:00:00');
      const dateStr = (dateObj.getMonth() + 1) + '/' + dateObj.getDate();
      const daysAgo = Math.floor((new Date(Utils.todayKey() + 'T00:00:00') - dateObj) / 86400000);
      const daysText = daysAgo === 1 ? '昨天' : daysAgo + '天前';
      return `
      <div class="historical-task-item" data-task-id="${t.id}">
        <div class="hist-task-indicator"></div>
        <div class="task-text-wrap" data-tooltip="${Utils.escapeHtml(t.text)}">
          <span class="task-text">${Utils.escapeHtml(t.text)}</span>
          <span class="task-date">${dateStr} · ${daysText}</span>
        </div>
        <div class="task-actions-btns">
          <button class="hist-action-btn complete" title="标记完成" data-action="complete">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
          </button>
          <button class="hist-action-btn abandon" title="放弃任务" data-action="abandon">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
          <button class="hist-action-btn continue" title="继续执行" data-action="continue">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </button>
        </div>
      </div>`;
    }).join('');
    
    const tooltip = document.getElementById('hist-tooltip');
    listContainer.querySelectorAll('.task-text-wrap[data-tooltip]').forEach(el => {
      el.onmouseenter = () => {
        tooltip.textContent = el.dataset.tooltip;
        tooltip.style.display = 'block';
        const rect = el.getBoundingClientRect();
        const tipRect = tooltip.getBoundingClientRect();
        let left = rect.left;
        let top = rect.bottom + 4;
        if (left + tipRect.width > window.innerWidth - 8) {
          left = window.innerWidth - tipRect.width - 8;
        }
        if (top + tipRect.height > window.innerHeight - 8) {
          top = rect.top - tipRect.height - 4;
        }
        tooltip.style.left = left + 'px';
        tooltip.style.top = top + 'px';
      };
      el.onmouseleave = () => { tooltip.style.display = 'none'; };
    });
    
    listContainer.querySelectorAll('.hist-action-btn').forEach(btn => {
      btn.onclick = async (e) => {
        e.stopPropagation();
        const taskId = btn.closest('.historical-task-item').dataset.taskId;
        const action = btn.dataset.action;
        await Sidebar.handleHistoricalAction(taskId, action);
      };
    });
  },

  async handleHistoricalAction(taskId, action) {
    const task = State.DB.tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const today = Utils.todayKey();
    
    if (action === 'complete') {
      task.done = true;
      await Tasks.propagateParentStatus(task.parentId);
    } else if (action === 'abandon') {
      task.abandoned = true;
      task.abandonedAt = new Date().toISOString();
    } else if (action === 'continue') {
      task.date = today;
    }
    
    await Api.saveDB();
    Sidebar.updateBadges();
    TaskRender.renderTaskList();
  },

  calcTodayTotalTime() {
    const key = Utils.todayKey();
    const userId = State.DB.currentUser || (State.DB.users[0] && State.DB.users[0].id);
    if (!userId) return '0m';
    
    const userTodayTasks = State.DB.tasks.filter(t => t.userId === userId && t.date === key && !t.abandoned);
    const totalSeconds = userTodayTasks.reduce((sum, t) => sum + (t.timerUsed || 0), 0);
    
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    
    if (hours > 0) {
      return hours + 'h ' + minutes + 'm';
    }
    return minutes + 'm';
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
    document.getElementById('stat-time').textContent = Sidebar.calcTodayTotalTime();
    
    const ringFill = document.getElementById('progress-ring-fill');
    ringFill.setAttribute('stroke-dasharray', percent + ', 100');
  }
};

window.Sidebar = Sidebar;
