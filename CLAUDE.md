# 프로젝트

## 프로젝트 개요
집중력 향상을 위한 개인용 Pomodoro 타이머 웹 앱. 작업(25분)/휴식(5분) 사이클 관리, 완료 세션 기록, 브라우저 알림을 제공한다. 초기에는 로컬 사용 목적이며 이후 정적 호스팅으로 배포를 고려한다.

## 기술 스택
- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **Build Tool**: Vite
- **상태/저장**: LocalStorage API
- **테스트**: Vitest
- **린팅/포맷**: ESLint + Prettier
- **배포 (예정)**: GitHub Pages / Netlify

## 빌드/테스트 명령어
```bash
npm run dev        # 개발 서버 실행
npm run build      # 배포용 빌드
npm run preview    # 빌드 결과 미리보기
npm test           # 테스트 실행
npm run lint       # 코드 린팅
npm run format     # 코드 포맷팅
```

## 코딩 컨벤션
- 주석은 반드시 한국어로 작성
- 함수/변수명은 영어 camelCase
- 에러 처리를 반드시 포함
- Conventional Commits 형식 준수 (feat, fix, refactor, docs, test, chore)

## 프로젝트 구조 규칙
- 소스 코드는 지정된 소스 디렉토리 안에 작성 (스택 기본값: Node.js→`src/`, Flutter→`lib/`, Go→`cmd/`+`internal/` 등)
- 테스트 코드는 지정된 테스트 디렉토리에 (또는 소스와 co-located)
- 문서는 `docs/`
- 설정 파일(package.json, pubspec.yaml 등)은 프로젝트 루트
- 빌드 결과물은 `dist/` 또는 `build/` (gitignore 대상)
- 프로젝트 루트에 소스 코드 파일(.ts, .dart, .py 등)을 직접 놓지 않음
- 구체적인 디렉토리 구조는 `/project-init`의 tech-advisor가 기술 스택에 맞게 결정

---

## 멀티 에이전트 하네스

### 사용법
- `/project-init` : 프로젝트 아이디어 구체화 + PRD 생성 (최초 1회)
- `/harness <태스크>` : 전체 자동 사이클 (Plan→Code→Review→Analyze→Commit)
- `/harness-plan <태스크>` : 기획만 실행
- `/harness-review` : 현재 변경사항 독립 리뷰
- `/harness-status` : 사이클 상태 확인

### 컨텍스트 격리 규칙
- 모든 에이전트는 독립 컨텍스트 윈도우에서 실행
- 에이전트 간 정보 전달은 .claude/harness/ 파일 기반 핸드오프만 사용
- 오케스트레이터는 에이전트 반환값(1줄 요약)만 수신
- 사이클 실패 시 모든 에이전트를 fresh spawn

### 생성-평가 분리 규칙
- Reviewer는 code-report.md를 읽지 않음 (git diff만 평가)
- Analyzer는 다른 리포트를 읽지 않음 (도구 실행 결과만 판정)

### 전역 금지 사항
- 오케스트레이터가 직접 코드 수정 금지
- 프롬프트에 파일 내용 인라인 금지 (경로만 전달)
- 에이전트 간 I/O 계약 외 파일 접근 금지
- .claude/ 설정 파일, CLAUDE.md 하네스 섹션 수정 금지
- .env, secrets/ 시크릿 파일 접근 금지
- 3회 실패 후 자동 4회차 진행 금지

### 사이클 규칙
- 최대 3회 반복, 2회 연속 실패 시 중간 알림
- 실패 시 cycle-N-fail.md에 최소 정보만 기록 (30줄 이내)
- 재시도 Plan은 기존 코드 기반 수선 (아키텍처 변경 시 ESCALATE)

### 서브에이전트 모델 라우팅
- planner/coder: sonnet
- reviewer/analyzer: haiku
