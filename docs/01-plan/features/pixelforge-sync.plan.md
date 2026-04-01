# Plan: PixelForge 앱 연동 (자동 동기화)

## Executive Summary

| 항목 | 내용 |
|------|------|
| Feature | pixelforge-sync |
| 날짜 | 2026-03-31 |
| 단계 | Plan |

| 관점 | 내용 |
|------|------|
| Problem | 플러그인에서 추출한 토큰/아이콘/이미지를 수동으로 복사해서 앱에 업로드해야 함 |
| Solution | 탭별 "전송" 버튼으로 PixelForge 앱에 자동 전송 및 저장 |
| Core Value | Figma → PixelForge 원클릭 파이프라인 완성 |

---

## 확정된 설계

| 항목 | 결정 |
|------|------|
| 전송 데이터 | 탭별 전부 (토큰/아이콘/이미지/테마/컴포넌트) |
| 전송 방식 | 탭별 "PixelForge로 전송" 버튼 (설정 완료 시에만 표시) |
| 인증 | PixelForge 앱에서 API 키 발급 → 플러그인 설정 탭에 입력 → localStorage 저장 |
| 프로젝트 매핑 | Figma 파일명으로 자동 생성 + 파일 키로 자동 매핑 |
| 버전 관리 | 해시 비교 → 변경된 경우만 새 버전 저장 |
| 실패 처리 | 에러 토스트 표시 |

---

## Phase 1 — 플러그인 (이 저장소)

### 1-1. 설정 탭 추가
- 기존 탭에 "설정(⚙️)" 탭 추가
- PixelForge URL 입력 (예: http://localhost:3847)
- API 키 입력 (password 타입)
- [연결 테스트] 버튼 → GET /api/ping 호출
- 설정 저장: `localStorage.setItem('pf_url', ...) + localStorage.setItem('pf_key', ...)`
- 설정 안 됨: 탭별 전송 버튼 숨김 + "PixelForge 연결 필요" 안내

### 1-2. 탭별 전송 버튼
각 탭 하단에 "PixelForge로 전송" 버튼 추가:
- 추출 탭: 토큰 JSON + CSS 전송 → POST /api/sync/tokens
- 아이콘 탭: SVG 배열 전송 → POST /api/sync/icons
- 이미지 탭: 이미지 base64 전송 → POST /api/sync/images
- 테마 탭: 다크/라이트 CSS 변수 전송 → POST /api/sync/themes
- 컴포넌트 탭: HTML/React 코드 전송 → POST /api/sync/components

### 1-3. 공통 전송 로직
```javascript
async function sendToPixelForge(endpoint, data) {
  const url = localStorage.getItem('pf_url')
  const key = localStorage.getItem('pf_key')
  if (!url || !key) return showToast('PixelForge 연결 필요', 'error')

  const res = await fetch(`${url}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-API-Key': key },
    body: JSON.stringify({ ...data, figmaFileKey: state.meta?.figmaFileKey, figmaFileName: state.meta?.fileName })
  })
  const result = await res.json()
  if (result.success) showToast(`전송 완료 (${result.tokenCount}개)`, 'success')
  else showToast(result.error || '전송 실패', 'error')
}
```

---

## Phase 2 — PixelForge 앱

### 2-1. API 키 발급/관리
- 설정 페이지에 "API 키" 섹션 추가
- 키 생성/재발급/삭제
- DB: `api_keys` 테이블 (id, key_hash, name, created_at, last_used_at)

### 2-2. 수신 엔드포인트
- `POST /api/sync/tokens` — 토큰 수신 + 버전 관리
- `POST /api/sync/icons` — 아이콘 저장
- `POST /api/sync/images` — 이미지 저장
- `POST /api/sync/themes` — 테마 CSS 저장
- `POST /api/sync/components` — 컴포넌트 코드 저장
- `GET /api/ping` — 연결 테스트

### 2-3. 버전 관리
- 전송된 데이터를 SHA-256 해시
- 이전 해시와 비교 → 동일하면 저장 안 함
- 다르면 새 버전으로 저장 (version 증가)
