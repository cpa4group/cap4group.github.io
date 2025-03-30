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
  const sensorElement = document.getElementById("sensor");
  const circleElement = document.getElementById("circle");

  // 데이터가 숫자인지 확인
  let sensorValue = typeof data === "object" ? data.value : data;
  
  // 값 출력
  sensorElement.innerText = sensorValue;

  // 🔵 동그라미 색상 변경
  if (sensorValue == 0) {
    circleElement.style.backgroundColor = "green";  // 초록색
    stopSound();  // 초록색일 때 소리 멈춤
  } else if (sensorValue == 1) {
    circleElement.style.backgroundColor = "yellow"; // 노란색
    stopSound();  // 노란색일 때 소리 멈춤
  } else if (sensorValue == 2) {
    circleElement.style.backgroundColor = "red";    // 빨간색
    startSound(); // 빨간색일 때 소리 반복 시작
  }
});

// 기본 소리 생성 및 재생
let soundInterval;

function startSound() {
  if (!soundInterval) {  // 소리가 이미 반복 중이 아니라면
    soundInterval = setInterval(() => {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();  // 오디오 컨텍스트 생성
      const oscillator = audioContext.createOscillator();  // 음파 생성기
      oscillator.type = "square";  // 음파의 형태 (square, sine 등)
      oscillator.frequency.setValueAtTime(440, audioContext.currentTime);  // 주파수 설정 (440Hz = A4 음)
      oscillator.connect(audioContext.destination);  // 소리 출력

      oscillator.start();  // 소리 시작
      oscillator.stop(audioContext.currentTime + 0.5);  // 0.5초 후에 소리 종료
    }, 1000);  // 1초마다 소리 반복
  }
}

function stopSound() {
  if (soundInterval) {
    clearInterval(soundInterval);  // 반복되는 소리 정지
    soundInterval = null;  // 반복 정지 상태로 설정
  }
}
