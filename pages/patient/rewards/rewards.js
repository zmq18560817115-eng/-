var checkin = require('../../../utils/checkin.js');

var BADGE_DEFS = [
  { name: '初出茅庐', emoji: '🌱', benefit: '理疗拉力限值+2N', minDays: 1 },
  { name: '膝健常青', emoji: '🌲', benefit: '开启高频揉合模式', minDays: 3 },
  { name: '意志守护', emoji: '🛡️', benefit: '智能算法优先级高', minDays: 5 },
  { name: '孝行自如', emoji: '❤️', benefit: '一键督促双向触达', minDays: 0 },
];

function buildCalendar(checkInDates) {
  var days = [];
  var offset = 5;
  var i;
  for (i = 0; i < offset; i++) {
    days.push({ key: 'e' + i, empty: true });
  }
  for (i = 1; i <= 31; i++) {
    var dateStr = '2026-05-' + (i < 10 ? '0' + i : '' + i);
    days.push({
      key: 'd' + i,
      empty: false,
      dayNum: i,
      dateStr: dateStr,
      checked: checkInDates.indexOf(dateStr) !== -1,
      today: i === 31,
    });
  }
  return days;
}

function buildBadges(streak) {
  return BADGE_DEFS.map(function (b) {
    return {
      name: b.name,
      emoji: b.emoji,
      benefit: b.benefit,
      unlocked: b.minDays === 0 ? true : streak >= b.minDays,
    };
  });
}

Page({
  data: {
    streakDays: 0,
    checkInDates: [],
    calendarDays: [],
    weekLabels: ['日', '一', '二', '三', '四', '五', '六'],
    badges: [],
    showChart: false,
  },

  onShow: function () {
    if (!getApp().ensurePatientLogin()) return;
    this.refresh();
  },

  refresh: function () {
    var that = this;
    checkin.fetchCheckIns().then(function (dates) {
      that.applyDates(dates);
    });
    getApp()
      .request({ url: '/patients/me/device', method: 'GET' })
      .then(function (d) {
        var linked = d.connection !== 'disconnected';
        that.setData({
          showChart: linked && that.data.streakDays > 0,
        });
      })
      .catch(function () {});
  },

  applyDates: function (dates) {
    this.setData({
      checkInDates: dates,
      streakDays: dates.length,
      calendarDays: buildCalendar(dates),
      badges: buildBadges(dates.length),
    });
  },

  onDayTap: function (e) {
    var dateStr = e.currentTarget.dataset.date;
    if (!dateStr) return;
    if (this.data.checkInDates.indexOf(dateStr) !== -1) {
      wx.showToast({ title: '该日已打卡', icon: 'none' });
      return;
    }
    var that = this;
    checkin.addCheckIn(dateStr).then(function (dates) {
      that.applyDates(dates);
      that.setData({ showChart: that.data.showChart || dates.length > 0 });
      wx.showToast({ title: '打卡成功', icon: 'success' });
    });
  },
});
