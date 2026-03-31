'use strict';

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
