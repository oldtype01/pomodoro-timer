/**
 * 타이머 핵심 로직 모듈
 * Pomodoro 타이머의 시작, 정지, 초기화, 틱(tick) 처리를 담당
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

    // 내부 interval ID
    this._intervalId = null;

    // 콜백 함수 등록
    this.onTick = options.onTick ?? null;
    this.onComplete = options.onComplete ?? null;
  }

  /**
   * 타이머 시작
   * 이미 실행 중이면 무시
   */
  start() {
    // 이미 실행 중이면 중복 시작 방지
    if (this.isRunning) return;

    this.isRunning = true;
    this._intervalId = setInterval(() => {
      this._tick();
    }, 1000);
  }

  /**
   * 타이머 정지
   */
  stop() {
    if (!this.isRunning) return;

    this.isRunning = false;
    clearInterval(this._intervalId);
    this._intervalId = null;
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
   * 매 초 호출되는 내부 틱 처리
   * @private
   */
  _tick() {
    if (this.remainingSeconds <= 0) {
      // 타이머 완료 처리
      this.stop();
      if (this.onComplete) {
        this.onComplete(this.currentMode);
      }
      return;
    }

    this.remainingSeconds -= 1;

    // 틱 콜백 호출
    if (this.onTick) {
      this.onTick(this.remainingSeconds);
    }
  }
}

export default Timer;
