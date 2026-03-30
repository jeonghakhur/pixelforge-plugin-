# Plan: Component Registry

> **Summary**: Figma 컴포넌트를 선택해 Radix UI + CSS Modules 기반의 접근성 준수 코드를 생성하고,
> 파일 단위 레지스트리에 저장해 동일 컴포넌트는 항상 동일한 코드를 반환
>
> **Project**: PixelForge Token Extractor (Figma Plugin)
> **Version**: 0.1.0
> **Date**: 2026-03-30
> **Status**: Draft

---

## Executive Summary

| 관점 | 내용 |
|------|------|
| **Problem** | Figma 컴포넌트를 코드로 옮길 때 매번 수작업 + 결과물이 불일치해 여러 페이지에서 같은 컴포넌트가 다르게 구현됨 |
| **Solution** | 컴포넌트 코드를 파일 단위 레지스트리에 저장해 동일 컴포넌트는 항상 동일 코드 반환, Radix UI로 접근성 보장 |
| **Function/UX Effect** | 한 번 저장된 컴포넌트는 어느 페이지에서 선택해도 저장된 코드가 즉시 표시됨 |
| **Core Value** | Figma 디자인 → 접근성 준수 컴포넌트 코드의 단일 진실 공급원(Single Source of Truth) 확립 |

---

## 1. 개요

### 1.1 목적

- Figma 컴포넌트 선택 → Radix UI 기반 코드 생성 → 레지스트리 저장
- 이후 동일 컴포넌트 선택 시 저장된 코드를 즉시 반환
- 접근성(WCAG 2.1 AA)은 Radix UI 프리미티브가 담당

### 1.2 핵심 원칙

```
1. 동일 컴포넌트 = 동일 코드
   레지스트리에 저장된 컴포넌트는 수동 수정 전까지 항상 동일한 결과 반환

2. 접근성은 라이브러리가 담당
   키보드 인터랙션 / ARIA / 포커스 관리를 직접 구현하지 않고 Radix UI에 위임

3. 가독성 있는 CSS
   Tailwind 미사용. CSS Modules로 스타일 격리, var() 토큰 연동
```

### 1.3 스타일 방식 결정

| 방식 | 기본값 | 이유 |
|------|--------|------|
| **CSS Modules** | ✓ 기본 | CSS 그대로 써서 가독성 최고, Next.js/Vite 기본 지원, 토큰 var() 자연 연동 |
| **Styled-Components** | 선택 | styled-components 환경 팀을 위한 대안 |
| Tailwind | 미지원 | 가독성 저하, 타 라이브러리 충돌 |
| Inline | 미지원 | :hover/:focus 불가, Radix와 호환성 낮음 |

---

## 2. 구현 범위

### 2.1 In Scope

- [ ] 컴포넌트 타입 감지 (레이아웃 vs 인터랙티브) + 수동 선택
- [ ] Radix UI 프리미티브 매핑 (Button, Dialog, Select, Tabs, Tooltip, Checkbox 등)
- [ ] 레이아웃 컴포넌트 → 시맨틱 HTML + ARIA landmark
- [ ] CSS Modules 코드 생성 (`.tsx` + `.module.css`)
- [ ] Styled-Components 코드 생성 (`.tsx` 단일 파일)
- [ ] 파일 단위 컴포넌트 레지스트리 (`figma.clientStorage`)
- [ ] 레지스트리 CRUD: 저장 / 수정 / 업데이트(Figma 재추출) / 삭제
- [ ] 레지스트리 목록 UI (검색, 불러오기, 삭제)
- [ ] PixelForge 디자인 토큰 `var()` 자동 연동
- [ ] TypeScript 옵션

### 2.2 Out of Scope

- Tailwind 출력
- Emotion / Stitches 등 기타 CSS-in-JS
- Bootstrap React 연동 (추후 별도 플랜)
- HTML(비 React) 출력에 Radix 적용 (Radix는 React 전용)
- 컴포넌트 버전 히스토리

---

## 3. 요구사항

### 3.1 기능 요구사항

| ID | 요구사항 | 우선순위 |
|----|----------|----------|
| FR-01 | Figma 노드 선택 시 마스터 컴포넌트 ID + 이름 자동 추출 | 필수 |
| FR-02 | 컴포넌트 타입 자동 감지 (이름 키워드 기반) | 필수 |
| FR-03 | 타입 감지 실패 시 사용자 직접 선택 UI | 필수 |
| FR-04 | Radix 매핑 테이블로 컴포넌트 코드 생성 | 필수 |
| FR-05 | 레이아웃 타입은 시맨틱 HTML + ARIA landmark 생성 | 필수 |
| FR-06 | CSS Modules 기본 출력 (`.tsx` + `.module.css`) | 필수 |
| FR-07 | Styled-Components 선택 출력 (`.tsx` 단일) | 필수 |
| FR-08 | 컴포넌트명 입력 후 레지스트리 저장 | 필수 |
| FR-09 | 동일 컴포넌트 재선택 시 레지스트리 코드 즉시 반환 | 필수 |
| FR-10 | 저장된 코드 직접 수정(Edit) 기능 | 필수 |
| FR-11 | Figma 원본 변경 시 "업데이트" (재추출 후 덮어쓰기, 확인 요구) | 필수 |
| FR-12 | 레지스트리에서 컴포넌트 삭제 | 필수 |
| FR-13 | 레지스트리 목록 UI (이름 검색, 목록 표시) | 필수 |
| FR-14 | PixelForge 토큰을 `var(--token-name)` 형태로 CSS에 자동 삽입 | 필수 |
| FR-15 | TypeScript 타입 생성 옵션 | 선택 |
| FR-16 | 레지스트리 JSON 내보내기 / 가져오기 | 선택 |

### 3.2 비기능 요구사항

| 항목 | 기준 |
|------|------|
| 레지스트리 범위 | 현재 Figma 파일 단위 (fileKey prefix) |
| 저장소 | `figma.clientStorage` |
| 접근성 기준 | WCAG 2.1 AA (Radix UI 기본 준수) |
| 외부 의존성 | 생성 코드: `@radix-ui/*`, `styled-components`(선택) |
| 플러그인 자체 | 외부 라이브러리 없음 (순수 JS) |

---

## 4. 설계 방향

### 4.1 컴포넌트 타입 분류

```
인터랙티브 → Radix UI 프리미티브 사용
레이아웃   → 시맨틱 HTML + ARIA landmark
```

#### Radix 매핑 테이블

| 키워드 (Figma 이름) | Radix 패키지 | 주요 요소 |
|---------------------|-------------|----------|
| button, btn, cta | `@radix-ui/react-primitive` | `<button>` + aria |
| dialog, modal, overlay | `@radix-ui/react-dialog` | Root/Portal/Overlay/Content |
| select, dropdown | `@radix-ui/react-select` | Root/Trigger/Content/Item |
| tab, tabs | `@radix-ui/react-tabs` | Root/List/Trigger/Content |
| tooltip | `@radix-ui/react-tooltip` | Provider/Root/Trigger/Content |
| checkbox | `@radix-ui/react-checkbox` | Root/Indicator |
| switch, toggle | `@radix-ui/react-switch` | Root/Thumb |
| accordion | `@radix-ui/react-accordion` | Root/Item/Trigger/Content |
| popover | `@radix-ui/react-popover` | Root/Trigger/Content |

#### 레이아웃 시맨틱 매핑

| 키워드 | 시맨틱 태그 | ARIA |
|--------|------------|------|
| header, gnb, nav | `<header>`, `<nav>` | `aria-label` |
| footer | `<footer>` | - |
| sidebar | `<aside>` | `aria-label` |
| card, item | `<article>` | - |
| section, panel | `<section>` | `aria-labelledby` |
| 기타 | `<div>` | - |

### 4.2 레지스트리 데이터 모델

```typescript
interface ComponentEntry {
  name: string;                          // 사용자 지정 이름 "PrimaryButton"
  figmaNodeName: string;                 // Figma 원본 이름 "Button/Primary"
  figmaMasterNodeId: string;             // 마스터 컴포넌트 ID (식별 키)
  componentType: 'interactive' | 'layout';
  radixPackage: string | null;           // "@radix-ui/react-dialog" | null
  styleMode: 'css-modules' | 'styled';
  lang: 'react';
  useTs: boolean;
  code: {
    tsx: string;                         // 컴포넌트 코드
    css?: string;                        // CSS Modules 방식일 때
  };
  createdAt: string;                     // ISO 날짜
  updatedAt: string;
}

interface ComponentRegistry {
  [figmaMasterNodeId: string]: ComponentEntry;
}
```

저장 키: `pf-registry-{figmaFileKey}`

### 4.3 식별 흐름

```
[노드 선택]
    ↓
InstanceNode? → mainComponent.id 추출
ComponentNode? → node.id 추출
기타(Frame 등) → node.id 사용 (레이아웃으로 처리)
    ↓
레지스트리에 masterNodeId 있음?
  Yes → 저장된 코드 표시 + [수정] [업데이트] [삭제] 버튼
  No  → 타입 감지 → 코드 생성 → 이름 입력 → [저장]
```

### 4.4 생성 코드 예시

#### CSS Modules 방식 — Dialog

```tsx
// ConfirmModal.tsx
import * as Dialog from '@radix-ui/react-dialog';
import styles from './ConfirmModal.module.css';

interface ConfirmModalProps {
  open: boolean;
  onClose: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
}

export const ConfirmModal = ({ open, onClose, title, children }: ConfirmModalProps) => (
  <Dialog.Root open={open} onOpenChange={onClose}>
    <Dialog.Portal>
      <Dialog.Overlay className={styles.overlay} />
      <Dialog.Content className={styles.content} aria-describedby={undefined}>
        <Dialog.Title className={styles.title}>{title}</Dialog.Title>
        {children}
        <Dialog.Close asChild>
          <button className={styles.closeBtn} aria-label="닫기">×</button>
        </Dialog.Close>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>
);
```

```css
/* ConfirmModal.module.css */
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  animation: fadeIn 150ms ease;
}

.content {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: var(--color-surface);
  border-radius: var(--radius-md);
  padding: 24px;
  width: 480px;
  box-shadow: var(--shadow-modal);
}

.title {
  font-size: var(--text-lg);
  font-weight: 600;
  margin-bottom: 16px;
  color: var(--color-text-primary);
}

.closeBtn {
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text-secondary);
}

.closeBtn:focus-visible {
  outline: 2px solid var(--color-brand-primary);
  outline-offset: 2px;
  border-radius: 4px;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
```

#### Styled-Components 방식 — Dialog

```tsx
// ConfirmModal.tsx
import * as Dialog from '@radix-ui/react-dialog';
import styled, { keyframes } from 'styled-components';

const fadeIn = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
`;

const Overlay = styled(Dialog.Overlay)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  animation: ${fadeIn} 150ms ease;
`;

const Content = styled(Dialog.Content)`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: var(--color-surface);
  border-radius: var(--radius-md);
  padding: 24px;
  width: 480px;
  box-shadow: var(--shadow-modal);
`;

const Title = styled(Dialog.Title)`
  font-size: var(--text-lg);
  font-weight: 600;
  margin-bottom: 16px;
`;

export const ConfirmModal = ({ open, onClose, title, children }) => (
  <Dialog.Root open={open} onOpenChange={onClose}>
    <Dialog.Portal>
      <Overlay />
      <Content aria-describedby={undefined}>
        <Title>{title}</Title>
        {children}
      </Content>
    </Dialog.Portal>
  </Dialog.Root>
);
```

### 4.5 UI 레이아웃

```
┌─────────────────────────────────────────┐
│ 컴포넌트                                  │
├─────────────────────────────────────────┤
│ 선택된 노드: Button/Primary   [레지스트리] │  ← 탭
├─────────────────────────────────────────┤
│                                         │
│  [코드 생성]        [레지스트리 목록]      │
│                                         │
│  ── 코드 생성 탭 ──────────────────────  │
│  컴포넌트 타입: [자동감지: Button ▼]      │
│  스타일:        [CSS Modules] [Styled]   │
│  언어:          [React]  [✓ TypeScript]  │
│                                         │
│  [코드 생성]                             │
│                                         │
│  ── 결과 ────────────────────────────── │
│  [TSX] [CSS]          [복사] [저장]      │
│  ┌───────────────────────────────────┐  │
│  │ import * as Dialog from ...       │  │
│  └───────────────────────────────────┘  │
│                                         │
│  컴포넌트명: [PrimaryButton      ]       │
│                          [레지스트리 저장]│
└─────────────────────────────────────────┘
```

```
── 레지스트리 목록 탭 ─────────────────────
  🔍 [검색...                    ]
  ─────────────────────────────────
  PrimaryButton    Button  CSS  수정됨 3일전  [불러오기] [삭제]
  ConfirmModal     Dialog  CSS  저장됨 1주전  [불러오기] [삭제]
  MainNav          Layout  CSS  저장됨 5일전  [불러오기] [삭제]
  ─────────────────────────────────
  총 3개 저장됨          [전체 내보내기]
```

### 4.6 CRUD 동작

| 동작 | 트리거 | 동작 설명 |
|------|--------|----------|
| **저장** | 코드 생성 후 이름 입력 → 저장 | 신규 항목 레지스트리 등록 |
| **불러오기** | 동일 노드 재선택 또는 목록에서 선택 | 저장된 코드 즉시 표시 |
| **수정(Edit)** | 저장된 코드 표시 화면에서 직접 편집 | textarea 편집 가능 상태로 전환 후 저장 |
| **업데이트** | Figma 원본 변경 후 "업데이트" 버튼 | 재추출 → "기존 코드를 덮어씁니다" 확인 → 저장 |
| **삭제** | 목록에서 [삭제] | 확인 후 레지스트리에서 제거 |

---

## 5. 기술 결정

| 항목 | 결정 | 이유 |
|------|------|------|
| 접근성 구현 | Radix UI 위임 | 직접 구현 시 범위 초과, Radix가 WCAG 준수 |
| 스타일 기본 | CSS Modules | 가독성 최고, 충돌 없음, 번들러 기본 지원 |
| Tailwind 미지원 | 의도적 제외 | 가독성 저하 + 타 라이브러리 충돌 이슈 |
| 레지스트리 저장소 | `figma.clientStorage` | Figma 공식 API, 플러그인 재시작 후 유지 |
| 레지스트리 범위 | 파일 단위 | 키: `pf-registry-{fileKey}` |
| 식별 키 | `mainComponent.id` | 인스턴스 선택 시에도 마스터로 추적 |
| 재생성 용어 | "업데이트"로 통일 | "재생성" 의미 모호, 수정과 구분 |

---

## 6. 완료 기준

- [ ] Figma 노드 선택 → 마스터 컴포넌트 ID 추출 동작
- [ ] 컴포넌트 타입 자동 감지 (button/dialog/select 등 키워드)
- [ ] Radix UI 코드 생성 (최소 Button, Dialog, Tabs 3종)
- [ ] 레이아웃 컴포넌트 시맨틱 HTML 생성
- [ ] CSS Modules 출력 (TSX + CSS 분리)
- [ ] Styled-Components 출력 (TSX 단일)
- [ ] PixelForge 토큰 `var()` 자동 삽입
- [ ] 레지스트리 저장 / 불러오기 / 수정 / 업데이트 / 삭제 전부 동작
- [ ] 동일 노드 재선택 시 저장된 코드 즉시 반환
- [ ] 레지스트리 목록 UI (검색 + 목록)

---

## 7. 리스크

| 리스크 | 영향 | 대응 |
|--------|------|------|
| Figma 노드가 마스터 컴포넌트가 아닌 경우 | ID 추출 실패 | Frame/Group은 node.id 사용, 레이아웃으로 처리 |
| 키워드 감지 실패 (애매한 이름) | 타입 오감지 | 수동 선택 UI 항상 제공 |
| clientStorage 용량 초과 (~1MB) | 저장 실패 | 저장 전 용량 체크, 초과 시 경고 + 오래된 항목 삭제 안내 |
| 토큰 미추출 상태에서 var() 삽입 | CSS 변수 미정의 | 추출 탭에서 토큰 추출 후 사용 안내 메시지 |

---

## 8. 다음 단계

1. [ ] Design 문서 작성 (`component-registry.design.md`)
2. [ ] Radix 매핑 테이블 완성 (10종 이상)
3. [ ] 레지스트리 저장/조회 함수 구현 (`code.ts`)
4. [ ] 코드 생성 함수 구현 (`ui.html` JS)
5. [ ] 레지스트리 목록 UI 구현
