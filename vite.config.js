import { defineConfig } from 'vite';

// Vite 빌드 및 Vitest 테스트 설정
export default defineConfig({
  // 빌드 출력 디렉토리 설정
  build: {
    outDir: 'dist',
  },
  // Vitest 테스트 환경 설정
  test: {
    // jsdom으로 브라우저 API 시뮬레이션
    environment: 'jsdom',
    // 테스트 파일 경로 패턴
    include: ['tests/**/*.test.js'],
    // 커버리지 설정
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.js'],
    },
  },
});
