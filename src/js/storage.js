/**
 * LocalStorage 관리 모듈
 * 앱 설정과 세션 기록을 로컬 스토리지에 저장/불러오기 처리
 */

// 스토리지 키 상수
const STORAGE_KEYS = {
  SETTINGS: 'pomodoro_settings',
  SESSION_COUNT: 'pomodoro_session_count',
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
