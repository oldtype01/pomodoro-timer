/**
 * 알림 처리 모듈
 * 브라우저 Web Notifications API를 이용한 알림 전송 관리
 */

// 알림 권한 상태 상수
const PERMISSION = {
  GRANTED: 'granted',
  DENIED: 'denied',
  DEFAULT: 'default',
};

/**
 * NotificationManager - 브라우저 알림 요청 및 전송 관리
 */
export const NotificationManager = {
  /**
   * 알림 권한 요청
   * @returns {Promise<string>} 권한 상태 ('granted' | 'denied' | 'default')
   */
  async requestPermission() {
    // 브라우저가 알림을 지원하지 않는 경우 처리
    if (!('Notification' in window)) {
      console.warn('이 브라우저는 알림을 지원하지 않습니다.');
      return PERMISSION.DENIED;
    }

    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch (error) {
      console.error('알림 권한 요청 실패:', error);
      return PERMISSION.DENIED;
    }
  },

  /**
   * 현재 알림 권한 상태 확인
   * @returns {string} 권한 상태
   */
  getPermissionStatus() {
    if (!('Notification' in window)) return PERMISSION.DENIED;
    return Notification.permission;
  },

  /**
   * 알림 전송
   * @param {string} title - 알림 제목
   * @param {object} [options] - 알림 옵션
   * @param {string} [options.body] - 알림 본문
   * @param {string} [options.icon] - 알림 아이콘 경로
   * @returns {Notification|null} 생성된 알림 객체 또는 null
   */
  sendNotification(title, options = {}) {
    // 알림 권한이 없으면 전송하지 않음
    if (this.getPermissionStatus() !== PERMISSION.GRANTED) {
      console.warn('알림 권한이 없습니다. 권한을 먼저 요청하세요.');
      return null;
    }

    try {
      const notification = new Notification(title, {
        body: options.body ?? '',
        icon: options.icon ?? '/favicon.ico',
      });

      return notification;
    } catch (error) {
      console.error('알림 전송 실패:', error);
      return null;
    }
  },

  /**
   * 타이머 완료 알림 전송 (모드별 메시지 자동 생성)
   * @param {'pomodoro'|'shortBreak'|'longBreak'} mode - 완료된 타이머 모드
   */
  sendTimerCompleteNotification(mode) {
    // 모드별 알림 메시지 정의
    const messages = {
      pomodoro: { title: '뽀모도로 완료!', body: '휴식 시간입니다.' },
      shortBreak: { title: '짧은 휴식 완료!', body: '다시 집중할 시간입니다.' },
      longBreak: { title: '긴 휴식 완료!', body: '새로운 뽀모도로를 시작하세요.' },
    };

    const message = messages[mode];
    if (!message) {
      console.error(`알 수 없는 타이머 모드: ${mode}`);
      return;
    }

    this.sendNotification(message.title, { body: message.body });
  },
};

export default NotificationManager;
