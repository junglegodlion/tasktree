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
