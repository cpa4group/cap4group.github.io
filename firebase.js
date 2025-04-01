import { initializeApp } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-app.js";
import { getDatabase, ref, onValue, update } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-database.js";

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

// 초기화
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const sensorRef = ref(db, "/sensors");
const container = document.getElementById("sensorContainer");

// 오디오 템플릿 복사용
const audioTemplate = document.getElementById("alertSoundTemplate");

let previousValues = {};

onValue(sensorRef, (snapshot) => {
  const sensors = snapshot.val() || {};
  container.innerHTML = "";

  for (let id in sensors) {
    const sensor = sensors[id];
    const prev = previousValues[id];
    const currentValue = sensor.value;
    previousValues[id] = currentValue;

    const card = document.createElement("div");
    card.className = "sensor-card";

    if (currentValue === 2) {
      card.classList.add("warning");
    }

    const rowDiv = document.createElement("div");
    rowDiv.className = "sensor-row";

    // ===== 이름 =====
    const nameBox = document.createElement("div");
    nameBox.className = "sensor-item sensor-name";
    nameBox.textContent = `이름: ${sensor.name || id}`;

    // ===== 상태 =====
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

    // ===== 주소 =====
    const addrBox = document.createElement("div");
    addrBox.className = "sensor-item sensor-address";

    const addrLabel = document.createElement("span");
    addrLabel.textContent = "주소:";
    const addrInput = document.createElement("input");
    addrInput.type = "text";
    addrInput.value = sensor.address || "";

    const addrBtn = document.createElement("button");
    addrBtn.textContent = "저장";
    addrBtn.onclick = () => {
      const address = addrInput.value;
      update(ref(db, `/sensors/${id}`), { address })
        .then(() => console.log("✅ 주소 저장 성공"))
        .catch((err) => console.error("❌ 주소 저장 실패:", err));
    };

    addrBox.appendChild(addrLabel);
    addrBox.appendChild(addrInput);
    addrBox.appendChild(addrBtn);

    // ===== 소리 설정 =====
    const soundBox = document.createElement("div");
    soundBox.className = "sensor-item sensor-sound";

    const audio = audioTemplate.cloneNode();
    audio.removeAttribute("id");
    audio.style.display = "none";
    audio.volume = 1;
    document.body.appendChild(audio); // DOM에 삽입해야 재생 가능

    const soundToggle = document.createElement("input");
    soundToggle.type = "checkbox";
    soundToggle.checked = true;

    const volumeSlider = document.createElement("input");
    volumeSlider.type = "range";
    volumeSlider.min = 0;
    volumeSlider.max = 1;
    volumeSlider.step = 0.01;
    volumeSlider.value = 1;

    volumeSlider.addEventListener("input", () => {
      audio.volume = volumeSlider.value;
    });

    soundBox.appendChild(soundToggle);
    soundBox.appendChild(volumeSlider);

    // ===== 소리 조건: 2로 바뀌었을 때 재생 =====
    if (currentValue === 2 && prev !== 2 && soundToggle.checked) {
      audio.currentTime = 0;
      audio.play().catch(e => console.warn("🔇 알림 소리 실패:", e));
    }

    // ===== 카드 구성 =====
    rowDiv.appendChild(nameBox);
    rowDiv.appendChild(statusBox);
    rowDiv.appendChild(addrBox);
    rowDiv.appendChild(soundBox);

    card.appendChild(rowDiv);
    container.appendChild(card);
  }
});

