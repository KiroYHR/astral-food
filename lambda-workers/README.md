# AstralFood — AWS Lambda Serverless Workers (TV2)

Thư mục này chứa 2 AWS Lambda Workers xử lý bất đồng bộ sự kiện đơn hàng (`ORDER_CREATED`, `ORDER_STATUS_UPDATED`) từ **Amazon SQS**.

## 1. Danh sách Workers

| Worker | Thư mục | Dịch vụ AWS | Chức năng |
| :--- | :--- | :--- | :--- |
| **Invoice Generator** | `invoice-generator/` | SQS → Lambda → S3 | Sinh hóa đơn PDF kích thước A4 bằng `pdfkit` và lưu lên S3 tại `invoices/INV-{orderId}.pdf`. |
| **Notification Sender** | `notification-sender/` | SQS → Lambda → SES | Render email HTML theo trạng thái đơn hàng (kèm nút tải PDF khi `COMPLETED`) và gửi qua Amazon SES. |

## 2. Biến môi trường triển khai AWS Lambda

### `invoice-generator`
- `AWS_REGION`: mặc định `ap-southeast-1`
- `INVOICE_S3_BUCKET`: tên S3 bucket lưu hóa đơn (mặc định `astralfood-invoices`)
- `LOCAL_SIMULATION`: đặt `true` khi chạy mô phỏng cục bộ không gọi S3 thật

**IAM Execution Role tối thiểu:** `s3:PutObject` trên `arn:aws:s3:::<INVOICE_S3_BUCKET>/invoices/*` và quyền đọc SQS (`sqs:ReceiveMessage`, `sqs:DeleteMessage`, `sqs:GetQueueAttributes`).

### `notification-sender`
- `AWS_REGION`: mặc định `ap-southeast-1`
- `SENDER_EMAIL`: địa chỉ email đã xác minh trong Amazon SES (mặc định `no-reply@astralfood.vn`)
- `LOCAL_SIMULATION`: đặt `true` khi chạy mô phỏng cục bộ không gọi SES thật

**IAM Execution Role tối thiểu:** `ses:SendEmail` và quyền đọc SQS (`sqs:ReceiveMessage`, `sqs:DeleteMessage`, `sqs:GetQueueAttributes`).

## 3. Lưu ý cấu hình SQS Trigger
- Bật **Report batch item failures** trên SQS Event Source Mapping cho cả 2 Lambda (cả hai handler đều trả về `batchItemFailures` cho các message xử lý lỗi).
- Cấu hình **Dead-Letter Queue (DLQ)** cho SQS queue chính để không mất đơn khi S3/SES gặp sự cố tạm thời.
