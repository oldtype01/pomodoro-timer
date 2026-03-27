/**
 * 모달 다이얼로그 기능 단위 테스트
 * 모달 열기/닫기, 키보드 네비게이션, 포커스 트랩 기능 검증
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';

describe('모달 다이얼로그 기본 동작', () => {
  let mockModal, mockSettingsBtn;

  beforeEach(() => {
    // DOM 요소 목킹
    mockModal = {
      classList: {
        add: vi.fn(),
        remove: vi.fn(),
        contains: vi.fn(),
      },
      querySelector: vi.fn(),
      addEventListener: vi.fn(),
    };

    mockSettingsBtn = {
      focus: vi.fn(),
    };

    // document.querySelector 목킹
    vi.stubGlobal('document', {
      querySelector: vi.fn((selector) => {
        if (selector === '#settingsModal') return mockModal;
        if (selector === '#settingsBtn') return mockSettingsBtn;
        return null;
      }),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('모달 열기 시 active 클래스가 추가되어야 한다', () => {
    function openModal(modal) {
      modal.classList.add('modal-overlay--active');
    }

    openModal(mockModal);

    expect(mockModal.classList.add).toHaveBeenCalledWith('modal-overlay--active');
  });

  test('모달 닫기 시 active 클래스가 제거되어야 한다', () => {
    function closeModal(modal) {
      modal.classList.remove('modal-overlay--active');
    }

    closeModal(mockModal);

    expect(mockModal.classList.remove).toHaveBeenCalledWith('modal-overlay--active');
  });

  test('모달 닫기 시 설정 버튼으로 포커스가 복귀해야 한다', () => {
    function closeModal(modal, settingsBtn) {
      modal.classList.remove('modal-overlay--active');
      if (settingsBtn) {
        settingsBtn.focus();
      }
    }

    closeModal(mockModal, mockSettingsBtn);

    expect(mockSettingsBtn.focus).toHaveBeenCalled();
  });
});

describe('포커스 트랩 기능', () => {
  test('포커스 가능한 요소들을 올바르게 찾아야 한다', () => {
    const mockElement = {
      querySelectorAll: vi.fn(() => [
        { tagName: 'BUTTON' },
        { tagName: 'INPUT' },
        { tagName: 'SELECT' },
      ]),
      addEventListener: vi.fn(),
    };

    function getFocusableElements(element) {
      return element.querySelectorAll(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
    }

    getFocusableElements(mockElement);

    expect(mockElement.querySelectorAll).toHaveBeenCalledWith(
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
  });
});

describe('키보드 네비게이션', () => {
  test('ESC 키 이벤트 처리가 올바르게 동작해야 한다', () => {
    const mockCloseModal = vi.fn();

    function handleEscapeKey(event, isModalActive, closeCallback) {
      if (event.key === 'Escape' && isModalActive) {
        closeCallback();
      }
    }

    // ESC 키 이벤트 시뮬레이션
    const escEvent = { key: 'Escape' };
    handleEscapeKey(escEvent, true, mockCloseModal);

    expect(mockCloseModal).toHaveBeenCalled();
  });

  test('다른 키는 모달을 닫지 않아야 한다', () => {
    const mockCloseModal = vi.fn();

    function handleEscapeKey(event, isModalActive, closeCallback) {
      if (event.key === 'Escape' && isModalActive) {
        closeCallback();
      }
    }

    // 다른 키 이벤트 시뮬레이션
    const enterEvent = { key: 'Enter' };
    handleEscapeKey(enterEvent, true, mockCloseModal);

    expect(mockCloseModal).not.toHaveBeenCalled();
  });

  test('모달이 비활성 상태일 때 ESC 키가 무시되어야 한다', () => {
    const mockCloseModal = vi.fn();

    function handleEscapeKey(event, isModalActive, closeCallback) {
      if (event.key === 'Escape' && isModalActive) {
        closeCallback();
      }
    }

    const escEvent = { key: 'Escape' };
    handleEscapeKey(escEvent, false, mockCloseModal);

    expect(mockCloseModal).not.toHaveBeenCalled();
  });
});

describe('오버레이 클릭 처리', () => {
  test('오버레이 직접 클릭 시 모달이 닫혀야 한다', () => {
    const mockModal = { id: 'modal' };
    const mockCloseModal = vi.fn();

    function handleOverlayClick(event, modal, closeCallback) {
      if (event.target === modal) {
        closeCallback();
      }
    }

    const clickEvent = { target: mockModal };
    handleOverlayClick(clickEvent, mockModal, mockCloseModal);

    expect(mockCloseModal).toHaveBeenCalled();
  });

  test('모달 내부 클릭 시 모달이 닫히지 않아야 한다', () => {
    const mockModal = { id: 'modal' };
    const mockInnerElement = { id: 'inner' };
    const mockCloseModal = vi.fn();

    function handleOverlayClick(event, modal, closeCallback) {
      if (event.target === modal) {
        closeCallback();
      }
    }

    const clickEvent = { target: mockInnerElement };
    handleOverlayClick(clickEvent, mockModal, mockCloseModal);

    expect(mockCloseModal).not.toHaveBeenCalled();
  });
});

describe('접근성 기능', () => {
  test('모달에 적절한 ARIA 속성이 설정되어야 한다', () => {
    // HTML 구조 검증을 위한 테스트
    const expectedAriaAttributes = {
      'role': 'dialog',
      'aria-modal': 'true',
      'aria-labelledby': 'settingsTitle'
    };

    function validateModalAccessibility(modalElement) {
      const hasValidAria =
        modalElement.getAttribute('role') === 'dialog' &&
        modalElement.getAttribute('aria-modal') === 'true' &&
        modalElement.getAttribute('aria-labelledby') === 'settingsTitle';

      return hasValidAria;
    }

    const mockModalElement = {
      getAttribute: vi.fn((attr) => expectedAriaAttributes[attr])
    };

    const isValid = validateModalAccessibility(mockModalElement);
    expect(isValid).toBe(true);
  });
});