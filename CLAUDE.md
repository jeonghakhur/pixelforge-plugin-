# CLAUDE.md — PixelForge Token Extractor (Figma Plugin)

## 프로젝트 개요

Figma에서 **Variables(디자인 토큰)** 와 **Styles(색상/텍스트/효과)** 를 추출하여 JSON으로 내보내는 Figma 플러그인.

PixelForge 자동화 파이프라인의 첫 번째 단계:
```
Figma 플러그인 (추출) → JSON → PixelForge 앱 (토큰 관리/코드 생성)
```

---

## 프로젝트 구조

```
pixelforge-plugin/
├── manifest.json        — Figma 플러그인 메타데이터
├── src/
│   ├── code.ts          — 플러그인 메인 로직 (Figma API 접근)
│   └── ui.tsx           — 플러그인 UI (HTML/CSS/JS)
├── dist/
│   ├── code.js          — 빌드 결과물 (Figma가 실행하는 파일)
│   └── ui.html          — 빌드 결과물 (플러그인 UI)
├── build.mjs            — esbuild 빌드 스크립트
├── tsconfig.json
└── package.json
```

---

## 개발 환경

```bash
npm install        # 의존성 설치
npm run build      # 단발성 빌드 → dist/ 생성
npm run dev        # 파일 변경 감지 + 자동 빌드
```

### Figma에서 테스트

1. Figma Desktop 실행
2. 메뉴 → Plugins → Development → **Import plugin from manifest...**
3. `manifest.json` 선택
4. Plugins 메뉴에서 "PixelForge Token Extractor" 실행

---

## 핵심 파일

### `src/code.ts` — 플러그인 로직
Figma Plugin API 사용. `figma.*` 네임스페이스 접근 가능.

**주요 API:**
- `figma.variables.getLocalVariableCollections()` — 변수 컬렉션
- `figma.variables.getLocalVariables()` — 변수 목록
- `figma.getLocalPaintStyles()` — 색상 스타일
- `figma.getLocalTextStyles()` — 텍스트 스타일
- `figma.getLocalEffectStyles()` — 효과 스타일
- `figma.ui.postMessage()` — UI로 데이터 전송
- `figma.ui.onmessage` — UI에서 메시지 수신

**메시지 플로우:**
```
UI: postMessage({ type: 'extract' })
  → code.ts: extractAll() 실행
  → code.ts: figma.ui.postMessage({ type: 'extract-result', data })
  → UI: onmessage 수신 → JSON 표시
```

### `src/ui.tsx` — 플러그인 UI
순수 HTML/CSS/JS 문자열로 export. 외부 라이브러리 없음.
(Figma 플러그인 UI는 iframe이라 번들 크기 제한 있음)

### `manifest.json`
```json
{
  "name": "PixelForge Token Extractor",
  "id": "pixelforge-token-extractor",
  "api": "1.0.0",
  "main": "dist/code.js",
  "ui": "dist/ui.html",
  "editorType": ["figma"],
  "permissions": ["currentpage"]
}
```

---

## 추출 데이터 구조

```typescript
interface ExtractedTokens {
  variables: {
    collections: VariableCollectionData[]  // 컬렉션 (예: Primitives, Semantic)
    variables: VariableData[]              // 개별 변수 (색상, 간격 등)
  }
  styles: {
    colors: ColorStyleData[]   // 색상 스타일
    texts: TextStyleData[]     // 텍스트 스타일
    effects: EffectStyleData[] // 효과 스타일 (Shadow 등)
  }
  meta: {
    figmaFileKey: string   // Figma 파일 키
    extractedAt: string    // ISO 날짜
    fileName: string       // Figma 파일명
  }
}
```

---

## 코드 규칙

- TypeScript strict mode
- `any` 사용 금지 (단, Figma API 타입 미지원 시 예외)
- 외부 런타임 의존성 없음 (빌드 도구만 devDependencies)
- UI는 순수 HTML 문자열 (React/Vue 불가 — Figma 제약)
- 빌드 결과물(`dist/`)은 git에 포함 (Figma가 직접 실행)

---

## 다음 개발 목표

- [ ] Style Dictionary 호환 JSON 포맷 출력
- [ ] PixelForge 앱 API로 직접 업로드 기능
- [ ] 선택된 컴포넌트만 추출하는 필터 옵션
- [ ] 컬렉션/모드별 필터링 UI
- [ ] 변경 감지 (이전 추출본과 diff)

---

## 관련 프로젝트

- **PixelForge 앱**: `/Users/jeonghakhur/work/person/pixelforge`
  - GitHub: https://github.com/jeonghakhur/pixelforge
  - 역할: 추출된 토큰 관리 + Bootstrap 컴포넌트 코드 생성
- **이 플러그인**: https://github.com/jeonghakhur/pixelforge-plugin-
