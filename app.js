// ================================
//  Weather App with Fetch API
// ================================

// State
let state = {
  currentCity: null,
  latitude: null,
  longitude: null,
  recentCities: JSON.parse(localStorage.getItem("recentCities")) || [],
  autoRefreshInterval: null,
};

// 🎯 DOM Elements
const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const weatherContainer = document.getElementById("weatherContainer");
const loading = document.getElementById("loading");
const errorMsg = document.getElementById("errorMsg");
const emptyState = document.getElementById("emptyState");
const recentCitiesDiv = document.getElementById("recentCities");

// ================================
// 🔧 Helper Functions
// ================================

function showNotification(message) {
  const notification = document.createElement("div");
  notification.className = "notification";
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 3000);
}

function showLoading() {
  loading.classList.add("show");
  errorMsg.classList.remove("show");
}

function hideLoading() {
  loading.classList.remove("show");
}

function showError(message) {
  errorMsg.textContent = "❌ " + message;
  errorMsg.classList.add("show");
  weatherContainer.classList.remove("show");
  emptyState.style.display = "block";
}

function getCurrentTime() {
  const now = new Date();
  return now.toLocaleString("th-TH", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ================================
// 🌍 Geocoding Functions
// ================================

// ดึง Latitude/Longitude จากชื่อเมือง
async function geocodeCity(cityName) {
  try {
    showLoading();

    const response = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
        cityName,
      )}&count=1&language=en&format=json`,
    );

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      throw new Error("ไม่พบเมืองนี้");
    }

    const location = data.results[0];
    return {
      name: location.name,
      country: location.country,
      latitude: location.latitude,
      longitude: location.longitude,
    };
  } catch (error) {
    showError(error.message);
    throw error;
  }
}

// ================================
// 🌡️ Weather Functions
// ================================

// ดึงข้อมูลสภาพอากาศ
async function fetchWeather(latitude, longitude, cityInfo) {
  try {
    showLoading();

    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,pressure_msl,visibility&timezone=auto&hourly=temperature_2m`,
    );

    if (!response.ok) {
      throw new Error("Failed to fetch weather data");
    }

    const data = await response.json();
    hideLoading();

    // อัปเดต State
    state.currentCity = cityInfo;
    state.latitude = latitude;
    state.longitude = longitude;

    // บันทึก recent cities
    saveRecentCity(cityInfo);

    // แสดงผลข้อมูล
    displayWeather(data, cityInfo);
  } catch (error) {
    showError(error.message);
  }
}

// ================================
// 🎨 Display Functions
// ================================

function getWeatherDescription(code) {
  const weatherCodes = {
    0: "☀️ ท้องฟ้าแจ่มใส",
    1: "🌤️ เมฆเล็กน้อย",
    2: "⛅ เมฆครึ่งหนึ่ง",
    3: "☁️ เมฆมาก",
    45: "🌫️ หมอก",
    48: "🌫️ หมอก",
    51: "🌧️ ฝนเล็กน้อย",
    53: "🌧️ ฝนปานกลาง",
    55: "🌧️ ฝนหนัก",
    61: "🌧️ ฝนเล็กน้อย",
    63: "🌧️ ฝนปานกลาง",
    65: "⛈️ ฝนหนัก",
    71: "❄️ หิมะเล็กน้อย",
    73: "❄️ หิมะปานกลาง",
    75: "❄️ หิมะหนัก",
    80: " ฝนแต่อากาศส่วนใหญ่ปกติ",
    81: "⛈️ ฝนเล็กน้อย",
    82: "⛈️ ฝนหนัก",
    85: "🌨️ หิมะและฝนปนกัน",
    86: "🌨️ หิมะหนัก",
    95: "⛈️ พายุฝนฟ้าคะนอง",
    96: "⛈️ พายุฝนฟ้าคะนอง",
    99: "⛈️ พายุฝนฟ้าคะนองหนัก",
  };
  return weatherCodes[code] || "🌍 สภาพอากาศไม่ชัดเจน";
}

function displayWeather(data, cityInfo) {
  const current = data.current;
  const hourly = data.hourly;

  // Update Header
  document.getElementById("cityName").textContent =
    `${cityInfo.name}, ${cityInfo.country}`;
  document.getElementById("updateTime").textContent =
    `📍 อัปเดตเมื่อ ${getCurrentTime()}`;

  // Update Temperature
  const description = getWeatherDescription(current.weather_code);
  document.getElementById("description").textContent = description;
  document.getElementById("temperature").textContent =
    Math.round(current.temperature_2m) + "°C";
  document.getElementById("feelsLike").textContent =
    `รู้สึก ${Math.round(current.apparent_temperature)}°C`;

  // Update Details
  document.getElementById("humidity").textContent =
    current.relative_humidity_2m + "%";
  document.getElementById("windSpeed").textContent =
    current.wind_speed_10m + " m/s";
  document.getElementById("pressure").textContent =
    current.pressure_msl + " hPa";
  document.getElementById("visibility").textContent =
    (current.visibility / 1000).toFixed(1) + " km";

  // Display Hourly Forecast
  displayHourlyForecast(hourly);

  // Show Weather Container
  weatherContainer.classList.add("show");
  emptyState.style.display = "none";
  errorMsg.classList.remove("show");
}

function displayHourlyForecast(hourly) {
  const hourlyList = document.getElementById("hourlyList");
  const hourlySection = document.getElementById("hourlySection");

  hourlyList.innerHTML = "";

  // ดึงเฉพาะ 24 ชั่วโมงแรก
  for (let i = 0; i < 24; i += 3) {
    const time = hourly.time[i];
    const temp = hourly.temperature_2m[i];

    const hour = new Date(time).getHours();
    const hourlyItem = document.createElement("div");
    hourlyItem.className = "hourly-item";
    hourlyItem.innerHTML = `
          <div class="hourly-time">${hour}:00</div>
          <div class="hourly-temp">${Math.round(temp)}°</div>
        `;

    hourlyList.appendChild(hourlyItem);
  }

  hourlySection.style.display = "block";
}

// ================================
// 💾 LocalStorage Functions
// ================================

function saveRecentCity(cityInfo) {
  // ลบซ้ำ
  state.recentCities = state.recentCities.filter(
    (city) => city.name !== cityInfo.name,
  );

  // เพิ่มหน้า
  state.recentCities.unshift(cityInfo);

  // เก็บแค่ 5 เมืองล่าสุด
  if (state.recentCities.length > 5) {
    state.recentCities.pop();
  }

  localStorage.setItem("recentCities", JSON.stringify(state.recentCities));
  renderRecentCities();
}

function renderRecentCities() {
  recentCitiesDiv.innerHTML = "";

  if (state.recentCities.length === 0) return;

  const label = document.createElement("div");
  label.style.width = "100%";
  label.style.fontSize = "12px";
  label.style.color = "#999";
  label.style.marginBottom = "10px";
  label.style.textTransform = "uppercase";
  label.textContent = "🕐 ค้นหาล่าสุด:";
  recentCitiesDiv.appendChild(label);

  state.recentCities.forEach((city) => {
    const tag = document.createElement("div");
    tag.className = "city-tag";
    tag.textContent = city.name;
    tag.addEventListener("click", async () => {
      await fetchWeather(city.latitude, city.longitude, city);
    });
    recentCitiesDiv.appendChild(tag);
  });
}

// ================================
// 🎬 Event Listeners
// ================================

async function searchCity() {
  const cityName = cityInput.value.trim();

  if (!cityName) {
    showError("กรุณากรอกชื่อเมือง");
    return;
  }

  try {
    const cityInfo = await geocodeCity(cityName);
    await fetchWeather(cityInfo.latitude, cityInfo.longitude, cityInfo);
    cityInput.value = "";
    showNotification(`✅ ค้นหา ${cityInfo.name} สำเร็จ`);
  } catch (error) {
    // Error already shown in geocodeCity
  }
}

searchBtn.addEventListener("click", searchCity);

cityInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    searchCity();
  }
});

// Initialize
renderRecentCities();
