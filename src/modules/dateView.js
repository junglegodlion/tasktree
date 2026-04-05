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
  }
};

window.DateView = DateView;
