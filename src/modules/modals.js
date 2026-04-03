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
