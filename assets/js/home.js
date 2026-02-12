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
});
