# Plan: PixelForge 연동 상태 표시

## Executive Summary

| 관점 | 내용 |
|------|------|
| **Problem** | 앱에서 플러그인 연동이 되어 있는지, 마지막으로 언제 전송됐는지 알 수 없음 |
| **Solution** | Settings 페이지에 연동 상태 섹션 추가 — API Key 사용 이력 + 최근 동기화 요약 표시 |
| **Function/UX Effect** | 연결 여부를 한눈에 확인, 전송 데이터가 실제로 저장됐는지 신뢰 제공 |
| **Core Value** | Figma → PixelForge 파이프라인의 상태 가시성 확보 |

---

## 1. 개요

### 1.1 목적
PixelForge 앱의 Settings 페이지에서 플러그인 연동 상태를 확인할 수 있도록 UI를 추가한다.

### 1.2 배경
- `pixelforge-sync` 구현으로 플러그인 → 앱 데이터 전송이 가능해짐
- 앱에서는 API key `last_used_at`과 `sync_payloads`, `token_snapshots` 테이블에 이력이 쌓이지만 볼 수 없음
- 연동이 실제로 작동하고 있는지 확인 수단이 없음

### 1.3 관련 문서
- `docs/01-plan/features/pixelforge-sync.plan.md` (선행 작업)
- PixelForge 앱: `/Users/jeonghak/work/pixelforge/`

---

## 2. 범위

### 2.1 포함
- [ ] Settings > general 탭에 "Figma 플러그인 연동" 섹션 추가
- [ ] API Key 목록에 `last_used_at` 표시 ("마지막 사용: 2분 전")
- [ ] 연결된 Figma 프로젝트 목록 표시 (figma_key 기준)
- [ ] 프로젝트별 최근 동기화 정보 표시 (타입, 버전, 시각)

### 2.2 제외
- 실시간 WebSocket 알림 (단순 polling/정적 표시만)
- 전송 데이터 상세 뷰어 (별도 기능으로 분리)
- 앱 내 token merge 로직

---

## 3. 기술 설계

### 3.1 데이터 소스

| 정보 | 쿼리 대상 |
|------|----------|
| API Key 마지막 사용 | `api_keys.last_used_at` |
| 연결된 Figma 파일 | `projects` (figma_key, name) |
| 최근 토큰 동기화 | `token_snapshots` (version, created_at) |
| 최근 기타 동기화 | `sync_payloads` (type, version, created_at) |

### 3.2 Server Action 추가

**파일**: `src/lib/actions/sync-status.ts`

```ts
// 최근 동기화 요약 조회
export async function getSyncStatus() {
  // api_keys - last_used_at 포함 전체 목록
  // projects - figma_key가 있는 것만
  // 각 project별 최신 sync_payloads 1개씩 (type별)
  // 각 project별 최신 token_snapshots 1개
}
```

### 3.3 UI 구조

Settings > general 탭 하단에 추가:

```
┌─────────────────────────────────────────┐
│ Figma 플러그인 연동                      │
│                                         │
│ API Keys                                │
│  • figd_MUvE...  마지막 사용: 2분 전    │
│                                         │
│ 연결된 Figma 파일                        │
│  • MyDesignSystem.fig                   │
│    토큰: v3 (2026-04-01 15:30)          │
│    아이콘: v1 (2026-04-01 14:10)        │
│    테마: 미전송                          │
└─────────────────────────────────────────┘
```

---

## 4. 구현 계획

### 구현 대상 프로젝트
**PixelForge 앱** (`/Users/jeonghak/work/pixelforge/`)

### 파일 변경 목록

| 파일 | 작업 |
|------|------|
| `src/lib/actions/sync-status.ts` | Server Action 신규 생성 |
| `src/app/(ide)/settings/page.tsx` | getSyncStatus 호출 + 연동 상태 섹션 UI 추가 |

### 구현 순서
1. `sync-status.ts` Server Action 작성 (DB 쿼리)
2. `settings/page.tsx`에 useEffect로 로드 + UI 렌더링
3. 날짜 포맷 유틸 (relative time: "2분 전", "3일 전")

---

## 5. 완료 기준

- [ ] Settings 페이지에서 API Key 마지막 사용 시각 확인 가능
- [ ] 연결된 Figma 파일 목록 표시
- [ ] 각 파일별 동기화 타입 + 버전 + 시각 표시
- [ ] 전송된 데이터가 없으면 "미전송" 표시
- [ ] 빌드 성공 (`npm run build`)

---

## 6. 예상 소요

구현 난이도: 낮음 (DB 쿼리 + UI 컴포넌트)
예상 파일 수: 2개 수정
