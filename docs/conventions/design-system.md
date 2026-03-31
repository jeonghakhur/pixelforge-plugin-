# Design System — PixelForge Plugin

## 디자인 토큰 사용법

### 색상 토큰 (다크 테마 기반)

| 계층 | 토큰 | 값 | 용도 |
|------|------|-----|------|
| 배경 L1 | `--bg` | `#1A1A1A` | body, 최하단 배경 |
| 배경 L2 | `--surface` | `#2A2A2A` | 카드, 패널 배경 |
| 배경 L3 | `--surface2` | `#333333` | hover 상태, 입력 필드 |
| 테두리 | `--border` | `#3A3A3A` | 카드 테두리, 구분선 |
| 텍스트 1 | `--text-primary` | `rgba(255,255,255,0.95)` | 제목, 주요 텍스트 |
| 텍스트 2 | `--text-secondary` | `rgba(255,255,255,0.55)` | 본문, 설명 |
| 텍스트 3 | `--text-muted` | `rgba(255,255,255,0.60)` | 라벨, 캡션 |

### 강조색 토큰

| 토큰 | 값 | 용도 |
|------|-----|------|
| `--primary` | `#3B82F6` | CTA 버튼, 활성 탭, 링크 |
| `--primary-light` | `rgba(59,130,246,0.12)` | 활성 카드 배경, 선택 배경 |
| `--primary-border` | `rgba(59,130,246,0.25)` | 활성 카드 테두리 |
| `--primary-disabled` | `rgba(59,130,246,0.4)` | 비활성 버튼 |
| `--success` | `#3DDC84` | WCAG 통과, 성공 상태 |
| `--success-light` | `rgba(61,220,132,0.12)` | 성공 배경 |
| `--warning` | `#F5B731` | WCAG AA Large 경고 |
| `--warning-light` | `rgba(245,183,49,0.12)` | 경고 배경 |
| `--danger` | `#FF4D4F` | WCAG 미달, 에러 |
| `--danger-light` | `rgba(255,77,79,0.12)` | 에러 배경 |

### 크기 토큰

| 토큰 | 값 | 용도 |
|------|-----|------|
| `--radius` | `12px` | 카드, 패널 |
| `--radius-sm` | `8px` | 입력 필드, 작은 요소 |
| `--radius-pill` | `100px` | pill 탭, 태그 |
| `--shadow` | `0 2px 8px rgba(0,0,0,0.4)` | 토스트, 팝업 |

## WCAG AA 체크리스트

### 명도 대비 (Contrast Ratio)

| 요소 | 최소 대비 | 현재 프로젝트 |
|------|----------|-------------|
| 일반 텍스트 (13px 이하) | **4.5:1** | `--text-primary` on `--bg` = 18.2:1 |
| 큰 텍스트 (18px+ bold 또는 24px+) | **3:1** | `--text-secondary` on `--bg` = 9.8:1 |
| UI 컴포넌트/아이콘 | **3:1** | `--primary` on `--bg` = 5.3:1 |
| 비활성 텍스트 | 면제 | `--text-muted` |

### 검증 체크리스트
- [ ] 새 색상 조합 추가 시 contrast ratio 계산 (https://webaim.org/resources/contrastchecker/)
- [ ] `--text-primary` on `--surface` ≥ 4.5:1
- [ ] `--text-secondary` on `--surface` ≥ 4.5:1
- [ ] `--primary` on `--bg` ≥ 3:1 (UI 컴포넌트)
- [ ] `--success/warning/danger` on 각 `*-light` 배경 ≥ 4.5:1

### 터치 타겟
- 버튼 최소 높이: **36px** (Figma 플러그인 특성상 44px에서 완화)
- 체크박스/라디오: **14px** + 클릭 영역 패딩
- 탭: 최소 `padding: 10px 16px`
- 아이콘 버튼: 최소 **28px × 28px**

## 금융권 UI 트렌드 가이드

### 핵심 원칙 (토스/카카오뱅크 스타일)

1. **계층적 다크 테마**
   - 배경 3단계: `#1A1A1A` → `#2A2A2A` → `#333333`
   - 깊이감을 border로 표현 (shadow 최소화)
   - 카드 사이 간격으로 계층 구분

2. **타이포그래피 위계**
   - 제목: Bold (700), 15–16px
   - 본문: Regular–Medium (400–500), 13px
   - 캡션: Medium (500–600), 11px, `--text-muted`
   - 숫자 강조: Bold (700), 18px, `--primary`

3. **인터랙션 피드백**
   - hover: 배경색 한 단계 밝게 (`--surface` → `--surface2`)
   - active 상태: `--primary-light` 배경 + `--primary-border` 테두리
   - disabled: opacity 0.4 또는 `--primary-disabled`
   - transition: `all 0.15s` (빠르고 부드럽게)

4. **정보 밀도**
   - 그리드 레이아웃 (2열, 4열) 적극 활용
   - stat 카드: 숫자 크게 + 라벨 작게
   - 토스트 알림: 하단 고정, 2.5초 자동 사라짐

5. **색상 사용 절제**
   - 주요 액션만 `--primary` (파란색)
   - 상태 표시만 시맨틱 컬러 (`--success/warning/danger`)
   - 나머지는 무채색 계열 (`--text-*`, `--surface*`)

### 안티패턴 (금지)
- 그라데이션 배경 사용 금지
- 외곽선(outline) 기반 버튼 금지 (ghost 버튼은 border 사용)
- 과도한 그림자 금지 (shadow는 토스트/팝업에만)
- 이모지를 상태 표시에 사용 금지 (배지/아이콘으로 대체)
- 밝은 배경색 (#FFF 등) 직접 사용 금지 (토스트 제외)

## 컴포넌트 패턴

### Section Card
```css
.section-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);  /* 12px */
  padding: 14px;
}
```

### 버튼
```css
/* Primary — CTA */
.btn-primary {
  height: 40px;
  background: var(--primary);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
}

/* Ghost — 보조 액션 */
.btn-ghost {
  height: 40px;
  background: var(--surface2);
  color: var(--text-secondary);
  border: 1px solid var(--border);
  border-radius: 10px;
  font-size: 12px;
}
```

### 탭
```css
/* 메인 탭 — 언더라인 */
.main-tab {
  padding: 10px 16px;
  border-bottom: 2px solid transparent;
  font-size: 14px;
}
.main-tab.active {
  border-bottom-color: var(--primary);
  font-weight: 600;
}

/* 서브 탭 — pill */
.a11y-subtab {
  padding: 4px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-pill);
  font-size: 11px;
}
.a11y-subtab.active {
  background: var(--primary);
  color: #fff;
}
```

### Stat Card
```css
.stat-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 10px 6px;
  text-align: center;
}
.stat-value { font-size: 18px; font-weight: 700; color: var(--primary); }
.stat-label { font-size: 10px; color: var(--text-muted); }
```

### Toast
```css
.toast {
  position: fixed;
  bottom: 70px;
  left: 50%;
  transform: translateX(-50%);
  background: #FFFFFF;
  color: #1A1A1A;
  font-size: 12px;
  padding: 8px 14px;
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow);
}
```
