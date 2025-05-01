// Firebase 초기화
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-app.js";
import { getDatabase, ref, onValue, update } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-database.js";


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
const userListContainer = document.getElementById("userList");
const toggleButton = document.getElementById("toggleButton");
const enableAudioBtn = document.getElementById("enableAudioBtn");
const sidebarSido = document.getElementById("sidebarSido");
const sidebarSigungu = document.getElementById("sidebarSigungu");
const sidebarDong = document.getElementById("sidebarDong");
const searchButton = document.getElementById("searchButton");


let audioUnlocked = false;
let allSensorData = {};
let previousValues = {};
let locationData = [];
let selectedUsers = {};


enableAudioBtn.addEventListener("click", () => {
 const sound = new Audio("sounds/alert.mp3");
 sound.play().then(() => {
   audioUnlocked = true;
   enableAudioBtn.style.display = "none";
 }).catch((e) => console.warn("❌ 오디오 실패:", e));
});


toggleButton.addEventListener("click", () => {
 container.classList.toggle("hidden");
 toggleButton.textContent = container.classList.contains("hidden") ? "더보기 열기" : "더보기 닫기";
});


onValue(sensorRef, (snapshot) => {
 allSensorData = snapshot.val() || {};
 for (let id in allSensorData) {
   const sensor = allSensorData[id];
   if (sensor.address) {
     localStorage.setItem(`sensor_addr_${id}`, sensor.address);
   }
 }
 renderMainSensors();
});


function renderMainSensors() {
 mainContainer.innerHTML = "";
 container.innerHTML = "";
 for (let id in allSensorData) {
   const sensor = allSensorData[id];
   const target = (sensor.value === 2) ? mainContainer : container;
   renderSensorCard(id, sensor, target);
 }
}


function renderSensorCard(id, sensor, targetContainer) {
 const currentValue = sensor.value;
 const prev = previousValues[id];
 previousValues[id] = currentValue;


 const card = document.createElement("div");
 card.className = "sensor-card";
 if (currentValue === 2) card.classList.add("warning");


 const topRow = document.createElement("div");
 topRow.className = "sensor-row";


 const nameBox = document.createElement("div");
 nameBox.className = "sensor-item sensor-name";
 nameBox.innerHTML = `<strong>이름:</strong> ${sensor.name || id}`;


 const statusDot = document.createElement("div");
 statusDot.className = "sensor-status";
 statusDot.style.backgroundColor = ["green", "orange", "red"][currentValue] || "gray";


 const addrBox = document.createElement("div");
 addrBox.className = "sensor-item sensor-address";
 addrBox.innerHTML = `<strong>주소:</strong> ${sensor.address || "주소 없음"}`;


 const phoneBox = document.createElement("div");
 phoneBox.className = "sensor-item sensor-phone";
 phoneBox.innerHTML = `<strong>전화번호:</strong> ${sensor.phone || "번호 없음"}`;


 topRow.append(nameBox, statusDot, addrBox, phoneBox);


 const soundRow = document.createElement("div");
 soundRow.className = "sensor-row";


 const soundBox = document.createElement("div");
 soundBox.className = "sensor-item sensor-sound";


 const soundToggle = document.createElement("input");
 soundToggle.type = "checkbox";
 soundToggle.checked = true;


 const volumeSlider = document.createElement("input");
 volumeSlider.type = "range";
 volumeSlider.min = 0;
 volumeSlider.max = 1;
 volumeSlider.step = 0.01;
 volumeSlider.value = 1;


 soundBox.append(
   document.createTextNode("소리사용 "),
   soundToggle,
   document.createTextNode(" 음량 "),
   volumeSlider
 );


 soundRow.appendChild(soundBox);


 if (currentValue === 2 && prev !== 2 && soundToggle.checked && audioUnlocked) {
   const sound = new Audio("sounds/alert.mp3");
   sound.volume = volumeSlider.value;
   sound.play().catch(e => console.warn("🔇 알림 실패:", e));
 }


 const regionRow = document.createElement("div");
 regionRow.className = "sensor-row";


 const sidoSelect = document.createElement("select");
 const sigunguSelect = document.createElement("select");
 const dongSelect = document.createElement("select");
 const saveBtn = document.createElement("button");
 saveBtn.textContent = "저장";


 const matchedData = locationData || [];
 const sidoList = [...new Set(matchedData.map(d => d.sido))];
 sidoList.forEach(s => {
   const o = document.createElement("option");
   o.value = o.textContent = s;
   sidoSelect.appendChild(o);
 });


 sidoSelect.addEventListener("change", () => {
   sigunguSelect.innerHTML = "";
   dongSelect.innerHTML = "";
   [...new Set(matchedData.filter(d => d.sido === sidoSelect.value).map(d => d.sigungu))].forEach(gu => {
     const o = document.createElement("option");
     o.value = o.textContent = gu;
     sigunguSelect.appendChild(o);
   });
   sigunguSelect.dispatchEvent(new Event("change"));
 });


 sigunguSelect.addEventListener("change", () => {
   dongSelect.innerHTML = "";
   matchedData.filter(d => d.sido === sidoSelect.value && d.sigungu === sigunguSelect.value)
     .map(d => d.dong).forEach(d => {
       const o = document.createElement("option");
       o.value = o.textContent = d;
       dongSelect.appendChild(o);
     });
 });


 sidoSelect.dispatchEvent(new Event("change"));


 // 👉 주소 있으면 자동 선택해주기
 const storedAddr = localStorage.getItem(`sensor_addr_${id}`);
 if (storedAddr) {
   const [sido, sigungu, dong] = storedAddr.split(" ");
   sidoSelect.value = sido;
   sidoSelect.dispatchEvent(new Event("change"));
   setTimeout(() => {
     sigunguSelect.value = sigungu;
     sigunguSelect.dispatchEvent(new Event("change"));
     setTimeout(() => {
       dongSelect.value = dong;
     }, 100);
   }, 100);
 }


 saveBtn.onclick = () => {
   const fullAddr = `${sidoSelect.value} ${sigunguSelect.value} ${dongSelect.value}`;
   localStorage.setItem(`sensor_addr_${id}`, fullAddr);
   alert(`✅ 지역 필터용 주소 저장됨: ${fullAddr}`);
 };


 regionRow.append(
   document.createTextNode("지역필터 "),
   sidoSelect,
   sigunguSelect,
   dongSelect,
   saveBtn
 );


 const buttonBox = document.createElement("div");
 buttonBox.style.display = "flex";
 buttonBox.style.gap = "10px";


 const alertBtn = document.createElement("button");
 alertBtn.textContent = "알림";
 alertBtn.onclick = () => alert(`센서 ${sensor.name || id} 알림 발생!`);


 const resetBtn = document.createElement("button");
 resetBtn.textContent = "센서리셋";
 resetBtn.onclick = () => {
   update(ref(db, `/sensors/${id}`), { command: "reset" })
     .then(() => alert(`🛠️ ${sensor.name || id} 센서 리셋 완료`))
     .catch(err => console.error("❌ 리셋 실패:", err));
 };


 buttonBox.append(alertBtn, resetBtn);


 card.append(topRow, soundRow, regionRow, buttonBox);
 targetContainer.appendChild(card);
}


function renderSelectedUsers() {
 filteredContainer.innerHTML = "";
 for (let id in selectedUsers) {
   renderSensorCard(id, selectedUsers[id], filteredContainer);
 }
}


fetch("lo_fixed.json")
 .then(res => res.json())
 .then(data => {
   locationData = data;
   const sidoList = [...new Set(data.map(d => d.sido))];
   sidoList.forEach(sido => {
     const op = document.createElement("option");
     op.value = sido;
     op.textContent = sido;
     sidebarSido.appendChild(op);
   });


   sidebarSido.addEventListener("change", () => {
     sidebarSigungu.innerHTML = "";
     sidebarDong.innerHTML = "";
     [...new Set(data.filter(d => d.sido === sidebarSido.value).map(d => d.sigungu))].forEach(gu => {
       const op = document.createElement("option");
       op.value = gu;
       op.textContent = gu;
       sidebarSigungu.appendChild(op);
     });
     sidebarSigungu.dispatchEvent(new Event("change"));
   });


   sidebarSigungu.addEventListener("change", () => {
     sidebarDong.innerHTML = "";
     [...new Set(data.filter(d => d.sido === sidebarSido.value && d.sigungu === sidebarSigungu.value).map(d => d.dong))].forEach(dong => {
       const op = document.createElement("option");
       op.value = dong;
       op.textContent = dong;
       sidebarDong.appendChild(op);
     });
   });


   sidebarSido.dispatchEvent(new Event("change"));
 });


searchButton.addEventListener("click", () => {
 userListContainer.innerHTML = "";
 filteredContainer.innerHTML = "";
 selectedUsers = {};


 const sido = sidebarSido.value;
 const sigungu = sidebarSigungu.value;
 const dong = sidebarDong.value;
 const fullAddr = `${sido} ${sigungu} ${dong}`;


 for (let id in allSensorData) {
   const sensor = allSensorData[id];
   const stored = localStorage.getItem(`sensor_addr_${id}`) || sensor.address;


   if (!stored || stored.includes(fullAddr)) {
     const userDiv = document.createElement("div");
     userDiv.className = "user-item";


     const checkbox = document.createElement("input");
     checkbox.type = "checkbox";
     checkbox.style.marginRight = "8px";


     const label = document.createElement("span");
     label.textContent = `${sensor.name || id} (${sensor.phone || "번호 없음"}) - ${sensor.address || "주소 없음"}`;


     checkbox.addEventListener("change", (e) => {
       if (e.target.checked) {
         selectedUsers[id] = sensor;
       } else {
         delete selectedUsers[id];
       }
       renderSelectedUsers();
     });


     userDiv.appendChild(checkbox);
     userDiv.appendChild(label);
     userListContainer.appendChild(userDiv);
   }
 }
});
