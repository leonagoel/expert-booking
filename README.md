# ⚡ ExpertConnect — Real-Time Expert Session Booking System

A full-stack, production-grade expert booking platform built with React, Node.js, Express, MongoDB, and Socket.io for real-time slot updates.

---

## ✨ Features

### 🖥 Frontend (React)
- **Expert Listing** — Search, filter by category, sort, paginate
- **Expert Detail** — Real-time slot availability via Socket.io
- **Booking Form** — Validated form with success/error states
- **My Bookings** — Email-based lookup, status management
- Dark, premium design with subtle animations

### 🛠 Backend (Node.js + Express + MongoDB)
- RESTful API with proper folder structure
- Atomic double-booking prevention using MongoDB transactions
- Real-time slot updates via Socket.io
- Input validation with express-validator
- Centralized error handling

---

## 📁 Project Structure

```
expert-booking/
├── backend/
│   ├── config/
│   │   ├── db.js              # MongoDB connection
│   │   └── seed.js            # Database seeding
│   ├── controllers/
│   │   ├── expertController.js
│   │   └── bookingController.js
│   ├── middleware/
│   │   └── errorMiddleware.js
│   ├── models/
│   │   ├── Expert.js
│   │   └── Booking.js
│   ├── routes/
│   │   ├── expertRoutes.js
│   │   └── bookingRoutes.js
│   ├── .env.example
│   ├── package.json
│   └── server.js
│
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── components/
    │   │   ├── Navbar.jsx
    │   │   ├── ExpertCard.jsx
    │   │   └── Skeleton.jsx
    │   ├── context/
    │   │   └── SocketContext.jsx
    │   ├── pages/
    │   │   ├── ExpertsPage.jsx
    │   │   ├── ExpertDetailPage.jsx
    │   │   ├── BookingForm.jsx
    │   │   └── MyBookingsPage.jsx
    │   ├── utils/
    │   │   └── api.js
    │   ├── App.js
    │   └── index.css
    └── package.json
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)

### 1. Clone & Setup Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your MongoDB URI
npm install
npm run seed     # Seed 12 expert profiles
npm run dev      # Start on port 5000
```

### 2. Setup Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm start        # Start on port 3000
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/experts` | List experts with pagination & filters |
| GET | `/api/experts/categories` | Get all categories |
| GET | `/api/experts/:id` | Expert detail + grouped slots |
| POST | `/api/bookings` | Create booking (with race condition lock) |
| GET | `/api/bookings?email=` | Get bookings by email |
| PATCH | `/api/bookings/:id/status` | Update booking status |
| GET | `/health` | Health check |

### Query Parameters for GET /api/experts
- `page` — Page number (default: 1)
- `limit` — Items per page (default: 6, max: 20)
- `category` — Filter by category
- `search` — Search name/specialization/tags
- `sortBy` — `rating | experience | hourlyRate | reviewCount`
- `order` — `asc | desc`

---

## ⚡ Real-Time Architecture

```
Client A views Expert Page
        ↓
  socket.emit('join:expert', expertId)

Client B books a slot
        ↓
  POST /api/bookings
        ↓
  Atomic MongoDB transaction locks slot
        ↓
  io.to('expert:expertId').emit('slot:booked', { date, time })

Client A receives update instantly
        ↓
  Slot turns grey/disabled without refresh
```

---

## 🔒 Double-Booking Prevention

Uses MongoDB's atomic `findOneAndUpdate` with `arrayFilters` inside a **session transaction**:

```js
const expert = await Expert.findOneAndUpdate(
  {
    _id: expertId,
    availableSlots: { $elemMatch: { date, time, isBooked: false } }
  },
  { $set: { 'availableSlots.$[slot].isBooked': true } },
  { arrayFilters: [{ 'slot.date': date, 'slot.time': time, 'slot.isBooked': false }], session }
);

if (!expert) {
  // Slot was already taken — return 409 Conflict
}
```

This ensures that even under concurrent requests, only one booking succeeds.

---

## 🌐 Environment Variables

### Backend `.env`
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/expert-booking
CLIENT_URL=http://localhost:3000
NODE_ENV=development
```

### Frontend `.env`
```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```

---

## 🎨 Design System

- **Font:** Syne (display) + DM Sans (body)
- **Theme:** Dark with indigo accent (#6366f1)
- **Design language:** Premium, editorial, high-contrast

---

Built with ❤️ using React · Node.js · Express · MongoDB · Socket.io
