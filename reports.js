// Minimal, dependency-free script to fetch reports.json and render interactive UI.
// Works when placed in the same directory as index.html and reports.json.

(function () {
  const root = document.getElementById('app');
  const reportsEl = document.getElementById('reports');
  const qInput = document.getElementById('q');
  const countsEl = document.getElementById('counts');
  const yearEl = document.getElementById('year');
  const filterButtons = Array.from(document.querySelectorAll('.filter-btn'));
  const yearFilterEl = document.getElementById('year-filter');
  const paginationEl = document.getElementById('pagination');

  yearEl.textContent = new Date().getFullYear();

  let reports = [];
  let currentFilter = 'all';
  let currentQuery = '';
  let currentYearFilter = 'all';
  
  // Pagination State
  let currentPage = 1;
  const itemsPerPage = 6; // Set to 6 items per page by default

  function formatDate(iso) {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return iso;
    }
  }

  function setActiveFilter(name) {
    currentFilter = name;
    currentPage = 1; // Reset to page 1 on filter change
    filterButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filter === name);
    });
    render();
  }

  function matchesFilter(r) {
    if (currentFilter === 'all') return true;
    if (currentFilter === 'protected') return r.visibility === 'Protected';
    if (currentFilter === 'public') return r.visibility === 'Public';
    return true;
  }

  function matchesQuery(r, q) {
    if (!q) return true;
    q = q.toLowerCase();
    const hay = [
      r.title,
      r.summary,
      r.area,
      (r.authors || []).join(' '),
      (r.tags || []).join(' '),
      r.key,
    ].join(' ').toLowerCase();
    return hay.indexOf(q) !== -1;
  }

  function matchesYear(r) {
    if (currentYearFilter === 'all') return true;
    if (!r.updated) return false;
    return r.updated.split('-')[0] === currentYearFilter;
  }

  function populateYearFilter() {
    if (!yearFilterEl) return;
    yearFilterEl.innerHTML = '<option value="all">All Years</option>';
    const years = new Set();
    reports.forEach(r => {
      if (r.draft !== true && r.updated) {
        const y = r.updated.split('-')[0];
        if (y) years.add(y);
      }
    });
    const sortedYears = Array.from(years).sort((a, b) => b - a);
    sortedYears.forEach(y => {
      const opt = document.createElement('option');
      opt.value = y;
      opt.textContent = y;
      yearFilterEl.appendChild(opt);
    });
  }

  function renderCard(r) {
    const el = document.createElement('article');
    el.className = 'card';
    el.setAttribute('tabindex', '0');

    // Access & Area Badges (Removed redundant status badge)
    const meta = document.createElement('div');
    meta.className = 'meta';
    const visibilityClass = (r.visibility || '').toLowerCase();
    meta.innerHTML = `<span class="visibility ${visibilityClass}" aria-hidden="true">${escapeHtml(r.visibility)}</span>
                      <span class="area" aria-hidden="true">${escapeHtml(r.area)}</span>`;

    // Publication-style citation
    const citation = document.createElement('div');
    citation.className = 'citation';

    const authorsStr = (r.authors || []).join(', ');
    const authorsSpan = document.createElement('span');
    authorsSpan.className = 'citation-authors';
    authorsSpan.textContent = authorsStr ? authorsStr + '. ' : '';
    citation.appendChild(authorsSpan);

    const titleSpan = document.createElement('span');
    titleSpan.className = 'citation-title';
    const a = document.createElement('a');
    a.href = r.reportUrl || '#';
    a.textContent = r.title || r.key;
    a.className = 'report-link';
    a.setAttribute('aria-label', `${r.title} — open report`);
    titleSpan.appendChild(a);
    titleSpan.appendChild(document.createTextNode('. '));
    citation.appendChild(titleSpan);

    const year = r.updated ? r.updated.split('-')[0] : '';
    const dateSpan = document.createElement('span');
    dateSpan.className = 'citation-date';
    dateSpan.textContent = year ? `(${year}).` : '';
    citation.appendChild(dateSpan);

    const summary = document.createElement('p');
    summary.className = 'summary';
    summary.textContent = r.summary || '';

    const lastUpdated = document.createElement('div');
    lastUpdated.className = 'last-updated';
    lastUpdated.innerHTML = `<span>Updated:</span> <span>${formatDate(r.updated || '')}</span>`;

    const tagRow = document.createElement('div');
    tagRow.className = 'tags';
    (r.tags || []).forEach(t => {
      const span = document.createElement('span');
      span.className = 'tag';
      span.textContent = t;
      tagRow.appendChild(span);
    });

    const actions = document.createElement('div');
    actions.className = 'actions';
    const open = document.createElement('a');
    open.className = 'btn primary';
    open.textContent = 'Open report →';
    open.href = r.reportUrl || '#';
    open.setAttribute('role', 'button');
    actions.appendChild(open);

    if (r.githubUrl) {
      const gh = document.createElement('a');
      gh.className = 'btn ghost';
      gh.textContent = 'GitHub';
      gh.href = r.githubUrl;
      gh.target = '_blank';
      gh.rel = 'noopener noreferrer';
      actions.appendChild(gh);
    }

    el.appendChild(meta);
    el.appendChild(citation);
    el.appendChild(summary);
    if ((r.tags || []).length) el.appendChild(tagRow);
    el.appendChild(lastUpdated);
    el.appendChild(actions);

    return el;
  }

  function escapeHtml(s) {
    if (!s) return '';
    return String(s).replace(/[&<>"']/g, function (m) {
      return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[m]);
    });
  }

  function renderPagination(totalPages) {
    if (!paginationEl) return;
    paginationEl.innerHTML = '';

    if (totalPages <= 1) {
      paginationEl.style.display = 'none';
      return;
    }

    paginationEl.style.display = 'flex';

    // Prev Page Button
    const prevBtn = document.createElement('button');
    prevBtn.className = 'page-btn';
    prevBtn.innerHTML = '&larr;';
    prevBtn.disabled = currentPage === 1;
    prevBtn.setAttribute('aria-label', 'Previous page');
    prevBtn.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        render();
        reportsEl.scrollIntoView({ behavior: 'smooth' });
      }
    });
    paginationEl.appendChild(prevBtn);

    // Numbered Page Buttons
    for (let i = 1; i <= totalPages; i++) {
      const pageBtn = document.createElement('button');
      pageBtn.className = `page-btn ${currentPage === i ? 'active' : ''}`;
      pageBtn.textContent = i;
      pageBtn.setAttribute('aria-label', `Go to page ${i}`);
      pageBtn.addEventListener('click', () => {
        currentPage = i;
        render();
        reportsEl.scrollIntoView({ behavior: 'smooth' });
      });
      paginationEl.appendChild(pageBtn);
    }

    // Next Page Button
    const nextBtn = document.createElement('button');
    nextBtn.className = 'page-btn';
    nextBtn.innerHTML = '&rarr;';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.setAttribute('aria-label', 'Next page');
    nextBtn.addEventListener('click', () => {
      if (currentPage < totalPages) {
        currentPage++;
        render();
        reportsEl.scrollIntoView({ behavior: 'smooth' });
      }
    });
    paginationEl.appendChild(nextBtn);
  }

  function render() {
    reportsEl.innerHTML = '';
    const q = currentQuery.trim().toLowerCase();
    const filtered = reports.filter(r => r.draft !== true && matchesFilter(r) && matchesQuery(r, q) && matchesYear(r));
    
    // Pagination slicing
    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    if (currentPage > totalPages) {
      currentPage = Math.max(1, totalPages);
    }
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedItems = filtered.slice(startIndex, startIndex + itemsPerPage);

    if (paginatedItems.length === 0) {
      const no = document.createElement('div');
      no.className = 'card';
      no.innerHTML = '<p class="summary">No reports match your filters.</p>';
      reportsEl.appendChild(no);
    } else {
      const frag = document.createDocumentFragment();
      paginatedItems.forEach(r => frag.appendChild(renderCard(r)));
      reportsEl.appendChild(frag);
    }

    renderPagination(totalPages);

    const total = reports.filter(r => r.draft !== true).length;
    const visible = filtered.length;
    const protectedCount = reports.filter(r => r.draft !== true && r.visibility === 'Protected').length;
    const publicCount = reports.filter(r => r.draft !== true && r.visibility === 'Public').length;
    countsEl.textContent = `${visible} of ${total} shown · Protected: ${protectedCount} · Public: ${publicCount}`;
  }

  qInput.addEventListener('input', (e) => {
    currentQuery = e.target.value || '';
    currentPage = 1; // Reset to page 1 on search
    render();
  });

  if (yearFilterEl) {
    yearFilterEl.addEventListener('change', (e) => {
      currentYearFilter = e.target.value || 'all';
      currentPage = 1; // Reset to page 1 on year filter change
      render();
    });
  }

  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      setActiveFilter(btn.dataset.filter);
    });
  });

  function init() {
    fetch('./reports.json', {cache: 'no-store'})
      .then(resp => {
        if (!resp.ok) throw new Error('Failed to load reports.json');
        return resp.json();
      })
      .then(data => {
        if (!Array.isArray(data)) throw new Error('Invalid JSON format');
        reports = data;
        populateYearFilter();
        render();
      })
      .catch(err => {
        reportsEl.innerHTML = '<div class="card"><p class="summary">Unable to load reports data.</p></div>';
        console.error(err);
      });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
