// ESLint 린팅 규칙 설정 (CommonJS 형식 - package.json의 "type": "module" 환경에서 사용)
module.exports = {
  // 브라우저 및 ES2022, Node.js 환경 설정
  env: {
    browser: true,
    es2022: true,
    node: true,
  },
  // ECMAScript 최신 버전 파서 설정
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  // Prettier와 충돌하지 않도록 연동
  extends: ['eslint:recommended', 'prettier'],
  rules: {
    // 미사용 변수 경고
    'no-unused-vars': 'warn',
    // console 사용 허용 (개발 편의)
    'no-console': 'off',
  },
};
