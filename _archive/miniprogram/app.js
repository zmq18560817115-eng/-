/**
 * ========== API 地址配置（上传体验版前必读）==========
 *
 * 【场景 A】仅自己/同 WiFi 同事演示：
 *   - PROD_API_HOST 留空
 *   - 改 LAN_API_HOST 为你 Mac 当前 IP（终端执行：ipconfig getifaddr en0）
 *   - Mac 运行：bash scripts/start-production.sh
 *   - 手机必须与 Mac 同一 WiFi
 *
 * 【场景 B】体验版给外地的人扫码（推荐答辩/远程演示）：
 *   - 终端1：bash scripts/start-production.sh（保持运行）
 *   - 终端2：bash scripts/start-experience.sh（保持运行，关掉即 503）
 *   - 浏览器验证 https://你的域名/api/v1/health 返回 ok 后再上传
 *   - 填写 PROD_API_HOST（localtunnel 示例：'https://xxx.loca.lt'）
 *   - 公众平台 → 开发设置 → 服务器域名 → request 合法域名（只填域名，无 https://）
 *   - localtunnel 不稳定时：ngrok config add-authtoken <token> 后 TUNNEL=ngrok bash scripts/start-experience.sh
 *
 * 模拟器始终用 127.0.0.1，不受下面两项影响。
 */
// localtunnel 目前极不稳定，legal-bugs-tease.loca.lt 常会 503，请改用 ngrok 或同 WiFi
var PROD_API_HOST = '';
var LAN_API_HOST = 'http://10.46.115.204:8080';

function getPlatform() {
  try {
    if (wx.getDeviceInfo) {
      return wx.getDeviceInfo().platform || '';
    }
    return wx.getSystemInfoSync().platform || '';
  } catch (e) {
    return '';
  }
}

function resolveApiHost() {
  // 体验版/真机：优先公网地址（填 PROD_API_HOST 后重新上传）
  if (PROD_API_HOST) {
    return PROD_API_HOST.replace(/\/$/, '');
  }
  // 仅开发者工具模拟器走本地
  if (getPlatform() === 'devtools') {
    return 'http://127.0.0.1:8080';
  }
  // 同 WiFi 真机预览
  return LAN_API_HOST;
}

function isRemoteApiHost() {
  return !!PROD_API_HOST;
}

function navigateToRoleHome(role) {
  if (role === 'patient') {
    wx.reLaunch({ url: '/pages/patient/therapy/therapy' });
    return;
  }
  if (role === 'doctor') {
    wx.reLaunch({ url: '/pages/doctor/home/home' });
    return;
  }
  if (role === 'family') {
    wx.reLaunch({ url: '/pages/family/home/home' });
  }
}

App({
  globalData: {
    apiHost: '',
    apiBase: '',
    apiRemote: false,
    requestTimeout: 20000,
    token: null,
    role: null,
    user: null,
  },

  request: function (options) {
    var app = this;
    var header = { 'Content-Type': 'application/json' };
    if (app.globalData.token) {
      header.Authorization = 'Bearer ' + app.globalData.token;
    }
    if (options.header) {
      for (var key in options.header) {
        header[key] = options.header[key];
      }
    }

    return new Promise(function (resolve, reject) {
      wx.request({
        url: app.globalData.apiBase + options.url,
        method: options.method || 'GET',
        data: options.data,
        timeout: app.globalData.requestTimeout,
        header: header,
        success: function (res) {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(res.data);
            return;
          }
          reject(new Error((res.data && res.data.error) || '请求失败(' + res.statusCode + ')'));
        },
        fail: function (err) {
          var msg = (err && err.errMsg) || '网络错误';
          if (msg.indexOf('timeout') !== -1) {
            reject(
              new Error(
                '连接超时。模拟器：确认 Mac 已运行 start-production.sh；手机预览：手机与 Mac 同一 WiFi，且 LAN_API_HOST IP 正确'
              )
            );
            return;
          }
          reject(new Error(msg));
        },
      });
    });
  },

  redirectToLogin: function () {
    var pages = getCurrentPages();
    if (pages.length && pages[pages.length - 1].route === 'pages/login/login') {
      return;
    }
    wx.reLaunch({ url: '/pages/login/login' });
  },

  ensurePatientLogin: function () {
    if (!this.globalData.token) {
      this.globalData.token = wx.getStorageSync('kneejoy_token') || null;
    }
    if (!this.globalData.role) {
      this.globalData.role = wx.getStorageSync('kneejoy_role') || null;
    }
    if (this.globalData.token && this.globalData.role === 'patient') {
      return true;
    }
    this.redirectToLogin();
    return false;
  },

  ensureDoctorLogin: function () {
    if (!this.globalData.token) {
      this.globalData.token = wx.getStorageSync('kneejoy_token') || null;
    }
    if (!this.globalData.role) {
      this.globalData.role = wx.getStorageSync('kneejoy_role') || null;
    }
    if (this.globalData.token && this.globalData.role === 'doctor') {
      return true;
    }
    this.redirectToLogin();
    return false;
  },

  ensureFamilyLogin: function () {
    if (!this.globalData.token) {
      this.globalData.token = wx.getStorageSync('kneejoy_token') || null;
    }
    if (!this.globalData.role) {
      this.globalData.role = wx.getStorageSync('kneejoy_role') || null;
    }
    if (this.globalData.token && this.globalData.role === 'family') {
      return true;
    }
    this.redirectToLogin();
    return false;
  },

  logout: function () {
    var app = this;
    var finish = function () {
      app.globalData.token = null;
      app.globalData.role = null;
      app.globalData.user = null;
      wx.removeStorageSync('kneejoy_token');
      wx.removeStorageSync('kneejoy_role');
      wx.removeStorageSync('active_session_id');
      wx.reLaunch({ url: '/pages/login/login' });
    };
    if (app.globalData.token) {
      app.request({ url: '/auth/logout', method: 'POST' }).then(finish).catch(finish);
    } else {
      finish();
    }
  },

  onLaunch: function () {
    var host = resolveApiHost();
    this.globalData.apiHost = host;
    this.globalData.apiBase = host + '/api/v1';
    this.globalData.apiRemote = isRemoteApiHost();

    var token = wx.getStorageSync('kneejoy_token');
    var role = wx.getStorageSync('kneejoy_role');
    if (token) {
      this.globalData.token = token;
      this.globalData.role = role;
    }
    console.log('[KneeJoy] API =', this.globalData.apiBase);

    if (token && role) {
      var app = this;
      setTimeout(function () {
        var pages = getCurrentPages();
        if (pages.length === 1 && pages[0].route === 'pages/login/login') {
          navigateToRoleHome(role);
        }
      }, 0);
    }
  },

  navigateToRoleHome: navigateToRoleHome,
});
