/** 兼容旧引用：统一走 getApp().request()，页面里不要再 require 本文件 */
module.exports = {
  request: function (options) {
    return getApp().request(options);
  },
};
