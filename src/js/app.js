/**
 * 앱 메인 진입점
 * 모든 모듈을 초기화하고 UI와 타이머 로직을 연결
 */

import { Timer } from './timer.js';
import { StorageManager } from './storage.js';
import { NotificationManager } from './notification.js';

/**
 * UI 요소 참조 객체
 */
const uiElements = {
  timeDisplay: null,
  startStopBtn: null,
  resetBtn: null,
  sessionCount: null,
  tabBtns: null,
  // 설정 패널 관련 요소
  settingsBtn: null,
  settingsPanel: null,
  settingPomodoro: null,
  settingShortBreak: null,
  settingLongBreak: null,
  settingsSaveBtn: null,
  settingsCancelBtn: null,
};

/**
 * 앱 상태 관리 객체
 */
const appState = {
  sessionCount: 0,
  timer: null,
};

/**
 * UI 요소 초기화
 * DOM 로드 후 요소 참조를 캐싱
 */
function initUiElements() {
  uiElements.timeDisplay = document.getElementById('timeDisplay');
  uiElements.startStopBtn = document.getElementById('startStopBtn');
  uiElements.resetBtn = document.getElementById('resetBtn');
  uiElements.sessionCount = document.getElementById('sessionCount');
  uiElements.tabBtns = document.querySelectorAll('.tab-btn');

  // 설정 패널 요소 참조 캐싱
  uiElements.settingsBtn = document.getElementById('settingsBtn');
  uiElements.settingsPanel = document.getElementById('settingsPanel');
  uiElements.settingPomodoro = document.getElementById('settingPomodoro');
  uiElements.settingShortBreak = document.getElementById('settingShortBreak');
  uiElements.settingLongBreak = document.getElementById('settingLongBreak');
  uiElements.settingsSaveBtn = document.getElementById('settingsSaveBtn');
  uiElements.settingsCancelBtn = document.getElementById('settingsCancelBtn');

  // 필수 요소 존재 여부 검증
  const requiredElements = ['timeDisplay', 'startStopBtn', 'resetBtn', 'sessionCount'];
  for (const key of requiredElements) {
    if (!uiElements[key]) {
      console.error(`필수 UI 요소를 찾을 수 없습니다: #${key}`);
    }
  }
}

/**
 * 타이머 디스플레이 업데이트
 * @param {string} formattedTime - MM:SS 형식의 시간 문자열
 */
function updateTimeDisplay(formattedTime) {
  if (uiElements.timeDisplay) {
    uiElements.timeDisplay.textContent = formattedTime;
  }
}

/**
 * 시작/정지 버튼 텍스트 업데이트
 * @param {boolean} isRunning - 타이머 실행 중 여부
 */
function updateStartStopBtn(isRunning) {
  if (uiElements.startStopBtn) {
    uiElements.startStopBtn.textContent = isRunning ? '정지' : '시작';
  }
}

/**
 * 세션 카운트 UI 업데이트
 */
function updateSessionCountDisplay() {
  if (uiElements.sessionCount) {
    uiElements.sessionCount.textContent = String(appState.sessionCount);
  }
}

/**
 * 타이머 완료 핸들러
 * @param {string} mode - 완료된 타이머 모드
 */
function handleTimerComplete(mode) {
  // 뽀모도로 완료 시 세션 카운트 증가
  if (mode === 'pomodoro') {
    appState.sessionCount += 1;
    StorageManager.saveSessionCount(appState.sessionCount);
    updateSessionCountDisplay();
  }

  // 완료 알림 전송
  NotificationManager.sendTimerCompleteNotification(mode);
  updateStartStopBtn(false);
}

/**
 * 설정 패널 열기
 * 패널을 visible 상태로 변경하고 현재 durations 값을 입력 필드에 채움
 */
function openSettingsPanel() {
  if (!uiElements.settingsPanel) return;

  // 현재 타이머 durations 값을 각 input에 채워 넣기
  if (uiElements.settingPomodoro) {
    uiElements.settingPomodoro.value = String(appState.timer.durations.pomodoro);
  }
  if (uiElements.settingShortBreak) {
    uiElements.settingShortBreak.value = String(appState.timer.durations.shortBreak);
  }
  if (uiElements.settingLongBreak) {
    uiElements.settingLongBreak.value = String(appState.timer.durations.longBreak);
  }

  // 패널 표시 (hidden 속성 제거)
  uiElements.settingsPanel.removeAttribute('hidden');
}

/**
 * 설정 패널 닫기
 * 패널에 hidden 속성 복원
 */
function closeSettingsPanel() {
  if (!uiElements.settingsPanel) return;
  uiElements.settingsPanel.setAttribute('hidden', '');
}

/**
 * 설정값 유효성 검증 (1~99 범위)
 * @param {number} value - 검증할 숫자
 * @returns {boolean} 유효 여부
 */
function isValidDurationValue(value) {
  return Number.isInteger(value) && value >= 1 && value <= 99;
}

/**
 * 설정 저장
 * input 값을 읽어 유효성 검증 후 저장, 타이머에 즉시 반영
 */
function saveSettings() {
  // 각 입력값을 정수로 파싱
  const pomodoroVal = parseInt(uiElements.settingPomodoro?.value ?? '', 10);
  const shortBreakVal = parseInt(uiElements.settingShortBreak?.value ?? '', 10);
  const longBreakVal = parseInt(uiElements.settingLongBreak?.value ?? '', 10);

  // 유효성 검증: 1~99 범위를 벗어난 경우 저장 거부
  if (!isValidDurationValue(pomodoroVal)) {
    alert('뽀모도로 시간은 1~99분 사이로 입력해주세요.');
    return;
  }
  if (!isValidDurationValue(shortBreakVal)) {
    alert('짧은 휴식 시간은 1~99분 사이로 입력해주세요.');
    return;
  }
  if (!isValidDurationValue(longBreakVal)) {
    alert('긴 휴식 시간은 1~99분 사이로 입력해주세요.');
    return;
  }

  const newSettings = {
    pomodoro: pomodoroVal,
    shortBreak: shortBreakVal,
    longBreak: longBreakVal,
  };

  // LocalStorage에 설정 저장
  StorageManager.saveSettings(newSettings);

  // 타이머에 새 설정 즉시 반영
  appState.timer.updateDurations(newSettings);

  // 타이머 디스플레이 갱신
  updateTimeDisplay(appState.timer.getFormattedTime());

  // 설정 패널 닫기
  closeSettingsPanel();
}

/**
 * 이벤트 리스너 등록
 */
function bindEvents() {
  // 시작/정지 버튼 클릭 핸들러
  uiElements.startStopBtn?.addEventListener('click', () => {
    if (appState.timer.isRunning) {
      appState.timer.stop();
      updateStartStopBtn(false);
    } else {
      appState.timer.start();
      updateStartStopBtn(true);
    }
  });

  // 초기화 버튼 클릭 핸들러
  uiElements.resetBtn?.addEventListener('click', () => {
    appState.timer.reset();
    updateStartStopBtn(false);
    updateTimeDisplay(appState.timer.getFormattedTime());
  });

  // 설정 열기 버튼 클릭 핸들러
  uiElements.settingsBtn?.addEventListener('click', () => {
    openSettingsPanel();
  });

  // 설정 저장 버튼 클릭 핸들러
  uiElements.settingsSaveBtn?.addEventListener('click', () => {
    saveSettings();
  });

  // 설정 취소/닫기 버튼 클릭 핸들러
  uiElements.settingsCancelBtn?.addEventListener('click', () => {
    closeSettingsPanel();
  });

  // 모드 탭 클릭 핸들러
  uiElements.tabBtns?.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const mode = e.currentTarget.dataset.mode;
      // 탭 UI 활성화 상태 변경
      uiElements.tabBtns.forEach((b) => b.classList.remove('tab-btn--active'));
      e.currentTarget.classList.add('tab-btn--active');

      // 모드 키 변환 (HTML data-mode → Timer 내부 키)
      const modeMap = {
        pomodoro: 'pomodoro',
        'short-break': 'shortBreak',
        'long-break': 'longBreak',
      };

      try {
        appState.timer.setMode(modeMap[mode]);
        updateStartStopBtn(false);
        updateTimeDisplay(appState.timer.getFormattedTime());
      } catch (error) {
        console.error('모드 변경 실패:', error);
      }
    });
  });
}

/**
 * 앱 초기화 메인 함수
 */
function initApp() {
  // UI 요소 초기화
  initUiElements();

  // 저장된 세션 카운트 불러오기
  appState.sessionCount = StorageManager.loadSessionCount();
  updateSessionCountDisplay();

  // 저장된 설정 불러오기
  const savedSettings = StorageManager.loadSettings();

  // 타이머 인스턴스 생성
  appState.timer = new Timer({
    ...(savedSettings ?? {}),
    // 매 초 UI 갱신
    onTick: () => {
      updateTimeDisplay(appState.timer.getFormattedTime());
    },
    // 타이머 완료 처리
    onComplete: handleTimerComplete,
  });

  // 초기 시간 표시
  updateTimeDisplay(appState.timer.getFormattedTime());

  // 이벤트 리스너 등록
  bindEvents();

  // 알림 권한 요청 (비동기, 실패해도 앱 동작)
  NotificationManager.requestPermission().catch((error) => {
    console.warn('알림 권한 요청 중 오류:', error);
  });

  console.log('Pomodoro 타이머 앱 초기화 완료');
}

// DOM 로드 완료 후 앱 초기화
document.addEventListener('DOMContentLoaded', initApp);
