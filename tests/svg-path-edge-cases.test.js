/**
 * SVG Path 생성 엣지케이스 전용 테스트
 * Time Timer 부채꼴 경계값 및 예외 상황 처리 검증
 */

import { describe, it, expect } from 'vitest';

// generateSectorPath 함수 (app.js와 동일한 구현)
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

describe('SVG Path 생성 엣지케이스', () => {
  describe('경계값 테스트', () => {
    it('정확히 0도에서 빈 path를 생성해야 함', () => {
      const path = generateSectorPath(0);
      expect(path).toBe('M120,120 L120,120 Z');
    });

    it('정확히 360도에서 전체 원 path를 생성해야 함', () => {
      const path = generateSectorPath(360);
      expect(path).toContain('M120,120 L120,12 A108,108 0 1,1 119.99,12 Z');
    });

    it('정확히 180도에서 반원 path를 생성하고 작은 호 플래그 사용', () => {
      const path = generateSectorPath(180);
      expect(path).toContain('A108,108 0 0,1');
    });

    it('180.1도에서 큰 호 플래그로 전환되어야 함', () => {
      const path = generateSectorPath(180.1);
      expect(path).toContain('A108,108 0 1,1');
    });

    it('179.9도에서 작은 호 플래그를 유지해야 함', () => {
      const path = generateSectorPath(179.9);
      expect(path).toContain('A108,108 0 0,1');
    });
  });

  describe('범위 초과값 처리', () => {
    it('361도는 360도로 제한되어야 함', () => {
      const path361 = generateSectorPath(361);
      const path360 = generateSectorPath(360);
      expect(path361).toBe(path360);
    });

    it('720도(2바퀴)는 360도로 제한되어야 함', () => {
      const path720 = generateSectorPath(720);
      const path360 = generateSectorPath(360);
      expect(path720).toBe(path360);
    });

    it('1000도는 360도로 제한되어야 함', () => {
      const path1000 = generateSectorPath(1000);
      const path360 = generateSectorPath(360);
      expect(path1000).toBe(path360);
    });

    it('Infinity는 360도로 제한되어야 함', () => {
      const pathInf = generateSectorPath(Infinity);
      const path360 = generateSectorPath(360);
      expect(pathInf).toBe(path360);
    });
  });

  describe('음수값 처리', () => {
    it('-1도는 0도로 제한되어야 함', () => {
      const pathNeg1 = generateSectorPath(-1);
      const path0 = generateSectorPath(0);
      expect(pathNeg1).toBe(path0);
    });

    it('-180도는 0도로 제한되어야 함', () => {
      const pathNeg180 = generateSectorPath(-180);
      const path0 = generateSectorPath(0);
      expect(pathNeg180).toBe(path0);
    });

    it('-Infinity는 0도로 제한되어야 함', () => {
      const pathNegInf = generateSectorPath(-Infinity);
      const path0 = generateSectorPath(0);
      expect(pathNegInf).toBe(path0);
    });
  });

  describe('특수값 처리', () => {
    it('NaN은 0도로 처리되어야 함', () => {
      const pathNaN = generateSectorPath(NaN);
      const path0 = generateSectorPath(0);
      expect(pathNaN).toBe(path0);
    });

    it('undefined는 0도로 처리되어야 함', () => {
      const pathUndef = generateSectorPath(undefined);
      const path0 = generateSectorPath(0);
      expect(pathUndef).toBe(path0);
    });

    it('null은 0도로 처리되어야 함', () => {
      const pathNull = generateSectorPath(null);
      const path0 = generateSectorPath(0);
      expect(pathNull).toBe(path0);
    });
  });

  describe('소수점 정밀도', () => {
    it('소수점 각도값이 정확히 처리되어야 함', () => {
      const path = generateSectorPath(45.5);
      expect(path).toContain('M120,120');
      expect(path).toContain('L120,12');
      expect(path).toContain('A108,108 0 0,1');
    });

    it('매우 작은 소수점 각도도 처리되어야 함', () => {
      const path = generateSectorPath(0.1);
      expect(path).toContain('M120,120');
      expect(path).toContain('L120,12');
      expect(path).not.toBe('M120,120 L120,120 Z');
    });

    it('359.9도는 여전히 큰 호 플래그를 사용해야 함', () => {
      const path = generateSectorPath(359.9);
      expect(path).toContain('A108,108 0 1,1');
    });
  });

  describe('수학적 정확성', () => {
    it('90도일 때 끝점이 정확히 3시 방향이어야 함', () => {
      const path = generateSectorPath(90);
      // 90도에서 endX = 120 + 108 = 228, endY = 120 + 0 = 120
      expect(path).toContain('228,120');
    });

    it('180도일 때 끝점이 정확히 6시 방향이어야 함', () => {
      const path = generateSectorPath(180);
      // 180도에서 endX = 120 + 0 = 120, endY = 120 + 108 = 228
      expect(path).toContain('120,228');
    });

    it('270도일 때 끝점이 정확히 9시 방향이어야 함', () => {
      const path = generateSectorPath(270);
      // 270도에서 endX = 120 - 108 = 12, endY = 120 + 0 = 120
      expect(path).toContain('12,120');
    });

    it('모든 path는 중심점에서 시작해야 함', () => {
      const angles = [0, 45, 90, 135, 180, 225, 270, 315, 360];
      angles.forEach(angle => {
        const path = generateSectorPath(angle);
        expect(path).toMatch(/^M120,120/);
      });
    });

    it('0도가 아닌 모든 path는 12시 방향으로 첫 번째 선분을 그어야 함', () => {
      const angles = [1, 45, 90, 135, 180, 225, 270, 315, 359, 360];
      angles.forEach(angle => {
        const path = generateSectorPath(angle);
        expect(path).toContain('L120,12');
      });
    });
  });
});

describe('SVG Path 생성 성능 및 안정성', () => {
  it('대량의 각도 계산이 안정적이어야 함', () => {
    expect(() => {
      for (let i = 0; i <= 360; i++) {
        generateSectorPath(i);
      }
    }).not.toThrow();
  });

  it('랜덤한 각도값들이 안전하게 처리되어야 함', () => {
    const testAngles = Array.from({ length: 100 }, () => Math.random() * 1000 - 500);

    expect(() => {
      testAngles.forEach(angle => {
        const path = generateSectorPath(angle);
        expect(typeof path).toBe('string');
        expect(path.length).toBeGreaterThan(0);
      });
    }).not.toThrow();
  });

  it('생성된 path 문자열이 유효한 SVG 형식이어야 함', () => {
    const testAngles = [0, 45, 90, 135, 180, 225, 270, 315, 360];

    testAngles.forEach(angle => {
      const path = generateSectorPath(angle);

      // 기본 SVG path 명령어 검증
      expect(path).toMatch(/^M\d+(\.\d+)?,\d+(\.\d+)?/); // M으로 시작
      expect(path).toMatch(/Z$/); // Z로 종료

      // 0도가 아닌 경우 L과 A 명령어 포함
      if (angle > 0) {
        expect(path).toContain('L');
        expect(path).toContain('A');
      }
    });
  });
});