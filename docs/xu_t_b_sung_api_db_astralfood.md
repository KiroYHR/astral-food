# 📋 TÀI LIỆU ĐỒNG BỘ KỸ THUẬT: BỔ SUNG API CONTRACT & DATABASE (HỆ THỐNG ASTRALFOOD)

> **Người đề xuất**: Thành viên 3 (Frontend & UI/UX Lead)  
> **Người nhận**: Thành viên 1 (Cloud Architect & Backend Core Lead) & Thành viên 2 (Order Engine & Serverless Lead)  
> **Mục đích**: Đồng bộ hóa các đầu mối API và trường dữ liệu giữa **Mục 2 (Phân hệ chức năng)** và **Mục 4 (Thiết kế DB & API Contract)** trong Đề cương gốc để giao diện Frontend kết nối trơn tru $100\%$ với Backend và AWS.

---

## 🌟 1. Thống nhất Tên Thương hiệu Giao diện: **AstralFood**
* Tên hiển thị trên toàn bộ giao diện Web (Customer, Merchant, Admin), Logo và Hóa đơn PDF sẽ là **AstralFood** *(Nền tảng Đặt đồ ăn & Thương mại Điện tử Đa kênh trên AWS)*.
* Tên các tài nguyên hạ tầng bên dưới AWS (như S3 Bucket `cloudbite-frontend`, `cloudbite-media`...) của TV1 và TV2 có thể giữ nguyên theo đề cương hoặc đặt theo tiền tố `astralfood-` tùy thuận tiện, miễn là truyền đúng vào biến môi trường `.env`.

---

## 🔄 2. Năm (05) Điểm Cần Thống Nhất & Bổ Sung Giữa Frontend và Backend

Qua đối chiếu chi tiết giữa yêu cầu giao diện ở **Mục 2** và danh sách API ở **Mục 4.2**, mình (TV3) đề xuất thống nhất 5 điểm sau để tránh lệch dữ liệu khi ghép nối hệ thống:

### Điểm 1: Cơ chế Giỏ hàng (Cart) & Payload Đặt hàng (Phối hợp với **Thành viên 2**)
* **Hiện trạng trong Đề cương**: Mục 2.1 và Mục 5 có nêu chức năng *Quản lý giỏ hàng (Cart)*, nhưng Mục 4.1 chưa có bảng `carts` trong Database và Mục 4.2 chưa có API `/api/v1/cart`.
* **Giải pháp tối ưu (Không cần thêm bảng DB)**:
  * Toàn bộ thao tác Thêm/Sửa/Xóa món trong giỏ hàng sẽ được **Frontend (TV3)** quản lý trực tiếp trên trình duyệt bằng `Zustand + LocalStorage` (tốc độ phản hồi $0\text{ ms}$, giảm tải hoàn toàn các truy vấn thừa vào Amazon RDS).
  * Khi khách hàng bấm nút **"Đặt hàng (Checkout)"**, Frontend sẽ gửi toàn bộ danh sách món lên API `POST /api/v1/orders` của **TV2**.
* **Đề xuất chốt cấu trúc JSON cho `POST /api/v1/orders`**:
  ```json
  // Request Body gửi từ Frontend lên Backend (TV2)
  {
    "store_id": "uuid-cua-hang",
    "delivery_address": "268 Lý Thường Kiệt, Quận 10, TP.HCM",
    "note": "Ít cay, lấy thêm tương ớt",
    "voucher_code": "ASTRAL20",
    "items": [
      {
        "product_id": "uuid-mon-an-1",
        "quantity": 2
      },
      {
        "product_id": "uuid-mon-an-2",
        "quantity": 1
      }
    ]
  }
  ```
  *(Lưu ý bảo mật: Backend của TV2 tự truy vấn `price` từ bảng `products` để tính `unit_price` và `total_amount` chuẩn ACID, sau đó đẩy sự kiện vào **Amazon SQS**).*

---

### Điểm 2: Bổ sung API Quản lý Thực đơn & Cửa hàng cho Chủ quán (Phối hợp với **Thành viên 1**)
* **Hiện trạng trong Đề cương**: Mục 2.2 yêu cầu Chủ quán có thể *Quản lý thông tin cửa hàng, Thêm/Sửa/Xóa món ăn, cập nhật trạng thái Còn hàng/Hết hàng*, nhưng Mục 4.2 mới chỉ liệt kê `POST /api/v1/products`.
* **Đề xuất TV1 bổ sung các Endpoint CRUD chuẩn (trên các bảng đã có sẵn)**:
  1. `GET /api/v1/stores/me` *(Merchant)*: Lấy thông tin cửa hàng của chủ quán đang đăng nhập (hoặc trả về `store_id` ngay trong API `GET /api/v1/users/me`).
  2. `PUT /api/v1/stores/{id}` *(Merchant)*: Cập nhật tên quán, địa chỉ, mô tả, `logo_s3_url`.
  3. `GET /api/v1/stores/{id}/categories` & `POST /api/v1/categories` *(Merchant)*: Lấy danh sách danh mục và tạo danh mục món mới trong quán (bảng `categories` đã có sẵn trong Mục 4.1).
  4. `PATCH /api/v1/products/{id}` *(Merchant)*: Sửa thông tin món ăn hoặc gạt nút bật/tắt nhanh trạng thái Còn hàng/Hết hàng (`is_available: true/false`).
  5. `DELETE /api/v1/products/{id}` *(Merchant)*: Xóa món ăn khỏi thực đơn.

---

### Điểm 3: Bổ sung API Lấy Danh sách Đơn hàng cho Chủ quán (Phối hợp với **Thành viên 2**)
* **Hiện trạng trong Đề cương**: Mục 4.2 đã có `GET /api/v1/orders/my-orders` (dành cho Khách hàng xem lịch sử đơn) và `PATCH /api/v1/orders/{id}/status` (dành cho Chủ quán cập nhật trạng thái đơn), nhưng **thiếu API để Chủ quán lấy danh sách các đơn hàng khách đặt vào quán của mình**.
* **Đề xuất TV2 bổ sung 1 Endpoint**:
  * `GET /api/v1/stores/{id}/orders?status=PENDING` *(Merchant)*: Trả về danh sách đơn hàng của cửa hàng (kèm chi tiết `order_items` và tên/SĐT khách hàng) để hiển thị lên bảng điều phối đơn hàng của Chủ quán.

---

### Điểm 4: Đồng bộ tính năng Lọc Đánh giá (Rating) & Áp Mã giảm giá (Voucher) (Phối hợp với **TV1 & TV2**)
* **Hiện trạng trong Đề cương**: Mục 2.1 có nêu tính năng *Lọc món/cửa hàng theo đánh giá* và *Áp mã giảm giá*, nhưng 6 bảng ở Mục 4.1 chưa có cột `rating` và `discount_amount`.
* **Đề xuất 2 Phương án (Nhóm chọn 1 trong 2)**:
  * **Phương án A (Khuyên dùng - Nhẹ nhàng nhất, chỉ thêm 2 cột tùy chọn)**:
    * **TV1** thêm cột `rating` (Numeric, mặc định `4.8`) vào bảng `stores`.
    * **TV2** thêm cột `discount_amount` (Numeric, mặc định `0`) vào bảng `orders` để khi xuất hóa đơn PDF trên AWS Lambda có hiển thị số tiền được giảm.
  * **Phương án B (Không sửa Database)**: Giữ nguyên 100% các cột trong Mục 4.1. Phần điểm đánh giá và nhãn khuyến mãi sẽ được Frontend hiển thị dựa trên metadata/giả lập thông minh, còn tổng tiền sau giảm giá sẽ truyền thẳng vào `total_amount`.

---

### Điểm 5: Bổ sung API cho Phân hệ 3 - Quản trị viên Hệ thống (Phối hợp với **Thành viên 1**)
* **Hiện trạng trong Đề cương**: Mục 2.3 có mô tả **Phân hệ 3: Quản trị viên hệ thống (System Admin)** với chức năng *Quản lý danh sách người dùng và phê duyệt cửa hàng mở mới*, nhưng Mục 4.2 chưa liệt kê API cho Admin.
* **Đề xuất TV1 mở thêm 3 API đơn giản (chỉ cho phép `role == ADMIN`)**:
  1. `GET /api/v1/admin/users`: Lấy danh sách toàn bộ người dùng trong hệ thống.
  2. `GET /api/v1/admin/stores`: Lấy danh sách tất cả cửa hàng (bao gồm cả các cửa hàng mới đăng ký có `is_active = false`).
  3. `PATCH /api/v1/admin/stores/{id}/status`: Phê duyệt hoặc khóa cửa hàng (cập nhật trường `is_active: true/false` trong bảng `stores`).

---

## 📊 3. Bảng Tổng Hợp API Contract Hoàn Chỉnh (Sau Khi Đồng Bộ)

| Phân hệ | Method & Endpoint | Người phụ trách Backend | Mô tả ngắn |
| :--- | :--- | :--- | :--- |
| **Auth & User** | `POST /api/v1/auth/register` | Thành viên 1 | Đăng ký tài khoản (`CUSTOMER` / `MERCHANT`) |
| **Auth & User** | `POST /api/v1/auth/login` | Thành viên 1 | Đăng nhập nhận JWT `access_token` |
| **Auth & User** | `GET /api/v1/users/me` | Thành viên 1 | Lấy thông tin user đang đăng nhập |
| **Catalog & Store** | `GET /api/v1/stores` | Thành viên 1 | Danh sách cửa hàng (search, filter, pagination) |
| **Catalog & Store** | `GET /api/v1/stores/me` *(Mới)* | Thành viên 1 | Lấy thông tin cửa hàng của Merchant hiện tại |
| **Catalog & Store** | `GET /api/v1/stores/{id}/products` | Thành viên 1 | Xem thực đơn & danh mục của 1 cửa hàng |
| **Catalog & Store** | `POST /api/v1/categories` *(Mới)* | Thành viên 1 | Tạo danh mục món ăn mới trong cửa hàng |
| **Catalog & Store** | `POST /api/v1/products` | Thành viên 1 | Thêm món ăn mới |
| **Catalog & Store** | `PATCH /api/v1/products/{id}` *(Mới)* | Thành viên 1 | Sửa món / Bật tắt trạng thái `is_available` |
| **Catalog & Store** | `DELETE /api/v1/products/{id}` *(Mới)* | Thành viên 1 | Xóa món ăn |
| **S3 & AI Copilot** | `POST /api/v1/media/presigned-url` | Thành viên 1 | Cấp S3 Presigned URL để Frontend upload ảnh trực tiếp |
| **S3 & AI Copilot** | `POST /api/v1/ai/generate-description` | Thành viên 1 | Gọi Gemini/Bedrock sinh mô tả món ăn & SEO tags |
| **Orders & Analytics**| `POST /api/v1/orders` | Thành viên 2 | Đặt đơn hàng $\rightarrow$ Lưu RDS $\rightarrow$ Bắn message vào SQS |
| **Orders & Analytics**| `GET /api/v1/orders/my-orders` | Thành viên 2 | Khách hàng xem lịch sử & tiến trình đơn hàng |
| **Orders & Analytics**| `GET /api/v1/stores/{id}/orders` *(Mới)* | Thành viên 2 | Chủ quán xem danh sách đơn hàng khách đặt |
| **Orders & Analytics**| `PATCH /api/v1/orders/{id}/status` | Thành viên 2 | Chủ quán cập nhật trạng thái đơn $\rightarrow$ Bắn thông báo |
| **Orders & Analytics**| `GET /api/v1/stores/{id}/analytics` | Thành viên 2 | Dữ liệu biểu đồ doanh thu & top món bán chạy |
| **System Admin** | `GET /api/v1/admin/users` *(Mới)* | Thành viên 1 | Admin xem danh sách người dùng |
| **System Admin** | `GET /api/v1/admin/stores` *(Mới)* | Thành viên 1 | Admin xem danh sách cửa hàng chờ duyệt |
| **System Admin** | `PATCH /api/v1/admin/stores/{id}/status` *(Mới)*| Thành viên 1 | Admin duyệt (`is_active = true`) hoặc khóa cửa hàng |

> 💡 **Ghi chú từ Thành viên 3**: Trong thời gian chờ TV1 và TV2 hoàn thiện các API trên, mình sẽ xây dựng tầng **Hybrid API Adapter** ở Frontend (có sẵn dữ liệu giả lập đầy đủ). Ngay khi API nào của TV1 và TV2 hoàn tất, mình chỉ cần bật cờ kết nối vào Endpoint đó mà không làm chậm tiến độ chung của nhóm!