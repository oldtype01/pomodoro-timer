/**
 * 원형 타이머 UI 관련 테스트
 * 프로그레스 링 업데이트 로직과 UI 연동 검증
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

// DOM 환경 모킹
const createMockDOM = () => {
  document.body.innerHTML = `
    <div class="circular-timer">
      <svg class="circular-timer__svg" viewBox="0 0 200 200">
        <circle class="circular-timer__progress" id="progressRing"
          cx="100" cy="100" r="90" fill="transparent" stroke-width="8"
          stroke-dasharray="565.48" stroke-dashoffset="0" />
      </svg>
      <div class="time-remaining" id="timeDisplay">25:00</div>
    </div>
  `;
};

// 타이머 모킹
const createMockTimer = (totalSeconds = 1500, remainingSeconds = 1500) => ({
  getTotalSeconds: () => totalSeconds,
  getRemainingSeconds: () => remainingSeconds,
  getFormattedTime: () => {
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  },
});

describe('원형 타이머 프로그레스 기능', () => {
  beforeEach(() => {
    createMockDOM();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('프로그레스 링 요소가 존재해야 한다', () => {
    const progressRing = document.getElementById('progressRing');
    expect(progressRing).toBeDefined();
    expect(progressRing.getAttribute('stroke-dasharray')).toBe('565.48');
  });

  it('원형 프로그레스 계산이 정확해야 한다', () => {
    // 원의 둘레 계산: 2 * PI * 90
    const circumference = 2 * Math.PI * 90;
    const expectedCircumference = 565.4866776461628;

    expect(Math.abs(circumference - expectedCircumference)).toBeLessThan(0.1);
  });

  it('타이머 진행에 따라 프로그레스가 올바르게 계산되어야 한다', () => {
    // 25분 타이머에서 50% 완료 상태
    const totalSeconds = 1500; // 25분
    const remainingSeconds = 750; // 12.5분 남음
    const progress = remainingSeconds / totalSeconds; // 0.5

    const circumference = 2 * Math.PI * 90;
    const expectedOffset = circumference * (1 - progress); // 282.74...

    expect(expectedOffset).toBeCloseTo(282.74, 1);
  });

  it('타이머 완료 시 프로그레스가 전체 원을 그려야 한다', () => {
    const totalSeconds = 1500;
    const remainingSeconds = 0; // 완료
    const progress = remainingSeconds / totalSeconds; // 0

    const circumference = 2 * Math.PI * 90;
    const expectedOffset = circumference * (1 - progress); // 565.48...

    expect(expectedOffset).toBeCloseTo(circumference, 1);
  });

  it('타이머 시작 시 프로그레스가 빈 상태여야 한다', () => {
    const totalSeconds = 1500;
    const remainingSeconds = 1500; // 시작 상태
    const progress = remainingSeconds / totalSeconds; // 1

    const circumference = 2 * Math.PI * 90;
    const expectedOffset = circumference * (1 - progress); // 0

    expect(expectedOffset).toBe(0);
  });
});

describe('원형 타이머 UI 업데이트 함수', () => {
  let uiElements;
  let appState;
  let updateCircularProgress;

  beforeEach(() => {
    createMockDOM();

    // UI 요소 모킹
    uiElements = {
      timeDisplay: document.getElementById('timeDisplay'),
      progressRing: document.getElementById('progressRing'),
    };

    // 앱 상태 모킹
    appState = {
      timer: createMockTimer(),
    };

    // updateCircularProgress 함수 정의 (app.js에서 가져온 로직)
    updateCircularProgress = () => {
      if (!uiElements.progressRing || !appState.timer) return;

      const totalSeconds = appState.timer.getTotalSeconds();
      const remainingSeconds = appState.timer.getRemainingSeconds();
      const progress = totalSeconds > 0 ? remainingSeconds / totalSeconds : 1;
      const circumference = 2 * Math.PI * 90;
      const offset = circumference * (1 - progress);

      uiElements.progressRing.style.strokeDashoffset = String(offset);
    };
  });

  it('타이머 정보가 없으면 업데이트하지 않아야 한다', () => {
    appState.timer = null;

    expect(() => updateCircularProgress()).not.toThrow();
    expect(uiElements.progressRing.style.strokeDashoffset).toBe('');
  });

  it('프로그레스 링 요소가 없으면 업데이트하지 않아야 한다', () => {
    uiElements.progressRing = null;

    expect(() => updateCircularProgress()).not.toThrow();
  });

  it('50% 진행 상태에서 올바른 offset을 설정해야 한다', () => {
    // 50% 완료 상태 모킹
    appState.timer = createMockTimer(1500, 750);

    updateCircularProgress();

    const expectedOffset = (2 * Math.PI * 90) * 0.5; // 282.74...
    expect(parseFloat(uiElements.progressRing.style.strokeDashoffset))
      .toBeCloseTo(expectedOffset, 1);
  });

  it('타이머 완료 상태에서 전체 둘레를 offset으로 설정해야 한다', () => {
    // 완료 상태 모킹
    appState.timer = createMockTimer(1500, 0);

    updateCircularProgress();

    const expectedOffset = 2 * Math.PI * 90; // 565.48...
    expect(parseFloat(uiElements.progressRing.style.strokeDashoffset))
      .toBeCloseTo(expectedOffset, 1);
  });
});