// src/extractors/types.ts
// Node tree export 공용 타입 정의 — Figma 노드 구조를 100% Fidelity로
// 직렬화하기 위한 데이터 계약.

/** Figma 도형 노드의 종류 */
export type ShapeKind =
  | 'vector' // VECTOR
  | 'ellipse' // ELLIPSE
  | 'rectangle' // RECTANGLE
  | 'line' // LINE
  | 'polygon' // POLYGON
  | 'star' // STAR
  | 'boolean'; // BOOLEAN_OPERATION

/** TEXT 노드의 의미론적 역할 힌트 */
export type TextRole =
  | 'label' // 폼 필드의 라벨
  | 'placeholder' // 입력 전 힌트 텍스트
  | 'value' // 실제 값 / 버튼 라벨 / 표시 텍스트
  | 'helper' // 필드 아래 도움말
  | 'error' // 에러 메시지
  | 'counter' // 글자 수 카운터
  | 'action' // CTA 텍스트
  | 'title' // 제목
  | 'description' // 설명
  | 'unit' // 단위 표시 (px, %)
  | 'caption' // 캡션
  | 'unknown'; // 역할 추론 실패

/**
 * 컴포넌트 prop → 레이어 속성 바인딩 정보.
 * key: 'visible' | 'characters' | 'mainComponent'
 * value: componentPropertyDefinitions의 prop key (예: "Source#3287:4621")
 */
export interface ComponentPropRefs {
  visible?: string;
  characters?: string;
  mainComponent?: string;
}

/** 재귀 nodeTree 엔트리 */
export interface NodeTreeEntry {
  /** 경로 기반 ID ("root", "root.0", "root.1.0") */
  id: string;
  /** Figma 노드 타입 (SceneNode['type']) */
  type: string;
  /** Figma 노드 이름 */
  name: string;
  /** CSS 스타일 Record (getNodeStyles 결과) */
  styles: Record<string, string>;
  /** TEXT 노드: 실제 문자열 */
  characters?: string;
  /** TEXT 노드: 의미론적 역할 힌트 */
  textRole?: TextRole;
  /** 도형 노드: 도형 종류 */
  shape?: ShapeKind;
  /** VECTOR 노드: SVG path 문자열 (추출 가능한 경우) */
  pathData?: string;
  /** INSTANCE 노드: 참조 중인 마스터 컴포넌트 이름 */
  masterName?: string;
  /**
   * 이 레이어에 연결된 Component Property 바인딩.
   * 생성기가 prop 이름 추론 없이 실제 바인딩을 읽을 수 있게 한다.
   */
  propRefs?: ComponentPropRefs;
  /** 자식 노드 (leaf는 omit) */
  children?: NodeTreeEntry[];
}

/** buildNodeTree에 주입되는 실행 컨텍스트 */
export interface NodeTreeContext {
  /** 노드 → CSS 스타일 Record (closure 의존 로직은 호출자가 주입) */
  getStyles: (node: SceneNode) => Record<string, string>;
  /** 노드 → 안전한 텍스트 문자열 (master fallback 포함) */
  getText: (node: SceneNode) => string;
  /**
   * VECTOR/BOOLEAN_OPERATION 노드 ID → SVG path 문자열.
   * exportAsync로 사전 수집된 정확한 경로. 없으면 vectorPaths fallback.
   */
  vectorPathCache?: ReadonlyMap<string, string>;
}
