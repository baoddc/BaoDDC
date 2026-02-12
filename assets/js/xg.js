// Thay bằng ID Google Sheet của bạn
const SHEET_ID = '1KqP0KIZmKzgKvZcCJRsTVO4lhScOGRa1OzQgE893eUU';   // ← THAY Ở ĐÂY
const SHEET_GID = '0';                     // gid của sheet (thường là 0 cho sheet đầu)

// URL để tải file .xlsx (giữ nguyên định dạng từ Google Sheets)
const XLSX_EXPORT_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=xlsx&gid=${SHEET_GID}`;

// OPTIONAL: If you want new rows submitted from the UI to be appended
// directly into the Google Sheet, create a Google Apps Script web app
// (see docs/append_to_sheet.md) and paste its URL here.
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwRyYx-EkgeQEIq6lPYsVItjmOOzVEb7njbkd0d0PzKEzNzXJlh9JlEPWQChL47wpEw/exec';

let tableData = []; // lưu dữ liệu gốc từ Google Sheet
let displayedData = []; // dữ liệu đang hiển thị (sau khi lọc)
let selectedRowIndex = -1; // index theo tableData (không theo dữ liệu đã lọc)

// Kiểm tra xem đã đăng nhập chưa, nếu chưa thì quay về trang đăng nhập
window.addEventListener('load', () => {
  const currentUser = localStorage.getItem('currentUser');
  if (!currentUser) {
    window.location.href = 'dang_nhap.html';
    return;
  }
  
  // Hiển thị username
  const usernameEl = document.getElementById('currentUsername');
  if (usernameEl) usernameEl.textContent = currentUser;
  
  // Xử lý nút đăng xuất
  const btnLogout = document.getElementById('btnLogout');
  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      localStorage.removeItem('currentUser');
      window.location.href = 'dang_nhap.html';
    });
  }
  
  loadGoogleSheet();
});

// Tải dữ liệu khi trang mở
// window.addEventListener('load', loadGoogleSheet);  // Moved into check above

async function loadGoogleSheet() {
  try {
    const response = await fetch(XLSX_EXPORT_URL);
    if (!response.ok) throw new Error("Không thể truy cập Google Sheet (XLSX export)");

    const arrayBuffer = await response.arrayBuffer();

    // Dùng SheetJS đọc file xlsx để giữ định dạng hiển thị (cell.w)
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Chuyển thành mảng 2 chiều; raw:false để lấy text đã format từ sheet (cell.w)
    tableData = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false });
    
    if (tableData.length === 0) {
      document.getElementById('loading').innerHTML = "Không có dữ liệu hoặc sheet rỗng";
      return;
    }

    // Populate filters (dropdowns) from the loaded sheet data
    populateTypeDropdown('Loại nhập/xuất', 'typeFilterMenu', 'typeFilterBtn', 'typeFilterCount', tableData);
    populateTypeDropdown('Mã chứng từ', 'voucherFilterMenu', 'voucherFilterBtn', 'voucherFilterCount', tableData);

    renderTable(tableData);

    document.getElementById('loading').style.display = 'none';
    document.getElementById('btnExport').disabled = false;
    // Gắn sự kiện cho bộ lọc ngày
    // (btnFilter không còn sử dụng trong giao diện)
    const btnReset = document.getElementById('btnResetFilter');
    const fromInput = document.getElementById('fromDate');
    const toInput = document.getElementById('toDate');
    if (btnReset) btnReset.addEventListener('click', () => {
      if (fromInput) fromInput.value = '';
      if (toInput) toInput.value = '';
      // clear dropdown checkboxes
      const typeMenu = document.getElementById('typeFilterMenu');
      if (typeMenu) {
        typeMenu.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
        const count = document.getElementById('typeFilterCount'); if (count) count.textContent = '0';
      }
      const voucherMenu = document.getElementById('voucherFilterMenu');
      if (voucherMenu) {
        voucherMenu.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
        const count = document.getElementById('voucherFilterCount'); if (count) count.textContent = '0';
      }
      renderTable(tableData);
    });
    if (fromInput) fromInput.addEventListener('change', filterTable);
    if (toInput) toInput.addEventListener('change', filterTable);
    const typeSelect = document.getElementById('typeFilter');
    if (typeSelect) typeSelect.addEventListener('change', filterTable);
    
  } catch (error) {
    document.getElementById('loading').innerHTML = 
      `Lỗi: ${error.message}<br>Kiểm tra xem sheet đã được Publish to web chưa.`;
    console.error(error);
  }
}

// Attach resizer handles to table header cells to allow dragging column widths
function enableColumnResize(table) {
  if (!table) return;
  const thead = table.querySelector('thead');
  if (!thead) return;
  const ths = Array.from(thead.querySelectorAll('th'));

  ths.forEach((th, index) => {
    // remove existing resizer if present
    const old = th.querySelector('.col-resizer');
    if (old) old.remove();

    // ensure th is positioned to contain absolute resizer
    th.style.position = th.style.position || 'sticky';

    const resizer = document.createElement('div');
    resizer.className = 'col-resizer';
    th.appendChild(resizer);

    let startX = 0;
    let startWidth = 0;

    function onMouseMove(e) {
      const newWidth = Math.max(40, startWidth + (e.clientX - startX));
      th.style.width = newWidth + 'px';
      const tb = table.tBodies?.[0];
      if (tb) for (const row of tb.rows) {
        const cell = row.children[index]; if (cell) cell.style.width = newWidth + 'px';
      }
    }

    function onMouseUp() {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    }

    resizer.addEventListener('mousedown', (e) => {
      e.preventDefault(); startX = e.clientX; startWidth = th.offsetWidth;
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });
  });
}

function renderTable(data) {
  const table = document.getElementById('dataTable');
  const thead = table.querySelector('thead');
  const tbody = table.querySelector('tbody');
  
  thead.innerHTML = '';
  tbody.innerHTML = '';

  // Header
  const headerRow = document.createElement('tr');
  data[0].forEach(cell => {
    const th = document.createElement('th');
    th.textContent = cell || '';
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);

  // Cập nhật dữ liệu đang hiển thị
  displayedData = data;
  selectedRowIndex = -1;
  document.getElementById('btnEditData').disabled = true;
  document.getElementById('btnDeleteData').disabled = true;

  // Dữ liệu (bỏ dòng đầu)
  for (let i = 1; i < data.length; i++) {
    const originalIndex = tableData.indexOf(data[i]);
    const row = document.createElement('tr');
    row.dataset.rowIndex = String(originalIndex); // Store index in tableData
    data[i].forEach((cell, colIndex) => {
      const td = document.createElement('td');
      // Cho cột ngày (index = 2): ưu tiên text đã format từ Google Sheet (string)
      if (colIndex === 2) {
        if (cell === undefined || cell === null) {
          td.textContent = '';
        } else if (typeof cell === 'string') {
          td.textContent = cell;
        } else {
          td.textContent = formatDate(cell);
        }
      } else {
        td.textContent = cell ?? '';
      }
      row.appendChild(td);
    });
    
    // Add click event to select row for editing
    row.addEventListener('click', () => {
      // Remove previous selection
      document.querySelectorAll('#dataTable tbody tr').forEach(r => r.classList.remove('table-active'));
      // Add selection to current row
      row.classList.add('table-active');
      selectedRowIndex = Number(row.dataset.rowIndex);
      document.getElementById('btnEditData').disabled = false;
      document.getElementById('btnDeleteData').disabled = false;
    });
    
    tbody.appendChild(row);
  }

  // (Native horizontal scroll is enabled via CSS; removed bottom fixed scrollbar)

  // Enable column resizing handles after the table has been rendered
  enableColumnResize(table);

  // Set native browser tooltip (`title`) only for cells that are visually truncated
  updateCellTitles(table);
}

// Add `title` attributes only when the visible cell content is truncated
function updateCellTitles(table) {
  if (!table) return;
  table.querySelectorAll('th, td').forEach(cell => {
    if (cell.scrollWidth > cell.clientWidth + 1) cell.title = (cell.textContent || '').trim();
    else cell.removeAttribute('title');
  });
}

// Recompute titles when the window resizes (columns may change)
window.addEventListener('resize', () => updateCellTitles(document.getElementById('dataTable')));



// Populate a dropdown based on header name (case-insensitive). Sets select.dataset.colIndex
function populateFilterForHeader(headerName, selectId, data) {
  if (!data || data.length === 0) return;
  const header = data[0] || [];
  const idx = header.findIndex(h => String(h ?? '').trim().toLowerCase() === String(headerName).trim().toLowerCase());
  const select = document.getElementById(selectId);
  if (!select) return;
  select.dataset.colIndex = idx;
  // If header not found, keep only default option
  if (idx === -1) {
    // keep empty
    select.innerHTML = '';
    return;
  }

  const set = new Set();
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    let v = row[idx];
    if (v === undefined || v === null) continue;
    if (typeof v !== 'string') {
      if (typeof v === 'number') v = String(v);
      else if (v instanceof Date) v = formatDate(v);
      else v = String(v);
    }
    v = v.trim();
    if (v === '') continue;
    set.add(v);
  }

  const arr = Array.from(set).sort((a,b) => a.localeCompare(b, 'vi'));
  // If select is multiple, don't add a "Tất cả" placeholder; populate options and set visible size
  select.innerHTML = '';
  arr.forEach(v => {
    const opt = document.createElement('option');
    opt.value = v;
    opt.textContent = v;
    select.appendChild(opt);
  });
  if (select.multiple) {
    select.size = Math.min(8, arr.length || 4);
  }
}

// Populate a dropdown menu (with checkboxes) for a header name
function populateTypeDropdown(headerName, menuId, btnId, countId, data) {
  if (!data || data.length === 0) return;
  const header = data[0] || [];
  const idx = header.findIndex(h => String(h ?? '').trim().toLowerCase() === String(headerName).trim().toLowerCase());
  const menu = document.getElementById(menuId);
  const btn = document.getElementById(btnId);
  const countEl = document.getElementById(countId);
  if (!menu) return;
  menu.innerHTML = '';
  if (idx === -1) {
    const none = document.createElement('div'); none.className = 'text-muted small'; none.textContent = 'Không tìm thấy cột';
    menu.appendChild(none);
    if (countEl) countEl.textContent = '0';
    return;
  }

  const set = new Set();
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    let v = row[idx];
    if (v === undefined || v === null) continue;
    if (typeof v !== 'string') {
      if (typeof v === 'number') v = String(v);
      else if (v instanceof Date) v = formatDate(v);
    }
    v = v.trim();
    if (v === '') continue;
    set.add(v);
  }

  const arr = Array.from(set).sort((a,b) => a.localeCompare(b, 'vi'));

  // Optional: add select-all / clear controls
  const ctrl = document.createElement('div');
  ctrl.className = 'd-flex gap-1 mb-2';
  const selAll = document.createElement('button'); selAll.type = 'button'; selAll.className = 'btn btn-sm btn-link p-0'; selAll.textContent = 'Chọn tất cả';
  const clr = document.createElement('button'); clr.type = 'button'; clr.className = 'btn btn-sm btn-link p-0 text-danger'; clr.textContent = 'Bỏ chọn';
  ctrl.appendChild(selAll); ctrl.appendChild(document.createTextNode(' · ')); ctrl.appendChild(clr);
  menu.appendChild(ctrl);

  selAll.addEventListener('click', (e) => {
    e.preventDefault();
    menu.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = true);
    if (countEl) countEl.textContent = String(menu.querySelectorAll('input[type="checkbox"]:checked').length);
    filterTable();
  });
  clr.addEventListener('click', (e) => {
    e.preventDefault();
    menu.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
    if (countEl) countEl.textContent = '0';
    filterTable();
  });

  arr.forEach((v, i) => {
    const id = `typeOpt_${i}`;
    const wrap = document.createElement('div'); wrap.className = 'form-check';
    const input = document.createElement('input');
    input.className = 'form-check-input'; input.type = 'checkbox'; input.value = v; input.id = id;
    const label = document.createElement('label'); label.className = 'form-check-label'; label.htmlFor = id; label.textContent = v;
    wrap.appendChild(input); wrap.appendChild(label);
    menu.appendChild(wrap);

    input.addEventListener('change', () => {
      if (countEl) countEl.textContent = String(menu.querySelectorAll('input[type="checkbox"]:checked').length);
      filterTable();
    });
  });

  if (countEl) countEl.textContent = '0';
  // store the column index on the menu for later filtering
  menu.dataset.colIndex = String(idx);
}

// Chuyển giá trị ô ngày (Excel serial / chuỗi) thành Date object hoặc null
function parseRowDate(raw) {
  if (raw === undefined || raw === null || raw === '') return null;
  if (typeof raw === 'number') {
    return new Date((raw - 25569) * 86400 * 1000);
  }
  if (typeof raw === 'string') {
    // dd/mm/yy or dd/mm/yyyy
    const m = raw.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
    if (m) {
      let d = parseInt(m[1], 10);
      let mo = parseInt(m[2], 10) - 1;
      let y = parseInt(m[3], 10);
      if (y < 100) y += y < 50 ? 2000 : 1900;
      return new Date(y, mo, d);
    }
    // ISO or other parseable formats
    const dt = new Date(raw);
    if (!isNaN(dt.getTime())) return dt;
    return null;
  }
  return null;
}

// Lọc dữ liệu theo ngày cột index 2 (zero-based)
function filterTable() {
  const fromVal = document.getElementById('fromDate')?.value || '';
  const toVal = document.getElementById('toDate')?.value || '';
  // Read selected values from the dropdown checkbox menu
  const typeMenu = document.getElementById('typeFilterMenu');
  const typeSelected = typeMenu ? Array.from(typeMenu.querySelectorAll('input[type="checkbox"]:checked')).map(i => String(i.value).trim()).filter(Boolean) : [];
  const typeColIndex = typeMenu && typeMenu.dataset && typeMenu.dataset.colIndex ? parseInt(typeMenu.dataset.colIndex, 10) : -1;
  
  const voucherMenu = document.getElementById('voucherFilterMenu');
  const voucherSelected = voucherMenu ? Array.from(voucherMenu.querySelectorAll('input[type="checkbox"]:checked')).map(i => String(i.value).trim()).filter(Boolean) : [];
  const voucherColIndex = voucherMenu && voucherMenu.dataset && voucherMenu.dataset.colIndex ? parseInt(voucherMenu.dataset.colIndex, 10) : -1;
  
  const from = fromVal ? new Date(fromVal) : null;
  const to = toVal ? new Date(toVal) : null;
  if (from) from.setHours(0,0,0,0);
  if (to) to.setHours(23,59,59,999);
  const needsDateFilter = !!from || !!to;

  const filtered = [tableData[0]];
  for (let i = 1; i < tableData.length; i++) {
    const row = tableData[i];

    // Date filter (only apply if user set from/to)
    if (needsDateFilter) {
      const rawDate = row[2];
      const d = parseRowDate(rawDate);
      if (!d) continue; // bỏ dòng không có ngày khi đang lọc theo ngày
      if (from && d < from) continue;
      if (to && d > to) continue;
    }

    // (Không còn lọc cột 5)

    // Lọc theo `Loại nhập/xuất` nếu có lựa chọn (multi-select)
    if (typeSelected.length > 0 && typeColIndex >= 0) {
      let tv = row[typeColIndex];
      if (tv === undefined || tv === null) continue;
      if (typeof tv !== 'string') {
        if (typeof tv === 'number') tv = String(tv);
        else if (tv instanceof Date) tv = formatDate(tv);
        else tv = String(tv);
      }
      if (!typeSelected.includes(tv.trim())) continue;
    }

    // Lọc theo `Mã chứng từ` nếu có lựa chọn (multi-select)
    if (voucherSelected.length > 0 && voucherColIndex >= 0) {
      let vv = row[voucherColIndex];
      if (vv === undefined || vv === null) continue;
      if (typeof vv !== 'string') {
        if (typeof vv === 'number') vv = String(vv);
        else if (vv instanceof Date) vv = formatDate(vv);
        else vv = String(vv);
      }
      if (!voucherSelected.includes(vv.trim())) continue;
    }

    filtered.push(row);
  }

  renderTable(filtered);
}

// Hàm định dạng ngày tháng
function formatDate(dateValue) {
  if (!dateValue) return '';

  let date = null;

  // Nếu là số (Excel serial number)
  if (typeof dateValue === 'number') {
    date = new Date((dateValue - 25569) * 86400 * 1000);
  } else if (typeof dateValue === 'string') {
    // Dùng parseRowDate để xử lý các chuỗi dạng dd/mm/yyyy, dd/mm/yy hoặc ISO
    date = parseRowDate(dateValue);
  } else if (dateValue instanceof Date) {
    date = dateValue;
  } else {
    return dateValue ?? '';
  }

  // Kiểm tra ngày hợp lệ
  if (!date || isNaN(date.getTime())) {
    return dateValue ?? '';
  }

  // Định dạng: dd/mm/yyyy
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

// Sự kiện nút xuất Excel
document.getElementById('btnExport').addEventListener('click', () => {
  // Export the currently displayed (possibly filtered) data
  if (!displayedData || displayedData.length === 0) return;

  const ws = XLSX.utils.aoa_to_sheet(displayedData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Dữ liệu");

  // Auto column widths
  const range = XLSX.utils.decode_range(ws['!ref']);
  for (let C = range.s.c; C <= range.e.c; ++C) {
    let maxWidth = 10;
    for (let R = range.s.r; R <= range.e.r; ++R) {
      const cell = ws[XLSX.utils.encode_cell({c:C, r:R})];
      if (cell && cell.v) {
        const len = String(cell.v).length;
        if (len > maxWidth) maxWidth = len;
      }
    }
    ws['!cols'] = ws['!cols'] || [];
    ws['!cols'][C] = { wch: Math.min(60, maxWidth + 2) };
  }

  XLSX.writeFile(wb, "du_lieu_google_sheet.xlsx");
});

// --- Add-data modal handlers ---
// Build and show the Add Data modal form based on current headers
function openAddDataModal() {
  const modalEl = document.getElementById('addDataModal'); if (!modalEl) return;
  const fieldsContainer = document.getElementById('addDataFields'); if (!fieldsContainer) return;
  fieldsContainer.innerHTML = '';
  const headers = (tableData && tableData[0]) ? tableData[0] : Array.from(document.querySelectorAll('#dataTable thead th')).map(th => th.textContent || '');

  // compute next sequence for column 1 (index 0)
  function getNextSequence() {
    if (!tableData || tableData.length <= 1) return 1;
    let max = 0;
    for (let r = 1; r < tableData.length; r++) {
      const v = tableData[r][0];
      if (v === undefined || v === null) continue;
      const n = (typeof v === 'number') ? v : (typeof v === 'string' ? parseInt(String(v).replace(/\D+/g, ''), 10) : NaN);
      if (!isNaN(n) && n > max) max = n;
    }
    return max + 1;
  }
  const nextSeq = getNextSequence();

  headers.forEach((h, i) => {
    const col = document.createElement('div'); col.className = 'col-12 col-md-6';
    const label = document.createElement('label'); label.className = 'form-label'; label.innerHTML = '<strong>' + (h || `Cột ${i+1}`) + '</strong>';

    // Column 1 (index 0) is auto-incremented and readonly
    if (i === 0) {
      const input = document.createElement('input');
      input.className = 'form-control form-control-sm';
      input.name = `col_${i}`;
      input.type = 'number'; input.step = '1'; input.value = String(nextSeq); input.readOnly = true;
      col.appendChild(label); col.appendChild(input); fieldsContainer.appendChild(col);
      return;
    }

    // Column 2 (index 1) is the fixed single-select
    if (i === 1) {
      const select = document.createElement('select');
      select.className = 'form-select form-select-sm';
      select.name = `col_${i}`;
      ['NM', 'NT', 'PX', 'DC'].forEach(v => {
        const opt = document.createElement('option'); opt.value = v; opt.textContent = v; select.appendChild(opt);
      });
      col.appendChild(label); col.appendChild(select); fieldsContainer.appendChild(col);
      return;
    }

    // Column 3 (index 2) is a date input (rendered as HTML date picker)
    if (i === 2) {
      const dateInput = document.createElement('input');
      dateInput.className = 'form-control form-control-sm';
      dateInput.name = `col_${i}`;
      dateInput.type = 'date';
      col.appendChild(label); col.appendChild(dateInput); fieldsContainer.appendChild(col);
      return;
    }

    const input = document.createElement('input');
    input.className = 'form-control form-control-sm';
    input.name = `col_${i}`;
    col.appendChild(label); col.appendChild(input); fieldsContainer.appendChild(col);
  });
  const bsModal = new bootstrap.Modal(modalEl); bsModal.show();
}

// Build and show the Edit Data modal form based on current headers and selected row data
function openEditDataModal() {
  // Check permission
  const currentUser = localStorage.getItem('currentUser');
  if (currentUser !== 'bao.lt') {
    alert('Không có quyền truy cập');
    return;
  }
  
  if (selectedRowIndex < 0 || selectedRowIndex >= tableData.length) {
    alert('Vui lòng chọn một dòng để sửa');
    return;
  }
  
  const modalEl = document.getElementById('editDataModal'); if (!modalEl) return;
  const fieldsContainer = document.getElementById('editDataFields'); if (!fieldsContainer) return;
  fieldsContainer.innerHTML = '';
  const headers = (tableData && tableData[0]) ? tableData[0] : Array.from(document.querySelectorAll('#dataTable thead th')).map(th => th.textContent || '');
  const rowData = tableData[selectedRowIndex];

  headers.forEach((h, i) => {
    const col = document.createElement('div'); col.className = 'col-12 col-md-6';
    const label = document.createElement('label'); label.className = 'form-label'; label.innerHTML = '<strong>' + (h || `Cột ${i+1}`) + '</strong>';

    // Column 1 (index 0) is auto-incremented and readonly
    if (i === 0) {
      const input = document.createElement('input');
      input.className = 'form-control form-control-sm';
      input.name = `col_${i}`;
      input.type = 'number'; input.step = '1'; input.value = String(rowData[i] ?? ''); input.readOnly = true;
      col.appendChild(label); col.appendChild(input); fieldsContainer.appendChild(col);
      return;
    }

    // Column 2 (index 1) is the fixed single-select
    if (i === 1) {
      const select = document.createElement('select');
      select.className = 'form-select form-select-sm';
      select.name = `col_${i}`;
      ['NM', 'NT', 'PX', 'DC'].forEach(v => {
        const opt = document.createElement('option'); opt.value = v; opt.textContent = v; select.appendChild(opt);
      });
      select.value = rowData[i] ?? '';
      col.appendChild(label); col.appendChild(select); fieldsContainer.appendChild(col);
      return;
    }

    // Column 3 (index 2) is a date input (rendered as HTML date picker)
    if (i === 2) {
      const dateInput = document.createElement('input');
      dateInput.className = 'form-control form-control-sm';
      dateInput.name = `col_${i}`;
      dateInput.type = 'date';
      
      // Convert dd/mm/yyyy to ISO format (yyyy-mm-dd) for the date input
      const dateStr = rowData[i];
      if (dateStr && typeof dateStr === 'string') {
        const m = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
        if (m) {
          let d = String(m[1]).padStart(2, '0');
          let mo = String(m[2]).padStart(2, '0');
          let y = m[3]; if (y.length === 2) y = (parseInt(y, 10) < 50 ? '20' : '19') + y;
          dateInput.value = `${y}-${mo}-${d}`;
        }
      }
      
      col.appendChild(label); col.appendChild(dateInput); fieldsContainer.appendChild(col);
      return;
    }

    const input = document.createElement('input');
    input.className = 'form-control form-control-sm';
    input.name = `col_${i}`;
    input.value = rowData[i] ?? '';
    col.appendChild(label); col.appendChild(input); fieldsContainer.appendChild(col);
  });
  const bsModal = new bootstrap.Modal(modalEl); bsModal.show();
}

// Show Delete Data confirmation modal
function openDeleteDataModal() {
  // Check permission
  const currentUser = localStorage.getItem('currentUser');
  if (currentUser !== 'bao.lt') {
    alert('Không có quyền truy cập');
    return;
  }
  
  if (selectedRowIndex < 0 || selectedRowIndex >= tableData.length) {
    alert('Vui lòng chọn một dòng để xóa');
    return;
  }
  
  const modalEl = document.getElementById('deleteDataModal'); if (!modalEl) return;
  const bsModal = new bootstrap.Modal(modalEl); bsModal.show();
}

// Handle form submissions (Add/Edit Data)
document.addEventListener('submit', async (e) => {
  try {
    if (e.target && e.target.id === 'addDataForm') {
      e.preventDefault();
      const form = e.target;
      const inputs = Array.from(form.querySelectorAll('input[name^="col_"], select[name^="col_"]'));
      const newRow = inputs.map(inp => inp.value ?? '');
      
      // Convert column 3 (index 2) from ISO date (YYYY-MM-DD) to dd/mm/yyyy for consistency
      if (newRow.length > 2 && newRow[2]) {
        const iso = newRow[2];
        const dt = new Date(iso);
        if (!isNaN(dt.getTime())) {
          const d = String(dt.getDate()).padStart(2, '0');
          const m = String(dt.getMonth() + 1).padStart(2, '0');
          const y = dt.getFullYear();
          newRow[2] = `${d}/${m}/${y}`;
        }
      }
      
      const cols = (tableData && tableData[0]) ? tableData[0].length : newRow.length;
      while (newRow.length < cols) newRow.push('');

      // If APPS_SCRIPT_URL is configured, try to POST the new row
      if (typeof APPS_SCRIPT_URL === 'string' && APPS_SCRIPT_URL.trim()) {
        const body = new URLSearchParams();
        body.set('values', JSON.stringify(newRow));
        const resp = await fetch(APPS_SCRIPT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
          body: body.toString()
        });
        const text = await resp.text();
        let j = null;
        try { j = JSON.parse(text); } catch (_) { j = null; }
        if (!resp.ok || (j && j.result && j.result !== 'success')) {
          throw new Error((j && j.error) || resp.statusText || 'Lỗi server');
        }
      }

      // Push locally and re-render
      tableData.push(newRow);
      renderTable(tableData);
      const modalEl = document.getElementById('addDataModal');
      const bs = bootstrap.Modal.getInstance(modalEl);
      if (bs) bs.hide();
      form.reset();
      
    } else if (e.target && e.target.id === 'editDataForm') {
      e.preventDefault();
      const form = e.target;
      const inputs = Array.from(form.querySelectorAll('input[name^="col_"], select[name^="col_"]'));
      const updatedRow = inputs.map(inp => inp.value ?? '');
      
      // Convert column 3 (index 2) from ISO date (YYYY-MM-DD) to dd/mm/yyyy
      if (updatedRow.length > 2 && updatedRow[2]) {
        const iso = updatedRow[2];
        const dt = new Date(iso);
        if (!isNaN(dt.getTime())) {
          const d = String(dt.getDate()).padStart(2, '0');
          const m = String(dt.getMonth() + 1).padStart(2, '0');
          const y = dt.getFullYear();
          updatedRow[2] = `${d}/${m}/${y}`;
        }
      }
      
      if (selectedRowIndex > 0 && selectedRowIndex < tableData.length) {
        tableData[selectedRowIndex] = updatedRow;
        
        // If APPS_SCRIPT_URL is configured, POST the update
        if (typeof APPS_SCRIPT_URL === 'string' && APPS_SCRIPT_URL.trim()) {
          const body = new URLSearchParams();
          body.set('values', JSON.stringify(updatedRow));
          body.set('action', 'update');
          body.set('rowIndex', String(selectedRowIndex + 1));
          const resp = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
            body: body.toString()
          });
          const text = await resp.text();
          let j = null;
          try { j = JSON.parse(text); } catch (_) { j = null; }
          if (!resp.ok || (j && j.result && j.result !== 'success')) {
            throw new Error((j && j.error) || resp.statusText || 'Lỗi server');
          }
        }
        
        // Re-render and clear selection
        renderTable(tableData);
        selectedRowIndex = -1;
        document.getElementById('btnEditData').disabled = true;
        document.getElementById('btnDeleteData').disabled = true;
        const modalEl = document.getElementById('editDataModal');
        const bs = bootstrap.Modal.getInstance(modalEl);
        if (bs) bs.hide();
        form.reset();
      }
    }
  } catch (err) {
    console.error('Form submit error:', err);
    alert('Lỗi: ' + (err.message || 'Không thể xử lý yêu cầu'));
  }
});

// Handle Delete Data confirmation
document.addEventListener('click', async (e) => {
  if (e.target && e.target.id === 'btnConfirmDelete') {
    e.preventDefault();
    e.stopPropagation();
    
    if (selectedRowIndex <= 0 || selectedRowIndex >= tableData.length) {
      alert('Không thể xóa dòng này');
      return;
    }

    const btnConfirm = document.getElementById('btnConfirmDelete');
    const originalText = btnConfirm.textContent;
    btnConfirm.disabled = true;
    btnConfirm.textContent = 'Đang xóa...';

    try {
      const rowToDelete = tableData[selectedRowIndex];

      // Send delete request to Google Sheet via Apps Script
      if (typeof APPS_SCRIPT_URL === 'string' && APPS_SCRIPT_URL.trim()) {
        const body = new URLSearchParams();
        body.set('action', 'delete');
        body.set('rowIndex', String(selectedRowIndex + 1));
        body.set('values', JSON.stringify(rowToDelete));
        
        const resp = await fetch(APPS_SCRIPT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
          body: body.toString()
        });
        
        const text = await resp.text();
        let j = null;
        try { j = JSON.parse(text); } catch (_) { j = null; }
        
        if (!resp.ok || (j && j.result && j.result !== 'success')) {
          throw new Error((j && j.error) || resp.statusText || 'Lỗi server');
        }
      }

      // Remove the row locally
      tableData.splice(selectedRowIndex, 1);
      
      // Close modal first
      const modalEl = document.getElementById('deleteDataModal'); 
      const bs = bootstrap.Modal.getInstance(modalEl); 
      if (bs) bs.hide();
      
      // Re-render and clear selection
      renderTable(tableData);
      selectedRowIndex = -1;
      document.getElementById('btnEditData').disabled = true;
      document.getElementById('btnDeleteData').disabled = true;
      
      alert('Xóa dữ liệu thành công');
    } catch (err) {
      console.error('Delete error:', err);
      alert('Lỗi: ' + (err.message || 'Không thể xóa dữ liệu'));
    } finally {
      btnConfirm.disabled = false;
      btnConfirm.textContent = originalText;
    }
  }
});

// Click bindings for add-row and add-data buttons
document.addEventListener('click', (e) => {
  const id = e.target && e.target.id; if (!id) return;
  if (id === 'btnAddData') openAddDataModal();
  if (id === 'btnEditData') openEditDataModal();
  if (id === 'btnDeleteData') openDeleteDataModal();
});
