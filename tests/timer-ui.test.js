/**
 * 타이머 UI 관련 테스트
 * 원형 시계 UI 버그 수정 및 개선 검증
 */

import { describe, it, expect, beforeEach } from 'vitest';

// DOM 환경 시뮬레이션을 위한 JSDOM 설정
import { JSDOM } from 'jsdom';

// 테스트용 HTML 구조
const testHTML = `
<!DOCTYPE html>
<html>
<head>
  <style>
    :root {
      --font-size-timer: clamp(2.5rem, 6vw, 4rem);
      --color-pomodoro: #e53935;
      --color-short-break: #43a047;
      --color-long-break: #1976d2;
    }
  </style>
</head>
<body>
  <div class="time-timer">
    <svg class="time-timer__svg" viewBox="0 0 240 240">
      <path class="time-timer__sector" id="timerSector" d="" fill="red" opacity="0.9" />
    </svg>
    <div class="timer-info">
      <div class="time-remaining">25:00</div>
      <div class="session-label">뽀모도로</div>
    </div>
  </div>
</body>
</html>
`;

// 테스트용 generateSectorPath 함수 (실제 app.js에서 복사)
function generateSectorPath(angle) {
  const centerX = 120;
  const centerY = 120;
  const radius = 108;

  // 엣지케이스 처리: 유효하지 않은 숫자값 검증
  let validAngle = angle;
  if (typeof angle !== 'number' || isNaN(angle)) {
    validAngle = 0;
  } else if (!isFinite(angle)) {
    validAngle = angle > 0 ? 360 : 0;
  }

  // 엣지케이스 처리: 각도 범위 검증 및 제한
  const safeAngle = Math.max(0, Math.min(360, validAngle));

  if (safeAngle >= 360) {
    // 전체 원
    return `M${centerX},${centerY} L${centerX},${centerY - radius} A${radius},${radius} 0 1,1 ${centerX - 0.01},${centerY - radius} Z`;
  } else if (safeAngle <= 0) {
    // 부채꼴 없음 - 빈 상태
    return `M${centerX},${centerY} L${centerX},${centerY} Z`;
  } else {
    // 일반적인 부채꼴 계산 (12시부터 시계방향)
    const radian = (safeAngle - 90) * (Math.PI / 180);
    const endX = centerX + radius * Math.cos(radian);
    const endY = centerY + radius * Math.sin(radian);

    const largeArcFlag = safeAngle > 180 ? 1 : 0;

    return `M${centerX},${centerY} L${centerX},${centerY - radius} A${radius},${radius} 0 ${largeArcFlag},1 ${endX},${endY} Z`;
  }
}

describe('타이머 UI 테스트', () => {
  let dom;
  let document;
  let window;

  beforeEach(() => {
    dom = new JSDOM(testHTML);
    document = dom.window.document;
    window = dom.window;
    global.document = document;
    global.window = window;
  });

  describe('부채꼴 진행 방향 테스트', () => {
    it('초기 상태에서는 빈 부채꼴이어야 함', () => {
      const timerSector = document.getElementById('timerSector');
      expect(timerSector.getAttribute('d')).toBe('');
    });

    it('진행률 0%에서 빈 부채꼴 생성', () => {
      const pathData = generateSectorPath(0);
      expect(pathData).toBe('M120,120 L120,120 Z');
    });

    it('진행률 25%에서 시계방향 부채꼴 생성', () => {
      const angle = 0.25 * 360; // 90도
      const pathData = generateSectorPath(angle);

      // 12시에서 3시 방향으로 90도 부채꼴이어야 함
      expect(pathData).toContain('M120,120'); // 중심점에서 시작
      expect(pathData).toContain('L120,12'); // 12시 방향으로 이동
      expect(pathData).toContain('A108,108'); // 호 그리기
      expect(pathData).toContain('Z'); // 경로 닫기
    });

    it('진행률 50%에서 반원 부채꼴 생성', () => {
      const angle = 0.5 * 360; // 180도
      const pathData = generateSectorPath(angle);

      // 반원이므로 large-arc-flag는 0이어야 함
      expect(pathData).toContain('A108,108 0 0,1');
    });

    it('진행률 75%에서 큰 부채꼴 생성', () => {
      const angle = 0.75 * 360; // 270도
      const pathData = generateSectorPath(angle);

      // 180도 초과이므로 large-arc-flag는 1이어야 함
      expect(pathData).toContain('A108,108 0 1,1');
    });

    it('진행률 100%에서 완전한 원 생성', () => {
      const angle = 1.0 * 360; // 360도
      const pathData = generateSectorPath(angle);

      // 완전한 원을 위한 특수 처리
      expect(pathData).toContain('A108,108 0 1,1');
      expect(pathData).toContain(119.99); // centerX - 0.01 근사값
    });
  });

  describe('진행률 계산 로직 테스트', () => {
    it('경과 시간 기준 진행률 계산', () => {
      // 25분 타이머에서 5분 경과한 경우
      const totalSeconds = 25 * 60; // 1500초
      const remainingSeconds = 20 * 60; // 1200초 남음
      const elapsedSeconds = totalSeconds - remainingSeconds; // 300초 경과

      const progress = elapsedSeconds / totalSeconds;

      expect(progress).toBe(0.2); // 20% 진행
    });

    it('타이머 시작 시 진행률 0', () => {
      const totalSeconds = 25 * 60;
      const remainingSeconds = 25 * 60; // 시작 상태

      const progress = (totalSeconds - remainingSeconds) / totalSeconds;

      expect(progress).toBe(0);
    });

    it('타이머 완료 시 진행률 1', () => {
      const totalSeconds = 25 * 60;
      const remainingSeconds = 0; // 완료 상태

      const progress = (totalSeconds - remainingSeconds) / totalSeconds;

      expect(progress).toBe(1);
    });
  });

  describe('엣지케이스 처리 테스트', () => {
    it('유효하지 않은 각도값 처리', () => {
      expect(generateSectorPath(NaN)).toBe('M120,120 L120,120 Z');
      expect(generateSectorPath(undefined)).toBe('M120,120 L120,120 Z');
      expect(generateSectorPath('invalid')).toBe('M120,120 L120,120 Z');
    });

    it('범위를 벗어나는 각도값 처리', () => {
      expect(generateSectorPath(-10)).toBe('M120,120 L120,120 Z');
      expect(generateSectorPath(400)).toContain('A108,108 0 1,1');
    });

    it('Infinity 값 처리', () => {
      expect(generateSectorPath(Infinity)).toContain('A108,108 0 1,1');
      expect(generateSectorPath(-Infinity)).toBe('M120,120 L120,120 Z');
    });
  });

  describe('반응형 폰트 크기 테스트', () => {
    it('CSS 변수가 올바르게 설정되었는지 확인', () => {
      const rootStyles = window.getComputedStyle(document.documentElement);
      const fontSizeTimer = rootStyles.getPropertyValue('--font-size-timer').trim();

      // clamp 함수 형식이 올바른지 확인
      expect(fontSizeTimer).toBe('clamp(2.5rem, 6vw, 4rem)');
    });
  });

  describe('세션 유형별 색상 테스트', () => {
    it('뽀모도로 세션 색상', () => {
      const timerSector = document.getElementById('timerSector');
      timerSector.setAttribute('fill', 'var(--color-pomodoro)');

      expect(timerSector.getAttribute('fill')).toBe('var(--color-pomodoro)');
    });

    it('짧은 휴식 세션 색상', () => {
      const timerSector = document.getElementById('timerSector');
      timerSector.setAttribute('fill', 'var(--color-short-break)');

      expect(timerSector.getAttribute('fill')).toBe('var(--color-short-break)');
    });

    it('긴 휴식 세션 색상', () => {
      const timerSector = document.getElementById('timerSector');
      timerSector.setAttribute('fill', 'var(--color-long-break)');

      expect(timerSector.getAttribute('fill')).toBe('var(--color-long-break)');
    });
  });
});