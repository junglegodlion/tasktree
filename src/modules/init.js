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
    document.getElementById('btn-timer-delay').onclick = () => Timer.delay5Min();
    document.getElementById('btn-timer-abandon').onclick = () => Timer.abandonTask();
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
