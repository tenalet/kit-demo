async function api(method, path, body) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }

  const res = await fetch('/api' + path, options);
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const msg = data?.message || data?.error || `Request failed (${res.status})`;
    throw new Error(msg);
  }

  return data;
}

async function getConfig() {
  return api('GET', '/config');
}

// Load mode badge into nav
(async function initModeBadge() {
  try {
    var config = await getConfig();
    var el = document.getElementById('mode-badge');
    if (el && config.mode) {
      el.textContent = config.mode === 'test' ? 'sandbox' : 'live';
      el.className = 'mode-badge ' + (config.mode === 'test' ? 'mode-test' : 'mode-live');
    }
  } catch (_) {}
})();

function qs(key) {
  return new URLSearchParams(window.location.search).get(key);
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString();
}

function statusBadge(status) {
  const map = {
    draft: 'badge-yellow',
    submitted: 'badge-green',
    approved: 'badge-green',
    rejected: 'badge-red',
  };
  const cls = map[status] || 'badge-gray';
  return `<span class="badge ${cls}">${status}</span>`;
}

function enableTabInEditor(textarea) {
  textarea.addEventListener('keydown', function (e) {
    if (e.key === 'Tab') {
      e.preventDefault();
      var start = textarea.selectionStart;
      var end = textarea.selectionEnd;
      textarea.value = textarea.value.substring(0, start) + '  ' + textarea.value.substring(end);
      textarea.selectionStart = textarea.selectionEnd = start + 2;
    }
  });
}
