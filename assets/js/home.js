/* =============================================================================
   AUTHENTICATION
   Kiểm tra và quản lý đăng nhập
   ================================================================================ */

// Kiểm tra xem đã đăng nhập chưa, nếu chưa thì quay về trang đăng nhập
window.addEventListener('load', () => {
  const currentUser = localStorage.getItem('currentUser');
  if (!currentUser) {
    window.location.href = 'index.html';
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
      window.location.replace('index.html');
    });
  }
});

/* =============================================================================
   DROPDOWN HIGHLIGHT FEATURE
   JavaScript-based highlight for parent dropdown when hovering on child items
   Provides better compatibility and smoother transitions
   ================================================================================ */

/**
 * Initialize dropdown highlight feature
 * Uses mouseenter/mouseleave for precise hover detection
 */
function initDropdownHighlight() {
  // Only apply on desktop (screen width > 768px)
  if (window.innerWidth <= 768) return;

  // Get all dropdown menus
  const dropdownMenus = document.querySelectorAll('.dropdown-menu');

  dropdownMenus.forEach(menu => {
    // Get the parent dropdown (level 1)
    const parentDropdown = menu.closest('.dropdown');
    if (!parentDropdown) return;

    // Get all direct child list items in this menu
    const listItems = menu.querySelectorAll(':scope > li');

    listItems.forEach(item => {
      // Mouseenter: Add highlight to parent
      item.addEventListener('mouseenter', () => {
        parentDropdown.classList.add('highlighted');

        // Also highlight level 2 parent if exists (for nested submenus)
        const level2Parent = item.closest('.dropdown-submenu');
        if (level2Parent && level2Parent !== parentDropdown) {
          level2Parent.classList.add('highlighted');
        }
      });

      // Mouseleave: Remove highlight from parent
      item.addEventListener('mouseleave', () => {
        parentDropdown.classList.remove('highlighted');

        // Remove highlight from level 2 parent
        const level2Parent = item.closest('.dropdown-submenu');
        if (level2Parent && level2Parent !== parentDropdown) {
          level2Parent.classList.remove('highlighted');
        }
      });
    });
  });
}

/**
 * Handle touch devices - use touchstart for mobile highlight
 */
function initTouchDropdownHighlight() {
  // Only apply on mobile/touch devices
  if (window.innerWidth > 768) return;

  const dropdownToggles = document.querySelectorAll('.dropdown-toggle');

  dropdownToggles.forEach(toggle => {
    toggle.addEventListener('touchstart', (e) => {
      const dropdown = toggle.closest('.dropdown');
      if (dropdown) {
        dropdown.classList.toggle('highlighted');
      }
    }, { passive: true });
  });
}

/**
 * Re-initialize highlight on window resize
 * Ensures feature works correctly when switching between mobile/desktop
 */
function handleResizeHighlight() {
  // Remove existing highlight classes on resize
  document.querySelectorAll('.highlighted').forEach(el => {
    el.classList.remove('highlighted');
  });

  // Re-initialize based on new screen size
  initDropdownHighlight();
  initTouchDropdownHighlight();
}

// Initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  initDropdownHighlight();
  initTouchDropdownHighlight();
  initARIAUpdates();

  // Re-init on resize with debounce
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(handleResizeHighlight, 150);
  });
});

/**
 * Update ARIA attributes for accessibility
 * Handles aria-expanded state changes
 */
function initARIAUpdates() {
  const dropdowns = document.querySelectorAll('.dropdown');

  dropdowns.forEach(dropdown => {
    const toggle = dropdown.querySelector('.dropdown-toggle');
    const menu = dropdown.querySelector('.dropdown-menu');

    if (toggle && menu) {
      // Desktop: Update aria-expanded on hover
      if (window.innerWidth > 768) {
        dropdown.addEventListener('mouseenter', () => {
          toggle.setAttribute('aria-expanded', 'true');
        });

        dropdown.addEventListener('mouseleave', () => {
          toggle.setAttribute('aria-expanded', 'false');
        });
      }

      // Mobile: Update aria-expanded on click
      toggle.addEventListener('click', (e) => {
        if (window.innerWidth <= 768) {
          const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
          toggle.setAttribute('aria-expanded', !isExpanded);
        }
      });
    }
  });
}

/* =============================================================================
   HAMBURGER MENU & MOBILE NAVIGATION
   Xử lý menu hamburger và điều hướng trên mobile
   ================================================================================ */

document.addEventListener('DOMContentLoaded', () => {
  const hamburger = document.getElementById('hamburger');
  const mainNav = document.getElementById('mainNav');
  const xgDropdown = document.getElementById('xgDropdown');
  const toleDropdown = document.getElementById('toleDropdown');

  // Hamburger menu toggle
  if (hamburger && mainNav) {
    hamburger.addEventListener('click', (e) => {
      e.preventDefault();
      hamburger.classList.toggle('active');
      mainNav.classList.toggle('active');
    });
  }

  // Dropdown click for mobile
  if (xgDropdown) {
    const dropdownToggle = xgDropdown.querySelector('.dropdown-toggle');
    if (dropdownToggle) {
      dropdownToggle.addEventListener('click', (e) => {
        // Only on mobile
        if (window.innerWidth <= 768) {
          e.preventDefault();
          xgDropdown.classList.toggle('active');
        }
      });
    }
  }

  // Dropdown click for mobile - Tole
  if (toleDropdown) {
    const dropdownToggle = toleDropdown.querySelector('.dropdown-toggle');
    if (dropdownToggle) {
      dropdownToggle.addEventListener('click', (e) => {
        // Only on mobile
        if (window.innerWidth <= 768) {
          e.preventDefault();
          toleDropdown.classList.toggle('active');
        }
      });
    }
  }

  // Dropdown click for mobile - Phế liệu
  const plDropdown = document.getElementById('plDropdown');
  if (plDropdown) {
    const dropdownToggle = plDropdown.querySelector('.dropdown-toggle');
    if (dropdownToggle) {
      dropdownToggle.addEventListener('click', (e) => {
        // Only on mobile
        if (window.innerWidth <= 768) {
          e.preventDefault();
          plDropdown.classList.toggle('active');
        }
      });
    }
  }

  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768) {
      if (mainNav && !mainNav.contains(e.target) && !hamburger.contains(e.target)) {
        mainNav.classList.remove('active');
        hamburger.classList.remove('active');
      }
    }
  });

  // Handle window resize
  window.addEventListener('resize', () => {
    if (window.innerWidth > 768 && mainNav) {
      mainNav.classList.remove('active');
      hamburger.classList.remove('active');
    }
  });
});
