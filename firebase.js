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
const filteredContainer = document.getElementById("filteredContainer");
const toggleButton = document.getElementById("toggleButton");
const enableAudioBtn = document.getElementById("enableAudioBtn");


let audioUnlocked = false;
let allSensorData = {};
let previousValues = {};


enableAudioBtn.addEventListener("click", () => {
 const sound = new Audio("sounds/alert.mp3");
 sound.play().then(() => {
   audioUnlocked = true;
   enableAudioBtn.style.display = "none";
 }).catch((e) => {
   console.warn("❌ 오디오 실패:", e);
 });
});


toggleButton.addEventListener("click", () => {
 container.classList.toggle("hidden");
 toggleButton.textContent = container.classList.contains("hidden") ? "더보기 열기" : "더보기 닫기";
});


onValue(sensorRef, (snapshot) => {
 const sensors = snapshot.val() || {};
 allSensorData = sensors;
 renderMainSensors(); // 전체 센서 보여줌
});


function renderMainSensors() {
 mainContainer.innerHTML = "";
 container.innerHTML = "";
 for (let id in allSensorData) {
   const sensor = allSensorData[id];
   const target = sensor.value === 2 ? mainContainer : container;
   renderSensorCard(id, sensor, target);
 }
}


function renderFilteredSensors(sido, sigungu, dong) {
 filteredContainer.innerHTML = "";
 for (let id in allSensorData) {
   const sensor = allSensorData[id];
   const address = localStorage.getItem(`sensor_addr_${id}`) || sensor.address || "";
   if (address.includes(`${sido} ${sigungu} ${dong}`)) {
     renderSensorCard(id, sensor, filteredContainer);
   }
 }
}


function renderSensorCard(id, sensor, targetContainer) {
 const currentValue = sensor.value;
 const prev = previousValues[id];
 previousValues[id] = currentValue;


 const card = document.createElement("div");
 card.className = "sensor-card";
 if (currentValue === 2) card.classList.add("warning");


 const rowDiv = document.createElement("div");
 rowDiv.className = "sensor-row";


 const nameBox = document.createElement("div");
 nameBox.className = "sensor-item sensor-name";
 nameBox.textContent = `이름: ${sensor.name || id}`;


 const statusBox = document.createElement("div");
 statusBox.className = "sensor-item sensor-status";
 const statusLabel = document.createElement("span");
 statusLabel.textContent = "상태:";
 const circle = document.createElement("div");
 circle.className = "circle";
 circle.style.backgroundColor = ["green", "orange", "red"][currentValue] || "gray";
 statusBox.appendChild(statusLabel);
 statusBox.appendChild(circle);


 const addrBox = document.createElement("div");
 addrBox.className = "sensor-item sensor-address";
 const addrLabel = document.createElement("span");
 addrLabel.textContent = "주소:";
 const addrInput = document.createElement("input");
 addrInput.type = "text";
 addrInput.value = localStorage.getItem(`sensor_addr_${id}`) || sensor.address || "";


 const addrBtn = document.createElement("button");
 addrBtn.textContent = "저장";
 addrBtn.onclick = () => {
   localStorage.setItem(`sensor_addr_${id}`, addrInput.value);
   alert("✅ 주소 저장 완료!");
 };


 // 주소 셀렉트 박스
 const sidoSelect = document.createElement("select");
 const sigunguSelect = document.createElement("select");
 const dongSelect = document.createElement("select");


 fetch("lo_fixed.json")
   .then(res => res.json())
   .then(data => {
     const sidoList = [...new Set(data.map(d => d.sido))];
     sidoList.forEach(s => {
       const o = document.createElement("option");
       o.value = o.textContent = s;
       sidoSelect.appendChild(o);
     });


     sidoSelect.addEventListener("change", () => {
       sigunguSelect.innerHTML = "";
       dongSelect.innerHTML = "";
       [...new Set(data.filter(d => d.sido === sidoSelect.value).map(d => d.sigungu))]
         .forEach(gu => {
           const o = document.createElement("option");
           o.value = o.textContent = gu;
           sigunguSelect.appendChild(o);
         });
       sigunguSelect.dispatchEvent(new Event("change"));
     });


     sigunguSelect.addEventListener("change", () => {
       dongSelect.innerHTML = "";
       data.filter(d => d.sido === sidoSelect.value && d.sigungu === sigunguSelect.value)
           .map(d => d.dong)
           .forEach(dong => {
             const o = document.createElement("option");
             o.value = o.textContent = dong;
             dongSelect.appendChild(o);
           });
     });


     dongSelect.addEventListener("change", () => {
       addrInput.value = `${sidoSelect.value} ${sigunguSelect.value} ${dongSelect.value}`;
     });


     const parts = addrInput.value.split(" ");
     if (parts.length === 3) {
       sidoSelect.value = parts[0];
       sidoSelect.dispatchEvent(new Event("change"));
       setTimeout(() => {
         sigunguSelect.value = parts[1];
         sigunguSelect.dispatchEvent(new Event("change"));
         setTimeout(() => {
           dongSelect.value = parts[2];
           dongSelect.dispatchEvent(new Event("change"));
         }, 100);
       }, 100);
     } else {
       sidoSelect.dispatchEvent(new Event("change"));
     }
   });


 addrBox.append(addrLabel, addrInput, addrBtn, sidoSelect, sigunguSelect, dongSelect);


 const soundBox = document.createElement("div");
 soundBox.className = "sensor-item sensor-sound";
 const soundLabel = document.createElement("label");
 soundLabel.textContent = "소리 사용 🔊";
 const soundToggle = document.createElement("input");
 soundToggle.type = "checkbox";
 soundToggle.checked = true;


 const volumeLabel = document.createElement("label");
 volumeLabel.textContent = "음량 조절 🔉";
 const volumeSlider = document.createElement("input");
 volumeSlider.type = "range";
 volumeSlider.min = 0;
 volumeSlider.max = 1;
 volumeSlider.step = 0.01;
 volumeSlider.value = 1;


 if (currentValue === 2 && prev !== 2 && soundToggle.checked && audioUnlocked) {
   const sound = new Audio("sounds/alert.mp3");
   sound.volume = volumeSlider.value;
   sound.play().catch(e => console.warn("🔇 센서 알림 실패:", e));
 }


 soundBox.append(soundLabel, soundToggle, volumeLabel, volumeSlider);


 if (currentValue === 2) {
   const resetBtn = document.createElement("button");
   resetBtn.textContent = "경고 해제";
   resetBtn.onclick = () => {
     update(ref(db, `/sensors/${id}`), { command: "reset" })
       .then(() => console.log("🛠️ 리셋 전송 완료"))
       .catch((err) => console.error("❌ 실패:", err));
   };
   card.appendChild(resetBtn);
 }


 rowDiv.append(nameBox, statusBox, addrBox, soundBox);
 card.appendChild(rowDiv);
 targetContainer.appendChild(card);
}


// ✅ 사이드바 필터 기능
const sidebarSido = document.getElementById("sidebarSido");
const sidebarSigungu = document.getElementById("sidebarSigungu");
const sidebarDong = document.getElementById("sidebarDong");


fetch("lo_fixed.json")
 .then(res => res.json())
 .then(data => {
   [...new Set(data.map(d => d.sido))].forEach(sido => {
     const op = document.createElement("option");
     op.value = op.textContent = sido;
     sidebarSido.appendChild(op);
   });


   sidebarSido.addEventListener("change", () => {
     sidebarSigungu.innerHTML = "";
     sidebarDong.innerHTML = "";
     [...new Set(data.filter(d => d.sido === sidebarSido.value).map(d => d.sigungu))]
       .forEach(gu => {
         const op = document.createElement("option");
         op.value = op.textContent = gu;
         sidebarSigungu.appendChild(op);
       });
     sidebarSigungu.dispatchEvent(new Event("change"));
   });


   sidebarSigungu.addEventListener("change", () => {
     sidebarDong.innerHTML = "";
     [...new Set(data.filter(d =>
       d.sido === sidebarSido.value && d.sigungu === sidebarSigungu.value
     ).map(d => d.dong))].forEach(dong => {
       const op = document.createElement("option");
       op.value = op.textContent = dong;
       sidebarDong.appendChild(op);
     });
   });


   sidebarDong.addEventListener("change", () => {
     renderFilteredSensors(
       sidebarSido.value,
       sidebarSigungu.value,
       sidebarDong.value
     );
   });


   sidebarSido.dispatchEvent(new Event("change")); // 초기 실행
 });


