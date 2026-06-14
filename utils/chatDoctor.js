function getChatResponse(actionType, ctx) {
  var pain = ctx.painScore || 5;
  var fluid = ctx.jointFluid || 2;
  var params;
  var docText;

  if (actionType === 1) {
    docText =
      '针对您反馈的高痛感局域表现（当前自测VAS ' +
      pain +
      '分），强牵拉容易引起韧带与滑液囊的防御性紧绷。建议您第一周期采用温和的12N拉力自适应微调！红外热敷保持在43℃，促进局部炎性物质消退。我已经为您专门重新配置了下方的特配理疗包。';
    params = { left_force: 12, right_force: 12, temp: 43, duration: 20, vibration: 1 };
  } else if (actionType === 2) {
    docText =
      '关节积液量在 ' +
      fluid +
      ' 级通常处于炎症发红消胀期。此时建议温度控制在39℃低温热敷促进吸收，不宜大负荷揉捏。我已将时限改短为15分钟以保万全，您可以直接一键应用特配方案。';
    params = { left_force: 11, right_force: 11, temp: 39, duration: 15, vibration: 0 };
  } else {
    docText =
      '陈旧性骨折与半月板退行性损伤对高负载极为抗拒。为了防止二次剪切压强伤害，建议使用特配的「陈旧性小肌群微负压防护操」。牵引拉力卡死在 10N 起步安全阈值，热温40℃配合低频轻震。配方已为您定制！';
    params = { left_force: 10, right_force: 10, temp: 40, duration: 18, vibration: 1 };
  }

  return {
    docText: docText,
    actionText:
      '【三甲专家特配处方包】参数已为您直接回传至中枢：拉引力 ' +
      params.left_force +
      'N, 恒温加热 ' +
      params.temp +
      '℃, 恒湿理疗 ' +
      params.duration +
      '分钟。',
    params: params,
  };
}

function nowTimeStr() {
  var d = new Date();
  return (d.getHours() < 10 ? '0' : '') + d.getHours() + ':' + (d.getMinutes() < 10 ? '0' : '') + d.getMinutes();
}

module.exports = {
  getChatResponse: getChatResponse,
  nowTimeStr: nowTimeStr,
};
