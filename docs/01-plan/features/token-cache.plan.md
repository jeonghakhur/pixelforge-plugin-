# Plan: Token Cache (마지막 추출 데이터 캐시)

> **Summary**: 마지막으로 추출한 토큰 데이터를 `figma.clientStorage`에 저장해 플러그인을 다시 열어도 즉시 재사용할 수 있고, 명도대비·아이콘·테마·컴포넌트·이미지 탭이 같은 캐시를 공유하며, 사용자가 원할 때 직접 삭제할 수 있게 한다.
>
> **Project**: PixelForge Token Extractor (Figma Plugin)
> **Version**: 0.1.0
> **Date**: 2026-03-30
> **Status**: Draft

---

## Executive Summary

| 관점 | 내용 |
|------|------|
| **Problem** | 추출 탭에서 "추출" 버튼을 누르면 데이터가 메모리에만 남아 플러그인을 닫으면 사라짐 — 매번 재추출 필요 |
| **Solution** | 추출 완료 시 전체 토큰 데이터를 `figma.clientStorage`에 자동 저장, 플러그인 재오픈 시 자동 복원 |
| **Function/UX Effect** | 명도대비·아이콘·테마·컴포넌트·이미지 탭이 캐시된 데이터를 즉시 사용 — 재추출 없이 탭 이동만으로 분석 가능 |
| **Core Value** | 한 번 추출한 데이터가 세션을 넘어 지속 — 반복 추출 없이 모든 탭에서 일관된 데이터 기반 작업 가능 |

---

## 1. 개요

### 1.1 목적

추출 탭에서 수행한 마지막 토큰 추출 결과를 플러그인 재오픈 후에도 유지하고, 다른 탭(명도대비/아이콘/테마/컴포넌트/이미지)에서 캐시된 데이터를 자동으로 활용한다.

### 1.2 배경

현재 동작:
- 추출 → 메모리에만 저장 → 탭 전환 후 데이터 유지 (세션 내)
- 플러그인 닫고 재오픈 → 데이터 소실 → 재추출 필요
- 아이콘 탭은 이미 `lastIconData` 캐시 구현 완료 (단일 탭 한정)

목표:
- **전역 토큰 캐시**: 추출된 `ExtractedTokens` 전체를 `figma.clientStorage`에 저장
- **자동 복원**: 플러그인 오픈 시 캐시 존재하면 자동 로드 → 모든 탭에서 즉시 사용 가능
- **캐시 상태 표시**: 어느 탭에서든 캐시 날짜와 삭제 버튼 표시
- **사용자 삭제**: 캐시를 명시적으로 삭제해 최신 추출로 교체 가능

### 1.3 관련 기존 구현

- `lastIconData` 캐시 (`code.ts:955`) — 아이콘 탭 전용, 패턴 참조
- `pf-registry-{fileId}` 캐시 (`code.ts:983`) — 컴포넌트 레지스트리, 구조 참조
- `sendCollections()` 복원 로직 (`code.ts:272`) — 아이콘 캐시 복원 패턴 참조

---

## 2. 구현 범위

### 2.1 In Scope

- [ ] 추출 완료 시 `ExtractedTokens` 전체를 `figma.clientStorage`에 자동 저장
- [ ] 플러그인 오픈 시 캐시 자동 복원 → 추출 탭에 즉시 표시
- [ ] 명도대비 탭: 캐시 데이터 자동 사용 (색상 토큰 로드)
- [ ] 아이콘 탭: 기존 `lastIconData` 유지 (별도 캐시 병행)
- [ ] 테마 탭: 캐시 데이터 자동 사용 (테마 추출 기반)
- [ ] 컴포넌트 탭: 캐시 데이터 자동 사용 (선택 정보 보조)
- [ ] 이미지 탭: 캐시 데이터 자동 사용 (에셋 목록 복원)
- [ ] 캐시 상태 배지: 저장 날짜 + 삭제 버튼 (추출 탭)
- [ ] 전체 캐시 삭제 기능 (사용자 명시 삭제)
- [ ] `token-cache-get`, `token-cache-clear` 메시지 핸들러 (code.ts)

### 2.2 Out of Scope

- 캐시 버전 관리 / 변경 감지 (diff) — 별도 피처
- 파일별 캐시 분리 (현재는 단일 캐시) — 추후 고려
- 클라우드 동기화 — 범위 외
- 캐시 만료 TTL — 단순화 (사용자 수동 삭제만)

---

## 3. 요구사항

### 3.1 기능 요구사항

| ID | 요구사항 | 우선순위 |
|----|----------|----------|
| FR-01 | 추출 완료 시 `ExtractedTokens` 전체를 `pf-token-cache` 키로 저장 | 필수 |
| FR-02 | 플러그인 오픈 시 캐시 존재하면 자동 복원 → UI에 `cached-token-data` 전송 | 필수 |
| FR-03 | 추출 탭에 캐시 배지 표시 (저장 날짜 + 삭제 버튼) | 필수 |
| FR-04 | 명도대비 탭: 캐시된 색상 토큰 자동 로드 | 필수 |
| FR-05 | 테마 탭: 캐시된 토큰 데이터 자동 로드 | 필수 |
| FR-06 | 컴포넌트 탭: 캐시된 variables/styles 보조 활용 | 선택 |
| FR-07 | 이미지 탭: 캐시 복원 후 이미지 에셋 목록 복원 | 선택 |
| FR-08 | 사용자 삭제 버튼 → `token-cache-clear` 메시지 → 캐시 삭제 + UI 초기화 | 필수 |
| FR-09 | 캐시 용량 경고: 5MB 초과 시 저장 전 경고 토스트 | 선택 |
| FR-10 | i18n: 캐시 관련 레이블 한/영 추가 | 필수 |

### 3.2 비기능 요구사항

| 항목 | 기준 |
|------|------|
| 저장 용량 | Figma clientStorage 제한 내 (통상 수 MB) |
| 복원 속도 | 플러그인 오픈 후 1초 이내 |
| 저장 키 | `pf-token-cache` (파일 무관 단일 키) |

---

## 4. 설계 방향

### 4.1 저장 구조

```typescript
interface TokenCacheEntry {
  data: ExtractedTokens;    // 전체 추출 데이터
  savedAt: string;          // ISO 날짜
  figmaFileId: string;      // 저장 시점 파일 ID (표시용)
  figmaFileName: string;    // 저장 시점 파일명 (표시용)
}

// 저장 키
const CACHE_KEY = 'pf-token-cache';
```

### 4.2 메시지 흐름

```
[플러그인 오픈]
  code.ts: sendCollections()
    → figma.clientStorage.getAsync('pf-token-cache')
    → 있으면: postMessage({ type: 'cached-token-data', data, savedAt, fileName })
    → UI: lastExtracted = data, 캐시 배지 표시, 각 탭에 데이터 전파

[추출 완료]
  code.ts: extract-result 응답 시
    → figma.clientStorage.setAsync('pf-token-cache', { data, savedAt, figmaFileId, figmaFileName })
    → UI: 캐시 배지 갱신

[사용자 삭제]
  UI: postMessage({ type: 'token-cache-clear' })
  code.ts: figma.clientStorage.deleteAsync('pf-token-cache')
    → postMessage({ type: 'token-cache-cleared' })
  UI: lastExtracted = null, 각 탭 초기화, 배지 숨김
```

### 4.3 탭별 캐시 활용

| 탭 | 현재 | 캐시 적용 후 |
|----|------|-------------|
| 추출 | 추출 후 즉시 표시 | 재오픈 시 자동 복원 + 배지 |
| 명도대비 | 추출 후 수동 이동 | 캐시 있으면 색상 토큰 자동 로드 |
| 아이콘 | 별도 `lastIconData` 캐시 | 기존 유지 (변경 없음) |
| 테마 | 추출 탭에서 먼저 추출 필요 | 캐시 있으면 자동 로드 |
| 컴포넌트 | 선택 정보 중심 | 캐시 variables/styles 보조 활용 |
| 이미지 | 수동 추출 필요 | 캐시 있으면 이미지 에셋 복원 (FR-07) |

### 4.4 UI 변경

**추출 탭 — 캐시 배지 추가:**
```
추출 결과 헤더 영역:
  [토큰 N개 추출됨]  [캐시: 2026-03-30 14:22  ×]
```

배지 클릭(×) → 삭제 확인 다이얼로그 → 캐시 삭제

**다른 탭 — 자동 로드 시 안내:**
```
명도대비 탭:
  [색상 토큰 자동 로드됨 (캐시: 2026-03-30 14:22)]
```

---

## 5. 기술 결정

| 항목 | 결정 | 이유 |
|------|------|------|
| 저장 위치 | `figma.clientStorage` | 현재 파일 범위, 영구 저장 |
| 캐시 키 | `pf-token-cache` (단일) | 파일별 분리보다 단순성 우선 |
| 기존 `lastIconData` | 병행 유지 | 아이콘 탭 독립성 보장 |
| 용량 초과 처리 | 토스트 경고 후 저장 시도 | Figma가 자체 한도 에러 발생 시 캐치 |
| 탭별 자동 로드 | `cached-token-data` 수신 시 각 탭 초기화 함수 호출 | 중앙화된 복원 로직 |

---

## 6. 완료 기준

- [ ] 추출 완료 시 자동 저장 (code.ts)
- [ ] 플러그인 재오픈 시 캐시 자동 복원 (모든 탭 갱신)
- [ ] 추출 탭에 캐시 배지 + 날짜 표시
- [ ] × 버튼으로 캐시 삭제 → 전 탭 초기화
- [ ] 명도대비 탭: 캐시 복원 시 색상 토큰 자동 로드
- [ ] 테마 탭: 캐시 복원 시 자동 로드
- [ ] 한/영 i18n 레이블 추가

---

## 7. 리스크

| 리스크 | 영향 | 대응 |
|--------|------|------|
| clientStorage 용량 초과 | 저장 실패 | try/catch + 토스트 경고 |
| 구 파일 데이터로 다른 파일 분석 | 잘못된 대비값 등 | 배지에 파일명 표시, 사용자가 인지 가능하게 |
| `lastIconData`와 중복 | 아이콘 탭 동작 불일치 | 아이콘 탭은 기존 캐시 우선 유지 |

---

## 8. 다음 단계

1. [ ] Design 문서 작성 (`token-cache.design.md`)
2. [ ] code.ts: `pf-token-cache` 저장/복원/삭제 핸들러
3. [ ] ui.js: `cached-token-data` 핸들러 + 탭별 자동 로드
4. [ ] ui.html: 캐시 배지 UI 추가
