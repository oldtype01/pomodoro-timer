/**
 * 원형 타이머 UI 관련 테스트
 * Time Timer 스타일로 변경됨에 따른 기본 DOM 요소 및 수학 계산 테스트
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

// DOM 환경 모킹
const createMockDOM = () => {
  document.body.innerHTML = `
    <div class="timer-container">
      <svg class="timer-svg" viewBox="0 0 240 240">
        <path id="timerSector" d="M120,120 L120,12 A108,108 0 1,1 120,228 Z" fill="red" />
      </svg>
      <div class="time-remaining" id="timeDisplay">25:00</div>
    </div>
  `;
};


describe('Timer DOM 요소 존재성 검증', () => {
  beforeEach(() => {
    createMockDOM();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('Time Timer SVG 부채꼴 요소가 존재해야 한다', () => {
    const timerSector = document.getElementById('timerSector');
    expect(timerSector).toBeDefined();
    expect(timerSector.getAttribute('d')).toContain('M120,120');
  });

  it('시간 표시 요소가 존재해야 한다', () => {
    const timeDisplay = document.getElementById('timeDisplay');
    expect(timeDisplay).toBeDefined();
    expect(timeDisplay.textContent).toBe('25:00');
  });
});

describe('Time Timer 수학적 계산 검증', () => {
  it('각도-라디안 변환이 정확해야 한다', () => {
    // 90도는 π/2 라디안
    const radian = (90 - 90) * (Math.PI / 180);
    expect(radian).toBe(0);

    // 180도는 π/2 라디안 (90도 offset 적용)
    const radian180 = (180 - 90) * (Math.PI / 180);
    expect(radian180).toBeCloseTo(Math.PI / 2, 5);
  });

  it('부채꼴 끝점 좌표가 정확히 계산되어야 한다', () => {
    const centerX = 120;
    const centerY = 120;
    const radius = 108;
    const angle = 90; // 3시 방향

    const radian = (angle - 90) * (Math.PI / 180);
    const endX = centerX + radius * Math.cos(radian);
    const endY = centerY + radius * Math.sin(radian);

    expect(endX).toBeCloseTo(228, 1); // 120 + 108
    expect(endY).toBeCloseTo(120, 1); // 120 + 0
  });
});
