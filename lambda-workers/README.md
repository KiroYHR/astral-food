# AstralFood — Unified AWS Lambda Worker (TV2)

Thư mục này chứa **1 AWS Lambda Worker duy nhất (`order-processor/`)** gắn trực tiếp vào hàng đợi **Amazon SQS (`astralfood-orders-queue`)** và chạy song song 2 tác vụ bằng **`Promise.allSettled`**:

1. **Invoice Service (`invoiceService.js`):** Sinh hóa đơn PDF khổ A4 bằng `pdfkit` và lưu lên **Amazon S3** tại `invoices/INV-{orderId}.pdf` (chạy cho sự kiện `ORDER_CREATED` và khi đơn chuyển `COMPLETED`).
2. **Notification Service (`notificationService.js`):** Render email HTML cho đủ 6 trạng thái đơn hàng (kèm nút tải PDF khi `COMPLETED`, chống XSS bằng `escapeHtml`) và gửi qua **Amazon SES**.

> **Tại sao gộp thành 1 Lambda duy nhất?**  
> Một SQS Queue (`astralfood-orders-queue`) không thể fan-out cùng 1 message cho 2 Lambda riêng biệt (SQS chỉ giao mỗi message cho 1 consumer). Gộp vào `order-processor` và chạy song song qua `Promise.allSettled` đảm bảo mỗi đơn hàng đều vừa tạo hóa đơn PDF lên S3 vừa gửi email SES, không cần thêm SNS Topic hay SQS Queue thứ 2, đồng thời hỗ trợ chuẩn `ReportBatchItemFailures`.

---

## 1. Cấu trúc thư mục

```text
lambda-workers/
├── deploy-aws.ps1              # Script tự động tạo S3, verify SES, deploy Lambda & gắn SQS Trigger
├── README.md
└── order-processor/
    ├── index.js                # Lambda handler (Promise.allSettled + batchItemFailures)
    ├── normalizeOrder.js       # Chuẩn hóa payload SQS hai chiều camelCase/snake_case
    ├── invoiceService.js       # PDFKit A4 + upload S3 (invoices/INV-{orderId}.pdf)
    ├── notificationService.js  # HTML Email 6 trạng thái + gửi Amazon SES
    └── package.json
```

---

## 2. Biến môi trường AWS Lambda (`astralfood-order-processor`)

| Biến môi trường | Ví dụ | Mô tả |
| :--- | :--- | :--- |
| `INVOICE_S3_BUCKET` | `astralfood-invoices-722769295479` | Tên S3 Bucket lưu hóa đơn PDF *(thêm đuôi Account ID để tránh trùng tên toàn cầu; đồng bộ cùng biến này ở `backend/.env`)* |
| `SENDER_EMAIL` | `vuhuyduc1234dn@gmail.com` | Địa chỉ email đã xác minh (**Verified**) trên Amazon SES |
| `LOCAL_SIMULATION` | `true` *(chỉ dùng ở máy local)* | Không đặt hoặc đặt `false` khi chạy trên AWS Lambda thật |

*(Lưu ý: `AWS_REGION` được AWS Lambda tự cấp sẵn theo vùng triển khai `ap-southeast-1`, không cần khai báo thủ công trong Environment Variables của Lambda.)*

---

## 3. Hướng dẫn triển khai lên AWS (`ap-southeast-1`)

### Cách 1: Tự động bằng PowerShell + AWS CLI *(nhanh nhất)*
1. Đảm bảo đã cài AWS CLI và đăng nhập (`aws configure`, Region `ap-southeast-1`).
2. Chạy script:
   ```powershell
   cd lambda-workers
   .\deploy-aws.ps1 -SenderEmail "vuhuyduc1234dn@gmail.com"
   ```
3. Mở hộp thư của `SenderEmail` và bấm link xác minh từ **Amazon SES**.
4. Cập nhật `INVOICE_S3_BUCKET=astralfood-invoices-<account-id>` vào `.env` của Backend.

### Cách 2: Triển khai trực tiếp trên AWS Console *(không cần cài AWS CLI)*
1. **Tạo S3 Bucket hóa đơn:**
   - Vào **Amazon S3** → **Create bucket** → Region `ap-southeast-1` → đặt tên `astralfood-invoices-<account-id>` (ví dụ `astralfood-invoices-722769295479`).
   - Cập nhật lại biến `INVOICE_S3_BUCKET` tương ứng ở Backend (`.env`).
2. **Xác minh Email trên Amazon SES:**
   - Vào **Amazon SES** (`ap-southeast-1`) → **Identities** → **Create identity** → chọn **Email address** → nhập email gửi (và email khách nhận thử nghiệm nếu tài khoản đang ở chế độ SES Sandbox) → mở hộp thư bấm **Verify**.
3. **Đóng gói mã nguồn Lambda:**
   ```powershell
   cd lambda-workers\order-processor
   npm install --omit=dev
   Compress-Archive -Path index.js,normalizeOrder.js,invoiceService.js,notificationService.js,package.json,node_modules -DestinationPath ..\order-processor.zip -Force
   ```
4. **Tạo AWS Lambda Function:**
   - Vào **AWS Lambda** (`ap-southeast-1`) → **Create function** → đặt tên `astralfood-order-processor`, Runtime **Node.js 22.x**.
   - Vào tab **Code** → **Upload from .zip file** → tải lên `order-processor.zip` (Handler giữ mặc định `index.handler`).
   - Vào **Configuration → General configuration** → chỉnh **Timeout = `30 sec`**, **Memory = `256 MB`**.
   - Vào **Configuration → Environment variables** → thêm:
     - `INVOICE_S3_BUCKET` = `astralfood-invoices-<account-id>`
     - `SENDER_EMAIL` = `<email đã verify trên SES>`
   - Vào **Configuration → Permissions** → bấm vào Execution Role → cấp thêm 3 quyền:
     - `s3:PutObject` cho `arn:aws:s3:::astralfood-invoices-<account-id>/invoices/*`
     - `ses:SendEmail`
     - `sqs:ReceiveMessage`, `sqs:DeleteMessage`, `sqs:GetQueueAttributes` cho `astralfood-orders-queue`
5. **Gắn Trigger SQS:**
   - Trong trang Lambda `astralfood-order-processor` → **Add trigger** → chọn **SQS** → chọn queue **`astralfood-orders-queue`**.
   - Tích chọn **Report batch item failures** → bấm **Add**.
