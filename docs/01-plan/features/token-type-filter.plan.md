# Plan: Token Type Filter

## Executive Summary

| 항목 | 내용 |
|------|------|
| Feature | token-type-filter |
| 시작일 | 2026-03-25 |
| 단계 | Plan |

### Value Delivered

| 관점 | 내용 |
|------|------|
| Problem | 현재 추출 시 Variables + Color/Text/Effect Styles 전부 한 JSON에 담겨 불필요한 데이터가 포함됨 |
| Solution | 토큰 타입 토글 버튼으로 원하는 타입만 선택해서 추출 |
| Function UX Effect | 필요한 타입만 빠르게 추출 → JSON 크기 감소, 후처리 시간 단축 |
| Core Value | PixelForge 파이프라인에 꼭 필요한 토큰만 정확히 전달 |

---

## 1. 배경 및 목적

### 1.1 현황 문제

현재 PixelForge Token Extractor는 추출 버튼 클릭 시 다음 4가지를 **항상 모두** 추출한다:

- Variables (컬렉션별)
- Color Styles
- Text Styles
- Effect Styles

실제 사용 시 "색상 토큰만 Style Dictionary에 넣고 싶다", "텍스트 스타일만 확인하고 싶다" 등 특정 타입만 필요한 경우가 많다.

### 1.2 목적

토큰 타입을 UI에서 선택하여 해당 타입의 데이터만 추출 → JSON 출력하는 기능 추가.

---

## 2. 요구사항

### 2.1 기능 요구사항

| ID | 요구사항 | 우선순위 |
|----|----------|----------|
| FR-01 | 4가지 토큰 타입 토글 버튼 제공 (Variables, Color Styles, Text Styles, Effect Styles) | 필수 |
| FR-02 | 토글은 다중 선택 가능 (최소 1개 이상 선택 강제) | 필수 |
| FR-03 | 선택된 타입만 추출하여 JSON 출력 | 필수 |
| FR-04 | 기본값은 전체 선택 | 필수 |
| FR-05 | Variables 선택 시 resolvedType 세부 필터 옵션 (COLOR / FLOAT / STRING / BOOLEAN) | 선택 |

### 2.2 비기능 요구사항

- 기존 컬렉션 필터 / 선택 레이어 필터와 독립적으로 동작 (AND 조건으로 조합)
- 선택 상태는 플러그인 세션 동안 유지

---

## 3. 구현 범위

### In Scope
- `src/ui.html`: 타입 토글 버튼 UI 추가
- `src/code.ts`: 추출 옵션에 `tokenTypes` 필드 추가, 타입별 조건부 추출

### Out of Scope
- Variables resolvedType 세부 필터 (FR-05) — 후속 작업
- 타입별 별도 파일로 다운로드 — 후속 작업

---

## 4. 설계 방향

### UI 구조

```
[ Variables ] [ Color Styles ] [ Text Styles ] [ Effect Styles ]
   ☑ 선택됨       ☑ 선택됨         ☐ 해제됨         ☑ 선택됨
```

- 토글 버튼 스타일 (선택: 파란 배경, 미선택: 회색)
- 모두 해제 시 추출 버튼 비활성화

### code.ts 변경

```typescript
interface ExtractOptions {
  collectionIds: string[];
  useSelection: boolean;
  tokenTypes: ('variables' | 'colors' | 'texts' | 'effects')[];  // 추가
}
```

추출 함수에서 `tokenTypes`에 포함된 타입만 처리.

---

## 5. 완료 기준

- [ ] 4개 타입 토글 버튼이 UI에 표시됨
- [ ] 선택된 타입만 JSON에 포함됨
- [ ] 미선택 타입은 빈 배열이 아닌 JSON 키 자체가 없음
- [ ] 컬렉션 필터 + 선택 레이어 + 타입 필터 3가지 조합 시 정상 동작
- [ ] 전체 선택 상태에서 기존 동작과 동일한 결과 출력
