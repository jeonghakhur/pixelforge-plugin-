# Playwright 테스트 가이드 — PixelForge Plugin

## 개요

Figma 플러그인 UI는 `dist/ui.html` 단일 파일로 빌드된다.
이 파일을 브라우저에서 직접 로드하여 Playwright로 UI 검증이 가능하다.

> **제약:** `parent.postMessage` (Figma Sandbox 통신)은 브라우저에서 동작하지 않으므로,
> Figma API 의존 기능 (실제 추출)은 mock 데이터로 테스트한다.

## 설정 방법

### 1. 의존성 설치
```bash
npm install -D @playwright/test
npx playwright install chromium
```

### 2. playwright.config.ts
```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  use: {
    baseURL: `file://${process.cwd()}/dist/ui.html`,
    browserName: 'chromium',
    screenshot: 'only-on-failure',
  },
  reporter: [
    ['html', { outputFolder: 'docs/test/reports', open: 'never' }],
    ['list'],
  ],
});
```

### 3. 테스트 파일 구조
```
tests/
├── ui-layout.spec.ts       # 레이아웃/렌더링 검증
├── ui-interaction.spec.ts  # 인터랙션 검증
├── ui-a11y.spec.ts         # 접근성 검증
└── fixtures/
    └── mock-data.ts        # Figma 메시지 mock 데이터
```

## Mock 데이터 주입

```typescript
// tests/fixtures/mock-data.ts
export const mockInitData = {
  pluginMessage: {
    type: 'init-data',
    fileName: 'Test Design File',
    collections: [
      { id: 'col-1', name: 'Primitives', modes: [{ modeId: 'm1', name: 'Default' }], variableIds: ['v1', 'v2'] },
    ],
    selection: { count: 0, names: [], nodeTypes: [] },
  }
};

export const mockExtractResult = {
  pluginMessage: {
    type: 'extract-result',
    data: {
      variables: { collections: [], variables: [] },
      spacing: [],
      radius: [],
      styles: { colors: [], texts: [], effects: [] },
      icons: [],
      meta: {
        figmaFileKey: 'test-key',
        extractedAt: new Date().toISOString(),
        fileName: 'Test File',
        sourceMode: 'all',
        totalNodes: 42,
        tokenTypes: ['variables', 'colors'],
      }
    }
  }
};
```

```typescript
// 테스트에서 mock 데이터 전달
await page.evaluate((data) => {
  window.dispatchEvent(new MessageEvent('message', { data }));
}, mockInitData);
```

## 작업 완료 후 필수 검증 체크리스트

### UI 레이아웃 검증
- [ ] 모든 메인 탭(6개) 렌더링 확인
- [ ] 탭 전환 시 패널 표시/숨김 동작
- [ ] 헤더 높이 48px 고정
- [ ] 액션 바 높이 60px 고정
- [ ] 스크롤 영역이 올바르게 동작

### 인터랙션 검증
- [ ] 토큰 카드 클릭 시 active 토글
- [ ] 최소 1개 타입 선택 강제 (마지막 카드 해제 불가)
- [ ] 추출 범위 라디오 전환 동작
- [ ] JSON/CSS 탭 전환 + 단위 토글 (px/rem)
- [ ] 뒤로 가기 버튼 동작
- [ ] 한/영 언어 전환

### 접근성 검증
- [ ] 모든 인터랙티브 요소에 cursor: pointer
- [ ] 버튼 최소 높이 36px
- [ ] 텍스트 최소 크기 10px
- [ ] disabled 상태 시각적 구분 (opacity, cursor)

### 디자인 토큰 검증
- [ ] 하드코딩된 색상값 없음 (허용: `#fff`, `#111111`, 프리뷰 영역)
- [ ] 간격 4px 배수 준수
- [ ] CSS 변수 참조 정상 동작

## 테스트 예시

```typescript
import { test, expect } from '@playwright/test';
import { mockInitData } from './fixtures/mock-data';

test.describe('메인 탭 전환', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('');
    await page.evaluate((data) => {
      window.dispatchEvent(new MessageEvent('message', { data }));
    }, mockInitData);
  });

  test('6개 메인 탭이 렌더링된다', async ({ page }) => {
    const tabs = page.locator('.main-tab');
    await expect(tabs).toHaveCount(6);
  });

  test('탭 클릭 시 해당 패널이 표시된다', async ({ page }) => {
    await page.click('.main-tab[data-tab="icon"]');
    await expect(page.locator('#panel-icon')).toBeVisible();
    await expect(page.locator('#panel-extract')).toBeHidden();
  });

  test('한/영 전환이 동작한다', async ({ page }) => {
    await page.click('.lang-btn[data-lang="en"]');
    const extractTab = page.locator('.main-tab[data-tab="extract"]');
    await expect(extractTab).toHaveText('Extract');
  });
});

test.describe('디자인 토큰 준수', () => {
  test('CSS 변수가 :root에 정의되어 있다', async ({ page }) => {
    await page.goto('');
    const bg = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--bg').trim()
    );
    expect(bg).toBe('#1A1A1A');
  });
});
```

## 리포트 생성

### 실행
```bash
npx playwright test
```

### 리포트 위치
```
docs/test/reports/
├── index.html          # Playwright HTML 리포트
└── ...
```

### 리포트 저장 규칙
1. 리포트는 `docs/test/reports/`에 저장
2. `.gitignore`에 `docs/test/reports/` 추가 (리포트는 git에 포함하지 않음)
3. CI에서 리포트를 아티팩트로 저장
4. 실패 시 스크린샷이 자동 첨부됨

### npm script 추가 (권장)
```json
{
  "scripts": {
    "test": "npx playwright test",
    "test:report": "npx playwright show-report docs/test/reports"
  }
}
```
