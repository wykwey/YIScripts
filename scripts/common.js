
 // YiClass 教务导入标准脚本框架
 
(async () => {
  
  //  登录检测模块
  
  async function checkLogin() {
    const baseUrl = location.origin;
    const res = await fetch(baseUrl, { credentials: 'include' });
    const html = await res.text();
    // 简单规则：页面包含"登录"字样即视为未登录
    const notLoggedIn = html.includes('登录') || html.includes('Login') || html.includes('login');
    return !notLoggedIn;
  }

  
  //  公告模块
  
  function showNotice() {
    // 如需提示，替换为空字符串即可定制
    alert('');
  }

  
  //  选择模块（示例：选择学期）
  
  function selectSemester() {
    const SEMESTERS = ['2025秋季', '2025春季', '2024秋季'];
    const choice = prompt(SEMESTERS.map((op, i) => `\n${i + 1}. ${op}`).join(''));
    const index = parseInt(choice, 10) - 1;
    return (Number.isInteger(index) && index >= 0 && index < SEMESTERS.length)
      ? SEMESTERS[index]
      : SEMESTERS[0];
  }

  
  //  设置模块
  
  function buildDefaultSettings() {
    const classTimes = [
      { period: 1, startTime: '08:00', endTime: '08:45' },
      { period: 2, startTime: '08:55', endTime: '09:40' },
      { period: 3, startTime: '10:00', endTime: '10:45' },
      { period: 4, startTime: '10:55', endTime: '11:40' },
      { period: 5, startTime: '14:00', endTime: '14:45' },
      { period: 6, startTime: '14:55', endTime: '15:40' },
      { period: 7, startTime: '16:00', endTime: '16:45' },
      { period: 8, startTime: '16:55', endTime: '17:40' }
    ];
    return {
      startDate: new Date().toISOString(),
      totalWeeks: 18,
      showWeekend: false,
      maxPeriods: 16,
      classTimes,
      reminderMinutes: 10
    };
  }

  
  //  抓取模块（占位，不实现具体逻辑）
  
  async function fetchRawData() {
    // 在子模块内写入相应请求逻辑
    return '<html></html>'; // 占位返回
  }

  
  //  解析模块（占位，不实现具体逻辑）
  
  function parseData(raw) {
    // 返回结构化课表数据
    return { courses: [] };
  }

  
  // 合并模块（构建 Timetable 对象）
  
  function mergeTimetable(name, settings, courses) {
    return {
      name: `${name}`,
      isDefault: false,
      settings,
      courses
    };
  }


  //  回调模块（统一接口）
  function sendResult(success, data = null, message = '') {
    const payload = { success, data, message, time: Date.now() };
    if (window.YiClassBridge?.postMessage) {
      YiClassBridge.postMessage(JSON.stringify(payload));
    }
  }
  
  // 🚀 主流程控制（封装为函数）
  
  async function runImport() {
    try {
      // 登录检测（第一个模块，失败立即中断）
      const loggedIn = await checkLogin();
      if (!loggedIn) {
        return sendResult(false, null, '未登录，请先登录教务系统');
      }

      // 公告（不失败）
      showNotice();

      // 选择（无效输入回退到默认第一项）
      const semester = selectSemester();

      // 设置
      const settings = buildDefaultSettings();

      // 抓取
      const raw = await fetchRawData();
      if (!raw) {
        return sendResult(false, null, '课表数据为空');
      }

      // 解析
      const parsed = parseData(raw);
      if (!parsed || !parsed.courses) {
        return sendResult(false, null, '课表解析失败');
      }

      // 合并
      const timetable = mergeTimetable('课表', settings, parsed.courses);

      sendResult(true, timetable, '导入成功');
    } catch (err) {
      sendResult(false, null, err?.message || '未知错误');
    }
  }

  await runImport();

})();

