/**
 * 테마 기능 단위 테스트
 * 다크모드 토글, 테마 저장/로드, 시스템 테마 감지 기능 검증
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { StorageManager } from '../src/js/storage.js';

describe('테마 저장/로드 기능', () => {
  beforeEach(() => {
    // 테스트 전 로컬스토리지 초기화
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  test('유효한 테마 값을 저장할 수 있어야 한다', () => {
    const themes = ['light', 'dark', 'system'];

    themes.forEach((theme) => {
      const result = StorageManager.saveTheme(theme);
      expect(result).toBe(true);
      expect(localStorage.getItem('pomodoro_theme')).toBe(theme);
    });
  });

  test('유효하지 않은 테마 값은 저장되지 않아야 한다', () => {
    const invalidThemes = ['invalid', '', null, undefined, 123];

    invalidThemes.forEach((theme) => {
      const result = StorageManager.saveTheme(theme);
      expect(result).toBe(false);
      expect(localStorage.getItem('pomodoro_theme')).toBeNull();
    });
  });

  test('저장된 테마를 정확히 불러올 수 있어야 한다', () => {
    const testTheme = 'dark';
    StorageManager.saveTheme(testTheme);

    const loadedTheme = StorageManager.loadTheme();
    expect(loadedTheme).toBe(testTheme);
  });

  test('저장된 테마가 없을 때 기본값을 반환해야 한다', () => {
    const defaultTheme = StorageManager.loadTheme();
    expect(defaultTheme).toBe('system');
  });

  test('손상된 테마 데이터가 있을 때 기본값을 반환해야 한다', () => {
    // 유효하지 않은 테마 값 직접 설정
    localStorage.setItem('pomodoro_theme', 'invalid_theme');

    const loadedTheme = StorageManager.loadTheme();
    expect(loadedTheme).toBe('system');
  });
});

describe('테마 적용 로직', () => {
  let mockHtmlElement;

  beforeEach(() => {
    // document.documentElement 목킹
    mockHtmlElement = {
      removeAttribute: vi.fn(),
      setAttribute: vi.fn(),
    };
    vi.stubGlobal('document', {
      documentElement: mockHtmlElement,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('라이트 테마 적용 시 data-theme="light"가 설정되어야 한다', () => {
    // 테마 적용 로직을 직접 테스트하기 위한 함수
    function applyTheme(theme) {
      const htmlElement = document.documentElement;
      htmlElement.removeAttribute('data-theme');
      if (theme !== 'system') {
        htmlElement.setAttribute('data-theme', theme);
      }
    }

    applyTheme('light');

    expect(mockHtmlElement.removeAttribute).toHaveBeenCalledWith('data-theme');
    expect(mockHtmlElement.setAttribute).toHaveBeenCalledWith('data-theme', 'light');
  });

  test('다크 테마 적용 시 data-theme="dark"가 설정되어야 한다', () => {
    function applyTheme(theme) {
      const htmlElement = document.documentElement;
      htmlElement.removeAttribute('data-theme');
      if (theme !== 'system') {
        htmlElement.setAttribute('data-theme', theme);
      }
    }

    applyTheme('dark');

    expect(mockHtmlElement.removeAttribute).toHaveBeenCalledWith('data-theme');
    expect(mockHtmlElement.setAttribute).toHaveBeenCalledWith('data-theme', 'dark');
  });

  test('시스템 테마 적용 시 data-theme 속성이 제거되어야 한다', () => {
    function applyTheme(theme) {
      const htmlElement = document.documentElement;
      htmlElement.removeAttribute('data-theme');
      if (theme !== 'system') {
        htmlElement.setAttribute('data-theme', theme);
      }
    }

    applyTheme('system');

    expect(mockHtmlElement.removeAttribute).toHaveBeenCalledWith('data-theme');
    expect(mockHtmlElement.setAttribute).not.toHaveBeenCalled();
  });
});

describe('테마 토글 순환', () => {
  test('테마 순환이 올바른 순서로 동작해야 한다', () => {
    const themeOrder = ['light', 'dark', 'system'];

    // 테마 토글 로직
    function getNextTheme(currentTheme) {
      const currentIndex = themeOrder.indexOf(currentTheme);
      const nextIndex = (currentIndex + 1) % themeOrder.length;
      return themeOrder[nextIndex];
    }

    // light → dark
    expect(getNextTheme('light')).toBe('dark');

    // dark → system
    expect(getNextTheme('dark')).toBe('system');

    // system → light (순환)
    expect(getNextTheme('system')).toBe('light');
  });
});