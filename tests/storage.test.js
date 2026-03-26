/**
 * storage.js 단위 테스트
 * StorageManager의 LocalStorage 읽기/쓰기 동작 검증
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StorageManager } from '../src/js/storage.js';

describe('StorageManager', () => {
  // 각 테스트 전 localStorage 초기화
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  // ===== 임포트 확인 =====
  describe('기본 임포트', () => {
    it('StorageManager를 정상적으로 임포트할 수 있어야 한다', () => {
      expect(StorageManager).toBeDefined();
    });

    it('StorageManager가 필요한 메서드를 모두 가지고 있어야 한다', () => {
      expect(typeof StorageManager.saveSettings).toBe('function');
      expect(typeof StorageManager.loadSettings).toBe('function');
      expect(typeof StorageManager.saveSessionCount).toBe('function');
      expect(typeof StorageManager.loadSessionCount).toBe('function');
      expect(typeof StorageManager.clearAll).toBe('function');
    });
  });

  // ===== 설정 저장/불러오기 =====
  describe('설정 저장 및 불러오기', () => {
    it('설정을 저장하고 올바르게 불러올 수 있어야 한다', () => {
      const settings = { pomodoro: 30, shortBreak: 10, longBreak: 20 };
      const saveResult = StorageManager.saveSettings(settings);
      expect(saveResult).toBe(true);

      const loaded = StorageManager.loadSettings();
      expect(loaded).toEqual(settings);
    });

    it('저장된 설정이 없으면 null을 반환해야 한다', () => {
      const result = StorageManager.loadSettings();
      expect(result).toBeNull();
    });

    it('중첩된 객체 설정도 정상적으로 저장되어야 한다', () => {
      const settings = { pomodoro: 25, theme: { dark: true } };
      StorageManager.saveSettings(settings);
      const loaded = StorageManager.loadSettings();
      expect(loaded.theme.dark).toBe(true);
    });
  });

  // ===== 세션 카운트 저장/불러오기 =====
  describe('세션 카운트 저장 및 불러오기', () => {
    it('세션 카운트를 저장하고 올바르게 불러올 수 있어야 한다', () => {
      const saveResult = StorageManager.saveSessionCount(5);
      expect(saveResult).toBe(true);

      const count = StorageManager.loadSessionCount();
      expect(count).toBe(5);
    });

    it('저장된 세션 카운트가 없으면 0을 반환해야 한다', () => {
      const count = StorageManager.loadSessionCount();
      expect(count).toBe(0);
    });

    it('0을 세션 카운트로 저장할 수 있어야 한다', () => {
      StorageManager.saveSessionCount(0);
      expect(StorageManager.loadSessionCount()).toBe(0);
    });

    it('음수 세션 카운트 저장 시 false를 반환해야 한다', () => {
      const result = StorageManager.saveSessionCount(-1);
      expect(result).toBe(false);
    });

    it('숫자가 아닌 값으로 세션 카운트 저장 시 false를 반환해야 한다', () => {
      const result = StorageManager.saveSessionCount('invalid');
      expect(result).toBe(false);
    });
  });

  // ===== 전체 초기화 =====
  describe('전체 초기화 (clearAll)', () => {
    it('clearAll() 호출 후 설정이 삭제되어야 한다', () => {
      StorageManager.saveSettings({ pomodoro: 30 });
      StorageManager.saveSessionCount(3);
      StorageManager.clearAll();

      expect(StorageManager.loadSettings()).toBeNull();
      expect(StorageManager.loadSessionCount()).toBe(0);
    });
  });

  // ===== 에러 처리 =====
  describe('에러 처리', () => {
    it('localStorage가 손상된 JSON을 가지고 있어도 null을 반환해야 한다', () => {
      // 직접 localStorage에 잘못된 JSON 삽입
      localStorage.setItem('pomodoro_settings', 'invalid_json{');
      const result = StorageManager.loadSettings();
      expect(result).toBeNull();
    });

    it('localStorage 쓰기 실패 시 saveSettings가 false를 반환해야 한다', () => {
      // localStorage.setItem을 에러 발생하도록 모킹
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      const result = StorageManager.saveSettings({ pomodoro: 25 });
      expect(result).toBe(false);
    });
  });
});
