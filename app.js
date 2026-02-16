// ================================
// Pomodoro Timer App
// ================================

// 📊 State
let state = {
  isRunning: false,
  isWorkPhase: true,
  timeLeft: 25 * 60, // วินาที
  totalTime: 25 * 60,
  currentSession: 1,
  completedSessions: 0,
  intervalId: null,
  workDuration: 25 * 60,
  breakDuration: 5 * 60,
  longBreakDuration: 15 * 60,
};

// DOM Elements
const timeDisplay = document.getElementById("timeDisplay");
const startBtn = document.getElementById("startBtn");
const resetBtn = document.getElementById("resetBtn");
const progressBar = document.getElementById("progressBar");
const phaseDisplay = document.getElementById("phase");
const timerDisplay = document.getElementById("timerDisplay");
const currentSessionDisplay = document.getElementById("currentSession");
const workTimeInput = document.getElementById("workTime");
const breakTimeInput = document.getElementById("breakTime");
const completedCountDisplay = document.getElementById("completedCount");
const totalTimeDisplay = document.getElementById("totalTime");

// ================================
// 🔧 Helper Functions
// ================================

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function updateDisplay() {
  timeDisplay.textContent = formatTime(state.timeLeft);
  currentSessionDisplay.textContent = state.currentSession;

  // อัปเดต Progress Bar
  const progress = ((state.totalTime - state.timeLeft) / state.totalTime) * 100;
  progressBar.style.width = progress + "%";

  // อัปเดต Phase
  if (state.isWorkPhase) {
    phaseDisplay.textContent = "🔴 Work";
    phaseDisplay.className = "phase work";
    timerDisplay.classList.remove("break");
    timerDisplay.classList.add("work");
  } else {
    phaseDisplay.textContent = "🟢 Break";
    phaseDisplay.className = "phase break";
    timerDisplay.classList.remove("work");
    timerDisplay.classList.add("break");
  }

  // อัปเดต Button
  if (state.isRunning) {
    startBtn.textContent = "⏸️ หยุด";
    startBtn.classList.add("running");
  } else {
    startBtn.textContent = "▶️ เริ่ม";
    startBtn.classList.remove("running");
  }

  // อัปเดต Stats
  const totalMinutes = Math.floor(
    (state.completedSessions * state.workDuration) / 60,
  );
  totalTimeDisplay.textContent = totalMinutes + " min";
  completedCountDisplay.textContent = state.completedSessions;
}

function playNotification() {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  if (state.isWorkPhase) {
    oscillator.frequency.value = 800;
  } else {
    oscillator.frequency.value = 1200;
  }

  oscillator.type = "sine";
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(
    0.01,
    audioContext.currentTime + 0.5,
  );

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.5);
}

function showNotification(message) {
  const notification = document.createElement("div");
  notification.className = "notification";
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// ================================
// 🎬 Timer Functions
// ================================

function startTimer() {
  if (state.isRunning) {
    // Pause
    clearInterval(state.intervalId);
    state.isRunning = false;
  } else {
    // Start
    state.isRunning = true;

    state.intervalId = setInterval(() => {
      state.timeLeft--;

      // ✅ ถ้าหมดเวลา
      if (state.timeLeft <= 0) {
        clearInterval(state.intervalId);
        state.isRunning = false;

        playNotification();

        // Switch Phase
        if (state.isWorkPhase) {
          // หลังจบ Work
          state.completedSessions++;
          showNotification("✅ Work Complete! Time for Break!");

          // ตรวจสอบว่าเสร็จ 4 รอบหรือยัง
          if (state.currentSession % 4 === 0) {
            // Long Break
            state.breakDuration = state.longBreakDuration;
            showNotification("🎉 Long Break 15 minutes!");
          } else {
            state.breakDuration = parseInt(breakTimeInput.value) * 60;
          }

          state.isWorkPhase = false;
          state.timeLeft = state.breakDuration;
          state.totalTime = state.breakDuration;
        } else {
          // หลังจบ Break
          state.isWorkPhase = true;
          state.currentSession++;

          if (state.currentSession <= 4) {
            state.workDuration = parseInt(workTimeInput.value) * 60;
            state.timeLeft = state.workDuration;
            state.totalTime = state.workDuration;
            showNotification(`Session ${state.currentSession} Started!`);
          } else {
            // หมดครบ 4 รอบแล้ว
            state.currentSession = 1;
            state.workDuration = parseInt(workTimeInput.value) * 60;
            state.timeLeft = state.workDuration;
            state.totalTime = state.workDuration;
            showNotification("🎊 All sessions completed! Great job!");
          }
        }
      }

      updateDisplay();
    }, 1000);
  }

  updateDisplay();
}

function resetTimer() {
  clearInterval(state.intervalId);
  state.isRunning = false;
  state.isWorkPhase = true;
  state.currentSession = 1;
  state.workDuration = parseInt(workTimeInput.value) * 60;
  state.timeLeft = state.workDuration;
  state.totalTime = state.workDuration;

  updateDisplay();
  showNotification("🔄 Timer Reset!");
}

// ================================
// 🎬 Event Listeners
// ================================

startBtn.addEventListener("click", startTimer);
resetBtn.addEventListener("click", resetTimer);

workTimeInput.addEventListener("change", () => {
  if (!state.isRunning) {
    state.workDuration = parseInt(workTimeInput.value) * 60;
    if (state.isWorkPhase) {
      state.timeLeft = state.workDuration;
      state.totalTime = state.workDuration;
      updateDisplay();
    }
  }
});

breakTimeInput.addEventListener("change", () => {
  if (!state.isRunning) {
    state.breakDuration = parseInt(breakTimeInput.value) * 60;
    if (!state.isWorkPhase) {
      state.timeLeft = state.breakDuration;
      state.totalTime = state.breakDuration;
      updateDisplay();
    }
  }
});

// Initialize
updateDisplay();
