var DEMO_ACCOUNTS = {
  patient: { phone: '18612345678', password: 'pass_pat_1' },
  doctor: { phone: '13800138001', password: 'pass_doc_1' },
  family: { phone: '13099990000', password: 'pass_fam_1' },
};

var ROLE_LABEL = {
  patient: '患者端',
  doctor: '康复医生/专家端',
  family: '健康守护人端',
};

function navigateAfterLogin(app, role) {
  app.globalData.role = role;
  wx.setStorageSync('kneejoy_role', role);
  app.navigateToRoleHome(role);
}

Page({
  data: {
    step: 'role',
    selectedRole: 'patient',
    roleLabel: ROLE_LABEL.patient,
    loginMethod: 'password',
    phone: DEMO_ACCOUNTS.patient.phone,
    password: DEMO_ACCOUNTS.patient.password,
    smsCode: '',
    smsHint: '',
    smsSending: false,
    loading: false,
    errorMsg: '',
    serverOk: false,
    apiHost: '',
    apiRemote: false,
    isDevtools: false,
    isTrial: false,
    roles: [
      { id: 'patient', emoji: '👤', bgClass: 'bg-indigo', title: '我是患者', desc: '开启今日关节理疗与康复行为打卡' },
      { id: 'doctor', emoji: '🩺', bgClass: 'bg-emerald', title: '我是康复医生/专家', desc: '管理签约患者，下发数字化理疗处方' },
      { id: 'family', emoji: '💗', bgClass: 'bg-pink', title: '我是健康守护人', desc: '远程关注家人康复动态与训练打卡' },
    ],
  },

  onLoad: function () {
    wx.setNavigationBarTitle({ title: '「膝悦 (KneeJoy)」App' });
    this.checkServer();
  },

  onShow: function () {
    var app = getApp();
    var platform = '';
    var envVersion = '';
    try {
      platform = wx.getDeviceInfo ? wx.getDeviceInfo().platform : wx.getSystemInfoSync().platform;
    } catch (e) {}
    try {
      envVersion = wx.getAccountInfoSync().miniProgram.envVersion || '';
    } catch (e2) {}
    this.setData({
      apiHost: app.globalData.apiHost,
      apiRemote: !!app.globalData.apiRemote,
      isDevtools: platform === 'devtools',
      isTrial: envVersion === 'trial',
    });
    this.checkServer();
  },

  checkServer: function () {
    var that = this;
    getApp()
      .request({ url: '/health', method: 'GET' })
      .then(function () {
        that.setData({ serverOk: true });
      })
      .catch(function () {
        that.setData({ serverOk: false });
      });
  },

  onSelectRole: function (e) {
    var role = e.currentTarget.dataset.role;
    var account = DEMO_ACCOUNTS[role];
    this.setData({
      selectedRole: role,
      roleLabel: ROLE_LABEL[role],
      phone: account.phone,
      password: account.password,
      smsCode: '',
      errorMsg: '',
    });
  },

  onMethodChange: function (e) {
    this.setData({ loginMethod: e.currentTarget.dataset.method, errorMsg: '', smsHint: '' });
  },

  onGoLogin: function () {
    this.setData({ step: 'login', errorMsg: '' });
  },

  onBack: function () {
    this.setData({ step: 'role', errorMsg: '' });
  },

  onPhoneInput: function (e) {
    this.setData({ phone: e.detail.value });
  },

  onPasswordInput: function (e) {
    this.setData({ password: e.detail.value });
  },

  onSmsInput: function (e) {
    this.setData({ smsCode: e.detail.value });
  },

  onSendSms: function () {
    var phone = this.data.phone;
    if (!phone) {
      wx.showToast({ title: '请先输入手机号', icon: 'none' });
      return;
    }
    var that = this;
    this.setData({ smsSending: true, errorMsg: '' });
    getApp()
      .request({ url: '/auth/sms/send', method: 'POST', data: { phone: phone } })
      .then(function (res) {
        var hint = res.dev_hint ? '开发模式验证码：' + res.dev_hint : '验证码已发送';
        that.setData({ smsHint: hint, smsSending: false });
        wx.showToast({ title: '验证码已发送', icon: 'success' });
      })
      .catch(function (err) {
        that.setData({
          smsSending: false,
          errorMsg: (err && err.message) || '发送失败',
        });
      });
  },

  onLogin: function () {
    var that = this;
    var role = this.data.selectedRole;
    var phone = this.data.phone;
    var app = getApp();
    var req;

    this.setData({ loading: true, errorMsg: '' });

    if (this.data.loginMethod === 'phone') {
      req = app.request({
        url: '/auth/login/phone',
        method: 'POST',
        data: { phone: phone, code: this.data.smsCode, role: role },
      });
    } else {
      req = app.request({
        url: '/auth/login/password',
        method: 'POST',
        data: { phone: phone, password: this.data.password, role: role },
      });
    }

    req
      .then(function (data) {
        app.globalData.token = data.token;
        app.globalData.user = data.user;
        wx.setStorageSync('kneejoy_token', data.token);
        navigateAfterLogin(app, role);
      })
      .catch(function (err) {
        that.setData({
          errorMsg: (err && err.message) || '登录失败',
          loading: false,
        });
      })
      .then(function () {
        that.setData({ loading: false });
      });
  },
});
