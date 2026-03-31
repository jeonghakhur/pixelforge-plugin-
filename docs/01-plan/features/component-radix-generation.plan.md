# Plan: Component Radix Generation

> **Summary**: Figma 노드 구조를 분석하여 shadcn/ui 컨셉(Radix UI 프리미티브 + 팀 디자인 토큰)으로 실제 컴포넌트 코드를 생성하는 기능
>
> **Project**: PixelForge Token Extractor (Figma Plugin)
> **Version**: 0.2.0
> **Date**: 2026-03-30
> **Status**: Draft

---

## Executive Summary

| 관점 | 내용 |
|------|------|
| **Problem** | 현재 컴포넌트 코드 생성은 이름 기반 하드코딩 템플릿으로 더미 코드를 출력하며, Figma 노드의 실제 구조·텍스트·색상을 전혀 반영하지 않음 |
| **Solution** | shadcn/ui 컨셉 채택 — Figma 노드 패턴을 분석해 Radix UI 프리미티브를 선택하고, 추출된 디자인 토큰을 CSS variable로 연결하여 실제 사용 가능한 코드 생성 |
| **Function/UX Effect** | 선택한 프레임에서 클릭 한 번으로 Radix 기반 컴포넌트 코드와 토큰 연결 CSS가 생성되며, 사용자가 코드를 직접 소유하고 자유롭게 수정 가능 |
| **Core Value** | Figma 디자인 → 접근성 있는 Radix UI 코드로의 직접 변환 — 라이브러리 업데이트에 플러그인이 종속되지 않는 구조 확립 |

---

## 1. 개요

### 1.1 목적

Figma 노드를 선택하면 노드 내부 구조(자식 타입, 텍스트 내용, 색상)를 분석하여
shadcn/ui 스타일의 Radix UI 기반 컴포넌트 코드를 자동 생성한다.

- 구조 분석으로 컴포넌트 타입 **자동 감지** (Dialog, Button, Tabs 등)
- 실제 텍스트 노드 내용을 코드에 반영
- Figma Variables 토큰을 CSS variable(`--color-primary` 등)로 자동 치환
- 생성된 코드는 프로젝트에 복사하여 팀이 직접 소유·수정

### 1.2 배경

현재 코드 생성의 근본적 문제:

| 문제 | 설명 |
|------|------|
| 더미 템플릿 | `buildCSSModulesTSX(name, type)` — 이름과 드롭다운 선택만으로 고정 코드 출력 |
| Figma 무시 | 노드 안의 텍스트, 버튼 수, 실제 색상값 미반영 |
| 수동 타입 선택 | 사용자가 드롭다운에서 "Dialog" 직접 선택해야 함 |
| 라이브러리 종속 | Radix 버전 업 시 플러그인 전체 수정 필요 |

### 1.3 관련 문서

- `docs/01-plan/features/component-style-selector.plan.md` — 스타일 방식 선택 UI 참조
- `docs/02-design/features/component-style-selector.design.md` — CSS Modules/Styled 설계 참조
- `src/code.ts:748` — `generateComponent()` 현재 구현

---

## 2. 구현 범위

### 2.1 In Scope

- [ ] Figma 노드 구조 패턴 분석으로 컴포넌트 타입 자동 감지
- [ ] 노드 이름 기반 보조 감지 (ConfirmationDialog → dialog)
- [ ] TEXT 자식 노드 내용 추출하여 코드에 반영
- [ ] 색상값 → Figma Variables CSS variable 자동 치환
- [ ] Radix UI 프리미티브 기반 코드 생성 (dialog, button, tabs, checkbox, switch, select, tooltip, accordion, popover)
- [ ] CSS Modules 방식: `.module.css` + TSX 분리 출력
- [ ] Styled-Components 방식: styled + Radix 결합 출력
- [ ] Plain HTML 방식: 인라인 스타일 HTML 출력 (현재 구현 유지)
- [ ] 컴포넌트 타입 자동 감지 결과를 UI에 표시 (사용자 확인/수정 가능)

### 2.2 Out of Scope

- Tailwind CSS 출력 — 별도 feature(component-style-selector)에서 처리
- 중첩 서브컴포넌트 분리 생성 — 단일 파일 우선
- 애니메이션/transition 추출 — 후속 작업
- Figma Variant → props 매핑 — 후속 작업
- 외부 Radix 버전 자동 동기화 — 플러그인 범위 밖

---

## 3. 요구사항

### 3.1 기능 요구사항

| ID | 요구사항 | 우선순위 |
|----|----------|----------|
| FR-01 | 선택 노드의 자식 패턴을 분석하여 컴포넌트 타입 자동 감지 | 필수 |
| FR-02 | 노드 이름에서 컴포넌트 타입 키워드 추출 (보조 수단) | 필수 |
| FR-03 | 감지된 타입을 UI에 표시하고 사용자가 드롭다운으로 수정 가능 | 필수 |
| FR-04 | TEXT 노드 내용을 추출하여 Radix 컴포넌트의 적절한 위치에 삽입 | 필수 |
| FR-05 | 색상값을 Variables 토큰 CSS variable로 자동 치환 | 필수 |
| FR-06 | Dialog: `Dialog.Root/Portal/Overlay/Content/Title/Description/Close` 구조 생성 | 필수 |
| FR-07 | Button: `<button>` 또는 `Dialog.Trigger asChild` 패턴 생성 | 필수 |
| FR-08 | Tabs: `Tabs.Root/List/Trigger/Content` 구조, 실제 탭 수 반영 | 필수 |
| FR-09 | Checkbox / Switch / Tooltip / Accordion / Popover / Select 구조 생성 | 필수 |
| FR-10 | CSS Modules: 루트 노드 스타일 → `.root { }` 클래스로 추출 | 필수 |
| FR-11 | Styled-Components: CSS-in-JS 형태로 동일 스타일 출력 | 필수 |
| FR-12 | 생성된 코드에 필요한 `npm install @radix-ui/react-xxx` 명령 안내 | 선택 |
| FR-13 | 타입 감지 불가 시 layout(div 래퍼)으로 폴백 | 필수 |

### 3.2 비기능 요구사항

| 항목 | 기준 |
|------|------|
| 감지 정확도 | 주요 패턴(dialog/button/tabs) 80% 이상 자동 감지 |
| 생성 속도 | 노드 분석 + 코드 생성 1초 이내 |
| 코드 품질 | 생성 코드가 TypeScript strict 오류 없이 컴파일 가능 |
| 토큰 치환율 | Variables에 등록된 색상은 100% CSS variable로 치환 |

---

## 4. 설계 방향

### 4.1 컴포넌트 타입 감지 로직

```
Step 1: 이름 기반 감지 (빠른 경로)
  node.name.toLowerCase() 에서 키워드 매칭
  → "dialog", "modal", "confirm" → 'dialog'
  → "button", "btn", "cta"      → 'button'
  → "tab", "tabs"               → 'tabs'
  → "checkbox", "check"         → 'checkbox'
  → "switch", "toggle"          → 'switch'
  → "tooltip", "hint"           → 'tooltip'
  → "accordion", "collapse"     → 'accordion'
  → "popover", "dropdown"       → 'popover'
  → "select", "combobox"        → 'select'

Step 2: 구조 패턴 분석 (정밀 감지)
  자식 노드 수, 타입, 텍스트 내용 분석
  → overlay + 중앙 content + 닫기 버튼 → 'dialog'
  → 단일 텍스트 + 배경색 + 클릭 가능 형태 → 'button'
  → 가로 나열 텍스트 그룹 + 하단 content → 'tabs'
  → 작은 사각형(체크 영역) + 텍스트 → 'checkbox'

Step 3: 폴백
  감지 실패 → 'layout' (div 시맨틱 래퍼)
```

### 4.2 텍스트 추출 전략

```
extractTexts(node):
  DFS로 TEXT 타입 자식 노드 수집
  위치 기반 분류:
    - 최상단 첫 번째 텍스트 → title/label
    - 두 번째 텍스트 → description/subtitle
    - 하단 버튼 영역 텍스트 → action labels
  결과: { title, description, actions: string[] }
```

### 4.3 색상 토큰 치환

```
code.ts generateComponent() 에서:
  1. getLocalVariablesAsync()로 Variables 로드
  2. hex → CSS variable 맵 구축 (기존 colorMap 활용)
  3. 노드 색상 추출 시 즉시 치환
     '#2d7ff9' → 'var(--color-primary)'
     '#ffffff' → 'var(--color-surface)'
  4. 매칭 안 되면 hex 그대로 유지
```

### 4.4 코드 생성 구조

```
code.ts generateComponent() 반환값 확장:
  {
    name: string,
    meta: NodeMeta,
    styles: Record<string, string>,   // 루트 노드 CSS
    html: string,                      // 인라인 스타일 HTML
    jsx: string,                       // 인라인 스타일 JSX
    detectedType: ComponentType,       // 자동 감지 타입
    texts: { title, description, actions },
    childStyles: Record<string, Record<string, string>>, // 자식별 CSS
  }

ui.js 코드 생성:
  buildRadixCSSModules(data, name, useTs)
    → detectedType 기반 Radix 구조 선택
    → texts로 실제 내용 주입
    → styles/childStyles로 CSS 생성

  buildRadixStyled(data, name, useTs)
    → 동일 구조 + styled-components 형태
```

### 4.5 Radix 컴포넌트별 생성 패턴

```
dialog:
  import * as Dialog from '@radix-ui/react-dialog'
  <Dialog.Root open={open} onOpenChange={onOpenChange}>
    <Dialog.Portal>
      <Dialog.Overlay className={styles.overlay} />
      <Dialog.Content className={styles.content}>
        <Dialog.Title>{texts.title || 'Dialog Title'}</Dialog.Title>
        <Dialog.Description>{texts.description}</Dialog.Description>
        <div className={styles.footer}>
          <Dialog.Close asChild>
            <button>{texts.actions[0] || 'Cancel'}</button>
          </Dialog.Close>
          <button>{texts.actions[1] || 'Confirm'}</button>
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>

tabs:
  실제 탭 수(texts.actions.length)만큼 Trigger/Content 생성

checkbox:
  <Checkbox.Root> + <Checkbox.Indicator> + <CheckIcon />
```

---

## 5. 기술 결정

| 항목 | 결정 | 이유 |
|------|------|------|
| 타입 감지 순서 | 이름 → 구조 패턴 | 이름이 빠르고 정확, 구조 분석은 보완 |
| 텍스트 삽입 방식 | DFS 수집 후 위치 분류 | Figma 노드 위치가 의미론적 순서와 대응 |
| CSS variable 치환 | code.ts colorMap 재사용 | 기존 로직 활용, 일관성 유지 |
| 자식 스타일 | 1단계 자식만 추출 | 깊은 중첩은 복잡도 급증, 루트+1레벨이 80% 커버 |
| Radix 버전 고정 안 함 | 패키지명만 안내 | 팀별 버전 자율 선택, 플러그인 종속 탈피 |
| 감지 실패 폴백 | layout 타입 | 빈 코드보다 기본 래퍼가 유용 |

---

## 6. 완료 기준

- [ ] Dialog 선택 시 `Dialog.Root` 구조 + 실제 텍스트 반영
- [ ] Button 선택 시 `<button>` 또는 Radix 기반 구조 생성
- [ ] Tabs 선택 시 실제 탭 수만큼 `Tabs.Trigger/Content` 생성
- [ ] Checkbox / Switch / Tooltip / Accordion / Popover / Select 각 생성 확인
- [ ] Figma Variables 색상이 CSS variable로 치환됨
- [ ] 타입 자동 감지 결과가 UI 드롭다운에 반영됨
- [ ] CSS Modules / Styled-Components 양 방식 정상 출력
- [ ] Plain HTML 모드 기존 동작 유지
- [ ] 기존 Variables / Icons / Images 탭 영향 없음

---

## 7. 리스크

| 리스크 | 영향 | 대응 |
|--------|------|------|
| 복잡한 노드 구조 오감지 | 잘못된 Radix 구조 생성 | 감지 결과 UI 표시 + 수동 수정 허용 |
| 중첩 깊이 증가 시 성능 | 분석 지연 | 최대 3레벨 DFS 제한 |
| Radix 패키지 버전 API 차이 | 컴파일 에러 | 주석으로 버전 명시, 최신 안정 버전 기준 작성 |
| 텍스트 위치 분류 오류 | title/description 뒤바뀜 | y좌표 기반 정렬로 보완 |

---

## 8. 다음 단계

1. [ ] Design 문서 작성 — 감지 로직 상세, 컴포넌트별 코드 템플릿
2. [ ] `code.ts` `generateComponent()` 확장 — 텍스트 추출, 타입 감지, childStyles
3. [ ] `ui.js` `buildRadixCSSModules()` / `buildRadixStyled()` 구현
4. [ ] UI — 자동 감지 타입 표시 + 수정 드롭다운 연동
5. [ ] 각 Radix 컴포넌트 타입별 코드 생성 함수 구현
