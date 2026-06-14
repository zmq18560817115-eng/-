var FALLBACK_PATIENTS = [
  { id: '2001', name: '王大爷', age: 67, pain: 7, wear: 4, fluid: 3, attendance: 75, phone: '186****5678', today_done: true },
  { id: '2002', name: '张阿姨', age: 58, pain: 4, wear: 2, fluid: 1, attendance: 50, phone: '155****8888', today_done: false },
  { id: '2003', name: '程序员小李', age: 32, pain: 5, wear: 1, fluid: 2, attendance: 60, phone: '177****5555', today_done: true },
];

Page({
  data: {
    activeTab: 'workbench',
    navTitle: '全景工作台',
    doctorName: '执业医师',
    isVerified: false,
    patients: FALLBACK_PATIENTS,
    selectedPatientId: '2001',
    activePatient: FALLBACK_PATIENTS[0],
    rxLeft: 18,
    rxRight: 16,
    rxTemp: 42,
    rxDuration: 20,
    caseName: '重度半月板磨损合并少量间隙狭窄',
    caseAge: 65,
    clinicalCases: [],
    clinicalCount: 0,
    verifyDept: '骨科康复科',
    verifyLicense: 'DOC-2026-MED',
    lastAuthCode: '',
  },

  onShow: function () {
    if (!getApp().ensureDoctorLogin()) return;
    this.refreshProfile();
    this.refreshPatients();
    this.refreshCases();
  },

  refreshProfile: function () {
    var that = this;
    getApp()
      .request({ url: '/doctors/me', method: 'GET' })
      .then(function (p) {
        that.setData({
          doctorName: p.name || '执业医师',
          isVerified: !!p.is_verified,
          verifyDept: p.dept || that.data.verifyDept,
          verifyLicense: p.license_id || that.data.verifyLicense,
        });
      })
      .catch(function () {});
  },

  refreshPatients: function () {
    var that = this;
    getApp()
      .request({ url: '/doctors/me/patients', method: 'GET' })
      .then(function (res) {
        if (res.patients && res.patients.length) {
          var list = res.patients.map(function (p) {
            return {
              id: p.id,
              name: p.name,
              age: p.age,
              pain: p.pain,
              wear: p.wear,
              fluid: p.fluid,
              attendance: p.attendance,
              phone: p.phone,
              today_done: p.today_done,
            };
          });
          that.setData({
            patients: list,
            selectedPatientId: list[0].id,
            activePatient: list[0],
          });
        }
      })
      .catch(function () {});
  },

  refreshCases: function () {
    var that = this;
    getApp()
      .request({ url: '/clinical-cases', method: 'GET' })
      .then(function (res) {
        var cases = res.cases || res || [];
        that.setData({
          clinicalCases: cases.slice(0, 5),
          clinicalCount: cases.length,
        });
      })
      .catch(function () {});
  },

  onTabChange: function (e) {
    var tab = e.currentTarget.dataset.tab;
    var titles = {
      workbench: '全景工作台',
      research: '博爱学术研发工作间',
      license: '数字医生资质审定',
    };
    this.setData({ activeTab: tab, navTitle: titles[tab] });
  },

  onSelectPatient: function (e) {
    var id = e.currentTarget.dataset.id;
    var patient = null;
    var list = this.data.patients;
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) {
        patient = list[i];
        break;
      }
    }
    if (patient) {
      this.setData({ selectedPatientId: id, activePatient: patient });
    }
  },

  onRxLeft: function (e) {
    this.setData({ rxLeft: e.detail.value });
  },
  onRxRight: function (e) {
    this.setData({ rxRight: e.detail.value });
  },
  onRxTemp: function (e) {
    this.setData({ rxTemp: e.detail.value });
  },
  onRxDuration: function (e) {
    this.setData({ rxDuration: e.detail.value });
  },

  onSendPrescription: function () {
    if (!this.data.isVerified) {
      wx.showModal({
        title: '资质未通过',
        content: '请先完成执业医师资质认证后再下发处方。',
        showCancel: false,
      });
      return;
    }
    var that = this;
    getApp()
      .request({
        url: '/doctors/me/patients/' + this.data.selectedPatientId + '/prescriptions',
        method: 'POST',
        data: {
          left_force: this.data.rxLeft,
          right_force: this.data.rxRight,
          temp: this.data.rxTemp,
          duration: this.data.rxDuration,
          vibration: 1,
        },
      })
      .then(function () {
        wx.showToast({ title: '处方已下发', icon: 'success' });
      })
      .catch(function (err) {
        wx.showToast({ title: (err && err.message) || '下发失败', icon: 'none' });
      });
  },

  onCaseNameInput: function (e) {
    this.setData({ caseName: e.detail.value });
  },
  onCaseAgeInput: function (e) {
    this.setData({ caseAge: e.detail.value });
  },

  onSubmitCase: function () {
    if (!this.data.isVerified) {
      wx.showToast({ title: '请先完成资质认证', icon: 'none' });
      return;
    }
    var that = this;
    getApp()
      .request({
        url: '/clinical-cases',
        method: 'POST',
        data: {
          case_name: this.data.caseName,
          symptoms: { age: Number(this.data.caseAge), cartilage_wear: 4, joint_fluid: 2, pain_score: 7 },
          treatment: { left_force: 22, right_force: 20, duration: 25, temp: 44, vibration: 1 },
        },
      })
      .then(function () {
        that.refreshCases();
        wx.showToast({ title: '病例已写入', icon: 'success' });
      })
      .catch(function (err) {
        wx.showToast({ title: (err && err.message) || '写入失败', icon: 'none' });
      });
  },

  onDeptInput: function (e) {
    this.setData({ verifyDept: e.detail.value });
  },
  onLicenseInput: function (e) {
    this.setData({ verifyLicense: e.detail.value });
  },

  onSubmitVerify: function () {
    var that = this;
    getApp()
      .request({
        url: '/doctors/me/verification',
        method: 'POST',
        data: {
          dept: this.data.verifyDept,
          license_id: this.data.verifyLicense,
        },
      })
      .then(function (res) {
        that.setData({ isVerified: !!res.is_verified });
        wx.showToast({ title: '认证成功', icon: 'success' });
      })
      .catch(function (err) {
        wx.showToast({ title: (err && err.message) || '认证失败', icon: 'none' });
      });
  },

  onOpenVerify: function () {
    this.setData({ activeTab: 'license', navTitle: '数字医生资质审定' });
  },

  onGenerateAuthCode: function () {
    if (!this.data.isVerified) {
      wx.showToast({ title: '请先完成资质认证', icon: 'none' });
      return;
    }
    var that = this;
    getApp()
      .request({
        url: '/doctors/me/patients/' + this.data.selectedPatientId + '/auth-codes',
        method: 'POST',
        data: {
          left_force: this.data.rxLeft,
          right_force: this.data.rxRight,
          temp: this.data.rxTemp,
          duration: this.data.rxDuration,
          vibration: 1,
        },
      })
      .then(function (res) {
        that.setData({ lastAuthCode: res.code || res.auth_code || '' });
        wx.showModal({
          title: '授权码已生成',
          content: '请告诉患者输入：' + (res.code || res.auth_code),
          showCancel: false,
        });
      })
      .catch(function (err) {
        wx.showToast({ title: (err && err.message) || '生成失败', icon: 'none' });
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
