let apps = [];
let currentCategory = 'all';
let searchQuery = '';

async function loadApps() {
  try {
    const response = await fetch('apps.json');
    apps = await response.json();
    generateFilters();
    renderApps();
  } catch (error) {
    console.error('Failed to load apps:', error);
  }
}

function generateFilters() {
  const categories = [...new Set(apps.map(app => app.category))].sort();
  const filtersContainer = document.getElementById('filters');

  // Keep the "All" button, add category buttons
  categories.forEach(category => {
    const btn = document.createElement('button');
    btn.className = 'filter-btn';
    btn.dataset.category = category;
    btn.textContent = category;
    filtersContainer.appendChild(btn);
  });

  // Attach event listeners
  filtersContainer.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      filtersContainer.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCategory = btn.dataset.category;
      renderApps();
    });
  });
}

function renderApps() {
  const grid = document.getElementById('app-grid');
  const emptyState = document.getElementById('empty-state');

  const filteredApps = apps.filter(app => {
    const matchesCategory = currentCategory === 'all' || app.category === currentCategory;
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = searchQuery === '' ||
      app.name.toLowerCase().includes(searchLower) ||
      app.tagline.toLowerCase().includes(searchLower) ||
      app.description?.toLowerCase().includes(searchLower) ||
      app.category.toLowerCase().includes(searchLower) ||
      app.tags?.some(tag => tag.toLowerCase().includes(searchLower));

    return matchesCategory && matchesSearch;
  });

  if (filteredApps.length === 0) {
    grid.innerHTML = '';
    emptyState.style.display = 'block';
    return;
  }

  emptyState.style.display = 'none';

  grid.innerHTML = filteredApps.map(app => {
    const ratingStars = app.rating ? '★'.repeat(Math.round(app.rating)) + '☆'.repeat(5 - Math.round(app.rating)) : '';
    const reviewCount = app.reviews ? formatNumber(app.reviews) + ' reviews' : '';

    return `
      <article class="app-card" onclick="window.open('${app.url}', '_blank')">
        <div class="app-card-header">
          <div class="app-icon">${app.icon}</div>
          <div class="app-card-title">
            <h3>${app.name}</h3>
            <span class="developer">${app.developer || ''}</span>
          </div>
        </div>
        <div class="app-card-body">
          <p class="tagline">${app.tagline}</p>
          ${app.rating ? `
            <div class="app-rating">
              <span class="stars">${ratingStars}</span>
              <span class="rating-text">${app.rating.toFixed(1)} · ${reviewCount}</span>
            </div>
          ` : ''}
          <div class="app-card-tags">
            <span class="category-badge">${app.category}</span>
            ${app.tags?.filter(t => t !== 'iOS' && t !== 'Android').map(tag => `<span class="tag">${tag}</span>`).join('') || ''}
            ${app.tags?.includes('iOS') ? '<span class="platform-tag">iOS</span>' : ''}
            ${app.tags?.includes('Android') ? '<span class="platform-tag">Android</span>' : ''}
          </div>
        </div>
      </article>
    `;
  }).join('');
}

function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

function initSearch() {
  const searchInput = document.getElementById('search');
  let debounceTimer;

  searchInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      searchQuery = e.target.value;
      renderApps();
    }, 200);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  loadApps();
  initSearch();
});
