# Go2Pick Backend

Go2Pick is a pickup-only local shop pre-order application. Customers order products in advance and collect them from the shop using a unique pickup code, reducing waiting time. This MVP does not include online payment or delivery.

A complete production-style **FastAPI + MongoDB** backend for the Go2Pick local shop pre-order and pickup platform.

## Tech Stack

| Technology | Purpose |
|---|---|
| Python 3.12 | Language |
| FastAPI | Web framework |
| MongoDB | Database |
| Motor | Async MongoDB driver |
| PyJWT | JWT authentication |
| Bcrypt | Password hashing |
| Firebase Auth | Phone OTP Authentication (primary login) |
| SMTP | Mock Email OTP (fallback) |
| Cloudinary | File upload (with local fallback) |
| Pydantic v2 | Data validation |
| Uvicorn | ASGI server |

---

## Folder Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI app, middleware, router registration
│   ├── config.py            # Pydantic settings from .env
│   ├── database.py          # MongoDB Motor client + index creation
│   ├── auth.py              # JWT + bcrypt + role dependencies
│   ├── upload.py            # Cloudinary/local file upload
│   ├── schemas.py           # All Pydantic request/response models
│   ├── validators.py        # Shared validation helpers
│   ├── utils.py             # ObjectId converter
│   ├── routers/
│   │   ├── auth.py          # Signup/Login/OTP/ForgotPassword/FirebaseLogin
│   │   ├── customer.py      # Shops, Products, Cart, Orders, Reviews
│   │   ├── shopkeeper.py    # Dashboard, Orders, Products, Reports
│   │   ├── admin.py         # Super Admin APIs
│   │   ├── notifications.py # In-app notifications
│   │   ├── uploads.py       # File upload endpoints
│   │   └── support.py       # Support tickets
│   └── services/
│       ├── email_service.py        # SMTP email sender
│       ├── notification_service.py # In-app notification creator
│       ├── otp_service.py          # OTP generation + verification
│       └── admin_service.py        # Super admin seeder
│ ├── requirements.txt
│ ├── .env.example
│ ├── run.py
│ └── README.md
```

---

## Setup & Installation

### 1. Create Virtual Environment

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and fill in:

```env
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=Go2Pick
JWT_SECRET=your_long_random_secret_here
ADMIN_EMAIL=admin@go2pick.com
ADMIN_PASSWORD=Admin@123

# Optional SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your@email.com
SMTP_PASSWORD=your_app_password
SMTP_SENDER=Go2Pick <your@email.com>

# Optional Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

### 4. Start MongoDB

```bash
# Local MongoDB
mongod

# Or use MongoDB Atlas - paste the connection string in .env
```

### 5. Run the Backend

```bash
python run.py

# Or with uvicorn directly:
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API is live at: **http://localhost:8000**  
Interactive docs: **http://localhost:8000/docs**

---

## Default Admin Setup

The super admin is automatically seeded from `.env` on first startup:

```
Email:    admin@go2pick.com  (or whatever ADMIN_EMAIL is set to)
Password: Admin@123          (or whatever ADMIN_PASSWORD is set to)
Role:     super_admin
```

> ⚠️ Change these in `.env` before production deployment.

---

## API Reference

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/signup` | Register new customer |
| POST | `/auth/verify-email` | Verify email with OTP |
| POST | `/auth/resend-otp` | Resend OTP |
| POST | `/auth/login` | Login, get JWT token |
| POST | `/auth/forgot-password` | Send password reset OTP |
| POST | `/auth/reset-password` | Reset password with OTP |
| POST | `/auth/firebase-login` | Firebase phone auth token exchange |
| GET | `/auth/me` | Get current user |
| POST | `/auth/switch-mode` | Switch between customer/shopkeeper mode |

### Customer

| Method | Endpoint | Description |
|---|---|---|
| GET | `/customer/shops` | List active shops (search, category, city) |
| GET | `/customer/shops/{id}` | Shop detail + products |
| GET | `/customer/products` | List products (search, category, shopId) |
| GET | `/customer/products/{id}` | Product detail |
| POST | `/customer/cart/add` | Add to cart |
| GET | `/customer/cart` | View cart |
| DELETE | `/customer/cart/item/{productId}` | Remove item |
| DELETE | `/customer/cart` | Clear cart |
| POST | `/customer/orders` | Place order (pickup-only) |
| GET | `/customer/orders/my` | My orders |
| GET | `/customer/orders/{id}` | Order detail |
| POST | `/customer/reviews` | Submit shop review |

### Shopkeeper Application Flow

| Method | Endpoint | Description |
|---|---|---|
| POST | `/shopkeeper/apply` | Submit application |
| GET | `/shopkeeper/application/status` | Check application status |
| POST | `/shopkeeper/enable-dashboard` | Enable dashboard from notification |

### Shopkeeper Dashboard *(requires enabled dashboard)*

| Method | Endpoint | Description |
|---|---|---|
| GET | `/shopkeeper/dashboard` | Stats: orders, revenue, products |
| GET | `/shopkeeper/orders` | List shop orders |
| PUT | `/shopkeeper/orders/{id}/status` | Update order status (validated transitions) |
| POST | `/shopkeeper/orders/{id}/verify-code` | Verify customer pickup code to complete order |
| GET | `/shopkeeper/products` | List products |
| POST | `/shopkeeper/products` | Create product |
| PUT | `/shopkeeper/products/{id}` | Update product |
| DELETE | `/shopkeeper/products/{id}` | Delete product (soft) |
| POST | `/shopkeeper/products/bulk-import` | Bulk import via CSV/XLSX |
| GET | `/shopkeeper/reports` | Sales analytics |
| GET | `/shopkeeper/reviews` | Shop reviews |
| GET | `/shopkeeper/payouts` | Earnings & payouts (mock response) |
| GET | `/shopkeeper/settings` | Shop settings |
| PUT | `/shopkeeper/settings` | Update shop settings |

### Super Admin

| Method | Endpoint | Description |
|---|---|---|
| GET | `/admin/dashboard` | Platform stats |
| GET | `/admin/shop-applications` | List all applications |
| GET | `/admin/shop-applications/{id}` | Application detail |
| POST | `/admin/shop-applications/{id}/approve` | Approve application |
| POST | `/admin/shop-applications/{id}/reject` | Reject with reason |
| GET | `/admin/shops` | List all shops |
| PUT | `/admin/shops/{id}/block` | Block shop |
| PUT | `/admin/shops/{id}/unblock` | Unblock shop |
| GET | `/admin/users` | List all users |
| PUT | `/admin/users/{id}/block` | Block user |
| PUT | `/admin/users/{id}/unblock` | Unblock user |
| GET | `/admin/orders` | View all orders |
| GET | `/admin/support-tickets` | View support tickets |
| GET | `/admin/platform-settings` | Get platform settings |
| PUT | `/admin/platform-settings` | Update platform settings |

### Notifications

| Method | Endpoint | Description |
|---|---|---|
| GET | `/notifications/` | List user notifications |
| POST | `/notifications/{id}/read` | Mark as read |
| POST | `/notifications/read-all` | Mark all as read |

### Uploads

| Method | Endpoint | Description |
|---|---|---|
| POST | `/uploads/product-image` | Upload product image |
| POST | `/uploads/shop-image` | Upload shop image |
| POST | `/uploads/business-proof` | Upload business document |
| POST | `/uploads/profile-image` | Upload profile photo |

### Support

| Method | Endpoint | Description |
|---|---|---|
| POST | `/support/tickets` | Create support ticket |
| GET | `/support/tickets` | My support tickets |

---

## Order Status Flow

### Go2Pick Orders
```
placed → accepted → preparing → ready_for_pickup → completed (via code verification)
placed → cancelled
accepted → cancelled
preparing → cancelled
```

> ❌ Invalid transitions return HTTP 400

---

## Shopkeeper Activation Flow

1. Customer submits application → `POST /shopkeeper/apply`
2. Admin reviews → `POST /admin/shop-applications/{id}/approve`
3. User receives in-app notification with `actionType: ENABLE_SHOPKEEPER_DASHBOARD`
4. User clicks notification → Frontend calls `POST /shopkeeper/enable-dashboard`
5. User switches modes → `POST /auth/switch-mode`

> ⚠️ The shopkeeper dashboard is **NOT** enabled automatically after admin approval.

---

## File Upload

- **With Cloudinary configured**: files upload to Cloudinary CDN
- **Without Cloudinary**: files saved to `static/uploads/` and served via `/static/uploads/`

---

## Testing the API

Open **http://localhost:8000/docs** for the Swagger UI.

Test flow:
1. Sign up → verify email OTP → login
2. Browse shops and products
3. Apply for shopkeeper → wait for admin approval
4. Admin approves → click notification to enable dashboard
5. Switch to shopkeeper mode → manage products and orders
