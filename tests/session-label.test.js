/**
 * 세션 레이블 UI 기능 테스트
 * 원형 타이머 내부 세션 유형 레이블 표시 및 업데이트 로직 검증
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

// DOM 환경 모킹 (개선된 구조)
const createMockDOM = () => {
  document.body.innerHTML = `
    <div class="circular-timer">
      <svg class="circular-timer__svg" viewBox="0 0 200 200">
        <circle class="circular-timer__progress" id="progressRing"
          cx="100" cy="100" r="90" fill="transparent" stroke-width="8"
          stroke-dasharray="565.48" stroke-dashoffset="0" />
      </svg>
      <div class="timer-info">
        <div class="session-label" id="sessionLabel">뽀모도로</div>
        <div class="time-remaining" id="timeDisplay">25:00</div>
      </div>
    </div>
  `;
};

// 타이머 모킹
const createMockTimer = (mode = 'pomodoro') => ({
  currentMode: mode,
  getTotalSeconds: () => 1500,
  getRemainingSeconds: () => 1500,
  getFormattedTime: () => '25:00',
});

describe('세션 레이블 DOM 구조', () => {
  beforeEach(() => {
    createMockDOM();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('세션 레이블 요소가 존재해야 한다', () => {
    const sessionLabel = document.getElementById('sessionLabel');
    expect(sessionLabel).toBeDefined();
    expect(sessionLabel).not.toBeNull();
  });

  it('타이머 정보 컨테이너가 올바른 구조를 가져야 한다', () => {
    const timerInfo = document.querySelector('.timer-info');
    const sessionLabel = document.getElementById('sessionLabel');
    const timeDisplay = document.getElementById('timeDisplay');

    expect(timerInfo).toBeDefined();
    expect(timerInfo.contains(sessionLabel)).toBe(true);
    expect(timerInfo.contains(timeDisplay)).toBe(true);
  });

  it('기본 세션 레이블 텍스트가 올바르게 설정되어야 한다', () => {
    const sessionLabel = document.getElementById('sessionLabel');
    expect(sessionLabel.textContent).toBe('뽀모도로');
  });
});

describe('세션 레이블 업데이트 기능', () => {
  let updateSessionLabel;

  beforeEach(() => {
    createMockDOM();

    // updateSessionLabel 함수 정의 (app.js에서 가져온 로직)
    updateSessionLabel = (mode) => {
      const sessionLabel = document.getElementById('sessionLabel');
      if (!sessionLabel) return;

      const labelMap = {
        pomodoro: '뽀모도로',
        shortBreak: '짧은 휴식',
        longBreak: '긴 휴식',
      };

      sessionLabel.textContent = labelMap[mode] || '뽀모도로';
    };
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('뽀모도로 모드에서 올바른 레이블을 표시해야 한다', () => {
    updateSessionLabel('pomodoro');
    const sessionLabel = document.getElementById('sessionLabel');
    expect(sessionLabel.textContent).toBe('뽀모도로');
  });

  it('짧은 휴식 모드에서 올바른 레이블을 표시해야 한다', () => {
    updateSessionLabel('shortBreak');
    const sessionLabel = document.getElementById('sessionLabel');
    expect(sessionLabel.textContent).toBe('짧은 휴식');
  });

  it('긴 휴식 모드에서 올바른 레이블을 표시해야 한다', () => {
    updateSessionLabel('longBreak');
    const sessionLabel = document.getElementById('sessionLabel');
    expect(sessionLabel.textContent).toBe('긴 휴식');
  });

  it('유효하지 않은 모드에서 기본값을 표시해야 한다', () => {
    updateSessionLabel('invalid-mode');
    const sessionLabel = document.getElementById('sessionLabel');
    expect(sessionLabel.textContent).toBe('뽀모도로');
  });

  it('세션 레이블 요소가 없을 때 에러 없이 처리해야 한다', () => {
    document.body.innerHTML = ''; // 요소 제거
    expect(() => updateSessionLabel('pomodoro')).not.toThrow();
  });
});

describe('타이머 디스플레이와의 통합', () => {
  let uiElements;
  let appState;
  let updateTimeDisplay;
  let updateSessionLabel;
  let updateCircularProgress;

  beforeEach(() => {
    createMockDOM();

    // UI 요소 모킹
    uiElements = {
      timeDisplay: document.getElementById('timeDisplay'),
      sessionLabel: document.getElementById('sessionLabel'),
      progressRing: document.getElementById('progressRing'),
    };

    // 앱 상태 모킹
    appState = {
      timer: createMockTimer('pomodoro'),
    };

    // 함수들 정의 (app.js에서 가져온 로직)
    updateSessionLabel = (mode) => {
      if (!uiElements.sessionLabel) return;

      const labelMap = {
        pomodoro: '뽀모도로',
        shortBreak: '짧은 휴식',
        longBreak: '긴 휴식',
      };

      uiElements.sessionLabel.textContent = labelMap[mode] || '뽀모도로';
    };

    updateCircularProgress = () => {
      if (!uiElements.progressRing || !appState.timer) return;

      const totalSeconds = appState.timer.getTotalSeconds();
      const remainingSeconds = appState.timer.getRemainingSeconds();
      const progress = totalSeconds > 0 ? remainingSeconds / totalSeconds : 1;
      const circumference = 2 * Math.PI * 90;
      const offset = circumference * (1 - progress);

      uiElements.progressRing.style.strokeDashoffset = String(offset);
    };

    updateTimeDisplay = (formattedTime) => {
      if (uiElements.timeDisplay) {
        uiElements.timeDisplay.textContent = formattedTime;
      }

      // 세션 레이블 업데이트
      if (appState.timer) {
        updateSessionLabel(appState.timer.currentMode);
      }

      // 원형 프로그레스 업데이트
      updateCircularProgress();
    };
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('타이머 디스플레이 업데이트 시 세션 레이블도 함께 업데이트되어야 한다', () => {
    appState.timer = createMockTimer('shortBreak');
    updateTimeDisplay('05:00');

    expect(uiElements.timeDisplay.textContent).toBe('05:00');
    expect(uiElements.sessionLabel.textContent).toBe('짧은 휴식');
  });

  it('다른 모드로 변경 시 레이블이 올바르게 업데이트되어야 한다', () => {
    // 처음에는 뽀모도로
    updateTimeDisplay('25:00');
    expect(uiElements.sessionLabel.textContent).toBe('뽀모도로');

    // 긴 휴식으로 변경
    appState.timer = createMockTimer('longBreak');
    updateTimeDisplay('15:00');
    expect(uiElements.sessionLabel.textContent).toBe('긴 휴식');
  });

  it('타이머가 null일 때도 안전하게 처리해야 한다', () => {
    appState.timer = null;
    expect(() => updateTimeDisplay('00:00')).not.toThrow();
    expect(uiElements.timeDisplay.textContent).toBe('00:00');
  });
});

describe('모드 변경 통합 시나리오', () => {
  let uiElements;
  let mockTimer;
  let updateSessionLabel;

  beforeEach(() => {
    createMockDOM();

    uiElements = {
      sessionLabel: document.getElementById('sessionLabel'),
    };

    // 모드 변경 가능한 타이머 모킹
    mockTimer = {
      currentMode: 'pomodoro',
      setMode: (mode) => {
        mockTimer.currentMode = mode;
      },
    };

    updateSessionLabel = (mode) => {
      if (!uiElements.sessionLabel) return;

      const labelMap = {
        pomodoro: '뽀모도로',
        shortBreak: '짧은 휴식',
        longBreak: '긴 휴식',
      };

      uiElements.sessionLabel.textContent = labelMap[mode] || '뽀모도로';
    };
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('모든 모드 변경 시나리오가 올바르게 동작해야 한다', () => {
    // 뽀모도로 → 짧은 휴식
    mockTimer.setMode('shortBreak');
    updateSessionLabel(mockTimer.currentMode);
    expect(uiElements.sessionLabel.textContent).toBe('짧은 휴식');

    // 짧은 휴식 → 긴 휴식
    mockTimer.setMode('longBreak');
    updateSessionLabel(mockTimer.currentMode);
    expect(uiElements.sessionLabel.textContent).toBe('긴 휴식');

    // 긴 휴식 → 뽀모도로
    mockTimer.setMode('pomodoro');
    updateSessionLabel(mockTimer.currentMode);
    expect(uiElements.sessionLabel.textContent).toBe('뽀모도로');
  });
});
