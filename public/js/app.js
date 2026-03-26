const state = {
  user: null,
  students: []
};

const authSection = document.getElementById("authSection");
const dashboardSection = document.getElementById("dashboardSection");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const studentForm = document.getElementById("studentForm");
const studentList = document.getElementById("studentList");
const logoutButton = document.getElementById("logoutButton");
const refreshButton = document.getElementById("refreshButton");
const messageBox = document.getElementById("messageBox");
const welcomeHeading = document.getElementById("welcomeHeading");
const studentCount = document.getElementById("studentCount");
const markCount = document.getElementById("markCount");
const averageScore = document.getElementById("averageScore");
const showLoginButton = document.getElementById("showLoginButton");
const showRegisterButton = document.getElementById("showRegisterButton");

function showMessage(text, type = "success") {
  messageBox.textContent = text;
  messageBox.className = `message ${type}`;

  window.clearTimeout(showMessage.timeoutId);
  showMessage.timeoutId = window.setTimeout(() => {
    messageBox.className = "message hidden";
    messageBox.textContent = "";
  }, 3000);
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Request failed.");
  }

  return data;
}

function toggleAuthMode(mode) {
  const isLogin = mode === "login";
  loginForm.classList.toggle("hidden", !isLogin);
  registerForm.classList.toggle("hidden", isLogin);
  showLoginButton.classList.toggle("active", isLogin);
  showRegisterButton.classList.toggle("active", !isLogin);
}

function updateStats() {
  const marks = state.students.flatMap((student) => student.marks || []);
  const totalScore = marks.reduce((sum, mark) => sum + Number(mark.score), 0);
  const average = marks.length ? (totalScore / marks.length).toFixed(1) : "0.0";

  studentCount.textContent = String(state.students.length);
  markCount.textContent = String(marks.length);
  averageScore.textContent = `${average}%`;
}

function setAuthenticatedView() {
  authSection.classList.add("hidden");
  dashboardSection.classList.remove("hidden");
  logoutButton.classList.remove("hidden");
  welcomeHeading.textContent = `Welcome, ${state.user.fullName}`;
}

function setLoggedOutView() {
  state.user = null;
  state.students = [];
  authSection.classList.remove("hidden");
  dashboardSection.classList.add("hidden");
  logoutButton.classList.add("hidden");
  welcomeHeading.textContent = "Welcome to ScholarTrack";
  updateStats();
  renderStudents();
}

function renderStudents() {
  if (!state.students.length) {
    studentList.className = "student-list empty-state";
    studentList.textContent = "No students yet. Add your first record to get started.";
    return;
  }

  studentList.className = "student-list";
  studentList.innerHTML = state.students
    .map((student) => {
      const marks = student.marks || [];
      const marksHtml = marks.length
        ? marks
            .map(
              (mark) => `
                <div class="mark-row">
                  <strong>${escapeHtml(mark.subject)}</strong>
                  <span>${escapeHtml(mark.examName)}</span>
                  <span class="score-pill">${Number(mark.score)}%</span>
                  <button class="danger-button" type="button" data-action="delete-mark" data-student-id="${student.id}" data-mark-id="${mark.id}">
                    Delete
                  </button>
                </div>
              `
            )
            .join("")
        : '<p class="empty-state">No marks added for this student yet.</p>';

      return `
        <article class="student-card">
          <div class="student-card-header">
            <div>
              <h4>${escapeHtml(student.fullName)}</h4>
              <div class="student-meta">
                <span>Class: ${escapeHtml(student.className)}</span>
                <span>Roll No: ${escapeHtml(student.rollNumber)}</span>
                <span>Email: ${escapeHtml(student.email || "Not added")}</span>
              </div>
            </div>
            <button class="danger-button" type="button" data-action="delete-student" data-student-id="${student.id}">
              Delete Student
            </button>
          </div>

          <form class="mark-form" data-student-id="${student.id}">
            <input name="subject" type="text" placeholder="Subject" required />
            <input name="examName" type="text" placeholder="Exam name" required />
            <input name="score" type="number" min="0" max="100" step="0.01" placeholder="Score" required />
            <button class="primary-button" type="submit">Save Mark</button>
          </form>

          <div class="marks-table">
            <div class="marks-header">
              <h5>Marks</h5>
              <span>${marks.length} record(s)</span>
            </div>
            ${marksHtml}
          </div>
        </article>
      `;
    })
    .join("");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function loadCurrentUser() {
  try {
    const data = await fetchJson("/api/auth/me");
    state.user = data.user;
    setAuthenticatedView();
    await loadStudents();
  } catch (error) {
    setLoggedOutView();
  }
}

async function loadStudents() {
  const data = await fetchJson("/api/students");
  state.students = data.students || [];
  updateStats();
  renderStudents();
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(loginForm);

  try {
    const data = await fetchJson("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(Object.fromEntries(formData.entries()))
    });

    state.user = data.user;
    loginForm.reset();
    setAuthenticatedView();
    await loadStudents();
    showMessage("Logged in successfully.");
  } catch (error) {
    showMessage(error.message, "error");
  }
});

registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(registerForm);

  try {
    const data = await fetchJson("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(Object.fromEntries(formData.entries()))
    });

    state.user = data.user;
    registerForm.reset();
    setAuthenticatedView();
    await loadStudents();
    showMessage("Account created successfully.");
  } catch (error) {
    showMessage(error.message, "error");
  }
});

studentForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(studentForm);

  try {
    await fetchJson("/api/students", {
      method: "POST",
      body: JSON.stringify(Object.fromEntries(formData.entries()))
    });

    studentForm.reset();
    await loadStudents();
    showMessage("Student added successfully.");
  } catch (error) {
    showMessage(error.message, "error");
  }
});

studentList.addEventListener("submit", async (event) => {
  const form = event.target.closest(".mark-form");

  if (!form) {
    return;
  }

  event.preventDefault();
  const formData = new FormData(form);
  const studentId = form.dataset.studentId;

  try {
    await fetchJson(`/api/students/${studentId}/marks`, {
      method: "POST",
      body: JSON.stringify(Object.fromEntries(formData.entries()))
    });

    form.reset();
    await loadStudents();
    showMessage("Marks saved successfully.");
  } catch (error) {
    showMessage(error.message, "error");
  }
});

studentList.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-action]");

  if (!button) {
    return;
  }

  const action = button.dataset.action;
  const studentId = button.dataset.studentId;

  try {
    if (action === "delete-student") {
      await fetchJson(`/api/students/${studentId}`, { method: "DELETE" });
      await loadStudents();
      showMessage("Student deleted successfully.");
    }

    if (action === "delete-mark") {
      await fetchJson(`/api/students/${studentId}/marks/${button.dataset.markId}`, {
        method: "DELETE"
      });
      await loadStudents();
      showMessage("Mark deleted successfully.");
    }
  } catch (error) {
    showMessage(error.message, "error");
  }
});

logoutButton.addEventListener("click", async () => {
  try {
    await fetchJson("/api/auth/logout", { method: "POST" });
  } finally {
    setLoggedOutView();
    toggleAuthMode("login");
    showMessage("Logged out successfully.");
  }
});

refreshButton.addEventListener("click", async () => {
  try {
    await loadStudents();
    showMessage("Data refreshed.");
  } catch (error) {
    showMessage(error.message, "error");
  }
});

showLoginButton.addEventListener("click", () => toggleAuthMode("login"));
showRegisterButton.addEventListener("click", () => toggleAuthMode("register"));

toggleAuthMode("login");
loadCurrentUser();
