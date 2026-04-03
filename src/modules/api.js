// ══════════════════════════════════════════════════════════════
//  API - 数据持久化层
// ══════════════════════════════════════════════════════════════

const Api = {
  async loadData() {
    return await api.loadData();
  },

  async saveDB() {
    await api.saveData(State.DB);
  },

  async loadDB() {
    State.DB = await Api.loadData();
    if (!State.DB.users) State.DB.users = [];
    if (!State.DB.tasks) State.DB.tasks = [];
    if (!State.DB.inviteCodes) State.DB.inviteCodes = [];
    if (State.DB.users.length === 0) {
      State.DB.users.push({ 
        id: Utils.uid(), 
        username: 'admin', 
        password: Utils.hashPassword('admin123'), 
        role: 'admin', 
        createdAt: new Date().toISOString() 
      });
      await Api.saveDB();
    }
  },

  async generateInviteCode() {
    const code = Math.random().toString(36).slice(2, 8).toUpperCase();
    State.DB.inviteCodes.push({ 
      code, 
      used: false, 
      usedBy: null, 
      createdAt: new Date().toISOString() 
    });
    await Api.saveDB();
    return code;
  }
};

window.Api = Api;
