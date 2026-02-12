document.addEventListener('DOMContentLoaded', function () {
   // Kiểm tra xem đã đăng nhập rồi chưa
   const currentUser = localStorage.getItem('currentUser');
   if (currentUser) {
      window.location.href = 'home.html';
      return;
   }
   
   const form = document.getElementById('loginForm');
   const errorMessage = document.getElementById('errorMessage');

   // Danh sách tài khoản hợp lệ
   const validAccounts = [
      { username: 'bao.lt', password: '6697' },
      { username: 'admin', password: 'admin123' },
      { username: 'user1', password: 'pass123' },
      { username: 'user2', password: 'pass456' }
   ];

   form.addEventListener('submit', function (e) {
      e.preventDefault(); // Ngăn submit mặc định

      const username = form.username.value.trim();
      const password = form.password.value;

      // Kiểm tra tài khoản có tồn tại trong danh sách không
      const account = validAccounts.find(acc => acc.username === username && acc.password === password);

      if (account) {
         // Lưu username vào localStorage
         localStorage.setItem('currentUser', username);
         // Đăng nhập đúng → chuyển trang
         window.location.href = 'home.html'; // Thay bằng trang bạn muốn
      } else {
         // Sai → hiển thị lỗi
         errorMessage.textContent = 'Tên đăng nhập hoặc mật khẩu không đúng!';
         errorMessage.style.display = 'block';
      }
   });
});
