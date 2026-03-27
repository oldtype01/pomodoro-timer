/**
 * 설정 기능 통합 테스트
 * Timer.updateDurations() 동작 및 설정값 유효성 검증
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Timer } from '../src/js/timer.js';

// 유효성 검증 함수 (app.js와 동일 로직 - 독립 테스트를 위해 인라인 정의)
function isValidDurationValue(value) {
  return Number.isInteger(value) && value >= 1 && value <= 99;
}

describe('Timer.updateDurations()', () => {
  let timer;
  let mockStorage;

  // 각 테스트 전 새 타이머 인스턴스 생성
  beforeEach(() => {
    // 가짜 타이머 사용 (실제 시간 대기 방지)
    vi.useFakeTimers();

    // 모킹된 스토리지 매니저
    mockStorage = {
      saveTimerState: vi.fn(),
      loadTimerState: vi.fn().mockReturnValue(null),
      clearTimerState: vi.fn(),
    };

    // 테스트 환경 변수 설정
    process.env.NODE_ENV = 'test';

    // 기본 설정으로 타이머 생성
    timer = new Timer({
      pomodoro: 25,
      shortBreak: 5,
      longBreak: 15,
      storage: mockStorage,
    });
  });

  // 각 테스트 후 타이머 정리
  afterEach(() => {
    timer.stop();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // ===== durations 업데이트 확인 =====
  describe('durations 객체 업데이트', () => {
    it('updateDurations() 호출 후 durations 값이 올바르게 업데이트되어야 한다', () => {
      const newDurations = { pomodoro: 30, shortBreak: 10, longBreak: 20 };
      timer.updateDurations(newDurations);

      expect(timer.durations.pomodoro).toBe(30);
      expect(timer.durations.shortBreak).toBe(10);
      expect(timer.durations.longBreak).toBe(20);
    });

    it('일부 키만 제공해도 해당 키만 업데이트되어야 한다', () => {
      timer.updateDurations({ pomodoro: 40 });

      expect(timer.durations.pomodoro).toBe(40);
      // 다른 키는 원래 값 유지
      expect(timer.durations.shortBreak).toBe(5);
      expect(timer.durations.longBreak).toBe(15);
    });

    it('유효하지 않은 인자(null)를 전달해도 에러 없이 처리되어야 한다', () => {
      // 에러를 던지지 않고 조용히 반환해야 함
      expect(() => timer.updateDurations(null)).not.toThrow();
      // 원래 durations 유지
      expect(timer.durations.pomodoro).toBe(25);
    });
  });

  // ===== 정지 상태에서 remainingSeconds 즉시 갱신 =====
  describe('정지 상태에서 remainingSeconds 즉시 갱신', () => {
    it('타이머가 정지 상태이고 pomodoro 모드일 때 remainingSeconds가 즉시 갱신되어야 한다', () => {
      // 초기 상태: pomodoro 25분 = 1500초
      expect(timer.isRunning).toBe(false);
      expect(timer.remainingSeconds).toBe(1500);

      timer.updateDurations({ pomodoro: 30 });

      // 30분 = 1800초로 즉시 갱신
      expect(timer.remainingSeconds).toBe(1800);
    });

    it('shortBreak 모드에서 정지 상태일 때 해당 모드의 remainingSeconds가 갱신되어야 한다', () => {
      // shortBreak 모드로 전환
      timer.setMode('shortBreak');
      expect(timer.remainingSeconds).toBe(300); // 5분 = 300초

      timer.updateDurations({ shortBreak: 10 });

      // 10분 = 600초로 즉시 갱신
      expect(timer.remainingSeconds).toBe(600);
    });

    it('longBreak 모드에서 정지 상태일 때 해당 모드의 remainingSeconds가 갱신되어야 한다', () => {
      // longBreak 모드로 전환
      timer.setMode('longBreak');
      expect(timer.remainingSeconds).toBe(900); // 15분 = 900초

      timer.updateDurations({ longBreak: 20 });

      // 20분 = 1200초로 즉시 갱신
      expect(timer.remainingSeconds).toBe(1200);
    });
  });

  // ===== 실행 중 상태에서 remainingSeconds 유지 =====
  describe('실행 중 상태에서 remainingSeconds 유지', () => {
    it('타이머 실행 중에 updateDurations() 호출 시 remainingSeconds가 변경되지 않아야 한다', () => {
      // 타이머 시작
      timer.start();
      expect(timer.isRunning).toBe(true);

      // 시작 직후 remainingSeconds 기록
      const remainingBeforeUpdate = timer.remainingSeconds;

      // 설정 변경 시도
      timer.updateDurations({ pomodoro: 30 });

      // remainingSeconds는 변경되지 않아야 함
      expect(timer.remainingSeconds).toBe(remainingBeforeUpdate);
    });

    it('실행 중에 durations는 업데이트되지만 remainingSeconds는 유지되어야 한다', () => {
      timer.start();
      expect(timer.isRunning).toBe(true);

      const remainingBeforeUpdate = timer.remainingSeconds;
      timer.updateDurations({ pomodoro: 40 });

      // durations는 업데이트됨
      expect(timer.durations.pomodoro).toBe(40);
      // remainingSeconds는 변경 없음
      expect(timer.remainingSeconds).toBe(remainingBeforeUpdate);
    });

    it('실행 중 updateDurations 후 reset() 호출 시 새 설정값으로 갱신되어야 한다', () => {
      timer.start();
      timer.updateDurations({ pomodoro: 30 });

      // reset()으로 타이머 초기화하면 새 durations 적용
      timer.reset();
      expect(timer.isRunning).toBe(false);
      expect(timer.remainingSeconds).toBe(1800); // 30분 = 1800초
    });
  });
});

// ===== 설정값 유효성 검증 (경계값 테스트) =====
describe('설정값 유효성 검증', () => {
  it('1은 유효한 최소값이어야 한다', () => {
    expect(isValidDurationValue(1)).toBe(true);
  });

  it('99는 유효한 최대값이어야 한다', () => {
    expect(isValidDurationValue(99)).toBe(true);
  });

  it('1~99 범위 내 일반 값은 유효해야 한다', () => {
    expect(isValidDurationValue(25)).toBe(true);
    expect(isValidDurationValue(5)).toBe(true);
    expect(isValidDurationValue(50)).toBe(true);
  });

  it('0은 유효하지 않아야 한다 (최솟값 미만)', () => {
    expect(isValidDurationValue(0)).toBe(false);
  });

  it('100은 유효하지 않아야 한다 (최댓값 초과)', () => {
    expect(isValidDurationValue(100)).toBe(false);
  });

  it('음수는 유효하지 않아야 한다', () => {
    expect(isValidDurationValue(-1)).toBe(false);
    expect(isValidDurationValue(-25)).toBe(false);
  });

  it('소수점 값은 유효하지 않아야 한다', () => {
    expect(isValidDurationValue(1.5)).toBe(false);
    expect(isValidDurationValue(25.5)).toBe(false);
  });

  it('NaN은 유효하지 않아야 한다', () => {
    expect(isValidDurationValue(NaN)).toBe(false);
  });

  it('문자열은 유효하지 않아야 한다', () => {
    expect(isValidDurationValue('25')).toBe(false);
  });
});
