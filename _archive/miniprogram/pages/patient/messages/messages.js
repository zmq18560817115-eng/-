var msgUtil = require('../../../utils/messages.js');

Page({
  data: {
    loading: true,
    filter: 'all',
    filterLabel: '',
    filters: [
      { id: 'all', label: '全部' },
      { id: 'doctor', label: '来自医生' },
      { id: 'family', label: '来自家属' },
    ],
    messages: [],
    displayList: [],
  },

  onShow: function () {
    if (!getApp().ensurePatientLogin()) return;
    this.loadMessages();
  },

  loadMessages: function () {
    var that = this;
    this.setData({ loading: true });
    msgUtil
      .fetchMessages()
      .then(function (res) {
        var list = (res.messages || []).map(function (m) {
          return Object.assign({}, m, { timeText: msgUtil.formatTime(m.timestamp) });
        });
        that.setData({ messages: list, loading: false });
        that.applyFilter(that.data.filter);
        wx.setStorageSync('message_unread', msgUtil.countUnread(list));
      })
      .catch(function () {
        that.setData({ loading: false, messages: [], displayList: [] });
      });
  },

  applyFilter: function (filter) {
    var list = this.data.messages;
    var display = list;
    var label = '';
    if (filter === 'doctor') {
      display = list.filter(function (m) {
        return m.category === 'doctor';
      });
      label = '医生处方';
    } else if (filter === 'family') {
      display = list.filter(function (m) {
        return m.category === 'family';
      });
      label = '家属关怀';
    }
    this.setData({ filter: filter, displayList: display, filterLabel: label });
  },

  onFilterChange: function (e) {
    this.applyFilter(e.currentTarget.dataset.filter);
  },

  onTapMessage: function (e) {
    var id = e.currentTarget.dataset.id;
    var that = this;
    msgUtil.markRead(id).then(function () {
      var messages = that.data.messages.map(function (m) {
        if (m.id === id) return Object.assign({}, m, { read: true });
        return m;
      });
      that.setData({ messages: messages });
      that.applyFilter(that.data.filter);
      wx.setStorageSync('message_unread', msgUtil.countUnread(messages));
    });
  },

  onAcceptRx: function (e) {
    var rxId = e.currentTarget.dataset.rxId;
    var msgId = e.currentTarget.dataset.msgId;
    var that = this;
    msgUtil.acceptPrescription(rxId).then(function () {
      msgUtil.markRead(msgId);
      wx.showToast({ title: '处方已载入', icon: 'success' });
      that.loadMessages();
    }).catch(function (err) {
      wx.showToast({ title: (err && err.message) || '载入失败', icon: 'none' });
    });
  },
});
