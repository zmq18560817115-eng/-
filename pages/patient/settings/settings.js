Page({
  data: {
    maxForce: 35,
    userName: '患者',
    userPhone: '',
    isLinked: false,
    connection: 'disconnected',
    connectionLabel: '未连接',
    familyBindings: [],
    bindQrToken: '',
  },

  onShow: function () {
    if (!getApp().ensurePatientLogin()) return;
    var app = getApp();
    var user = app.globalData.user;
    if (user) {
      this.setData({
        userName: user.name || '患者',
        userPhone: user.phone || '',
      });
    }
    this.refreshDevice();
    this.refreshBindings();
    this.refreshBindQr();
  },

  refreshBindQr: function () {
    var that = this;
    getApp()
      .request({ url: '/patients/me/bind-qr', method: 'GET' })
      .then(function (res) {
        that.setData({ bindQrToken: res.qr_token || res.token || 'KneeJoy-QR' });
      })
      .catch(function () {
        that.setData({ bindQrToken: '暂不可用' });
      });
  },

  onRefreshQr: function () {
    this.refreshBindQr();
    wx.showToast({ title: '已刷新', icon: 'success' });
  },

  refreshDevice: function () {
    var that = this;
    getApp()
      .request({ url: '/patients/me/device', method: 'GET' })
      .then(function (d) {
        var linked = d.connection !== 'disconnected';
        var label = linked
          ? d.connection === 'wifi'
            ? 'Wi-Fi 已连接'
            : 'BLE 已连接'
          : '未连接';
        that.setData({
          maxForce: d.max_force_limit || 35,
          isLinked: linked,
          connection: d.connection,
          connectionLabel: label,
        });
      })
      .catch(function () {});
  },

  refreshBindings: function () {
    var that = this;
    getApp()
      .request({ url: '/patients/me/family-bindings', method: 'GET' })
      .then(function (res) {
        that.setData({ familyBindings: res.bindings || [] });
      })
      .catch(function () {
        that.setData({ familyBindings: [] });
      });
  },

  onForceChange: function (e) {
    var val = e.detail.value;
    this.setData({ maxForce: val });
    getApp().request({
      url: '/patients/me/device/settings',
      method: 'PATCH',
      data: { max_force_limit: val },
    });
  },

  onConnectBle: function () {
    var that = this;
    wx.openBluetoothAdapter({
      success: function () {
        getApp()
          .request({
            url: '/patients/me/device/connection',
            method: 'PATCH',
            data: { connection: 'bluetooth' },
          })
          .then(function () {
            that.refreshDevice();
            wx.showToast({ title: '蓝牙已连接', icon: 'success' });
          });
      },
      fail: function () {
        wx.showToast({ title: '请授权蓝牙', icon: 'none' });
      },
    });
  },

  onConnectWifi: function () {
    var that = this;
    getApp()
      .request({
        url: '/patients/me/device/connection',
        method: 'PATCH',
        data: { connection: 'wifi' },
      })
      .then(function () {
        that.refreshDevice();
        wx.showToast({ title: 'Wi-Fi 已连接', icon: 'success' });
      })
      .catch(function () {
        wx.showToast({ title: 'Wi-Fi 绑定失败', icon: 'none' });
      });
  },

  onLogout: function () {
    wx.showModal({
      title: '退出登录',
      content: '确定退出并返回登录页吗？',
      confirmText: '退出',
      success: function (res) {
        if (res.confirm) {
          getApp().logout();
        }
      },
    });
  },
});
