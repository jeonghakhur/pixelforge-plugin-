# Plan: Image Assets Export

> **Summary**: Figma 파일 내 이미지 에셋(IMAGE fill을 가진 노드)을 탐지하고 PNG/JPG 포맷으로 내보내는 기능
>
> **Project**: PixelForge Token Extractor (Figma Plugin)
> **Version**: 0.1.0
> **Date**: 2026-03-30
> **Status**: Draft

---

## Executive Summary

| 관점 | 내용 |
|------|------|
| **Problem** | 현재 플러그인은 토큰/스타일/아이콘만 추출하며, Figma에 임베드된 이미지 에셋은 수동으로 각각 Export해야 함 |
| **Solution** | IMAGE fill 노드 자동 탐지 + 선택 모드 지원, PNG/JPG 포맷 및 배율(1x/2x/3x) 선택 후 ZIP으로 일괄 다운로드 |
| **Function/UX Effect** | 디자이너가 수십 개의 이미지를 한 번에 추출 가능. 에셋 핸드오프 시간을 수작업 대비 대폭 단축 |
| **Core Value** | PixelForge 파이프라인에 이미지 에셋 레이어 추가 — 토큰 + 아이콘 + 이미지까지 단일 플러그인으로 완결 |

---

## 1. 개요

### 1.1 목적

Figma 파일에 포함된 이미지 에셋을 자동으로 탐지하여, 원하는 포맷(PNG/JPG)과 배율(1×/2×/3×)로 일괄 추출한다.
단일 파일 다운로드 또는 ZIP 묶음 다운로드를 지원하며, 기존 추출 탭 구조에 "Images" 탭으로 통합한다.

### 1.2 배경

현재 플러그인 추출 대상:
- Variables (색상, 간격, 반경 등)
- Styles (Paint, Text, Effect)
- Icons (SVG 컴포넌트)

**누락된 에셋 유형**: Figma에서 `IMAGE` fill이 적용된 노드(배너, 일러스트, 사진 등)는 플러그인으로 추출 불가.
디자이너가 Figma 우측 패널 → Export 설정을 각 노드마다 수동으로 반복해야 하는 비효율이 존재한다.

### 1.3 관련 문서

- `docs/01-plan/features/css-generation.plan.md` — 출력 탭 구조 참조
- `docs/02-design/features/css-generation.design.md` — 탭/다운로드 UI 패턴 참조
- `src/code.ts` — `exportIcons()` / `exportIconsAll()` 구현 패턴 참조

---

## 2. 구현 범위

### 2.1 In Scope

- [ ] IMAGE fill을 포함한 노드 자동 탐지 (전체 페이지 / 선택 영역)
- [ ] 노드 이름 기반 에셋 명칭 자동 생성 (kebab-case)
- [ ] 포맷 선택: PNG / JPG
- [ ] 배율 복수 선택: 1× / 2× / 3× 체크박스 (기본: 1×, 2× 선택)
- [ ] 이미지 목록 미리보기 (썸네일 + 이름 + 크기)
- [ ] 개별 다운로드 (단일 파일)
- [ ] ZIP 일괄 다운로드 (fflate 또는 JSZip 없이 순수 JS로 처리)
- [ ] 선택 모드 연동 (현재 페이지 전체 / Figma 선택 노드)
- [ ] 기존 "Images" 탭으로 메인 탭에 추가 통합

### 2.2 Out of Scope

- PDF 포맷 출력 — 후속 작업
- 외부 CDN/스토리지로 자동 업로드 — PixelForge 앱 연동 시 처리
- 이미지 최적화(압축, WebP 변환) — 후속 작업
- 중첩 폴더 구조 유지 ZIP — 단순 flat ZIP으로 우선 구현
- 애니메이션/GIF 익스포트 — Figma API 미지원

---

## 3. 요구사항

### 3.1 기능 요구사항

| ID | 요구사항 | 우선순위 |
|----|----------|----------|
| FR-01 | 현재 페이지의 모든 노드를 순회하여 `IMAGE` fill을 가진 노드 목록 반환 | 필수 |
| FR-02 | 선택 모드: 선택된 노드 범위 내에서만 탐지 | 필수 |
| FR-03 | 탐지된 이미지 노드에 대해 `exportAsync` 호출 (PNG/JPG, 배율 적용) | 필수 |
| FR-04 | 추출 결과를 base64 인코딩하여 UI로 전달 | 필수 |
| FR-05 | UI에서 이미지 썸네일 미리보기 렌더링 (img src=`data:image/...`) | 필수 |
| FR-06 | 개별 이미지 다운로드 버튼 (Blob URL 방식) | 필수 |
| FR-07 | "전체 다운로드" 클릭 시 순수 JS ZIP 생성 후 다운로드 | 필수 |
| FR-08 | 포맷 선택 UI: PNG / JPG 라디오 또는 드롭다운 | 필수 |
| FR-09 | 배율 복수 선택 UI: 1× / 2× / 3× 체크박스 — 선택된 배율 모두 개별 파일로 추출 (기본: 1×, 2×) | 필수 |
| FR-10 | 메인 탭에 "Images" 탭 추가, 기존 탭과 일관된 스타일 유지 | 필수 |
| FR-11 | 탐지된 이미지 없을 때 빈 상태 안내 메시지 표시 | 필수 |
| FR-12 | 이미지명 중복 시 자동 suffix(`-1`, `-2`) 처리 | 선택 |
| FR-13 | 이미지 탐지 옵션: "IMAGE fill 노드만" / "이름 패턴 포함" 토글 | 선택 |

### 3.2 비기능 요구사항

| 항목 | 기준 |
|------|------|
| 대량 추출 성능 | 50개 이하 이미지: 10초 이내 처리 |
| 메모리 | base64 전달 후 UI에서 즉시 Blob 변환, 불필요한 대형 배열 보유 최소화 |
| 플러그인 제약 | 외부 런타임 라이브러리 없음 — ZIP은 순수 JS 구현 (deflate 없이 store 방식) |
| 파일명 안전성 | 특수문자 제거, 공백 → 하이픈, 중복 방지 |
| UI 크기 | 기존 760×720 유지 (탭 추가만으로 레이아웃 변경 최소화) |

---

## 4. 설계 방향

### 4.1 이미지 노드 탐지 로직

```
figma.currentPage.findAll() 또는 선택 노드 순회
  ↓
각 노드의 fills 배열 검사
  → paint.type === 'IMAGE' 인 fill 존재 시 → 에셋 후보
  ↓
노드 타입 확인
  → RECTANGLE, FRAME, COMPONENT, INSTANCE, GROUP → 포함
  → TEXT, CONNECTOR 등 → 제외
  ↓
ImageData 객체 생성:
  { id, name, kebab, width, height, nodeType }
```

### 4.2 메시지 플로우

```
UI: postMessage({ type: 'extract-images', options: { format, scales, useSelection } })
  ↓
code.ts: extractImages(options)
  → findImageNodes() — 노드 탐지
  → 각 노드에 exportAsync({ format, constraint: { type: 'SCALE', value: scale } })
  → Uint8Array → base64 변환
  → figma.ui.postMessage({ type: 'extract-images-result', data: ImageAsset[] })
  ↓
UI: 수신 후 썸네일 렌더링, 다운로드 버튼 활성화
```

### 4.3 ZIP 생성 전략 (순수 JS)

Figma 플러그인 환경에서 외부 라이브러리 없이 ZIP을 생성하는 방법:

```
옵션 A: Store-only ZIP (압축 없음, DEFLATE 알고리즘 미사용)
  - Local File Header + 파일 데이터 + Central Directory 직접 구성
  - 구현 복잡도 중간, 파일 크기는 크지만 이미지는 이미 압축됨

옵션 B: 개별 파일 순차 다운로드
  - ZIP 불필요, 각 이미지를 Blob URL로 개별 다운로드
  - 구현 단순, 파일 수가 많으면 브라우저 다운로드 팝업 다수 발생

→ 기본: 옵션 A (Store ZIP) 구현
  폴백: 이미지 5개 이하이면 옵션 B 자동 선택
```

### 4.4 UI 레이아웃 — Images 탭

```
┌──────────────────────────────────────────┐
│  Header                                  │
├──────────────────────────────────────────┤
│  [Variables] [Styles] [Icons] [Images] ← │  ← 메인 탭 추가
├──────────────────────────────────────────┤
│  옵션 바:                                │
│  Format: [PNG ▼]   Scale: [☑1× ☑2× ☐3×] │
│  Source: [● 전체 페이지  ○ 선택 영역]   │
│  [이미지 추출]                           │
├──────────────────────────────────────────┤
│  ┌────┐ image-name.png    800×600  [⬇]  │
│  │ 🖼 │ image-banner.png  1440×400 [⬇]  │
│  └────┘ ...                              │
├──────────────────────────────────────────┤
│  [⬇ 전체 ZIP 다운로드 (N개)]            │
└──────────────────────────────────────────┘
```

### 4.5 데이터 구조

```typescript
interface ImageData {
  id: string;
  name: string;
  kebab: string;
  nodeType: string;
  width: number;
  height: number;
}

// 배율별로 개별 파일 생성 — e.g. image-name@1x.png, image-name@2x.png
interface ImageAsset extends ImageData {
  format: 'PNG' | 'JPG';
  scale: 1 | 2 | 3;
  fileName: string;        // "{kebab}@{scale}x.{ext}"
  base64: string;          // data URL prefix 없이 순수 base64
  mimeType: string;        // 'image/png' | 'image/jpeg'
  byteSize: number;
}

interface ExtractImagesOptions {
  format: 'PNG' | 'JPG';
  scales: Array<1 | 2 | 3>; // 복수 선택 — 배율마다 별도 파일 생성
  useSelection: boolean;
}
```

---

## 5. 기술 결정

| 항목 | 결정 | 이유 |
|------|------|------|
| 바이너리 전달 방식 | base64 문자열 | postMessage는 직렬화 가능한 데이터만 허용, Uint8Array 직접 전달 불가 |
| ZIP 구현 | Store-only ZIP (순수 JS) | 외부 라이브러리 없음 제약; 이미지는 이미 압축되어 있어 deflate 효과 미미 |
| 썸네일 렌더링 | `<img src="data:image/...">` | Figma 플러그인 iframe 환경에서 Blob URL 생성 가능 |
| 탐지 기준 | IMAGE fill 타입 우선, 이름 패턴은 선택 옵션 | 명확한 기준, false positive 최소화 |
| 탭 통합 위치 | 기존 메인 탭 마지막에 "Images" 추가 | 기존 탭 구조 변경 최소화 |
| 다중 배율 파일명 충돌 | ZIP 내 동명 파일 | `{kebab}@1x.png`, `{kebab}@2x.png` suffix로 자동 구분 |

---

## 6. 완료 기준

- [ ] IMAGE fill 노드가 자동으로 탐지됨 (전체 페이지 / 선택 모드)
- [ ] PNG / JPG 포맷으로 선택한 배율(1×/2×/3× 복수 선택) 각각 추출 성공
- [ ] 파일명에 `@1x`, `@2x`, `@3x` suffix 자동 적용
- [ ] 썸네일이 UI에 렌더링됨
- [ ] 개별 다운로드 버튼 동작
- [ ] ZIP 일괄 다운로드 (2개 이상일 때) 동작
- [ ] "Images" 탭이 기존 탭과 스타일 일관성 유지
- [ ] 이미지 없을 때 빈 상태 안내 표시
- [ ] 기존 Variables / Styles / Icons 탭 기능에 영향 없음

---

## 7. 리스크

| 리스크 | 영향 | 대응 |
|--------|------|------|
| 대형 이미지 base64 변환 시 UI 메모리 부족 | 플러그인 크래시 | 단일 이미지 10MB 초과 시 경고, 50개 초과 시 배치 처리 |
| postMessage 페이로드 크기 제한 | 전송 실패 | 이미지별 개별 postMessage로 스트리밍 방식 전환 가능 |
| Figma 노드에 exportAsync 미지원 타입 | 오류 | try/catch 후 skip, UI에 오류 노드 표시 |
| Store ZIP 브라우저 호환성 | 다운로드 실패 | 주요 브라우저(Chrome 기반 Figma) 테스트 후 확인 |
| IMAGE fill 탐지 오탐 (아이콘에 이미지 fill 사용 등) | 불필요한 노드 포함 | 이름 패턴 필터 옵션 제공, 사용자가 직접 제외 가능하도록 체크박스 UI |

---

## 8. 다음 단계

1. [ ] Design 문서 작성 (`image-assets-export.design.md`)
2. [ ] `findImageNodes()` 함수 스펙 확정 (탐지 기준 세부 정의)
3. [ ] Store-only ZIP 유틸 구현 및 단위 테스트 (브라우저 콘솔에서 검증)
4. [ ] UI "Images" 탭 마크업 작성
5. [ ] `extractImages()` + `code.ts` 메시지 핸들러 구현
