// src/extractors/text-role.ts
// TEXT 노드 → TextRole 의미론 추론
// 우선순위: 이름 매칭 → 부모 힌트 → 형제 위치 → 폴백

import type { TextRole } from './types';

/**
 * TEXT 노드의 의미론적 역할을 추론한다.
 * 결정적(deterministic) 알고리즘 — 동일 입력이면 동일 출력.
 */
export function inferTextRole(node: TextNode): TextRole {
  const name = (node.name || '').toLowerCase().trim();

  // 1) 이름 기반 직접 매칭
  const nameMatch = matchByName(name);
  if (nameMatch !== 'unknown') return nameMatch;

  // 2) 부모 노드 힌트
  const parentMatch = matchByParent(node);
  if (parentMatch !== 'unknown') return parentMatch;

  // 3) 형제 내 위치 기반
  const positionMatch = matchByPosition(node);
  if (positionMatch !== 'unknown') return positionMatch;

  // 4) 폴백
  return 'unknown';
}

function matchByName(name: string): TextRole {
  const patterns: Array<[RegExp, TextRole]> = [
    [/\b(placeholder|placeholder text)\b/, 'placeholder'],
    [/\b(label|field label|form label)\b/, 'label'],
    [/\b(value|input value|selected)\b/, 'value'],
    [/\b(helper|hint|help text|helper text)\b/, 'helper'],
    [/\b(error|error message|validation)\b/, 'error'],
    [/\b(counter|char count|max length)\b/, 'counter'],
    [/\b(action|cta|button text|button label)\b/, 'action'],
    [/\b(title|heading|headline)\b/, 'title'],
    [/\b(description|subtitle|body)\b/, 'description'],
    [/\b(unit|suffix|prefix)\b/, 'unit'],
    [/\b(caption|footnote)\b/, 'caption'],
  ];
  for (const [re, role] of patterns) {
    if (re.test(name)) return role;
  }
  return 'unknown';
}

function matchByParent(node: TextNode): TextRole {
  const parent = node.parent;
  if (!parent) return 'unknown';
  const pname = (parent.name || '').toLowerCase();
  if (/\blabel\b/.test(pname)) return 'label';
  if (/\b(helper|hint)\b/.test(pname)) return 'helper';
  if (/\berror\b/.test(pname)) return 'error';
  if (/\bplaceholder\b/.test(pname)) return 'placeholder';
  if (/\bcounter\b/.test(pname)) return 'counter';
  if (/\b(button|cta)\b/.test(pname)) return 'action';
  return 'unknown';
}

function matchByPosition(node: TextNode): TextRole {
  const parent = node.parent;
  if (!parent || !('children' in parent)) return 'unknown';
  const siblings = ((parent as ChildrenMixin).children as readonly SceneNode[]).filter(
    (c): c is TextNode => c.type === 'TEXT'
  );
  if (siblings.length <= 1) return 'unknown';

  // y좌표 기준 정렬
  const sorted = [...siblings].sort((a, b) => a.y - b.y);
  const idx = sorted.indexOf(node);

  // 최상단 TEXT = label 가능성
  if (idx === 0 && sorted.length >= 2) return 'label';
  // 마지막 TEXT = helper 가능성
  if (idx === sorted.length - 1 && sorted.length >= 3) return 'helper';

  return 'unknown';
}
