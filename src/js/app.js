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
  sessionLabel: null,
  timerSector: null,
  startStopBtn: null,
  resetBtn: null,
  sessionCount: null,
  tabBtns: null,
  // 테마 관련 요소
  themeToggle: null,
  // 설정 패널 관련 요소
  settingsBtn: null,
  settingsModal: null,
  settingsPanel: null,
  settingsCloseBtn: null,
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
  currentTheme: 'system',
};

/**
 * UI 요소 초기화
 * DOM 로드 후 요소 참조를 캐싱
 */
function initUiElements() {
  uiElements.timeDisplay = document.getElementById('timeDisplay');
  uiElements.sessionLabel = document.getElementById('sessionLabel');
  uiElements.timerSector = document.getElementById('timerSector');
  uiElements.startStopBtn = document.getElementById('startStopBtn');
  uiElements.resetBtn = document.getElementById('resetBtn');
  uiElements.sessionCount = document.getElementById('sessionCount');
  uiElements.tabBtns = document.querySelectorAll('.tab-btn');

  // 테마 관련 요소 참조 캐싱
  uiElements.themeToggle = document.getElementById('themeToggle');

  // 설정 패널 요소 참조 캐싱
  uiElements.settingsBtn = document.getElementById('settingsBtn');
  uiElements.settingsModal = document.getElementById('settingsModal');
  uiElements.settingsPanel = document.getElementById('settingsPanel');
  uiElements.settingsCloseBtn = document.getElementById('settingsCloseBtn');
  uiElements.settingPomodoro = document.getElementById('settingPomodoro');
  uiElements.settingShortBreak = document.getElementById('settingShortBreak');
  uiElements.settingLongBreak = document.getElementById('settingLongBreak');
  uiElements.settingsSaveBtn = document.getElementById('settingsSaveBtn');
  uiElements.settingsCancelBtn = document.getElementById('settingsCancelBtn');

  // 필수 요소 존재 여부 검증
  const requiredElements = [
    'timeDisplay',
    'sessionLabel',
    'startStopBtn',
    'resetBtn',
    'sessionCount',
  ];
  for (const key of requiredElements) {
    if (!uiElements[key]) {
      console.error(`필수 UI 요소를 찾을 수 없습니다: #${key}`);
    }
  }
}

/**
 * 타이머 디스플레이 업데이트 (텍스트 + 원형 프로그레스)
 * @param {string} formattedTime - MM:SS 형식의 시간 문자열
 */
function updateTimeDisplay(formattedTime) {
  if (uiElements.timeDisplay) {
    uiElements.timeDisplay.textContent = formattedTime;
  }

  // 세션 레이블 업데이트
  if (appState.timer) {
    updateSessionLabel(appState.timer.currentMode);
  }

  // Time Timer 부채꼴 업데이트
  updateTimerSector();
}

/**
 * Time Timer 부채꼴 영역 업데이트
 * 현재 타이머 진행 상태에 따라 부채꼴 영역의 각도를 조정
 */
function updateTimerSector() {
  if (!uiElements.timerSector || !appState.timer) return;

  const totalSeconds = appState.timer.getTotalSeconds();
  const remainingSeconds = appState.timer.getRemainingSeconds();

  // 프로그레스 계산 (0: 시작, 1: 완료) - 경과 시간 기준으로 변경
  let progress = totalSeconds > 0 ? (totalSeconds - remainingSeconds) / totalSeconds : 0;

  // 엣지케이스 처리: progress 값을 0~1 범위로 제한
  progress = Math.max(0, Math.min(1, progress));

  // 세션 유형별 색상 설정
  const currentMode = appState.timer.currentMode;
  const colorMap = {
    pomodoro: 'var(--color-pomodoro)',
    shortBreak: 'var(--color-short-break)',
    longBreak: 'var(--color-long-break)',
  };

  const sectorColor = colorMap[currentMode] || 'var(--color-pomodoro)';
  uiElements.timerSector.setAttribute('fill', sectorColor);

  // 부채꼴 각도 계산 (12시부터 시계방향, 전체 원 = 360도)
  let angle = progress * 360;

  // 엣지케이스 처리: angle을 0~360 범위로 제한
  angle = Math.max(0, Math.min(360, angle));

  // SVG path 생성 - 엣지케이스 안전 처리
  const pathData = generateSectorPath(angle);
  uiElements.timerSector.setAttribute('d', pathData);
}

/**
 * SVG 부채꼴 path 생성 함수 (엣지케이스 안전 처리)
 * @param {number} angle - 부채꼴 각도 (0~360도)
 * @returns {string} SVG path 문자열
 */
function generateSectorPath(angle) {
  const centerX = 120;
  const centerY = 120;
  const radius = 108;

  // 엣지케이스 처리: 유효하지 않은 숫자값 검증
  let validAngle = angle;
  if (typeof angle !== 'number' || isNaN(angle)) {
    validAngle = 0;
  } else if (!isFinite(angle)) {
    // Infinity나 -Infinity의 경우 적절한 값으로 처리
    validAngle = angle > 0 ? 360 : 0;
  }

  // 엣지케이스 처리: 각도 범위 검증 및 제한
  const safeAngle = Math.max(0, Math.min(360, validAngle));

  if (safeAngle >= 360) {
    // 전체 원 - 완전히 닫힌 원을 위한 미세한 간격 사용
    return `M${centerX},${centerY} L${centerX},${centerY - radius} A${radius},${radius} 0 1,1 ${centerX - 0.01},${centerY - radius} Z`;
  } else if (safeAngle <= 0) {
    // 부채꼴 없음 - 중심점만 표시
    return `M${centerX},${centerY} L${centerX},${centerY} Z`;
  } else {
    // 일반적인 부채꼴 계산
    const radian = (safeAngle - 90) * (Math.PI / 180);
    const endX = centerX + radius * Math.cos(radian);
    const endY = centerY + radius * Math.sin(radian);

    // 큰 호 여부 (180도 초과)
    const largeArcFlag = safeAngle > 180 ? 1 : 0;

    // SVG path 생성
    return `M${centerX},${centerY} L${centerX},${centerY - radius} A${radius},${radius} 0 ${largeArcFlag},1 ${endX},${endY} Z`;
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
 * 세션 레이블 UI 업데이트
 * @param {string} mode - 현재 타이머 모드
 */
function updateSessionLabel(mode) {
  if (!uiElements.sessionLabel) return;

  const labelMap = {
    pomodoro: '뽀모도로',
    shortBreak: '짧은 휴식',
    longBreak: '긴 휴식',
  };

  uiElements.sessionLabel.textContent = labelMap[mode] || '뽀모도로';
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
 * 테마 적용
 * @param {string} theme - 적용할 테마 ('light', 'dark', 'system')
 */
function applyTheme(theme) {
  const htmlElement = document.documentElement;

  // 이전 테마 속성 제거
  htmlElement.removeAttribute('data-theme');

  // 새 테마 적용
  if (theme !== 'system') {
    htmlElement.setAttribute('data-theme', theme);
  }

  // 상태 업데이트
  appState.currentTheme = theme;

  // 토글 버튼 아이콘 업데이트
  updateThemeToggleIcon(theme);
}

/**
 * 테마 토글 버튼 아이콘 업데이트
 * @param {string} theme - 현재 테마
 */
function updateThemeToggleIcon(theme) {
  if (!uiElements.themeToggle) return;

  const icons = {
    light: '☀️',
    dark: '🌙',
    system: '🌗',
  };

  uiElements.themeToggle.textContent = icons[theme] || '🌗';
  uiElements.themeToggle.setAttribute('aria-label', `현재 테마: ${theme}`);
}

/**
 * 테마 토글
 * light → dark → system → light 순서로 순환
 */
function toggleTheme() {
  const themeOrder = ['light', 'dark', 'system'];
  const currentIndex = themeOrder.indexOf(appState.currentTheme);
  const nextIndex = (currentIndex + 1) % themeOrder.length;
  const nextTheme = themeOrder[nextIndex];

  // 테마 적용 및 저장
  applyTheme(nextTheme);
  StorageManager.saveTheme(nextTheme);
}

/**
 * 시스템 테마 변경 감지
 */
function setupSystemThemeDetection() {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  // 시스템 테마 변경 시 자동 적용 (system 모드일 때만)
  mediaQuery.addEventListener('change', () => {
    if (appState.currentTheme === 'system') {
      // system 모드에서는 CSS 미디어 쿼리가 자동으로 처리
      updateThemeToggleIcon('system');
    }
  });
}

/**
 * 설정 패널 열기
 * 패널을 visible 상태로 변경하고 현재 durations 값을 입력 필드에 채움
 */
function openSettingsPanel() {
  if (!uiElements.settingsModal) return;

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

  // 모달 표시
  uiElements.settingsModal.classList.add('modal-overlay--active');

  // 포커스 트랩 설정
  trapFocus(uiElements.settingsModal);

  // 첫 번째 입력 필드에 포커스
  const firstInput = uiElements.settingsModal.querySelector('input');
  if (firstInput) {
    setTimeout(() => firstInput.focus(), 100);
  }
}

/**
 * 설정 패널 닫기
 */
function closeSettingsPanel() {
  if (!uiElements.settingsModal) return;

  // 모달 숨김
  uiElements.settingsModal.classList.remove('modal-overlay--active');

  // 설정 버튼으로 포커스 복귀
  if (uiElements.settingsBtn) {
    uiElements.settingsBtn.focus();
  }
}

/**
 * 포커스 트랩 구현
 * @param {HTMLElement} element - 포커스를 가둘 요소
 */
function trapFocus(element) {
  const focusableElements = element.querySelectorAll(
    'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  function handleTabKey(e) {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  }

  element.addEventListener('keydown', handleTabKey);
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
  // 모드 변경 시 색상 즉시 업데이트
  updateTimerSector();

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

  // 테마 토글 버튼 클릭 핸들러
  uiElements.themeToggle?.addEventListener('click', () => {
    toggleTheme();
  });

  // 설정 열기 버튼 클릭 핸들러
  uiElements.settingsBtn?.addEventListener('click', () => {
    openSettingsPanel();
  });

  // 설정 닫기 버튼 클릭 핸들러 (× 버튼)
  uiElements.settingsCloseBtn?.addEventListener('click', () => {
    closeSettingsPanel();
  });

  // 설정 저장 버튼 클릭 핸들러
  uiElements.settingsSaveBtn?.addEventListener('click', () => {
    saveSettings();
  });

  // 설정 취소 버튼 클릭 핸들러
  uiElements.settingsCancelBtn?.addEventListener('click', () => {
    closeSettingsPanel();
  });

  // 모달 오버레이 클릭 시 닫기
  uiElements.settingsModal?.addEventListener('click', (e) => {
    if (e.target === uiElements.settingsModal) {
      closeSettingsPanel();
    }
  });

  // ESC 키로 모달 닫기
  document.addEventListener('keydown', (e) => {
    if (
      e.key === 'Escape' &&
      uiElements.settingsModal?.classList.contains('modal-overlay--active')
    ) {
      closeSettingsPanel();
    }
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
        // 모드 변경 시 세션 레이블 즉시 업데이트
        updateSessionLabel(appState.timer.currentMode);
        // 모드 변경 시 색상 즉시 업데이트
        updateTimerSector();
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

  // 테마 초기화
  const savedTheme = StorageManager.loadTheme();
  applyTheme(savedTheme);
  setupSystemThemeDetection();

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

  // 초기 시간 및 세션 레이블 표시
  updateTimeDisplay(appState.timer.getFormattedTime());
  updateSessionLabel(appState.timer.currentMode);

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
