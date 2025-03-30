import { initializeApp } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-database.js";

// 🔥 Firebase 설정
const firebaseConfig = {
  apiKey: "AIzaSyAH18MqEDo-SoZFruYnf1kCB_r43AJScH8",
  authDomain: "kmucapstone4group-2c0d3.firebaseapp.com",
  databaseURL: "https://kmucapstone4group-2c0d3-default-rtdb.firebaseio.com",
  projectId: "kmucapstone4group-2c0d3",
  storageBucket: "kmucapstone4group-2c0d3.appspot.com",
  messagingSenderId: "906625063859",
  appId: "1:906625063859:web:0f7f509f9b28bceb4989c6",
  measurementId: "G-KX1FNVYRRC"
};

// 🔥 Firebase 초기화
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const sensorRef = ref(db, "/pad/sensor");

// 🔄 실시간 데이터 가져오기
onValue(sensorRef, (snapshot) => {
  const data = snapshot.val();

  // 데이터가 객체인지 확인 후 처리
  if (typeof data === "object") {
    document.getElementById("sensor").innerText = data.value || JSON.stringify(data);
  } else {
    document.getElementById("sensor").innerText = data;
  }
});
