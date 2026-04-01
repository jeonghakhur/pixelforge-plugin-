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

// ── PixelForge Settings (in-memory, loaded via clientStorage message) ──
export var pfSettings = { url: '', key: '' };
export function setPfSettings(url, key) {
  pfSettings.url = url || '';
  pfSettings.key = key || '';
}

// ── PixelForge Send ──
// method: 'POST'(기본) | 'GET'
// GET이면 data 무시, endpoint에 쿼리스트링 포함해서 전달
export async function sendToPixelForge(endpoint, data, method) {
  var url = pfSettings.url;
  var key = pfSettings.key;
  if (!url || !key) {
    if (method !== 'GET') showToast(t('settings.notConnected'));
    return null;
  }

  var reqMethod = method || 'POST';
  var fullUrl = url.replace(/\/$/, '') + endpoint;

  try {
    var fetchOpts = { method: reqMethod, headers: { 'X-API-Key': key } };

    if (reqMethod === 'POST') {
      var meta = state.extractedData ? state.extractedData.meta : {};
      // data에 이미 figmaFileKey가 있으면 우선, 없으면 meta에서 보완
      var payload = Object.assign({}, data);
      if (!payload.figmaFileKey) payload.figmaFileKey = (meta && meta.figmaFileKey) || state.figmaFileKey || null;
      if (!payload.figmaFileName) payload.figmaFileName = (meta && meta.fileName) || state.figmaFileName || null;
      fetchOpts.headers['Content-Type'] = 'application/json';
      fetchOpts.body = JSON.stringify(payload);
    }

    var res = await fetch(fullUrl, fetchOpts);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.json();
  } catch (e) {
    if (reqMethod !== 'GET') showToast(t('settings.sendFail') + ': ' + e.message);
    return null;
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
