function signup() {
    const name = document.getElementById("teacherName").value.trim();
    const password = document.getElementById("teacherPassword").value;
    const confirm = document.getElementById("teacherPasswordConfirm").value;

    if (!name || !password || !confirm) {
        alert("Please fill all fields");
        return;
    }

    if (password !== confirm) {
        alert("Passwords do not match");
        return;
    }

    // Check if teacher already exists
    const existing = JSON.parse(localStorage.getItem("teachers")) || {};
    if (existing[name]) {
        alert("Teacher name already exists. Choose another name.");
        return;
    }

    // Save teacher credentials
    existing[name] = password;
    localStorage.setItem("teachers", JSON.stringify(existing));

    alert("Signup successful! Please login.");
    window.location.href = "login.html";
}
