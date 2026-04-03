// ══════════════════════════════════════════════════════════════
//  AUTH - 认证模块
// ══════════════════════════════════════════════════════════════

let isAuthMode = 'login';

const Auth = {
  toggleMode() {
    isAuthMode = isAuthMode === 'login' ? 'register' : 'login';
    const isReg = isAuthMode === 'register';
    document.getElementById('auth-title').textContent = isReg ? '创建账号' : '欢迎回来';
    document.getElementById('auth-sub').textContent = isReg ? '使用邀请码注册' : '登录你的 TaskTree 账号';
    document.getElementById('auth-submit').textContent = isReg ? '注册' : '登录';
    document.getElementById('auth-toggle-text').textContent = isReg ? '已有账号？' : '还没有账号？';
    document.getElementById('auth-toggle-link').textContent = isReg ? '登录' : '注册';
    document.getElementById('invite-group').style.display = isReg ? '' : 'none';
    document.getElementById('auth-error').textContent = '';
  },

  async doAuth() {
    const username = document.getElementById('auth-username').value.trim();
    const password = document.getElementById('auth-password').value;
    const errEl = document.getElementById('auth-error');
    errEl.textContent = '';

    if (!username || !password) { errEl.textContent = '请填写用户名和密码'; return; }

    if (isAuthMode === 'login') {
      const user = State.DB.users.find(u => u.username === username && u.password === Utils.hashPassword(password));
      if (!user) { errEl.textContent = '用户名或密码错误'; return; }
      State.DB.currentUser = user.id;
      await Api.saveDB();
      Auth.enterApp(user);
    } else {
      const inviteCode = document.getElementById('auth-invite').value.trim();
      if (State.DB.users.find(u => u.username === username)) { errEl.textContent = '用户名已被使用'; return; }
      if (State.DB.users.length > 0) {
        const code = State.DB.inviteCodes.find(c => c.code === inviteCode && !c.used);
        if (!code) { errEl.textContent = '邀请码无效或已使用'; return; }
        code.used = true; code.usedBy = username;
      }
      const user = { 
        id: Utils.uid(), 
        username, 
        password: Utils.hashPassword(password), 
        role: 'member', 
        createdAt: new Date().toISOString() 
      };
      State.DB.users.push(user);
      State.DB.currentUser = user.id;
      await Api.saveDB();
      Auth.enterApp(user);
    }
  },

  enterApp(user) {
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('main-layout').style.display = 'flex';
    document.getElementById('user-name-display').textContent = user.username;
    document.getElementById('user-avatar').textContent = user.username[0].toUpperCase();
    document.getElementById('user-role-display').textContent = user.role === 'admin' ? '管理员' : '成员';
    if (user.role === 'admin') document.getElementById('admin-nav').style.display = '';
    State.currentDateOffset = 0;
    DateView.setView('today');
    TaskRender.renderTaskList();
    Sidebar.updateBadges();
  },

  async logout() {
    Timer.stop();
    State.DB.currentUser = null;
    await Api.saveDB();
    document.getElementById('main-layout').style.display = 'none';
    document.getElementById('auth-screen').style.display = 'flex';
    document.getElementById('auth-password').value = '';
    document.getElementById('auth-error').textContent = '';
  },

  getCurrentUser() {
    return State.DB.users.find(u => u.id === State.DB.currentUser);
  }
};

window.Auth = Auth;
window.isAuthMode = isAuthMode;
