/**
 * 河南职院教务系统课表导入脚本
 * 适配 YIClass 项目
 */

// 解析周次字符串 "1-8,10,12-16" -> [1,2,3,4,5,6,7,8,10,12,13,14,15,16]
function parseWeeks(str) {
    if (!str) return [];
    const weeks = new Set();
    str.split(",").forEach(part => {
        if (part.includes("-")) {
            const [s, e] = part.split("-").map(Number);
            for (let i = s; i <= e; i++) weeks.add(i);
        } else {
            weeks.add(Number(part));
        }
    });
    return [...weeks].sort((a, b) => a - b);
}

// 节次映射：13-14节 -> 5-6节（晚自习转换）
function normalizePeriod(period) {
    if (period >= 13) return period - 8;  // 13->5, 14->6
    return period;
}

// 转换为 YIClass 格式，合并同课程同天同周次的节次
function toYIClassFormat(rawList) {
    const courseMap = {};
    
    for (const item of rawList) {
        const courseKey = `${item.courseName}|${item.classRoom}|${item.teacherName}`;
        const weekday = item.weekday;
        const weeksStr = item.weeks;
        const start = +item.startSection;
        const end = +item.endSection;
        
        if (!courseMap[courseKey]) {
            courseMap[courseKey] = {
                name: item.courseName,
                location: item.classRoom,
                teacher: item.teacherName,
                scheduleMap: {}
            };
        }
        
        // 用 weekday + weeks 作为 schedule 的键，合并同天同周次
        const scheduleKey = `${weekday}|${weeksStr}`;
        const course = courseMap[courseKey];
        
        if (!course.scheduleMap[scheduleKey]) {
            course.scheduleMap[scheduleKey] = {
                weekday,
                periods: new Set(),
                weekPattern: parseWeeks(weeksStr)
            };
        }
        
        // 合并节次（转换13-14节为5-6节）
        for (let i = start; i <= end; i++) {
            course.scheduleMap[scheduleKey].periods.add(normalizePeriod(i));
        }
    }
    
    // 转换为最终格式
    return Object.values(courseMap).map(c => ({
        name: c.name,
        location: c.location,
        teacher: c.teacher,
        schedules: Object.values(c.scheduleMap).map(s => ({
            weekday: s.weekday,
            periods: [...s.periods].sort((a, b) => a - b),
            weekPattern: s.weekPattern
        }))
    }));
}

// 获取课程数据
async function fetchCourses(year, term) {
    const allItems = [];
    const seen = new Set();
    
    for (let week = 1; week <= 20; week++) {
        const res = await fetch(`https://one.hnzj.edu.cn/kcb/api/course?schoolYear=${year}&schoolTerm=${term}&week=${week}`);
        const { response } = await res.json();
        
        response.forEach(day => {
            day.data.forEach(c => {
                const key = `${c.courseName}|${c.classRoom}|${c.teacherName}|${day.week}|${c.startSection}|${c.endSection}|${c.weeks}`;
                if (!seen.has(key)) {
                    seen.add(key);
                    allItems.push({
                        courseName: c.courseName,
                        classRoom: c.classRoom,
                        teacherName: c.teacherName,
                        weekday: day.week,
                        startSection: c.startSection,
                        endSection: c.endSection,
                        weeks: c.weeks
                    });
                }
            });
        });
    }
    
    return toYIClassFormat(allItems);
}

(async function() {
    if (window.location.href.includes("we.hnzj.edu.cn/sso/login")) {
        window.YiClassChannel.postMessage(JSON.stringify({ error: "请先登录教务系统" }));
        return;
    }
    
    const res = await fetch("https://one.hnzj.edu.cn/kcb/api/schoolyearTerms");
    const { response: yearTerms } = await res.json();
    const year = yearTerms.schoolYears[0]?.value;
    const term = yearTerms.schoolTerms[0]?.value;
    
    if (!year || !term) {
        window.YiClassChannel.postMessage(JSON.stringify({ error: "无法获取学年学期信息" }));
        return;
    }
    
    const courses = await fetchCourses(year, term);
    
    if (!courses.length) {
        window.YiClassChannel.postMessage(JSON.stringify({ error: "未找到课程数据" }));
        return;
    }
    
    const timetable = { name: "课表", courses };
    console.log('=== 导入结果 ===');
    console.log('课程数量:', courses.length);
    console.log('课表数据:', JSON.stringify(timetable, null, 2));
    window.YiClassChannel.postMessage(JSON.stringify(timetable));
})();
