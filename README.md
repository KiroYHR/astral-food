# 🚀 AstralFood — Nền Tảng Đặt Đồ Ăn & Thương Mại Điện Tử Đa Kênh

[![AWS Cloud](https://img.shields.io/badge/AWS-ap--southeast--1_(Singapore)-orange?logo=amazon-aws)](https://aws.amazon.com/)
[![Node.js](https://img.shields.io/badge/Node.js-v22.x-green?logo=node.js)](https://nodejs.org/)
[![React 19](https://img.shields.io/badge/React-19.x-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.x-purple?logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4.x-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Architecture](https://img.shields.io/badge/Architecture-Cloud--Native_Microservices-FF5A1F)](#-kiến-trúc-hệ-thống)

> **AstralFood** là nền tảng Đặt đồ ăn & Thương mại điện tử ẩm thực đa kênh chuẩn **Cloud-Native Microservices & Event-Driven Serverless** trên hạ tầng **Amazon Web Services (AWS Singapore - ap-southeast-1)**. Hệ thống mang đến trải nghiệm đặt món siêu tốc, tự động hóa với AWS S3 Presigned URL, hàng đợi Amazon SQS và trợ lý AI Menu Copilot.

---

## 🏗️ Kiến Trúc Hệ Thống (Cloud Architecture)

```
[ Khách hàng / Chủ quán / Quản trị viên ]
                   │
                   ▼ (HTTPS / CDN)
        ┌─────────────────────────┐
        │   Amazon CloudFront     │
        └────────────┬────────────┘
                     │
       ┌─────────────┴─────────────┐
       ▼                           ▼
┌──────────────┐           ┌────────────────────────────────┐
│  Amazon S3   │           │    Core API (Node.js/Express)  │
│ (Static Web) │           │         [EC2 / Fargate]        │
└──────────────┘           └───────────────┬────────────────┘
                                           │
         ┌─────────────────────────────────┼────────────────────────────────┐
         ▼                                 ▼                                ▼
┌─────────────────┐             ┌────────────────────┐          ┌─────────────────────┐
│  Amazon RDS     │             │     Amazon S3      │          │     Amazon SQS      │
│ (PostgreSQL DB) │             │ (Media & Invoices) │          │ (Order Event Queue) │
└─────────────────┘             └────────────────────┘          └──────────┬──────────┘
                                                                           │
                                                                           ▼
                                                                ┌─────────────────────┐
                                                                │  AWS Lambda Workers │
                                                                │  (Node.js Runtime)  │
                                                                └──────────┬──────────┘
                                                                           │
                                                        ┌──────────────────┴──────────────────┐
                                                        ▼                                     ▼
                                              ┌────────────────────┐                ┌──────────────────┐
                                              │   Amazon SES/SNS   │                │   PDF Invoices   │
                                              │  (Email/Push Noti) │                │  (Amazon S3 Out) │
                                              └────────────────────┘                └──────────────────┘
```

---

## 🛠️ Tech Stack Chuẩn Hóa Toàn Hệ Thống (Node.js Ecosystem)

| Phân hệ | Công nghệ cốt lõi | Vai trò & Trách nhiệm | Hạ tầng AWS phụ trách | Phụ trách |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend** (`/frontend`) | **Node.js, React 19, TypeScript, Vite, Tailwind CSS v4, Zustand, Recharts, Lucide Icons** | Giao diện Web SPA gồm 3 phân hệ: Customer Portal, Merchant Dashboard, System Admin. Design System tươi sáng "Solar Starburst". | **Amazon S3 + Amazon CloudFront CDN** | **Thành viên 3** |
| **Backend Core** (`/backend`) | **Node.js (Express / NestJS), RESTful API, Prisma/Drizzle ORM, JWT Auth** | Xử lý Core Business Logic, kết nối cơ sở dữ liệu, cấp chữ ký S3 Presigned URL, tích hợp AI Menu Copilot (Bedrock / Gemini). | **Amazon RDS PostgreSQL (Multi-AZ), Amazon S3 Media Bucket** | **Thành viên 1 & 2** |
| **Serverless Workers** (`/lambda-workers`) | **AWS Lambda (Node.js 20.x Runtime), PDFKit, AWS SDK v3** | Xử lý bất đồng bộ từ hàng đợi: Xuất hóa đơn VAT điện tử dạng PDF lưu lên S3 và gửi Email xác nhận qua SES. | **Amazon SQS, AWS EventBridge, Amazon SES & SNS** | **Thành viên 2** |

---

## 📂 Cấu Trúc Monorepo

```text
E:\DuAnCaNhan\AstralFood/
├── .gitignore                          # Chặn tuyệt đối file .env và các khóa bí mật AWS
├── README.md                           # Giới thiệu tổng quan hệ thống & Kiến trúc dự án
│
├── frontend/                           # [Thành viên 3] - Giao diện Web React 19 + Vite
│   ├── public/                         # Favicon và tài nguyên tĩnh
│   ├── src/
│   │   ├── api/                        # Axios client, Mock DB & Hybrid API Services
│   │   ├── components/                 # Navbar, Footer, DevModeSwitcher, CartDrawer, Modals
│   │   ├── layouts/                    # CustomerLayout, MerchantLayout, AdminLayout
│   │   ├── pages/                      # Auth, Customer, Merchant, Admin Pages
│   │   ├── store/                      # useAuthStore, useCartStore (Zustand)
│   │   ├── types/                      # TypeScript database & API interfaces
│   │   ├── App.tsx                     # React Router v6 điều hướng đa trang
│   │   └── index.css                   # Tailwind CSS v4 + Solar Starburst Design Tokens
│   ├── .env.example                    # Mẫu cấu hình môi trường Frontend
│   └── package.json
│
├── backend/                            # [Thành viên 1 & 2] - Core RESTful API Node.js
│   └── .gitkeep
│
├── lambda-workers/                     # [Thành viên 2] - Serverless Event Handlers Node.js
│   └── .gitkeep
│
└── docs/                               # Tài liệu thiết kế hệ thống & Hướng dẫn kỹ thuật
    ├── xu_t_b_sung_api_db_astralfood.md        # Tài liệu đồng bộ 5 điểm API Contract & DB
    └── c_u_tr_c_git_kh_i_t_o_d_n_astralfood.md # Hướng dẫn quy trình Git Monorepo & Quy chuẩn
```

---

## 📑 Tài Liệu Kỹ Thuật Đính Kèm

Toàn bộ tài liệu chi tiết được lưu trữ trong thư mục [`docs/`](docs/):
1. **[Tài liệu Đồng bộ API Contract & Database](docs/xu_t_b_sung_api_db_astralfood.md)**: Chi tiết 6 bảng PostgreSQL, payload đặt hàng Amazon SQS, quy trình S3 Presigned URL và API AI Menu Copilot.
2. **[Hướng dẫn Cấu trúc Git Monorepo](docs/c_u_tr_c_git_kh_i_t_o_d_n_astralfood.md)**: Quy tắc làm việc theo nhánh (`main`, `feat/tv1-backend-core`, `feat/tv2-orders-serverless`, `feat/tv3-frontend`).

---

## 🔒 Quy Tắc An Toàn & Bảo Mật Nhóm (AWS Security Rules)

1. **Tuyệt đối không commit file `.env`**: Mọi khóa `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` và chuỗi kết nối Database chỉ được đặt trong file `.env` nội bộ trên từng máy.
2. **Thống nhất Region**: Toàn bộ tài nguyên hạ tầng AWS đặt tại **`ap-southeast-1 (Singapore)`** để đảm bảo độ trễ thấp nhất về Việt Nam.
3. **Nguyên tắc Phân quyền Tối thiểu (Least Privilege)**: Không sử dụng tài khoản Root của AWS; chỉ dùng IAM User/Role có quyền tối thiểu cho từng dịch vụ.
4. **Kiểm soát Chi phí**: Ưu tiên sử dụng tài nguyên thuộc gói **AWS Free Tier** và cấu hình AWS Budget cảnh báo khi vượt ngưỡng.

---

## 🚀 Hướng Dẫn Chạy Thử Nghiệm Frontend (Local Dev)

```bash
# 1. Di chuyển vào thư mục frontend
cd frontend

# 2. Cài đặt các thư viện phụ thuộc
npm install

# 3. Khởi chạy máy chủ phát triển
npm run dev

# 4. Kiểm tra bản dựng hoàn thiện
npm run build
```
Truy cập: **`http://localhost:5173/`**