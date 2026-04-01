'use strict';

import { t } from './i18n.js';
import { $, showToast, setPfSettings, pfSettings } from './utils.js';

// ── DOM ──
var pfUrlInput = $('pfUrlInput');
var pfKeyInput = $('pfKeyInput');
var pfTestBtn = $('pfTestBtn');
var pfSaveBtn = $('pfSaveBtn');
var pfStatusDot = document.querySelector('.settings-status-dot');
var pfStatusText = $('pfStatusText');

// ── Connection state ──
var isConnected = false;

export function isPfConnected() {
  return isConnected;
}

function setConnectionStatus(connected) {
  isConnected = connected;
  if (pfStatusDot) {
    pfStatusDot.classList.toggle('connected', connected);
    pfStatusDot.classList.toggle('disconnected', !connected);
  }
  if (pfStatusText) {
    pfStatusText.textContent = connected ? t('settings.connected') : t('settings.disconnected');
  }
}

// ── Load saved settings (called from ui.js on 'settings-data' message) ──
export function loadSettings() {
  // 설정은 code.ts → 'settings-data' 메시지로 수신됨 (onSettingsData 참고)
}

export function onSettingsData(url, key) {
  if (pfUrlInput) pfUrlInput.value = url || '';
  if (pfKeyInput) pfKeyInput.value = key || '';
  setPfSettings(url, key);
  if (url && key) {
    testConnection(true);
  }
}

// ── Save settings ──
function saveSettings() {
  var url = pfUrlInput ? pfUrlInput.value.trim() : '';
  var key = pfKeyInput ? pfKeyInput.value.trim() : '';
  setPfSettings(url, key);
  parent.postMessage({ pluginMessage: { type: 'set-settings', url: url, key: key } }, '*');
  showToast(t('settings.saved'));
}

// ── Test connection ──
function testConnection(silent) {
  var url = pfUrlInput ? pfUrlInput.value.trim() : '';
  var key = pfKeyInput ? pfKeyInput.value.trim() : '';
  if (!url || !key) {
    setConnectionStatus(false);
    if (!silent) showToast(t('settings.notConnected'));
    return;
  }
  setPfSettings(url, key);

  if (!silent) {
    pfTestBtn.disabled = true;
    pfTestBtn.textContent = t('settings.testing');
  }

  fetch(url.replace(/\/$/, '') + '/api/ping', {
    method: 'GET',
    headers: { 'X-API-Key': key },
  })
    .then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      setConnectionStatus(true);
      if (!silent) showToast(t('settings.testSuccess'));
    })
    .catch(function () {
      setConnectionStatus(false);
      if (!silent) showToast(t('settings.testFail'));
    })
    .finally(function () {
      if (!silent && pfTestBtn) {
        pfTestBtn.disabled = false;
        pfTestBtn.textContent = t('settings.testBtn');
      }
    });
}

// ── 진단 도구 ──
var pfDiagBtn = $('pfDiagBtn');
var pfDiagLog = $('pfDiagLog');

function diagLog(icon, msg) {
  if (!pfDiagLog) return;
  pfDiagLog.style.display = 'block';
  var line = document.createElement('div');
  line.textContent = icon + ' ' + msg;
  pfDiagLog.appendChild(line);
  pfDiagLog.scrollTop = pfDiagLog.scrollHeight;
}

if (pfDiagBtn) {
  pfDiagBtn.addEventListener('click', async function () {
    if (!pfDiagLog) return;
    pfDiagLog.innerHTML = '';
    pfDiagLog.style.display = 'block';
    pfDiagBtn.disabled = true;

    // 1. 메모리 설정 확인
    var url = pfSettings.url;
    var key = pfSettings.key;
    diagLog('🔍', 'URL: ' + (url || '(없음)'));
    diagLog('🔍', 'KEY: ' + (key ? key.slice(0, 8) + '...' : '(없음)'));

    if (!url || !key) {
      diagLog('❌', 'URL 또는 API 키가 설정되지 않았습니다');
      pfDiagBtn.disabled = false;
      return;
    }

    // 2. ping 테스트
    diagLog('⏳', '/api/ping 요청 중...');
    try {
      var pingRes = await fetch(url.replace(/\/$/, '') + '/api/ping', {
        method: 'GET',
        headers: { 'X-API-Key': key },
      });
      diagLog(pingRes.ok ? '✅' : '❌', 'ping 응답: HTTP ' + pingRes.status);
      if (!pingRes.ok) {
        pfDiagBtn.disabled = false;
        return;
      }
    } catch (e) {
      diagLog('❌', 'ping 실패: ' + e.message);
      pfDiagBtn.disabled = false;
      return;
    }

    // 3. 전송 테스트 (더미 데이터)
    diagLog('⏳', '/api/sync/tokens 테스트 전송...');
    try {
      var testRes = await fetch(url.replace(/\/$/, '') + '/api/sync/tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': key },
        body: JSON.stringify({
          figmaFileKey: 'diag-test',
          figmaFileName: 'PixelForge 진단',
          tokens: { variables: { collections: [], variables: [] } },
          css: '',
        }),
      });
      var testBody = await testRes.json();
      diagLog(testRes.ok ? '✅' : '❌', '전송 응답: HTTP ' + testRes.status + ' → ' + JSON.stringify(testBody).slice(0, 60));
    } catch (e) {
      diagLog('❌', '전송 실패: ' + e.message);
    }

    // 4. state 확인
    diagLog('🔍', 'extractedData: ' + (window._pfState && window._pfState.extractedData ? '있음' : '없음 (추출 필요)'));

    diagLog('✅', '진단 완료');
    pfDiagBtn.disabled = false;
  });
}

// ── Event listeners ──
if (pfTestBtn) {
  pfTestBtn.addEventListener('click', function () {
    testConnection(false);
  });
}

if (pfSaveBtn) {
  pfSaveBtn.addEventListener('click', function () {
    saveSettings();
    testConnection(true);
  });
}
