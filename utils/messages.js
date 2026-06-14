function formatTime(ts) {
  if (!ts) return '';
  var d = new Date(ts);
  if (isNaN(d.getTime())) return ts;
  var y = d.getFullYear();
  var m = d.getMonth() + 1;
  var day = d.getDate();
  var h = d.getHours();
  var min = d.getMinutes();
  return y + '/' + m + '/' + day + ' ' + (h < 10 ? '0' + h : h) + ':' + (min < 10 ? '0' + min : min);
}

function fetchMessages() {
  return getApp().request({ url: '/patients/me/messages', method: 'GET' });
}

function markRead(messageId) {
  return getApp().request({
    url: '/patients/me/messages/' + encodeURIComponent(messageId) + '/read',
    method: 'PATCH',
  });
}

function countUnread(messages) {
  var n = 0;
  (messages || []).forEach(function (m) {
    if (!m.read) n++;
  });
  return n;
}

function acceptPrescription(prescriptionId) {
  return getApp().request({
    url: '/patients/me/prescriptions/' + prescriptionId + '/accept',
    method: 'POST',
  });
}

module.exports = {
  formatTime: formatTime,
  fetchMessages: fetchMessages,
  markRead: markRead,
  countUnread: countUnread,
  acceptPrescription: acceptPrescription,
};
