// ===== GLOBAL STATE =====
let currentPage = 'dashboard';
let currentCourseId = null;
let currentYear = null;
let currentReportType = null;
let attendanceData = {};
let selectedDate = new Date().toISOString().split('T')[0];

// Course Mapping
const courseMap = {
    'bsc': { id: 1, name: 'B.Sc', years: [1,2,3] },
    'bca-a': { id: 2, name: 'BCA - Section A', years: [1,2,3] },
    'bca-b': { id: 3, name: 'BCA - Section B', years: [1,2,3] },
    'msc': { id: 4, name: 'M.Sc', years: [1,2] }
};

// ===== PAGE NAVIGATION =====
function showPage(pageName) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    
    document.getElementById(`page-${pageName}`).classList.add('active');
    
    const navMap = {
        'dashboard': 0, 'department': 1, 'percentage': 2, 'report': 3
    };
    
    document.querySelectorAll('.nav-item')[navMap[pageName]]?.classList.add('active');
    
    const titles = {
        'dashboard': 'Dashboard',
        'department': 'Department',
        'percentage': 'Attendance Percentage',
        'report': 'Reports'
    };
    
    document.getElementById('pageTitle').textContent = titles[pageName];
    currentPage = pageName;
    
    // Reset sub-sections
    if (pageName === 'department') resetDept();
    if (pageName === 'percentage') resetPct();
    if (pageName === 'report') resetReport();
    
    document.getElementById('searchResults').style.display = 'none';
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
}

// ===== TOAST NOTIFICATION =====
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    setTimeout(() => {
        toast.className = 'toast';
    }, 3000);
}

// ===== DEPARTMENT SECTION =====
function resetDept() {
    document.getElementById('deptOptions').style.display = 'grid';
    document.getElementById('subOptions').innerHTML = '';
    document.getElementById('attendanceSection').innerHTML = '';
    document.getElementById('breadcrumb').innerHTML = 
        '<span onclick="resetDept()">Department</span>';
    currentCourseId = null;
    currentYear = null;
}

function selectDept(dept) {
    document.getElementById('deptOptions').style.display = 'none';
    
    addBreadcrumb('breadcrumb', 'Computer Science', 'resetDept()');
    
    document.getElementById('subOptions').innerHTML = `
        <div class="options-grid">
            <div class="option-card" onclick="selectCourse('bsc')">
                <i class="fas fa-flask"></i>
                <h3>B.Sc</h3>
            </div>
            <div class="option-card" onclick="selectCourse('bca')">
                <i class="fas fa-laptop"></i>
                <h3>BCA</h3>
            </div>
            <div class="option-card" onclick="selectCourse('msc')">
                <i class="fas fa-microscope"></i>
                <h3>M.Sc</h3>
            </div>
        </div>
    `;
}

function selectCourse(course) {
    if (course === 'bca') {
        addBreadcrumb('breadcrumb', 'BCA', `selectCourse('bca')`);
        document.getElementById('subOptions').innerHTML = `
            <div class="options-grid">
                <div class="option-card" onclick="selectSection('bca-a')">
                    <i class="fas fa-users"></i>
                    <h3>BCA - A</h3>
                </div>
                <div class="option-card" onclick="selectSection('bca-b')">
                    <i class="fas fa-users"></i>
                    <h3>BCA - B</h3>
                </div>
            </div>
        `;
    } else {
        const courseName = course === 'bsc' ? 'B.Sc' : 'M.Sc';
        addBreadcrumb('breadcrumb', courseName, `selectCourse('${course}')`);
        showYears(course, 'breadcrumb', 'subOptions');
    }
    document.getElementById('attendanceSection').innerHTML = '';
}

function selectSection(section) {
    const sectionName = section === 'bca-a' ? 'BCA - A' : 'BCA - B';
    addBreadcrumb('breadcrumb', sectionName, `selectSection('${section}')`);
    showYears(section, 'breadcrumb', 'subOptions');
    document.getElementById('attendanceSection').innerHTML = '';
}

function showYears(courseKey, breadcrumbId, optionId) {
    const course = courseMap[courseKey];
    const yearsHTML = course.years.map(y => `
        <div class="option-card" onclick="selectYear('${courseKey}', ${y})">
            <i class="fas fa-calendar-check"></i>
            <h3>${y}${y===1?'st':y===2?'nd':'rd'} Year</h3>
        </div>
    `).join('');
    
    document.getElementById(optionId).innerHTML = `
        <div class="options-grid">${yearsHTML}</div>
    `;
}

async function selectYear(courseKey, year) {
    currentCourseId = courseMap[courseKey].id;
    currentYear = year;
    
    const yearLabel = `${year}${year===1?'st':year===2?'nd':'rd'} Year`;
    addBreadcrumb('breadcrumb', yearLabel, `selectYear('${courseKey}', ${year})`);
    
    document.getElementById('subOptions').innerHTML = '';
    await loadAttendance(courseKey, year);
}

async function loadAttendance(courseKey, year) {
    const courseName = courseMap[courseKey].name;
    const yearLabel = `${year}${year===1?'st':year===2?'nd':'rd'} Year`;
    
    document.getElementById('attendanceSection').innerHTML = `
        <div class="attendance-header">
            <h3><i class="fas fa-clipboard-list"></i> ${courseName} - ${yearLabel} Attendance</h3>
            <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
                <input type="date" class="date-picker" id="attendanceDate" 
                       value="${selectedDate}" onchange="changeDate(this.value, '${courseKey}', ${year})">
                <button class="add-student-btn" onclick="openModal()">
                    <i class="fas fa-user-plus"></i> Add New Student
                </button>
            </div>
        </div>
        <div class="table-container">
            <div id="attendanceTableBody">
                <div style="padding:30px; text-align:center; color:#666;">
                    <i class="fas fa-spinner fa-spin" style="font-size:24px;"></i>
                    <p>Loading students...</p>
                </div>
            </div>
            <div class="save-btn-container">
                <button class="save-btn" onclick="saveAttendance()">
                    <i class="fas fa-save"></i> Save Attendance
                </button>
            </div>
        </div>
    `;
    
    await fetchAndRenderAttendance();
}

async function fetchAndRenderAttendance() {
    try {
        const response = await fetch(
            `/api/attendance/daily?course_id=${currentCourseId}&year=${currentYear}&date=${selectedDate}`
        );
        const result = await response.json();
        
        if (!result.success) throw new Error(result.message);
        
        const students = result.data;
        attendanceData = {};
        
        students.forEach(s => {
            attendanceData[s.id] = { ...s };
        });
        
        renderAttendanceTable(students);
    } catch (err) {
        document.getElementById('attendanceTableBody').innerHTML = `
            <div style="padding:30px; text-align:center; color:#ea4335;">
                <i class="fas fa-exclamation-circle" style="font-size:24px;"></i>
                <p>Error loading: ${err.message}</p>
            </div>
        `;
    }
}

function renderAttendanceTable(students) {
    if (students.length === 0) {
        document.getElementById('attendanceTableBody').innerHTML = `
            <div style="padding:30px; text-align:center; color:#666;">
                <i class="fas fa-user-slash" style="font-size:40px; color:#ddd;"></i>
                <p style="margin-top:10px;">No students found. Add students using the button above.</p>
            </div>
        `;
        return;
    }
    
    const rows = students.map((student, idx) => {
        const periods = [1,2,3,4,5].map(p => {
            const status = student.periods[`period${p}`] || 'present';
            return `
                <td>
                    <button class="period-btn ${status}" 
                            id="btn-${student.id}-${p}"
                            onclick="togglePeriod(${student.id}, ${p})">
                        ${status === 'present' ? '✓ Present' : '✗ Absent'}
                    </button>
                </td>
            `;
        }).join('');
        
        return `
            <tr>
                <td>${idx + 1}</td>
                <td style="text-align:left; font-weight:600;">${student.name}</td>
                <td>${student.roll_number}</td>
                <td>${student.academic_year || '-'}</td>
                ${periods}
            </tr>
        `;
    }).join('');
    
    document.getElementById('attendanceTableBody').innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>#</th>
                    <th>Student Name</th>
                    <th>Roll Number</th>
                    <th>Academic Year</th>
                    <th>Period 1</th>
                    <th>Period 2</th>
                    <th>Period 3</th>
                    <th>Period 4</th>
                    <th>Period 5</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>
    `;
}

function togglePeriod(studentId, period) {
    const btn = document.getElementById(`btn-${studentId}-${period}`);
    const isPresent = btn.classList.contains('present');
    
    btn.classList.remove('present', 'absent');
    
    if (isPresent) {
        btn.classList.add('absent');
        btn.textContent = '✗ Absent';
        attendanceData[studentId].periods[`period${period}`] = 'absent';
    } else {
        btn.classList.add('present');
        btn.textContent = '✓ Present';
        attendanceData[studentId].periods[`period${period}`] = 'present';
    }
}

async function saveAttendance() {
    const dataToSave = Object.values(attendanceData).map(s => ({
        student_id: s.id,
        periods: s.periods
    }));
    
    try {
        const response = await fetch('/api/attendance/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                attendanceData: dataToSave,
                date: selectedDate,
                course_id: currentCourseId,
                year: currentYear
            })
        });
        
        const result = await response.json();
        if (result.success) {
            showToast('✅ Attendance saved successfully!', 'success');
        } else {
            showToast('❌ ' + result.message, 'error');
        }
    } catch (err) {
        showToast('❌ Error saving attendance!', 'error');
    }
}

function changeDate(newDate, courseKey, year) {
    selectedDate = newDate;
    fetchAndRenderAttendance();
}

// ===== SEARCH FUNCTION =====
let searchTimeout;
async function searchStudent(query) {
    clearTimeout(searchTimeout);
    const resultsDiv = document.getElementById('searchResults');
    
    if (!query || query.length < 2) {
        resultsDiv.style.display = 'none';
        return;
    }
    
    searchTimeout = setTimeout(async () => {
        try {
            const response = await fetch(`/api/students/search/${query}`);
            const result = await response.json();
            
            if (!result.success || result.data.length === 0) {
                resultsDiv.style.display = 'none';
                return;
            }
            
            const html = result.data.map(s => `
                <div class="search-result-item">
                    <div>
                        <div class="search-student-info">
                            <h4>${s.name}</h4>
                            <p>${s.roll_number} | ${s.course_name} ${s.section || ''}</p>
                        </div>
                        <div class="search-period-btns" id="search-periods-${s.id}">
                            ${[1,2,3,4,5].map(p => `
                                <button class="period-btn-small present" 
                                        id="sp-${s.id}-${p}"
                                        onclick="toggleSearchPeriod(${s.id}, ${p})">
                                    P${p}: ✓
                                </button>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `).join('');
            
            resultsDiv.innerHTML = html;
            resultsDiv.style.display = 'block';
            
        } catch (err) {
            resultsDiv.style.display = 'none';
        }
    }, 300);
}

async function toggleSearchPeriod(studentId, period) {
    const btn = document.getElementById(`sp-${studentId}-${period}`);
    const isPresent = btn.classList.contains('present');
    const newStatus = isPresent ? 'absent' : 'present';
    
    btn.classList.remove('present', 'absent');
    btn.classList.add(newStatus);
    btn.textContent = `P${period}: ${newStatus === 'present' ? '✓' : '✗'}`;
    
    try {
        await fetch('/api/attendance/update-single', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                student_id: studentId,
                date: selectedDate,
                period: period,
                status: newStatus
            })
        });
        
        // Main table refresh
        if (currentCourseId && currentYear) {
            await fetchAndRenderAttendance();
        }
    } catch (err) {
        console.error('Update failed:', err);
    }
}

// Close search on outside click
document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-box') && !e.target.closest('.search-results')) {
        document.getElementById('searchResults').style.display = 'none';
    }
});

// ===== ATTENDANCE PERCENTAGE =====
function resetPct() {
    document.getElementById('pctOptions').style.display = 'grid';
    document.getElementById('pctSubOptions').innerHTML = '';
    document.getElementById('pctTable').innerHTML = '';
    document.getElementById('pctBreadcrumb').innerHTML = 
        '<span onclick="resetPct()">Attendance %</span>';
}

function selectPctDept() {
    document.getElementById('pctOptions').style.display = 'none';
    addBreadcrumb('pctBreadcrumb', 'Computer Science', 'resetPct()');
    
    document.getElementById('pctSubOptions').innerHTML = `
        <div class="options-grid">
            <div class="option-card" onclick="selectPctCourse('bsc')">
                <i class="fas fa-flask"></i><h3>B.Sc</h3>
            </div>
            <div class="option-card" onclick="selectPctCourse('bca')">
                <i class="fas fa-laptop"></i><h3>BCA</h3>
            </div>
            <div class="option-card" onclick="selectPctCourse('msc')">
                <i class="fas fa-microscope"></i><h3>M.Sc</h3>
            </div>
        </div>
    `;
}

function selectPctCourse(course) {
    if (course === 'bca') {
        addBreadcrumb('pctBreadcrumb', 'BCA', `selectPctCourse('bca')`);
        document.getElementById('pctSubOptions').innerHTML = `
            <div class="options-grid">
                <div class="option-card" onclick="selectPctSection('bca-a')">
                    <i class="fas fa-users"></i><h3>BCA - A</h3>
                </div>
                <div class="option-card" onclick="selectPctSection('bca-b')">
                    <i class="fas fa-users"></i><h3>BCA - B</h3>
                </div>
            </div>
        `;
    } else {
        const name = course === 'bsc' ? 'B.Sc' : 'M.Sc';
        addBreadcrumb('pctBreadcrumb', name, `selectPctCourse('${course}')`);
        showPctYears(course);
    }
    document.getElementById('pctTable').innerHTML = '';
}

function selectPctSection(section) {
    const name = section === 'bca-a' ? 'BCA - A' : 'BCA - B';
    addBreadcrumb('pctBreadcrumb', name, `selectPctSection('${section}')`);
    showPctYears(section);
    document.getElementById('pctTable').innerHTML = '';
}

function showPctYears(courseKey) {
    const years = courseMap[courseKey].years;
    const html = years.map(y => `
        <div class="option-card" onclick="loadPercentage('${courseKey}', ${y})">
            <i class="fas fa-chart-bar"></i>
            <h3>${y}${y===1?'st':y===2?'nd':'rd'} Year</h3>
        </div>
    `).join('');
    
    document.getElementById('pctSubOptions').innerHTML = 
        `<div class="options-grid">${html}</div>`;
}

async function loadPercentage(courseKey, year) {
    const courseId = courseMap[courseKey].id;
    const yearLabel = `${year}${year===1?'st':year===2?'nd':'rd'} Year`;
    addBreadcrumb('pctBreadcrumb', yearLabel, `loadPercentage('${courseKey}', ${year})`);
    
    document.getElementById('pctSubOptions').innerHTML = '';
    document.getElementById('pctTable').innerHTML = `
        <div style="padding:30px; text-align:center;">
            <i class="fas fa-spinner fa-spin" style="font-size:24px; color:#1a73e8;"></i>
            <p>Calculating percentage...</p>
        </div>
    `;
    
    try {
        const response = await fetch(
            `/api/attendance/percentage?course_id=${courseId}&year=${year}`
        );
        const result = await response.json();
        
        if (!result.success) throw new Error(result.message);
        
        const students = result.data;
        
        if (students.length === 0) {
            document.getElementById('pctTable').innerHTML = `
                <div style="padding:30px; text-align:center; color:#666;">
                    No students found
                </div>
            `;
            return;
        }
        
        const rows = students.map((s, idx) => {
            const rankClass = idx===0?'gold':idx===1?'silver':idx===2?'bronze':'';
            const color = s.percentage >= 75 ? '#34a853' : 
                         s.percentage >= 50 ? '#ff6d00' : '#ea4335';
            
            return `
                <div class="pct-row">
                    <div class="pct-rank ${rankClass}">${idx+1}</div>
                    <div class="pct-info">
                        <h4>${s.name}</h4>
                        <p>${s.roll_number} | ${s.academic_year || '-'}</p>
                        <p style="font-size:11px; color:#999;">
                            Present: ${s.present_count} | 
                            Absent: ${s.absent_count} | 
                            Total: ${s.total_classes}
                        </p>
                    </div>
                    <div class="pct-bar-container">
                        <div class="pct-bar">
                            <div class="pct-bar-fill" 
                                 style="width:${s.percentage}%; background:${color};"></div>
                        </div>
                        <div class="pct-value" style="color:${color};">
                            ${s.percentage}%
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        document.getElementById('pctTable').innerHTML = `
            <div class="pct-table">${rows}</div>
        `;
        
    } catch (err) {
        document.getElementById('pctTable').innerHTML = `
            <div style="padding:30px; text-align:center; color:#ea4335;">
                Error: ${err.message}
            </div>
        `;
    }
}

// ===== REPORTS =====
function resetReport() {
    document.getElementById('rptOptions').style.display = 'grid';
    document.getElementById('rptSubOptions').innerHTML = '';
    document.getElementById('rptTable').innerHTML = '';
    document.getElementById('rptBreadcrumb').innerHTML = 
        '<span onclick="resetReport()">Reports</span>';
    currentReportType = null;
}

function selectReportType(type) {
    currentReportType = type;
    const labels = { weekly:'Weekly Report', monthly:'Monthly Report', semester:'Semester Report' };
    
    document.getElementById('rptOptions').style.display = 'none';
    addBreadcrumb('rptBreadcrumb', labels[type], `selectReportType('${type}')`);
    
    document.getElementById('rptSubOptions').innerHTML = `
        <div class="options-grid">
            <div class="option-card" onclick="selectRptDept()">
                <i class="fas fa-laptop-code"></i>
                <h3>Computer Science</h3>
            </div>
        </div>
    `;
}

function selectRptDept() {
    addBreadcrumb('rptBreadcrumb', 'Computer Science', 'selectRptDept()');
    document.getElementById('rptSubOptions').innerHTML = `
        <div class="options-grid">
            <div class="option-card" onclick="selectRptCourse('bsc')">
                <i class="fas fa-flask"></i><h3>B.Sc</h3>
            </div>
            <div class="option-card" onclick="selectRptCourse('bca')">
                <i class="fas fa-laptop"></i><h3>BCA</h3>
            </div>
            <div class="option-card" onclick="selectRptCourse('msc')">
                <i class="fas fa-microscope"></i><h3>M.Sc</h3>
            </div>
        </div>
    `;
}

function selectRptCourse(course) {
    if (course === 'bca') {
        addBreadcrumb('rptBreadcrumb', 'BCA', `selectRptCourse('bca')`);
        document.getElementById('rptSubOptions').innerHTML = `
            <div class="options-grid">
                <div class="option-card" onclick="selectRptSection('bca-a')">
                    <i class="fas fa-users"></i><h3>BCA - A</h3>
                </div>
                <div class="option-card" onclick="selectRptSection('bca-b')">
                    <i class="fas fa-users"></i><h3>BCA - B</h3>
                </div>
            </div>
        `;
    } else {
        const name = course === 'bsc' ? 'B.Sc' : 'M.Sc';
        addBreadcrumb('rptBreadcrumb', name, `selectRptCourse('${course}')`);
        showRptYears(course);
    }
}

function selectRptSection(section) {
    const name = section === 'bca-a' ? 'BCA - A' : 'BCA - B';
    addBreadcrumb('rptBreadcrumb', name, `selectRptSection('${section}')`);
    showRptYears(section);
}

function showRptYears(courseKey) {
    const years = courseMap[courseKey].years;
    const html = years.map(y => `
        <div class="option-card" onclick="loadReport('${courseKey}', ${y})">
            <i class="fas fa-file-chart-line"></i>
            <h3>${y}${y===1?'st':y===2?'nd':'rd'} Year</h3>
        </div>
    `).join('');
    
    document.getElementById('rptSubOptions').innerHTML = 
        `<div class="options-grid">${html}</div>`;
}

async function loadReport(courseKey, year) {
    const courseId = courseMap[courseKey].id;
    const yearLabel = `${year}${year===1?'st':year===2?'nd':'rd'} Year`;
    addBreadcrumb('rptBreadcrumb', yearLabel, `loadReport('${courseKey}', ${year})`);
    
    document.getElementById('rptSubOptions').innerHTML = '';
    document.getElementById('rptTable').innerHTML = `
        <div style="padding:30px; text-align:center;">
            <i class="fas fa-spinner fa-spin" style="font-size:24px; color:#1a73e8;"></i>
            <p>Generating report...</p>
        </div>
    `;
    
    try {
        const response = await fetch(
            `/api/reports?course_id=${courseId}&year=${year}&type=${currentReportType}`
        );
        const result = await response.json();
        
        if (!result.success) throw new Error(result.message);
        
        const students = result.data;
        const typeLabel = { weekly:'Weekly', monthly:'Monthly', semester:'Semester' }[currentReportType];
        
        if (students.length === 0) {
            document.getElementById('rptTable').innerHTML = `
                <div style="padding:30px; text-align:center; color:#666;">No data found</div>
            `;
            return;
        }
        
        const rows = students.map((s, idx) => {
            const color = s.percentage >= 75 ? '#34a853' : 
                         s.percentage >= 50 ? '#ff6d00' : '#ea4335';
            return `
                <tr>
                    <td>${idx+1}</td>
                    <td style="text-align:left; font-weight:600;">${s.name}</td>
                    <td>${s.roll_number}</td>
                    <td>${s.academic_year || '-'}</td>
                    <td>${s.total_classes}</td>
                    <td style="color:#34a853; font-weight:700;">${s.present_count}</td>
                    <td style="color:#ea4335; font-weight:700;">${s.absent_count}</td>
                    <td style="color:${color}; font-weight:700;">${s.percentage}%</td>
                </tr>
            `;
        }).join('');
        
        document.getElementById('rptTable').innerHTML = `
            <div style="margin-bottom:10px; color:#666; font-size:13px;">
                📅 Period: ${result.start_date} to ${result.end_date}
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Name</th>
                            <th>Roll No</th>
                            <th>Academic Year</th>
                            <th>Total</th>
                            <th>Present</th>
                            <th>Absent</th>
                            <th>Percentage</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
        `;
        
    } catch (err) {
        document.getElementById('rptTable').innerHTML = `
            <div style="padding:30px; text-align:center; color:#ea4335;">
                Error: ${err.message}
            </div>
        `;
    }
}

// ===== BREADCRUMB HELPER =====
function addBreadcrumb(containerId, label, clickFn) {
    const container = document.getElementById(containerId);
    container.innerHTML += `
        <span class="separator"> › </span>
        <span onclick="${clickFn}">${label}</span>
    `;
}

// ===== MODAL (Add Student) =====
function openModal() {
    document.getElementById('addStudentModal').classList.add('open');
    document.getElementById('modalOverlay').classList.add('show');
}

function closeModal() {
    document.getElementById('addStudentModal').classList.remove('open');
    document.getElementById('modalOverlay').classList.remove('show');
}

async function addStudent() {
    const name = document.getElementById('studentName').value.trim();
    const rollNumber = document.getElementById('rollNumber').value.trim();
    const courseId = document.getElementById('courseSelect').value;
    const year = document.getElementById('yearSelect').value;
    const academicYear = document.getElementById('academicYear').value.trim();
    
    if (!name || !rollNumber || !courseId || !year || !academicYear) {
        showToast('⚠️ All fields are required!', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/students/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name, roll_number: rollNumber, 
                course_id: courseId, year, 
                academic_year: academicYear
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast(`✅ ${name} added successfully!`, 'success');
            closeModal();
            
            // Form clear
            ['studentName','rollNumber','courseSelect','yearSelect','academicYear']
                .forEach(id => document.getElementById(id).value = '');
            
            // Refresh attendance table if open
            if (currentCourseId && currentYear) {
                await fetchAndRenderAttendance();
            }
        } else {
            showToast('❌ ' + result.message, 'error');
        }
    } catch (err) {
        showToast('❌ Error adding student!', 'error');
    }
}