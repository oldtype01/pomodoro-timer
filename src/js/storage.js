/**
 * LocalStorage 관리 모듈
 * 앱 설정과 세션 기록을 로컬 스토리지에 저장/불러오기 처리
 */

// 스토리지 키 상수
const STORAGE_KEYS = {
  SETTINGS: 'pomodoro_settings',
  SESSION_COUNT: 'pomodoro_session_count',
  TIMER_STATE: 'pomodoro_timer_state',
  DAILY_SESSIONS: 'pomodoro_daily_sessions',
  THEME: 'pomodoro_theme',
};

/**
 * StorageManager - LocalStorage 읽기/쓰기 관리
 */
export const StorageManager = {
  /**
   * 설정 저장
   * @param {object} settings - 저장할 설정 객체
   * @returns {boolean} 저장 성공 여부
   */
  saveSettings(settings) {
    try {
      const serialized = JSON.stringify(settings);
      localStorage.setItem(STORAGE_KEYS.SETTINGS, serialized);
      return true;
    } catch (error) {
      // 스토리지 용량 초과 또는 시크릿 모드 에러 처리
      console.error('설정 저장 실패:', error);
      return false;
    }
  },

  /**
   * 설정 불러오기
   * @returns {object|null} 저장된 설정 객체 또는 null
   */
  loadSettings() {
    try {
      const serialized = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (serialized === null) return null;
      return JSON.parse(serialized);
    } catch (error) {
      // JSON 파싱 오류 처리
      console.error('설정 불러오기 실패:', error);
      return null;
    }
  },

  /**
   * 세션 카운트 저장
   * @param {number} count - 저장할 세션 수
   * @returns {boolean} 저장 성공 여부
   */
  saveSessionCount(count) {
    try {
      // 숫자 유효성 검증
      if (typeof count !== 'number' || count < 0) {
        throw new Error(`유효하지 않은 세션 카운트: ${count}`);
      }
      localStorage.setItem(STORAGE_KEYS.SESSION_COUNT, String(count));
      return true;
    } catch (error) {
      console.error('세션 카운트 저장 실패:', error);
      return false;
    }
  },

  /**
   * 세션 카운트 불러오기
   * @returns {number} 저장된 세션 수 (없으면 0)
   */
  loadSessionCount() {
    try {
      const value = localStorage.getItem(STORAGE_KEYS.SESSION_COUNT);
      if (value === null) return 0;
      const count = parseInt(value, 10);
      // NaN 처리
      return isNaN(count) ? 0 : count;
    } catch (error) {
      console.error('세션 카운트 불러오기 실패:', error);
      return 0;
    }
  },

  /**
   * 타이머 상태 저장
   * @param {object} timerState - 저장할 타이머 상태
   * @returns {boolean} 저장 성공 여부
   */
  saveTimerState(timerState) {
    try {
      const serialized = JSON.stringify(timerState);
      localStorage.setItem(STORAGE_KEYS.TIMER_STATE, serialized);
      return true;
    } catch (error) {
      console.error('타이머 상태 저장 실패:', error);
      return false;
    }
  },

  /**
   * 타이머 상태 불러오기
   * @returns {object|null} 저장된 타이머 상태 또는 null
   */
  loadTimerState() {
    try {
      const serialized = localStorage.getItem(STORAGE_KEYS.TIMER_STATE);
      if (serialized === null) return null;
      return JSON.parse(serialized);
    } catch (error) {
      console.error('타이머 상태 불러오기 실패:', error);
      return null;
    }
  },

  /**
   * 타이머 상태 클리어
   */
  clearTimerState() {
    try {
      localStorage.removeItem(STORAGE_KEYS.TIMER_STATE);
    } catch (error) {
      console.error('타이머 상태 클리어 실패:', error);
    }
  },

  /**
   * 일일 세션 기록 저장
   * @param {string} date - 날짜 문자열 (YYYY-MM-DD 형식)
   * @param {array} sessions - 세션 기록 배열
   * @returns {boolean} 저장 성공 여부
   */
  saveDailySessions(date, sessions) {
    try {
      const dailySessions = this.loadAllDailySessions();
      dailySessions[date] = sessions;
      const serialized = JSON.stringify(dailySessions);
      localStorage.setItem(STORAGE_KEYS.DAILY_SESSIONS, serialized);
      return true;
    } catch (error) {
      console.error('일일 세션 저장 실패:', error);
      return false;
    }
  },

  /**
   * 특정 날짜의 세션 기록 불러오기
   * @param {string} date - 날짜 문자열 (YYYY-MM-DD 형식)
   * @returns {array} 해당 날짜의 세션 기록 배열
   */
  loadDailySessions(date) {
    try {
      const allSessions = this.loadAllDailySessions();
      return allSessions[date] || [];
    } catch (error) {
      console.error('일일 세션 불러오기 실패:', error);
      return [];
    }
  },

  /**
   * 모든 일일 세션 기록 불러오기
   * @returns {object} 날짜별 세션 기록 객체
   */
  loadAllDailySessions() {
    try {
      const serialized = localStorage.getItem(STORAGE_KEYS.DAILY_SESSIONS);
      if (serialized === null) return {};
      return JSON.parse(serialized);
    } catch (error) {
      console.error('전체 일일 세션 불러오기 실패:', error);
      return {};
    }
  },

  /**
   * 특정 날짜에 세션 추가
   * @param {string} date - 날짜 문자열 (YYYY-MM-DD 형식)
   * @param {object} session - 추가할 세션 정보
   * @returns {boolean} 추가 성공 여부
   */
  addSession(date, session) {
    try {
      const sessions = this.loadDailySessions(date);
      sessions.push({
        ...session,
        timestamp: Date.now(),
      });
      return this.saveDailySessions(date, sessions);
    } catch (error) {
      console.error('세션 추가 실패:', error);
      return false;
    }
  },

  /**
   * 테마 설정 저장
   * @param {string} theme - 저장할 테마 값 ('light', 'dark', 'system')
   * @returns {boolean} 저장 성공 여부
   */
  saveTheme(theme) {
    try {
      // 유효한 테마 값인지 검증
      if (!['light', 'dark', 'system'].includes(theme)) {
        throw new Error(`유효하지 않은 테마 값: ${theme}`);
      }
      localStorage.setItem(STORAGE_KEYS.THEME, theme);
      return true;
    } catch (error) {
      console.error('테마 저장 실패:', error);
      return false;
    }
  },

  /**
   * 테마 설정 불러오기
   * @returns {string} 저장된 테마 값 ('light', 'dark', 'system' 중 하나, 기본값: 'system')
   */
  loadTheme() {
    try {
      const theme = localStorage.getItem(STORAGE_KEYS.THEME);
      // 저장된 값이 없거나 유효하지 않은 경우 기본값 반환
      if (!theme || !['light', 'dark', 'system'].includes(theme)) {
        return 'system';
      }
      return theme;
    } catch (error) {
      console.error('테마 불러오기 실패:', error);
      return 'system';
    }
  },

  /**
   * 모든 앱 데이터 초기화
   */
  clearAll() {
    try {
      Object.values(STORAGE_KEYS).forEach((key) => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.error('스토리지 초기화 실패:', error);
    }
  },
};

export default StorageManager;
