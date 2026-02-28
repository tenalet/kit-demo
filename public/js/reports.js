(function () {
  const applicationId = qs('applicationId');
  const appIdEl = document.getElementById('app-id');
  const listEl = document.getElementById('reports-list');
  let pollInterval = null;

  appIdEl.textContent = applicationId || '-';

  if (!applicationId) {
    listEl.innerHTML = '<div class="empty">No application ID provided.</div>';
    return;
  }

  async function loadReports() {
    try {
      const data = await api('GET', `/applications/${applicationId}/reports`);
      const reports = data.reports || data;

      if (!reports || reports.length === 0) {
        listEl.innerHTML = '<div class="empty">No reports available yet.</div>';
        return;
      }

      let html = '';

      if (data.reportGeneration) {
        const rg = data.reportGeneration;
        const progress = rg.progress ?? 0;
        const phase = escapeHtml(rg.phase || 'Processing...');
        const isFailed = rg.status === 'failed';

        html += `
          <div class="progress-banner${isFailed ? ' progress-banner-failed' : ''}">
            <h4>${isFailed ? 'Report generation failed' : 'Generating your reports...'}</h4>
            <p>${isFailed ? escapeHtml(rg.failureReason || 'Something went wrong. Please try again later.') : phase}</p>
            ${!isFailed ? `<div class="progress-bar"><div class="progress-bar-fill" style="width: ${progress}%"></div></div>` : ''}
          </div>`;
      }

      html += reports
        .map(
          (r) => `
          <div class="report-card">
            <div class="info">
              <h3>${escapeHtml(r.name)}</h3>
              <p>Type: ${r.type} &middot; Generated: ${formatDate(r.generatedAt)}</p>
            </div>
            <div>
              ${r.available
                ? `<span class="badge badge-green mb-8">available</span>
                   <button class="btn btn-primary btn-sm" onclick="viewReport('${applicationId}', '${r.type}')">View</button>`
                : '<span class="badge badge-yellow">pending</span>'
              }
            </div>
          </div>`
        )
        .join('');

      listEl.innerHTML = html;

      // Auto-poll when reports are still generating
      if (data.reportGeneration && data.reportGeneration.status !== 'failed') {
        if (!pollInterval) {
          pollInterval = setInterval(loadReports, 5000);
        }
      } else if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
      }
    } catch (err) {
      listEl.innerHTML = `<div class="empty error">${escapeHtml(err.message)}</div>`;
    }
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  loadReports();
})();

async function viewReport(applicationId, type) {
  try {
    const data = await api('GET', `/applications/${applicationId}/reports/${type}`);
    if (data.url) {
      window.open(data.url, '_blank');
    } else if (data.reportGeneration) {
      const rg = data.reportGeneration;
      const progress = rg.progress ?? 0;
      const phase = rg.phase || 'Processing';
      alert(`Report is still generating (${progress}% - ${phase}). Please wait and try again.`);
    }
  } catch (err) {
    alert('Failed to get report URL: ' + err.message);
  }
}
