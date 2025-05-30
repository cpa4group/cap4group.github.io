// Firebase 초기화
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-app.js";
import {
  getDatabase,
  ref,
  get,
  onChildAdded,
  onChildChanged,
  update
} from "https://www.gstatic.com/firebasejs/11.5.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyAH18MqEDo-SoZFruYnf1kCB_r43AJScH8",
  authDomain: "kmucapstone4group-2c0d3.firebaseapp.com",
  databaseURL: "https://kmucapstone4group-2c0d3-default-rtdb.firebaseio.com",
  projectId: "kmucapstone4group-2c0d3",
  storageBucket: "kmucapstone4group-2c0d3.appspot.com",
  messagingSenderId: "906625063859",
  appId: "1:906625063859:web:0f7f509f9b28bceb4989c6"
};

const app       = initializeApp(firebaseConfig);
const db        = getDatabase(app);
const sensorRef = ref(db, "/sensors");

// DOM 요소
const mainContainer     = document.getElementById("mainContainer");
const container         = document.getElementById("sensorContainer");
const filteredContainer = document.getElementById("filteredContainer");
const userListContainer = document.getElementById("userList");
const toggleButton      = document.getElementById("toggleButton");
const sidebarSido       = document.getElementById("sidebarSido");
const sidebarSigungu    = document.getElementById("sidebarSigungu");
const sidebarDong       = document.getElementById("sidebarDong");
const searchButton      = document.getElementById("searchButton");

// 상태
let allSensorData = {};
let locationData  = [];
let selectedUsers = {};

// 더보기 토글
toggleButton.addEventListener("click", () => {
  container.classList.toggle("hidden");
  toggleButton.textContent = container.classList.contains("hidden")
    ? "더보기 열기" : "더보기 닫기";
});

// 초기 데이터 로딩
get(sensorRef)
  .then(snapshot => {
    allSensorData = snapshot.val() || {};
    renderMainSensors();
  })
  .catch(e => console.error("초기 데이터 로드 실패:", e));

// 센서 추가 감지
onChildAdded(sensorRef, snapshot => {
  const id = snapshot.key;
  const sensor = snapshot.val();
  allSensorData[id] = sensor;
  renderMainSensors();
});

// 상태값 변경 감지
onChildChanged(sensorRef, snapshot => {
  const id = snapshot.key;
  const sensor = snapshot.val();
  allSensorData[id] = sensor;
  renderMainSensors();
});

// 센서 카드 렌더링
function renderMainSensors() {
  container.classList.remove("hidden");
  mainContainer.innerHTML = "";
  container.innerHTML     = "";

  Object.entries(allSensorData).forEach(([id, sensor]) => {
    const value = Number(sensor.value);

    // 긴급 판단
    let isEmergency = false;
    if (sensor.time) {
      const now = new Date();
      const [wakeHour, wakeMinute] = sensor.time.split(":").map(Number);
      const wakeTime = new Date();
      wakeTime.setHours(wakeHour, wakeMinute, 0, 0);
      const upperBound = new Date(wakeTime.getTime() + 2 * 60 * 60 * 1000);
      if (now > upperBound && value !== 2) {
        isEmergency = true;
      }
    }

    const target = (value === 2 || isEmergency) ? mainContainer : container;
    renderSensorCard(id, sensor, target, isEmergency);
  });
}

// 카드 내부 구성
function renderSensorCard(id, sensor, targetContainer, isEmergency = false) {
  const currVal = Number(sensor.value);

  const card = document.createElement("div");
  card.className = "sensor-card";
  if (currVal === 2) card.classList.add("warning");
  if (currVal === 3) card.classList.add("status-blue");
  if (isEmergency)   card.classList.add("emergency");

  const topRow = document.createElement("div");
  topRow.className = "sensor-row";

  const nameBox = document.createElement("div");
  nameBox.className = "sensor-item sensor-name";
  nameBox.textContent = `이름: ${sensor.name || id}`;

  const statusDot = document.createElement("div");
  statusDot.className = "sensor-status";

  // 상태값에 따라 색상 클래스 부여
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

  topRow.append(
    nameBox, statusDot, addrBox,
    phoneBox, wakeTimeBox, numberBox, averageBox
  );

  const buttonBox = document.createElement("div");
  buttonBox.style.display = "flex";
  buttonBox.style.gap = "8px";

  const alertBtn = document.createElement("button");
  alertBtn.textContent = "알림";
  alertBtn.onclick = () => alert(`${sensor.name || id} 알림!`);

  const resetBtn = document.createElement("button");
  resetBtn.textContent = "리셋";
  resetBtn.onclick = () => {
    update(ref(db, `/sensors/${id}`), { command: "reset", value: 0 })
      .then(() => renderMainSensors());
  };

  buttonBox.append(alertBtn, resetBtn);

  card.append(topRow, buttonBox);
  targetContainer.appendChild(card);
}

// 지역 데이터 로딩
fetch("lo_fixed.json")
  .then(res => res.json())
  .then(data => {
    locationData = data;
    [...new Set(data.map(d => d.sido))].forEach(s => {
      const o = document.createElement("option");
      o.value = o.textContent = s;
      sidebarSido.appendChild(o);
    });
    sidebarSido.onchange = () => {
      sidebarSigungu.innerHTML = sidebarDong.innerHTML = "";
      [...new Set(data.filter(d => d.sido === sidebarSido.value).map(d => d.sigungu))].forEach(g => {
        const o = document.createElement("option");
        o.value = o.textContent = g;
        sidebarSigungu.appendChild(o);
      });
      sidebarSigungu.dispatchEvent(new Event("change"));
    };
    sidebarSigungu.onchange = () => {
      sidebarDong.innerHTML = "";
      data
        .filter(d => d.sido === sidebarSido.value && d.sigungu === sidebarSigungu.value)
        .map(d => d.dong)
        .forEach(x => {
          const o = document.createElement("option");
          o.value = o.textContent = x;
          sidebarDong.appendChild(o);
        });
    };
    sidebarSido.dispatchEvent(new Event("change"));
  })
  .catch(e => console.error("필터 로딩 실패", e));

// 지역 필터 검색 (address 기반)
searchButton.addEventListener("click", () => {
  userListContainer.innerHTML  = "";
  filteredContainer.innerHTML  = "";
  selectedUsers = {};

  const fullFilter = `${sidebarSido.value} ${sidebarSigungu.value} ${sidebarDong.value}`;

  Object.entries(allSensorData).forEach(([id, sensor]) => {
    if (!sensor.address) return;

    const match = locationData.find(loc =>
      sensor.address.includes(loc.sido) &&
      sensor.address.includes(loc.sigungu) &&
      sensor.address.includes(loc.dong)
    );

    if (!match) return;

    const matchedFull = `${match.sido} ${match.sigungu} ${match.dong}`;
    if (matchedFull !== fullFilter) return;

    const div = document.createElement("div");
    div.className = "user-item";
    const cb  = document.createElement("input"); cb.type = "checkbox";
    const lbl = document.createElement("span");
    lbl.textContent = `${sensor.name || id}`;
    cb.onchange = e => {
      if (e.target.checked) selectedUsers[id] = sensor;
      else delete selectedUsers[id];
      renderSelectedUsers();
    };
    div.append(cb, lbl);
    userListContainer.appendChild(div);
  });
});

function renderSelectedUsers() {
  filteredContainer.innerHTML = "";
  Object.entries(selectedUsers).forEach(([id, sensor]) =>
    renderSensorCard(id, sensor, filteredContainer)
  );
}
