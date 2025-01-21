// Ganti dengan URL Apps Script Anda
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycby11lBEhjcrEW96bsri1yZiKsG9pexlr26PNCVk5_w-HxKdvVDqho_0Hq2dXhHEWXa6Nw/exec";

// DOM Elements
const sheetSelect = document.getElementById('sheetSelect');
const searchInput = document.getElementById('searchInput');
const tableContainer = document.getElementById('tableContainer');
const toggleThemeBtn = document.getElementById('toggleThemeBtn');
const body = document.body;

// Data Global (untuk memudahkan filter/pencarian)
let originalData = []; // Menyimpan data mentah dari server (array 2D)

// ----------------------------------
// 1. On Document Loaded
// ----------------------------------
document.addEventListener('DOMContentLoaded', () => {
  // Ambil data pertama kali (Lab Komputer A default)
  fetchData(sheetSelect.value);

  // Event: saat user pilih sheet lain
  sheetSelect.addEventListener('change', () => {
    const selectedSheet = sheetSelect.value;
    fetchData(selectedSheet);
  });

  // Event: input search
  searchInput.addEventListener('input', handleSearch);

  // Event: toggle theme
  toggleThemeBtn.addEventListener('click', toggleTheme);
});

// ----------------------------------
// 2. Fetch Data dari Apps Script
// ----------------------------------
async function fetchData(sheetName) {
  try {
    // Tampilkan loading
    tableContainer.innerHTML = "<p>Loading data...</p>";

    // Panggil Web App dengan querystring
    const url = `${WEB_APP_URL}?sheetName=${encodeURIComponent(sheetName)}`;
    const response = await fetch(url);
    const json = await response.json();

    if (json.error) {
      // Tampilkan error
      tableContainer.innerHTML = `<p style="color:red;font-weight:bold;">${json.error}</p>`;
      originalData = [];
    } else {
      // Simpan data
      originalData = json.values || [];

      // Render tabel awal (belum difilter)
      renderTable(originalData);
    }
  } catch (err) {
    console.error(err);
    tableContainer.innerHTML = `<p style="color:red;font-weight:bold;">Gagal mengambil data.</p>`;
    originalData = [];
  }
}

// ----------------------------------
// 3. Render Tabel
// ----------------------------------
function renderTable(dataArray) {
  // dataArray: array 2D, baris pertama = header
  if (!dataArray || dataArray.length === 0) {
    tableContainer.innerHTML = "<p>Tidak ada data.</p>";
    return;
  }

  const headers = dataArray[0];
  const rows = dataArray.slice(1);

  // Bangun HTML table
  let html = "<table>";
  // HEADER
  html += "<thead><tr>";
  headers.forEach(h => {
    html += `<th>${h}</th>`;
  });
  html += "</tr></thead>";
  // BODY
  html += "<tbody>";
  rows.forEach(row => {
    html += "<tr>";
    row.forEach(cell => {
      html += `<td>${cell}</td>`;
    });
    html += "</tr>";
  });
  html += "</tbody>";

  html += "</table>";
  tableContainer.innerHTML = html;
}

// ----------------------------------
// 4. Filter Data (Search Input)
// ----------------------------------
function handleSearch() {
  const query = searchInput.value.toLowerCase();

  // Jika tidak ada data atau header
  if (!originalData || originalData.length === 0) {
    return;
  }

  // Pisahkan header dan rows
  const headers = originalData[0];
  const rows = originalData.slice(1);

  // Filter rows yang mengandung `query` di salah satu kolom
  const filtered = rows.filter(row => {
    return row.some(cell => {
      return String(cell).toLowerCase().includes(query);
    });
  });

  // Gabungkan lagi header + filtered rows
  const newData = [headers, ...filtered];

  // Render hasil filter
  renderTable(newData);
}

// ----------------------------------
// 5. Toggle Theme (Dark / Light)
// ----------------------------------
function toggleTheme() {
  if (body.classList.contains('light-mode')) {
    body.classList.remove('light-mode');
    body.classList.add('dark-mode');
    toggleThemeBtn.textContent = "Light Mode";
  } else {
    body.classList.remove('dark-mode');
    body.classList.add('light-mode');
    toggleThemeBtn.textContent = "Dark Mode";
  }
}
