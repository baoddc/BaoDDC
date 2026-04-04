/**
 * HSE MANAGEMENT SYSTEM - CORE JAVASCRIPT
 * Handles Data Fetching, Rendering, and UI Interactivity
 */

// --- Configuration ---
const CONFIG = {
    // Replace with your actual Google API Key and Spreadsheet ID
    API_KEY: 'YOUR_GOOGLE_API_KEY',
    SPREADSHEET_ID: '1keZMSZqlHFIe7la0H2eR-PDmO2S2ChHo5vn3-H1uoh8', // Using existing ID from project as fallback
    SIMULATE_DATA: false // Set to false when API Key is provided
};

// --- Module Definitions ---
const HSE_MODULES = [
    {
        id: 'job-plan',
        title: 'Kế hoạch công việc',
        desc: 'Danh sách kế hoạch, người phụ trách và thời hạn hoàn thành.',
        icon: 'clipboard',
        colorClass: 'icon-green',
        sheetName: 'Kế hoạch công việc',
        sheetId: '0',
        keywords: ['kế hoạch', 'cv', 'deadline', 'trạng thái']
    },
    {
        id: 'wh-photos',
        title: 'Ảnh mẫu kho',
        desc: 'Gallery ảnh mẫu sắp xếp kho bãi tiêu chuẩn.',
        icon: 'image',
        colorClass: 'icon-blue',
        sheetName: 'Ảnh mẫu kho',
        sheetId: '426924190',
        keywords: ['ảnh', 'mẫu', 'kho', 'gallery']
    },
    {
        id: 'clean-schedule',
        title: 'Lịch vệ sinh',
        desc: 'Lịch phân công vệ sinh khu vực theo tuần/tháng.',
        icon: 'calendar',
        colorClass: 'icon-amber',
        sheetName: 'Lịch vệ sinh',
        sheetId: '726858482',
        keywords: ['lịch', 'vệ sinh', 'ca trực']
    },
    {
        id: 'clean-photos',
        title: 'Ảnh vệ sinh',
        desc: 'Báo cáo hình ảnh vệ sinh thực tế tại hiện trường.',
        icon: 'camera',
        colorClass: 'icon-blue',
        sheetName: 'Ảnh vệ sinh',
        sheetId: '160925326',
        keywords: ['ảnh', 'vệ sinh', 'thực tế']
    },
    {
        id: 'equipment-checklist',
        title: 'Checklist kiểm tra thiết bị',
        desc: 'Kiểm tra định kỳ tình trạng an toàn thiết bị.',
        icon: 'check-square',
        colorClass: 'icon-green',
        sheetName: 'Checklist kiểm tra thiết bị',
        sheetId: '20754979',
        keywords: ['checklist', 'kiểm tra', 'thiết bị']
    },
    {
        id: 'tools-inventory',
        title: 'Công cụ dụng cụ (CCDC)',
        desc: 'Quản lý danh mục, số lượng và tình trạng CCDC.',
        icon: 'tool',
        colorClass: 'icon-amber',
        sheetName: 'Công cụ dụng cụ (CCDC)',
        sheetId: '414597666',
        keywords: ['ccdc', 'công cụ', 'dụng cụ', 'tồn kho']
    },
    {
        id: 'disposal-standards',
        title: 'Tiêu chuẩn loại bỏ Công cụ dụng cụ',
        desc: 'Quy định và điều kiện để thanh lý/loại bỏ CCDC.',
        icon: 'trash-2',
        colorClass: 'icon-red',
        sheetName: 'Tiêu chuẩn loại bỏ Công cụ dụng cụ',
        sheetId: '1346553726',
        keywords: ['loại bỏ', 'thanh lý', 'tiêu chuẩn']
    },
    {
        id: 'scrap-categories',
        title: 'Danh mục phân loại phế liệu',
        desc: 'Phân loại các nhóm phế liệu và mã định danh.',
        icon: 'layers',
        colorClass: 'icon-amber',
        sheetName: 'Danh mục phân loại phế liệu',
        sheetId: '1085802127',
        keywords: ['phế liệu', 'danh mục', 'phân loại']
    },
    {
        id: 'scrap-regs',
        title: 'Quy định phân loại phế liệu',
        desc: 'Hướng dẫn chi tiết quy trình phân loại tại nguồn.',
        icon: 'file-text',
        colorClass: 'icon-blue',
        sheetName: 'Quy định phân loại phế liệu',
        sheetId: '1019224573',
        keywords: ['quy định', 'hướng dẫn', 'phế liệu']
    },
    {
        id: '5s-fix',
        title: 'Khắc phục 5S',
        desc: 'Theo dõi xử lý các điểm không phù hợp 5S.',
        icon: 'activity',
        colorClass: 'icon-red',
        sheetName: 'Khắc phục 5S',
        sheetId: '794649355',
        keywords: ['5s', 'khắc phục', 'lỗi']
    },
    {
        id: '5s-race',
        title: 'Thi đua 5S',
        desc: 'Bảng xếp hạng và điểm số 5S các khu vực.',
        icon: 'award',
        colorClass: 'icon-amber',
        sheetName: 'Thi đua 5S',
        sheetId: '1047465605',
        keywords: ['thi đua', 'điểm số', 'xếp hạng']
    }
];

// --- Mock Data Generator ---
const MockData = {
    'job-plan': [
        ['Tiêu đề', 'Mô tả', 'Người phụ trách', 'Hạn định', 'Trạng thái'],
        ['Vệ sinh khu A', 'Quét dọn và sắp xếp pallet', 'Nguyễn Văn A', '2024-04-05', 'Đang thực hiện'],
        ['Kiểm tra PCCC', 'Kiểm tra bình chữa cháy tầng 1', 'Trần Thị B', '2024-04-02', 'Hoàn thành'],
        ['Sơn lại vạch kẻ', 'Khu vực xuất hàng', 'Lê Văn C', '2024-03-25', 'Quá hạn']
    ],
    'wh-photos': [
        ['Tên ảnh', 'Ngày chụp', 'URL', 'Ghi chú'],
        ['Mẫu kệ hàng A', '2024-03-20', 'https://picsum.photos/400/300?random=1', 'Sắp xếp đúng quy chuẩn'],
        ['Lối đi an toàn', '2024-03-21', 'https://picsum.photos/400/300?random=2', 'Không vật cản'],
        ['Khu vực phế liệu', '2024-03-22', 'https://picsum.photos/400/300?random=3', 'Phân loại rõ ràng']
    ],
    '5s-race': [
        ['Khu vực', 'Điểm 5S', 'Xếp hạng', 'Xu hướng'],
        ['Kho Thành phẩm', '95', '1', '↑'],
        ['Kho Nguyên liệu', '88', '2', '↓'],
        ['Khu vực Sản xuất', '82', '3', '→']
    ]
    // Add more mock data as needed for other modules
};

// --- GSheets Service ---
class GSheetsService {
    static async fetchSheetData(sheetId, mockKey) {
        if (CONFIG.SIMULATE_DATA) {
            return new Promise(resolve => {
                setTimeout(() => resolve(MockData[mockKey] || [['No data'], ['Simulation data for ' + mockKey]]), 800);
            });
        }

        try {
            const url = `https://docs.google.com/spreadsheets/d/${CONFIG.SPREADSHEET_ID}/export?format=csv&gid=${sheetId}`;
            const response = await fetch(url);
            const csvText = await response.text();
            return this.parseCSV(csvText);
        } catch (error) {
            console.error(`Error fetching sheet ${sheetId}:`, error);
            throw error;
        }
    }

    /**
     * Parse CSV text into 2D array
     * Handles quoted values and escaped quotes (standard Google Sheets CSV format)
     */
    static parseCSV(text) {
        const result = [];
        let row = [];
        let field = '';
        let inQuotes = false;

        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            const nextChar = text[i + 1];

            if (inQuotes) {
                if (char === '"' && nextChar === '"') {
                    field += '"';
                    i++;
                } else if (char === '"') {
                    inQuotes = false;
                } else {
                    field += char;
                }
            } else {
                if (char === '"') {
                    inQuotes = true;
                } else if (char === ',') {
                    row.push(field.trim());
                    field = '';
                } else if (char === '\n' || (char === '\r' && nextChar === '\n')) {
                    row.push(field.trim());
                    result.push(row);
                    row = [];
                    field = '';
                    if (char === '\r') i++;
                } else {
                    field += char;
                }
            }
        }

        // Push last row if exists
        if (field || row.length > 0) {
            row.push(field.trim());
            result.push(row);
        }

        return result.filter(r => r.length > 0 && r.some(c => c !== ''));
    }
}

// --- Icons (SVG) ---
const ICONS = {
    clipboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>',
    image: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>',
    calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>',
    camera: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>',
    'check-square': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>',
    tool: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>',
    'trash-2': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>',
    layers: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 12 17 2 12"></polyline><polyline points="22 7 12 12 2 7"></polyline><path d="M12 2L2 7l10 5 10-5-10-5z"></path></svg>',
    'file-text': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>',
    activity: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>',
    award: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>',
    'arrow-right': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>'
};

// --- Dashboard Manager ---
class DashboardManager {
    constructor() {
        this.grid = document.getElementById('moduleGrid');
        this.searchField = document.getElementById('globalSearch');
        this.overlay = document.getElementById('loadingOverlay');
        this.modal = document.getElementById('detailModal');
        this.modalBody = document.getElementById('modalBody');
        this.modalTitle = document.getElementById('modalTitle');

        this.modules = HSE_MODULES;
        this.init();
    }

    init() {
        this.renderModules(this.modules);
        this.setupEventListeners();
        this.checkAuth();
    }

    checkAuth() {
        const user = localStorage.getItem('currentUser');
        if (!user) {
            window.location.replace('/pages/dang_nhap.html');
        }

        const btnLogout = document.getElementById('btnLogout');
        if (btnLogout) {
            btnLogout.onclick = () => {
                localStorage.removeItem('currentUser');
                window.location.replace('/pages/dang_nhap.html');
            };
        }
    }

    // renderDate function removed

    renderModules(modulesToRender) {
        // Clear previous cards except loading overlay
        const loading = this.overlay;
        this.grid.innerHTML = '';
        this.grid.appendChild(loading);

        this.overlay.style.display = 'none';

        if (modulesToRender.length === 0) {
            this.grid.innerHTML += `<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 3rem;">Không tìm thấy kết quả nào cho "${this.searchField.value}"</p>`;
            return;
        }

        modulesToRender.forEach(module => {
            const card = document.createElement('div');
            card.className = 'glass-card';
            card.innerHTML = `
                <div class="card-top">
                    <div class="card-icon ${module.colorClass}">
                        ${ICONS[module.icon] || ICONS.clipboard}
                    </div>
                    <div class="card-header">
                        <h3>${module.title}</h3>
                        <p class="card-desc">${module.desc}</p>
                    </div>
                </div>
                <div class="card-footer">
                    <span class="status-badge badge-live">Live</span>
                    <button class="btn-more" onclick="app.openDetail('${module.id}')">
                        Xem chi tiết
                        ${ICONS['arrow-right']}
                    </button>
                </div>
            `;
            this.grid.appendChild(card);
        });
    }

    setupEventListeners() {
        // Global Search
        this.searchField.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const filtered = this.modules.filter(m =>
                m.title.toLowerCase().includes(query) ||
                m.desc.toLowerCase().includes(query) ||
                m.keywords.some(k => k.includes(query))
            );
            this.renderModules(filtered);
        });

        // Close Modal
        document.getElementById('closeModal').onclick = () => this.closeModal();
        window.onclick = (e) => { if (e.target === this.modal) this.closeModal(); };

        // ESC key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.classList.contains('active')) {
                this.closeModal();
            }
        });
    }

    async openDetail(moduleId) {
        const module = this.modules.find(m => m.id === moduleId);
        if (!module) return;

        this.modalTitle.textContent = module.title;
        this.modalBody.innerHTML = '<div class="spinner" style="margin: 2rem auto;"></div>';
        this.modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        try {
            const data = await GSheetsService.fetchSheetData(module.sheetId, module.id);
            this.renderModalContent(moduleId, data);
        } catch (err) {
            this.modalBody.innerHTML = `<p class="error-msg" style="color: var(--danger);">Lỗi tải dữ liệu: ${err.message}</p>`;
        }
    }

    closeModal() {
        this.modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }

    renderModalContent(moduleId, data) {
        if (!data || data.length === 0) {
            this.modalBody.innerHTML = '<p>Không có dữ liệu hiển thị.</p>';
            return;
        }

        if (moduleId === 'wh-photos' || moduleId === 'clean-photos') {
            this.renderGallery(data);
        } else {
            this.renderTable(data);
        }
    }

    renderTable(data) {
        const headers = data[0];
        const rows = data.slice(1);

        let html = '<table class="hse-table"><thead><tr>';
        headers.forEach(h => html += `<th>${h}</th>`);
        html += '</tr></thead><tbody>';

        rows.forEach(row => {
            html += '<tr>';
            row.forEach((cell, idx) => {
                let cellHtml = cell || '';
                // Special formatting for status in Job Plan
                if (headers[idx] === 'Trạng thái') {
                    const statusClass = cell === 'Hoàn thành' ? 'badge-live' : (cell === 'Quá hạn' ? 'badge-danger' : 'badge-warning');
                    cellHtml = `<span class="status-badge ${statusClass}">${cell}</span>`;
                }
                html += `<td>${cellHtml}</td>`;
            });
            html += '</tr>';
        });

        html += '</tbody></table>';
        this.modalBody.innerHTML = html;

        // Inject dynamic styles for status if needed
        if (!document.getElementById('status-styles')) {
            const style = document.createElement('style');
            style.id = 'status-styles';
            style.textContent = `
                .badge-danger { background: rgba(239, 68, 68, 0.2); color: #f87171; }
                .badge-warning { background: rgba(245, 158, 11, 0.2); color: #fbbf24; }
            `;
            document.head.appendChild(style);
        }
    }

    renderGallery(data) {
        const rows = data.slice(1);
        let html = '<div class="gallery-grid">';
        rows.forEach(row => {
            const [name, date, url, note] = row;
            html += `
                <div class="gallery-item">
                    <img src="${url}" alt="${name}" class="img-thumb" onclick="window.open('${url}', '_blank')">
                    <div class="gallery-info" style="margin-top: 0.5rem;">
                        <p style="font-weight: 600; font-size: 0.9rem;">${name}</p>
                        <p style="color: var(--text-muted); font-size: 0.8rem;">${date}</p>
                        <p style="font-size: 0.8rem; margin-top: 0.25rem;">${note || ''}</p>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        this.modalBody.innerHTML = html;
    }
}

// Start Application
const app = new DashboardManager();
