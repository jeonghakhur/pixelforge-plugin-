'use strict';

// ── Modules ──
import { state } from './ui/state.js';
import { lang, t, registerLangChangeCallback } from './ui/i18n.js';
import { $, showToast } from './ui/utils.js';
import {
  showView,
  renderResult,
  renderCollections,
  renderSelectionInfo,
  updateExtractBtn,
  headerFile,
  updateFilterCacheBanner,
  showTokenCacheBadge,
  hideTokenCacheBadge,
  hideCacheBannerInTab,
  applyTokenCacheToTabs,
} from './ui/tab-extract.js';
import {
  exportIconsBtn,
  exportIconsAllBtn,
  renderIconResults,
  showCacheBadge,
  hideCacheBadge,
  syncIconMode,
  updateIconSelInfo,
} from './ui/tab-icons.js';
import { buildExtractedColors, renderA11yView } from './ui/tab-a11y.js';
import { onExtractThemesResult, onExtractThemesError } from './ui/tab-themes.js';
import {
  generateCompBtn,
  compState,
  showGeneratedResult,
  switchCompSubTab,
  updateCompSelInfo,
  onCompSelectionChanged,
  updateTypeHint,
  renderRegistryList,
} from './ui/tab-component.js';
import {
  buildRadixCSSModules,
  buildRadixCSS,
  buildRadixStyled,
  compToPascalCase,
} from './ui/component-builders.js';
import { imageAssets, setImgState, renderImageList } from './ui/tab-images.js';
import { loadSettings } from './ui/tab-settings.js';

// ── scope 변경 → icon tab syncIconMode 연결 ──
// tab-extract의 scope radio 리스너에서 window._syncIconMode()를 호출
window._syncIconMode = syncIconMode;

// ── lang 변경 → a11y matrix 재렌더 연결 ──
registerLangChangeCallback(function () {
  renderA11yView();
});

// ── Main Tab System ──
var currentMainTab = 'extract';
var mainTabs = document.querySelectorAll('.main-tab');
var tabPanels = {
  extract: $('panel-extract'),
  icons: $('panel-icons'),
  a11y: $('panel-a11y'),
  themes: $('panel-themes'),
  component: $('panel-component'),
  images: $('panel-images'),
  settings: $('panel-settings'),
};

function switchMainTab(tab) {
  currentMainTab = tab;
  mainTabs.forEach(function (t2) {
    t2.classList.toggle('active', t2.dataset.tab === tab);
  });
  Object.keys(tabPanels).forEach(function (k) {
    var el = tabPanels[k];
    if (k === tab) {
      el.style.display = 'flex';
      el.classList.remove('hidden');
    } else {
      el.style.display = 'none';
    }
  });
  if (tab === 'icons') {
    syncIconMode();
    updateIconSelInfo();
  }
  if (tab === 'a11y') {
    if (state.extractedColors.length === 0 && state.extractedData) {
      buildExtractedColors();
    }
    renderA11yView();
  }
  if (tab === 'component') updateCompSelInfo();
}

mainTabs.forEach(function (t2) {
  t2.addEventListener('click', function () {
    switchMainTab(t2.dataset.tab);
  });
});

// ── Messages from Figma ──
window.onmessage = function (event) {
  var msg = event.data.pluginMessage;
  if (!msg) return;

  if (msg.type === 'init-data') {
    headerFile.textContent = msg.fileName || (lang === 'ko' ? 'Figma 파일' : 'Figma File');
    renderCollections(msg.collections || []);
    if (msg.selection) {
      state.lastSelection = msg.selection;
      renderSelectionInfo(msg.selection);
    }
    updateExtractBtn();
  }

  if (msg.type === 'selection-changed') {
    state.lastSelection = msg.selection || { count: 0, names: [], nodeTypes: [], meta: null };
    renderSelectionInfo(state.lastSelection);
  }

  if (msg.type === 'inspect-result') {
    var json = JSON.stringify(msg.data, null, 2);
    var blob = new Blob([json], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'inspect_nodes.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast(lang === 'ko' ? 'inspect_nodes.json 저장됨' : 'inspect_nodes.json saved');
  }

  if (msg.type === 'extract-result') {
    renderResult(msg.data);
    buildExtractedColors();
    state.tokenCacheInfo = {
      savedAt: new Date().toISOString(),
      figmaFileId: null,
      figmaFileName: msg.data && msg.data.meta ? msg.data.meta.fileName : null,
    };
    showTokenCacheBadge(state.tokenCacheInfo.savedAt, state.tokenCacheInfo.figmaFileName);
    applyTokenCacheToTabs(msg.data);
  }

  if (msg.type === 'extract-error') {
    showView('filter');
    showToast(t('extract.errorPrefix') + (msg.message || t('extract.extractFail')));
  }

  // Icon results
  if (msg.type === 'export-icons-result') {
    exportIconsBtn.disabled = false;
    exportIconsBtn.textContent = t('icon.selBtn');
    renderIconResults(msg.data || []);
    hideCacheBadge();
  }
  if (msg.type === 'export-icons-error') {
    exportIconsBtn.disabled = false;
    exportIconsBtn.textContent = t('icon.selBtn');
    showToast(t('icon.exportFail') + (msg.message || ''));
  }
  if (msg.type === 'export-icons-all-result') {
    exportIconsAllBtn.disabled = false;
    exportIconsAllBtn.textContent = t('icon.allBtn');
    renderIconResults(msg.data || []);
    hideCacheBadge();
  }
  if (msg.type === 'export-icons-all-error') {
    exportIconsAllBtn.disabled = false;
    exportIconsAllBtn.textContent = t('icon.allBtn');
    showToast(t('icon.exportFail') + (msg.message || ''));
  }
  if (msg.type === 'cached-icon-data') {
    renderIconResults(msg.data || []);
    showCacheBadge(msg.savedAt);
  }
  if (msg.type === 'clear-icon-cache-done') {
    hideCacheBadge();
    renderIconResults([]);
    $('iconResults').classList.add('hidden');
  }

  // Theme results
  if (msg.type === 'extract-themes-result') {
    onExtractThemesResult(msg.data);
  }
  if (msg.type === 'extract-themes-error') {
    onExtractThemesError(msg.message);
  }

  // Component results
  if (msg.type === 'generate-component-result') {
    if (generateCompBtn) {
      generateCompBtn.disabled = false;
      generateCompBtn.textContent = t('component.generate');
    }
    var d = msg.data;
    if (d) {
      var name = compToPascalCase((d.name || 'Component').split('/').pop());
      if (d.detectedType && d.detectedType !== 'layout') {
        compState.componentType = d.detectedType;
        var _typeSelectEl = $('compTypeSelect');
        if (_typeSelectEl) _typeSelectEl.value = d.detectedType;
        updateTypeHint(d.detectedType);
      }
      var tsx, css;
      if (compState.styleMode === 'html') {
        tsx = d.html || '<div></div>';
        css = '';
      } else if (compState.styleMode === 'css-modules') {
        tsx = buildRadixCSSModules(d, name, compState.useTs);
        css = buildRadixCSS(d);
      } else {
        tsx = buildRadixStyled(d, name, compState.useTs);
        css = '';
      }
      showGeneratedResult(tsx, css, compState.styleMode);
    } else {
      showToast(t('component.cannotGenerate'));
    }
  }
  if (msg.type === 'generate-component-error') {
    if (generateCompBtn) {
      generateCompBtn.disabled = false;
      generateCompBtn.textContent = t('component.generate');
    }
    showToast(t('component.generateFail') + (msg.message || ''));
  }

  // Registry messages
  if (msg.type === 'registry-data') {
    compState.registry = msg.registry || {};
    renderRegistryList();
  }
  if (msg.type === 'registry-saved') {
    parent.postMessage({ pluginMessage: { type: 'registry-get' } }, '*');
    showToast(lang === 'ko' ? '레지스트리에 저장됐습니다' : 'Saved to registry');
    switchCompSubTab('registry');
  }
  if (msg.type === 'registry-deleted') {
    parent.postMessage({ pluginMessage: { type: 'registry-get' } }, '*');
    showToast(lang === 'ko' ? '삭제됐습니다' : 'Deleted');
    $('compRegistryList').style.display = '';
    $('compRegistryDetail').classList.add('hidden');
    compState.currentEntry = null;
  }
  if (msg.type === 'registry-error') {
    showToast((lang === 'ko' ? '레지스트리 오류: ' : 'Registry error: ') + (msg.message || ''));
  }

  // Image results
  if (msg.type === 'extract-images-result') {
    imageAssets.length = 0;
    var newAssets = msg.data || [];
    newAssets.forEach(function (a) {
      imageAssets.push(a);
    });
    // 디버그: 항상 결과 다운로드
    var debugResult = {
      assets: newAssets.length,
      errors: msg.errors || [],
      firstAsset:
        newAssets.length > 0
          ? {
              id: newAssets[0].id,
              name: newAssets[0].name,
              format: newAssets[0].format,
              scale: newAssets[0].scale,
              byteSize: newAssets[0].byteSize,
              base64Length: newAssets[0].base64 ? newAssets[0].base64.length : 0,
              mimeType: newAssets[0].mimeType,
            }
          : null,
    };
    var debugBlob = new Blob([JSON.stringify(debugResult, null, 2)], { type: 'application/json' });
    var debugUrl = URL.createObjectURL(debugBlob);
    var debugA = document.createElement('a');
    debugA.href = debugUrl;
    debugA.download = 'image-export-debug.json';
    debugA.click();
    URL.revokeObjectURL(debugUrl);
    if (imageAssets.length === 0) {
      setImgState('imgStateEmpty');
    } else {
      setImgState('imgStateList');
      renderImageList(imageAssets);
    }
  }
  if (msg.type === 'extract-images-error') {
    $('imgErrorMsg').textContent = t('image.error') + (msg.message || '');
    setImgState('imgStateError');
  }
  if (msg.type === 'extract-images-debug-result') {
    var debugJson = JSON.stringify(msg.nodes, null, 2);
    var dbgBlob = new Blob([debugJson], { type: 'application/json' });
    var dbgUrl = URL.createObjectURL(dbgBlob);
    var dbgA = document.createElement('a');
    dbgA.href = dbgUrl;
    dbgA.download = 'image-nodes-debug.json';
    dbgA.click();
    URL.revokeObjectURL(dbgUrl);
  }

  // Token cache
  if (msg.type === 'cached-token-data') {
    renderResult(msg.data);
    buildExtractedColors();
    state.tokenCacheInfo = {
      savedAt: msg.savedAt,
      figmaFileId: msg.figmaFileId,
      figmaFileName: msg.figmaFileName,
    };
    showTokenCacheBadge(msg.savedAt, msg.figmaFileName);
    applyTokenCacheToTabs(msg.data);
  }
  if (msg.type === 'token-cache-cleared') {
    state.extractedData = null;
    state.tokenCacheInfo = null;
    hideTokenCacheBadge();
    updateFilterCacheBanner();
    hideCacheBannerInTab('a11y');
    hideCacheBannerInTab('themes');
    hideCacheBannerInTab('images');
    showView('filter');
    showToast(t('extract.cacheCleared'));
  }

  // Cross-tab selection handling
  if (msg.type === 'selection-changed') {
    if (currentMainTab === 'icons') updateIconSelInfo();
    if (currentMainTab === 'component') onCompSelectionChanged();
  }
};

// ── Init ──
showView('filter');
loadSettings();

// Fallback: if no init-data arrives within 1s (non-Figma env)
setTimeout(function () {
  if (headerFile.textContent === '로딩 중...' || headerFile.textContent === 'Loading...') {
    headerFile.textContent = lang === 'ko' ? 'Figma 파일' : 'Figma File';
  }
  var colList = $('colList');
  if (
    colList &&
    colList.querySelector('.no-collections') &&
    (colList.textContent.trim() === '로딩 중...' || colList.textContent.trim() === 'Loading...')
  ) {
    colList.innerHTML =
      '<div class="no-collections">' + t('extract.noCollectionsFallback') + '</div>';
  }
}, 1000);
