var VIB_LABELS = ['关', '低频', '高频'];
var PAIN_VALUES = [1, 3, 5, 7, 9];
var checkin = require('../../../utils/checkin.js');
var msgUtil = require('../../../utils/messages.js');
var chatDoctor = require('../../../utils/chatDoctor.js');

function pad2(n) {
  return n < 10 ? '0' + n : '' + n;
}

Page({
  data: {
    isLinked: false,
    isConnecting: false,
    statusBadge: '离线模式',
    connectionDesc: '现在还没连接物理设备，您可以点击右侧开关开启蓝牙，或者点击下方徒手练习。',
    connectionError: '',
    connection: 'disconnected',
    leftForce: 20,
    rightForce: 17,
    temp: 39,
    duration: 20,
    vibration: 1,
    vibrationLabel: '低频',
    isRunning: false,
    timeLeftSeconds: 0,
    timeMin: '00',
    timeSec: '00',
    simProgress: 0,
    manualMode: false,
    sessionId: '',
    messageUnread: 0,
    therapyStep: 'symptom',
    symptomsAssessed: false,
    symptomAge: '',
    symptomWearIdx: 2,
    symptomFluidIdx: 1,
    symptomPainScore: 5,
    matchResult: null,
    matchedCaseId: null,
    chatMessages: [],
    isDoctorTyping: false,
    chatScrollId: '',
    showColdBoot: false,
    coldBootStep: 'select',
    doctorCode: '',
    assessAge: '',
    assessWearIdx: 2,
    assessFluidIdx: 1,
    assessPainIdx: 3,
    wearLabels: ['1级 磨损较轻', '2级 软骨有磨损', '3级 轻中度磨损', '4级 磨损严重'],
    fluidLabels: ['1级 几乎无感', '2级 偶尔发胀', '3级 经常肿胀', '4级 严重积液'],
    painLabels: ['1分 几乎不痛', '3分 轻度', '5分 中度', '7分 较重', '9分 剧烈'],
  },

  timer: null,

  onShow: function () {
    if (!getApp().ensurePatientLogin()) return;
    this.refreshProfile();
    this.refreshHardware();
    this.refreshMessages();
    this.startTimer();
  },

  onHide: function () {
    this.stopTimer();
  },

  onUnload: function () {
    this.stopTimer();
  },

  startTimer: function () {
    var that = this;
    this.stopTimer();
    this.timer = setInterval(function () {
      if (that.data.isRunning && that.data.timeLeftSeconds > 0) {
        var next = that.data.timeLeftSeconds - 1;
        var total = that.data.duration * 60 || 1;
        var progress = Math.round(((total - next) / total) * 100);
        that.setData({
          timeLeftSeconds: next,
          timeMin: pad2(Math.floor(next / 60)),
          timeSec: pad2(next % 60),
          simProgress: progress,
        });
      }
    }, 1000);
  },

  stopTimer: function () {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  },

  refreshMessages: function () {
    var that = this;
    var cached = wx.getStorageSync('message_unread');
    if (typeof cached === 'number') {
      this.setData({ messageUnread: cached });
    }
    msgUtil
      .fetchMessages()
      .then(function (res) {
        var n = msgUtil.countUnread(res.messages || []);
        wx.setStorageSync('message_unread', n);
        that.setData({ messageUnread: n });
      })
      .catch(function () {});
  },

  onOpenMessages: function () {
    wx.navigateTo({ url: '/pages/patient/messages/messages' });
  },

  applyDevice: function (d) {
    var linked = d.connection !== 'disconnected';
    var badge = linked ? '已配对' : '离线模式';
    var desc = linked
      ? d.connection === 'wifi'
        ? '您的膝关节理疗仪已通过家庭 Wi-Fi 连接，随时可以开启理疗。'
        : '您的膝关节理疗仪已通过蓝牙连接，随时可以开启理疗。'
      : '现在还没连接物理设备，您可以点击右侧开关开启蓝牙，或者点击下方徒手练习。';

    var sec = d.time_left_seconds != null ? d.time_left_seconds : d.duration * 60 || 0;
    var total = d.duration * 60 || 1;
    var progress = d.is_running ? Math.round(((total - sec) / total) * 100) : 0;

    var sessionId = d.active_session_id || this.data.sessionId || wx.getStorageSync('active_session_id') || '';
    if (d.active_session_id) {
      wx.setStorageSync('active_session_id', d.active_session_id);
    } else if (!d.is_running) {
      wx.removeStorageSync('active_session_id');
      sessionId = '';
    }

    this.setData({
      isLinked: linked,
      isConnecting: false,
      statusBadge: badge,
      connectionDesc: desc,
      connection: d.connection,
      leftForce: d.left_force || 20,
      rightForce: d.right_force || 17,
      temp: d.temp || 39,
      duration: d.duration || 20,
      vibration: d.vibration != null ? d.vibration : 1,
      vibrationLabel: VIB_LABELS[d.vibration] || '低频',
      isRunning: !!d.is_running,
      timeLeftSeconds: sec,
      timeMin: pad2(Math.floor(sec / 60)),
      timeSec: pad2(sec % 60),
      simProgress: progress,
      sessionId: sessionId,
      therapyStep: d.is_running ? 'control' : this.data.therapyStep,
    });
  },

  refreshProfile: function () {
    var that = this;
    getApp()
      .request({ url: '/patients/me', method: 'GET' })
      .then(function (p) {
        var step = p.symptoms_assessed ? 'control' : 'symptom';
        that.setData({
          showColdBoot: !p.onboarding_completed,
          symptomsAssessed: !!p.symptoms_assessed,
          therapyStep: step,
          symptomAge: p.age ? String(p.age) : '',
          symptomWearIdx: Math.max(0, (p.cartilage_wear || 3) - 1),
          symptomFluidIdx: Math.max(0, (p.joint_fluid || 2) - 1),
          symptomPainScore: p.pain_score || 5,
        });
      })
      .catch(function () {});
  },

  refreshHardware: function () {
    var that = this;
    getApp()
      .request({ url: '/patients/me/device', method: 'GET' })
      .then(function (d) {
        that.applyDevice(d);
      })
      .catch(function () {
        that.setData({
          isLinked: false,
          statusBadge: '离线模式',
          connectionDesc: '无法获取设备状态，请确认后端已启动且 app.js 中 IP 正确。',
        });
      });
  },

  onToggleConnection: function (e) {
    var that = this;
    var turnOn = e.detail.value;

    if (turnOn) {
      this.setData({
        isConnecting: true,
        statusBadge: '连接中…',
        connectionDesc: '正在搜索并配对您的膝悦理疗仪，请保持设备开机并靠近手机。',
        connectionError: '',
      });
    }

    var next = turnOn ? 'bluetooth' : 'disconnected';
    getApp()
      .request({
        url: '/patients/me/device/connection',
        method: 'PATCH',
        data: { connection: next },
      })
      .then(function (d) {
        that.applyDevice(d);
        if (turnOn && !that.data.symptomsAssessed) {
          that.setData({ therapyStep: 'symptom' });
        }
      })
      .catch(function (err) {
        that.setData({
          isConnecting: false,
          connectionError: (err && err.message) || '连接失败',
          statusBadge: '连接失败',
        });
        that.refreshHardware();
      });
  },

  getSymptomsPayload: function () {
    return {
      age: Number(this.data.symptomAge),
      cartilage_wear: this.data.symptomWearIdx + 1,
      joint_fluid: this.data.symptomFluidIdx + 1,
      pain_score: this.data.symptomPainScore,
    };
  },

  onSymptomAgeInput: function (e) {
    this.setData({ symptomAge: e.detail.value });
  },
  onSymptomWearChange: function (e) {
    this.setData({ symptomWearIdx: Number(e.detail.value) });
  },
  onSymptomFluidChange: function (e) {
    this.setData({ symptomFluidIdx: Number(e.detail.value) });
  },
  onSymptomPainChange: function (e) {
    this.setData({ symptomPainScore: e.detail.value });
  },

  onRunMatch: function () {
    var payload = this.getSymptomsPayload();
    if (!payload.age) {
      wx.showToast({ title: '请填写年龄', icon: 'none' });
      return;
    }
    var that = this;
    getApp()
      .request({ url: '/treatment/match', method: 'POST', data: payload })
      .then(function (res) {
        var c = res.matched_case;
        var t = c.treatment;
        that.setData({
          therapyStep: 'matching',
          matchedCaseId: c.case_id,
          matchResult: {
            case_name: c.case_name,
            similarity: Math.round(res.similarity || 90),
            left_force: t.left_force,
            right_force: t.right_force,
            temp: t.temp,
            duration: t.duration,
            vibration: t.vibration,
          },
        });
      })
      .catch(function (err) {
        wx.showToast({ title: (err && err.message) || '匹配失败', icon: 'none' });
      });
  },

  onAcceptMatch: function () {
    var that = this;
    var caseId = this.data.matchedCaseId;
    if (!caseId) return;
    getApp()
      .request({
        url: '/treatment/recommendations/' + caseId + '/accept',
        method: 'POST',
      })
      .then(function () {
        var payload = that.getSymptomsPayload();
        return getApp().request({
          url: '/patients/me/symptoms',
          method: 'PATCH',
          data: Object.assign({}, payload, { onboarding_completed: true }),
        });
      })
      .then(function () {
        that.setData({ therapyStep: 'control', symptomsAssessed: true, showColdBoot: false });
        that.refreshHardware();
        wx.showToast({ title: '方案已载入', icon: 'success' });
      })
      .catch(function (err) {
        wx.showToast({ title: (err && err.message) || '载入失败', icon: 'none' });
      });
  },

  onGoSymptom: function () {
    this.setData({ therapyStep: 'symptom' });
  },
  onGoMatching: function () {
    this.setData({ therapyStep: 'matching' });
  },
  onGoChat: function () {
    this.setData({
      therapyStep: 'chat',
      chatMessages: [
        {
          sender: 'doctor',
          text: '您好，我是李敬东主任。看到您的自评结果了，如有顾虑可以直接点下方快捷提问，我会为您定制更安全的特配方案。',
        },
      ],
    });
  },
  onSkipToControl: function () {
    this.setData({ therapyStep: 'control' });
  },

  onChatQuestion: function (e) {
    if (this.data.isDoctorTyping) return;
    var type = Number(e.currentTarget.dataset.type);
    var timeStr = chatDoctor.nowTimeStr();
    var userTexts = {
      1: '我当前的自测疼痛值比较高（' + this.data.symptomPainScore + '分），这个推荐拉伸拉力会不会拉力过载？',
      2: '我目前膝周依然酸胀，热敷温度是否可以消胀？',
      3: '我的关节软骨属于陈旧性慢磨损，希望能有极其柔和的减阻慢拉理疗方案。',
    };
    var userMsg = { sender: 'user', text: userTexts[type] || userTexts[1] };
    var messages = this.data.chatMessages.concat([userMsg]);
    this.setData({ chatMessages: messages, isDoctorTyping: true, chatScrollId: 'msg-' + (messages.length - 1) });

    var that = this;
    var ctx = {
      painScore: this.data.symptomPainScore,
      jointFluid: this.data.symptomFluidIdx + 1,
    };
    setTimeout(function () {
      var resp = chatDoctor.getChatResponse(type, ctx);
      var next = that.data.chatMessages.concat([
        { sender: 'doctor', text: resp.docText, time: timeStr },
        {
          sender: 'doctor',
          text: resp.actionText,
          time: timeStr,
          isAction: true,
          actionParams: resp.params,
        },
      ]);
      that.setData({
        chatMessages: next,
        isDoctorTyping: false,
        chatScrollId: 'msg-' + (next.length - 1),
      });
    }, 1200);
  },

  onApplyChatRx: function (e) {
    var idx = Number(e.currentTarget.dataset.idx);
    var msg = this.data.chatMessages[idx];
    if (!msg || !msg.actionParams) return;
    var p = msg.actionParams;
    var that = this;
    getApp()
      .request({
        url: '/patients/me/treatment/params',
        method: 'PATCH',
        data: p,
      })
      .then(function () {
        that.setData({ therapyStep: 'control', symptomsAssessed: true });
        that.refreshHardware();
        wx.showToast({ title: '特配方案已应用', icon: 'success' });
      });
  },

  onToggleManual: function (e) {
    this.setData({ manualMode: e.detail.value });
  },

  patchParams: function (payload) {
    if (!this.data.manualMode || this.data.isRunning) return;
    var that = this;
    getApp()
      .request({
        url: '/patients/me/treatment/params',
        method: 'PATCH',
        data: payload,
      })
      .then(function (res) {
        that.setData({
          leftForce: res.params.left_force,
          rightForce: res.params.right_force,
          temp: res.params.temp,
          duration: res.params.duration,
          vibration: res.params.vibration,
          vibrationLabel: VIB_LABELS[res.params.vibration] || '低频',
        });
      });
  },

  onLeftForceChange: function (e) {
    this.setData({ leftForce: e.detail.value });
    this.patchParams({ left_force: e.detail.value });
  },
  onRightForceChange: function (e) {
    this.setData({ rightForce: e.detail.value });
    this.patchParams({ right_force: e.detail.value });
  },
  onTempChange: function (e) {
    this.setData({ temp: e.detail.value });
    this.patchParams({ temp: e.detail.value });
  },
  onDurationChange: function (e) {
    this.setData({ duration: e.detail.value });
    this.patchParams({ duration: e.detail.value });
  },
  onVibrationChange: function (e) {
    if (!this.data.manualMode || this.data.isRunning) return;
    var mode = Number(e.currentTarget.dataset.mode);
    this.setData({ vibration: mode, vibrationLabel: VIB_LABELS[mode] });
    this.patchParams({ vibration: mode });
  },

  onSwitchAccount: function () {
    wx.showModal({
      title: '切换账号',
      content: '确定退出当前账号并返回登录页吗？',
      confirmText: '退出登录',
      success: function (res) {
        if (res.confirm) getApp().logout();
      },
    });
  },

  onToggleRunning: function () {
    var that = this;
    var app = getApp();

    if (this.data.isRunning) {
      var sid = this.data.sessionId || wx.getStorageSync('active_session_id');
      if (!sid) {
        wx.showToast({ title: '未找到会话', icon: 'none' });
        return;
      }
      app
        .request({
          url: '/patients/me/treatment/sessions/' + sid,
          method: 'PATCH',
          data: { status: 'stopped' },
        })
        .then(function () {
          that.refreshHardware();
        })
        .catch(function (err) {
          wx.showToast({ title: (err && err.message) || '停止失败', icon: 'none' });
        });
      return;
    }

    app
      .request({
        url: '/patients/me/treatment/sessions',
        method: 'POST',
        data: {
          left_force: this.data.leftForce,
          right_force: this.data.rightForce,
          temp: this.data.temp,
          duration: this.data.duration,
          vibration: this.data.vibration,
          source: 'manual',
        },
      })
      .then(function (session) {
        wx.setStorageSync('active_session_id', session.id);
        that.setData({ sessionId: session.id, simProgress: 0, therapyStep: 'control' });
        that.refreshHardware();
      })
      .catch(function (err) {
        var msg = (err && err.message) || '启动失败';
        if (msg.indexOf('已有进行中') !== -1) {
          that.refreshHardware();
          wx.showToast({ title: '已恢复进行中的理疗', icon: 'none' });
          return;
        }
        wx.showToast({ title: msg, icon: 'none' });
      });
  },

  onOfflineCheckIn: function () {
    checkin.addCheckIn(checkin.todayString()).then(function () {
      wx.showToast({ title: '打卡成功，已同步家属端', icon: 'success' });
    });
  },

  onSelectCourse: function (e) {
    wx.showToast({ title: '已切换第' + e.currentTarget.dataset.course + '套课程', icon: 'none' });
  },

  onColdBootNav: function (e) {
    this.setData({ coldBootStep: e.currentTarget.dataset.step });
  },
  onDoctorCodeInput: function (e) {
    this.setData({ doctorCode: e.detail.value });
  },
  onAssessAgeInput: function (e) {
    this.setData({ assessAge: e.detail.value });
  },
  onAssessWearChange: function (e) {
    this.setData({ assessWearIdx: Number(e.detail.value) });
  },
  onAssessFluidChange: function (e) {
    this.setData({ assessFluidIdx: Number(e.detail.value) });
  },
  onAssessPainChange: function (e) {
    this.setData({ assessPainIdx: Number(e.detail.value) });
  },

  onSubmitDoctorCode: function () {
    var code = (this.data.doctorCode || '').trim();
    if (!code) {
      wx.showToast({ title: '请输入授权码', icon: 'none' });
      return;
    }
    var that = this;
    getApp()
      .request({ url: '/patients/onboarding/doctor-code', method: 'POST', data: { code: code } })
      .then(function () {
        that.setData({ showColdBoot: false, coldBootStep: 'select', therapyStep: 'control', symptomsAssessed: true });
        that.refreshHardware();
        wx.showToast({ title: '医生方案已导入', icon: 'success' });
      })
      .catch(function (err) {
        wx.showToast({ title: (err && err.message) || '导入失败', icon: 'none' });
      });
  },

  onSubmitAssessment: function () {
    var age = Number(this.data.assessAge);
    if (!age) {
      wx.showToast({ title: '请填写年龄', icon: 'none' });
      return;
    }
    var that = this;
    getApp()
      .request({
        url: '/patients/onboarding/assessment',
        method: 'POST',
        data: {
          age: age,
          cartilage_wear: this.data.assessWearIdx + 1,
          joint_fluid: this.data.assessFluidIdx + 1,
          pain_score: PAIN_VALUES[this.data.assessPainIdx],
        },
      })
      .then(function (res) {
        var c = res.matched_case;
        var t = c.treatment;
        that.setData({
          showColdBoot: false,
          coldBootStep: 'select',
          therapyStep: 'matching',
          symptomsAssessed: false,
          matchedCaseId: c.case_id,
          matchResult: {
            case_name: c.case_name,
            similarity: Math.round(res.similarity || 90),
            left_force: t.left_force,
            right_force: t.right_force,
            temp: t.temp,
            duration: t.duration,
            vibration: t.vibration,
          },
        });
        that.refreshHardware();
      })
      .catch(function (err) {
        wx.showToast({ title: (err && err.message) || '推荐失败', icon: 'none' });
      });
  },
});
