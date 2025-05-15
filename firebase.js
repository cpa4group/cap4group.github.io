// Firebase 초기화
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-app.js";
import {
  getDatabase,
  ref,
  get,
  onChildAdded,
  onChildChanged,
  runTransaction,
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

// Debounce/Cooldown 설정 (밀리초)
const DEBOUNCE_TIME = 200;
const COOLDOWN_TIME = 1000;

// Wake window 검사: 사용자 기상 시간 ±2시간 내에 밟힘 감지 없으면 상태값 2로 설정
function checkWakeWindow(id, sensor) {
  if (!sensor.time) return;
  const wakeTime = new Date(sensor.time);
  const now = new Date();
  const windowStart = new Date(wakeTime.getTime() - 2 * 60 * 60 * 1000);
  const windowEnd = new Date(wakeTime.getTime() + 2 * 60 * 60 * 1000);

  // 윈도우 종료 후 한 번도 밟히지 않았으면 경고 상태로 업데이트
  if (now > windowEnd) {
    const hitsToday = Number(sensor.number ?? sensor.value);
    if (hitsToday === 0 && sensor.value !== 2) {
      update(ref(db, `/sensors/${id}`), { value: 2 })
        .catch(e => console.error(`Wake window 체크 업데이트 실패: ${id}`, e));
    }
  }
}

// 오늘 히트카운트 기록 (필요시 유지)
function recordDailyHit(sensorId) {
  const today  = new Date().toISOString().slice(0,10);
  const hitRef = ref(db, `/sensors/${sensorId}/hits/${today}`);
  runTransaction(hitRef, count => (count||0) + 1)
    .catch(e => console.error(`Hit 실패: ${sensorId}`, e));
}

// 센서 카드 생성 (최초 렌더)
function createSensorCard(id, sensor) {
  const currVal = Number(sensor.number ?? sensor.value);

  const card = document.createElement("div");
  card.className = "sensor-card";
  card.id = `sensor-${id}`;
  if (currVal === 2) card.classList.add("warning");

  // ── 상단 정보 행
  const topRow = document.createElement("div");
  topRow.className = "sensor-row";

  const nameBox = document.createElement("div");
  nameBox.className = "sensor-item sensor-name";
  nameBox.textContent = `이름: ${sensor.name || id}`;

  const statusDot = document.createElement("div");
  statusDot.className = "sensor-status";
  statusDot.style.backgroundColor =
    ["green","orange","red"][Number(sensor.value)] || "gray";

  const addrBox = document.createElement("div");
  addrBox.className = "sensor-item sensor-address";
  addrBox.textContent = `주소: ${sensor.address || "-"}`;

  const phoneBox = document.createElement("div");
  phoneBox.className = "sensor-item sensor-phone";
  phoneBox.textContent = `전화번호: ${sensor.phone || "-"}`;

  const numberBox = document.createElement("div");
  numberBox.className = "sensor-item sensor-number";
  numberBox.textContent = `오늘 눌린 횟수: ${currVal}`;

  const deviceTimeBox = document.createElement("div");
  deviceTimeBox.className = "sensor-item sensor-devicetime";
  deviceTimeBox.textContent = `사용자 기상 시간: ${sensor.time || "-"}`;

  topRow.append(
    nameBox,
    statusDot,
    addrBox,
    phoneBox,
    numberBox,
    deviceTimeBox
  );

  // ── 알림 / 리셋 버튼 행
  const buttonBox = document.createElement("div");
  buttonBox.style.display = "flex";
  buttonBox.style.gap = "8px";

  const alertBtn = document.createElement("button");
  alertBtn.textContent = "알림";
  alertBtn.onclick = () => alert(`${sensor.name || id} 알림!`);

  const resetBtn = document.createElement("button");
  resetBtn.textContent = "리셋";
  resetBtn.onclick = () =>
    update(ref(db, `/sensors/${id}`), { command: "reset", value: 0 });

  buttonBox.append(alertBtn, resetBtn);

  card.append(topRow, buttonBox);
  return card;
}

// 센서 카드 업데이트 (변경된 카드만)
function updateSensorCard(id, sensor) {
  const card    = document.getElementById(`sensor-${id}`);
  const currVal = Number(sensor.number ?? sensor.value);
  previousValues[id] = currVal;

  if (!card) {
    // 새 센서인 경우 prepend
    const newCard = createSensorCard(id, sensor);
    if (currVal === 2) mainContainer.prepend(newCard);
    else               container.prepend(newCard);
    return;
  }

  // 상태 점 색상 갱신
  const statusDot = card.querySelector(".sensor-status");
  statusDot.style.backgroundColor =
    ["green","orange","red"][Number(sensor.value)] || "gray";

  // 값 갱신
  const numberBox = card.querySelector(".sensor-item.sensor-number");
  numberBox.textContent = `오늘 눌린 횟수: ${currVal}`;

  // 장치시간 갱신
  const deviceTimeBox = card.querySelector(".sensor-item.sensor-devicetime");
  deviceTimeBox.textContent = `사용자 기상 시간: ${sensor.time || "-"}`;

  // 긴급센서일 때 맨 위로 이동
  const curParent = card.parentElement;
  const newParent = currVal === 2 ? mainContainer : container;
  if (curParent !== newParent) newParent.prepend(card);
}

// 초기 렌더링 (한 번만)
function renderMainSensors() {
  mainContainer.innerHTML = "";
  container.innerHTML     = "";
  previousValues = {};

  const fragNormal  = document.createDocumentFragment();
  const fragWarning = document.createDocumentFragment();

  Object.entries(allSensorData).forEach(([id, sensor]) => {
    const currVal = Number(sensor.number ?? sensor.value);
    previousValues[id] = currVal;
    const card = createSensorCard(id, sensor);
    if (currVal === 2) fragWarning.appendChild(card);
    else               fragNormal.appendChild(card);
  });

  mainContainer.appendChild(fragWarning);
  container.appendChild(fragNormal);
}

// DOM 요소
const mainContainer     = document.getElementById("mainContainer");     // 긴급센서(value=2)
const container         = document.getElementById("sensorContainer");   // 일반센서
const filteredContainer = document.getElementById("filteredContainer");
const userListContainer = document.getElementById("userList");
const toggleButton      = document.getElementById("toggleButton");
const sidebarSido       = document.getElementById("sidebarSido");
const sidebarSigungu    = document.getElementById("sidebarSigungu");
const sidebarDong       = document.getElementById("sidebarDong");
const searchButton      = document.getElementById("searchButton");

let allSensorData        = {};
let previousValues       = {};
let triggered            = {};
let triggerTimestamps    = {};
let lastRecordTimestamps = {};
let locationData         = [];
let selectedUsers        = {};

// 카드 토글
toggleButton.addEventListener("click", () => {
  container.classList.toggle("hidden");
  toggleButton.textContent = container.classList.contains("hidden")
    ? "더보기 열기" : "더보기 닫기";
});

// 1) 초기 데이터 로드
get(sensorRef)
  .then(snapshot => {
    allSensorData = snapshot.val() || {};
    renderMainSensors();
    // Wake window 체크 호출
    Object.entries(allSensorData).forEach(([id, sensor]) => {
      checkWakeWindow(id, sensor);
    });
  })
  .catch(e => console.error("초기 데이터 로드 실패:", e));

// 2) 센서 추가 감지
onChildAdded(sensorRef, snapshot => {
  const id     = snapshot.key;
  const sensor = snapshot.val();
  allSensorData[id] = sensor;
  const currVal = Number(sensor.number ?? sensor.value);
  const newCard = createSensorCard(id, sensor);
  if (currVal === 2) mainContainer.prepend(newCard);
  else               container.prepend(newCard);
  // Wake window 체크 호출
  checkWakeWindow(id, sensor);
});

// 3) 값 변경 감지
onChildChanged(sensorRef, snapshot => {
  const id     = snapshot.key;
  const sensor = snapshot.val();
  const curr   = Number(sensor.number ?? sensor.value);
  const prev   = Number(previousValues[id] ?? 0);

  allSensorData[id] = sensor;
  if (curr === prev) return;

  const now = Date.now();
  if (prev === 0 && curr === 1) {
    triggered[id] = true;
    triggerTimestamps[id] = now;
  } else if (prev === 1 && curr === 0 && triggered[id]) {
    const sinceTrig = now - triggerTimestamps[id];
    const sinceRec  = now - lastRecordTimestamps[id];
    if (sinceTrig > DEBOUNCE_TIME && sinceRec > COOLDOWN_TIME) {
      recordDailyHit(id);
      lastRecordTimestamps[id] = now;
    }
    triggered[id] = false;
  }

  updateSensorCard(id, sensor);
  // Wake window 체크 호출
  checkWakeWindow(id, sensor);
});

// 지역 데이터 로딩 및 전역 필터 설정
fetch("lo_fixed.json")
  .then(res => res.json())
  .then(data => {
    locationData = data;

    [...new Set(data.map(d => d.sido))].forEach(s => {
      const o = document.createElement("option");
      o.value = o.textContent = s;
      sidebarSido.append(o);
    });

    sidebarSido.onchange = () => {
      sidebarSigungu.innerHTML = sidebarDong.innerHTML = "";

      [...new Set(data
        .filter(d => d.sido === sidebarSido.value)
        .map(d => d.sigungu))]
      .forEach(g => {
        const o = document.createElement("option");
        o.value = o.textContent = g;
        sidebarSigungu.append(o);
      });
      sidebarSigungu.dispatchEvent(new Event("change"));
    };

    sidebarSigungu.onchange = () => {
      sidebarDong.innerHTML = "";
      data
        .filter(d => d.sido === sidebarSido.value && d.sigungu === sidebarSigungu.value)
        .forEach(item => {
          const o = document.createElement("option");
          o.value = o.textContent = item.dong;
          sidebarDong.append(o);
        });
    };

    sidebarSido.dispatchEvent(new Event("change"));

    searchButton.addEventListener("click", () => {
      userListContainer.innerHTML = "";
      filteredContainer.innerHTML = "";
      selectedUsers = {};
      const fullFilter = `${sidebarSido.value} ${sidebarSigungu.value} ${sidebarDong.value}`;
      Object.entries(allSensorData).forEach(([id, sensor]) => {
        if (!sensor.address || sensor.address.includes(fullFilter)) {
          const div = document.createElement("div");
          div.className = "user-item";
          const cb = document.createElement("input");
          cb.type = "checkbox";
          const lbl = document.createElement("span");
          lbl.textContent = sensor.name || id;
          cb.onchange = e => {
            if (e.target.checked) selectedUsers[id] = sensor;
            else delete selectedUsers[id];
            renderSelectedUsers();
          };
          div.append(cb, lbl);
          userListContainer.appendChild(div);
        }
      });
    });
  })
  .catch(e => console.error("필터 로딩 실패:", e));

// 선택된 센서 렌더
function renderSelectedUsers() {
  filteredContainer.innerHTML = "";
  Object.entries(selectedUsers).forEach(([id, sensor]) => {
    const card = document.getElementById(`sensor-${id}`);
    if (card) filteredContainer.appendChild(card.cloneNode(true));
  });
}
