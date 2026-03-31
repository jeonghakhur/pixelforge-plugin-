# ARCHITECTURE.md — PixelForge Token Extractor

## 전체 구조

```
pixelforge-plugin/
├── manifest.json              # Figma 플러그인 메타데이터
├── build.mjs                  # esbuild 빌드 스크립트
├── src/
│   ├── code.ts                # Figma Sandbox (메인 스레드, Figma API 접근)
│   ├── ui.html                # UI 레이아웃 + CSS (iframe)
│   ├── ui.js                  # UI 로직 + i18n + 이벤트 핸들링
│   └── converters/            # JSON→CSS 변환 모듈
│       ├── utils.js           # escapeHtml, toCssName, figmaColorToCSS, toUnit
│       ├── variables.js       # Variable → CSS custom property 변환
│       ├── color-styles.js    # Paint Style → CSS 변환
│       ├── typography.js      # Text Style → CSS class 변환
│       ├── effects.js         # Effect Style → box-shadow/filter 변환
│       └── highlight.js       # CSS 구문 하이라이트
├── dist/                      # 빌드 산출물 (git 추적)
│   ├── code.js                # code.ts 번들
│   └── ui.html                # ui.html + ui.js 인라인 번들
└── docs/                      # 설계/분석 문서
```

## Figma 플러그인 아키텍처

Figma 플러그인은 **두 개의 격리된 실행 환경**으로 구성된다.

```
┌─────────────────────────────────────────────────┐
│  Figma Main Thread (Sandbox)                    │
│  src/code.ts → dist/code.js                     │
│                                                 │
│  - figma.* API 접근 가능                         │
│  - DOM/window 접근 불가                           │
│  - Variables, Styles, Nodes 읽기                 │
│  - SVG export (exportAsync)                     │
└────────────────┬────────────────────────────────┘
                 │ postMessage (양방향)
┌────────────────▼────────────────────────────────┐
│  UI Thread (iframe)                             │
│  src/ui.html + src/ui.js → dist/ui.html         │
│                                                 │
│  - 표준 DOM/window 접근 가능                      │
│  - figma.* API 접근 불가                          │
│  - 사용자 인터랙션 처리                             │
│  - JSON/CSS 변환 및 렌더링                        │
│  - 파일 다운로드, 클립보드 복사                      │
└─────────────────────────────────────────────────┘
```

## 메시지 플로우

### UI → code.ts (요청)

| msg.type              | 설명                    | 응답 msg.type                 |
|-----------------------|------------------------|-------------------------------|
| `extract`             | 토큰 추출 요청            | `extract-result` / `extract-error` |
| `inspect`             | 선택 노드 구조 검사        | `inspect-result`              |
| `export-icons`        | 선택 노드 SVG 추출        | `export-icons-result`         |
| `export-icons-all`    | 전체 아이콘 SVG 추출       | `export-icons-all-result`     |
| `extract-themes`      | 다크/라이트 테마 추출       | `extract-themes-result`       |
| `generate-component`  | 컴포넌트 코드 생성         | `generate-component-result`   |
| `resize`              | UI 크기 변경             | (응답 없음)                    |
| `close`               | 플러그인 종료             | (응답 없음)                    |

### code.ts → UI (자동)

| msg.type              | 설명                    | 트리거                        |
|-----------------------|------------------------|-------------------------------|
| `init-data`           | 컬렉션 목록 + 파일명       | 플러그인 시작 시                 |
| `selection-changed`   | 선택 변경 알림            | `figma.on('selectionchange')` |

## 탭 구조와 책임 경계

```
Main Tabs (메인 탭 — 언더라인 스타일)
├── 추출(Extract)     → 토큰 필터링/추출/JSON·CSS 프리뷰/다운로드
├── 아이콘(Icons)      → SVG 추출 (전체/선택 모드)
├── 명도대비(Contrast)  → WCAG AA 수동 검사 + 컬러 매트릭스
│   └── Sub Tabs (pill 스타일): 수동 검사 | 컬러 매트릭스
├── 테마(Theme)        → 다크/라이트 모드 비교 + CSS 변수 복사
└── 컴포넌트(Component) → 선택 노드 → HTML/React 코드 생성
```

**탭별 데이터 의존성:**
- 추출 탭: `code.ts`에서 직접 데이터 수신
- 명도대비 탭: 추출 탭 결과(`extractedColors`)에 의존 (매트릭스 자동 생성)
- 아이콘/테마/컴포넌트 탭: `code.ts`에 독립적으로 요청

## 빌드 파이프라인

```
build.mjs (esbuild)
│
├── code.ts ──(bundle, iife, es6)──→ dist/code.js
│
└── ui.js  ──(bundle, iife, es6)──→ [메모리]
    + ui.html (template)
    + <!-- UI_SCRIPT_PLACEHOLDER --> 치환
    ──→ dist/ui.html (인라인 스크립트)
```

**핵심 제약:**
- `dist/ui.html`은 단일 HTML 파일 (외부 리소스 참조 불가 — Figma iframe 제약)
- `ui.js`와 `converters/*`는 esbuild가 하나로 번들링
- `dist/` 디렉토리는 git 추적 (Figma가 직접 실행)

## Converter 모듈 구조

```
ui.js
├── import { escapeHtml } from './converters/utils.js'
├── import { buildVarMap, convertVariables, convertFlatVars } from './converters/variables.js'
├── import { convertColorStyles } from './converters/color-styles.js'
├── import { convertTextStyles } from './converters/typography.js'
├── import { convertEffectStyles } from './converters/effects.js'
└── import { highlightCSS } from './converters/highlight.js'
```

각 converter는 **순수 함수** — Figma API 의존 없이 JSON 데이터만 입력받아 CSS 문자열 반환.

## CSS 생성 흐름

```
extractedData (JSON)
  │
  ├── variables → convertVariables() → :root { } + [data-theme="dark"] { }
  ├── spacing   → convertFlatVars()  → :root에 추가
  ├── radius    → convertFlatVars()  → :root에 추가
  ├── colors    → convertColorStyles() → :root에 추가
  ├── effects   → convertEffectStyles() → :root에 추가
  ├── texts     → convertTextStyles()   → .text-* { } 클래스
  │
  └── themeBlocks → [data-theme="dark"] { } + @media (prefers-color-scheme) { }
```
