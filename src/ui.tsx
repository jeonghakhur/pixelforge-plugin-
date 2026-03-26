const html = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8" />
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 13px;
    color: #1e293b;
    background: #f8fafc;
    padding: 14px;
    height: 100vh;
    overflow-y: auto;
  }
  h1 { font-size: 15px; font-weight: 700; color: #2563eb; margin-bottom: 2px; }
  .subtitle { font-size: 11px; color: #94a3b8; margin-bottom: 12px; }
  .section {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 10px 12px;
    margin-bottom: 10px;
  }
  .section-title {
    font-size: 11px;
    font-weight: 600;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 8px;
  }
  .toggle-row {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    user-select: none;
  }
  .toggle-row input[type="checkbox"] { width: 14px; height: 14px; accent-color: #2563eb; cursor: pointer; }
  .toggle-label { font-size: 13px; color: #334155; }
  .toggle-desc { font-size: 11px; color: #94a3b8; margin-top: 4px; margin-left: 22px; }
  .collections-grid {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .collection-item {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    padding: 4px 0;
  }
  .collection-item input[type="checkbox"] { width: 14px; height: 14px; accent-color: #2563eb; cursor: pointer; }
  .collection-name { font-size: 12px; color: #334155; flex: 1; }
  .collection-count { font-size: 11px; color: #94a3b8; }
  .empty-state { font-size: 12px; color: #94a3b8; padding: 4px 0; }
  .btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    width: 100%;
    padding: 9px 16px;
    border: none;
    border-radius: 7px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s;
    margin-bottom: 10px;
  }
  .btn-primary { background: #2563eb; color: #fff; }
  .btn-primary:hover { background: #1d4ed8; }
  .btn-primary:disabled { background: #93c5fd; cursor: not-allowed; }
  .btn-secondary { background: #e2e8f0; color: #334155; width: auto; padding: 6px 12px; }
  .btn-secondary:hover { background: #cbd5e1; }
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;
    margin-bottom: 10px;
  }
  .stat-card {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 7px;
    padding: 8px 10px;
    text-align: center;
  }
  .stat-value { font-size: 18px; font-weight: 700; color: #2563eb; }
  .stat-label { font-size: 10px; color: #64748b; margin-top: 1px; }
  .stat-sub { font-size: 10px; color: #94a3b8; margin-top: 2px; }
  .actions { display: flex; gap: 6px; margin-bottom: 10px; }
  .source-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    padding: 3px 8px;
    border-radius: 12px;
    margin-bottom: 8px;
    font-weight: 500;
  }
  .badge-all { background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; }
  .badge-selection { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }
  .preview {
    width: 100%;
    height: 200px;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 8px;
    font-family: 'SF Mono', 'Fira Code', monospace;
    font-size: 11px;
    resize: vertical;
    background: #fff;
    color: #334155;
  }
  .hidden { display: none; }
  .spinner {
    display: inline-block;
    width: 13px; height: 13px;
    border: 2px solid rgba(255,255,255,0.4);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
</style>
</head>
<body>
  <h1>PixelForge Token Extractor</h1>
  <p class="subtitle">Variables & Styles를 JSON으로 추출합니다</p>

  <div class="section">
    <div class="section-title">추출 범위</div>
    <label class="toggle-row">
      <input type="checkbox" id="selectionOnly" />
      <span class="toggle-label">선택된 레이어만</span>
    </label>
    <p class="toggle-desc" id="selectionDesc">현재 페이지 전체에서 추출합니다</p>
  </div>

  <div class="section">
    <div class="section-title">컬렉션 필터</div>
    <div id="collectionsWrap">
      <p class="empty-state">컬렉션 로딩 중...</p>
    </div>
  </div>

  <button id="extractBtn" class="btn btn-primary">토큰 추출하기</button>

  <div id="result" class="hidden">
    <div id="sourceBadge"></div>
    <div class="stats-grid" id="statsGrid"></div>
    <div class="actions">
      <button id="copyBtn" class="btn btn-secondary">JSON 복사</button>
      <button id="downloadBtn" class="btn btn-secondary">파일 다운로드</button>
    </div>
    <textarea id="preview" class="preview" readonly></textarea>
  </div>

<script>
(function() {
  var extractedData = null;
  var collections = [];

  // 컬렉션 체크박스 렌더링
  function renderCollections(cols) {
    collections = cols;
    var wrap = document.getElementById('collectionsWrap');
    if (!cols || cols.length === 0) {
      wrap.innerHTML = '<p class="empty-state">이 파일에 변수 컬렉션이 없습니다</p>';
      return;
    }
    var html = '<div class="collections-grid">';
    cols.forEach(function(col) {
      html += '<label class="collection-item">'
        + '<input type="checkbox" class="col-check" value="' + col.id + '" checked />'
        + '<span class="collection-name">' + col.name + '</span>'
        + '<span class="collection-count">' + col.variableIds.length + '개 변수</span>'
        + '</label>';
    });
    html += '</div>';
    wrap.innerHTML = html;
  }

  // 선택된 컬렉션 ID 목록
  function getSelectedCollectionIds() {
    var checks = document.querySelectorAll('.col-check:checked');
    return Array.prototype.map.call(checks, function(el) { return el.value; });
  }

  // 선택 범위 토글
  var selectionCheck = document.getElementById('selectionOnly');
  var selectionDesc = document.getElementById('selectionDesc');
  selectionCheck.addEventListener('change', function() {
    selectionDesc.textContent = this.checked
      ? '선택된 레이어 기준으로 사용 현황을 분석합니다'
      : '현재 페이지 전체에서 추출합니다';
  });

  // 추출 버튼
  var extractBtn = document.getElementById('extractBtn');
  extractBtn.addEventListener('click', function() {
    var options = {
      collectionIds: getSelectedCollectionIds(),
      useSelection: document.getElementById('selectionOnly').checked
    };
    extractBtn.disabled = true;
    extractBtn.innerHTML = '<span class="spinner"></span> 분석 중...';
    parent.postMessage({ pluginMessage: { type: 'extract', options: options } }, '*');
  });

  // 복사 버튼
  document.getElementById('copyBtn').addEventListener('click', function() {
    var text = document.getElementById('preview').value;
    navigator.clipboard.writeText(text).then(function() {
      alert('클립보드에 복사되었습니다!');
    });
  });

  // 다운로드 버튼
  document.getElementById('downloadBtn').addEventListener('click', function() {
    if (!extractedData) return;
    var json = JSON.stringify(extractedData, null, 2);
    var blob = new Blob([json], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'pixelforge-tokens.json';
    a.click();
    URL.revokeObjectURL(url);
  });

  // 결과 통계 렌더링
  function renderStats(data) {
    var vars = data.variables.variables;
    var usedVars = vars.filter(function(v) { return v.usageCount > 0; }).length;
    var colors = data.styles.colors;
    var usedColors = colors.filter(function(c) { return c.usageCount > 0; }).length;
    var texts = data.styles.texts;
    var usedTexts = texts.filter(function(t) { return t.usageCount > 0; }).length;

    document.getElementById('statsGrid').innerHTML = [
      { value: vars.length, label: '변수', sub: usedVars + '개 사용 중' },
      { value: colors.length, label: '색상 스타일', sub: usedColors + '개 사용 중' },
      { value: texts.length, label: '텍스트 스타일', sub: usedTexts + '개 사용 중' },
      { value: data.variables.collections.length, label: '컬렉션', sub: '' },
      { value: data.styles.effects.length, label: '이펙트', sub: '' },
      { value: data.meta.totalNodes, label: '스캔 노드', sub: '' },
    ].map(function(s) {
      return '<div class="stat-card">'
        + '<div class="stat-value">' + s.value + '</div>'
        + '<div class="stat-label">' + s.label + '</div>'
        + (s.sub ? '<div class="stat-sub">' + s.sub + '</div>' : '')
        + '</div>';
    }).join('');

    var isSelection = data.meta.sourceMode === 'selection';
    document.getElementById('sourceBadge').innerHTML = isSelection
      ? '<span class="source-badge badge-selection">선택된 레이어 기준</span>'
      : '<span class="source-badge badge-all">페이지 전체 기준</span>';
  }

  // 메시지 수신
  window.onmessage = function(event) {
    var msg = event.data && event.data.pluginMessage;
    if (!msg) return;

    if (msg.type === 'init-collections') {
      renderCollections(msg.collections);
      return;
    }

    if (msg.type === 'extract-error') {
      extractBtn.disabled = false;
      extractBtn.textContent = '토큰 추출하기';
      alert('추출 실패: ' + msg.message);
      return;
    }

    if (msg.type === 'extract-result') {
      extractedData = msg.data;
      extractBtn.disabled = false;
      extractBtn.textContent = '토큰 추출하기';
      renderStats(extractedData);
      document.getElementById('preview').value = JSON.stringify(extractedData, null, 2);
      document.getElementById('result').classList.remove('hidden');
    }
  };
})();
</script>
</body>
</html>`;

export default html;
