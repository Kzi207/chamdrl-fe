# 🎓 Hệ Thống Quản Lý Sinh Viên

<div align="center">

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![React](https://img.shields.io/badge/React-18.2.0-61dafb.svg?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.2.2-3178c6.svg?logo=typescript)
![MySQL](https://img.shields.io/badge/MySQL-8.0+-4479a1.svg?logo=mysql&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-green.svg)

**Hệ thống quản lý điểm danh, điểm rèn luyện và học tập sinh viên**

[Tính năng](#-tính-năng-chính) • [Cài đặt](#-cài-đặt) • [Sử dụng](#-hướng-dẫn-sử-dụng) • [API](#-api-endpoints) • [Liên hệ](#-liên-hệ-hỗ trợ)

</div>

---

## 📋 Giới thiệu

Hệ thống quản lý sinh viên là một ứng dụng web hiện đại được thiết kế để hỗ trợ quản lý toàn diện các hoạt động học tập và sinh hoạt của sinh viên tại các trường đại học và cao đẳng. Hệ thống cung cấp các tính năng:

- ✅ **Điểm danh tự động** bằng QR Code
- 📊 **Quản lý điểm rèn luyện** (ĐRL) theo quy định
- 🎯 **Tính toán GPA** tự động với nhiều học kỳ
- 📱 **Giao diện responsive** hoạt động mượt mà trên mọi thiết bị
- 🔐 **Bảo mật cao** với Firebase Authentication
- 💾 **Sao lưu tự động** và khôi phục dữ liệu
- 📈 **Báo cáo thống kê** chi tiết và trực quan

## ✨ Tính năng chính

### 🎯 Quản lý điểm danh
- **Quét QR Code nhanh chóng**: Sinh viên điểm danh bằng mã QR cá nhân
- **Điểm danh hàng loạt**: Hỗ trợ điểm danh nhiều sinh viên cùng lúc
- **Lịch sử điểm danh**: Tra cứu và xuất báo cáo điểm danh theo thời gian
- **Thông báo real-time**: Cập nhật trạng thái điểm danh ngay lập tức

### 📚 Quản lý lớp học
- Tạo và quản lý danh sách lớp học
- Phân công giảng viên chủ nhiệm
- Quản lý danh sách sinh viên từng lớp
- Import/Export danh sách từ file Excel

### 🏆 Điểm rèn luyện (ĐRL)
- **Biểu mẫu ĐRL chuẩn**: Theo quy định của Bộ Giáo dục
- **Tính toán tự động**: Tổng hợp điểm từ các hoạt động
- **Thống kê ĐRL**: Báo cáo chi tiết theo lớp, khoa, trường
- **Xếp loại tự động**: Xuất sắc, Giỏi, Khá, Trung bình, Yếu

### 📊 Quản lý GPA
- **Tính toán GPA**: Hỗ trợ thang điểm 4.0 và thang điểm chữ
- **Theo dõi nhiều kỳ**: Quản lý GPA theo từng học kỳ
- **Dự đoán GPA**: Công cụ tính toán GPA dự kiến
- **Biểu đồ trực quan**: Theo dõi xu hướng học tập

### 🔒 Quản trị hệ thống
- **Dashboard tổng quan**: Thống kê nhanh các chỉ số quan trọng
- **Quản lý người dùng**: Phân quyền Admin, Giảng viên, Sinh viên
- **Cấu hình hệ thống**: Firebase, API, SQL, Website
- **Logs & Security**: Theo dõi hoạt động và bảo mật
- **Backup & Restore**: Sao lưu và khôi phục dữ liệu

### 📈 Báo cáo & Thống kê
- Báo cáo điểm danh theo ngày/tuần/tháng/học kỳ
- Thống kê tỷ lệ đi học theo lớp
- Xuất báo cáo dạng Excel/PDF
- Biểu đồ trực quan với Recharts

## 🛠️ Công nghệ sử dụng

### Frontend
- **React 18.2** - Thư viện UI hiện đại
- **TypeScript 5.2** - Type safety và developer experience
- **Vite 5.4** - Build tool siêu nhanh
- **React Router 6** - Routing cho SPA
- **TailwindCSS 3.4** - Utility-first CSS framework
- **Lucide React** - Bộ icon đẹp và nhẹ

### Backend
- **Node.js + Express** - REST API server
- **MySQL 8.0+** - Database quan hệ mạnh mẽ
- **Firebase Authentication** - Xác thực người dùng
- **Firebase Storage** - Lưu trữ file và hình ảnh

### Thư viện hỗ trợ
- **xlsx** - Xử lý file Excel
- **jsPDF** - Tạo file PDF
- **QRCode** - Tạo mã QR
- **jsQR** - Quét mã QR
- **Recharts** - Biểu đồ thống kê
- **JSZip** - Nén và giải nén file

## 📦 Yêu cầu hệ thống

- **Node.js**: >= 18.0.0
- **npm**: >= 9.0.0
- **MySQL**: >= 8.0.0
- **Trình duyệt**: Chrome, Firefox, Edge, Safari (phiên bản mới nhất)

## 🚀 Cài đặt

### Bước 1: Clone repository

```bash
git clone https://github.com/yourusername/kzi-attendance-app.git
cd kzi-attendance-app
```

### Bước 2: Cài đặt dependencies

```bash
npm install
```

### Bước 3: Cấu hình MySQL

1. Tạo database mới:

```sql
CREATE DATABASE diemdanh CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. Tạo user và cấp quyền:

```sql
CREATE USER 'diemdanh_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON diemdanh.* TO 'diemdanh_user'@'localhost';
FLUSH PRIVILEGES;
```

### Bước 4: Cấu hình Firebase

1. Tạo project tại [Firebase Console](https://console.firebase.google.com/)
2. Kích hoạt **Authentication** (Email/Password)
3. Kích hoạt **Storage** cho upload files
4. Lấy Firebase Config từ Project Settings

### Bước 5: Cấu hình hệ thống

Truy cập giao diện admin để cấu hình:

```
http://localhost:5173/admin/settings
```

**Tab 1: Firebase Config**
- API Key
- Auth Domain
- Project ID
- Storage Bucket
- Messaging Sender ID
- App ID

**Tab 2: API Config**
- API Key (tự sinh hoặc tùy chỉnh)
- Server URL

**Tab 3: SQL Config**
- Host: `localhost`
- Port: `3306`
- User: `diemdanh_user`
- Password: `your_password`
- Database: `diemdanh`

**Tab 4: Web Config**
- Tên website
- Logo
- Thông tin liên hệ
- Chế độ bảo trì

### Bước 6: Khởi tạo database schema

Có 2 cách để khởi tạo database:

**Cách 1: Từ giao diện Admin (Khuyên dùng)**
```
1. Truy cập: http://localhost:5173/admin/settings
2. Chọn tab "Cấu hình SQL"
3. Nhấn "Test Connection" để kiểm tra kết nối
4. Nhấn "Run Migration" để tạo các bảng
```

**Cách 2: Từ command line**
```bash
npm run migrate
```

### Bước 7: Khởi động ứng dụng

**Development mode:**
```bash
npm run dev
```

Ứng dụng sẽ chạy tại:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3004

**Production mode:**
```bash
npm run build
npm start
```

## 📖 Hướng dẫn sử dụng

### 🔐 Đăng nhập lần đầu

**Admin mặc định:**
- Truy cập: `http://localhost:5173/admin/login`
- Tạo tài khoản admin đầu tiên qua Firebase Console
- Thêm vai trò admin trong database:

```sql
UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
```

### 👨‍🎓 Quản lý sinh viên

1. **Thêm sinh viên:**
   - Admin Dashboard → Quản lý người dùng
   - Nhấn "Thêm sinh viên"
   - Nhập thông tin: MSSV, Họ tên, Email, Lớp
   - Hệ thống tự động tạo mã QR cá nhân

2. **Import hàng loạt:**
   - Tải template Excel mẫu
   - Điền thông tin sinh viên
   - Upload file → Hệ thống xử lý tự động

### 📱 Điểm danh

**Với sinh viên:**
1. Đăng nhập vào hệ thống
2. Vào mục "Mã QR của tôi"
3. Hiển thị mã QR cho giảng viên quét

**Với giảng viên:**
1. Vào "Điểm danh" → "Quét nhanh"
2. Chọn lớp học và buổi học
3. Quét mã QR của từng sinh viên
4. Hệ thống lưu tự động

### 📊 Quản lý ĐRL

1. **Sinh viên điền ĐRL:**
   - Đăng nhập → "Điểm rèn luyện"
   - Điền các hoạt động đã tham gia
   - Gửi phê duyệt

2. **Giảng viên duyệt ĐRL:**
   - Vào "Quản lý ĐRL"
   - Xem danh sách chờ duyệt
   - Phê duyệt hoặc từ chối

3. **Xem thống kê:**
   - "Thống kê ĐRL" → Chọn lớp/khoa
   - Xem biểu đồ và bảng xếp hạng
   - Xuất báo cáo Excel/PDF

### 🎯 Quản lý GPA

1. **Nhập điểm:**
   - Admin → "Quản lý GPA"
   - Upload file Excel điểm số
   - Hệ thống tính GPA tự động

2. **Sinh viên xem điểm:**
   - Dashboard → "GPA của tôi"
   - Xem điểm từng môn và GPA tổng hợp
   - Sử dụng công cụ tính GPA dự kiến

### 💾 Sao lưu & Khôi phục

**Sao lưu tự động:**
- Hệ thống tự động backup hàng ngày
- File lưu tại thư mục `/backups`

**Sao lưu thủ công:**
```bash
npm run backup
```

**Danh sách backup:**
```bash
npm run backup:list
```

**Khôi phục:**
```bash
npm run backup:restore
```

Hoặc qua giao diện:
```
Admin Dashboard → Backup & Restore → Chọn file → Khôi phục
```

## 📜 Scripts

```bash
# Development
npm run dev              # Chạy cả frontend và backend
npm run server          # Chỉ chạy backend API

# Build
npm run build           # Build production (auto migrate database)
npm run build:frontend  # Chỉ build frontend
npm run build:db        # Chỉ chạy auto-migration

# Database
npm run migrate         # Chạy migration (tạo/cập nhật tables)
npm run migrate:safe    # Migration an toàn (không xóa dữ liệu)

# Backup
npm run backup          # Backup database ngay
npm run backup:list     # Xem danh sách backup
npm run backup:restore  # Khôi phục từ backup

# Preview
npm run preview         # Preview production build
```

## 📁 Cấu trúc thư mục

```
kzi-attendance-app/
├── 📁 components/          # React components tái sử dụng
│   ├── BackToTop.tsx       # Nút scroll to top
│   ├── ContactBubble.tsx   # Nút liên hệ hỗ trợ
│   └── GPACalculator.tsx   # Component tính GPA
│
├── 📁 pages/              # Các trang chính
│   ├── Landing.tsx        # Trang chủ
│   ├── Login.tsx          # Đăng nhập
│   ├── Dashboard.tsx      # Tổng quan
│   ├── AttendanceScanner.tsx  # Quét điểm danh
│   ├── ClassManagement.tsx    # Quản lý lớp học
│   ├── DRLForm.tsx           # Biểu mẫu ĐRL
│   ├── DRLManager.tsx        # Quản lý ĐRL
│   ├── DRLStatistics.tsx     # Thống kê ĐRL
│   ├── GPAManager.tsx        # Quản lý GPA
│   ├── ActivityManager.tsx   # Quản lý hoạt động
│   ├── GradingPeriods.tsx   # Quản lý học kỳ
│   ├── Reports.tsx          # Báo cáo
│   ├── Settings.tsx         # Cài đặt người dùng
│   └── backup/             # Backup & restore UI
│
├── 📁 services/           # Business logic & API
│   ├── firebase.ts        # Firebase integration
│   ├── storage.ts         # LocalStorage & API calls
│   └── excel.ts           # Excel processing
│
├── 📁 utils/              # Utility functions
│   └── gpaCalculator.ts   # GPA calculation logic
│
├── 📁 be/                 # Backend API + database layer
│   ├── 📄 server-mysql.ts # Express API server
│   ├── 📄 ts-register.js  # ts-node register config
│   ├── 📁 database/       # Database management scripts
│   │   ├── db.ts
│   │   ├── schema.sql
│   │   ├── migrate.ts
│   │   ├── migrate-safe.ts
│   │   ├── auto-migrate.ts
│   │   └── backup.ts
│   ├── 📁 data/uploads/   # Uploaded files
│   └── 📁 backups/        # Database backups
├── 📁 app/                # Frontend app source
│   ├── 📄 App.tsx
│   ├── 📄 index.tsx
│   ├── 📄 index.css
│   ├── 📄 types.ts
│   ├── 📄 config.json
│   ├── 📁 components/
│   ├── 📁 pages/
│   ├── 📁 services/
│   └── 📁 utils/
├── 📁 docs/              # Documentation
│
├── 📄 App.tsx            # Main app component
├── 📄 config.json        # App configuration
├── 📄 package.json       # Dependencies
├── 📄 tsconfig.json      # TypeScript config
├── 📄 vite.config.ts     # Vite config
└── 📄 tailwind.config.js # TailwindCSS config
```

## 🔌 API Endpoints

### Authentication
```
POST   /login                    # Đăng nhập
POST   /register                 # Đăng ký
GET    /status                   # Kiểm tra trạng thái server
```

### Users
```
GET    /api/users               # Danh sách người dùng
GET    /api/users/:id           # Chi tiết người dùng
POST   /api/users               # Tạo người dùng mới
PUT    /api/users/:id           # Cập nhật người dùng
DELETE /api/users/:id           # Xóa người dùng
```

### Attendance
```
GET    /api/attendance          # Danh sách điểm danh
POST   /api/attendance          # Điểm danh mới
GET    /api/attendance/class/:classId  # Điểm danh theo lớp
GET    /api/attendance/student/:studentId  # Điểm danh sinh viên
```

### Classes
```
GET    /api/classes             # Danh sách lớp
POST   /api/classes             # Tạo lớp mới
PUT    /api/classes/:id         # Cập nhật lớp
DELETE /api/classes/:id         # Xóa lớp
```

### DRL (Điểm rèn luyện)
```
GET    /api/drl                 # Danh sách ĐRL
POST   /api/drl                 # Tạo ĐRL mới
PUT    /api/drl/:id             # Cập nhật ĐRL
GET    /api/drl/statistics      # Thống kê ĐRL
```

### GPA
```
GET    /api/gpa/:studentId      # GPA sinh viên
POST   /api/gpa                 # Thêm điểm mới
GET    /api/gpa/class/:classId  # GPA cả lớp
```

### Admin
```
GET    /admin-api/logs          # Xem logs
POST   /admin-api/sql/test-connection  # Test MySQL
POST   /admin-api/sql/run-migration    # Run migration
POST   /config/update           # Cập nhật config
GET    /config                  # Lấy config
```

### Backup
```
POST   /backup/create           # Tạo backup
GET    /backup/list            # Danh sách backup
POST   /backup/restore/:filename  # Khôi phục backup
```

## 🎨 Tùy chỉnh giao diện

### Thay đổi màu sắc chủ đạo

Sửa file `tailwind.config.js`:

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6',    // Màu chính
        secondary: '#8b5cf6',  // Màu phụ
        accent: '#f59e0b',     // Màu nhấn
      }
    }
  }
}
```

### Thay đổi logo và tên website

1. Thay file logo tại `/public/logo.png`
2. Cập nhật trong Admin → Cấu hình Website
3. Hoặc sửa trực tiếp `config.json`:

```json
{
  "websiteName": "Tên trường của bạn",
  "websiteLogo": "/path-to-logo.png",
  "universityName": {
    "line1": "Dòng 1",
    "line2": "Dòng 2"
  }
}
```

## 🐛 Xử lý sự cố

### Lỗi kết nối MySQL

```bash
Error: connect ECONNREFUSED 127.0.0.1:3306
```

**Giải pháp:**
1. Kiểm tra MySQL đang chạy: `mysql -u root -p`
2. Kiểm tra port trong config
3. Kiểm tra firewall

### Lỗi Firebase Authentication

```bash
Firebase: Error (auth/invalid-api-key)
```

**Giải pháp:**
1. Kiểm tra Firebase Config trong Admin Settings
2. Đảm bảo API Key đúng
3. Kiểm tra domain được whitelist trong Firebase Console

### Lỗi port đã được sử dụng

```bash
Error: listen EADDRINUSE: address already in use :::3004
```

**Giải pháp:**
```bash
# Windows
netstat -ano | findstr :3004
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3004 | xargs kill -9
```

### Database migration thất bại

**Giải pháp:**
1. Backup database hiện tại
2. Chạy `npm run migrate:safe`
3. Kiểm tra logs tại `/logs`

## 🔒 Bảo mật

- ✅ **API Key Authentication**: Tất cả API endpoints yêu cầu API key
- ✅ **Firebase Auth**: Xác thực người dùng qua Firebase
- ✅ **Role-based Access**: Phân quyền Admin/Giảng viên/Sinh viên
- ✅ **SQL Injection Prevention**: Sử dụng prepared statements
- ✅ **XSS Protection**: Sanitize input data
- ✅ **CORS Configuration**: Whitelist domains
- ✅ **Secure Headers**: Helmet.js middleware

## 📊 Hiệu năng

- ⚡ **Build time**: ~8s (Vite)
- ⚡ **Page load**: <1s (production)
- ⚡ **API response**: <100ms (local)
- ⚡ **Database queries**: Indexed và optimized
- ⚡ **Frontend size**: ~500KB (gzipped)

## 🌐 Triển khai Production

### VPS/Server

1. **Cài đặt môi trường:**
```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MySQL
sudo apt-get install mysql-server
```

2. **Clone và build:**
```bash
git clone <your-repo>
cd kzi-attendance-app
npm install
npm run build
```

3. **Cấu hình Nginx:**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        root /path/to/app/dist;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3004;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

4. **PM2 để chạy Node.js:**
```bash
npm install -g pm2
pm2 start "node -r ./be/ts-register.js be/server-mysql.ts" --name attendance-api
pm2 startup
pm2 save
```

### Docker (Coming soon)

```dockerfile
# Dockerfile sẽ được cập nhật trong phiên bản tiếp theo
```

## 🤝 Đóng góp

Chúng tôi hoan nghênh mọi đóng góp! Vui lòng:

1. Fork repository
2. Tạo branch mới: `git checkout -b feature/AmazingFeature`
3. Commit changes: `git commit -m 'Add some AmazingFeature'`
4. Push to branch: `git push origin feature/AmazingFeature`
5. Mở Pull Request

### Quy tắc đóng góp

- Tuân thủ ESLint và TypeScript rules
- Viết tests cho features mới
- Cập nhật documentation
- Commit messages rõ ràng

## 📝 Changelog

### Version 2.0.0 (Current)
- ✨ Refactor codebase sang TypeScript
- ✨ Thêm tính năng quản lý GPA
- ✨ Cải thiện UI/UX với TailwindCSS
- ✨ Thêm chế độ bảo trì
- ✨ Backup/Restore tự động
- 🐛 Sửa lỗi điểm danh trùng lặp
- 🐛 Sửa lỗi logo không hiển thị
- ⚡ Tối ưu database queries

### Version 1.0.0
- 🎉 Phát hành phiên bản đầu tiên
- ✨ Điểm danh QR Code
- ✨ Quản lý ĐRL
- ✨ Admin dashboard

## 📄 License

MIT License - xem file [LICENSE](LICENSE) để biết thêm chi tiết.

## 💖 Credits

Phát triển bởi **Kỹ Thuật Cơ Khí - Cao Thẳng Công Nghệ Tp.HCM**

### Công nghệ sử dụng
- [React](https://reactjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/)
- [TailwindCSS](https://tailwindcss.com/)
- [Firebase](https://firebase.google.com/)
- [MySQL](https://www.mysql.com/)

## 📞 Liên hệ hỗ trợ

Nếu bạn gặp vấn đề hoặc cần hỗ trợ:

- 📱 **Zalo**: [0939042183](https://zalo.me/0939042183)
- 📘 **Facebook**: [facebook.com/kzi207](https://www.facebook.com/kzi207)
- 📧 **Email**: toi05022020@gmail.com
- ☎️ **Phone**: 0939 042 183

---

<div align="center">

**⭐ Nếu project hữu ích, đừng quên cho một star nhé! ⭐**

Made with ❤️ by KZI Team

</div>
