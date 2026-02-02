function login() {
    const name = document.getElementById("teacherName").value.trim();
    const password = document.getElementById("teacherPassword").value;

    if (!name || !password) {
        alert("Please fill all fields");
        return;
    }

    const teachers = JSON.parse(localStorage.getItem("teachers")) || {};

    if (!teachers[name]) {
        alert("Teacher not found. Please signup first.");
        return;
    }

    if (teachers[name] !== password) {
        alert("Incorrect password");
        return;
    }

    // Save current logged-in teacher
    localStorage.setItem("teacherName", name);
    window.location.href = "index.html";
}
