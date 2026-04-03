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
