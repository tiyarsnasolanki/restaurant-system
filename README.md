# 🍽️ JK Spicy Dosa Cafe — Restaurant Management System

A production-ready, full-stack POS & restaurant management system built with Next.js + Express.js + MongoDB Atlas.

---

## 🚀 Features

| Feature | Details |
|---|---|
| 🧾 **POS Billing** | Fast order entry, cart, bill calculation |
| 🖨️ **Print Bill** | 80mm thermal printer ready (react-to-print) |
| 📱 **WhatsApp Bill** | One-click send via WhatsApp |
| 📟 **SMS Bill** | Fast2SMS / Twilio integration |
| 👨‍🍳 **Kitchen Display (KDS)** | Real-time order status: Pending → Preparing → Ready |
| 📊 **Reports** | Daily / Monthly / Yearly sales + profit charts |
| 💸 **Expenses** | Track gas, vegetables, salary, rent etc. |
| 📅 **Reservations** | Catering & event booking with auto-calculation |
| 📦 **Inventory** | Stock tracking with low-stock alerts |
| 👥 **Staff** | Add/remove staff, role-based access |
| 📱 **QR Menu** | Public QR code menu for customers |
| 🌙 **Dark/Light Mode** | Full theme switching |
| 📴 **Offline Mode** | Bills cached and synced when back online |
| 💰 **GST Invoice** | CGST + SGST breakdown for tax invoices |

---

## 📁 Folder Structure

```
restaurant-system/
├── backend/
│   ├── config/db.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── orderController.js
│   │   └── reportController.js
│   ├── middleware/auth.js
│   ├── models/
│   │   ├── User.js
│   │   ├── MenuItem.js
│   │   ├── Order.js
│   │   ├── Expense.js
│   │   ├── Reservation.js
│   │   └── Inventory.js
│   ├── routes/
│   │   ├── auth.js, menu.js, orders.js
│   │   ├── expenses.js, reservations.js
│   │   ├── reports.js, inventory.js
│   │   ├── kitchen.js, staff.js
│   ├── utils/
│   │   ├── seed.js        ← Run once to populate DB
│   │   └── sms.js
│   ├── .env.example
│   ├── package.json
│   └── server.js
│
└── frontend/
    ├── app/
    │   ├── (app)/          ← Protected routes
    │   │   ├── dashboard/
    │   │   ├── billing/    ← POS
    │   │   ├── orders/
    │   │   ├── kitchen/    ← KDS
    │   │   ├── menu/
    │   │   ├── expenses/
    │   │   ├── reports/
    │   │   ├── reservations/
    │   │   ├── inventory/
    │   │   ├── staff/
    │   │   └── qr-menu/
    │   ├── login/
    │   ├── qr-display/     ← Public customer menu
    │   └── layout.js
    ├── components/
    │   ├── billing/PrintBill.js
    │   ├── Sidebar.js
    │   └── TopBar.js
    ├── context/
    │   ├── AuthContext.js
    │   └── ThemeContext.js
    ├── utils/
    │   ├── api.js
    │   └── helpers.js
    ├── styles/globals.css
    ├── .env.local.example
    └── package.json
```

---

## ⚙️ Local Setup

### 1. MongoDB Atlas

1. Go to [mongodb.com/atlas](https://cloud.mongodb.com)
2. Create free M0 cluster
3. Add database user (username + password)
4. Whitelist IP: `0.0.0.0/0`
5. Get connection string: `mongodb+srv://user:pass@cluster.xxxxx.mongodb.net/jkspicydosa`

### 2. Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret

npm install
node utils/seed.js   # ← Seed database with menu + admin user
npm run dev          # Runs on port 5000
```

### 3. Frontend Setup

```bash
cd frontend
cp .env.local.example .env.local
# Edit: NEXT_PUBLIC_API_URL=http://localhost:5000/api

npm install
npm run dev          # Runs on port 3000
```

### 4. Login

- URL: `http://localhost:3000/login`
- Email: `admin@jkdosa.com`
- Password: `admin123`

> ⚠️ **Change the admin password after first login!**

---

## 🌐 Deployment

### Backend → Render (Free)

1. Push `backend/` to a GitHub repo
2. Go to [render.com](https://render.com) → New Web Service
3. Connect GitHub repo
4. Build Command: `npm install`
5. Start Command: `node server.js`
6. Add Environment Variables:
   - `MONGODB_URI` = your Atlas connection string
   - `JWT_SECRET` = any long random string
   - `FRONTEND_URL` = your Vercel URL
   - `NODE_ENV` = production
7. Deploy → Copy the URL (e.g. `https://jkdosa-api.onrender.com`)

### Frontend → Vercel (Free)

1. Push `frontend/` to a GitHub repo
2. Go to [vercel.com](https://vercel.com) → New Project
3. Import repo
4. Add Environment Variables:
   - `NEXT_PUBLIC_API_URL` = `https://jkdosa-api.onrender.com/api`
   - `NEXT_PUBLIC_RESTAURANT_NAME` = `JK Spicy Dosa Cafe`
   - `NEXT_PUBLIC_RESTAURANT_GSTIN` = your GSTIN
   - `NEXT_PUBLIC_RESTAURANT_ADDRESS` = your address
5. Deploy!

---

## 🖨️ Printer Setup

The bill is designed for **80mm thermal printers** (Epson TM, Rongta, etc.).

1. Connect printer via USB or network
2. Set as default Windows/Mac printer
3. In Chrome: Settings → More Tools → Print → Paper: 80mm × receipt
4. Or use Epson's SDK for direct printing

---

## 📱 SMS / WhatsApp Setup

### Fast2SMS (Recommended for India)
1. Register at [fast2sms.com](https://fast2sms.com)
2. Get API key from dashboard
3. Add to `.env`: `FAST2SMS_API_KEY=your_key`
4. Set `SMS_PROVIDER=fast2sms`

### WhatsApp
- Uses WhatsApp's `wa.me` deep link
- Opens WhatsApp app with pre-filled message
- No API key required for this basic integration

---

## 💡 Bill Number Format

Bills are auto-numbered: `JK-20250116-0001`
- `JK` = Restaurant prefix
- `20250116` = Date (YYYYMMDD)
- `0001` = Sequence (resets daily)

---

## 🔐 Default Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@jkdosa.com | admin123 |

> Change password immediately after first login via Settings.

---

## 📊 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), React, Tailwind CSS |
| Charts | Recharts |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas + Mongoose |
| Auth | JWT (7-day expiry) |
| Print | react-to-print |
| SMS | Fast2SMS / Twilio |
| Deploy | Vercel + Render |

---

Made with ❤️ for JK Spicy Dosa Cafe
# restaurant-system
