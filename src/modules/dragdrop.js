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
