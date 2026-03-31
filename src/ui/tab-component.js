'use strict';
import { state } from './state.js';
import { lang, t } from './i18n.js';
import { $, showToast, copyToClipboard } from './utils.js';
import { RADIX_MAP, detectComponentType, compToPascalCase, buildRadixCSSModules, buildRadixCSS, buildRadixStyled, filterTypographyStyles, stylesToCSSProps } from './component-builders.js';

export var compState = {
  meta: null,
  componentType: 'layout',
  styleMode: 'css-modules',
  useTs: true,
  generatedTsx: '',
  generatedCss: '',
  registry: {},
  currentEntry: null,
  activeCodeTab: 'tsx',
  activeDetailTab: 'tsx',
  editMode: false,
};

export function showGeneratedResult(tsx, css, styleMode) {
  compState.generatedTsx = tsx;
  compState.generatedCss = css;
  compState.activeCodeTab = 'tsx';
  var cssTabBtn = $('compCssTabBtn');
  if (cssTabBtn) cssTabBtn.style.display = styleMode === 'css-modules' ? '' : 'none';
  var tsxTabBtn = document.querySelector('[data-comp-code-tab="tsx"]');
  if (tsxTabBtn) tsxTabBtn.textContent = styleMode === 'html' ? 'HTML' : 'TSX';
  document.querySelectorAll('[data-comp-code-tab]').forEach(function (btn) {
    btn.classList.toggle('active', btn.dataset.compCodeTab === 'tsx');
  });
  $('compCode').value = tsx;
  $('compResult').classList.remove('hidden');
  if (compState.meta) {
    var parts = compState.meta.nodeName.split('/');
    $('compNameInput').value = compToPascalCase(parts[parts.length - 1]);
  }
}

export function switchCompSubTab(sub) {
  document.querySelectorAll('.comp-subtab').forEach(function (btn) {
    btn.classList.toggle('active', btn.dataset.compSub === sub);
  });
  $('compGenerateView').style.display = sub === 'generate' ? '' : 'none';
  $('compRegistryView').style.display = sub === 'registry' ? '' : 'none';
  if (sub === 'registry') renderRegistryList();
}
document.querySelectorAll('.comp-subtab').forEach(function (btn) {
  btn.addEventListener('click', function () {
    switchCompSubTab(btn.dataset.compSub);
  });
});

export function updateCompSelInfo() {
  var info = $('compSelInfo');
  if (!info) return;
  if (state.lastSelection.count > 0 && state.lastSelection.meta) {
    info.textContent = (lang === 'ko' ? '선택: ' : 'Selected: ') + state.lastSelection.meta.nodeName;
    info.style.color = 'var(--primary)';
    info.style.background = 'var(--primary-light)';
    info.style.border = '1px solid var(--primary-border)';
  } else {
    info.textContent = t('component.noSel');
    info.style.color = 'var(--text-muted)';
    info.style.background = 'var(--bg)';
    info.style.border = 'none';
  }
}

export function onCompSelectionChanged() {
  var meta = (state.lastSelection && state.lastSelection.meta) || null;
  compState.meta = meta;
  updateCompSelInfo();
  if (!meta) return;
  var detected = detectComponentType(meta.nodeName);
  compState.componentType = detected;
  var ts = $('compTypeSelect');
  if (ts) ts.value = detected;
  updateTypeHint(detected);
  var key = meta.masterId || meta.nodeId;
  var entry = compState.registry[key];
  if (entry) {
    compState.currentEntry = entry;
    switchCompSubTab('registry');
    showRegistryDetail(entry);
  }
}

export function updateTypeHint(type) {
  var hint = $('compTypeHint');
  if (!hint) return;
  var pkg = RADIX_MAP[type];
  hint.textContent = pkg
    ? 'Radix UI: ' + pkg
    : type === 'layout'
      ? lang === 'ko'
        ? '시맨틱 HTML 태그'
        : 'Semantic HTML'
      : 'Native element';
}

var _typeSelect = $('compTypeSelect');
if (_typeSelect)
  _typeSelect.addEventListener('change', function () {
    compState.componentType = _typeSelect.value;
    updateTypeHint(_typeSelect.value);
  });

document.querySelectorAll('.comp-style-btn').forEach(function (btn) {
  btn.addEventListener('click', function () {
    compState.styleMode = btn.dataset.compStyle;
    document.querySelectorAll('.comp-style-btn').forEach(function (b) {
      b.classList.toggle('active', b.dataset.compStyle === compState.styleMode);
    });
  });
});

var _compTsCheck = $('compTsCheck');
if (_compTsCheck) {
  _compTsCheck.checked = true;
  _compTsCheck.addEventListener('change', function () {
    compState.useTs = _compTsCheck.checked;
  });
}

export var generateCompBtn = $('generateCompBtn');
if (generateCompBtn) {
  generateCompBtn.addEventListener('click', function () {
    if (state.lastSelection.count === 0) {
      showToast(t('component.selectFirst'));
      return;
    }
    generateCompBtn.disabled = true;
    generateCompBtn.textContent = t('component.generating');
    parent.postMessage({ pluginMessage: { type: 'generate-component' } }, '*');
  });
}

document.querySelectorAll('[data-comp-code-tab]').forEach(function (btn) {
  btn.addEventListener('click', function () {
    compState.activeCodeTab = btn.dataset.compCodeTab;
    document.querySelectorAll('[data-comp-code-tab]').forEach(function (b) {
      b.classList.toggle('active', b.dataset.compCodeTab === compState.activeCodeTab);
    });
    $('compCode').value =
      compState.activeCodeTab === 'tsx' ? compState.generatedTsx : compState.generatedCss;
  });
});

var _compCopyBtn = $('compCopyBtn');
if (_compCopyBtn)
  _compCopyBtn.addEventListener('click', function () {
    copyToClipboard(
      compState.activeCodeTab === 'tsx' ? compState.generatedTsx : compState.generatedCss
    );
    showToast(t('component.copied'));
  });

var _compSaveBtn = $('compSaveBtn');
if (_compSaveBtn) {
  _compSaveBtn.addEventListener('click', function () {
    var ni = $('compNameInput');
    var nameVal = ((ni && ni.value) || '').trim();
    if (!nameVal) {
      showToast(lang === 'ko' ? '컴포넌트명을 입력하세요' : 'Enter component name');
      return;
    }
    if (!compState.meta) {
      showToast(t('component.selectFirst'));
      return;
    }
    var key = compState.meta.masterId || compState.meta.nodeId;
    var entry = {
      name: nameVal,
      figmaNodeName: compState.meta.nodeName,
      figmaMasterNodeId: key,
      componentType: compState.componentType,
      radixPackage: RADIX_MAP[compState.componentType] || null,
      styleMode: compState.styleMode,
      useTs: compState.useTs,
      code: { tsx: compState.generatedTsx, css: compState.generatedCss },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    parent.postMessage({ pluginMessage: { type: 'registry-save', entry: entry } }, '*');
  });
}

export function renderRegistryList() {
  var items = $('compRegistryItems');
  var empty = $('compRegistryEmpty');
  var count = $('compRegistryCount');
  if (!items) return;
  var query = ($('compSearchInput') ? $('compSearchInput').value : '').toLowerCase();
  var all = Object.keys(compState.registry).map(function (k) {
    return compState.registry[k];
  });
  var entries = all.filter(function (e) {
    return !query || e.name.toLowerCase().indexOf(query) !== -1;
  });
  items.innerHTML = '';
  if (entries.length === 0) {
    if (empty) empty.style.display = '';
  } else {
    if (empty) empty.style.display = 'none';
    entries.forEach(function (entry) {
      var updatedAt = entry.updatedAt ? new Date(entry.updatedAt).toLocaleDateString() : '-';
      var item = document.createElement('div');
      item.className = 'comp-registry-item';
      item.innerHTML =
        '<div class="comp-registry-item-info"><div class="comp-registry-item-name">' +
        entry.name +
        '</div><div class="comp-registry-item-meta">' +
        (entry.componentType || 'layout') +
        ' · ' +
        (entry.styleMode === 'css-modules' ? 'CSS Modules' : 'Styled') +
        ' · ' +
        updatedAt +
        '</div></div><div class="comp-registry-item-actions"><button class="comp-registry-del-btn">' +
        (lang === 'ko' ? '삭제' : 'Del') +
        '</button></div>';
      item.querySelector('.comp-registry-item-info').addEventListener('click', function () {
        showRegistryDetail(entry);
      });
      item.querySelector('.comp-registry-del-btn').addEventListener('click', function (e) {
        e.stopPropagation();
        if (confirm(lang === 'ko' ? entry.name + '을 삭제할까요?' : 'Delete ' + entry.name + '?'))
          parent.postMessage(
            { pluginMessage: { type: 'registry-delete', masterId: entry.figmaMasterNodeId } },
            '*'
          );
      });
      items.appendChild(item);
    });
  }
  if (count)
    count.textContent = lang === 'ko' ? '총 ' + entries.length + '개' : entries.length + ' items';
}

var _compSearchInput = $('compSearchInput');
if (_compSearchInput)
  _compSearchInput.addEventListener('input', function () {
    renderRegistryList();
  });

function showRegistryDetail(entry) {
  compState.currentEntry = entry;
  compState.activeDetailTab = 'tsx';
  compState.editMode = false;
  $('compRegistryList').style.display = 'none';
  $('compRegistryDetail').classList.remove('hidden');
  $('compDetailName').textContent = entry.name;
  $('compDetailMeta').textContent =
    (entry.componentType || 'layout') +
    ' · ' +
    (entry.styleMode === 'css-modules' ? 'CSS Modules' : 'Styled') +
    ' · ' +
    (entry.updatedAt ? new Date(entry.updatedAt).toLocaleDateString() : '-');
  var cssBtn = $('compDetailCssTabBtn');
  if (cssBtn) cssBtn.style.display = entry.styleMode === 'css-modules' ? '' : 'none';
  document.querySelectorAll('[data-comp-detail-tab]').forEach(function (btn) {
    btn.classList.toggle('active', btn.dataset.compDetailTab === 'tsx');
  });
  $('compDetailCode').value = entry.code.tsx;
  $('compDetailCode').readOnly = true;
  $('compDetailSaveEditBtn').style.display = 'none';
  $('compDetailCancelEditBtn').style.display = 'none';
  $('compDetailEditBtn').style.display = '';
}

document.querySelectorAll('[data-comp-detail-tab]').forEach(function (btn) {
  btn.addEventListener('click', function () {
    compState.activeDetailTab = btn.dataset.compDetailTab;
    document.querySelectorAll('[data-comp-detail-tab]').forEach(function (b) {
      b.classList.toggle('active', b.dataset.compDetailTab === compState.activeDetailTab);
    });
    if (compState.currentEntry)
      $('compDetailCode').value =
        compState.activeDetailTab === 'tsx'
          ? compState.currentEntry.code.tsx
          : compState.currentEntry.code.css;
  });
});

var _detailCopyBtn = $('compDetailCopyBtn');
if (_detailCopyBtn)
  _detailCopyBtn.addEventListener('click', function () {
    if (!compState.currentEntry) return;
    copyToClipboard(
      compState.activeDetailTab === 'tsx'
        ? compState.currentEntry.code.tsx
        : compState.currentEntry.code.css
    );
    showToast(t('component.copied'));
  });

var _detailEditBtn = $('compDetailEditBtn');
if (_detailEditBtn)
  _detailEditBtn.addEventListener('click', function () {
    $('compDetailCode').readOnly = false;
    $('compDetailCode').focus();
    $('compDetailSaveEditBtn').style.display = '';
    $('compDetailCancelEditBtn').style.display = '';
    $('compDetailEditBtn').style.display = 'none';
  });

var _detailSaveEditBtn = $('compDetailSaveEditBtn');
if (_detailSaveEditBtn)
  _detailSaveEditBtn.addEventListener('click', function () {
    if (!compState.currentEntry) return;
    var edited = $('compDetailCode').value;
    if (compState.activeDetailTab === 'tsx') compState.currentEntry.code.tsx = edited;
    else compState.currentEntry.code.css = edited;
    compState.currentEntry.updatedAt = new Date().toISOString();
    parent.postMessage(
      { pluginMessage: { type: 'registry-save', entry: compState.currentEntry } },
      '*'
    );
    $('compDetailCode').readOnly = true;
    $('compDetailSaveEditBtn').style.display = 'none';
    $('compDetailCancelEditBtn').style.display = 'none';
    $('compDetailEditBtn').style.display = '';
  });

var _detailCancelBtn = $('compDetailCancelEditBtn');
if (_detailCancelBtn)
  _detailCancelBtn.addEventListener('click', function () {
    if (!compState.currentEntry) return;
    $('compDetailCode').value =
      compState.activeDetailTab === 'tsx'
        ? compState.currentEntry.code.tsx
        : compState.currentEntry.code.css;
    $('compDetailCode').readOnly = true;
    $('compDetailSaveEditBtn').style.display = 'none';
    $('compDetailCancelEditBtn').style.display = 'none';
    $('compDetailEditBtn').style.display = '';
  });

var _detailUpdateBtn = $('compDetailUpdateBtn');
if (_detailUpdateBtn)
  _detailUpdateBtn.addEventListener('click', function () {
    if (!compState.currentEntry) return;
    if (
      !confirm(
        lang === 'ko'
          ? '현재 Figma 데이터로 코드를 다시 생성하고 덮어씁니다. 계속할까요?'
          : 'Regenerate from Figma and overwrite. Continue?'
      )
    )
      return;
    switchCompSubTab('generate');
    if (generateCompBtn) generateCompBtn.click();
  });

var _detailDeleteBtn = $('compDetailDeleteBtn');
if (_detailDeleteBtn)
  _detailDeleteBtn.addEventListener('click', function () {
    if (!compState.currentEntry) return;
    if (
      !confirm(
        lang === 'ko'
          ? compState.currentEntry.name + '을 삭제할까요?'
          : 'Delete ' + compState.currentEntry.name + '?'
      )
    )
      return;
    parent.postMessage(
      {
        pluginMessage: {
          type: 'registry-delete',
          masterId: compState.currentEntry.figmaMasterNodeId,
        },
      },
      '*'
    );
  });

var _detailBackBtn = $('compDetailBackBtn');
if (_detailBackBtn)
  _detailBackBtn.addEventListener('click', function () {
    $('compRegistryList').style.display = '';
    $('compRegistryDetail').classList.add('hidden');
    compState.currentEntry = null;
    renderRegistryList();
  });

var _exportAllBtn = $('compExportAllBtn');
if (_exportAllBtn)
  _exportAllBtn.addEventListener('click', function () {
    var blob = new Blob([JSON.stringify(compState.registry, null, 2)], {
      type: 'application/json',
    });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'component-registry.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast(t('component.downloadStart'));
  });

parent.postMessage({ pluginMessage: { type: 'registry-get' } }, '*');
