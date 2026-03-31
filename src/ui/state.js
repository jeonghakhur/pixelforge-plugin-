'use strict';

/**
 * 탭 간 공유 가변 상태
 * 모든 모듈에서 import { state } from './state.js' 로 접근
 * 객체 참조이므로 state.xxx = value 변경이 전 모듈에 즉시 반영됨
 */
export var state = {
  extractedData: null,
  tokenCacheInfo: null, // { savedAt, figmaFileId, figmaFileName }
  extractedColors: [], // {name, hex}[] — a11y matrix용
  lastSelection: { count: 0, names: [], nodeTypes: [], meta: null },
};
