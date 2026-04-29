'use strict';
import { state } from './state.js';
import { lang, t } from './i18n.js';
import { $, showToast, copyToClipboard, sendToPixelForge, pfSettings } from './utils.js';
import { RADIX_MAP, RADIX_COMPONENT_REGISTRY, detectComponentType, compToPascalCase, buildRadixCSSModules, buildRadixCSS, buildRadixStyled, filterTypographyStyles, stylesToCSSProps } from './component-builders.js';
import { highlightTSX, highlightCSS } from '../converters/highlight.js';

// ── DB 동기화 헬퍼 ──

export function componentTypeToCategory(type) {
  var form = ['input', 'select', 'checkbox', 'radio', 'textarea', 'form', 'switch'];
  var nav  = ['navigation', 'menu', 'breadcrumb', 'tabs', 'pagination', 'sidebar', 'navbar'];
  var feed = ['dialog', 'modal', 'toast', 'alert', 'badge', 'progress', 'spinner', 'tooltip', 'popover'];
  if (form.indexOf(type) !== -1) return 'form';
  if (nav.indexOf(type) !== -1)  return 'navigation';
  if (feed.indexOf(type) !== -1) return 'feedback';
  return 'action';
}

export function getGlobalCss() {
  if (!state.extractedData) return '';
  var vars = state.extractedData.variables;
  if (!vars || !vars.collections) return '';
  var lines = [':root {'];
  vars.collections.forEach(function (col) {
    if (!col.variables) return;
    col.variables.forEach(function (v) {
      if (v.cssVar && v.value !== undefined && v.value !== null) {
        lines.push('  ' + v.cssVar + ': ' + v.value + ';');
      }
    });
  });
  lines.push('}');
  if (lines.length <= 2) return '';
  return lines.join('\n');
}

export function buildComponentFiles(nodeData, cState) {
  var name = compToPascalCase((nodeData.name || 'Component').split('/').pop());
  var files = [];
  if (cState.styleMode === 'css-modules') {
    files.push({ styleMode: 'css-modules', fileType: 'tsx', fileName: name + '.tsx',        content: cState.generatedTsx || '' });
    files.push({ styleMode: 'css-modules', fileType: 'css', fileName: name + '.module.css', content: cState.generatedCss || '' });
  } else if (cState.styleMode === 'styled') {
    files.push({ styleMode: 'styled', fileType: 'tsx', fileName: name + '.tsx', content: cState.generatedTsx || '' });
  } else if (cState.styleMode === 'html') {
    // separated 모드는 <style> 포함 완전한 HTML 단일 파일로 출력
    files.push({ styleMode: 'html', fileType: 'html', fileName: name.toLowerCase() + '.html', content: cState.generatedTsx || '' });
  }
  return files;
}

export function refreshComponentDbStatus() {
  var fileKey = state.figmaFileKey;
  if (!fileKey) return;
  sendToPixelForge('/api/sync/components?figmaFileKey=' + encodeURIComponent(fileKey), null, 'GET')
    .then(function (res) {
      if (!res || !Array.isArray(res.components)) return;
      var dbMap = {};
      res.components.forEach(function (c) {
        if (c.figmaNodeId) dbMap[c.figmaNodeId] = c;
      });
      Object.keys(compState.registry).forEach(function (key) {
        var entry = compState.registry[key];
        var dbEntry = dbMap[entry.figmaMasterNodeId];
        if (dbEntry) {
          entry.dbId = dbEntry.id;
          entry.dbStatus = 'synced';
        } else if (entry.dbSyncedAt) {
          entry.dbStatus = 'deleted-from-app';
        } else {
          entry.dbStatus = 'local-only';
        }
      });
      renderRegistryList();
    });
}

export var compState = {
  meta: null,
  componentType: null,
  styleMode: 'css-modules',
  htmlStyleMode: 'inline',
  useTs: true,
  generatedTsx: '',
  generatedCss: '',
  nodeData: null,
  registry: {},
  currentEntry: null,
  activeCodeTab: 'tsx',
  activeDetailTab: 'tsx',
  editMode: false,
};

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function showGeneratedResult(tsx, css, styleMode, nodeData) {
  compState.generatedTsx = tsx;
  compState.generatedCss = css;
  compState.nodeData = nodeData || null;
  compState.activeCodeTab = 'tsx';
  var cssTabBtn = $('compCssTabBtn');
  if (cssTabBtn) cssTabBtn.style.display = styleMode === 'css-modules' ? '' : 'none';
  var tsxTabBtn = document.querySelector('[data-comp-code-tab="tsx"]');
  if (tsxTabBtn) tsxTabBtn.textContent = styleMode === 'html' ? 'HTML' : 'TSX';
  document.querySelectorAll('[data-comp-code-tab]').forEach(function (btn) {
    btn.classList.toggle('active', btn.dataset.compCodeTab === 'tsx');
  });
  $('compCode').innerHTML = highlightTSX(tsx);
  $('compResult').classList.remove('hidden');
  var compResultBar = $('compResultBar');
  if (compResultBar) compResultBar.classList.remove('hidden');
  var nameSource = (compState.nodeData && compState.nodeData.name)
    || (compState.meta && compState.meta.nodeName)
    || (nodeData && nodeData.name)
    || '';
  if (nameSource) {
    var parts = nameSource.split('/');
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
  var emptyState = $('compEmptyState');
  var optionsCard = $('compOptionsCard');
  if (!info) return;
  if (state.lastSelection.count > 0 && state.lastSelection.meta) {
    info.textContent = (lang === 'ko' ? '선택: ' : 'Selected: ') + state.lastSelection.meta.nodeName;
    info.style.color = 'var(--primary)';
    info.style.background = 'var(--primary-light)';
    info.style.border = '1px solid var(--primary-border)';
    if (emptyState) emptyState.style.display = 'none';
    if (optionsCard) optionsCard.style.display = 'block';
  } else {
    info.textContent = t('component.noSel');
    info.style.color = 'var(--text-muted)';
    info.style.background = 'var(--bg)';
    info.style.border = 'none';
    if (emptyState) emptyState.style.display = 'flex';
    if (optionsCard) optionsCard.style.display = 'none';
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
  if (ts) ts.value = detected || '';
  updateTypeHint(detected);

  var ni = $('compNameInput');
  if (ni && !ni.value.trim()) {
    var parts = meta.nodeName.split('/');
    ni.value = compToPascalCase(parts[parts.length - 1]);
  }

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
  if (!type) {
    hint.textContent = '';
    return;
  }
  var entry = RADIX_COMPONENT_REGISTRY[type];
  if (entry && entry.themeComponent) {
    hint.textContent = 'npm install @radix-ui/themes';
  } else if (entry && !entry.themeComponent) {
    hint.textContent = 'npm install ' + entry.pkg;
  } else if (type === 'layout') {
    hint.textContent = lang === 'ko' ? '시맨틱 HTML 태그' : 'Semantic HTML';
  } else {
    hint.textContent = 'npm install @radix-ui/themes';
  }
}

var _typeSelect = $('compTypeSelect');
if (_typeSelect)
  _typeSelect.addEventListener('change', function () {
    compState.componentType = _typeSelect.value || null;
    updateTypeHint(_typeSelect.value || null);
  });

document.querySelectorAll('.comp-style-btn').forEach(function (btn) {
  btn.addEventListener('click', function () {
    compState.styleMode = btn.dataset.compStyle;
    document.querySelectorAll('.comp-style-btn').forEach(function (b) {
      b.classList.toggle('active', b.dataset.compStyle === compState.styleMode);
    });
    var htmlOpts = $('compHtmlStyleOptions');
    if (htmlOpts) htmlOpts.style.display = compState.styleMode === 'html' ? 'flex' : 'none';
  });
});

document.querySelectorAll('input[name="htmlStyleMode"]').forEach(function (radio) {
  radio.addEventListener('change', function () {
    compState.htmlStyleMode = radio.value;
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

function syncCompCopyBtn(tab) {
  var btn = $('compCopyBtn');
  if (!btn) return;
  btn.textContent = tab === 'node'
    ? (lang === 'ko' ? 'Node 저장' : 'Save Node')
    : t('component.copy');
}

document.querySelectorAll('[data-comp-code-tab]').forEach(function (btn) {
  btn.addEventListener('click', function () {
    compState.activeCodeTab = btn.dataset.compCodeTab;
    document.querySelectorAll('[data-comp-code-tab]').forEach(function (b) {
      b.classList.toggle('active', b.dataset.compCodeTab === compState.activeCodeTab);
    });
    if (compState.activeCodeTab === 'tsx') {
      $('compCode').innerHTML = highlightTSX(compState.generatedTsx);
    } else if (compState.activeCodeTab === 'css') {
      $('compCode').innerHTML = highlightCSS(compState.generatedCss);
    } else if (compState.activeCodeTab === 'node') {
      $('compCode').innerHTML = escapeHtml(JSON.stringify({
        meta: compState.meta,
        data: compState.nodeData,
      }, null, 2));
    }
    syncCompCopyBtn(compState.activeCodeTab);
  });
});

var _compCopyBtn = $('compCopyBtn');
if (_compCopyBtn)
  _compCopyBtn.addEventListener('click', function () {
    if (compState.activeCodeTab === 'node') {
      if (!compState.nodeData) { showToast(t('component.selectFirst')); return; }
      var nameVal = (($('compNameInput') && $('compNameInput').value) || '').trim()
        || compToPascalCase(((compState.nodeData && compState.nodeData.name) || 'component').split('/').pop());
      var payload = JSON.stringify({ meta: compState.meta, data: compState.nodeData }, null, 2);
      var blob = new Blob([payload], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = nameVal + '.node.json';
      a.click();
      URL.revokeObjectURL(url);
      showToast(nameVal + '.node.json ' + (lang === 'ko' ? '저장됨' : 'saved'));
      return;
    }
    var content = compState.activeCodeTab === 'css'
      ? compState.generatedCss
      : compState.generatedTsx;
    copyToClipboard(content);
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
    if (!compState.componentType) {
      showToast(t('component.typeRequired'));
      var ts = $('compTypeSelect');
      if (ts) ts.focus();
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
      dbId: null,
      dbSyncedAt: null,
      dbStatus: 'local-only',
    };
    parent.postMessage({ pluginMessage: { type: 'registry-save', entry: entry } }, '*');

    // DB 동기화 — 사용자 입력 이름 사용, 연결 없으면 silent
    if (pfSettings.url && pfSettings.key) {
      var _files = buildComponentFiles({ name: nameVal }, compState);
      sendToPixelForge('/api/sync/components', {
        figmaFileKey: state.figmaFileKey || null,
        figmaFileName: state.figmaFileName || null,
        component: {
          name: nameVal,
          category: componentTypeToCategory(compState.componentType),
          description: 'Figma: ' + (compState.meta.nodeName || ''),
          figmaNodeId: key,
          defaultStyleMode: compState.styleMode,
          files: _files,
          nodeSnapshot: compState.nodeData ? {
            figmaNodeData: JSON.stringify(compState.nodeData),
            figmaVersion: null,
            trigger: 'generate',
          } : null,
        },
      }).then(function (res) {
        if (res && res.componentId) {
          entry.dbId = res.componentId;
          entry.dbSyncedAt = new Date().toISOString();
          entry.dbStatus = 'synced';
          parent.postMessage({ pluginMessage: { type: 'registry-save', entry: entry } }, '*');
        }
      });
    }
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
      var dbBadge = '';
      if (entry.dbStatus === 'synced') {
        dbBadge = '<span class="db-badge db-badge--synced">DB</span>';
      } else if (entry.dbStatus === 'deleted-from-app') {
        dbBadge = '<span class="db-badge db-badge--deleted">' + (lang === 'ko' ? '앱 삭제됨' : 'Removed') + '</span>';
      }
      var item = document.createElement('div');
      item.className = 'comp-registry-item';
      item.innerHTML =
        '<div class="comp-registry-item-info"><div class="comp-registry-item-name">' +
        entry.name + dbBadge +
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

    // DB 동기화 — 수정된 코드 반영, 이름 그대로 유지
    if (pfSettings.url && pfSettings.key) {
      var _editEntry = compState.currentEntry;
      var _editState = {
        styleMode: _editEntry.styleMode,
        generatedTsx: _editEntry.code.tsx,
        generatedCss: _editEntry.code.css,
      };
      var _editFiles = buildComponentFiles({ name: _editEntry.name }, _editState);
      sendToPixelForge('/api/sync/components', {
        figmaFileKey: state.figmaFileKey || null,
        figmaFileName: state.figmaFileName || null,
        component: {
          name: _editEntry.name,
          category: componentTypeToCategory(_editEntry.componentType || 'layout'),
          description: 'Figma: ' + (_editEntry.figmaNodeName || ''),
          figmaNodeId: _editEntry.figmaMasterNodeId || null,
          defaultStyleMode: _editEntry.styleMode,
          files: _editFiles,
          nodeSnapshot: null,
        },
      }).then(function (res) {
        if (res && res.componentId) {
          _editEntry.dbId = res.componentId;
          _editEntry.dbSyncedAt = new Date().toISOString();
          _editEntry.dbStatus = 'synced';
        }
      });
    }
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

// ── Node JSON 다운로드 ──
var compDownloadNodeBtn = $('compDownloadNodeBtn');
if (compDownloadNodeBtn) {
  compDownloadNodeBtn.addEventListener('click', function () {
    if (!compState.nodeData) { showToast(t('component.selectFirst')); return; }
    var nameVal = (($('compNameInput') && $('compNameInput').value) || '').trim()
      || compToPascalCase(((compState.nodeData && compState.nodeData.name) || (compState.nodeData.meta && compState.nodeData.meta.nodeName) || 'component').split('/').pop());
    var payload = { meta: compState.meta, data: compState.nodeData };
    var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = nameVal + '.node.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast(nameVal + '.node.json 저장됨');
  });
}

// ── PixelForge Send (현재 생성된 컴포넌트 단건 전송) ──
var compSendBtn = $('compSendBtn');
if (compSendBtn) {
  compSendBtn.addEventListener('click', async function () {
    // 현재 선택 없으면 마지막 생성된 nodeData.meta 폴백
    var meta = compState.meta || (compState.nodeData && compState.nodeData.meta) || null;
    if (!meta) { showToast(t('component.selectFirst')); return; }
    if (!compState.componentType) {
      showToast(t('component.typeRequired'));
      var ts = $('compTypeSelect');
      if (ts) ts.focus();
      return;
    }
    var nameVal = (($('compNameInput') && $('compNameInput').value) || '').trim();
    if (!nameVal) {
      nameVal = compToPascalCase(((compState.nodeData && compState.nodeData.name) || meta.nodeName || 'Component').split('/').pop());
    }
    compSendBtn.disabled = true;
    compSendBtn.textContent = t('settings.sending');
    try {
      var res = await sendToPixelForge('/api/sync/components', {
        figmaFileKey: state.figmaFileKey || null,
        figmaFileName: state.figmaFileName || null,
        componentType: compState.componentType,
        styleMode: compState.styleMode,
        data: Object.assign({}, compState.nodeData, { name: nameVal }),
      });
      if (res) showToast(t('settings.sendSuccess'));
    } finally {
      compSendBtn.disabled = false;
      compSendBtn.textContent = t('settings.sendBtn');
    }
  });
}

// ── PixelForge Send (전체 레지스트리 동기화) ──
var pfSendComponentBtn = $('pfSendComponentBtn');
if (pfSendComponentBtn) {
  pfSendComponentBtn.addEventListener('click', async function () {
    var entries = Object.values(compState.registry);
    if (entries.length === 0) return;
    pfSendComponentBtn.disabled = true;
    pfSendComponentBtn.textContent = t('settings.sending');
    var synced = 0;
    try {
      for (var i = 0; i < entries.length; i++) {
        var e = entries[i];
        var _files = buildComponentFiles({ name: e.name }, {
          styleMode: e.styleMode,
          generatedTsx: e.code ? e.code.tsx : '',
          generatedCss: e.code ? e.code.css : '',
        });
        var res = await sendToPixelForge('/api/sync/components', {
          figmaFileKey: state.figmaFileKey || null,
          figmaFileName: state.figmaFileName || null,
          component: {
            name: e.name,
            category: componentTypeToCategory(e.componentType),
            description: 'Figma: ' + (e.figmaNodeName || ''),
            figmaNodeId: e.figmaMasterNodeId || null,
            defaultStyleMode: e.styleMode || 'css-modules',
            files: _files,
            nodeSnapshot: null,
          },
        });
        if (res && res.componentId) {
          e.dbId = res.componentId;
          e.dbSyncedAt = new Date().toISOString();
          e.dbStatus = 'synced';
          synced++;
        }
      }
      if (synced > 0) {
        showToast(lang === 'ko' ? synced + '개 DB 동기화 완료' : synced + ' synced to DB');
        renderRegistryList();
      }
    } finally {
      pfSendComponentBtn.disabled = false;
      pfSendComponentBtn.textContent = t('settings.sendBtn');
    }
  });
}
