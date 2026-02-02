// ===== LOGIN CHECK =====
const teacher = localStorage.getItem("teacherName");
if (!teacher) {
    window.location.href = "login.html";
}

// ===== ELEMENTS =====
const classSelect = document.getElementById("classSelect");
const dateSelect = document.getElementById("dateSelect");
const studentInput = document.getElementById("studentInput");
const attendanceTable = document.getElementById("attendanceTable");
const morningSummary = document.getElementById("morningSummary");
const afternoonSummary = document.getElementById("afternoonSummary");
const weeklyPercentage = document.getElementById("weeklyPercentage");
const weeklyReport = document.getElementById("weeklyReport");
const teacherDisplay = document.getElementById("teacherDisplay");

teacherDisplay.innerText = `Teacher: ${teacher}`;

// ===== STORAGE KEYS =====
const studentKey = cls => `students_${cls}`;
const attendanceKey = (cls, date) => `attendance_${cls}_${date}`;

let currentClass = "";
let currentDate = "";

// ===== LOAD CLASS =====
function loadClass() {
    autoSave();
    currentClass = classSelect.value;
    renderTable();
}

// ===== CHANGE DATE (MON–FRI ONLY) =====
function changeDate() {
    const d = new Date(dateSelect.value);
    const day = d.getDay();

    if (day === 0 || day === 6) {
        alert("School days are Monday to Friday only.");
        dateSelect.value = "";
        return;
    }

    autoSave();
    currentDate = dateSelect.value;
    renderTable();
}

// ===== ADD STUDENT =====
function addStudent() {
    if (!currentClass) return alert("Select a class first");

    const name = studentInput.value.trim();
    if (!name) return;

    let students = JSON.parse(localStorage.getItem(studentKey(currentClass))) || [];

    if (students.includes(name)) {
        alert("Student already exists");
        return;
    }

    students.push(name);
    localStorage.setItem(studentKey(currentClass), JSON.stringify(students));
    studentInput.value = "";
    renderTable();
}

// ===== TOGGLE PRESENT / ABSENT =====
function toggle(cell) {
    cell.innerText = cell.innerText === "Present" ? "Absent" : "Present";
    cell.className = cell.innerText.toLowerCase();
    updateDailySummary();
    autoSave();
}

// ===== EDIT STUDENT =====
function editStudent(oldName) {
    const newName = prompt("Edit student name:", oldName);
    if (!newName || newName.trim() === oldName) return;

    let students = JSON.parse(localStorage.getItem(studentKey(currentClass))) || [];
    if (students.includes(newName)) {
        alert("Name already exists");
        return;
    }

    // Update student list
    students = students.map(s => s === oldName ? newName : s);
    localStorage.setItem(studentKey(currentClass), JSON.stringify(students));

    // Update attendance records
    for (let key in localStorage) {
        if (key.startsWith(`attendance_${currentClass}_`)) {
            let data = JSON.parse(localStorage.getItem(key));
            if (data[oldName]) {
                data[newName] = data[oldName];
                delete data[oldName];
                localStorage.setItem(key, JSON.stringify(data));
            }
        }
    }

    renderTable();
}

// ===== DELETE STUDENT =====
function deleteStudent(name) {
    if (!confirm(`Delete ${name}?`)) return;

    let students = JSON.parse(localStorage.getItem(studentKey(currentClass))) || [];
    students = students.filter(s => s !== name);
    localStorage.setItem(studentKey(currentClass), JSON.stringify(students));

    // Remove from all attendance
    for (let key in localStorage) {
        if (key.startsWith(`attendance_${currentClass}_`)) {
            let data = JSON.parse(localStorage.getItem(key));
            delete data[name];
            localStorage.setItem(key, JSON.stringify(data));
        }
    }

    renderTable();
}

// ===== SAVE ATTENDANCE =====
function autoSave() {
    if (!currentClass || !currentDate) return;

    let data = {};
    for (let row of attendanceTable.rows) {
        data[row.cells[1].innerText] = {
            morning: row.cells[2].innerText,
            afternoon: row.cells[3].innerText
        };
    }

    localStorage.setItem(attendanceKey(currentClass, currentDate), JSON.stringify(data));
}

// ===== RENDER TABLE =====
function renderTable() {
    attendanceTable.innerHTML = "";
    if (!currentClass || !currentDate) return;

    const students = JSON.parse(localStorage.getItem(studentKey(currentClass))) || [];
    const saved = JSON.parse(localStorage.getItem(attendanceKey(currentClass, currentDate))) || {};

    students.forEach((name, i) => {
        const row = attendanceTable.insertRow();

        row.insertCell(0).innerText = i + 1;
        row.insertCell(1).innerText = name;

        const m = saved[name]?.morning || "Absent";
        const a = saved[name]?.afternoon || "Absent";

        const mCell = row.insertCell(2);
        mCell.innerText = m;
        mCell.className = m.toLowerCase();
        mCell.onclick = () => toggle(mCell);

        const aCell = row.insertCell(3);
        aCell.innerText = a;
        aCell.className = a.toLowerCase();
        aCell.onclick = () => toggle(aCell);

        const actionCell = row.insertCell(4);
        actionCell.innerHTML = `
            <button onclick="editStudent('${name}')">Edit</button>
            <button onclick="deleteStudent('${name}')" style="background:red;color:white;">Delete</button>
        `;
    });

    updateDailySummary();
}

// ===== SUMMARY =====
function updateDailySummary() {
    let m = 0, a = 0;
    for (let row of attendanceTable.rows) {
        if (row.cells[2].innerText === "Present") m++;
        if (row.cells[3].innerText === "Present") a++;
    }
    morningSummary.innerText = `Morning Present: ${m}`;
    afternoonSummary.innerText = `Afternoon Present: ${a}`;
}

// ===== LOGOUT =====
function logout() {
    localStorage.removeItem("teacherName");
    window.location.href = "login.html";
}
function calculateWeeklyPercentage() {
    if (!currentClass || !currentDate) return alert("Select class and date");

    let students = JSON.parse(localStorage.getItem(studentKey(currentClass))) || [];
    if (students.length === 0) return;

    let selected = new Date(currentDate);

    // Find Monday
    let monday = new Date(selected);
    monday.setDate(selected.getDate() - ((selected.getDay() + 6) % 7));

    let present = 0;
    let possible = students.length * 2 * 5; // Monday–Friday only

    for (let i = 0; i < 5; i++) {
        let d = new Date(monday);
        d.setDate(monday.getDate() + i);

        let key = attendanceKey(
            currentClass,
            d.toISOString().split("T")[0]
        );

        let data = JSON.parse(localStorage.getItem(key)) || {};

        students.forEach(name => {
            if (data[name]?.morning === "Present") present++;
            if (data[name]?.afternoon === "Present") present++;
        });
    }

    weeklyPercentage.innerText =
        `Weekly Attendance Percentage: ${((present / possible) * 100).toFixed(1)}%`;
}

// ---------------------- WEEKLY REPORT ----------------------
function generateWeeklyReport() {
    if (!currentClass || !currentDate) return;

    let students = JSON.parse(localStorage.getItem(studentKey(currentClass))) || [];
    let selected = new Date(currentDate);

    let monday = new Date(selected);
    monday.setDate(selected.getDate() - ((selected.getDay() + 6) % 7));

    let days = [];
    for (let i = 0; i < 5; i++) {
        let d = new Date(monday);
        d.setDate(monday.getDate() + i);
        days.push(d.toISOString().split("T")[0]);
    }

    let html = `<table><tr><th>Name</th>`;
    days.forEach(d => html += `<th>${d}<br>AM</th><th>${d}<br>PM</th>`);
    html += `</tr>`;

    students.forEach(name => {
        html += `<tr><td>${name}</td>`;
        days.forEach(date => {
            let data = JSON.parse(localStorage.getItem(attendanceKey(currentClass, date))) || {};
            let rec = data[name] || { morning: "Absent", afternoon: "Absent" };

            html += `
                <td class="${rec.morning.toLowerCase()}">${rec.morning}</td>
                <td class="${rec.afternoon.toLowerCase()}">${rec.afternoon}</td>`;
        });
        html += `</tr>`;
    });

    html += `</table>`;
    weeklyReport.innerHTML = html;
}

