# Design: Component CSS Separation — HTML 모드 인라인 스타일 분리

> **Feature**: component-css-separation
> **Plan**: `docs/01-plan/features/component-css-separation.plan.md`
> **Version**: 0.5.0
> **Date**: 2026-04-01
> **Status**: Draft

---

## 1. 변경 파일 목록

| 파일 | 변경 종류 | 내용 |
|------|-----------|------|
| `src/code.ts` | 수정 | `GenerateComponentResult` 타입 + `nodeToHtmlClass()` 추가, `generateComponent()` 결과에 `htmlCss` 포함 |
| `src/ui.js` | 수정 | HTML 모드 분기에서 `htmlStyleMode`에 따라 `css` 결정 |
| `src/ui/tab-component.js` | 수정 | `compState.htmlStyleMode` 추가, `buildComponentFiles()` 확장, `getGlobalCss()` 추가 |
| `src/ui.html` | 수정 | HTML 모드 내 인라인/CSS분리 토글 버튼 + global.css 복사 버튼 추가 |

---

## 2. code.ts 변경 설계

### 2.1 `GenerateComponentResult` 타입 확장

```typescript
// src/code.ts:1191 — 기존 인터페이스에 htmlCss 추가
interface GenerateComponentResult {
  name: string;
  meta: NodeMeta;
  styles: Record<string, string>;
  html: string;        // 기존: 인라인 style="" 방식
  htmlCss: string;     // 신규: CSS 분리 모드용 CSS 문자열
  htmlClass: string;   // 신규: CSS 분리 모드용 class="" HTML
  jsx: string;
  detectedType: ComponentType;
  texts: ExtractedTexts;
  childStyles: Record<string, Record<string, string>>;
  radixProps: RadixProps;
}
```

### 2.2 `nodeToHtmlClass()` 신규 함수

기존 `nodeToHtml()`을 그대로 유지하고, CSS 분리 전용 함수를 추가한다.
클로저로 `cssMap`과 `counter`를 공유하여 재귀 호출 시에도 누적된다.

```typescript
// src/code.ts — nodeToHtml() 아래에 추가
function buildHtmlWithClasses(root: SceneNode): { html: string; css: string } {
  const cssMap: Record<string, Record<string, string>> = {};
  let counter = 0;

  function toClass(n: SceneNode, indent: number): string {
    try {
      const pad = '  '.repeat(indent);
      if (n.type === 'TEXT') {
        const text = safeGetText(n);
        if (!text) return '';
        // 텍스트 노드: span + class
        const cls = counter === 0 ? 'root-text' : 'text-' + counter;
        counter++;
        cssMap[cls] = {}; // 텍스트 노드는 스타일 없음
        return (
          pad +
          '<span class="' + cls + '">' +
          text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') +
          '</span>'
        );
      }

      const cls = counter === 0 ? 'root' : 'el-' + counter;
      counter++;
      const styles = getNodeStyles(n);
      if (Object.keys(styles).length > 0) {
        cssMap[cls] = styles;
      }

      if ('children' in n && (n as ChildrenMixin).children.length > 0) {
        const kids = (n as ChildrenMixin).children
          .filter((c) => (c as SceneNode).visible !== false)
          .map((c) => toClass(c as SceneNode, indent + 1))
          .filter(Boolean)
          .join('\n');
        if (!kids) return pad + '<div class="' + cls + '"></div>';
        return pad + '<div class="' + cls + '">\n' + kids + '\n' + pad + '</div>';
      }
      return pad + '<div class="' + cls + '"></div>';
    } catch (_) {
      return '';
    }
  }

  const html = toClass(root, 0);

  // cssMap → CSS 문자열 변환
  const css = Object.entries(cssMap)
    .filter(([, props]) => Object.keys(props).length > 0)
    .map(([cls, props]) => {
      const body = Object.entries(props)
        .map(([k, v]) => '  ' + k + ': ' + v + ';')
        .join('\n');
      return '.' + cls + ' {\n' + body + '\n}';
    })
    .join('\n\n');

  return { html, css };
}
```

### 2.3 `generateComponent()` 결과 업데이트

```typescript
// src/code.ts:1670 — return 구문에 htmlClass, htmlCss 추가
const { html: htmlClass, css: htmlCss } = buildHtmlWithClasses(node);

return {
  name: node.name,
  meta: { ... },
  styles: rootStyles,
  html: nodeToHtml(node, 0),     // 기존 인라인 방식 유지
  htmlClass,                      // 신규: class 기반 HTML
  htmlCss,                        // 신규: 추출된 CSS
  jsx: nodeToJsx(node, 0),
  detectedType: detectComponentType(node),
  texts: extractTexts(node),
  childStyles: getChildStyles(node),
  radixProps: { ... },
};
```

---

## 3. ui.js 변경 설계

### 3.1 HTML 모드 분기 수정

```javascript
// src/ui.js:220 — 현재
if (compState.styleMode === 'html') {
  tsx = d.html || '<div></div>';
  css = '';
}

// 변경 후
if (compState.styleMode === 'html') {
  if (compState.htmlStyleMode === 'separated') {
    tsx = d.htmlClass || '<div class="root"></div>';
    css = d.htmlCss || '';
  } else {
    // 'inline' 모드 (기존 동작)
    tsx = d.html || '<div></div>';
    css = '';
  }
}
```

---

## 4. tab-component.js 변경 설계

### 4.1 `compState` 확장

```javascript
// src/ui/tab-component.js:61
export var compState = {
  meta: null,
  componentType: 'layout',
  styleMode: 'css-modules',
  htmlStyleMode: 'inline',   // 신규: 'inline' | 'separated'
  useTs: true,
  generatedTsx: '',
  generatedCss: '',
  nodeData: null,
  registry: {},
  activeCodeTab: 'tsx',
};
```

### 4.2 `buildComponentFiles()` 확장

```javascript
// src/ui/tab-component.js:20
export function buildComponentFiles(nodeData, cState) {
  var name = compToPascalCase((nodeData.name || 'Component').split('/').pop());
  var files = [];
  if (cState.styleMode === 'css-modules') {
    files.push({ styleMode: 'css-modules', fileType: 'tsx', fileName: name + '.tsx',        content: cState.generatedTsx || '' });
    files.push({ styleMode: 'css-modules', fileType: 'css', fileName: name + '.module.css', content: cState.generatedCss || '' });
  } else if (cState.styleMode === 'styled') {
    files.push({ styleMode: 'styled', fileType: 'tsx', fileName: name + '.tsx', content: cState.generatedTsx || '' });
  } else if (cState.styleMode === 'html') {
    files.push({ styleMode: 'html', fileType: 'html', fileName: name.toLowerCase() + '.html', content: cState.generatedTsx || '' });
    // 신규: separated 모드일 때만 CSS 파일 + global.css 포함
    if (cState.htmlStyleMode === 'separated') {
      files.push({ styleMode: 'html', fileType: 'css',  fileName: name.toLowerCase() + '.css',  content: cState.generatedCss || '' });
      var globalCss = getGlobalCss();
      if (globalCss) {
        files.push({ styleMode: 'html', fileType: 'css', fileName: 'global.css', content: globalCss });
      }
    }
  }
  return files;
}
```

### 4.3 `getGlobalCss()` 신규 함수

```javascript
// src/ui/tab-component.js — buildComponentFiles 위에 추가
function getGlobalCss() {
  // state.extractedData에서 CSS 변수 추출
  if (!state.extractedData) return '';
  var vars = state.extractedData.variables;
  if (!vars || !vars.collections) return '';

  var lines = [':root {'];
  vars.collections.forEach(function (col) {
    if (!col.variables) return;
    col.variables.forEach(function (v) {
      if (v.cssVar && v.value !== undefined) {
        lines.push('  ' + v.cssVar + ': ' + v.value + ';');
      }
    });
  });
  lines.push('}');

  if (lines.length <= 2) return ''; // 변수가 없으면 빈 파일 방지
  return lines.join('\n');
}
```

### 4.4 HTML 모드 토글 이벤트 리스너

```javascript
// src/ui/tab-component.js — 스타일 모드 버튼 리스너 근방에 추가
document.querySelectorAll('.comp-html-style-btn').forEach(function (btn) {
  btn.addEventListener('click', function () {
    compState.htmlStyleMode = btn.dataset.htmlStyle;
    document.querySelectorAll('.comp-html-style-btn').forEach(function (b) {
      b.classList.toggle('active', b.dataset.htmlStyle === compState.htmlStyleMode);
    });
    // global.css 버튼 표시/숨김
    var globalCssBar = $('compGlobalCssBar');
    if (globalCssBar) {
      globalCssBar.style.display = compState.htmlStyleMode === 'separated' ? '' : 'none';
    }
  });
});

// global.css 복사 버튼
var compGlobalCssCopyBtn = $('compGlobalCssCopyBtn');
if (compGlobalCssCopyBtn) {
  compGlobalCssCopyBtn.addEventListener('click', function () {
    var css = getGlobalCss();
    if (!css) { showToast(t('extract.noData')); return; }
    copyToClipboard(css);
    showToast(t('component.globalCssCopied'));
  });
}
```

---

## 5. ui.html 변경 설계

### 5.1 HTML 모드 서브 토글 버튼

컴포넌트 탭의 스타일 모드 버튼(`comp-style-btn`) 행에 HTML 선택 시 노출되는 서브 옵션 추가.

```html
<!-- src/ui.html — comp-style-btn 행 아래에 추가 -->
<!-- HTML 모드 서브 옵션 (styleMode=html 일 때만 표시) -->
<div id="compHtmlStyleOptions" style="display: none; margin-top: 4px; gap: 4px; display: flex;">
  <button class="btn-ghost comp-html-style-btn active" data-html-style="inline"
    style="height: 24px; padding: 0 8px; font-size: 11px;">
    인라인
  </button>
  <button class="btn-ghost comp-html-style-btn" data-html-style="separated"
    style="height: 24px; padding: 0 8px; font-size: 11px;">
    CSS 분리
  </button>
</div>
```

### 5.2 global.css 바 (CSS 분리 모드 한정)

```html
<!-- src/ui.html — HTML 모드 코드 뷰어 하단에 추가 -->
<div id="compGlobalCssBar" style="display: none; padding: 8px 12px; border-top: 1px solid var(--border); display: flex; align-items: center; gap: 8px;">
  <span style="font-size: 11px; color: var(--text-secondary);">global.css (토큰 변수)</span>
  <button class="btn-ghost" id="compGlobalCssCopyBtn"
    style="height: 24px; padding: 0 8px; font-size: 11px;"
    data-i18n="component.copyGlobalCss">
    복사
  </button>
</div>
```

### 5.3 HTML 서브 옵션 표시/숨김 로직

HTML 모드 선택 시 서브 옵션 표시, 다른 모드 선택 시 숨김.

```javascript
// 기존 .comp-style-btn 리스너에 추가
document.querySelectorAll('.comp-style-btn').forEach(function (btn) {
  btn.addEventListener('click', function () {
    compState.styleMode = btn.dataset.compStyle;
    // ...
    // HTML 서브 옵션 표시 제어
    var htmlOpts = $('compHtmlStyleOptions');
    if (htmlOpts) htmlOpts.style.display = compState.styleMode === 'html' ? 'flex' : 'none';
    var globalBar = $('compGlobalCssBar');
    if (globalBar) globalBar.style.display = 'none'; // 모드 전환 시 초기화
  });
});
```

---

## 6. i18n 키 추가

```javascript
// src/ui/i18n.js — component 섹션에 추가
ko: {
  component: {
    // ... 기존 키
    globalCssCopied: 'global.css 복사됨',
    copyGlobalCss: '복사',
    htmlModeInline: '인라인',
    htmlModeSeparated: 'CSS 분리',
  }
},
en: {
  component: {
    // ... 기존 키
    globalCssCopied: 'global.css copied',
    copyGlobalCss: 'Copy',
    htmlModeInline: 'Inline',
    htmlModeSeparated: 'Separate CSS',
  }
}
```

---

## 7. 데이터 플로우

```
[Figma 노드 선택]
        ↓
[generateCompBtn 클릭]
        ↓
[code.ts: generateComponent()]
  ├── nodeToHtml()      → result.html     (인라인 style=)
  └── buildHtmlWithClasses() → result.htmlClass + result.htmlCss
        ↓
[ui.js: generate-component-result 처리]
  ├── compState.htmlStyleMode === 'inline'
  │     tsx = result.html, css = ''
  └── compState.htmlStyleMode === 'separated'
        tsx = result.htmlClass, css = result.htmlCss
        ↓
[showGeneratedResult(tsx, css, 'html', d)]
        ↓
[compState.generatedTsx, generatedCss 저장]
        ↓
[다운로드 / 복사 / PixelForge 전송]
  ├── buildComponentFiles()
  │     'html' + 'inline':    → [name.html]
  │     'html' + 'separated': → [name.html, name.css, global.css]
  └── sendToPixelForge('/api/sync/components', { files })
```

---

## 8. 완료 기준 (체크리스트)

- [ ] `GenerateComponentResult`에 `htmlClass: string`, `htmlCss: string` 필드 추가
- [ ] `buildHtmlWithClasses()` 함수: 모든 노드에 class 부여, CSS 맵 → 문자열 변환
- [ ] 인라인 모드: 기존 `style=""` 출력 변화 없음
- [ ] CSS 분리 모드: HTML에 `style=` 없음, `.root`, `.el-N` class 사용
- [ ] `compState.htmlStyleMode` 토글 UI 동작
- [ ] HTML 모드 선택 시만 서브 토글 표시
- [ ] CSS 분리 모드 선택 시 global.css 바 표시
- [ ] `getGlobalCss()`: 추출 데이터 없으면 빈 문자열 반환
- [ ] i18n 키 추가 (ko/en)
- [ ] `npm run build` 성공
