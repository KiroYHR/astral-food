# 📐 BỘ SƠ ĐỒ UML & THIẾT KẾ KIẾN TRÚC HỆ THỐNG ASTRALFOOD
> **Dự án**: Nền Tảng Thương Mại Điện Tử Ẩm Thực Đa Kênh Tích Hợp AI & Hạ Tầng Đám Mây AWS  
> **Tài liệu phục vụ**: Báo cáo Đồ án Chuyên ngành / Khóa luận Tốt nghiệp & Bảo vệ trước Hội đồng

---

## 📌 MỤC LỤC TÀI LIỆU
1. [Sơ đồ Use Case Tổng thể (Use Case Diagram)](#1-sơ-đồ-use-case-tổng-thể-use-case-diagram)
2. [Sơ đồ Thực thể Liên kết (Entity Relationship Diagram - ERD)](#2-sơ-đồ-thực-thể-liên-kết-erd---entity-relationship-diagram)
3. [Sơ đồ Hoạt động Đặt hàng & Xử lý Bất đồng bộ (Activity Diagram)](#3-sơ-đồ-hoạt-động-đặt-hàng--xử-lý-bất-đồng-bộ-activity-diagram)
4. [Sơ đồ Tuần tự 1: Trợ lý AI Menu Copilot & Tải ảnh Amazon S3 Presigned URL (Sequence Diagram)](#4-sơ-đồ-tuần-tự-1-trợ-lý-ai-menu-copilot--tải-ảnh-amazon-s3-presigned-url)
5. [Sơ đồ Tuần tự 2: Luồng Đặt hàng & Xử lý Hóa đơn Điện tử Serverless (Sequence Diagram)](#5-sơ-đồ-tuần-tự-2-luồng-đặt-hàng--xử-lý-hóa-đơn-serverless-sqs--lambda)
6. [Sơ đồ Kiến trúc Hạ tầng Đám mây AWS Tổng thể (AWS Cloud Architecture)](#6-sơ-đồ-kiến-trúc-hạ-tầng-đám-mây-aws-tổng-thể)

---

## 1. Sơ đồ Use Case Tổng thể (Use Case Diagram)
Sơ đồ mô tả tương tác của 3 tác nhân chính trong hệ sinh thái AstralFood: **Khách hàng (Customer)**, **Chủ cửa hàng (Merchant)** và **Quản trị viên hệ thống (System Admin)**.

```mermaid
graph LR
    %% Actors
    Customer(["👤 Khách Hàng (Customer)"])
    Merchant(["🏪 Chủ Quán (Merchant)"])
    Admin(["🛡️ Quản Trị Viên (Admin)"])

    %% Subsystem: Customer Portal
    subgraph "Phân Hệ Khách Hàng (Customer Portal)"
        UC_C1("Đăng ký / Đăng nhập tài khoản")
        UC_C2("Tìm kiếm & Lọc quán theo danh mục")
        UC_C3("Xem thực đơn & Chi tiết món ăn")
        UC_C4("Quản lý giỏ hàng & Áp mã Voucher")
        UC_C5("Thực hiện Đặt hàng (Checkout)")
        UC_C6("Theo dõi tiến trình đơn hàng (Real-time)")
        UC_C7("Tra cứu & In Hóa đơn điện tử VAT S3")
    end

    %% Subsystem: Merchant Hub
    subgraph "Phân Hệ Chủ Quán (Merchant Hub)"
        UC_M1("Đăng ký gian hàng (Chờ duyệt)")
        UC_M2("Quản lý hồ sơ & Bật/tắt mở quán")
        UC_M3("Quản lý danh mục & Thực đơn món ăn")
        UC_M4("Công tắc Còn hàng / Hết hàng 1 chạm")
        UC_M5("AI Menu Copilot sinh mô tả & Tags SEO")
        UC_M6("Upload ảnh món ăn lên Amazon S3 Presigned URL")
        UC_M7("Điều phối đơn hàng trực tiếp (Kanban)")
        UC_M8("Xem biểu đồ doanh thu Recharts (Area/Bar)")
    end

    %% Subsystem: System Admin Portal
    subgraph "Phân Hệ Quản Trị Hệ Thống (Admin Portal)"
        UC_A1("Đăng nhập bảng điều khiển Admin Hub")
        UC_A2("Giám sát GMV & Sức khỏe dịch vụ AWS")
        UC_A3("Thẩm định & Phê duyệt mở quán mới")
        UC_A4("Tạm khóa / Ngưng hoạt động cửa hàng")
        UC_A5("Quản lý tài khoản & Phân quyền User")
        UC_A6("Giám sát & Tra cứu toàn bộ đơn hàng sàn")
    end

    %% Customer Connections
    Customer --- UC_C1
    Customer --- UC_C2
    Customer --- UC_C3
    Customer --- UC_C4
    Customer --- UC_C5
    Customer --- UC_C6
    Customer --- UC_C7

    %% Merchant Connections
    Merchant --- UC_C1
    Merchant --- UC_M1
    Merchant --- UC_M2
    Merchant --- UC_M3
    Merchant --- UC_M4
    Merchant --- UC_M5
    Merchant --- UC_M6
    Merchant --- UC_M7
    Merchant --- UC_M8

    %% Admin Connections
    Admin --- UC_A1
    Admin --- UC_A2
    Admin --- UC_A3
    Admin --- UC_A4
    Admin --- UC_A5
    Admin --- UC_A6
```

---

## 2. Sơ đồ Thực thể Liên kết (ERD - Entity Relationship Diagram)
Cấu trúc cơ sở dữ liệu quan hệ gồm 6 bảng chuẩn hóa lưu trữ trên **Amazon RDS PostgreSQL**:

```mermaid
erDiagram
    users ||--o{ stores : "sở hữu (owns)"
    users ||--o{ orders : "đặt hàng (places)"
    stores ||--o{ categories : "phân loại (has)"
    stores ||--o{ products : "chứa món (contains)"
    stores ||--o{ orders : "tiếp nhận (receives)"
    categories ||--o{ products : "nhóm món (groups)"
    orders ||--o{ order_items : "bao gồm (includes)"
    products ||--o{ order_items : "tham chiếu (referenced)"

    users {
        VARCHAR id PK "Khóa chính (UUID/CUID)"
        VARCHAR email UK "Email đăng nhập duy nhất"
        VARCHAR password_hash "Mật khẩu mã hóa Argon2/BCrypt"
        VARCHAR full_name "Họ và tên người dùng"
        VARCHAR phone "Số điện thoại liên hệ"
        VARCHAR role "CUSTOMER | MERCHANT | ADMIN"
        TIMESTAMP created_at "Thời gian tạo tài khoản"
    }

    stores {
        VARCHAR id PK "Khóa chính cửa hàng"
        VARCHAR owner_id FK "Mã người dùng sở hữu (users.id)"
        VARCHAR name "Tên nhà hàng / quán ăn"
        TEXT description "Giới thiệu / Slogan quán"
        VARCHAR address "Địa chỉ quán ăn"
        VARCHAR logo_s3_url "Đường dẫn ảnh logo lưu Amazon S3"
        BOOLEAN is_active "Trạng thái: Đang hoạt động / Chờ duyệt"
        NUMERIC rating "Điểm đánh giá trung bình (1.0 - 5.0)"
        VARCHAR delivery_time "Thời gian chuẩn bị dự kiến"
        VARCHAR category_tag "Thẻ thể loại ẩm thực"
        TIMESTAMP created_at "Thời điểm đăng ký quán"
    }

    categories {
        VARCHAR id PK "Khóa chính danh mục"
        VARCHAR store_id FK "Mã cửa hàng sở hữu (stores.id)"
        VARCHAR name "Tên danh mục món ăn"
        INT display_order "Thứ tự sắp xếp hiển thị"
    }

    products {
        VARCHAR id PK "Khóa chính món ăn"
        VARCHAR store_id FK "Mã cửa hàng (stores.id)"
        VARCHAR category_id FK "Mã danh mục (categories.id)"
        VARCHAR name "Tên món ăn"
        TEXT description "Mô tả hương vị ẩm thực chuẩn SEO"
        NUMERIC price "Giá bán niêm yết (VNĐ)"
        VARCHAR image_s3_url "Ảnh món ăn tải lên S3 Bucket"
        BOOLEAN is_available "Còn hàng (true) / Hết hàng (false)"
        VARCHAR[] tags "Mảng tags do AI Copilot gợi ý"
        TIMESTAMP created_at "Thời gian thêm món"
    }

    orders {
        VARCHAR id PK "Khóa chính đơn hàng"
        VARCHAR customer_id FK "Mã khách hàng đặt (users.id)"
        VARCHAR store_id FK "Mã cửa hàng tiếp nhận (stores.id)"
        NUMERIC total_amount "Tổng thanh toán sau voucher (VNĐ)"
        NUMERIC discount_amount "Số tiền giảm giá khuyến mãi"
        VARCHAR voucher_code "Mã giảm giá áp dụng (nếu có)"
        VARCHAR status "PENDING | PREPARING | DELIVERING | COMPLETED | CANCELLED"
        VARCHAR delivery_address "Địa chỉ giao hàng nhận món"
        TEXT note "Ghi chú khẩu vị khách hàng"
        VARCHAR invoice_s3_url "Đường dẫn file hóa đơn PDF trên S3"
        TIMESTAMP created_at "Thời điểm đặt hàng"
    }

    order_items {
        VARCHAR id PK "Khóa chính chi tiết đơn"
        VARCHAR order_id FK "Mã đơn hàng (orders.id)"
        VARCHAR product_id FK "Mã món ăn (products.id)"
        INT quantity "Số lượng phần ăn"
        NUMERIC unit_price "Đơn giá tại thời điểm mua"
    }
```

---

## 3. Sơ đồ Hoạt động Đặt hàng & Xử lý Bất đồng bộ (Activity Diagram)
Mô tả luồng người dùng đặt món và kiến trúc xử lý bất đồng bộ chống nghẽn cổ chai thông qua hàng đợi **Amazon SQS** và **AWS Lambda**:

```mermaid
flowchart TD
    Start([Bắt đầu: Khách hàng chọn món]) --> AddCart[Thêm món vào giỏ hàng & Nhập địa chỉ giao]
    AddCart --> VoucherCheck{Có áp dụng Voucher?}
    VoucherCheck -- Có --> ApplyVoucher[Tính toán giảm giá: ASTRAL20 / FREESHIP]
    VoucherCheck -- Không --> CheckoutAction[Khách hàng bấm 'Xác Nhận Đặt Đơn']

    ApplyVoucher --> CheckoutAction
    CheckoutAction --> CoreAPI[Core API Node.js tiếp nhận request]

    subgraph "Giao dịch đồng bộ (Synchronous Transaction < 200ms)"
        CoreAPI --> SaveDB[(Ghi nhận Order PENDING vào Amazon RDS)]
        SaveDB --> PushSQS[Đẩy Order Event vào Amazon SQS Queue]
        PushSQS --> QuickResp[Phản hồi Client thành công ngay lập tức]
    end

    QuickResp --> LiveTracking[Giao diện Khách hàng chuyển sang Theo dõi Đơn hàng]

    subgraph "Xử lý bất đồng bộ không nghẽn (Asynchronous Serverless Pipeline)"
        PushSQS -.->|Kích hoạt Message Batch| LambdaWorker[AWS Lambda Invoice Worker]
        LambdaWorker --> GenPDF[Tạo file Hóa đơn điện tử PDF chuẩn VAT]
        GenPDF --> S3Bucket[(Lưu trữ file PDF vào Amazon S3 Bucket)]
        S3Bucket --> UpdateRDS[(Cập nhật invoice_s3_url vào RDS)]
        UpdateRDS --> Notify[Gửi Email xác nhận qua Amazon SES / SNS]
    end

    Notify --> MerchantAlert[Chủ quán nhận thông báo đơn mới trên Live Kanban Board]
    LiveTracking -.-> RealTimeSync{Đơn được nhận & nấu?}
    MerchantAlert --> Cook[Chủ quán bấm 'Nhận & Nấu Món' -> PREPARING]
    Cook --> Delivery[Giao cho Shipper -> DELIVERING]
    Delivery --> Complete[Hoàn tất đơn -> COMPLETED]
    Complete --> ViewInvoice[Khách & Quán xem/in Hóa đơn VAT S3]
    ViewInvoice --> Finish([Kết thúc chu trình đơn hàng])
```

---

## 4. Sơ đồ Tuần tự 1: Trợ lý AI Menu Copilot & Tải ảnh Amazon S3 Presigned URL
Mô tả hai tính năng điện toán đám mây & AI đột phá trong **Phân hệ Chủ quán (Merchant Hub)**:

```mermaid
sequenceDiagram
    autonumber
    actor Merchant as 🏪 Chủ Cửa Hàng
    participant UI as 💻 Frontend (Merchant Portal)
    participant API as ⚙️ Core API (Node.js)
    participant Gemini as 🤖 AI Engine (Google Gemini / Bedrock)
    participant S3 as ☁️ Amazon S3 Bucket

    %% Phân đoạn 1: AI Menu Copilot
    rect rgb(255, 245, 235)
        note over Merchant, Gemini: 1. LUỒNG AI MENU COPILOT TỰ ĐỘNG SINH MÔ TẢ & TAGS SEO
        Merchant->>UI: Nhập tên món: "Cơm Tấm Sườn Cây Nướng Sa Tế"
        Merchant->>UI: Bấm nút "✨ AI Viết mô tả & Tags chuẩn SEO"
        UI->>UI: Hiển thị Shimmer Loading (AI Đang suy nghĩ...)
        UI->>API: POST /api/v1/ai/generate-description { productName, keywords }
        API->>Gemini: Gọi model gemini-1.5-flash / Bedrock với Prompt chuyên gia ẩm thực
        Gemini-->>API: Trả về JSON { description, suggestedTags, priceRange }
        API-->>UI: Phản hồi kết quả AI
        UI->>UI: Tự động điền Mô tả hấp dẫn + Render mảng #Tags + Gợi ý giá bán
    end

    %% Phân đoạn 2: S3 Presigned URL Upload
    rect rgb(240, 253, 244)
        note over Merchant, S3: 2. LUỒNG TẢI ẢNH TRỰC TIẾP LÊN AMAZON S3 QUA PRESIGNED URL
        Merchant->>UI: Chọn file ảnh từ máy tính (com_tam.jpg)
        UI->>API: POST /api/v1/media/presigned-url { fileName, fileType }
        API->>API: Sinh S3 S3Client PutObjectCommand với key duy nhất
        API-->>UI: Trả về { uploadUrl (Presigned URL), finalS3Url, fileKey }
        UI->>S3: PUT [uploadUrl] tải trực tiếp file nhị phân (headers: Content-Type)
        Note over UI, S3: Tải trực tiếp lên Cloud S3, KHÔNG đi qua server backend, giải phóng 100% băng thông!
        S3-->>UI: 200 OK (Upload thành công)
        UI->>UI: Hiển thị thanh tiến trình 100% & Badge xanh: "✅ Đã tải lên Amazon S3 Bucket"
        Merchant->>UI: Bấm "Lưu Món Ăn"
        UI->>API: POST /api/v1/stores/products { name, price, description, tags, imageS3Url }
        API-->>UI: 201 Created (Món ăn chính thức có mặt trên thực đơn)
    end
```

---

## 5. Sơ đồ Tuần tự 2: Luồng Đặt hàng & Xử lý Hóa đơn Serverless (SQS + Lambda)
Mô tả quy trình xử lý đơn hàng chịu tải cao (High Throughput & Resilient) kết hợp cơ sở dữ liệu **PostgreSQL ACID** và dịch vụ xử lý ngầm **Serverless**:

```mermaid
sequenceDiagram
    autonumber
    actor Customer as 👤 Khách Hàng
    participant Frontend as 📱 Frontend (Web / Mobile)
    participant CoreAPI as ⚙️ Core API Server
    participant RDS as 🗄️ Amazon RDS (PostgreSQL)
    participant SQS as 📬 Amazon SQS (Order Queue)
    participant Lambda as ⚡ AWS Lambda (Worker)
    participant S3 as 🪣 Amazon S3 (Invoices)
    actor Merchant as 🏪 Chủ Cửa Hàng

    Customer->>Frontend: Chọn địa chỉ, áp voucher, bấm "Xác Nhận Đặt Đơn"
    Frontend->>CoreAPI: POST /api/v1/orders { items, address, voucher_code }
    CoreAPI->>RDS: Bắt đầu Transaction: Lưu Order (Status: PENDING) & OrderItems
    RDS-->>CoreAPI: Transaction Commit thành công
    CoreAPI->>SQS: SendMessage: { orderId, customerId, totalAmount, items, createdAt }
    SQS-->>CoreAPI: MessageId xác nhận xếp hàng
    CoreAPI-->>Frontend: 201 Created (Trả mã OrderId ngay trong < 200ms)
    Frontend->>Customer: Hiển thị màn hình đặt hàng thành công & đếm ngược giao nhận

    %% Serverless Event Processing
    Note over SQS, Lambda: Kích hoạt Lambda Event Source Mapping (Tự động scale theo lượng tải)
    SQS->>Lambda: Trigger Event Payload (Batch Orders)
    Lambda->>Lambda: Render PDF Hóa đơn điện tử VAT chuẩn hóa theo format thuế
    Lambda->>S3: PutObject: invoices/INV-{orderId}.pdf
    S3-->>Lambda: S3 Object URI hợp lệ
    Lambda->>RDS: UPDATE orders SET invoice_s3_url = :s3Url WHERE id = :orderId
    Lambda-->>SQS: DeleteMessage (Xóa message khỏi hàng đợi sau khi xử lý trơn tru)

    %% Merchant & Status Transition
    RDS-.->Merchant: Thông báo đơn hàng mới xuất hiện trên Live Order Board
    Merchant->>Frontend: Bấm "Nhận & Nấu Món" -> PREPARING
    Merchant->>Frontend: Bấm "Giao Cho Shipper" -> DELIVERING
    Merchant->>Frontend: Bấm "Hoàn Tất Đơn" -> COMPLETED
    Frontend->>CoreAPI: PATCH /api/v1/orders/{id}/status { status: 'COMPLETED' }
    CoreAPI->>RDS: UPDATE orders SET status = 'COMPLETED'
    Customer->>Frontend: Bấm "Xem Hóa Đơn Điện Tử VAT"
    Frontend->>S3: Tải file PDF từ invoice_s3_url hiển thị trực tiếp lên InvoiceModal
```

---

## 6. Sơ đồ Kiến trúc Hạ tầng Đám mây AWS Tổng thể
Sơ đồ kiến trúc toàn diện phản ánh mô hình triển khai của AstralFood tại khu vực **`ap-southeast-1` (Singapore)**:

```mermaid
graph TB
    subgraph ClientLayer["Lớp Client & Mạng Phân Phối Toàn Cầu"]
        UserBrowser["🌐 Trình Duyệt Người Dùng (Desktop / Mobile)"]
        CloudFront["⚡ Amazon CloudFront (CDN Tăng Tốc Toàn Cầu)"]
        S3Frontend["🪣 S3 Static Website Hosting (React SPA)"]
    end

    subgraph SecurityLayer["Lớp Bảo Mật & Định Tuyến"]
        Route53["🌍 Amazon Route 53 (DNS)"]
        WAF["🛡️ AWS WAF (Chống DDoS & Web Exploit)"]
        ALB["⚖️ Application Load Balancer (HTTPS / SSL Termination)"]
    end

    subgraph ComputeLayer["Lớp Xử Lý Ứng Dụng (Compute Layer)"]
        CoreServer["🚀 Core API Server (Node.js Express / NestJS)"]
        LambdaWorker["⚡ AWS Lambda Serverless Workers (PDF / Email)"]
    end

    subgraph AsyncAndAILayer["Lớp Hàng Đợi & Trí Tuệ Nhân Tạo (Async & AI)"]
        SQSQueue["📬 Amazon SQS (Hàng Đợi Sự Kiện Đơn Hàng)"]
        AIEngine["🤖 Amazon Bedrock / Google Gemini 1.5 Flash (AI Copilot)"]
    end

    subgraph DataAndStorageLayer["Lớp Lưu Trữ & Cơ Sở Dữ Liệu (Storage & Database)"]
        RDS[("🗄️ Amazon RDS PostgreSQL (Multi-AZ Multi-Master)")]
        S3Media[("🪣 Amazon S3 Media Bucket (Ảnh món ăn)")]
        S3Invoices[("🪣 Amazon S3 Invoices Bucket (Hóa đơn điện tử VAT)")]
        SES["✉️ Amazon SES / SNS (Email & SMS Thông Báo)"]
    end

    %% Flow Connections
    UserBrowser --> Route53
    Route53 --> CloudFront
    CloudFront --> S3Frontend
    UserBrowser --> WAF
    WAF --> ALB
    ALB --> CoreServer

    CoreServer --> RDS
    CoreServer --> SQSQueue
    CoreServer --> AIEngine
    CoreServer -.->|Cấp Chữ Ký Presigned URL| UserBrowser
    UserBrowser ==>|Tải ảnh trực tiếp qua Presigned URL| S3Media

    SQSQueue --> LambdaWorker
    LambdaWorker --> S3Invoices
    LambdaWorker --> RDS
    LambdaWorker --> SES

    classDef awsBox fill:#FF9900,stroke:#232F3E,stroke-width:2px,color:#fff;
    classDef reactBox fill:#61DAFB,stroke:#20232A,stroke-width:2px,color:#000;
    classDef rdsBox fill:#336791,stroke:#232F3E,stroke-width:2px,color:#fff;
    class S3Frontend,CloudFront,CoreServer,SQSQueue,LambdaWorker,S3Media,S3Invoices,SES awsBox;
    class UserBrowser reactBox;
    class RDS rdsBox;
```

---

*Tài liệu được khởi tạo và đồng bộ tự động cho AstralFood Platform - Đề tài Đồ án Chuyên ngành Điện toán Đám mây.*