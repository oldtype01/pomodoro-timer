/**
 * 타이머 핵심 로직 모듈
 * Pomodoro 타이머의 시작, 정지, 초기화, 틱(tick) 처리를 담당
 * Page Visibility API와 절대 시간 기반으로 백그라운드 탭 정확도 보장
 */

// 기본 타이머 설정값 (분 단위)
const DEFAULT_DURATIONS = {
  pomodoro: 25,
  shortBreak: 5,
  longBreak: 15,
};

/**
 * Timer 클래스 - Pomodoro 타이머 핵심 상태와 동작 관리
 */
export class Timer {
  /**
   * @param {object} options - 타이머 초기 설정
   * @param {number} [options.pomodoro] - 뽀모도로 시간 (분)
   * @param {number} [options.shortBreak] - 짧은 휴식 시간 (분)
   * @param {number} [options.longBreak] - 긴 휴식 시간 (분)
   * @param {function} [options.onTick] - 매 초 호출되는 콜백
   * @param {function} [options.onComplete] - 타이머 완료 시 호출되는 콜백
   * @param {object} [options.storage] - 스토리지 매니저 (의존성 주입)
   */
  constructor(options = {}) {
    // 타이머 설정 초기화
    this.durations = {
      pomodoro: options.pomodoro ?? DEFAULT_DURATIONS.pomodoro,
      shortBreak: options.shortBreak ?? DEFAULT_DURATIONS.shortBreak,
      longBreak: options.longBreak ?? DEFAULT_DURATIONS.longBreak,
    };

    // 현재 모드 (pomodoro | shortBreak | longBreak)
    this.currentMode = 'pomodoro';

    // 타이머 상태
    this.isRunning = false;
    this.remainingSeconds = this.durations.pomodoro * 60;

    // 절대 시간 기반 타이머 상태
    this.startTime = null; // 타이머 시작 절대 시간 (Date.now())
    this.endTime = null; // 타이머 종료 예정 시간

    // 내부 requestAnimationFrame ID
    this._animationId = null;

    // Page Visibility API 상태
    this.wasHidden = false;

    // 스토리지 매니저 의존성 주입
    this.storage = options.storage ?? null;

    // 콜백 함수 등록
    this.onTick = options.onTick ?? null;
    this.onComplete = options.onComplete ?? null;

    // Page Visibility API 이벤트 리스너 등록
    this._setupVisibilityListener();

    // 페이지 로드 시 상태 복구 시도
    this._recoverFromStorage();
  }

  /**
   * 타이머 시작
   * 이미 실행 중이면 무시
   */
  start() {
    // 이미 실행 중이면 중복 시작 방지
    if (this.isRunning) return;

    this.isRunning = true;

    // 절대 시간 기반 타이머 시작
    this.startTime = Date.now();
    this.endTime = this.startTime + this.remainingSeconds * 1000;

    // 상태를 스토리지에 저장
    this._saveTimerState();

    // requestAnimationFrame 기반 업데이트 시작
    this._startAnimationLoop();
  }

  /**
   * 타이머 정지
   */
  stop() {
    if (!this.isRunning) return;

    this.isRunning = false;

    // 타이머 중단 (환경에 따라)
    if (this._animationId) {
      const isTestEnv = typeof process !== 'undefined' && process.env.NODE_ENV === 'test';
      if (isTestEnv) {
        clearTimeout(this._animationId);
      } else {
        cancelAnimationFrame(this._animationId);
      }
      this._animationId = null;
    }

    // 타이머 상태 클리어
    this.startTime = null;
    this.endTime = null;

    // 스토리지에서 타이머 상태 제거
    this._clearTimerState();
  }

  /**
   * 타이머 초기화 - 현재 모드의 기본 시간으로 리셋
   */
  reset() {
    this.stop();
    this.remainingSeconds = this.durations[this.currentMode] * 60;
  }

  /**
   * 타이머 모드 변경
   * @param {'pomodoro'|'shortBreak'|'longBreak'} mode - 변경할 모드
   */
  setMode(mode) {
    // 유효하지 않은 모드 에러 처리
    if (!['pomodoro', 'shortBreak', 'longBreak'].includes(mode)) {
      throw new Error(`유효하지 않은 타이머 모드: ${mode}`);
    }

    this.stop();
    this.currentMode = mode;
    this.remainingSeconds = this.durations[mode] * 60;

    // 모드 변경 시 상태 저장
    this._saveTimerState();
  }

  /**
   * 타이머 설정 시간(durations) 업데이트
   * 타이머가 실행 중이지 않을 때만 현재 모드의 remainingSeconds를 즉시 갱신
   * 실행 중인 경우 다음 reset/setMode 때 반영
   * @param {object} newDurations - 새로운 설정값 { pomodoro, shortBreak, longBreak } (분 단위)
   */
  updateDurations(newDurations) {
    // 유효하지 않은 입력 방어 처리
    if (!newDurations || typeof newDurations !== 'object') {
      console.error('유효하지 않은 durations 값:', newDurations);
      return;
    }

    // durations 업데이트 (제공된 키만 덮어씀)
    if (newDurations.pomodoro !== undefined) {
      this.durations.pomodoro = newDurations.pomodoro;
    }
    if (newDurations.shortBreak !== undefined) {
      this.durations.shortBreak = newDurations.shortBreak;
    }
    if (newDurations.longBreak !== undefined) {
      this.durations.longBreak = newDurations.longBreak;
    }

    // 타이머가 정지 상태일 때만 현재 모드의 남은 시간 즉시 갱신
    if (!this.isRunning) {
      this.remainingSeconds = this.durations[this.currentMode] * 60;
    }
  }

  /**
   * 남은 시간을 MM:SS 형식 문자열로 반환
   * @returns {string} 형식화된 시간 문자열
   */
  getFormattedTime() {
    const minutes = Math.floor(this.remainingSeconds / 60);
    const seconds = this.remainingSeconds % 60;
    // 두 자리 수 패딩 처리
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  /**
   * requestAnimationFrame 기반 업데이트 루프 시작 (폴백으로 setInterval 사용)
   * @private
   */
  _startAnimationLoop() {
    // 테스트 환경에서는 setInterval 사용, 실제 환경에서는 requestAnimationFrame 사용
    const isTestEnv = typeof process !== 'undefined' && process.env.NODE_ENV === 'test';

    const updateTimer = () => {
      if (!this.isRunning) return;

      const now = Date.now();
      const remainingMs = Math.max(0, this.endTime - now);
      const newRemainingSeconds = Math.ceil(remainingMs / 1000);

      // 남은 시간이 변경되었을 때만 업데이트 및 콜백 호출
      if (newRemainingSeconds !== this.remainingSeconds) {
        this.remainingSeconds = newRemainingSeconds;

        // 틱 콜백 호출
        if (this.onTick) {
          this.onTick(this.remainingSeconds);
        }
      }

      if (remainingMs <= 0) {
        // 타이머 완료 처리
        this.remainingSeconds = 0;
        this.stop();
        if (this.onComplete) {
          this.onComplete(this.currentMode);
        }
        return;
      }

      // 환경에 따라 다른 스케줄링 방법 사용
      if (isTestEnv) {
        this._animationId = setTimeout(updateTimer, 100);
      } else {
        this._animationId = requestAnimationFrame(updateTimer);
      }
    };

    // 첫 업데이트 시작
    if (isTestEnv) {
      this._animationId = setTimeout(updateTimer, 100);
    } else {
      this._animationId = requestAnimationFrame(updateTimer);
    }
  }

  /**
   * Page Visibility API 이벤트 리스너 설정
   * @private
   */
  _setupVisibilityListener() {
    // 브라우저 환경에서만 실행 (테스트 환경 고려)
    if (typeof document === 'undefined') return;

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // 탭이 백그라운드로 이동
        this.wasHidden = true;
      } else if (this.wasHidden && this.isRunning) {
        // 탭이 다시 포커스되었고 타이머가 실행 중인 경우
        this.wasHidden = false;
        this._recalculateFromAbsoluteTime();
      }
    });
  }

  /**
   * 절대 시간 기반으로 남은 시간 재계산
   * @private
   */
  _recalculateFromAbsoluteTime() {
    if (!this.isRunning || !this.endTime) return;

    const now = Date.now();
    const remainingMs = Math.max(0, this.endTime - now);
    this.remainingSeconds = Math.ceil(remainingMs / 1000);

    // 타이머가 이미 종료되었을 경우
    if (remainingMs <= 0) {
      this.remainingSeconds = 0;
      this.stop();
      if (this.onComplete) {
        this.onComplete(this.currentMode);
      }
    }
  }

  /**
   * 타이머 상태를 스토리지에 저장
   * @private
   */
  _saveTimerState() {
    if (!this.storage) return;

    const state = {
      isRunning: this.isRunning,
      currentMode: this.currentMode,
      remainingSeconds: this.remainingSeconds,
      startTime: this.startTime,
      endTime: this.endTime,
      durations: this.durations,
    };

    this.storage.saveTimerState(state);
  }

  /**
   * 스토리지에서 타이머 상태 클리어
   * @private
   */
  _clearTimerState() {
    if (!this.storage) return;
    this.storage.clearTimerState();
  }

  /**
   * 스토리지에서 타이머 상태 복구
   * @private
   */
  _recoverFromStorage() {
    if (!this.storage) return;

    const state = this.storage.loadTimerState();
    if (!state || !state.isRunning) return;

    // 상태 복원
    this.currentMode = state.currentMode;
    this.durations = { ...this.durations, ...state.durations };
    this.startTime = state.startTime;
    this.endTime = state.endTime;

    // 절대 시간 기반으로 남은 시간 재계산
    const now = Date.now();
    const remainingMs = Math.max(0, this.endTime - now);

    if (remainingMs > 0) {
      // 타이머가 아직 유효한 경우 복구
      this.remainingSeconds = Math.ceil(remainingMs / 1000);
      this.isRunning = true;
      this._startAnimationLoop();
    } else {
      // 타이머가 이미 만료된 경우 완료 처리
      this.remainingSeconds = 0;
      this._clearTimerState();
      if (this.onComplete) {
        // 약간의 지연을 두어 constructor 완료 후 콜백 호출
        setTimeout(() => this.onComplete(this.currentMode), 0);
      }
    }
  }
}

export default Timer;
