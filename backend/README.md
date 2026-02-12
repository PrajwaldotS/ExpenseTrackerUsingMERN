# 💸 Expense Tracker Backend

A production-ready RESTful backend built with Node.js, Express, TypeScript, Prisma ORM, and PostgreSQL.

This backend replaces Supabase with a fully custom architecture including authentication, role-based access control, expense management, analytics, and file uploads.

---

## 🚀 Tech Stack

- Node.js
- Express.js
- TypeScript
- PostgreSQL
- Prisma ORM
- JWT Authentication
- Bcrypt (Password Hashing)
- Cloudinary (File Storage)
- Multer (File Upload Middleware)

---

## 📁 Project Structure

src/
│
├── config/
│ ├── db.ts
│ └── cloudinary.ts
│
├── controllers/
│ ├── auth.controller.ts
│ ├── admin.controller.ts
│ ├── category.controller.ts
│ ├── expense.controller.ts
│ ├── zone.controller.ts
│ └── user.controller.ts
│
├── middleware/
│ ├── auth.middleware.ts
│ ├── role.middleware.ts
│ └── upload.middleware.ts
│
├── routes/
│ ├── auth.routes.ts
│ ├── admin.routes.ts
│ ├── category.routes.ts
│ ├── expense.routes.ts
│ ├── zone.routes.ts
│ └── user.routes.ts
│
├── utils/
│ ├── generateToken.ts
│ └── hashPassword.ts
│
├── app.ts
└── server.ts
## 🔐 Authentication System

- JWT-based authentication
- Password hashing using bcrypt
- Role-based access (admin & user)
- Protected routes using middleware

---

## 🧾 Available APIs

### 🔑 Auth
- `POST /api/auth/signup`
- `POST /api/auth/login`

---

### 👤 User
- `PUT /api/users/profile-image`

---

### 🗂 Zones
- `POST /api/zones` (Admin)
- `GET /api/zones`
- `POST /api/zones/assign`
- `GET /api/zones/me`

---

### 🏷 Categories
- `POST /api/categories`
- `GET /api/categories`
- `PUT /api/categories/:id`
- `DELETE /api/categories/:id`

---

### 💸 Expenses
- `POST /api/expenses`
- `GET /api/expenses`
- `DELETE /api/expenses/:id`
- `POST /api/expenses/:id/upload-receipt`

Supports filtering:
GET /api/expenses?zoneId=&categoryId=


---

### 🛡 Admin
- `GET /api/admin/users`
- `PUT /api/admin/role`
- `DELETE /api/admin/users/:id`
- `GET /api/admin/dashboard`

Dashboard returns:
- Total users
- Total zones
- Total categories
- Total expenses
- Total amount
- Zone-wise totals
- Category-wise totals

---

## 📊 Database Schema Overview

Entities:
- User
- Zone
- UserZone (Many-to-Many)
- Category
- Expense

Relationships:
- User → Expense (1:N)
- Zone → Expense (1:N)
- Category → Expense (1:N)
- User ↔ Zone (M:N via UserZone)

---

## 🌩 File Upload System

- Profile images stored in Cloudinary
- Expense receipts stored in Cloudinary
- Old images deleted on update
- Memory storage using Multer

---

## ⚙️ Environment Variables

Create `.env` file:

DATABASE_URL=postgresql://postgres:password@localhost:5432/expense_tracker
JWT_SECRET=your_secret_key

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

PORT=2294


---

## 🛠 Installation & Setup

### 1️⃣ Install Dependencies

npm install


---

### 2️⃣ Run Prisma Migration

npx prisma migrate dev


---

### 3️⃣ Start Development Server

npm run dev


Server runs on:
http://localhost:2294


---

## 🧠 Architecture Highlights

- Modular MVC structure
- Middleware-driven security
- Type-safe ORM queries
- Aggregation & reporting APIs
- Role-based authorization
- Production-grade file handling

---

## 🔮 Future Enhancements

- Monthly analytics API
- Date-range reporting
- Soft delete system
- Audit logs
- Rate limiting
- Swagger API documentation
- Docker support

---

## 👨‍💻 Author

Built as part of a full backend migration from Supabase to a custom Node.js architecture.

---

## 📜 License

MIT