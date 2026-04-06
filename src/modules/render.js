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
      overtimeTag.className = 'overtime-tag ' + (task.done ? 'past' : 'active');
      overtimeTag.textContent = task.done ? '曾超时' : '超时';
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
