'use strict';
import JSZip from 'jszip';
import { state } from './state.js';
import { t } from './i18n.js';
import { $, showToast, getScope } from './utils.js';

// ══════════════════════════════════════════════
// ── Images Tab ──
// ══════════════════════════════════════════════
export var imageAssets = []; // ImageAsset[]
var imageFormat = 'PNG';
var imageScales = [1, 2]; // 선택된 배율 배열

// 포맷 버튼
document.querySelectorAll('.image-format-btn').forEach(function (btn) {
  btn.addEventListener('click', function () {
    imageFormat = btn.dataset.fmt;
    document.querySelectorAll('.image-format-btn').forEach(function (b) {
      b.classList.toggle('active', b.dataset.fmt === imageFormat);
    });
  });
});

// 배율 체크박스 토글
document.querySelectorAll('.image-scale-btn').forEach(function (btn) {
  btn.addEventListener('click', function () {
    var scale = parseInt(btn.dataset.scale, 10);
    var isActive = btn.classList.contains('active');
    if (isActive && imageScales.length === 1) return; // 최소 1개 유지
    if (isActive) {
      imageScales = imageScales.filter(function (s) {
        return s !== scale;
      });
    } else {
      imageScales.push(scale);
      imageScales.sort();
    }
    btn.classList.toggle('active', !isActive);
  });
});


export function setImgState(stateId) {
  ['imgStateIdle', 'imgStateDetecting', 'imgStateEmpty', 'imgStateError', 'imgStateList'].forEach(
    function (id) {
      $(id).classList.add('hidden');
    }
  );
  $(stateId).classList.remove('hidden');
}

export function renderImageList(assets) {
  var listEl = $('imgList');
  if (!listEl) return;

  // 노드별로 그룹핑 (같은 id의 여러 배율)
  var grouped = {};
  var order = [];
  assets.forEach(function (a) {
    if (!grouped[a.id]) {
      grouped[a.id] = [];
      order.push(a.id);
    }
    grouped[a.id].push(a);
  });

  listEl.innerHTML = order
    .map(function (nodeId) {
      var group = grouped[nodeId];
      var first = group[0];
      var thumbSrc = 'data:' + first.mimeType + ';base64,' + first.base64;
      var fileNames = group
        .map(function (a) {
          return a.fileName;
        })
        .join(' · ');
      return (
        '<div class="image-item">' +
        '<div class="image-thumb"><img src="' +
        thumbSrc +
        '" alt="' +
        escapeHtml(first.name) +
        '" /></div>' +
        '<div class="image-info">' +
        '<div class="image-name" title="' +
        escapeHtml(first.name) +
        '">' +
        escapeHtml(first.name) +
        '</div>' +
        '<div class="image-size">' +
        first.width +
        ' × ' +
        first.height +
        ' px</div>' +
        '<div class="image-files">' +
        escapeHtml(fileNames) +
        '</div>' +
        '</div>' +
        '<button class="image-dl-btn" data-node-id="' +
        nodeId +
        '">' +
        t('image.downloadOne') +
        '</button>' +
        '</div>'
      );
    })
    .join('');

  // 개별 다운로드 버튼
  listEl.querySelectorAll('.image-dl-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      downloadSingleImage(btn.dataset.nodeId);
    });
  });

  // 전체 다운로드 버튼 업데이트
  var totalFiles = assets.length;
  var nodeCount = order.length;
  var allBtn = $('imgDownloadAllBtn');
  if (allBtn) {
    allBtn.disabled = totalFiles === 0;
    $('imgDownloadAllCount').textContent =
      ' ' + t('image.downloadAllCount').replace('{n}', nodeCount).replace('{m}', totalFiles);
  }
}

// ── ZIP 유틸 (Store-only) ──
function strToBytes(str) {
  var bytes = new Uint8Array(str.length);
  for (var i = 0; i < str.length; i++) bytes[i] = str.charCodeAt(i) & 0xff;
  return bytes;
}

function uint32LE(n) {
  return new Uint8Array([n & 0xff, (n >> 8) & 0xff, (n >> 16) & 0xff, (n >> 24) & 0xff]);
}
function uint16LE(n) {
  return new Uint8Array([n & 0xff, (n >> 8) & 0xff]);
}

function concatBuffers(arrays) {
  var total = arrays.reduce(function (s, a) {
    return s + a.length;
  }, 0);
  var out = new Uint8Array(total);
  var pos = 0;
  arrays.forEach(function (a) {
    out.set(a, pos);
    pos += a.length;
  });
  return out;
}

function crc32(data) {
  var table = crc32.table;
  if (!table) {
    table = new Uint32Array(256);
    for (var i = 0; i < 256; i++) {
      var c = i;
      for (var j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[i] = c;
    }
    crc32.table = table;
  }
  var crc = 0xffffffff;
  for (var k = 0; k < data.length; k++) crc = table[(crc ^ data[k]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function buildStoreZip(files) {
  // files: Array<{ name: string, data: Uint8Array }>
  var localParts = [];
  var centralParts = [];
  var offsets = [];
  var offset = 0;

  files.forEach(function (file) {
    var nameBytes = strToBytes(file.name);
    var crc = crc32(file.data);
    var size = file.data.length;

    // Local file header
    var local = concatBuffers([
      new Uint8Array([0x50, 0x4b, 0x03, 0x04]), // signature
      uint16LE(20), // version needed
      uint16LE(0), // general purpose bit flag
      uint16LE(0), // compression method (store)
      uint16LE(0), // last mod time
      uint16LE(0), // last mod date
      uint32LE(crc),
      uint32LE(size),
      uint32LE(size),
      uint16LE(nameBytes.length),
      uint16LE(0), // extra field length
      nameBytes,
      file.data,
    ]);

    offsets.push(offset);
    offset += local.length;
    localParts.push(local);

    // Central directory entry
    var central = concatBuffers([
      new Uint8Array([0x50, 0x4b, 0x01, 0x02]), // signature
      uint16LE(20), // version made by
      uint16LE(20), // version needed
      uint16LE(0), // general purpose bit flag
      uint16LE(0), // compression method
      uint16LE(0), // last mod time
      uint16LE(0), // last mod date
      uint32LE(crc),
      uint32LE(size),
      uint32LE(size),
      uint16LE(nameBytes.length),
      uint16LE(0), // extra field length
      uint16LE(0), // file comment length
      uint16LE(0), // disk number start
      uint16LE(0), // internal file attributes
      uint32LE(0), // external file attributes
      uint32LE(offsets[offsets.length - 1]),
      nameBytes,
    ]);
    centralParts.push(central);
  });

  var centralSize = centralParts.reduce(function (s, c) {
    return s + c.length;
  }, 0);
  var eocd = concatBuffers([
    new Uint8Array([0x50, 0x4b, 0x05, 0x06]), // signature
    uint16LE(0), // disk number
    uint16LE(0), // disk with central dir
    uint16LE(files.length),
    uint16LE(files.length),
    uint32LE(centralSize),
    uint32LE(offset),
    uint16LE(0), // comment length
  ]);

  return concatBuffers(localParts.concat(centralParts).concat([eocd]));
}

function base64ToUint8(b64) {
  var bin = atob(b64);
  var arr = new Uint8Array(bin.length);
  for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr;
}

function downloadBlob(data, fileName, mime) {
  var blob = new Blob([data], { type: mime });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadSingleImage(nodeId) {
  var group = imageAssets.filter(function (a) {
    return a.id === nodeId;
  });
  if (group.length === 0) return;
  if (group.length === 1) {
    var a = group[0];
    downloadBlob(base64ToUint8(a.base64), a.fileName, a.mimeType);
  } else {
    var files = group.map(function (a) {
      return { name: a.fileName, data: base64ToUint8(a.base64) };
    });
    var zip = buildStoreZip(files);
    downloadBlob(zip, group[0].kebab + '.zip', 'application/zip');
  }
}

function downloadAllImagesZip() {
  if (imageAssets.length === 0) return;
  var files = imageAssets.map(function (a) {
    return { name: a.fileName, data: base64ToUint8(a.base64) };
  });
  var zip = buildStoreZip(files);
  var baseName =
    state.extractedData && state.extractedData.meta && state.extractedData.meta.fileName
      ? state.extractedData.meta.fileName
      : 'images';
  downloadBlob(zip, baseName + '-images.zip', 'application/zip');
}

var detectImagesBtn = $('detectImagesBtn');
var imgDownloadAllBtn = $('imgDownloadAllBtn');
var imgDebugBtn = $('imgDebugBtn');

if (imgDebugBtn) {
  imgDebugBtn.addEventListener('click', function () {
    parent.postMessage(
      { pluginMessage: { type: 'extract-images-debug', useSelection: getScope() === 'selection' } },
      '*'
    );
  });
}

if (detectImagesBtn) {
  detectImagesBtn.addEventListener('click', function () {
    setImgState('imgStateDetecting');
    parent.postMessage(
      {
        pluginMessage: {
          type: 'extract-images',
          options: { format: imageFormat, scales: imageScales, useSelection: getScope() === 'selection' },
        },
      },
      '*'
    );
  });
}

if (imgDownloadAllBtn) {
  imgDownloadAllBtn.addEventListener('click', downloadAllImagesZip);
}

var imgRetryBtn = $('imgRetryBtn');
if (imgRetryBtn) {
  imgRetryBtn.addEventListener('click', function () {
    setImgState('imgStateDetecting');
    parent.postMessage(
      {
        pluginMessage: {
          type: 'extract-images',
          options: { format: imageFormat, scales: imageScales, useSelection: getScope() === 'selection' },
        },
      },
      '*'
    );
  });
}
