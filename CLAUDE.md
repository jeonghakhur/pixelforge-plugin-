# CLAUDE.md — PixelForge Token Extractor (Figma Plugin)

## 작업 전 필수 읽기
1. **QUALITY_RULES.md** — 디자인 토큰, 간격, 코드 컨벤션, 에러 처리 패턴
2. **ARCHITECTURE.md** — 파일 역할, 메시지 플로우, 빌드 파이프라인
3. 수정 대상 파일의 기존 패턴 확인 (네이밍, 구조)

## 프로젝트 요약
Figma에서 Variables/Styles를 추출하여 JSON/CSS로 내보내는 플러그인.
```
Figma 플러그인 (추출) → JSON/CSS → PixelForge 앱 (토큰 관리/코드 생성)
```

## 핵심 파일
| 파일 | 역할 | 언어/제약 |
|------|------|----------|
| `src/code.ts` | Figma API 접근 (Sandbox) | TypeScript strict, DOM 접근 불가 |
| `src/ui.html` | UI 레이아웃 + CSS | 인라인 CSS, 외부 리소스 불가 |
| `src/ui.js` | UI 로직 + i18n | ES5 `var`, ES module import |
| `src/converters/*.js` | JSON→CSS 변환 | 순수 함수, Figma API 의존 없음 |
| `build.mjs` | esbuild 빌드 | `dist/ui.html`에 JS 인라인 번들 |
| `dist/` | 빌드 산출물 | git 추적, Figma가 직접 실행 |

## 개발 명령어
```bash
npm run build    # 단발성 빌드 → dist/
npm run dev      # watch 모드 (파일 변경 → 자동 빌드)
```

## 코드 규칙 요약
- **색상:** CSS 변수(`var(--*)`)만 사용. `#` 하드코딩 금지
- **간격:** 4px 배수만 (4, 8, 12, 16, 20, 24, 32)
- **타입:** `any` 금지 (Figma API 타입 미지원 시 예외)
- **의존성:** 외부 런타임 의존성 추가 금지
- **네이밍:** → `docs/conventions/code-style.md` 참조
- **디자인:** → `docs/conventions/design-system.md` 참조

## 메시지 플로우 (UI ↔ code.ts)
```
UI → code.ts: extract, inspect, export-icons, export-icons-all,
              extract-themes, generate-component, resize, close
code.ts → UI: init-data, selection-changed, *-result, *-error
```
새 메시지 타입 추가 시 `ARCHITECTURE.md` 테이블 업데이트 필수.

## 작업 후 필수 검증
1. `npm run build` 성공 확인
2. 색상/간격 하드코딩 검수 (CSS 변수 사용 여부)
3. 새 UI 요소: WCAG AA 명도대비 4.5:1 이상 확인
4. 새 메시지 타입: ARCHITECTURE.md 업데이트
5. 커밋 메시지: `<type>: <한글 설명>` (feat/fix/docs/chore/refactor)

## 문서 맵
| 문서 | 내용 |
|------|------|
| `ARCHITECTURE.md` | 구조, 메시지 플로우, 빌드 파이프라인 |
| `QUALITY_RULES.md` | 토큰, 간격, 컨벤션, 에러 패턴 |
| `docs/conventions/code-style.md` | 네이밍, 파일 구조, TS/JS 패턴 |
| `docs/conventions/design-system.md` | 토큰 사용법, WCAG AA, 금융 UI 트렌드 |
| `docs/test/playwright-guide.md` | 테스트 설정, 검증 체크리스트 |
| `docs/decisions/README.md` | ADR (주요 기술 결정 기록) |

## 관련 프로젝트
- **PixelForge 앱**: `/Users/jeonghakhur/work/person/pixelforge`
  - 역할: 추출된 토큰 관리 + Bootstrap 컴포넌트 코드 생성
