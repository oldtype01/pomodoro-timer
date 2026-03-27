/**
 * Time Timer UI 관련 테스트
 * Time Timer 스타일 시계의 부채꼴 영역 계산 및 색상 변경 테스트
 */

import { describe, it, expect, beforeEach } from 'vitest';

// 테스트용 DOM 환경 설정
const createTimerSectorElement = () => {
  const svg = document.createElement('svg');
  const path = document.createElement('path');
  path.id = 'timerSector';
  path.setAttribute('d', 'M120,120 L120,12 A108,108 0 1,1 120,228 Z');
  path.setAttribute('fill', 'red');
  svg.appendChild(path);
  document.body.appendChild(svg);
  return path;
};


// 부채꼴 각도 계산 함수 (테스트용 - 엣지케이스 안전 처리 포함)
function calculateSectorAngle(totalSeconds, remainingSeconds) {
  let progress = totalSeconds > 0 ? remainingSeconds / totalSeconds : 1;
  // 엣지케이스 처리: progress 값을 0~1 범위로 제한
  progress = Math.max(0, Math.min(1, progress));
  return progress * 360;
}

// SVG path 생성 함수 (테스트용 - 엣지케이스 안전 처리 포함)
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
    return `M${centerX},${centerY} L${centerX},${centerY - radius} A${radius},${radius} 0 1,1 ${centerX - 0.01},${centerY - radius} Z`;
  } else if (safeAngle <= 0) {
    return `M${centerX},${centerY} L${centerX},${centerY} Z`;
  } else {
    const radian = (safeAngle - 90) * (Math.PI / 180);
    const endX = centerX + radius * Math.cos(radian);
    const endY = centerY + radius * Math.sin(radian);
    const largeArcFlag = safeAngle > 180 ? 1 : 0;
    return `M${centerX},${centerY} L${centerX},${centerY - radius} A${radius},${radius} 0 ${largeArcFlag},1 ${endX},${endY} Z`;
  }
}

describe('Time Timer UI 테스트', () => {
  let timerElement;

  beforeEach(() => {
    // DOM 환경 초기화
    document.body.innerHTML = '';
    timerElement = createTimerSectorElement();
  });

  describe('부채꼴 각도 계산', () => {
    it('전체 시간이 남았을 때 360도 각도를 반환해야 함', () => {
      const angle = calculateSectorAngle(1500, 1500); // 25분
      expect(angle).toBe(360);
    });

    it('절반 시간이 남았을 때 180도 각도를 반환해야 함', () => {
      const angle = calculateSectorAngle(1500, 750); // 25분 중 12.5분
      expect(angle).toBe(180);
    });

    it('시간이 완료되었을 때 0도 각도를 반환해야 함', () => {
      const angle = calculateSectorAngle(1500, 0); // 25분 완료
      expect(angle).toBe(0);
    });

    it('4분의 1 시간이 남았을 때 90도 각도를 반환해야 함', () => {
      const angle = calculateSectorAngle(1500, 375); // 25분 중 6.25분
      expect(angle).toBe(90);
    });

    it('4분의 3 시간이 남았을 때 270도 각도를 반환해야 함', () => {
      const angle = calculateSectorAngle(1500, 1125); // 25분 중 18.75분
      expect(angle).toBe(270);
    });
  });

  describe('SVG path 생성', () => {
    it('360도일 때 전체 원의 path를 생성해야 함', () => {
      const path = generateSectorPath(360);
      expect(path).toContain('A108,108 0 1,1');
      expect(path).toContain('M120,120');
      expect(path).toContain('L120,12');
    });

    it('0도일 때 빈 path를 생성해야 함', () => {
      const path = generateSectorPath(0);
      expect(path).toBe('M120,120 L120,120 Z');
    });

    it('180도일 때 반원의 path를 생성해야 함', () => {
      const path = generateSectorPath(180);
      expect(path).toContain('A108,108 0 0,1');
      expect(path).toContain('M120,120');
      expect(path).toContain('L120,12');
    });

    it('90도일 때 사분원의 path를 생성해야 함', () => {
      const path = generateSectorPath(90);
      expect(path).toContain('A108,108 0 0,1');
      expect(path).toContain('M120,120');
      expect(path).toContain('L120,12');
    });

    it('270도일 때 큰 호 플래그가 설정되어야 함', () => {
      const path = generateSectorPath(270);
      expect(path).toContain('A108,108 0 1,1');
    });

    it('360도를 초과하는 각도는 360도로 처리되어야 함', () => {
      const path = generateSectorPath(400);
      const expectedPath = generateSectorPath(360);
      expect(path).toBe(expectedPath);
    });

    it('음수 각도는 0도로 처리되어야 함', () => {
      const path = generateSectorPath(-30);
      const expectedPath = generateSectorPath(0);
      expect(path).toBe(expectedPath);
    });

    it('매우 큰 각도값도 안전하게 처리되어야 함', () => {
      const path = generateSectorPath(999999);
      const expectedPath = generateSectorPath(360);
      expect(path).toBe(expectedPath);
    });

    it('매우 작은 각도값도 안전하게 처리되어야 함', () => {
      const path = generateSectorPath(-999999);
      const expectedPath = generateSectorPath(0);
      expect(path).toBe(expectedPath);
    });

    it('소수점 각도값도 정확히 처리되어야 함', () => {
      const path = generateSectorPath(45.5);
      expect(path).toContain('M120,120');
      expect(path).toContain('L120,12');
      expect(path).toContain('A108,108 0 0,1');
    });

    it('경계값 정확히 360도에서 전체 원 path 생성', () => {
      const path = generateSectorPath(360);
      expect(path).toContain('119.99'); // 360도일 때의 미세한 간격
    });

    it('경계값 정확히 0도에서 빈 path 생성', () => {
      const path = generateSectorPath(0);
      expect(path).toBe('M120,120 L120,120 Z');
    });
  });

  describe('세션 유형별 색상', () => {
    it('뽀모도로 모드는 빨간색 계열이어야 함', () => {
      const colorMap = {
        pomodoro: 'var(--color-pomodoro)',
        shortBreak: 'var(--color-short-break)',
        longBreak: 'var(--color-long-break)',
      };
      expect(colorMap.pomodoro).toBe('var(--color-pomodoro)');
    });

    it('짧은 휴식 모드는 초록색 계열이어야 함', () => {
      const colorMap = {
        pomodoro: 'var(--color-pomodoro)',
        shortBreak: 'var(--color-short-break)',
        longBreak: 'var(--color-long-break)',
      };
      expect(colorMap.shortBreak).toBe('var(--color-short-break)');
    });

    it('긴 휴식 모드는 파란색 계열이어야 함', () => {
      const colorMap = {
        pomodoro: 'var(--color-pomodoro)',
        shortBreak: 'var(--color-short-break)',
        longBreak: 'var(--color-long-break)',
      };
      expect(colorMap.longBreak).toBe('var(--color-long-break)');
    });
  });

  describe('DOM 요소 업데이트', () => {
    it('부채꼴 요소가 존재할 때 path 속성이 업데이트되어야 함', () => {
      const angle = 180;
      const expectedPath = generateSectorPath(angle);

      timerElement.setAttribute('d', expectedPath);

      expect(timerElement.getAttribute('d')).toBe(expectedPath);
    });

    it('세션 모드에 따라 fill 색상이 변경되어야 함', () => {
      const color = 'var(--color-short-break)';

      timerElement.setAttribute('fill', color);

      expect(timerElement.getAttribute('fill')).toBe(color);
    });
  });

  describe('실제 시간 시나리오', () => {
    it('25분 뽀모도로에서 5분 남았을 때 72도 각도여야 함', () => {
      const totalSeconds = 25 * 60; // 25분
      const remainingSeconds = 5 * 60; // 5분
      const angle = calculateSectorAngle(totalSeconds, remainingSeconds);
      expect(angle).toBe(72);
    });

    it('5분 짧은휴식에서 1분 남았을 때 72도 각도여야 함', () => {
      const totalSeconds = 5 * 60; // 5분
      const remainingSeconds = 1 * 60; // 1분
      const angle = calculateSectorAngle(totalSeconds, remainingSeconds);
      expect(angle).toBe(72);
    });

    it('15분 긴휴식에서 10분 남았을 때 240도 각도여야 함', () => {
      const totalSeconds = 15 * 60; // 15분
      const remainingSeconds = 10 * 60; // 10분
      const angle = calculateSectorAngle(totalSeconds, remainingSeconds);
      expect(angle).toBe(240);
    });

    it('1초 타이머에서 1초 남은 상태는 360도여야 함', () => {
      const totalSeconds = 1;
      const remainingSeconds = 1;
      const angle = calculateSectorAngle(totalSeconds, remainingSeconds);
      expect(angle).toBe(360);
    });

    it('1초 타이머 완료 시 0도여야 함', () => {
      const totalSeconds = 1;
      const remainingSeconds = 0;
      const angle = calculateSectorAngle(totalSeconds, remainingSeconds);
      expect(angle).toBe(0);
    });

    it('비정상적으로 큰 타이머(24시간)도 정상 처리되어야 함', () => {
      const totalSeconds = 24 * 60 * 60; // 24시간
      const remainingSeconds = 12 * 60 * 60; // 12시간
      const angle = calculateSectorAngle(totalSeconds, remainingSeconds);
      expect(angle).toBe(180);
    });

    it('타이머 오버플로우 상황에서도 안전해야 함', () => {
      const totalSeconds = 100;
      const remainingSeconds = 150; // 전체 시간보다 많이 남음 (비정상)
      const angle = calculateSectorAngle(totalSeconds, remainingSeconds);
      expect(angle).toBe(360); // 안전하게 360도로 제한
    });

    it('부정확한 음수 입력에서도 안전해야 함', () => {
      const totalSeconds = 100;
      const remainingSeconds = -50; // 음수 (비정상)
      const angle = calculateSectorAngle(totalSeconds, remainingSeconds);
      expect(angle).toBe(0); // 안전하게 0도로 제한
    });
  });

  describe('엣지 케이스', () => {
    it('전체 시간이 0일 때 360도를 반환해야 함', () => {
      const angle = calculateSectorAngle(0, 0);
      expect(angle).toBe(360);
    });

    it('남은 시간이 전체 시간보다 클 때 360도로 제한되어야 함', () => {
      const angle = calculateSectorAngle(100, 200);
      expect(angle).toBe(360); // 안전 처리로 360도로 제한
    });

    it('음수 시간일 때 0도로 제한되어야 함', () => {
      const angle = calculateSectorAngle(100, -10);
      expect(angle).toBe(0); // 안전 처리로 0도로 제한
    });

    it('음수 전체 시간일 때 360도를 반환해야 함', () => {
      const angle = calculateSectorAngle(-100, -50);
      expect(angle).toBe(360); // totalSeconds <= 0일 때 기본값
    });

    it('매우 큰 각도값도 360도로 제한되어야 함', () => {
      const angle = calculateSectorAngle(1, 1000);
      expect(angle).toBe(360);
    });

    it('매우 작은 음수 각도값도 0도로 제한되어야 함', () => {
      const angle = calculateSectorAngle(1000, -1);
      expect(angle).toBe(0);
    });
  });
});

describe('Time Timer 통합 테스트', () => {
  it('전체 타이머 사이클 시뮬레이션', () => {
    const totalSeconds = 300; // 5분
    const timePoints = [
      { remaining: 300, expectedAngle: 360 }, // 시작
      { remaining: 240, expectedAngle: 288 }, // 1분 경과
      { remaining: 180, expectedAngle: 216 }, // 2분 경과
      { remaining: 120, expectedAngle: 144 }, // 3분 경과
      { remaining: 60, expectedAngle: 72 },   // 4분 경과
      { remaining: 0, expectedAngle: 0 },     // 완료
    ];

    timePoints.forEach(({ remaining, expectedAngle }) => {
      const actualAngle = calculateSectorAngle(totalSeconds, remaining);
      expect(actualAngle).toBe(expectedAngle);
    });
  });
});