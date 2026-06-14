function todayString() {
  var d = new Date();
  var y = d.getFullYear();
  var m = d.getMonth() + 1;
  var day = d.getDate();
  return y + '-' + (m < 10 ? '0' + m : '' + m) + '-' + (day < 10 ? '0' + day : '' + day);
}

function loadLocalDates() {
  var raw = wx.getStorageSync('check_in_dates');
  return Array.isArray(raw) ? raw : [];
}

function saveLocalDates(dates) {
  wx.setStorageSync('check_in_dates', dates);
}

function mergeDates(serverDates, localDates) {
  var map = {};
  (serverDates || []).forEach(function (d) {
    map[d] = true;
  });
  (localDates || []).forEach(function (d) {
    map[d] = true;
  });
  return Object.keys(map).sort();
}

function addCheckIn(dateStr) {
  return getApp()
    .request({
      url: '/patients/me/check-ins',
      method: 'POST',
      data: { date: dateStr },
    })
    .then(function (res) {
      var dates = res.dates || mergeDates([dateStr], loadLocalDates());
      saveLocalDates(dates);
      return dates;
    })
    .catch(function () {
      var dates = mergeDates([dateStr], loadLocalDates());
      saveLocalDates(dates);
      return dates;
    });
}

function fetchCheckIns() {
  return getApp()
    .request({ url: '/patients/me/check-ins', method: 'GET' })
    .then(function (res) {
      var dates = mergeDates(res.dates, loadLocalDates());
      saveLocalDates(dates);
      return dates;
    })
    .catch(function () {
      return loadLocalDates();
    });
}

module.exports = {
  todayString: todayString,
  loadLocalDates: loadLocalDates,
  mergeDates: mergeDates,
  addCheckIn: addCheckIn,
  fetchCheckIns: fetchCheckIns,
};
