import { initializeApp } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-database.js";
import { update } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-database.js";

// Firebase 설정
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

const mainContainer = document.getElementById("mainContainer");
const container = document.getElementById("sensorContainer");
const toggleButton = document.getElementById("toggleButton");
const enableAudioBtn = document.getElementById("enableAudioBtn");

let audioUnlocked = false;

// ✅ 사용자 클릭으로 오디오 권한 활성화
enableAudioBtn.addEventListener("click", () => {
  const sound = new Audio("sounds/alert.mp3");
  sound.play().then(() => {
    audioUnlocked = true;
    console.log("🔓 오디오 활성화됨");
    enableAudioBtn.style.display = "none";
  }).catch((e) => {
    console.warn("❌ 오디오 실패:", e);
  });
});

let isExpanded = false;
toggleButton.addEventListener("click", () => {
  isExpanded = !isExpanded;
  container.classList.toggle("hidden", !isExpanded);
  toggleButton.textContent = isExpanded ? "더보기 닫기" : "더보기 열기";
});

let previousValues = {};

onValue(sensorRef, (snapshot) => {
  const sensors = snapshot.val() || {};
  container.innerHTML = "";
  mainContainer.innerHTML = "";

  for (let id in sensors) {
    const sensor = sensors[id];
    const prev = previousValues[id];
    const currentValue = sensor.value;
    previousValues[id] = currentValue;

    const card = document.createElement("div");
    card.className = "sensor-card";
    if (currentValue === 2) card.classList.add("warning");

    const rowDiv = document.createElement("div");
    rowDiv.className = "sensor-row";

    // 이름
    const nameBox = document.createElement("div");
    nameBox.className = "sensor-item sensor-name";
    nameBox.textContent = `이름: ${sensor.name || id}`;

    // 상태
    const statusBox = document.createElement("div");
    statusBox.className = "sensor-item sensor-status";
    const statusLabel = document.createElement("span");
    statusLabel.textContent = "상태:";
    const circle = document.createElement("div");
    circle.className = "circle";
    if (currentValue === 0) circle.style.backgroundColor = "green";
    else if (currentValue === 1) circle.style.backgroundColor = "orange";
    else if (currentValue === 2) circle.style.backgroundColor = "red";
    else circle.style.backgroundColor = "gray";
    statusBox.appendChild(statusLabel);
    statusBox.appendChild(circle);

    // 주소
    const addrBox = document.createElement("div");
    addrBox.className = "sensor-item sensor-address";
    const addrLabel = document.createElement("span");
    addrLabel.textContent = "주소:";
    const addrInput = document.createElement("input");
    addrInput.type = "text";
    const storedAddress = localStorage.getItem(`sensor_addr_${id}`);
    addrInput.value = storedAddress || sensor.address || "";

    const addrBtn = document.createElement("button");
    addrBtn.textContent = "저장";
    addrBtn.onclick = () => {
      const address = addrInput.value;
      localStorage.setItem(`sensor_addr_${id}`, address);
      alert("✅ 주소가 웹에 저장되었습니다!");
    };

    addrBox.appendChild(addrLabel);
    addrBox.appendChild(addrInput);
    addrBox.appendChild(addrBtn);

    // 소리 설정
    const soundBox = document.createElement("div");
    soundBox.className = "sensor-item sensor-sound";

    const soundLabel = document.createElement("label");
    soundLabel.textContent = "소리 사용 🔊";

    const soundToggle = document.createElement("input");
    soundToggle.type = "checkbox";
    soundToggle.checked = true;
    soundToggle.style.marginLeft = "6px";

    const volumeLabel = document.createElement("label");
    volumeLabel.textContent = "음량 조절 🔉";

    const volumeSlider = document.createElement("input");
    volumeSlider.type = "range";
    volumeSlider.min = 0;
    volumeSlider.max = 1;
    volumeSlider.step = 0.01;
    volumeSlider.value = 1;

    soundBox.appendChild(soundLabel);
    soundBox.appendChild(soundToggle);
    soundBox.appendChild(volumeLabel);
    soundBox.appendChild(volumeSlider);

    // 소리 재생 조건
    if (currentValue === 2 && prev !== 2 && soundToggle.checked && audioUnlocked) {
      const sound = new Audio("sounds/alert.mp3");
      sound.volume = volumeSlider.value;
      sound.play().catch(e => console.warn("🔇 센서 알림 실패:", e));
    }

    // 경고 해제 버튼
    if (currentValue === 2) {
      const resetBtn = document.createElement("button");
      resetBtn.textContent = "경고 해제";
      resetBtn.onclick = () => {
        update(ref(db, `/sensors/${id}`), { command: "reset" })
          .then(() => console.log("🛠️ 리셋 명령 전송됨"))
          .catch((err) => console.error("❌ 명령 전송 실패:", err));
      };
      card.appendChild(resetBtn);
    }

    rowDiv.appendChild(nameBox);
    rowDiv.appendChild(statusBox);
    rowDiv.appendChild(addrBox);
    rowDiv.appendChild(soundBox);
    card.appendChild(rowDiv);

    (currentValue === 2 ? mainContainer : container).appendChild(card);
  }
});
