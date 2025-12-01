/**
 * 湖南职院教务系统课表导入脚本
 * 适配 YIClass 项目
 * 
 * 使用方式：在教务系统登录后，点击导入按钮执行此脚本
 * 数据通过 YiClassChannel.postMessage() 发送给 Flutter
 */

// 检查登录状态
function isLoggedIn() {
    return !window.location.href.includes("we.hnzj.edu.cn/sso/login");
}

// 解析周次字符串，如 "1-8,10,12-16" -> [1,2,3,4,5,6,7,8,10,12,13,14,15,16]
function parseWeeks(str) {
    if (!str) return [];
    const weeks = new Set();
    for (const part of str.split(",")) {
        if (part.includes("-")) {
            const [s, e] = part.split("-").map(Number);
            for (let i = s; i <= e && i <= 20; i++) weeks.add(i);
        } else {
            const n = Number(part);
            if (n >= 1 && n <= 20) weeks.add(n);
        }
    }
    return [...weeks].sort((a, b) => a - b);
}

// 生成节次数组，如 range(1, 2) -> [1, 2]
function range(start, end) {
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

// 合并相同课程的不同时间安排
function toYIClassFormat(rawCourses) {
    const map = {};
    for (const c of rawCourses) {
        const cKey = `${c.name}|${c.position}|${c.teacher}`;
        const sKey = `${c.day}|${c.startSection}|${c.endSection}`;
        
        if (!map[cKey]) {
            map[cKey] = { name: c.name, location: c.position, teacher: c.teacher, schedules: {} };
        }
        if (!map[cKey].schedules[sKey]) {
            map[cKey].schedules[sKey] = { weekday: c.day, periods: range(c.startSection, c.endSection), weekPattern: [...c.weeks] };
        } else {
            map[cKey].schedules[sKey].weekPattern = [...new Set([...map[cKey].schedules[sKey].weekPattern, ...c.weeks])].sort((a, b) => a - b);
        }
    }
    return Object.values(map).map(c => ({ ...c, schedules: Object.values(c.schedules) }));
}

// 获取所有周课程（遍历20周）
async function fetchCourses(year, term) {
    const all = [];
    for (let week = 1; week <= 20; week++) {
        try {
            const res = await fetch(`https://one.hnzj.edu.cn/kcb/api/course?schoolYear=${year}&schoolTerm=${term}&week=${week}`);
            const { response } = await res.json();
            response.forEach(day => day.data.forEach(c => {
                const weeks = parseWeeks(c.weeks);
                if (weeks.length) all.push({
                    name: c.courseName, teacher: c.teacherName, position: c.classRoom,
                    day: day.week, startSection: +c.startSection, endSection: +c.endSection, weeks
                });
            }));
        } catch (e) { /* ignore */ }
    }
    return toYIClassFormat(all);
}

// 主流程
(async function run() {
    // 检查登录状态
    if (!isLoggedIn()) {
        window.YiClassChannel.postMessage(JSON.stringify({ error: "请先登录教务系统" }));
        return;
    }
    
    try {
        // 获取学年学期列表
        const res = await fetch("https://one.hnzj.edu.cn/kcb/api/schoolyearTerms");
        const { response: yearTerms } = await res.json();
        
        // 使用当前学期（默认第一个）
        const year = yearTerms.schoolYears[0]?.value;
        const term = yearTerms.schoolTerms[0]?.value;
        
        if (!year || !term) {
            window.YiClassChannel.postMessage(JSON.stringify({ error: "无法获取学年学期信息" }));
            return;
        }
        
        // 获取课程数据
        const courses = await fetchCourses(year, term);
        
        if (!courses.length) {
            window.YiClassChannel.postMessage(JSON.stringify({ error: "未找到课程数据" }));
            return;
        }
        
        // 成功：发送课表数据
        const timetable = { 
            name: `课表`, 
            courses 
        };
        
        // 测试：打印结果
        console.log('=== 导入结果 ===');
        console.log('课程数量:', courses.length);
        console.log('课表数据:', JSON.stringify(timetable, null, 2));
        
        window.YiClassChannel.postMessage(JSON.stringify(timetable));
    } catch (e) {
        window.YiClassChannel.postMessage(JSON.stringify({ error: "导入出错: " + e.message }));
    }
})();
