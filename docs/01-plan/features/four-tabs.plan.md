# PDCA Plan — 4개 탭 기능 (아이콘 / 접근성 / 테마 / 컴포넌트)

## 목표

"규칙 기반 품질 강제" — 누가 작업해도 동일한 결과물을 생성하는 코드 품질 확보.
자동화 전에 각 탭이 올바른 규칙과 구조로 작동하도록 보장.

---

## 1. 아이콘 SVG 추출 탭

### 기능 목표
Figma에서 선택한 아이콘 컴포넌트를 SVG로 추출하고, 네이밍 규칙(kebab/PascalCase)을 자동 적용하여 React 컴포넌트 코드까지 생성.

### 사용자 스토리
- 디자이너가 아이콘을 선택 → SVG/React 코드를 즉시 복사
- 개발자가 아이콘 네이밍 규칙을 수동 변환 없이 사용

### 성공 기준
- [ ] SVG 추출 시 불필요한 속성(width/height 하드코딩) 정리
- [ ] kebab-case / PascalCase 네이밍이 일관성 있게 생성
- [ ] React 컴포넌트 코드가 props 전달 가능
- [ ] 일괄 다운로드(ZIP) 지원

### 현재 구현 상태
- **code.ts**: `exportIcons()` — SVG 바이트 배열 → 문자열 변환, kebab/pascal 네이밍
- **ui.html**: 선택 노드 표시, SVG 미리보기, 개별 SVG/React 복사
- **문제점**:
  - `onclick` 인라인 핸들러 사용 (global scope 오염)
  - SVG 최적화 없음 (불필요한 xmlns, xml 선언 남아있을 수 있음)
  - 일괄 다운로드 미지원
  - React 컴포넌트 생성 시 `{...props}` 주입은 되지만 TypeScript 타입 미포함

### 개선 필요
1. **[P1]** 인라인 onclick → addEventListener 패턴으로 변경
2. **[P1]** SVG 정리: xml 선언 제거, viewBox 보존, 불필요 속성 제거
3. **[P2]** 일괄 다운로드 기능
4. **[P2]** React 컴포넌트에 TypeScript 인터페이스 추가

---

## 2. WCAG 접근성 탭

### 기능 목표
추출된 디자인 토큰의 색상 조합에 대해 WCAG 2.1 명도 대비(Contrast Ratio)를 검증.

### 사용자 스토리
- 디자이너가 배경색/텍스트색을 선택 → AA/AAA 준수 여부 즉시 확인
- 추출된 색상을 드롭다운에서 선택 가능

### 성공 기준
- [ ] WCAG 2.1 AA Normal (4.5:1), AA Large (3:1), AAA (7:1) 정확 판정
- [ ] 추출된 변수/스타일 색상이 드롭다운에 자동 연동
- [ ] 실시간 미리보기
- [ ] 색상 선택 시 swatch 프리뷰 표시

### 현재 구현 상태
- **ui.html (JS)**: `hexToRgb()`, `relativeLuminance()`, `contrastRatio()`, `updateA11y()`
- 배경/전경색 직접 입력 + 드롭다운 선택
- AA/AA Large/AAA 배지 표시 + 비율 색상 코딩
- 실시간 미리보기 박스
- **문제점**:
  - 추출 탭에서 먼저 추출해야 드롭다운에 색상이 채워짐 (UX 연결 부족)
  - 색상 swatch가 드롭다운 옵션에 없음 (텍스트만)
  - 대비 부족 시 대안 색상 추천 없음
  - 여러 색상 쌍을 한번에 체크하는 배치 기능 없음

### 개선 필요
1. **[P1]** 접근성 탭 진입 시 "먼저 추출 탭에서 토큰을 추출하세요" 안내 표시
2. **[P2]** 드롭다운 옵션에 색상 swatch 인디케이터 추가
3. **[P3]** 대비 부족 시 가장 가까운 AA 준수 색상 추천

---

## 3. 다크/라이트 테마 비교 탭

### 기능 목표
Figma Variables의 multi-mode 컬렉션에서 라이트/다크 테마 색상을 추출하여 나란히 비교.

### 사용자 스토리
- 디자이너가 테마 간 차이를 한눈에 확인
- 변경된 항목만 필터링하여 리뷰

### 성공 기준
- [ ] 2개 이상 모드를 가진 컬렉션에서 COLOR 변수 자동 추출
- [ ] 라이트/다크 나란히 비교 그리드
- [ ] 변경된 항목만 필터 가능
- [ ] CSS 변수 코드로 복사/다운로드

### 현재 구현 상태
- **code.ts**: `extractThemes()` — multi-mode 컬렉션의 COLOR 변수를 모드별 hex로 추출
- **ui.html**: 2컬럼 그리드, 라이트(밝은 배경)/다크(어두운 배경) 비교, 변경 하이라이트, 필터 토글
- **문제점**:
  - `modes[0]`/`modes[1]`만 지원 — 3개 이상 모드 무시
  - CSS 복사/다운로드 기능 없음
  - VARIABLE_ALIAS(참조 변수) 해석 없이 원시 값만 표시
  - 테마 이름이 "Light"/"Dark"인지 자동 감지 없음

### 개선 필요
1. **[P1]** CSS 변수 코드 복사 버튼 추가
2. **[P2]** 3개 이상 모드 지원 (모드 선택 드롭다운)
3. **[P2]** VARIABLE_ALIAS 해석하여 최종 값 표시
4. **[P3]** 자동 모드명 감지 (Light/Dark)

---

## 4. 컴포넌트 코드 생성 탭

### 기능 목표
Figma에서 선택한 노드를 HTML + React 코드로 자동 변환. 디자인 토큰(CSS 변수)을 자동 매핑.

### 사용자 스토리
- 개발자가 Figma 컴포넌트 선택 → HTML/React 코드 즉시 사용
- 색상 값이 CSS 변수로 자동 치환

### 성공 기준
- [ ] Auto Layout → flexbox 매핑 정확
- [ ] 색상 → CSS 변수 매핑
- [ ] TEXT 노드 → 적절한 HTML 태그
- [ ] 중첩 구조 보존
- [ ] HTML/React 탭 전환 + 복사

### 현재 구현 상태
- **code.ts**: `generateComponent()` — 노드 트리 순회, getNodeStyles(), nodeToHtml(), nodeToJsx()
- 색상 → CSS 변수 매핑 (`colorMap`)
- Auto Layout → flex/flex-direction/gap/padding 변환
- width/height, border-radius, background-color 추출
- **문제점**:
  - TEXT 노드가 항상 `<span>` — 의미적 태그(h1~h6, p) 고려 없음
  - 인라인 스타일만 사용 — className 생성 없음
  - stroke(border) 스타일 미변환
  - opacity, visibility 미처리
  - 첫 번째 선택 노드만 처리 — 다중 선택 미지원

### 개선 필요
1. **[P1]** stroke → border CSS 변환 추가
2. **[P1]** opacity 처리 추가
3. **[P2]** TEXT 노드 의미적 태그 매핑 (fontSize 기반)
4. **[P3]** className 기반 스타일 분리 옵션

---

## 공통 개선사항

### 코드 품질 (규칙 기반)
1. **[P0] src/ui.tsx 정리** — 빌드에서 사용하지 않는 레거시 파일 제거
2. **[P1] 인라인 onclick 제거** — 아이콘 탭의 global function 패턴을 이벤트 위임으로 변경
3. **[P1] copyToClipboard 일관성** — 구버전 `document.execCommand('copy')` 대신 조건부 `navigator.clipboard` 사용

### 우선순위 종합 (즉시 구현)
| # | 항목 | 탭 | 영향도 |
|---|------|-----|--------|
| 1 | src/ui.tsx 레거시 파일 제거 | 공통 | 혼란 방지 |
| 2 | 아이콘 inline onclick → 이벤트 위임 | 아이콘 | 코드 품질 |
| 3 | SVG 정리 (xml 선언/불필요 속성 제거) | 아이콘 | 출력 품질 |
| 4 | 컴포넌트 stroke → border 변환 | 컴포넌트 | 기능 완성도 |
| 5 | 컴포넌트 opacity 처리 | 컴포넌트 | 기능 완성도 |
| 6 | 테마 CSS 복사 버튼 | 테마 | UX |
| 7 | 접근성 탭 안내 메시지 | 접근성 | UX |
