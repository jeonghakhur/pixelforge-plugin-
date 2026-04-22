'use strict';
import { $, showToast, sendToPixelForge } from './utils.js';

// ══════════════════════════════════════════════
// ── Frame Inspector Tab ──
// ══════════════════════════════════════════════

var _frameData = null;

function setFrameState(stateId) {
  ['frameStateIdle', 'frameStateLoading', 'frameStateResult', 'frameStateError'].forEach(
    function (id) { $(id).classList.add('hidden'); }
  );
  $(stateId).classList.remove('hidden');
}

// selection: { count, names, nodeTypes, meta } (selection-changed 페이로드)
export function updateFrameSelInfo(selection) {
  var info = $('frameSelInfo');
  if (!info) return;
  if (!selection || !selection.count) {
    info.textContent = '선택된 노드 없음';
    return;
  }
  var type = selection.nodeTypes && selection.nodeTypes[0];
  var name = selection.meta ? selection.meta.nodeName : (selection.names && selection.names[0]) || '';
  var isFrame = type === 'FRAME' || type === 'COMPONENT' || type === 'INSTANCE';
  info.textContent = isFrame
    ? type + ': ' + name
    : '⚠ FRAME 노드를 선택해 주세요 (현재: ' + (type || '?') + ')';
}

export function onFrameInspectResult(data) {
  _frameData = data;
  var meta = data.meta;
  $('frameResultMeta').textContent =
    meta.frameName + ' · ' + meta.totalNodes + '개 노드 · ' + meta.width + '×' + meta.height;
  $('frameResultPreview').textContent = JSON.stringify(data, null, 2).slice(0, 2000) + '\n...';
  setFrameState('frameStateResult');
  $('frameDownloadBtn').disabled = false;
  $('pfSendFrameBtn').disabled = false;
}

export function onFrameInspectError(message) {
  $('frameStateError').textContent = '오류: ' + message;
  setFrameState('frameStateError');
  $('frameDownloadBtn').disabled = true;
  $('pfSendFrameBtn').disabled = true;
}

// ── 추출 버튼 ──
var btnExtract = $('frameExtractBtn');
if (btnExtract) {
  btnExtract.addEventListener('click', function () {
    var maxDepth = parseInt($('frameMaxDepth').value, 10) || 8;
    _frameData = null;
    $('frameDownloadBtn').disabled = true;
    $('pfSendFrameBtn').disabled = true;
    setFrameState('frameStateLoading');
    parent.postMessage(
      { pluginMessage: { type: 'export-frame-inspect', options: { maxDepth: maxDepth } } },
      '*'
    );
  });
}

// ── JSON 다운로드 ──
var btnDownload = $('frameDownloadBtn');
if (btnDownload) {
  btnDownload.addEventListener('click', function () {
    if (!_frameData) return;
    var json = JSON.stringify(_frameData, null, 2);
    var blob = new Blob([json], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = (_frameData.meta.frameName || 'frame') + '.frame.json';
    a.click();
    URL.revokeObjectURL(url);
  });
}

// ── PixelForge 전송 ──
var btnSend = $('pfSendFrameBtn');
if (btnSend) {
  btnSend.addEventListener('click', function () {
    if (!_frameData) return;
    btnSend.disabled = true;
    sendToPixelForge('/api/sync/frame-inspect', _frameData)
      .then(function () {
        showToast('프레임 구조 전송 완료');
        btnSend.disabled = false;
      })
      .catch(function (e) {
        showToast('전송 실패: ' + (e && e.message ? e.message : String(e)), 'error');
        btnSend.disabled = false;
      });
  });
}
