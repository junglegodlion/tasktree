// ══════════════════════════════════════════════════════════════
//  STATE - 状态管理模块
// ══════════════════════════════════════════════════════════════

const AppState = {
  DB: { users: [], tasks: [], inviteCodes: [], currentUser: null },
  currentView: 'today',
  currentDateOffset: 0,
  currentTheme: 'light',
  sidebarCollapsed: false,
  expandedNoteId: null,
  draggedTaskId: null,
  inlineAddParentId: null,
  currentDetailTaskId: null,
  detailUpdateInterval: null,
  timerState: {
    taskId: null,
    remaining: 0,
    timerSeconds: 0,
    running: false,
    interval: null,
    pausedAt: null,
    startTime: null
  }
};

const State = {
  get DB() { return AppState.DB; },
  set DB(val) { AppState.DB = val; },
  
  get currentView() { return AppState.currentView; },
  set currentView(val) { AppState.currentView = val; },
  
  get currentDateOffset() { return AppState.currentDateOffset; },
  set currentDateOffset(val) { AppState.currentDateOffset = val; },
  
  get currentTheme() { return AppState.currentTheme; },
  set currentTheme(val) { AppState.currentTheme = val; },
  
  get sidebarCollapsed() { return AppState.sidebarCollapsed; },
  set sidebarCollapsed(val) { AppState.sidebarCollapsed = val; },
  
  get expandedNoteId() { return AppState.expandedNoteId; },
  set expandedNoteId(val) { AppState.expandedNoteId = val; },
  
  get draggedTaskId() { return AppState.draggedTaskId; },
  set draggedTaskId(val) { AppState.draggedTaskId = val; },
  
  get inlineAddParentId() { return AppState.inlineAddParentId; },
  set inlineAddParentId(val) { AppState.inlineAddParentId = val; },
  
  get currentDetailTaskId() { return AppState.currentDetailTaskId; },
  set currentDetailTaskId(val) { AppState.currentDetailTaskId = val; },
  
  get detailUpdateInterval() { return AppState.detailUpdateInterval; },
  set detailUpdateInterval(val) { AppState.detailUpdateInterval = val; },
  
  get timerState() { return AppState.timerState; },
  set timerState(val) { AppState.timerState = val; },
  
  get currentUser() {
    return AppState.DB.users.find(u => u.id === AppState.DB.currentUser);
  }
};

window.AppState = AppState;
window.State = State;
