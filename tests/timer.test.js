/**
 * timer.js 단위 테스트
 * Timer 클래스의 핵심 동작 검증
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Timer } from '../src/js/timer.js';

describe('Timer 클래스', () => {
  let timer;

  // 각 테스트 전 새 타이머 인스턴스 생성
  beforeEach(() => {
    // 가짜 타이머 사용 (실제 시간 대기 방지)
    vi.useFakeTimers();
    timer = new Timer();
  });

  // 각 테스트 후 타이머 정리
  afterEach(() => {
    timer.stop();
    vi.useRealTimers();
  });

  // ===== 임포트 및 인스턴스 확인 =====
  describe('기본 임포트 및 인스턴스', () => {
    it('Timer 클래스를 정상적으로 임포트할 수 있어야 한다', () => {
      expect(Timer).toBeDefined();
    });

    it('Timer 인스턴스를 생성할 수 있어야 한다', () => {
      expect(timer).toBeInstanceOf(Timer);
    });

    it('기본 초기 상태가 올바르게 설정되어야 한다', () => {
      // 기본 모드는 pomodoro
      expect(timer.currentMode).toBe('pomodoro');
      // 초기 실행 상태는 false
      expect(timer.isRunning).toBe(false);
      // 기본 뽀모도로 시간 25분 = 1500초
      expect(timer.remainingSeconds).toBe(1500);
    });
  });

  // ===== 사용자 정의 설정 =====
  describe('사용자 정의 설정', () => {
    it('커스텀 시간 설정으로 타이머를 생성할 수 있어야 한다', () => {
      const customTimer = new Timer({ pomodoro: 10, shortBreak: 3, longBreak: 8 });
      // 10분 = 600초
      expect(customTimer.remainingSeconds).toBe(600);
    });
  });

  // ===== 시작 및 정지 =====
  describe('시작 및 정지', () => {
    it('start() 호출 후 isRunning이 true가 되어야 한다', () => {
      timer.start();
      expect(timer.isRunning).toBe(true);
    });

    it('stop() 호출 후 isRunning이 false가 되어야 한다', () => {
      timer.start();
      timer.stop();
      expect(timer.isRunning).toBe(false);
    });

    it('이미 실행 중인 타이머에 start()를 다시 호출해도 문제 없어야 한다', () => {
      timer.start();
      timer.start(); // 중복 호출
      expect(timer.isRunning).toBe(true);
    });

    it('실행 중이 아닌 타이머에 stop()을 호출해도 에러가 없어야 한다', () => {
      expect(() => timer.stop()).not.toThrow();
    });
  });

  // ===== 틱 동작 =====
  describe('틱 동작', () => {
    it('1초 경과 후 remainingSeconds가 1 감소해야 한다', () => {
      timer.start();
      vi.advanceTimersByTime(1000);
      expect(timer.remainingSeconds).toBe(1499);
    });

    it('3초 경과 후 remainingSeconds가 3 감소해야 한다', () => {
      timer.start();
      vi.advanceTimersByTime(3000);
      expect(timer.remainingSeconds).toBe(1497);
    });

    it('onTick 콜백이 매 초 호출되어야 한다', () => {
      const onTick = vi.fn();
      const timerWithCallback = new Timer({ onTick });
      timerWithCallback.start();
      vi.advanceTimersByTime(3000);
      expect(onTick).toHaveBeenCalledTimes(3);
      timerWithCallback.stop();
    });
  });

  // ===== 타이머 완료 =====
  describe('타이머 완료', () => {
    it('시간이 0이 되면 onComplete 콜백이 호출되어야 한다', () => {
      const onComplete = vi.fn();
      // 1초짜리 타이머로 빠르게 테스트
      const shortTimer = new Timer({ pomodoro: 1 / 60, onComplete });
      shortTimer.start();
      // 1초 + 여유 시간
      vi.advanceTimersByTime(2000);
      expect(onComplete).toHaveBeenCalled();
    });

    it('타이머 완료 후 isRunning이 false가 되어야 한다', () => {
      const shortTimer = new Timer({ pomodoro: 1 / 60 });
      shortTimer.start();
      vi.advanceTimersByTime(2000);
      expect(shortTimer.isRunning).toBe(false);
    });
  });

  // ===== 초기화 =====
  describe('초기화 (reset)', () => {
    it('reset() 호출 후 타이머가 정지되어야 한다', () => {
      timer.start();
      timer.reset();
      expect(timer.isRunning).toBe(false);
    });

    it('reset() 호출 후 remainingSeconds가 초기값으로 돌아와야 한다', () => {
      timer.start();
      vi.advanceTimersByTime(5000);
      timer.reset();
      expect(timer.remainingSeconds).toBe(1500);
    });
  });

  // ===== 모드 변경 =====
  describe('모드 변경 (setMode)', () => {
    it('shortBreak 모드로 변경 시 올바른 시간이 설정되어야 한다', () => {
      timer.setMode('shortBreak');
      // 기본 짧은 휴식 5분 = 300초
      expect(timer.remainingSeconds).toBe(300);
      expect(timer.currentMode).toBe('shortBreak');
    });

    it('longBreak 모드로 변경 시 올바른 시간이 설정되어야 한다', () => {
      timer.setMode('longBreak');
      // 기본 긴 휴식 15분 = 900초
      expect(timer.remainingSeconds).toBe(900);
    });

    it('유효하지 않은 모드 설정 시 에러가 발생해야 한다', () => {
      expect(() => timer.setMode('invalidMode')).toThrow();
    });

    it('모드 변경 시 실행 중인 타이머가 정지되어야 한다', () => {
      timer.start();
      timer.setMode('shortBreak');
      expect(timer.isRunning).toBe(false);
    });
  });

  // ===== 시간 포맷 =====
  describe('시간 포맷 (getFormattedTime)', () => {
    it('25:00 형식으로 시간을 반환해야 한다', () => {
      expect(timer.getFormattedTime()).toBe('25:00');
    });

    it('한 자리 분/초도 두 자리로 패딩되어야 한다', () => {
      timer.setMode('shortBreak'); // 5분
      expect(timer.getFormattedTime()).toBe('05:00');
    });

    it('1초 경과 후 24:59를 반환해야 한다', () => {
      timer.start();
      vi.advanceTimersByTime(1000);
      expect(timer.getFormattedTime()).toBe('24:59');
    });
  });
});
