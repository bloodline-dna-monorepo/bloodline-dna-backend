# Bloodline DNA Testing Service - Backend

## Giới thiệu

Đây là backend của hệ thống quản lý dịch vụ xét nghiệm ADN huyết thống, được xây dựng trên nền tảng Node.js, TypeScript, Express, Prisma và MySQL.

---

## Cấu trúc dự án

```

bloodline-backend/
├── src/
│   ├── config/         # Cấu hình môi trường, database, biến toàn cục
│   ├── constants/      # Các hằng số dùng chung trong dự án
│   ├── controllers/    # Xử lý logic request, response cho từng route
│   ├── middlewares/    # Middleware Express (xác thực, xử lý lỗi,...)
│   ├── models/         # Định nghĩa model, interface, kiểu dữ liệu
│   ├── prisma/         # Schema Prisma và client Prisma
│   ├── routes/         # Định nghĩa các route API
│   ├── services/       # Xử lý business logic tách biệt controller
│   ├── tests/          # Code test unit, integration
│   ├── utils/          # Các hàm tiện ích dùng chung
│   ├── app.ts          # Cấu hình Express app, middleware, route
│   ├── server.ts       # File entry point chạy server
│   └── type.d.ts       # Khai báo type mở rộng nếu cần
├── .env                # Biến môi trường (không commit lên git)
├── .gitignore          # Các file, thư mục git sẽ bỏ qua
├── package.json        # Thông tin project & dependencies
├── tsconfig.json       # Cấu hình TypeScript
├── nodemon.json        # Cấu hình nodemon cho chạy dev
├── yarn.lock           # Khóa version dependencies
└── README.md           # File hướng dẫn này

```

---

## Cài đặt và chạy project

### Yêu cầu

- Node.js phiên bản >= 16
- Yarn package manager
- MySQL server đang chạy và có database cho project

### Các bước

1. Clone repo backend về máy

```bash
git clone <url-repo-backend>
cd bloodline-backend
```

2. Cài dependencies

```bash
yarn install
```

3. Tạo file `.env` ở gốc dự án dựa trên mẫu `.env.example` (nếu có), ví dụ:

```
DATABASE_URL="mysql://user:password@localhost:3306/bloodline_db"
PORT=4000
JWT_SECRET=your_secret_key
```

4. Khởi tạo database và Prisma migration

```bash
npx prisma migrate dev --name init
```

5. Chạy server trong môi trường dev

```bash
yarn dev
```

Server sẽ chạy mặc định trên cổng 4000 (hoặc port trong `.env`)

---

## Giải thích các file quan trọng

- **app.ts**: cấu hình Express app, thêm middleware, khai báo route
- **server.ts**: khởi động server, listen cổng
- **prisma/schema.prisma**: mô hình dữ liệu, schema DB
- **controllers/**: nhận request, gọi services xử lý, trả response
- **services/**: xử lý nghiệp vụ, tương tác DB qua Prisma Client
- **middlewares/**: xác thực token, xử lý lỗi, logger
- **routes/**: định nghĩa API endpoint, map controller tương ứng

---

## Quy trình Git và quản lý nhánh

Để giữ cho code sạch và dễ quản lý, làm theo các quy tắc nhánh sau:

- **main**: nhánh chính, luôn là bản production ổn định, chỉ merge code đã review, test kỹ
- **develop**: nhánh phát triển tổng, hợp các feature hoàn chỉnh và test ổn định
- **feature/\<tên-feature>**: các nhánh phát triển tính năng riêng lẻ, tách ra từ develop

### Ví dụ workflow

1. Từ nhánh **develop**, tạo nhánh feature mới:

```bash
git checkout develop
git pull origin develop
git checkout -b feature/api-authentication
```

2. Code và commit thường xuyên, với message rõ ràng:

```bash
git add .
git commit -m "Implement user login with JWT authentication"
```

3. Push lên remote:

```bash
git push origin feature/api-authentication
```

4. Tạo Pull Request (PR) từ **feature/api-authentication** vào **develop**, yêu cầu review từ team

5. Sau khi được review & test ổn, merge PR vào **develop**

6. Đến cuối sprint hoặc khi release, merge **develop** vào **main** và deploy

---

## Hỗ trợ và liên hệ

- Mọi thắc mắc, lỗi, đề xuất vui lòng liên hệ nhóm trưởng hoặc tạo issue trên repo.

---

## Ghi chú

- Tuyệt đối không commit file `.env` lên git để bảo mật thông tin
- Luôn chạy test trước khi push code
- Tuân thủ quy chuẩn code và commit message
