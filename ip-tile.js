/**
 * Stash Tile 脚本：查询当前公网 IP 并更新面板
 */

$httpClient.get('https://api.ipify.org?format=json', function(error, response, data) {
  // 1. 请求失败时的处理
  if (error) {
    $done({
      title: '网络异常',
      content: '无法获取公网 IP',
      icon: 'exclamationmark.triangle',
      backgroundColor: '#B22222'
    });
    return;
  }

  // 2. 请求成功，解析并更新 Tile 内容
  try {
    const result = JSON.parse(data);
    $done({
      title: '当前公网 IP',
      content: result.ip,
      icon: 'globe',
      backgroundColor: '#663399',
      url: 'https://ip.sb'
    });
  } catch (e) {
    // 解析 JSON 异常时的保底处理
    $done({
      title: '数据解析失败',
      content: '返回数据格式不正确',
      icon: 'xmark.octagon',
      backgroundColor: '#D2691E'
    });
  }
});
