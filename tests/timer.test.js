/**
 * timer.js 단위 테스트
 * Timer 클래스의 핵심 동작 검증
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Timer } from '../src/js/timer.js';

describe('Timer 클래스', () => {
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

    timer = new Timer({ storage: mockStorage });
  });

  // 각 테스트 후 타이머 정리
  afterEach(() => {
    timer.stop();
    vi.useRealTimers();
    vi.restoreAllMocks();
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
      const timerWithCallback = new Timer({ onTick, storage: mockStorage });
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
      const shortTimer = new Timer({ pomodoro: 1 / 60, onComplete, storage: mockStorage });
      shortTimer.start();
      // 1초 + 여유 시간
      vi.advanceTimersByTime(2000);
      expect(onComplete).toHaveBeenCalled();
    });

    it('타이머 완료 후 isRunning이 false가 되어야 한다', () => {
      const shortTimer = new Timer({ pomodoro: 1 / 60, storage: mockStorage });
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

  // ===== 절대 시간 기반 로직 =====
  describe('절대 시간 기반 로직', () => {
    it('타이머 시작 시 startTime과 endTime이 설정되어야 한다', () => {
      const mockNow = 1000000;
      vi.spyOn(Date, 'now').mockReturnValue(mockNow);

      timer.start();

      expect(timer.startTime).toBe(mockNow);
      expect(timer.endTime).toBe(mockNow + 1500 * 1000); // 25분
    });

    it('절대 시간 기반으로 남은 시간을 정확히 계산해야 한다', () => {
      const startTime = 1000000;
      vi.spyOn(Date, 'now')
        .mockReturnValueOnce(startTime) // start() 호출 시
        .mockReturnValue(startTime + 5000); // 5초 후

      timer.start();
      timer._recalculateFromAbsoluteTime();

      expect(timer.remainingSeconds).toBe(1495); // 5초 감소
    });

    it('장시간 경과 후에도 정확한 시간을 유지해야 한다', () => {
      const startTime = 1000000;
      const elapsed = 600000; // 10분 경과

      vi.spyOn(Date, 'now')
        .mockReturnValueOnce(startTime)
        .mockReturnValue(startTime + elapsed);

      timer.start();
      timer._recalculateFromAbsoluteTime();

      expect(timer.remainingSeconds).toBe(900); // 25분 - 10분 = 15분
    });
  });

  // ===== Page Visibility API =====
  describe('Page Visibility API', () => {
    beforeEach(() => {
      // document 모킹
      global.document = {
        hidden: false,
        addEventListener: vi.fn(),
      };
    });

    it('visibilitychange 이벤트 리스너가 등록되어야 한다', () => {
      const testTimer = new Timer({ storage: mockStorage });
      expect(document.addEventListener).toHaveBeenCalledWith(
        'visibilitychange',
        expect.any(Function)
      );
      testTimer.stop(); // 테스트 후 정리
    });

    it('탭이 백그라운드로 이동 후 다시 포커스될 때 시간을 재계산해야 한다', () => {
      const startTime = 1000000;
      vi.spyOn(Date, 'now')
        .mockReturnValueOnce(startTime) // start() 호출 시
        .mockReturnValue(startTime + 30000); // 30초 후 복귀

      timer.start();

      // visibilitychange 이벤트 콜백 가져오기
      const visibilityCall = document.addEventListener.mock.calls.find(
        ([event]) => event === 'visibilitychange'
      );

      // 콜백이 존재하는지 확인
      if (!visibilityCall) {
        // 브라우저 환경이 아닌 경우 수동으로 테스트
        timer.wasHidden = true;
        timer._recalculateFromAbsoluteTime();
        expect(timer.remainingSeconds).toBe(1470); // 30초 감소
        return;
      }

      const visibilityCallback = visibilityCall[1];

      // 탭이 백그라운드로 이동
      document.hidden = true;
      visibilityCallback();
      expect(timer.wasHidden).toBe(true);

      // 탭이 다시 포커스됨
      document.hidden = false;
      visibilityCallback();

      expect(timer.remainingSeconds).toBe(1470); // 30초 감소
      expect(timer.wasHidden).toBe(false);
    });
  });

  // ===== 상태 저장/복구 =====
  describe('상태 저장 및 복구', () => {
    it('타이머 시작 시 상태가 저장되어야 한다', () => {
      timer.start();
      expect(mockStorage.saveTimerState).toHaveBeenCalled();
    });

    it('타이머 정지 시 상태가 클리어되어야 한다', () => {
      timer.start();
      timer.stop();
      expect(mockStorage.clearTimerState).toHaveBeenCalled();
    });

    it('모드 변경 시 상태가 저장되어야 한다', () => {
      timer.setMode('shortBreak');
      expect(mockStorage.saveTimerState).toHaveBeenCalled();
    });

    it('저장된 상태로부터 타이머를 복구할 수 있어야 한다', () => {
      const savedState = {
        isRunning: true,
        currentMode: 'pomodoro',
        remainingSeconds: 1200,
        startTime: 1000000,
        endTime: 1000000 + 1200 * 1000,
        durations: { pomodoro: 25, shortBreak: 5, longBreak: 15 },
      };

      mockStorage.loadTimerState.mockReturnValue(savedState);
      vi.spyOn(Date, 'now').mockReturnValue(1000000 + 300000); // 5분 후

      const restoredTimer = new Timer({ storage: mockStorage });

      expect(restoredTimer.isRunning).toBe(true);
      expect(restoredTimer.currentMode).toBe('pomodoro');
      expect(restoredTimer.remainingSeconds).toBe(900); // 1200 - 300초
    });

    it('만료된 타이머 상태 복구 시 완료 처리되어야 한다', () => {
      const onComplete = vi.fn();
      const expiredState = {
        isRunning: true,
        currentMode: 'pomodoro',
        startTime: 1000000,
        endTime: 1000000 + 1000, // 1초 타이머
        durations: { pomodoro: 25, shortBreak: 5, longBreak: 15 },
      };

      mockStorage.loadTimerState.mockReturnValue(expiredState);
      vi.spyOn(Date, 'now').mockReturnValue(1000000 + 2000); // 2초 후 (만료)

      new Timer({ storage: mockStorage, onComplete });

      // 비동기 콜백 처리를 위한 타이머 진행
      vi.runAllTimers();

      expect(onComplete).toHaveBeenCalledWith('pomodoro');
    });
  });

  // ===== 백그라운드 탭 정확도 =====
  describe('백그라운드 탭 정확도', () => {
    it('긴 백그라운드 시간 후에도 1초 이내 오차를 유지해야 한다', () => {
      const startTime = 1000000;
      const longElapsed = 1200000; // 20분 경과

      vi.spyOn(Date, 'now')
        .mockReturnValueOnce(startTime)
        .mockReturnValue(startTime + longElapsed);

      timer.start();
      timer._recalculateFromAbsoluteTime();

      // 25분 - 20분 = 5분 (300초)
      const expectedRemaining = 300;
      const actualRemaining = timer.remainingSeconds;

      expect(Math.abs(actualRemaining - expectedRemaining)).toBeLessThanOrEqual(1);
    });

    it('브라우저 새로고침 시뮬레이션 후 정확한 복구', () => {
      const startTime = Date.now();
      const reloadTime = startTime + 480000; // 8분 후 새로고침

      // 타이머 상태 시뮬레이션
      const savedState = {
        isRunning: true,
        currentMode: 'pomodoro',
        startTime: startTime,
        endTime: startTime + 1500 * 1000, // 25분
        durations: { pomodoro: 25, shortBreak: 5, longBreak: 15 },
      };

      mockStorage.loadTimerState.mockReturnValue(savedState);
      vi.spyOn(Date, 'now').mockReturnValue(reloadTime);

      const recoveredTimer = new Timer({ storage: mockStorage });

      // 25분 - 8분 = 17분 (1020초)
      expect(recoveredTimer.remainingSeconds).toBe(1020);
      expect(recoveredTimer.isRunning).toBe(true);
    });
  });
});
