document.addEventListener('DOMContentLoaded', function () {
   const form = document.getElementById('loginForm');
   const errorMessage = document.getElementById('errorMessage');

   form.addEventListener('submit', function (e) {
      e.preventDefault(); // Ngăn submit mặc định

      const username = form.username.value.trim();
      const password = form.password.value;

      // Tài khoản demo (thay đổi ở đây nếu cần)
      const validUsername = 'bao.lt';
      const validPassword = '6697';

      if (username === validUsername && password === validPassword) {
         // Đăng nhập đúng → chuyển trang
         window.location.href = 'xg.html'; // Thay bằng trang bạn muốn
      } else {
         // Sai → hiển thị lỗi
         errorMessage.textContent = 'Tên đăng nhập hoặc mật khẩu không đúng!';
         errorMessage.style.display = 'block';
      }
   });
});
