# 📢 BÁO CÁO TIẾN ĐỘ & TỔNG KẾT HẠ TẦNG BACKEND (THÀNH VIÊN 1)
> **Dự án**: AstralFood — Omnichannel Cloud Platform on AWS  
> **Người lập**: Thành viên 1 (Cloud Architect & Backend Core Lead — Trần Lê Gia Huy / HG2505)  
> **Người nhận**: Thành viên 2 (Serverless & Order Lead) & Thành viên 3 (Frontend & UI/UX Lead)  
> **Ngày cập nhật**: 27/10/2026  

---

## 📌 1. QUY ƯỚC NHÁNH & QUẢN TRỊ MÃ NGUỒN GIT

* **GitHub Repository chính thức**: [https://github.com/KiroYHR/astral-food](https://github.com/KiroYHR/astral-food)
* **Cấu trúc nhánh phân chia công việc**:
  * `main`: Nhánh gốc tích hợp của nhóm.
  * `feat/tv3-frontend`: Nhánh phát triển giao diện của **Thành viên 3**.
  * `feat/tv1-backend-core`: Nhánh Backend Core của **Thành viên 1** *(Đã hoàn thiện $100\%$ và đẩy toàn bộ mã nguồn lên remote)*.
* **Quy chuẩn bảo mật AWS**: File `.gitignore` đã chặn toàn bộ file bí mật `.env`, thư mục `node_modules/` và `dist/`, tuyệt đối không làm lộ Access Key lên GitHub.

---

## 🛡️ 2. HẠ TẦNG BẢO MẬT AWS IAM CHO CẢ NHÓM

Hệ thống được thiết lập theo nguyên tắc **Quyền tối thiểu (Least Privilege)** để bảo vệ an toàn gói **$200 USD Credit** và tránh phát sinh chi phí ngoài ý muốn:

* **Đường link đăng nhập AWS Management Console chung cho nhóm**:  
  👉 **`https://hg2505.signin.aws.amazon.com/console`**  
  *(Đã có sẵn Account Alias `hg2505`, thành viên chỉ việc điền Username và Mật khẩu, không cần gõ 12 số Account ID)*.

* **Phân quyền 2 IAM Group chuyên biệt**:
  1. **`AstralFood-Frontend-Group` (Dành cho TV3)**:
     * **Chính sách cấp quyền**: `AmazonS3FullAccess`, `CloudFrontFullAccess`, `IAMUserChangePassword`.
     * **Mục đích**: Đủ quyền tải bản build React lên S3 Static Hosting và cấu hình phân phối CDN CloudFront kèm HTTPS.
  2. **`AstralFood-Serverless-Group` (Dành cho TV2)**:
     * **Chính sách cấp quyền**: `AmazonSQSFullAccess`, `AWSLambda_FullAccess`, `CloudWatchLogsFullAccess`, `IAMUserChangePassword`.
     * **Mục đích**: Đủ quyền tạo và kiểm thử Lambda Worker, cấu hình hàng đợi SQS và xem log lỗi trên CloudWatch.

> 🔑 **Lưu ý**: TV2 và TV3 đăng nhập lần đầu bằng mật khẩu tạm sẽ được AWS yêu cầu bắt buộc đổi sang mật khẩu riêng.

---

## 🗄️ 3. THIẾT KẾ CƠ SỞ DỮ LIỆU (POSTGRESQL + PRISMA ORM)

* **Vị trí file cấu hình**: `backend/prisma/schema.prisma`
* **Mô hình 7 bảng chuẩn quan hệ (ACID)**:
  1. `users`: Quản lý người dùng, phân quyền Role (`CUSTOMER`, `MERCHANT`, `ADMIN`), mã hóa mật khẩu bcrypt.
  2. `stores`: Cửa hàng, địa chỉ, logo S3, **đã bổ sung trường `rating: 4.8`** *(khớp theo đề xuất của TV3)*.
  3. `categories`: Quản lý danh mục món ăn theo từng cửa hàng.
  4. `products`: Món ăn, giá bán, ảnh S3, cờ `is_available` (còn hàng/hết hàng).
  5. `orders`: Đơn hàng, **đã bổ sung trường `discount_amount: 0`** *(khớp theo đề xuất của TV3)*, quản lý trạng thái (`PENDING` $\rightarrow$ `COMPLETED`).
  6. `order_items`: Chi tiết số lượng và đơn giá từng món trong đơn.
  7. `reviews`: Đánh giá và nhận xét của khách hàng.
* **Môi trường Test Local**: Có sẵn file `docker-compose.yml` ở thư mục gốc. Cả nhóm chỉ cần chạy `docker compose up -d` là có ngay PostgreSQL cục bộ để lập trình và kiểm thử.

---

## 🚀 4. DANH MỤC 20/20 BACKEND CORE API ĐÃ HOÀN TẤT

Toàn bộ mã nguồn viết bằng **Node.js + Express + TypeScript** trên nhánh `feat/tv1-backend-core` đã được kiểm tra và biên dịch sạch sẽ (`tsc` thành công 100%):

| Phân hệ | Phương thức & Endpoint | Người phụ trách | Mô tả chức năng |
| :--- | :--- | :--- | :--- |
| **Auth & User** | `POST /api/v1/auth/register` | TV1 | Đăng ký tài khoản (`CUSTOMER` / `MERCHANT`) |
| **Auth & User** | `POST /api/v1/auth/login` | TV1 | Đăng nhập nhận JWT `access_token` |
| **Auth & User** | `GET /api/v1/users/me` *(alias `/auth/me`)* | TV1 | Lấy thông tin user đăng nhập & thông tin quán |
| **Stores & Catalog** | `GET /api/v1/stores` | TV1 | Danh sách cửa hàng (hỗ trợ search, filter) |
| **Stores & Catalog** | `GET /api/v1/stores/me` | TV1 | Lấy thông tin cửa hàng của Merchant hiện tại |
| **Stores & Catalog** | `POST /api/v1/stores` | TV1 | Tạo cửa hàng mới |
| **Stores & Catalog** | `PUT /api/v1/stores/:id` | TV1 | Cập nhật thông tin quán |
| **Stores & Catalog** | `GET /api/v1/stores/:id/categories` | TV1 | Danh sách danh mục món của quán |
| **Stores & Catalog** | `POST /api/v1/categories` *(alias `/:id/categories`)* | TV1 | Tạo danh mục món ăn mới |
| **Stores & Catalog** | `GET /api/v1/stores/:id/products` | TV1 | Danh sách món ăn trong thực đơn quán |
| **Stores & Catalog** | `POST /api/v1/stores/products` | TV1 | Thêm món ăn mới |
| **Stores & Catalog** | `PATCH /api/v1/stores/products/:id` | TV1 | Cập nhật món / Bật tắt Còn hàng - Hết hàng |
| **Stores & Catalog** | `DELETE /api/v1/stores/products/:id` | TV1 | Xóa món ăn khỏi thực đơn |
| **AWS Media & AI** | `POST /api/v1/media/presigned-url` | TV1 | Cấp Presigned URL để Frontend upload ảnh thẳng lên S3 |
| **AWS Media & AI** | `POST /api/v1/ai/generate-description` | TV1 | Tích hợp Google Gemini AI sinh mô tả món ăn tự động |
| **Orders & SQS** | `POST /api/v1/orders` | TV1 / TV2 | Nhận đơn hàng, tính tiền từ DB, lưu PostgreSQL và **đẩy event vào Amazon SQS** |
| **Orders & SQS** | `GET /api/v1/orders/my-orders` | TV1 / TV2 | Khách hàng xem lịch sử & tiến trình đơn hàng |
| **Orders & SQS** | `GET /api/v1/orders/stores/:id/orders` | TV1 / TV2 | Chủ quán xem danh sách đơn khách đặt vào quán |
| **Orders & SQS** | `PATCH /api/v1/orders/:id/status` | TV1 / TV2 | Cập nhật trạng thái đơn hàng (`PREPARING`, `COMPLETED`...) |
| **Orders & SQS** | `GET /api/v1/orders/stores/:id/analytics` | TV1 / TV2 | Biểu đồ doanh thu quán & top món bán chạy |
| **Admin Portal** | `GET /api/v1/admin/users` | TV1 | Admin xem danh sách tất cả người dùng |
| **Admin Portal** | `GET /api/v1/admin/stores` | TV1 | Admin xem danh sách cửa hàng |
| **Admin Portal** | `PATCH /api/v1/admin/stores/:id/status` | TV1 | Admin phê duyệt (`is_active: true`) hoặc khóa quán |

---

## 🎯 5. BƯỚC TIẾP THEO CHO TỪNG THÀNH VIÊN

### 🔹 Thành viên 1 (Gia Huy):
* Khởi tạo **Amazon RDS PostgreSQL** (Free Tier `db.t4g.micro`) và **Amazon S3 Media Bucket** trên Region Singapore (`ap-southeast-1`).
* Cập nhật thông số kết nối vào `.env` của nhóm và sẵn sàng hỗ trợ tích hợp API.

### 🔹 Thành viên 3 (Frontend Lead):
* Toàn bộ 20/20 API đã sẵn sàng trên nhánh `feat/tv1-backend-core`. TV3 có thể tiến hành tạo Pull Request merge vào `main` hoặc checkout nhánh để kết nối giao diện.
* Đã có tài khoản IAM User sẵn sàng để chuẩn bị deploy Web lên S3 + CloudFront.

### 🔹 Thành viên 2 (Serverless & SQS Lead):
* API Đặt hàng (`POST /orders`) đã có sẵn tầng `sqsService.ts` bắn message sự kiện vào hàng đợi.
* TV2 có thể bắt đầu làm việc trong thư mục `lambda-workers/` để viết hàm xử lý ngầm (tiêu thụ event từ SQS, xuất hóa đơn PDF lưu lên S3 và gửi email xác nhận).
