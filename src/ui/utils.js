'use strict';

import { t } from './i18n.js';
import { state } from './state.js';

// ── DOM helper ──
export var $ = function (id) {
  return document.getElementById(id);
};

// ── Toast ──
var _toast = document.getElementById('toast');
var toastTimer = null;
export function showToast(msg) {
  if (!_toast) _toast = document.getElementById('toast');
  _toast.textContent = msg;
  _toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () {
    _toast.classList.remove('show');
  }, 2500);
}

// ── Scope ──
export function getScope() {
  var r = document.querySelector('input[name="scope"]:checked');
  return r ? r.value : 'all';
}

// ── PixelForge Send ──
export async function sendToPixelForge(endpoint, data) {
  var url = localStorage.getItem('pf_url');
  var key = localStorage.getItem('pf_key');
  if (!url || !key) {
    showToast(t('settings.notConnected'));
    return false;
  }

  try {
    var meta = state.extractedData ? state.extractedData.meta : {};
    var res = await fetch(url.replace(/\/$/, '') + endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': key },
      body: JSON.stringify(
        Object.assign({}, data, {
          figmaFileKey: meta.figmaFileKey || null,
          figmaFileName: meta.fileName || null,
        })
      ),
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    var result = await res.json();
    return result;
  } catch (e) {
    showToast(t('settings.sendFail') + ': ' + e.message);
    return false;
  }
}

// ── Clipboard ──
export function copyToClipboard(text) {
  var ta = document.createElement('textarea');
  ta.value = text;
  ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0';
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  document.execCommand('copy');
  document.body.removeChild(ta);
}
