# 🚀 HƯỚNG DẪN TRIỂN KHAI AWS S3 + CLOUDFRONT CDN & KỊCH BẢN DEMO
> **Dự án**: AstralFood — Nền Tảng Đặt Đồ Ăn & Thương Mại Điện Tử Đa Kênh Trên AWS  
> **Phân hệ**: Frontend & UI/UX (Single Page Application - React 19 + TypeScript + Vite)  
> **Người thực hiện**: Thành viên 3 (Frontend & UI/UX Lead)  
> **Khu vực đám mây (AWS Region)**: `ap-southeast-1` (Singapore)  
> **Tài khoản IAM thao tác**: `dev3-frontend`

---

## 📑 MỤC LỤC
1. [Tổng Quan Kiến Trúc Triển Khai Frontend](#1-tổng-quan-kiến-trúc-triển-khai-frontend)
2. [Cấu Hình Tài Khoản IAM dev3-frontend](#2-cấu-hình-tài-khoản-iam-dev3-frontend)
3. [Phần 1: Cấu Hình Amazon S3 Static Website Hosting](#phần-1-cấu-hình-amazon-s3-static-website-hosting)
4. [Phần 2: Cấu Hình Amazon CloudFront CDN & Xử Lý Lỗi SPA 403/404](#phần-2-cấu-hình-amazon-cloudfront-cdn--xử-lý-lỗi-spa-403404)
5. [Phần 3: Hướng Dẫn Sử Dụng Script Tự Động Deploy (deploy-s3.ps1)](#phần-3-hướng-dẫn-sử-dụng-script-tự-động-deploy-deploy-s3ps1)
6. [Phần 4: Kịch Bản Thuyết Trình & Demo Trực Tiếp Trước Hội Đồng](#phần-4-kịch-bản-thuyết-trình--demo-trực-tiếp-trước-hội-đồng)

---

## 1. TỔNG QUAN KIẾN TRÚC TRIỂN KHAI FRONTEND

Ứng dụng **AstralFood Frontend** được phát triển dưới dạng **Single Page Application (SPA)** hiện đại sử dụng React 19, TypeScript, Vite và Tailwind CSS v4. Mô hình triển khai trên AWS chuẩn Serverless gồm:

```
[ Khách Hàng / Trình Duyệt ]
            │  HTTPS (Cổng 443)
            ▼
┌────────────────────────────────────────────────────────┐
│             Amazon CloudFront (Global CDN)             │
│  - Edge Locations toàn cầu (Singapore / VN PoP)       │
│  - SSL/TLS Certificate tự động (HTTPS)                 │
│  - Bộ đệm Cache Assets tĩnh (JS, CSS, Ảnh)             │
│  - Custom Error Response (403/404 -> /index.html 200)  │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│         Amazon S3 Bucket (ap-southeast-1)              │
│  - Bucket Name: astralfood-frontend                    │
│  - Static Website Hosting Enabled                      │
│  - Chứa toàn bộ bản build tĩnh (index.html, assets/)   │
└────────────────────────────────────────────────────────┘
```

**Ưu điểm vượt trội**:
- **Tốc độ tải trang cực nhanh (< 1 giây)** nhờ mạng lưới CloudFront Edge Locations lưu bộ nhớ đệm sát người dùng.
- **Chi phí cực thấp**: Không cần duy trì máy chủ EC2 hay container tốn kém cho giao diện tĩnh.
- **Độ sẵn sàng cao (High Availability)**: Đạt 99.99% uptime theo tiêu chuẩn dịch vụ của Amazon Web Services.

---

## 2. CẤU HÌNH TÀI KHOẢN IAM `dev3-frontend`

Thành viên 3 được cấp tài khoản IAM `dev3-frontend` với quyền hạn thu hẹp (Least Privilege) để quản lý S3 và CloudFront:

### 2.1. Quyền IAM Policy Đính Kèm
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "S3FrontendDeployAccess",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:ListBucket",
        "s3:DeleteObject"
      ],
      "Resource": [
        "arn:aws:s3:::astralfood-frontend",
        "arn:aws:s3:::astralfood-frontend/*"
      ]
    },
    {
      "Sid": "CloudFrontInvalidationAccess",
      "Effect": "Allow",
      "Action": [
        "cloudfront:CreateInvalidation",
        "cloudfront:GetInvalidation",
        "cloudfront:ListInvalidations"
      ],
      "Resource": "*"
    }
  ]
}
```

### 2.2. Đăng Nhập AWS CLI Trên Máy Cá Nhân
Mở PowerShell và chạy lệnh:
```bash
aws configure
```
Nhập các thông tin được cung cấp:
- **AWS Access Key ID**: `[ACCESS_KEY_CUA_DEV3]`
- **AWS Secret Access Key**: `[SECRET_KEY_CUA_DEV3]`
- **Default region name**: `ap-southeast-1`
- **Default output format**: `json`

Kiểm tra kết nối thành công:
```bash
aws sts get-caller-identity
```

---

## PHẦN 1: CẤU HÌNH AMAZON S3 STATIC WEBSITE HOSTING

### Bước 1.1: Tạo S3 Bucket Mới
1. Đăng nhập vào [AWS Management Console](https://console.aws.amazon.com/s3/).
2. Chọn Region **Asia Pacific (Singapore) `ap-southeast-1`**.
3. Bấm **Create bucket**:
   - **Bucket name**: `astralfood-frontend` *(hoặc thêm hậu tố nếu bị trùng tên toàn cầu, ví dụ `astralfood-frontend-tv3`)*.
   - **AWS Region**: `Asia Pacific (Singapore) ap-southeast-1`.
   - **Object Ownership**: Chọn **ACLs disabled (recommended)**.

### Bước 1.2: Bỏ Chặn Truy Cập Công Khai (Public Access)
1. Tại mục **Block Public Access settings for this bucket**:
   - **BỎ CHỌN** ô checkbox `Block all public access`.
   - Tích chọn ô cảnh báo: *"I acknowledge that the current settings might result in this bucket and the objects within it becoming public."*
2. Giữ nguyên các thiết lập mặc định khác và bấm **Create bucket**.

### Bước 1.3: Bật Tính Năng Static Website Hosting
1. Nhấp vào tên bucket vừa tạo (`astralfood-frontend`).
2. Chuyển sang tab **Properties**, cuộn xuống dưới cùng tìm mục **Static website hosting**.
3. Bấm **Edit**:
   - **Static website hosting**: Chọn **Enable**.
   - **Hosting type**: Chọn **Host a static website**.
   - **Index document**: Điền `index.html`.
   - **Error document**: Điền `index.html` *(để S3 trả về SPA file nếu có lỗi)*.
4. Bấm **Save changes**.
5. Ghi lại đường dẫn **Bucket website endpoint** (Ví dụ: `http://astralfood-frontend.s3-website-ap-southeast-1.amazonaws.com`).

### Bước 1.4: Thiết Lập Bucket Policy Công Khai Đọc
1. Chuyển sang tab **Permissions**, cuộn đến mục **Bucket policy** và bấm **Edit**.
2. Dán đoạn JSON chính xác sau (thay `astralfood-frontend` nếu bạn đặt tên khác):
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::astralfood-frontend/*"
    }
  ]
}
```
3. Bấm **Save changes**. Lúc này nhãn của bucket sẽ chuyển sang màu cam **Public**.

---

## PHẦN 2: CẤU HÌNH AMAZON CLOUDFRONT CDN & XỬ LÝ LỖI SPA 403/404

### Bước 2.1: Tạo Phân Phối CloudFront Mới
1. Truy cập dịch vụ **CloudFront** trên AWS Console.
2. Bấm nút **Create distribution**:
   - **Origin domain**: Chọn tên S3 bucket của bạn (ví dụ: `astralfood-frontend.s3.ap-southeast-1.amazonaws.com`) HOẶC dán S3 Website Endpoint từ Bước 1.3.
   - **Viewer protocol policy**: Chọn **Redirect HTTP to HTTPS** (đảm bảo bảo mật tuyệt đối).
   - **Allowed HTTP methods**: Chọn `GET, HEAD, OPTIONS`.
   - **Price class**: Chọn **Use only North America and Europe** hoặc **Use all edge locations** để tối ưu tốc độ tại Việt Nam.
   - **Default root object**: Điền `index.html`.
3. Bấm **Create distribution** và chờ 3-5 phút để trạng thái chuyển từ *Deploying* sang *Enabled*.

---

### 🔥 BƯỚC 2.2: CẤU HÌNH ERROR PAGES CHO SINGLE PAGE APPLICATION (REACT ROUTER)
> [!IMPORTANT]
> **Vấn đề sống còn của React Router trên Đám Mây**:
> Khi người dùng truy cập trang chủ `/`, S3 sẽ trả về `index.html`. Tuy nhiên, khi khách hàng bấm F5 hoặc truy cập trực tiếp vào các đường dẫn sâu như `/merchant`, `/admin` hoặc `/stores/store-1`:
> - S3 là Object Storage, nó sẽ tìm tệp tin có tên `merchant` hoặc `admin` trên bucket.
> - Do không tồn tại tệp vật lý đó, S3 sẽ trả về mã lỗi **`403 Forbidden`** hoặc **`404 Not Found`** dưới dạng file XML thô khiến người dùng tưởng hệ thống bị sập.
> 
> **Giải pháp chuẩn CloudFront**: Cấu hình **Custom Error Responses** để bắt lỗi 403/404 và âm thầm điều hướng về `/index.html` với mã trạng thái `200 OK` để React Router Client-side routing tiếp nhận và hiển thị đúng trang!

#### Các Bước Thực Hiện:
1. Trong màn hình CloudFront Distribution của bạn, nhấp vào tab **Error pages**.
2. Bấm nút **Create custom error response** để tạo quy tắc cho lỗi **404**:
   - **HTTP error code**: Chọn **404: Not Found**.
   - **Error caching minimum TTL (seconds)**: Điền `0` (hoặc `10`).
   - **Customize error response**: Chọn **Yes**.
   - **Response page path**: Điền chính xác `/index.html`.
   - **HTTP response code**: Chọn **200: OK**.
   - Bấm **Create custom error response**.

3. Bấm tiếp **Create custom error response** lần thứ 2 để tạo quy tắc cho lỗi **403**:
   - **HTTP error code**: Chọn **403: Forbidden**.
   - **Error caching minimum TTL (seconds)**: Điền `0` (hoặc `10`).
   - **Customize error response**: Chọn **Yes**.
   - **Response page path**: Điền chính xác `/index.html`.
   - **HTTP response code**: Chọn **200: OK**.
   - Bấm **Create custom error response**.

✅ **Kết quả**: Sau khi cấu hình xong, bạn có thể F5 thoải mái ở bất kỳ trang nào (`/checkout`, `/my-orders`, `/merchant`, `/admin`) mà vẫn giữ nguyên trạng thái ứng dụng mượt mà không bao giờ gặp lỗi S3!

---

## PHẦN 3: HƯỚNG DẪN SỬ DỤNG SCRIPT TỰ ĐỘNG DEPLOY (`deploy-s3.ps1`)

Thành viên 3 đã xây dựng sẵn script PowerShell tự động hóa 100% quy trình từ đóng gói TypeScript đến xóa bộ đệm CDN tại [frontend/scripts/deploy-s3.ps1](file:///E:/DuAnCaNhan/AstralFood/frontend/scripts/deploy-s3.ps1).

### Cách 1: Sử Dụng Script PowerShell Trực Tiếp
Mở terminal PowerShell tại thư mục dự án và chạy:
```powershell
cd E:\DuAnCaNhan\AstralFood\frontend

# Triển khai lên S3 Bucket mặc định:
.\scripts\deploy-s3.ps1 -BucketName "astralfood-frontend"

# Triển khai và tự động xóa Cache CloudFront CDN:
.\scripts\deploy-s3.ps1 -BucketName "astralfood-frontend" -DistributionId "E12345EXAMPLE"
```

### Cách 2: Chạy Qua Lệnh npm Script
Đã tích hợp sẵn vào `package.json`:
```bash
cd E:\DuAnCaNhan\AstralFood\frontend
npm run deploy:s3
```

### Quy Trình Tự Động Hóa Của Script:
1. 🔍 **Bước 1**: Kiểm tra môi trường Node.js, npm, AWS CLI và xác thực tài khoản `dev3-frontend`.
2. 🔨 **Bước 2**: Chạy lệnh `npm run build` (`tsc -b && vite build`) biên dịch mã nguồn thành thư mục tĩnh tối ưu `dist/`.
3. ☁️ **Bước 3**: Chạy lệnh `aws s3 sync dist/ s3://$BucketName --delete --region ap-southeast-1` đồng bộ dữ liệu mới nhất lên đám mây và dọn dẹp các file cũ.
4. ⚡ **Bước 4**: Tự động tạo Invalidation trên CloudFront (`/*`) để toàn bộ người dùng trên thế giới nhận ngay bản cập nhật mới nhất mà không bị vướng cache cũ.

---

## PHẦN 4: KỊCH BẢN THUYẾT TRÌNH & DEMO TRỰC TIẾP TRƯỚC HỘI ĐỒNG

Khi đứng trước Hội đồng Chấm thi, Thành viên 3 (Frontend & UI/UX Lead) thực hiện bài thuyết trình trong **5 - 7 phút** theo kịch bản mẫu sau:

---

### 🎙️ Lời Mở Đầu (30 giây)
> *"Kính thưa Thầy/Cô trong Hội đồng Chấm thi, em là Thành viên 3 phụ trách mảng Frontend, Trải nghiệm Người dùng (UI/UX) và Triển khai Hạ tầng Static Web trên Amazon S3 + CloudFront CDN cho nền tảng AstralFood. Sau đây em xin phép demo trực tiếp luồng nghiệp vụ tương tác thực tế giữa 3 phân hệ: Khách hàng, Chủ quán và Quản trị viên hệ thống."*

---

### 🌟 Màn 1: Phân Hệ Khách Hàng (Customer Portal - 2 phút)
1. **Giao diện & Thiết kế**:
   - Trình chiếu trang chủ AstralFood với bảng màu **Solar Starburst** tươi sáng, chuẩn phong cách ẩm thực hiện đại.
   - Thao tác lướt qua Hero Banner ưu đãi, chỉ vào mã giảm giá `ASTRAL20` và các Category Pills tương tác mượt mà.
2. **Chọn Quán & Tùy Biến Món**:
   - Bấm vào một cửa hàng (ví dụ: *Cơm Tấm Sài Gòn Star* hoặc *Trà Sữa Astral Tea*).
   - Chọn một món ăn ➔ Modal tùy chỉnh mở ra: Chọn số lượng món, gõ ghi chú đặc biệt cho đầu bếp (*"Ít ngọt, 50% đá"*).
   - Bấm **Thêm vào giỏ hàng** ➔ Mở **Slide-over Cart Drawer** trượt từ bên phải màn hình.
3. **Thanh Toán & Hóa Đơn Điện Tử**:
   - Nhập mã giảm giá `ASTRAL20` ➔ Thấy rõ số tiền được khấu trừ ngay lập tức.
   - Bấm **Tiến hành đặt hàng** sang trang `/checkout`. Điền địa chỉ nhận, chọn phương thức thanh toán (*VNPay-QR / MoMo*).
   - Đặt hàng thành công ➔ Chuyển sang `/my-orders`:
     - Giới thiệu **Order Status Stepper** 4 bước đang ở trạng thái *Chờ xác nhận*.
     - Bấm nút **"Xem Hóa Đơn VAT"** ➔ Mở modal hóa đơn điện tử chuẩn quy định có liên kết lưu trữ trên Amazon S3.

---

### ⚡ Chuyển Cảnh: Tính Năng Quick Demo Role Switcher (15 giây)
> *"Để thuận tiện cho việc kiểm thử và đánh giá của Hội đồng, em đã xây dựng công cụ **`🛠️ Dev Mode`** nổi ở góc màn hình, cho phép chuyển đổi vai trò ngay lập tức giữa Khách hàng, Chủ quán và Admin mà không cần đăng xuất đăng nhập thủ công."*

---

### 🏪 Màn 2: Phân Hệ Chủ Cửa Hàng (Merchant Dashboard - 2 phút)
1. Bấm vào nút Dev Mode ➔ Chọn **Chuyển sang Chủ Quán (MERCHANT)** ➔ Tự động vào `/merchant`.
2. **Báo cáo Doanh thu & Bảng Kanban**:
   - Giới thiệu biểu đồ Recharts diện tích (AreaChart) dải màu Cam San Hô và bảng xếp hạng Top 5 món bán chạy.
   - Chuyển sang tab **Điều Phối Đơn Hàng (Kanban Board)**: Chỉ vào đơn hàng của khách vừa đặt ở Màn 1 đang nằm ở cột *Chờ xác nhận*.
   - Bấm nút chuyển trạng thái sang *Đang chế biến* ➔ *Đang giao hàng*.
3. **AI Menu Copilot & AWS S3 Presigned URL**:
   - Chuyển sang tab **Quản Lý Thực Đơn**: Thao tác công tắc gạt **Còn hàng / Hết hàng** 1 chạm.
   - Bấm nút **"Thêm Món Mới Với AI"**: Gõ tên món ăn (ví dụ: *"Bánh Tráng Cuộn Bơ"*).
   - Bấm nút **"✨ Sinh mô tả bằng AI"**: Hệ thống tự động tạo đoạn mô tả hấp dẫn kèm hashtag và giá gợi ý.
   - Chọn ảnh món ăn từ máy tính: Trình diễn thanh tiến trình **Upload lên Amazon S3 qua Presigned URL** chạy từ `0% -> 100%` kèm huy hiệu xác thực đám mây.

---

### 🛡️ Màn 3: Phân Hệ Quản Trị Viên (System Admin Portal - 1.5 phút)
1. Bấm nút Dev Mode ➔ Chọn **Chuyển sang Quản Trị Viên (ADMIN)** ➔ Vào `/admin`.
2. **Sức Khỏe Hệ Thống & Quản Lý Toàn Sàn**:
   - Trình bày 4 KPI toàn sàn và bảng **System Health** giám sát thời gian thực 5 dịch vụ AWS Cloud tại Singapore (`ap-southeast-1`).
3. **Kịch Bản Phê Duyệt Quán Mới (Store Approval)**:
   - Chuyển sang tab **Phê Duyệt Cửa Hàng**: Chỉ vào badge thông báo quán đang chờ phê duyệt.
   - Thấy quán *Mì Cay Seoul 7 Cấp Độ* đang ở trạng thái `is_active: false`.
   - Bấm nút nổi bật **"✅ Phê Duyệt Mở Quán"**: Trạng thái quán lập tức chuyển sang *Đang hoạt động*.
   - Nhấn mở tab Khách hàng: Cửa hàng mới lập tức xuất hiện trên trang chủ cho khách đặt món, chứng minh tính đồng bộ dữ liệu thời gian thực.

---

### 🎯 Lời Kết (30 giây)
> *"Toàn bộ giao diện đã được kiểm thử 0 lỗi TypeScript, hỗ trợ đầy đủ bộ sơ đồ UML/ERD chuẩn Mermaid trong thư mục `/docs`, và sẵn sàng triển khai tự động lên Amazon S3 + CloudFront CDN chỉ bằng một dòng lệnh. Em xin chân thành cảm ơn Thầy/Cô đã lắng nghe và sẵn sàng trả lời các câu hỏi từ Hội đồng ạ!"*
