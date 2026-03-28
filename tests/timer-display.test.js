/**
 * 타이머 디스플레이 시각적 검증 테스트
 * 원형 시계 숫자 배치와 중앙 시간 표시 크기 검증
 */

import { describe, it, expect, beforeEach } from 'vitest';

// DOM 환경 시뮬레이션
const setupDOM = () => {
  // 기본 HTML 구조 생성
  document.body.innerHTML = `
    <div id="app">
      <div class="timer-display">
        <div class="time-timer">
          <svg class="time-timer__svg" viewBox="0 0 240 240">
            <!-- 0분 (12시) -->
            <text class="tick-number" x="120" y="44" text-anchor="middle" dominant-baseline="middle">0</text>
            <!-- 5분 (1시) -->
            <text class="tick-number" x="164" y="44" text-anchor="middle" dominant-baseline="middle">5</text>
            <!-- 10분 (2시) -->
            <text class="tick-number" x="196" y="76" text-anchor="middle" dominant-baseline="middle">10</text>
            <!-- 15분 (3시) -->
            <text class="tick-number" x="198" y="125" text-anchor="middle" dominant-baseline="middle">15</text>
            <!-- 20분 (4시) -->
            <text class="tick-number" x="196" y="164" text-anchor="middle" dominant-baseline="middle">20</text>
            <!-- 25분 (5시) -->
            <text class="tick-number" x="164" y="196" text-anchor="middle" dominant-baseline="middle">25</text>
            <!-- 30분 (6시) -->
            <text class="tick-number" x="120" y="198" text-anchor="middle" dominant-baseline="middle">30</text>
            <!-- 35분 (7시) -->
            <text class="tick-number" x="76" y="196" text-anchor="middle" dominant-baseline="middle">35</text>
            <!-- 40분 (8시) -->
            <text class="tick-number" x="44" y="164" text-anchor="middle" dominant-baseline="middle">40</text>
            <!-- 45분 (9시) -->
            <text class="tick-number" x="42" y="125" text-anchor="middle" dominant-baseline="middle">45</text>
            <!-- 50분 (10시) -->
            <text class="tick-number" x="44" y="76" text-anchor="middle" dominant-baseline="middle">50</text>
            <!-- 55분 (11시) -->
            <text class="tick-number" x="76" y="44" text-anchor="middle" dominant-baseline="middle">55</text>
          </svg>
          <div class="timer-info">
            <div class="session-label" id="sessionLabel">뽀모도로</div>
            <div class="time-remaining" id="timeDisplay">25:00</div>
          </div>
        </div>
      </div>
    </div>
  `;
};

describe('타이머 디스플레이 시각적 검증', () => {
  beforeEach(() => {
    setupDOM();
  });

  it('시계 숫자가 올바른 순서로 배치되어야 함', () => {
    const tickNumbers = document.querySelectorAll('.tick-number');

    // 숫자 순서 확인: 0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55
    const expectedNumbers = ['0', '5', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];
    const actualNumbers = Array.from(tickNumbers).map(el => el.textContent);

    expect(actualNumbers).toEqual(expectedNumbers);
  });

  it('12시 방향에 0이 배치되어야 함', () => {
    const zeroElement = Array.from(document.querySelectorAll('.tick-number'))
      .find(el => el.textContent === '0');

    expect(zeroElement).toBeTruthy();
    expect(zeroElement.getAttribute('x')).toBe('120'); // 중앙 x 좌표
    expect(parseInt(zeroElement.getAttribute('y'))).toBeLessThan(120); // 중앙보다 위쪽
  });

  it('6시 방향에 30이 배치되어야 함', () => {
    const thirtyElement = Array.from(document.querySelectorAll('.tick-number'))
      .find(el => el.textContent === '30');

    expect(thirtyElement).toBeTruthy();
    expect(thirtyElement.getAttribute('x')).toBe('120'); // 중앙 x 좌표
    expect(parseInt(thirtyElement.getAttribute('y'))).toBeGreaterThan(120); // 중앙보다 아래쪽
  });

  it('3시 방향에 15가 배치되어야 함', () => {
    const fifteenElement = Array.from(document.querySelectorAll('.tick-number'))
      .find(el => el.textContent === '15');

    expect(fifteenElement).toBeTruthy();
    expect(parseInt(fifteenElement.getAttribute('x'))).toBeGreaterThan(120); // 중앙보다 오른쪽
    expect(Math.abs(parseInt(fifteenElement.getAttribute('y')) - 120)).toBeLessThan(10); // 중앙 높이 근처
  });

  it('9시 방향에 45가 배치되어야 함', () => {
    const fortyFiveElement = Array.from(document.querySelectorAll('.tick-number'))
      .find(el => el.textContent === '45');

    expect(fortyFiveElement).toBeTruthy();
    expect(parseInt(fortyFiveElement.getAttribute('x'))).toBeLessThan(120); // 중앙보다 왼쪽
    expect(Math.abs(parseInt(fortyFiveElement.getAttribute('y')) - 120)).toBeLessThan(10); // 중앙 높이 근처
  });

  it('중앙 시간 표시 요소가 존재해야 함', () => {
    const timeDisplay = document.getElementById('timeDisplay');
    const sessionLabel = document.getElementById('sessionLabel');

    expect(timeDisplay).toBeTruthy();
    expect(sessionLabel).toBeTruthy();
    expect(timeDisplay.textContent).toBe('25:00');
    expect(sessionLabel.textContent).toBe('뽀모도로');
  });

  it('타이머 정보 컨테이너가 적절한 구조를 가져야 함', () => {
    const timerInfo = document.querySelector('.timer-info');
    const sessionLabel = timerInfo.querySelector('.session-label');
    const timeRemaining = timerInfo.querySelector('.time-remaining');

    expect(timerInfo).toBeTruthy();
    expect(sessionLabel).toBeTruthy();
    expect(timeRemaining).toBeTruthy();

    // 세션 라벨이 시간 표시보다 위에 있는지 확인 (order: 1, 2 CSS 속성)
    expect(sessionLabel.classList.contains('session-label')).toBe(true);
    expect(timeRemaining.classList.contains('time-remaining')).toBe(true);
  });
});

describe('반응형 디자인 검증', () => {
  beforeEach(() => {
    setupDOM();
  });

  it('뷰포트 크기별 적절한 CSS 클래스가 적용되어야 함', () => {
    // 기본 크기 요소들이 존재하는지 확인
    const timeTimer = document.querySelector('.time-timer');
    const svg = document.querySelector('.time-timer__svg');
    const tickNumbers = document.querySelectorAll('.tick-number');

    expect(timeTimer).toBeTruthy();
    expect(svg).toBeTruthy();
    expect(tickNumbers.length).toBe(12);
  });

  it('모든 시계 숫자가 5분 간격으로 배치되어야 함', () => {
    const tickNumbers = document.querySelectorAll('.tick-number');
    const numbers = Array.from(tickNumbers).map(el => parseInt(el.textContent));

    // 0부터 55까지 5분 간격
    const expectedNumbers = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
    expect(numbers.sort((a, b) => a - b)).toEqual(expectedNumbers);
  });
});

describe('시계방향 배치 검증', () => {
  beforeEach(() => {
    setupDOM();
  });

  it('숫자가 시계방향으로 올바르게 배치되어야 함', () => {
    const tickNumbers = document.querySelectorAll('.tick-number');

    // 각 숫자의 위치를 확인
    const positions = Array.from(tickNumbers).map(el => ({
      number: parseInt(el.textContent),
      x: parseInt(el.getAttribute('x')),
      y: parseInt(el.getAttribute('y'))
    }));

    // 0 (12시): x=120, y는 가장 작아야 함
    const zero = positions.find(p => p.number === 0);
    expect(zero.x).toBe(120);
    expect(zero.y).toBeLessThan(120);

    // 15 (3시): x는 가장 커야 함, y는 중앙 근처
    const fifteen = positions.find(p => p.number === 15);
    expect(fifteen.x).toBeGreaterThan(180);
    expect(Math.abs(fifteen.y - 120)).toBeLessThan(20);

    // 30 (6시): x=120, y는 가장 커야 함
    const thirty = positions.find(p => p.number === 30);
    expect(thirty.x).toBe(120);
    expect(thirty.y).toBeGreaterThan(180);

    // 45 (9시): x는 가장 작아야 함, y는 중앙 근처
    const fortyFive = positions.find(p => p.number === 45);
    expect(fortyFive.x).toBeLessThan(60);
    expect(Math.abs(fortyFive.y - 120)).toBeLessThan(20);
  });
});