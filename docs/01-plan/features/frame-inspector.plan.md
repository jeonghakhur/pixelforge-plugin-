# Frame Inspector Planning Document

> **Summary**: 선택한 Figma 프레임의 전체 구조(레이아웃·컴포넌트·스타일)를 StructureNode JSON으로 추출하여 앱에 전달, 퍼블리싱에 필요한 완전한 정보를 제공한다.
>
> **Project**: PixelForge Token Extractor
> **Version**: 0.1.0
> **Author**: jeonghak
> **Date**: 2026-04-21
> **Status**: Draft

---

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | 앱에서 Figma 프레임을 페이지로 퍼블리싱하려면 레이아웃·컴포넌트·스타일 정보가 필요하지만, 현재 플러그인은 토큰/아이콘만 추출하며 프레임 구조 전달 수단이 없다. |
| **Solution** | 플러그인이 선택된 FRAME 노드를 재귀 탐색하여 `StructureNode` JSON 트리를 생성하고 `export-frame-inspect` 메시지로 앱에 전송한다. |
| **Function/UX Effect** | 컴포넌트 탭에서 "프레임 구조 전송" 버튼 클릭 → FRAME 자동 감지 → 앱으로 전달. 앱은 `componentRef.componentKey`로 컴포넌트 DB를 매칭하여 퍼블리싱 가능한 페이지 코드를 생성한다. |
| **Core Value** | Figma 디자인과 픽셀 단위 일치하는 퍼블리싱 구조를 추가 작업 없이 1-click으로 앱에 전달한다. |

---

## 1. Overview

### 1.1 Purpose

Figma 캔버스에서 특정 프레임(페이지 레이아웃)을 선택하면, 플러그인이 그 내부 노드 트리를 완전히 분석하여 다음 정보를 포함한 구조 JSON을 앱으로 전송한다:

- 각 노드의 타입, 위치, 크기 (절대 + 부모 상대)
- Auto Layout → CSS Flexbox 속성 완전 매핑
- 컴포넌트 인스턴스 참조 (componentKey + variant props)
- 텍스트 스타일, 색상, 효과 등 시각 스타일
- 재귀 children 트리 (기본 8레벨)

### 1.2 Background

PixelForge 앱은 컴포넌트 DB를 보유하고 있으며, 플러그인이 전달한 `componentRef.componentKey`와 매칭하여 실제 React 컴포넌트 배치를 자동화할 계획이다. 현재는 이 데이터를 전달할 경로가 없어, 디자이너가 앱에서 수동으로 레이아웃을 재현해야 한다.

### 1.3 Related Documents

- Gemini 분석: 3단계 파이프라인 (Extraction → Transformation → Transmission) 제안
- 기존 `buildNodeTree()`: `src/extractors/index.ts` — 일부 로직 재사용 가능
- `componentPropertyReferences` 캡처: 이미 `buildNodeTree`에 포함됨

---

## 2. Scope

### 2.1 In Scope

- [ ] 선택 노드가 FRAME일 때 `export-frame-inspect` 메시지 처리 (code.ts)
- [ ] `StructureNode` 타입 정의 및 재귀 빌더 `buildStructureNode()` 구현
- [ ] Auto Layout → Flexbox CSS 속성 완전 매핑 (`layoutMode`, `primaryAxisAlignItems`, `counterAxisAlignItems`, `itemSpacing`, padding)
- [ ] INSTANCE 노드: `componentRef` (componentId, componentKey, componentName, properties)
- [ ] TEXT 노드: 텍스트 콘텐츠 + 타이포그래피 전체 속성
- [ ] 시각 스타일: fills, strokes, effects, cornerRadius, opacity, blendMode
- [ ] 절대 좌표 + 부모 상대 좌표 동시 포함
- [ ] Figma constraints (부모가 Auto Layout 아닐 때)
- [ ] 재귀 깊이 기본 8레벨 (옵션으로 조정 가능)
- [ ] UI: 컴포넌트 탭 "프레임 구조 전송" 버튼
- [ ] `frame-inspect-result` / `frame-inspect-error` 메시지 타입
- [ ] ARCHITECTURE.md 메시지 테이블 업데이트

### 2.2 Out of Scope

- 앱 측 컴포넌트 DB 매칭 로직 (앱 프로젝트 담당)
- CSS/React 코드 생성 (앱 담당)
- VECTOR, BOOLEAN_OPERATION 내부 경로 데이터
- 이미지 fill의 base64 인코딩 (별도 이미지 탭 사용)
- 다중 프레임 일괄 추출 (1차 범위 외)

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | 선택 노드가 FRAME/COMPONENT일 때 "프레임 구조 전송" UI 버튼 활성화 | High | Pending |
| FR-02 | `buildStructureNode(node, parentAbsX, parentAbsY, depth)` 재귀 함수로 StructureNode 트리 생성 | High | Pending |
| FR-03 | Auto Layout 노드: layoutMode·주축/교차축 정렬·gap·padding → layout 필드 완전 매핑 | High | Pending |
| FR-04 | Auto Layout 없는 노드: x·y (부모 상대) + absoluteX·absoluteY + constraints 포함 | High | Pending |
| FR-05 | INSTANCE 노드: `getMainComponentAsync()` 호출 → componentKey·componentName·componentPropertyReferences 포함 | High | Pending |
| FR-06 | TEXT 노드: textContent·fontSize·fontFamily·fontWeight·lineHeight·letterSpacing·textAlign·fills 포함 | Medium | Pending |
| FR-07 | fills·strokes·effects·cornerRadius·opacity·blendMode → appearance 필드 | Medium | Pending |
| FR-08 | 재귀 깊이 초과 시 `{ truncated: true }` 마커 삽입, 탐색 중단 | Medium | Pending |
| FR-09 | `FrameInspectResult` = meta (frameId·frameName·extractedAt·totalNodes·width·height) + root(StructureNode) | High | Pending |
| FR-10 | `export-frame-inspect` → `frame-inspect-result` / `frame-inspect-error` 메시지 타입 추가 | High | Pending |
| FR-11 | ARCHITECTURE.md 메시지 테이블 업데이트 | Low | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement |
|----------|----------|-------------|
| 성능 | 100개 노드 프레임 기준 3초 이내 완료 | 플러그인 내 Date.now() 타이머 |
| 페이로드 크기 | 최대 2MB 이하 (대형 프레임 경고) | JSON.stringify 길이 측정 |
| 안정성 | INSTANCE getMainComponentAsync 실패 시 componentRef 없이 계속 진행 | try/catch 보장 |
| 타입 안전 | StructureNode 인터페이스 strict TypeScript | tsc --noEmit |

---

## 4. Data Model

### 4.1 StructureNode

```typescript
interface StructureNode {
  id: string;
  name: string;
  type: string;           // NodeType 문자열
  visible: boolean;
  locked: boolean;

  geometry: {
    x: number;            // 부모 상대
    y: number;
    width: number;
    height: number;
    absoluteX: number;    // 캔버스 절대
    absoluteY: number;
    rotation: number;
  };

  layout: {
    mode: 'NONE' | 'HORIZONTAL' | 'VERTICAL' | 'WRAP';
    // Auto Layout 있을 때
    direction?: 'row' | 'column';
    wrap?: boolean;
    justifyContent?: string;   // flex-start|center|flex-end|space-between
    alignItems?: string;       // flex-start|center|flex-end|stretch|baseline
    gap?: number;
    padding?: { top: number; right: number; bottom: number; left: number };
    // Auto Layout 없을 때
    constraints?: {
      horizontal: 'MIN' | 'CENTER' | 'MAX' | 'STRETCH' | 'SCALE';
      vertical: 'MIN' | 'CENTER' | 'MAX' | 'STRETCH' | 'SCALE';
    };
    sizing?: {
      horizontal: 'FIXED' | 'HUG' | 'FILL';
      vertical: 'FIXED' | 'HUG' | 'FILL';
    };
  };

  appearance: {
    fills: Paint[];
    strokes: Paint[];
    strokeWeight: number;
    strokeAlign: string;
    cornerRadius: number | number[];
    opacity: number;
    effects: Effect[];
    blendMode: string;
    clipsContent?: boolean;   // FRAME 전용
  };

  text?: {
    content: string;
    fontSize: number;
    fontFamily: string;
    fontWeight: number;
    fontStyle: string;
    lineHeight: LineHeight;
    letterSpacing: LetterSpacing;
    textAlign: string;
    verticalAlign: string;
    textDecoration: string;
    textCase: string;
    fills: Paint[];
    styleId?: string;
  };

  componentRef?: {
    componentId: string;
    componentKey: string;
    componentSetKey?: string;
    componentName: string;
    componentSetName?: string;
    properties: Record<string, ComponentPropertyValue>;
  };

  truncated?: boolean;    // 깊이 초과 시
  children?: StructureNode[];
}

interface FrameInspectResult {
  meta: {
    frameId: string;
    frameName: string;
    extractedAt: string;
    totalNodes: number;
    width: number;
    height: number;
    maxDepth: number;
  };
  root: StructureNode;
}
```

---

## 5. Message Flow

```
UI (컴포넌트 탭 "프레임 구조 전송" 클릭)
  → code.ts: { type: 'export-frame-inspect', options: { maxDepth: 8 } }
    → 선택 노드 FRAME 검증
    → buildStructureNode(node, 0, 0, 0) 재귀 실행
    → FrameInspectResult 생성
  → UI: { type: 'frame-inspect-result', data: FrameInspectResult }
    → PixelForge 앱 전송 (기존 send 경로)

오류 시:
  → UI: { type: 'frame-inspect-error', message: string }
```

---

## 6. Success Criteria

### 6.1 Definition of Done

- [ ] FR-01 ~ FR-10 구현 완료
- [ ] 100개 노드 프레임 3초 이내 처리
- [ ] INSTANCE componentRef 정확히 포함 (Name·Key·properties)
- [ ] Auto Layout 프레임에서 Flexbox 매핑 검증 (direction·gap·padding 일치)
- [ ] `npm run build` 성공

### 6.2 Quality Criteria

- [ ] Zero TypeScript strict 오류
- [ ] try/catch로 부분 실패 시 전체 중단 없음
- [ ] ARCHITECTURE.md 메시지 테이블 업데이트 완료

---

## 7. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| INSTANCE getMainComponentAsync cross-page 에러 | Medium | Medium | try/catch → componentRef 생략, 계속 진행 |
| 대형 프레임(500+ 노드) 페이로드 초과 | High | Low | maxDepth 제한 + 2MB 경고 |
| fills에 IMAGE 타입 포함 시 데이터 비대 | Medium | Medium | IMAGE fill은 { type: 'IMAGE', imageHash } 참조만 포함, base64 제외 |
| componentPropertyReferences 구버전 API 미지원 | Low | Low | try/catch → properties: {} 폴백 |

---

## 8. Architecture Considerations

### 8.1 변경 파일

| 파일 | 변경 유형 | 내용 |
|------|----------|------|
| `src/code.ts` | 수정 | `StructureNode`·`FrameInspectResult` 타입, `buildStructureNode()`, `handleFrameInspect()` |
| `src/ui/tab-component.js` | 수정 | "프레임 구조 전송" 버튼, `frame-inspect-result` 수신 후 앱 전송 |
| `ARCHITECTURE.md` | 수정 | 메시지 타입 테이블 업데이트 |

### 8.2 신규 함수

```typescript
// 재귀 빌더 (핵심)
function buildStructureNode(
  node: SceneNode,
  parentAbsX: number,
  parentAbsY: number,
  depth: number,
  maxDepth: number
): StructureNode

// Auto Layout → Flexbox CSS 매핑
function mapAutoLayout(node: FrameNode | ComponentNode | InstanceNode): StructureNode['layout']

// INSTANCE componentRef 추출 (async)
async function extractComponentRef(node: InstanceNode): Promise<StructureNode['componentRef']>

// 메시지 핸들러
async function handleFrameInspect(options: { maxDepth?: number }): Promise<void>
```

### 8.3 구현 순서

1. `StructureNode` / `FrameInspectResult` 타입 정의
2. `mapAutoLayout()` 구현 + 단위 검증
3. `extractComponentRef()` 구현
4. `buildStructureNode()` 재귀 구현
5. `handleFrameInspect()` 메시지 핸들러
6. `src/ui/tab-component.js` 버튼 + 전송 로직
7. ARCHITECTURE.md 업데이트
8. `npm run build` + Figma 실제 프레임 검증

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-04-21 | Initial draft | jeonghak |
