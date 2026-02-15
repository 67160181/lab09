// ================================
// Task Timer App
// ================================

// Data structure
let tasks = [];
let taskId = 0;

// DOM Elements
const taskInput = document.getElementById("taskInput");
const addBtn = document.getElementById("addBtn");
const taskList = document.getElementById("taskList");

// ================================
// Helper Functions
// ================================

// ฟังก์ชันแปลงเวลา (วินาที → นาที:วินาที)
function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

// แสดง notification
function showNotification(message) {
  const notification = document.createElement("div");
  notification.className = "notification";
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// เล่นเสียง alarm
function playAlarm() {
  // ใช้ Web Audio API เพื่อสร้างเสียง
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.frequency.value = 800; // ความถี่ 800 Hz
  oscillator.type = "sine";

  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(
    0.01,
    audioContext.currentTime + 0.5,
  );

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.5);
}

// ================================
// Task Functions
// ================================

// เพิ่ม task ใหม่
function addTask() {
  const taskName = taskInput.value.trim();

  if (!taskName) {
    alert("กรุณากรอก task");
    return;
  }

  const task = {
    id: taskId++,
    name: taskName,
    duration: 30 * 60, // 30 นาที (เป็นวินาที)
    timeLeft: 30 * 60,
    isRunning: false,
    intervalId: null,
  };

  tasks.push(task);
  taskInput.value = "";
  renderTasks();
  showNotification(`เพิ่ม task: ${taskName}`);
}

// ลบ task
function deleteTask(id) {
  tasks = tasks.filter((task) => task.id !== id);
  renderTasks();
  showNotification("ลบ task แล้ว");
}

// เริ่ม/หยุด timer
function toggleTimer(id) {
  const task = tasks.find((t) => t.id === id);
  if (!task) return;

  if (task.isRunning) {
    // หยุด timer
    clearInterval(task.intervalId);
    task.isRunning = false;
  } else {
    // เริ่ม timer
    task.isRunning = true;

    task.intervalId = setInterval(() => {
      task.timeLeft--;

      // ถ้าหมดเวลา
      if (task.timeLeft <= 0) {
        clearInterval(task.intervalId);
        task.isRunning = false;
        task.timeLeft = 0;

        playAlarm();
        showNotification(`🎉 เสร็จ! "${task.name}"`);
      }

      renderTasks();
    }, 1000); // อัปเดตทุกๆ 1 วินาที
  }

  renderTasks();
}

// ================================
// Render UI
// ================================

function renderTasks() {
  if (tasks.length === 0) {
    taskList.innerHTML = '<div class="empty-message">ยังไม่มี task 😴</div>';
    return;
  }

  taskList.innerHTML = tasks
    .map((task) => {
      const isCompleted = task.timeLeft === 0;
      const isWarning = task.timeLeft < 60 && task.timeLeft > 0;
      const isDanger = task.timeLeft < 30 && task.timeLeft > 0;

      let timerClass = "";
      if (isDanger) timerClass = "danger";
      else if (isWarning) timerClass = "warning";

      return `
        <div class="task-item ${isCompleted ? "completed" : ""}">
          <div class="task-info">
            <div class="task-name">${task.name}</div>
            <div class="task-timer ${timerClass}">
              ${formatTime(task.timeLeft)}
            </div>
          </div>
          <div class="task-controls">
            <button
              class="btn-start ${task.isRunning ? "btn-pause" : ""}"
              onclick="toggleTimer(${task.id})"
              ${isCompleted ? "disabled" : ""}
            >
              ${task.isRunning ? "⏸️ หยุด" : "▶️ เริ่ม"}
            </button>
            <button class="btn-delete" onclick="deleteTask(${task.id})">
              ลบ
            </button>
          </div>
        </div>
      `;
    })
    .join("");
}

// ================================
// Event Listeners
// ================================

addBtn.addEventListener("click", addTask);

taskInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    addTask();
  }
});

// เริ่มต้น
renderTasks();
