'use strict';

import { t } from './i18n.js';
import { $, showToast } from './utils.js';

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

// ── Load saved settings ──
export function loadSettings() {
  var savedUrl = localStorage.getItem('pf_url');
  var savedKey = localStorage.getItem('pf_key');
  if (savedUrl && pfUrlInput) pfUrlInput.value = savedUrl;
  if (savedKey && pfKeyInput) pfKeyInput.value = savedKey;
  if (savedUrl && savedKey) {
    testConnection(true);
  }
}

// ── Save settings ──
function saveSettings() {
  var url = pfUrlInput.value.trim();
  var key = pfKeyInput.value.trim();
  localStorage.setItem('pf_url', url);
  localStorage.setItem('pf_key', key);
  showToast(t('settings.saved'));
}

// ── Test connection ──
function testConnection(silent) {
  var url = pfUrlInput.value.trim();
  var key = pfKeyInput.value.trim();
  if (!url || !key) {
    setConnectionStatus(false);
    if (!silent) showToast(t('settings.notConnected'));
    return;
  }

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
