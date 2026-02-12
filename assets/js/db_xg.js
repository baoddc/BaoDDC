// Thay báº±ng ID Google Sheet cá»§a báº¡n (giá»‘ng nhÆ° trong xg.js)
const SHEET_ID = '1KqP0KIZmKzgKvZcCJRsTVO4lhScOGRa1OzQgE893eUU';
const SHEET_GID = '0';

// URL Ä‘á»ƒ táº£i file .xlsx
const XLSX_EXPORT_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=xlsx&gid=${SHEET_GID}`;

let tableData = [];
let displayedData = [];

// Sheet column indices
// 0 = STT, 1 = Ma chung tu, 2 = Ngay, 8 = So luong (Kg)
const DATE_INDEX = 2;
const VOUCHER_INDEX = 1;
const QUANTITY_INDEX = 8;

// Chart objects
let barChart = null;
let pieChart = null;

// Kiá»ƒm tra Ä‘Äƒng nháº­p
window.addEventListener('load', () => {
  const currentUser = localStorage.getItem('currentUser');
  if (!currentUser) {
    window.location.href = 'index.html';
    return;
  }

  const usernameEl = document.getElementById('currentUsername');
  if (usernameEl) usernameEl.textContent = currentUser;

  const btnLogout = document.getElementById('btnLogout');
  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      localStorage.removeItem('currentUser');
      window.location.href = 'index.html';
    });
  }

  loadGoogleSheet();
});

// Táº£i dá»¯ liá»‡u tá»« Google Sheet
async function loadGoogleSheet() {
  try {
    const response = await fetch(XLSX_EXPORT_URL);
    if (!response.ok) throw new Error("Không thể truy cập Google Sheet (XLSX export)");

    const arrayBuffer = await response.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    tableData = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false });

    if (tableData.length === 0) {
      document.getElementById('loading').innerHTML = "KhÃ´ng cÃ³ dá»¯ liá»‡u hoáº·c sheet rá»—ng";
      return;
    }

    // Debug: In ra dá»¯ liá»‡u Ä‘áº§u tiÃªn Ä‘á»ƒ kiá»ƒm tra
    console.log('Headers:', tableData[0]);
    console.log('First few rows:', tableData.slice(0, 3));
    console.log('Total rows:', tableData.length);

    // Render initial data
    displayedData = [...tableData];
    console.log('displayedData after init:', displayedData.length);
    updateDashboard();

    // Setup filters
    setupFilters();

    document.getElementById('loading').style.display = 'none';
    document.getElementById('content').style.display = 'block';

  } catch (error) {
    document.getElementById('loading').innerHTML = 
      `Lá»—i: ${error.message}<br>Kiểm tra xem sheet Publish to web chưa.`;
    console.error(error);
  }
}

// Setup filter event listeners
function setupFilters() {
  const btnReset = document.getElementById('btnResetFilter');
  const fromInput = document.getElementById('fromDate');
  const toInput = document.getElementById('toDate');

  if (btnReset) {
    btnReset.addEventListener('click', () => {
      if (fromInput) fromInput.value = '';
      if (toInput) toInput.value = '';
      displayedData = [...tableData];
      updateDashboard();
    });
  }

  if (fromInput) fromInput.addEventListener('change', filterData);
  if (toInput) toInput.addEventListener('change', filterData);
}

// Filter data based on criteria
function filterData() {
  const fromVal = document.getElementById('fromDate').value || '';
  const toVal = document.getElementById('toDate').value || '';
  console.log('FilterData called:', { fromVal, toVal });

  const from = fromVal ? new Date(fromVal) : null;
  const to = toVal ? new Date(toVal) : null;
  if (from) from.setHours(0, 0, 0, 0);
  if (to) to.setHours(23, 59, 59, 999);

  console.log('Parsed dates:', { from, to });

  displayedData = [tableData[0]]; // Always include header

  for (let i = 1; i < tableData.length; i++) {
    const row = tableData[i];

    // Column 3 (index 2) = Ngay
    const dateStr = row[DATE_INDEX] ? String(row[DATE_INDEX]).trim() : '';

    // Date filter - parse date properly
    if (from || to) {
      const d = parseDate(dateStr);
      console.log(`Row ${i}: dateStr="${dateStr}" -> parsed=${d}`);
      if (!d) continue; // Skip rows without valid date when filtering
      if (from && d < from) continue;
      if (to && d > to) continue;
    }

    displayedData.push(row);
  }

  console.log('DisplayedData after filter:', displayedData.length, 'rows (including header)');
  console.log('First few filtered rows:', displayedData.slice(0, 4));

  updateDashboard();
}


// Parse date string in various formats
// Parse date string - Sheet uses DD/MM/YYYY format
function parseDate(dateStr) {
  if (!dateStr) return null;

  // Excel serial number
  if (/^\d+(\.\d+)?$/.test(String(dateStr))) {
    const num = Number(dateStr);
    if (!Number.isNaN(num) && num > 25000) {
      const d = new Date((num - 25569) * 86400 * 1000);
      return isNaN(d.getTime()) ? null : d;
    }
  }
  
  // Try YYYY-MM-DD format (from HTML input)
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const d = new Date(dateStr + 'T00:00:00');
    return isNaN(d.getTime()) ? null : d;
  }
  
  // Try DD/MM/YYYY format (from Google Sheet)
  // This is the primary format from the Sheet data
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
    const parts = dateStr.split('/');
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);
    const d = new Date(year, month - 1, day);
    console.log(`Parsing "${dateStr}" => day=${day}, month=${month}, year=${year} => ${d}`);
    return isNaN(d.getTime()) ? null : d;
  }
  
  // Try DD-MM-YYYY format
  if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(dateStr)) {
    const parts = dateStr.split('-');
    const d = new Date(parts[2], parts[1] - 1, parts[0]);
    return isNaN(d.getTime()) ? null : d;
  }
  
  // Try native Date parsing
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

// SUMIF-like function: sum column 9 where column 2 matches condition
function sumif(data, columnToCheck, condition, columnToSum) {
  let total = 0;
  
  // Skip header (row 0)
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    
    const checkValue = row[columnToCheck] ? String(row[columnToCheck]).trim().toUpperCase() : '';
    const sumValue = row[columnToSum] ? parseFloat(row[columnToSum]) : 0;

    // Check if condition matches (case-insensitive)
    if (typeof condition === 'function') {
      if (condition(checkValue)) {
        total += sumValue;
      }
    } else if (checkValue === condition.toUpperCase()) {
      total += sumValue;
    }
  }

  return total;
}

// Update dashboard with calculations
function updateDashboard() {
  // Column indices:
  // Column 1 (index 0) = NgÃ y
  // Column 2 (index 1) = MÃ£ chá»©ng tá»«
  // Column 9 (index 8) = Sá»‘ lÆ°á»£ng (Kg)

  const voucherIndex = VOUCHER_INDEX;
  const quantityIndex = QUANTITY_INDEX;

  console.log('updateDashboard called with displayedData:', displayedData.length, 'rows');
  
  // Calculate totals using SUMIF
  const totalNM = sumif(displayedData, voucherIndex, 'NM', quantityIndex);
  const totalNT = sumif(displayedData, voucherIndex, 'NT', quantityIndex);
  const totalExportVoucher = sumif(
    displayedData,
    voucherIndex,
    (voucherCode) => {
      const code = String(voucherCode || '').trim().toUpperCase();
      const normalizedCode = code.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return normalizedCode === 'PX' || normalizedCode.includes('PHIEU XUAT') || normalizedCode.includes('XUAT');
    },
    quantityIndex
  );
  const totalExportDC = sumif(displayedData, voucherIndex, 'DC', quantityIndex);

  // Debug - inspect each row
  console.log('=== DEBUG: DisplayedData details ===');
  for (let i = 1; i < displayedData.length; i++) {
    const row = displayedData[i];
    const voucher = row[voucherIndex] ? String(row[voucherIndex]).trim().toUpperCase() : '';
    const qty = row[quantityIndex] ? parseFloat(row[quantityIndex]) : 0;
    console.log(`Row ${i}:`, { voucher, qty, fullRow: row });
  }

  console.log('Calculation results:', { totalNM, totalNT, totalExportVoucher, totalExportDC });

  // Total for all = Tá»•ng Nháº­p NM + Tá»•ng Nháº­p NT
  const totalAll = totalNM + totalNT;
  const totalExportPeriod = totalExportVoucher + totalExportDC;

  console.log('Total all:', totalAll);

  // Update summary cards
  document.getElementById('totalMN').textContent = totalNM.toLocaleString('vi-VN', { maximumFractionDigits: 2 });
  document.getElementById('totalNT').textContent = totalNT.toLocaleString('vi-VN', { maximumFractionDigits: 2 });
  const totalExportVoucherEl = document.getElementById('totalExportVoucher');
  if (totalExportVoucherEl) {
    totalExportVoucherEl.textContent = totalExportVoucher.toLocaleString('vi-VN', { maximumFractionDigits: 2 });
  }
  const totalExportDCEl = document.getElementById('totalExportDC');
  if (totalExportDCEl) {
    totalExportDCEl.textContent = totalExportDC.toLocaleString('vi-VN', { maximumFractionDigits: 2 });
  }
  const totalImportPeriodEl = document.getElementById('totalImportPeriod');
  if (totalImportPeriodEl) {
    totalImportPeriodEl.textContent = totalAll.toLocaleString('vi-VN', { maximumFractionDigits: 2 });
  }
  const totalExportPeriodEl = document.getElementById('totalExportPeriod');
  if (totalExportPeriodEl) {
    totalExportPeriodEl.textContent = totalExportPeriod.toLocaleString('vi-VN', { maximumFractionDigits: 2 });
  }

  // Update charts
  updateCharts(totalNM, totalNT, totalExportVoucher, totalExportDC);

  // Update summary table
  updateSummaryTable();
}

// Update bar and pie charts
function updateCharts(totalNM, totalNT, totalExportVoucher, totalExportDC) {
  const barCtx = document.getElementById('barChart');
  const pieCtx = document.getElementById('pieChart');

  // Prepare data for stacked bar chart
  const barChartData = {
    labels: ['Nhập', 'Xuất'],
    datasets: [
      {
        label: 'NM',
        data: [totalNM, 0],
        backgroundColor: '#0d6efd',
        borderColor: '#0d6efd',
        borderWidth: 1
      },
      {
        label: 'NT',
        data: [totalNT, 0],
        backgroundColor: '#198754',
        borderColor: '#198754',
        borderWidth: 1
      },
      {
        label: 'PX',
        data: [0, totalExportVoucher],
        backgroundColor: '#0dcaf0',
        borderColor: '#0dcaf0',
        borderWidth: 1
      },
      {
        label: 'DC',
        data: [0, totalExportDC],
        backgroundColor: '#fd7e14',
        borderColor: '#fd7e14',
        borderWidth: 1
      }
    ]
  };

  // Destroy existing chart if it exists
  if (barChart) barChart.destroy();

  barChart = new Chart(barCtx, {
    type: 'bar',
    data: barChartData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          stacked: true,
          grid: {
            display: false
          }
        },
        y: {
          stacked: true,
          beginAtZero: true,
          grid: {
            display: false
          },
          ticks: {
            callback: function(value) {
              return value.toLocaleString('vi-VN');
            }
          }
        }
      },
      plugins: {
        legend: {
          display: true
        }
      }
    }
  });

  // Prepare data for pie chart - import vs export in period
  const totalImportPeriod = totalNM + totalNT;
  const totalExportPeriod = totalExportVoucher + totalExportDC;
  const pieChartData = {
    labels: ['Tổng nhập trong kì', 'Tổng xuất trong kì'],
    datasets: [{
      data: [totalImportPeriod, totalExportPeriod],
      backgroundColor: [
        '#198754', '#dc3545'
      ],
      borderColor: '#fff',
      borderWidth: 2
    }]
  };

  if (pieChart) pieChart.destroy();

  const piePercentLabelsPlugin = {
    id: 'piePercentLabels',
    afterDatasetsDraw(chart) {
      const { ctx } = chart;
      const dataset = chart.data.datasets[0];
      const data = (dataset && dataset.data) ? dataset.data : [];
      const total = data.reduce((sum, value) => sum + Number(value || 0), 0);
      if (!total) return;

      const meta = chart.getDatasetMeta(0);
      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.font = '600 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      meta.data.forEach((arc, index) => {
        const value = Number(data[index] || 0);
        if (value <= 0) return;
        const percent = ((value / total) * 100).toFixed(1) + '%';
        const pos = arc.tooltipPosition();
        ctx.fillText(percent, pos.x, pos.y);
      });

      ctx.restore();
    }
  };

  pieChart = new Chart(pieCtx, {
    type: 'doughnut',
    data: pieChartData,
    plugins: [piePercentLabelsPlugin],
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label(context) {
              const data = context.dataset.data || [];
              const total = data.reduce((sum, value) => sum + Number(value || 0), 0);
              const value = Number(context.parsed || 0);
              const percent = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
              return `${context.label}: ${percent}% (${value.toLocaleString('vi-VN')} Kg)`;
            }
          }
        }
      }
    }
  });
}

function normalizeHeaderText(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function findProjectSupplierColumnIndex() {
  const headers = tableData[0] || [];
  const targetPatterns = [
    /ten\s*cong\s*trinh/,
    /\bncc\b/,
    /nha\s*cung\s*cap/
  ];

  for (let i = 0; i < headers.length; i++) {
    const normalized = normalizeHeaderText(headers[i]);
    if (targetPatterns.some(pattern => pattern.test(normalized))) {
      return i;
    }
  }

  return -1;
}

function getProjectSupplierStats() {
  const nameIndex = findProjectSupplierColumnIndex();
  if (nameIndex < 0) return [];

  const stats = {};

  for (let i = 1; i < displayedData.length; i++) {
    const row = displayedData[i];
    const voucher = row[VOUCHER_INDEX] ? String(row[VOUCHER_INDEX]).trim().toUpperCase() : '';
    if (voucher !== 'PX') continue;

    const name = row[nameIndex] ? String(row[nameIndex]).trim() : '(Trống)';
    const qty = row[QUANTITY_INDEX] ? Number(row[QUANTITY_INDEX]) : 0;
    const safeQty = Number.isFinite(qty) ? qty : 0;

    if (!stats[name]) stats[name] = { name, total: 0 };
    stats[name].total += safeQty;
  }

  return Object.values(stats).sort((a, b) => b.total - a.total);
}

// Update table: sum quantity by project/supplier name
function updateSummaryTable() {
  const tableBody = document.getElementById('projectSupplierTableBody');
  if (!tableBody) return;

  tableBody.innerHTML = '';
  const projectSupplierStats = getProjectSupplierStats();

  if (projectSupplierStats.length === 0) {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td colspan="2" class="text-muted">Không tìm thấy cột "Tên công trình/NCC" trong dữ liệu.</td>
    `;
    tableBody.appendChild(row);
    return;
  }

  projectSupplierStats.forEach(stat => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${stat.name}</td>
      <td class="text-end">${stat.total.toLocaleString('vi-VN', { maximumFractionDigits: 2 })}</td>
    `;
    tableBody.appendChild(row);
  });

}



