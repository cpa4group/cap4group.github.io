import { initializeApp } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-app.js";
import {
  getDatabase,
  ref,
  get,
  onChildAdded,
  onChildChanged,
  update
} from "https://www.gstatic.com/firebasejs/11.5.0/firebase-database.js";

// ✅ Firebase 구성
const firebaseConfig = {
  apiKey: "AIzaSyAH18MqEDo-SoZFruYnf1kCB_r43AJScH8",
  authDomain: "kmucapstone4group-2c0d3.firebaseapp.com",
  databaseURL: "https://kmucapstone4group-2c0d3-default-rtdb.firebaseio.com",
  projectId: "kmucapstone4group-2c0d3",
  storageBucket: "kmucapstone4group-2c0d3.appspot.com",
  messagingSenderId: "906625063859",
  appId: "1:906625063859:web:0f7f509f9b28bceb4989c6"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const sensorRef = ref(db, "/sensors");
const dailyAvgRef = ref(db, "/daily_stats");

const mainContainer = document.getElementById("mainContainer");
const container = document.getElementById("sensorContainer");
const toggleButton = document.getElementById("toggleButton");

const urlParams = new URLSearchParams(window.location.search);
const sido = urlParams.get("sido") || "";
const sigungu = urlParams.get("sigungu") || "";
const dong = urlParams.get("dong") || "";
const fullAddress = `${sido} ${sigungu} ${dong}`.trim();

let allSensorData = {};

// ✅ Chart.js 팝업 생성
const chartModal = document.createElement("div");
chartModal.id = "chartModal";
chartModal.style.cssText = `position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);display:none;align-items:center;justify-content:center;z-index:1000;`;
chartModal.innerHTML = `
  <div style="background:white;padding:20px;border-radius:10px;max-width:700px;width:90%;position:relative">
    <button id="closeChartModal" style="position:absolute;top:10px;right:10px">닫기</button>
    <canvas id="popupChart" width="600" height="350"></canvas>
  </div>`;
document.body.appendChild(chartModal);
document.getElementById("closeChartModal").onclick = () => {
  chartModal.style.display = "none";
};

function renderDailyChart(sensorId) {
  get(dailyAvgRef).then(snapshot => {
    const data = snapshot.val();
    if (!data) return;
    const labels = [], averages = [], counts = [];
    Object.entries(data).forEach(([date, sensors]) => {
      if (sensors[sensorId]) {
        labels.push(date);
        averages.push(sensors[sensorId].average);
        counts.push(sensors[sensorId].pressCount);
      }
    });
    const ctx = document.getElementById("popupChart").getContext("2d");
    chartModal.style.display = "flex";
    if (window.chartInstance) window.chartInstance.destroy();
    window.chartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          { label: '평균 감지 횟수', data: averages, borderColor: 'blue', borderWidth: 2, fill: false },
          { label: '감지 총횟수', data: counts, borderColor: 'red', borderWidth: 2, fill: false }
        ]
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'top' } },
        scales: {
          x: { title: { display: true, text: '날짜' } },
          y: { beginAtZero: true, title: { display: true, text: '횟수' } }
        }
      }
    });
  });
}

function renderSensorCard(id, sensor, targetContainer, isEmergency = false) {
  const currVal = Number(sensor.value);
  const card = document.createElement("div");
  card.className = "sensor-card";
  if (currVal === 2) card.classList.add("warning");
  if (currVal === 3) card.classList.add("status-blue");
  if (isEmergency) card.classList.add("emergency");

  const topRow = document.createElement("div");
  topRow.className = "sensor-row";

  const nameBox = document.createElement("div");
  nameBox.className = "sensor-item sensor-name";
  nameBox.textContent = `이름: ${sensor.name || id}`;

  const statusDot = document.createElement("div");
  statusDot.className = "sensor-status";
  if (currVal === 0) statusDot.classList.add("status-green");
  if (currVal === 1) statusDot.classList.add("status-orange");
  if (currVal === 2) statusDot.classList.add("status-red");
  if (currVal === 3) statusDot.classList.add("status-blue");

  const addrBox = document.createElement("div");
  addrBox.className = "sensor-item sensor-address";
  addrBox.textContent = `주소: ${sensor.address || "-"}`;

  const phoneBox = document.createElement("div");
  phoneBox.className = "sensor-item sensor-phone";
  phoneBox.textContent = `전화번호: ${sensor.phone || "-"}`;

  const wakeTimeBox = document.createElement("div");
  wakeTimeBox.className = "sensor-item sensor-waketime";
  wakeTimeBox.textContent = `기상시간: ${sensor.time || "-"}`;

  const numberBox = document.createElement("div");
  numberBox.className = "sensor-item sensor-count";
  numberBox.textContent = `감지 횟수: ${sensor.number ?? 0}회`;

  const averageBox = document.createElement("div");
  averageBox.className = "sensor-item sensor-average";
  averageBox.textContent = `감지 횟수 평균값: ${sensor.averagePressCount ?? 0}`;
  averageBox.style.cursor = "pointer";
  averageBox.onclick = () => renderDailyChart(id);

  topRow.append(nameBox, statusDot, addrBox, phoneBox, wakeTimeBox, numberBox, averageBox);

  const buttonBox = document.createElement("div");
  buttonBox.style.display = "flex";
  buttonBox.style.gap = "8px";

  const alertBtn = document.createElement("button");
  alertBtn.textContent = "알림";
  alertBtn.onclick = () => alert(`${sensor.name || id} 알림!`);

  const resetBtn = document.createElement("button");
  resetBtn.textContent = "리셋";
  resetBtn.onclick = () => {
    update(ref(db, `/sensors/${id}`), { command: "reset", value: 0 });
  };

  buttonBox.append(alertBtn, resetBtn);
  card.append(topRow, buttonBox);
  targetContainer.appendChild(card);
}

// ✅ 센서 렌더링 함수 (지역 기준 필터링)
function renderRegionSensors(data) {
  mainContainer.innerHTML = "";
  container.innerHTML = "";

  let found = false;

  Object.entries(data).forEach(([id, sensor]) => {
    if (!sensor.address) return;

    const addressMatch =
      sensor.address.includes(sido) &&
      sensor.address.includes(sigungu) &&
      sensor.address.includes(dong);

    if (addressMatch) {
      found = true;
      const value = Number(sensor.value);
      const isEmergency = value === 2;
      renderSensorCard(id, sensor, isEmergency ? mainContainer : container, isEmergency);
    }
  });

  if (!found) {
    container.innerHTML = `<div style="text-align:center;color:gray;font-weight:bold;">해당 지역 센서가 없습니다.</div>`;
  }
}

// ✅ 초기 로딩
get(sensorRef).then(snapshot => {
  allSensorData = snapshot.val() || {};
  renderRegionSensors(allSensorData);
});

// ✅ 실시간 반영
onChildAdded(sensorRef, snap => {
  allSensorData[snap.key] = snap.val();
  renderRegionSensors(allSensorData);
});
onChildChanged(sensorRef, snap => {
  allSensorData[snap.key] = snap.val();
  renderRegionSensors(allSensorData);
});

// ✅ 더보기 버튼
toggleButton.addEventListener("click", () => {
  container.classList.toggle("hidden");
  toggleButton.textContent = container.classList.contains("hidden") ? "더보기 열기" : "더보기 닫기";
});
