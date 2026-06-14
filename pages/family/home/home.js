var ARTICLES = [
  { title: '膝关节骨关节炎：早干预比手术更重要', desc: '适度牵引拉伸可延缓软骨磨损，居家理疗是长期管理的核心。', tag: '骨科科普' },
  { title: '家属如何正确督促老人做康复？', desc: '温和提醒 + 打卡激励，比反复唠叨更有效。', tag: '家庭护理' },
  { title: '冬季膝盖保暖的 5 个科学要点', desc: '热敷温度不宜超过 45℃，配合踝泵操效果更佳。', tag: '季节指南' },
];

Page({
  data: {
    isLinked: false,
    bindMethod: 'phone',
    bindPhone: '18612345678',
    isScanning: false,
    activeTab: 'guardian',
    navTitle: '家属随护关怀中心',
    patientName: '守护对象',
    patientId: '',
    weeklyRate: 0,
    streakDays: 0,
    deviceStatus: '离线',
    nudgeMsg: '爸妈，天气转温啦，今天记得戴上理疗护膝做20分钟智能拉伸牵引哈！',
    nudgeSent: false,
    articles: ARTICLES,
    devices: [],
    hardwareAlert: '',
  },

  onShow: function () {
    if (!getApp().ensureFamilyLogin()) return;
    this.refreshBindings();
  },

  refreshBindings: function () {
    var that = this;
    getApp()
      .request({ url: '/family/bindings', method: 'GET' })
      .then(function (res) {
        var bindings = res.bindings || res || [];
        var linked = bindings.length > 0;
        that.setData({ isLinked: linked });
        if (linked) {
          var first = bindings[0];
          that.setData({
            patientId: first.patient_id,
            patientName: first.patient_name || '守护对象',
          });
          that.loadPatientStats(first.patient_id);
          that.loadDevices();
        }
      })
      .catch(function () {
        that.setData({ isLinked: false });
      });
  },

  loadPatientStats: function (patientId) {
    var that = this;
    getApp()
      .request({ url: '/family/patients/' + patientId + '/check-ins/stats', method: 'GET' })
      .then(function (res) {
        that.setData({
          weeklyRate: res.weekly_rate || 0,
          streakDays: res.total_check_ins || 0,
        });
      })
      .catch(function () {});

    getApp()
      .request({ url: '/family/patients/' + patientId + '/device-status', method: 'GET' })
      .then(function (res) {
        var conn = (res.device && res.device.connection) || 'disconnected';
        var label = conn === 'disconnected' ? '离线' : conn === 'wifi' ? 'Wi-Fi在线' : '蓝牙在线';
        that.setData({
          patientName: (res.patient && res.patient.name) || that.data.patientName,
          deviceStatus: label,
        });
      })
      .catch(function () {});

    getApp()
      .request({ url: '/family/patients/' + patientId + '/alarms/active', method: 'GET' })
      .then(function (res) {
        that.setData({
          hardwareAlert: res.active && res.alarm ? res.alarm.message : '',
        });
      })
      .catch(function () {});
  },

  onClearAlarm: function () {
    this.setData({ hardwareAlert: '' });
  },

  loadDevices: function () {
    var that = this;
    getApp()
      .request({ url: '/family/devices', method: 'GET' })
      .then(function (res) {
        var devices = (res.devices || []).map(function (d) {
          var conn = (d.device && d.device.connection) || 'disconnected';
          return {
            patient_id: d.binding && d.binding.patient_id,
            patient_name: (d.binding && d.binding.patient_name) || '患者',
            connection_label:
              conn === 'disconnected' ? '未连接' : conn === 'wifi' ? 'Wi-Fi' : '蓝牙',
          };
        });
        that.setData({ devices: devices });
      })
      .catch(function () {});
  },

  onBindMethod: function (e) {
    this.setData({ bindMethod: e.currentTarget.dataset.method });
  },

  onBindPhoneInput: function (e) {
    this.setData({ bindPhone: e.detail.value });
  },

  onBindByPhone: function () {
    var phone = (this.data.bindPhone || '').replace(/\D/g, '');
    if (!phone) {
      wx.showToast({ title: '请输入手机号', icon: 'none' });
      return;
    }
    var that = this;
    getApp()
      .request({
        url: '/family/bindings/phone',
        method: 'POST',
        data: { phone: phone },
      })
      .then(function () {
        wx.showToast({ title: '绑定成功', icon: 'success' });
        that.refreshBindings();
      })
      .catch(function (err) {
        wx.showToast({ title: (err && err.message) || '绑定失败', icon: 'none' });
      });
  },

  onBindByQr: function () {
    var that = this;
    this.setData({ isScanning: true });
    setTimeout(function () {
      getApp()
        .request({
          url: '/family/bindings/qr',
          method: 'POST',
          data: { token: 'demo_qr_token' },
        })
        .then(function () {
          that.setData({ isScanning: false });
          wx.showToast({ title: '扫码绑定成功', icon: 'success' });
          that.refreshBindings();
        })
        .catch(function (err) {
          that.setData({ isScanning: false });
          wx.showToast({ title: (err && err.message) || '扫码失败', icon: 'none' });
        });
    }, 1200);
  },

  onTabChange: function (e) {
    var tab = e.currentTarget.dataset.tab;
    var titles = {
      guardian: '家属随护关怀中心',
      library: '预防退化科普大讲堂',
      settings: '多设备远程管理',
    };
    this.setData({ activeTab: tab, navTitle: titles[tab] });
  },

  onNudgeInput: function (e) {
    this.setData({ nudgeMsg: e.detail.value });
  },

  onTemplate: function (e) {
    this.setData({ nudgeMsg: e.currentTarget.dataset.msg });
  },

  onSendNudge: function () {
    var that = this;
    if (!this.data.patientId) {
      wx.showToast({ title: '未找到绑定患者', icon: 'none' });
      return;
    }
    getApp()
      .request({
        url: '/family/patients/' + this.data.patientId + '/nudges',
        method: 'POST',
        data: { message: this.data.nudgeMsg },
      })
      .then(function () {
        that.setData({ nudgeSent: true });
        setTimeout(function () {
          that.setData({ nudgeSent: false });
        }, 3000);
        wx.showToast({ title: '已发送', icon: 'success' });
      })
      .catch(function (err) {
        wx.showToast({ title: (err && err.message) || '发送失败', icon: 'none' });
      });
  },

  onLogout: function () {
    wx.showModal({
      title: '退出登录',
      content: '确定退出并返回登录页吗？',
      success: function (res) {
        if (res.confirm) getApp().logout();
      },
    });
  },
});
