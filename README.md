Tên dự án: AstralFood — Nền tảng Đặt đồ ăn & Thương mại Điện tử Đa kênh trên AWS.

Kiến trúc: Cloud-Native Microservices & Event-Driven Serverless trên AWS (Region: ap-southeast-1 Singapore).

Cấu trúc thư mục Monorepo:

/frontend: Giao diện Web (Customer Portal, Merchant Dashboard, System Admin) dùng React + Vite + Tailwind CSS, triển khai trên Amazon S3 + CloudFront CDN (Thành viên 3).

/backend: Core RESTful API kết nối Amazon RDS PostgreSQL, S3 Presigned URL & AI Copilot (Thành viên 1 & 2).

/lambda-workers: AWS Lambda xử lý bất đồng bộ từ Amazon SQS / EventBridge, xuất hóa đơn PDF và gửi thông báo qua Amazon SES / SNS (Thành viên 2).

/docs: Tài liệu thiết kế hệ thống, sơ đồ kiến trúc AWS, UML và tài liệu đồng bộ API/DB (DE_XUAT_BO_SUNG_API_DB_ASTRALFOOD.md, HUONG_DAN_CAU_TRUC_GIT_ASTRALFOOD.md).

Quy tắc an toàn nhóm: Không dùng tài khoản Root, không đẩy file .env lên GitHub, thống nhất vùng ap-southeast-1 và chỉ dùng gói Free Tier.