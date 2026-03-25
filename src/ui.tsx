const html = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8" />
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 13px;
    color: #1e293b;
    background: #f8fafc;
    padding: 16px;
  }
  h1 {
    font-size: 16px;
    font-weight: 700;
    color: #2563eb;
    margin-bottom: 4px;
  }
  .subtitle {
    font-size: 12px;
    color: #64748b;
    margin-bottom: 16px;
  }
  .stats {
    display: flex;
    gap: 8px;
    margin-bottom: 12px;
    flex-wrap: wrap;
  }
  .stat {
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    border-radius: 6px;
    padding: 6px 10px;
    font-size: 12px;
    color: #1d4ed8;
    font-weight: 500;
  }
  .btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    border: none;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s;
  }
  .btn-primary {
    background: #2563eb;
    color: #fff;
    width: 100%;
    justify-content: center;
  }
  .btn-primary:hover { background: #1d4ed8; }
  .btn-primary:disabled { background: #93c5fd; cursor: not-allowed; }
  .btn-secondary {
    background: #e2e8f0;
    color: #334155;
  }
  .btn-secondary:hover { background: #cbd5e1; }
  .actions {
    display: flex;
    gap: 8px;
    margin-top: 8px;
    margin-bottom: 12px;
  }
  .preview {
    width: 100%;
    height: 240px;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    padding: 8px;
    font-family: 'SF Mono', 'Fira Code', monospace;
    font-size: 11px;
    resize: vertical;
    background: #fff;
    color: #334155;
    margin-top: 12px;
  }
  .hidden { display: none; }
  .spinner {
    display: inline-block;
    width: 14px;
    height: 14px;
    border: 2px solid #fff;
    border-top-color: transparent;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
</style>
</head>
<body>
  <h1>PixelForge Token Extractor</h1>
  <p class="subtitle">Variables와 Styles를 JSON으로 추출합니다</p>

  <button id="extractBtn" class="btn btn-primary" onclick="onExtract()">
    토큰 추출하기
  </button>

  <div id="result" class="hidden">
    <div id="stats" class="stats"></div>
    <div class="actions">
      <button class="btn btn-secondary" onclick="onCopy()">JSON 복사</button>
      <button class="btn btn-secondary" onclick="onDownload()">파일로 다운로드</button>
    </div>
    <textarea id="preview" class="preview" readonly></textarea>
  </div>

<script>
  let extractedData = null;

  function onExtract() {
    const btn = document.getElementById('extractBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> 추출 중...';
    parent.postMessage({ pluginMessage: { type: 'extract' } }, '*');
  }

  function onCopy() {
    const text = document.getElementById('preview').value;
    navigator.clipboard.writeText(text).then(() => {
      alert('클립보드에 복사되었습니다!');
    });
  }

  function onDownload() {
    if (!extractedData) return;
    const json = JSON.stringify(extractedData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pixelforge-tokens.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  window.onmessage = (event) => {
    const msg = event.data.pluginMessage;
    if (!msg || msg.type !== 'extract-result') return;

    extractedData = msg.data;
    const btn = document.getElementById('extractBtn');
    btn.disabled = false;
    btn.textContent = '토큰 추출하기';

    const { variables, styles } = extractedData;
    const statsEl = document.getElementById('stats');
    statsEl.innerHTML = [
      'Variables ' + variables.variables.length + '개',
      '컬렉션 ' + variables.collections.length + '개',
      '색상 ' + styles.colors.length + '개',
      '텍스트 ' + styles.texts.length + '개',
      '효과 ' + styles.effects.length + '개',
    ].map(s => '<span class="stat">' + s + '</span>').join('');

    document.getElementById('preview').value = JSON.stringify(extractedData, null, 2);
    document.getElementById('result').classList.remove('hidden');
  };
</script>
</body>
</html>`;

export default html;
