// Ganti dengan URL Apps Script Anda
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycby11lBEhjcrEW96bsri1yZiKsG9pexlr26PNCVk5_w-HxKdvVDqho_0Hq2dXhHEWXa6Nw/exec";

// DOM Elements
const sheetSelect = document.getElementById('sheetSelect');
const searchInput = document.getElementById('searchInput');
const tableContainer = document.getElementById('tableContainer');
const toggleThemeBtn = document.getElementById('toggleThemeBtn');
const body = document.body;

// Data Global
let originalData = [];
let currentSort = {
  column: null,
  ascending: true
};

// ----------------------------------
// 1. Initialize
// ----------------------------------
document.addEventListener('DOMContentLoaded', () => {
  // Load saved theme
  loadTheme();
  
  // Fetch initial data
  fetchData(sheetSelect.value);

  // Event Listeners
  sheetSelect.addEventListener('change', () => {
    const selectedSheet = sheetSelect.value;
    fetchData(selectedSheet);
  });

  searchInput.addEventListener('input', debounce(handleSearch, 300));
  toggleThemeBtn.addEventListener('click', toggleTheme);
});

// ----------------------------------
// 2. Data Fetching
// ----------------------------------
async function fetchData(sheetName) {
  try {
    showLoadingState();

    const url = `${WEB_APP_URL}?sheetName=${encodeURIComponent(sheetName)}`;
    const response = await fetch(url);
    const json = await response.json();

    if (json.error) {
      showError(json.error);
      originalData = [];
    } else {
      // Validasi data sebelum disimpan
      originalData = json.values.map(row => {
        row[0] = isNaN(row[0]) ? row[0] : String(row[0]); // Pastikan Minggu ke- adalah teks
        return row;
      });

      renderTable(originalData);
    }
  } catch (err) {
    console.error(err);
    showError('Gagal mengambil data. Silakan coba lagi.');
    originalData = [];
  }
}

// ----------------------------------
// 3. Table Rendering
// ----------------------------------
function renderTable(dataArray) {
  if (!dataArray || dataArray.length === 0) {
    tableContainer.innerHTML = createEmptyState();
    return;
  }

  const headers = dataArray[0];
  const rows = dataArray.slice(1);

  let html = "<table>";
  
  // Headers with sort buttons
  html += "<thead><tr>";
  headers.forEach((header, index) => {
    const sortIcon = getSortIcon(index);
    html += `
      <th>
        <div class="header-content" onclick="handleSort(${index})">
          ${header}
          ${sortIcon}
        </div>
      </th>
    `;
  });
  html += "</tr></thead>";
  
  // Table body with rows
  html += "<tbody>";
  rows.forEach(row => {
    html += "<tr>";
    row.forEach(cell => {
      html += `<td>${formatCell(cell)}</td>`;
    });
    html += "</tr>";
  });
  html += "</tbody></table>";

  tableContainer.innerHTML = html;
}

// ----------------------------------
// 4. Sorting Functions
// ----------------------------------
function handleSort(columnIndex) {
  if (currentSort.column === columnIndex) {
    // Toggle sort direction if clicking same column
    currentSort.ascending = !currentSort.ascending;
  } else {
    // Set new sort column
    currentSort.column = columnIndex;
    currentSort.ascending = true;
  }

  // Get headers and data rows
  const headers = originalData[0];
  const rows = originalData.slice(1);

  // Sort the rows
  const sortedRows = rows.sort((a, b) => {
    const aVal = a[columnIndex];
    const bVal = b[columnIndex];
    
    // Try to sort as numbers if possible
    const aNum = Number(aVal);
    const bNum = Number(bVal);
    
    if (!isNaN(aNum) && !isNaN(bNum)) {
      return currentSort.ascending ? aNum - bNum : bNum - aNum;
    }
    
    // Otherwise sort as strings
    return currentSort.ascending 
      ? String(aVal).localeCompare(String(bVal))
      : String(bVal).localeCompare(String(aVal));
  });

  // Combine headers with sorted rows
  const sortedData = [headers, ...sortedRows];
  renderTable(sortedData);
}

function getSortIcon(columnIndex) {
  if (currentSort.column !== columnIndex) {
    return '<span class="sort-icon">↕️</span>';
  }
  return currentSort.ascending 
    ? '<span class="sort-icon">↑</span>'
    : '<span class="sort-icon">↓</span>';
}

// ----------------------------------
// 5. Search/Filter Function
// ----------------------------------
function handleSearch() {
  const query = searchInput.value.toLowerCase().trim();

  if (!originalData || originalData.length === 0) {
    return;
  }

  const headers = originalData[0];
  const rows = originalData.slice(1);

  if (!query) {
    renderTable(originalData);
    return;
  }

  const filtered = rows.filter(row => {
    return row.some(cell => 
      String(cell).toLowerCase().includes(query)
    );
  });

  renderTable([headers, ...filtered]);
}

// ----------------------------------
// 6. Theme Functions
// ----------------------------------
function toggleTheme() {
  const isDark = body.classList.contains('light-mode');
  const newTheme = isDark ? 'dark' : 'light';
  
  body.classList.remove(isDark ? 'light-mode' : 'dark-mode');
  body.classList.add(isDark ? 'dark-mode' : 'light-mode');
  
  toggleThemeBtn.innerHTML = `
    <span class="theme-icon">${isDark ? '☀️' : '🌙'}</span>
    <span class="theme-text">${isDark ? 'Light Mode' : 'Dark Mode'}</span>
  `;
  
  // Save theme preference
  localStorage.setItem('theme', newTheme);
}

function loadTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  if (savedTheme === 'dark') {
    toggleTheme();
  }
}

// ----------------------------------
// 7. Utility Functions
// ----------------------------------
function formatDate(isoString) {
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return isoString; // Jika bukan tanggal, kembalikan nilai asli

  const options = { day: '2-digit', month: 'long', year: 'numeric' };
  return date.toLocaleDateString('id-ID', options);
}

function formatCell(value) {
  if (value === null || value === undefined) {
    return '-';
  }

  // Jika nilai adalah angka minggu (tidak tanggal)
  if (!isNaN(value) && value.length <= 2) {
    return value; // Kembalikan nilai apa adanya
  }

  // Coba format sebagai tanggal (hanya jika valid ISO string atau format tanggal)
  if (!isNaN(Date.parse(value))) {
    return formatDate(value);
  }

  // Jika bukan tanggal, escape karakter spesial
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function showLoadingState() {
  tableContainer.innerHTML = `
    <div class="loading-state">
      <div class="loading-spinner"></div>
      <p>Memuat data...</p>
    </div>
  `;
}

function showError(message) {
  tableContainer.innerHTML = `
    <div class="error-state">
      <p>❌ ${message}</p>
    </div>
  `;
}

function createEmptyState() {
  return `
    <div class="empty-state">
      <p>Tidak ada data yang ditemukan</p>
    </div>
  `;
}

// Debounce utility untuk search input
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
