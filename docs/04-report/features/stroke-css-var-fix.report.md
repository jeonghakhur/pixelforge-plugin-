# stroke-css-var-fix — Completion Report

## Executive Summary

| 항목 | 내용 |
|------|------|
| Feature | stroke-css-var-fix |
| 날짜 | 2026-04-28 |
| 소요 시간 | ~30분 (발견 → 분석 → 수정 → 검증 → 커밋) |
| Match Rate | 100% |
| 변경 파일 | 1개 (`src/code.ts`) |
| 변경 라인 | +4 |

### Value Delivered

| 관점 | 내용 |
|------|------|
| Problem | VECTOR 노드의 `stroke` CSS 변수가 `var(--colors-foreground-fg-white, #FFF)` (full-path)로 출력되어 `background-color: var(--bg-brand-solid)` (alias 단축명)과 불일치 |
| Solution | `resolveBoundColor(n, 'strokes')` 오버라이드를 추가하여 fills와 동일한 코드 경로로 처리 |
| Function UX Effect | `stroke: var(--fg-white)`, `iconColor: var(--fg-white)`로 정규화 — 토큰 이름이 짧고 일관되어 PixelForge 앱에서 변수 매핑이 정확해짐 |
| Core Value | `getCSSAsync` 결과와 `boundVariables` 경로 간 불일치 제거 — 모든 색상 속성이 alias 단축명으로 통일 |

---

## 1. 문제 분석

### 1.1 증상

`CheckboxBase.node.json` 출력에서:
```json
"background-color": "var(--bg-brand-solid)",
"stroke": "var(--colors-foreground-fg-white, #FFF)"
```

같은 컴포넌트 내에서 fills 속성은 `--bg-brand-solid` (alias 단축명), strokes 속성은 `--colors-foreground-fg-white` (full-path)로 불일치.

### 1.2 근본 원인

두 속성이 다른 코드 경로를 거쳤기 때문:

| 속성 | 경로 | 이름 생성 |
|------|------|-----------|
| `background-color` | `resolveBoundColor` → `varIdMap` | `toCssVarName(name, isAlias=true)` → 마지막 세그먼트만 |
| `stroke` (수정 전) | `getCSSAsync` 결과 그대로 | Figma가 full-path 반환, regex가 단축 처리 안 함 |

`toCssVarName` 규칙:
- `isAlias=true`: `Colors/Foreground/fg-white` → `--fg-white` (마지막 세그먼트)
- `isAlias=false`: `Colors/Foreground/fg-white` → `--colors-foreground-fg-white` (전체 경로)

---

## 2. 구현

### 2.1 변경 내용

**`src/code.ts:2471-2473`** — 3줄 추가

```typescript
// strokes → stroke (VECTOR 노드에서 getCSSAsync가 full-path 이름을 반환하는 경우 alias 단축명으로 교체)
const strokeVar = resolveBoundColor(n, 'strokes');
if (strokeVar && s['stroke']) s['stroke'] = strokeVar;
```

fills 오버라이드 패턴과 동일. `getCSSAsync`가 이미 `stroke`를 설정한 경우에만 `varIdMap` 기반 단축명으로 교체.

### 2.2 사이드 이펙트

- `iconColor`(line 2631): `s['stroke']` 값을 참조하므로 자동으로 `var(--fg-white)`로 연쇄 반영
- strokeStyleId 경로(line 2477): `!s['stroke']` 조건 경로라 영향 없음
- 바운드 변수 없는 노드: `strokeVar=null` → 조건 불충족 → 변경 없음

---

## 3. 검증

| 검증 항목 | 결과 |
|-----------|------|
| 빌드 성공 | ✅ `npm run build` 통과 |
| 바운드 변수 없는 경우 | ✅ strokeVar=null → no-op |
| strokeStyleId border 경로 | ✅ `!s['stroke']` 분기라 충돌 없음 |
| iconColor 연쇄 반영 | ✅ `var(--fg-white)` 자동 반영 |

Match Rate: **100%**

---

## 4. 커밋

```
99db711 fix(component): stroke CSS 변수명을 alias 단축명으로 정규화
```
