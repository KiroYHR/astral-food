# 🗂️ HƯỚNG DẪN TẠO GIT REPOSITORY & CẤU TRÚC THƯ MỤC DỰ ÁN ASTRALFOOD

Tài liệu này hướng dẫn chi tiết cách tổ chức cây thư mục Git chuẩn theo mô hình **Monorepo** trong đề cương của nhóm, đảm bảo 3 thành viên làm việc độc lập không bị xung đột code (merge conflict) và tuân thủ tuyệt đối quy tắc bảo mật AWS.

---

## 1. Cấu trúc Thư mục Tổng thể (Monorepo Structure)

Tên Repository trên GitHub đề xuất: **`astralfood-aws-platform`** (hoặc **`astralfood-cloudbite`**).

```text
astralfood-aws-platform/
├── .github/
│   └── workflows/                 # CI/CD GitHub Actions (TV1 cấu hình ở Giai đoạn 4)
│       ├── deploy-backend.yml
│       └── deploy-frontend-s3.yml
│
├── backend/                       # [Khu vực của TV1 & TV2] - Core API (FastAPI / Node.js)
│   ├── src/
│   ├── Dockerfile
│   └── .env.example
│
├── lambda-workers/                # [Khu vực của TV2] - Serverless Functions (SQS Trigger)
│   ├── invoice-generator/         # Hàm tạo hóa đơn PDF & lưu lên S3
│   └── notification-sender/       # Hàm gửi Email SES / Telegram
│
├── docs/                          # [Khu vực của TV3 chủ trì] - Tài liệu & Sơ đồ báo cáo
│   ├── uml/                       # Sơ đồ Use Case, Activity, Sequence, ERD (Mermaid/Draw.io)
│   ├── architecture/              # Sơ đồ kiến trúc AWS Cloud
│   └── DE_XUAT_BO_SUNG_API_DB_ASTRALFOOD.md
│
├── frontend/                      # ⭐ [KHU VỰC CHÍNH CỦA BẠN - THÀNH VIÊN 3] ⭐
│   ├── public/
│   │   └── favicon.svg
│   ├── src/
│   │   ├── api/                   # Tầng kết nối Backend & AWS S3
│   │   │   ├── axiosClient.ts     # Cấu hình Axios, tự động đính kèm JWT Token
│   │   │   ├── mockStorage.ts     # Stateful Mock DB trên LocalStorage (chạy mượt khi chưa có Backend)
│   │   │   ├── authService.ts     # API Đăng nhập, Đăng ký, Lấy thông tin user
│   │   │   ├── storeService.ts    # API Cửa hàng, Món ăn, S3 Presigned URL, AI Copilot
│   │   │   ├── orderService.ts    # API Đặt hàng, Theo dõi đơn, Thống kê doanh thu
│   │   │   └── adminService.ts    # API Phê duyệt cửa hàng & Quản lý user
│   │   │
│   │   ├── assets/                # Hình ảnh minh họa, banner thương hiệu AstralFood
│   │   │
│   │   ├── components/            # Các thành phần giao diện tái sử dụng
│   │   │   ├── common/            # Button, Badge, Modal, Skeleton, EmptyState, RoleSwitcher
│   │   │   ├── customer/          # StoreCard, ProductCard, CartDrawer, OrderStatusStepper
│   │   │   └── merchant/          # S3ImageUploader, AICopilotModal, RevenueChart, OrderKanban
│   │   │
│   │   ├── layouts/               # Khung bố cục cho 3 phân hệ
│   │   │   ├── CustomerLayout.tsx # Giao diện tươi sáng (Navbar, Cart Drawer, Footer)
│   │   │   ├── MerchantLayout.tsx # Giao diện quản trị cửa hàng (Sidebar, Header thông báo)
│   │   │   └── AdminLayout.tsx    # Giao diện quản trị hệ thống
│   │   │
│   │   ├── pages/                 # Các trang màn hình chính
│   │   │   ├── auth/              # LoginPage.tsx, RegisterPage.tsx
│   │   │   ├── customer/          # HomePage.tsx, StoreDetailPage.tsx, CheckoutPage.tsx, MyOrdersPage.tsx
│   │   │   ├── merchant/          # DashboardPage.tsx, MenuManagerPage.tsx, StoreOrdersPage.tsx, StoreSettingsPage.tsx
│   │   │   └── admin/             # AdminDashboardPage.tsx
│   │   │
│   │   ├── store/                 # Quản lý State toàn cục (Zustand)
│   │   │   ├── useAuthStore.ts    # Lưu thông tin User, Role, JWT Token
│   │   │   └── useCartStore.ts    # Lưu giỏ hàng, tính tổng tiền, áp voucher
│   │   │
│   │   ├── types/                 # Định nghĩa kiểu dữ liệu TypeScript
│   │   │   └── index.ts           # Khớp 100% với 6 bảng RDS PostgreSQL & API Contract
│   │   │
│   │   ├── utils/                 # Hàm tiện ích (formatVND, formatDate, cn...)
│   │   ├── App.tsx                # Cấu hình React Router v6 & Protected Routes
│   │   ├── main.tsx
│   │   └── index.css              # Cấu hình Tailwind CSS & bộ màu AstralFood
│   │
│   ├── .env.example               # Mẫu biến môi trường (VITE_API_BASE_URL, VITE_USE_MOCK...)
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── .gitignore                     # Chặn tuyệt đối file .env và khóa bảo mật AWS
└── README.md                      # Giới thiệu tổng quan dự án AstralFood
```

---

## 2. Nội dung bắt buộc của file `.gitignore` (Bảo vệ 200 USD AWS Credit)

Theo **Mục 7.2 (Quy tắc an toàn số 2)** trong đề cương, tuyệt đối không để lộ `AWS_ACCESS_KEY_ID` hoặc file `.env` lên GitHub. Bạn hãy đặt file `.gitignore` này ngay ở thư mục gốc của dự án:

```gitignore
# Bảo mật Biến môi trường & Khóa AWS (TUYỆT ĐỐI KHÔNG XÓA)
.env
.env.*
!.env.example
*.pem
*.key
.aws/
credentials

# Thư mục cài đặt & đóng gói Frontend (TV3)
node_modules/
frontend/node_modules/
dist/
frontend/dist/
build/
.vite/

# Thư mục cài đặt Backend & Lambda (TV1 & TV2)
__pycache__/
*.py[cod]
venv/
.venv/
env/
*.sqlite3
*.db

# Hệ điều hành & IDE
.DS_Store
Thumbs.db
.vscode/
.idea/
*.log
```

---

## 3. Các lệnh Terminal để khởi tạo Git Repository từ đầu

Nếu bạn là người khởi tạo Repo trước trên máy tính (hoặc trong Terminal của **Antigravity**), hãy chạy lần lượt các lệnh sau:

```bash
# Bước 1: Tạo thư mục gốc và cấu trúc 4 thư mục con của Monorepo
mkdir astralfood-aws-platform
cd astralfood-aws-platform
mkdir backend lambda-workers docs frontend

# Bước 2: Tạo file giữ chỗ cho các thư mục của TV1 và TV2 để Git nhận diện
touch backend/.gitkeep lambda-workers/.gitkeep docs/.gitkeep

# Bước 3: Khởi tạo Git và tạo nhánh chính (main) + nhánh phát triển (develop)
git init
git branch -M main

# Bước 4: (Sau khi đã tạo file .gitignore và README.md) Commit lần đầu
git add .
git commit -m "chore: init AstralFood monorepo structure"

# Bước 5: Kết nối với GitHub Repo của bạn và đẩy lên
git remote add origin https://github.com/<ten-tai-khoan-cua-ban>/astralfood-aws-platform.git
git push -u origin main

# Bước 6: Tạo nhánh làm việc riêng cho Thành viên 3
git checkout -b feat/tv3-frontend
```

### Quy tắc làm việc nhóm trên Git (Không bao giờ đụng code nhau):
* **Thành viên 1** làm việc trên nhánh `feat/tv1-backend-core` (chỉ sửa trong `/backend`).
* **Thành viên 2** làm việc trên nhánh `feat/tv2-orders-serverless` (chỉ sửa trong `/backend` và `/lambda-workers`).
* **Thành viên 3 (Bạn)** làm việc trên nhánh `feat/tv3-frontend` (chỉ sửa trong `/frontend` và `/docs`).

---

## 4. Câu lệnh (Prompt) Khởi tạo Phase 1 trên Antigravity (Gemini Flash 3.8)

Sau khi đã mở thư mục dự án trong **Antigravity**, bạn hãy copy nguyên văn đoạn Prompt dưới đây gửi cho **Gemini Flash 3.8** để bắt đầu **Phase 1**:

> **Prompt gửi Gemini Flash 3.8 trong Antigravity:**
> "Chúng ta đang xây dựng phân hệ Frontend (`/frontend`) cho dự án **AstralFood** — Nền tảng đặt đồ ăn & thương mại điện tử đa kênh trên AWS. 
> Hãy thực hiện **Phase 1: Khởi tạo khung dự án, Design System tươi sáng và Kiến trúc Hybrid API**:
> 1. Khởi tạo dự án Vite + React + TypeScript + Tailwind CSS bên trong thư mục `/frontend` và cài đặt các thư viện: `lucide-react`, `zustand`, `axios`, `react-router-dom`, `recharts`, `clsx`, `tailwind-merge`.
> 2. Thiết lập bảng màu thương hiệu **AstralFood** tươi sáng, kích thích vị giác trong Tailwind: màu chủ đạo Cam San Hô (`#FF5A1F`), màu nhấn Vàng Nắng (`#F59E0B`), Xanh Bạc Hà (`#10B981`), nền Trắng Kem ấm (`#FFFDF9`).
> 3. Tạo file `src/types/index.ts` định nghĩa đầy đủ các Interface khớp 100% với 6 bảng Database: `User` (`CUSTOMER`, `MERCHANT`, `ADMIN`), `Store`, `Category`, `Product`, `Order` (`PENDING`, `CONFIRMED`, `PREPARING`, `DELIVERING`, `COMPLETED`, `CANCELLED`), `OrderItem` và `StoreAnalytics`.
> 4. Tạo tầng `src/api/mockStorage.ts` lưu trữ dữ liệu mẫu phong phú (nhiều cửa hàng, món ăn có hình ảnh ẩm thực chất lượng cao từ Unsplash, đơn hàng mẫu, thống kê doanh thu mẫu) vào `localStorage` để mọi thao tác Thêm/Sửa/Xóa món ăn, Đặt hàng, Duyệt đơn đều lưu trạng thái thật trên trình duyệt khi `VITE_USE_MOCK=true`."