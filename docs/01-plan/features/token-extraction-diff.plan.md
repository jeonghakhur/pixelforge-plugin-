# token-extraction-diff Planning Document

> **Summary**: 토큰 추출 결과가 이전과 달라진 원인 분석 및 수정 계획
>
> **Project**: PixelForge Token Extractor (Figma Plugin)
> **Version**: 미확정
> **Author**: Jeonghak Hur
> **Date**: 2026-04-28
> **Status**: Draft

---

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | 토큰 추출 결과(CSS var 이름, CSS 속성 구조)가 이전 커밋 대비 달라져 PixelForge 앱과의 연동이 깨질 수 있음 |
| **Solution** | 미커밋 변경사항의 의도를 검증하고, 의도된 변경은 유지하되 breaking 변경은 마이그레이션 전략과 함께 적용 |
| **Function/UX Effect** | 컴포넌트 CSS 생성 결과의 일관성 복원 및 토큰명 정규화 전략 명확화 |
| **Core Value** | PixelForge 앱이 수신하는 CSS 토큰 참조가 예측 가능하고 안정적으로 유지됨 |

---

## 1. Overview

### 1.1 Purpose

현재 `src/code.ts`의 미커밋 변경사항으로 인해 컴포넌트 CSS 생성(`generateComponent`) 결과가 이전과 달라졌다. 어떤 변경이 의도된 것인지, 어떤 것이 회귀(regression)인지 판단하고 안전하게 적용할 계획을 수립한다.

### 1.2 Background

최근 3개 커밋(아이콘 추출 개선, 프레임 인스펙터 추가)은 `src/code.ts`에 대규모 변경을 가했다. 이 과정에서 `generateComponent()` 내부의 CSS 생성 로직도 미커밋 상태로 수정되어, 다음 두 영역에서 이전과 다른 결과가 발생한다:

1. **Paint Style CSS var 이름**: semantic alias 방식 → full path 방식으로 변경
2. **stroke CSS 속성 구조**: `border-image` → `border` 단축 속성으로 변경

### 1.3 관련 파일

- `src/code.ts` — 미커밋 변경사항 포함 (`git status: M`)
- `src/ui/tab-icons.js` — 미커밋 변경사항 포함
- `src/ui/utils.js` — 미커밋 변경사항 포함

---

## 2. 발견된 변경사항 상세 분석

### 2.1 미커밋 변경 목록 (src/code.ts)

#### [변경 1] Paint Style CSS var 이름 생성 방식 변경 — **HIGH IMPACT**

```diff
- styleIdMap.set(style.id, toCssVarName(style.name, true));
+ styleIdMap.set(style.id, toCssVarName(style.name, false)); // Paint Style은 full path 사용
```

**영향:**
- `isAlias=true` (이전): 마지막 세그먼트만 사용 → `Colors/Foreground/fg-brand-primary` → `--fg-brand-primary`
- `isAlias=false` (이후): full path → `Colors/Foreground/fg-brand-primary` → `--colors-foreground-fg-brand-primary`

**PixelForge 앱 영향:** CSS 파일에서 참조하는 변수명이 달라지면 기존 토큰 매핑이 깨짐

#### [변경 2] stroke CSS 속성: border-image → border 단축 속성 — **HIGH IMPACT**

```diff
- s['border-width'] = sw + 'px';
- s['border-style'] = getBorderStyle(n);
- s['border-image'] = 'var(' + styleIdMap.get(strokeStyleId)! + ')';
- delete s['border'];
+ s['border'] = sw + 'px ' + getBorderStyle(n) + ' var(' + styleIdMap.get(strokeStyleId)! + ')';
+ delete s['border-width'];
+ delete s['border-style'];
+ delete s['border-image'];
```

**영향:** CSS 속성 키가 `border-image`에서 `border`로 바뀜. PixelForge 앱이 특정 키로 파싱하는 경우 깨짐.

#### [변경 3] VECTOR/LINE 노드: border → SVG stroke 변환 — **MEDIUM IMPACT**

```typescript
// 신규: VECTOR/LINE 노드에서 border 삭제 후 stroke/stroke-width로 변환
if ((n.type === 'VECTOR' || n.type === 'BOOLEAN_OPERATION' || n.type === 'LINE') && s['border']) {
  s['stroke-width'] = m[1] + 'px';
  s['stroke'] = m[2];
  delete s['border'];
}
```

**의도:** SVG 노드에서 `border` 대신 `stroke` 사용 (CSS 시맨틱 정확성)
**영향:** 이전에는 VECTOR 노드도 `border` 키를 사용했음

#### [변경 4] 반투명 fill → rgba() 생성 — **MEDIUM IMPACT**

```diff
- if (solid) s[fillProp] = resolveColor(solid.color);
+ if (solid) {
+   if (typeof solid.opacity === 'number' && solid.opacity < 1) {
+     s[fillProp] = `rgba(...)`;
+   } else {
+     s[fillProp] = resolveColor(solid.color);
+   }
+ }
```

**영향:** opacity < 1인 fill의 색상 값이 hex에서 rgba()로 바뀜

#### [변경 5] stroke 중복 처리 방지 — **LOW IMPACT**

```diff
- if ('strokes' in n) {
+ if ('strokes' in n && !s['stroke']) {
```

**의도:** `getCSSAsync`가 이미 SVG stroke를 반환한 경우 중복 방지 (버그 수정)

#### [변경 6] iconColor: stroke 우선 감지 — **LOW IMPACT**

```diff
- const border = s['border'];
- if (border) {
+ const strokeVal = s['stroke'] || s['border'];
+ if (strokeVal) {
```

**의도:** [변경 3]과 연동 — stroke로 변환된 값도 iconColor로 감지

### 2.2 미커밋 변경 목록 (src/ui/utils.js)

```diff
- if (!payload.figmaFileKey) payload.figmaFileKey = ...
+ if (payload.figmaFileKey == null) payload.figmaFileKey = ...
```
**의도:** 빈 문자열(`''`)을 유효한 값으로 유지 (falsy → null 비교)

### 2.3 미커밋 변경 목록 (src/ui/tab-icons.js)

- 아이콘 PixelForge 전송 시 `figmaFileKey` 필수 검증 추가
- 전송 payload 형식 변경: `{ meta: {...}, icons: [...] }` → `{ figmaFileKey, icons: [...] }`

---

## 3. Scope

### 3.1 In Scope

- [ ] 각 변경사항의 의도(intentional) vs 회귀(regression) 분류
- [ ] Paint Style CSS var 이름 전략 결정 (semantic last-segment vs full-path)
- [ ] PixelForge 앱 수신 포맷과의 호환성 검증
- [ ] 의도된 변경사항에 대한 테스트 시나리오 정의
- [ ] `npm run build` 빌드 검증

### 3.2 Out of Scope

- Variable 탭의 extractAll() 로직 — 미커밋 변경 없음, 영향 없음
- Icons/Images 탭의 추출 로직 — 별도 이슈
- PixelForge 앱 서버 측 수신 로직 수정 — 별도 스프린트

---

## 4. Requirements

### 4.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | Paint Style CSS var 이름 전략을 명확히 결정하고 코드에 문서화 | High | Pending |
| FR-02 | border-image → border 변경이 PixelForge 앱에서 올바르게 파싱되는지 확인 | High | Pending |
| FR-03 | VECTOR 노드 stroke 변환 로직의 의도와 side effect 검증 | Medium | Pending |
| FR-04 | 반투명 fill rgba() 변환의 PixelForge 앱 영향 확인 | Medium | Pending |
| FR-05 | 변경사항 커밋 전 `npm run build` 성공 확인 | High | Pending |

### 4.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| 호환성 | PixelForge 앱이 수신한 CSS 파싱 성공률 100% | 수동 E2E 테스트 |
| 일관성 | 동일 Figma 파일에서 동일 추출 결과 재현 | 반복 추출 비교 |

---

## 5. 변경사항 분류 및 권고

| 변경 | 분류 | 권고 |
|------|------|------|
| [변경 1] Paint Style var 이름 full path | **Breaking** — PixelForge 앱 토큰명 불일치 가능성 | 의도 확인 후 PixelForge 앱과 동시 배포 필요 |
| [변경 2] border-image → border | **Intentional Fix** — CSS 시맨틱 개선 | PixelForge 앱 파서 영향 확인 후 유지 |
| [변경 3] VECTOR stroke 변환 | **Intentional Fix** — SVG 노드 정확성 개선 | 유지 |
| [변경 4] rgba() 반투명 | **Intentional Fix** — 색상 정확도 개선 | 유지 |
| [변경 5] stroke 중복 방지 | **Bug Fix** | 유지 |
| [변경 6] iconColor stroke 우선 | **Bug Fix** | 유지 |

---

## 6. Success Criteria

### 6.1 Definition of Done

- [ ] 각 변경사항에 대해 의도(intentional) / 회귀(regression) 판단 완료
- [ ] PixelForge 앱 수신 포맷과의 호환성 확인
- [ ] Breaking 변경에 대한 마이그레이션 계획 수립 (또는 롤백)
- [ ] `npm run build` 성공
- [ ] 커밋 메시지에 breaking change 표시

### 6.2 Quality Criteria

- [ ] 빌드 에러 없음
- [ ] CSS var 이름 전략이 코드 주석으로 문서화됨

---

## 7. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Paint Style var 이름 변경으로 PixelForge 앱 토큰 매핑 깨짐 | High | High | PixelForge 앱 토큰 참조 방식 확인 후 양쪽 동시 배포 |
| border-image 파싱 로직이 PixelForge 앱에 있는 경우 | Medium | Medium | PixelForge 앱 CSS 파서 코드 검색 |
| 미커밋 상태로 빌드 에러 발생 가능성 | Low | Low | `npm run build` 즉시 실행 |

---

## 8. Architecture Considerations

### 8.1 조사 순서

```
1. npm run build → 빌드 에러 여부 확인
2. toCssVarName(name, false) 의도 확인
   → PixelForge 앱의 토큰명 참조 방식과 비교
3. border-image → border 변경의 PixelForge 파서 영향 확인
4. 각 변경 분류 후 커밋 또는 롤백 결정
```

### 8.2 핵심 함수

| 함수 | 파일 | 역할 |
|------|------|------|
| `toCssVarName(name, isAlias)` | `src/code.ts:1187` | CSS var 이름 생성 — isAlias로 경로 처리 방식 결정 |
| `generateComponent()` | `src/code.ts` | 컴포넌트 CSS 생성 전체 |
| `isAliasVariable(variable)` | `src/code.ts:1568` | Variable이 semantic alias인지 판별 |
| `varToTokenRef(variable, id, color)` | `src/code.ts:1575` | Variable → CSS var 참조 문자열 |

---

## 9. Next Steps

1. [ ] `npm run build` 실행 — 빌드 에러 여부 우선 확인
2. [ ] Paint Style var 이름 전략 결정 (PixelForge 앱 팀 확인 필요)
3. [ ] 의도된 변경사항 확정 후 커밋
4. [ ] Design 문서 작성 (`token-extraction-diff.design.md`)

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-04-28 | Initial draft — 미커밋 변경사항 5종 분석 | Jeonghak Hur |
