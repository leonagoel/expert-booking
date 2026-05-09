<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=6366f1&height=200&section=header&text=ExpertConnect&fontSize=80&fontColor=ffffff&animation=fadeIn&fontAlignY=38&desc=Real-Time%20Expert%20Session%20Booking%20Platform&descAlignY=60&descAlign=50&descSize=18" width="100%"/>

<br/>

<a href="#"><img src="https://readme-typing-svg.demolab.com?font=Syne&weight=700&size=22&pause=1000&color=6366F1&center=true&vCenter=true&width=600&lines=Discover+World-Class+Experts;Book+Sessions+in+Real-Time;Zero+Double-Bookings.+Ever.;Live+Slot+Updates+via+Socket.io" alt="Typing SVG" /></a>

<br/><br/>

[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongodb.com)
[![Socket.io](https://img.shields.io/badge/Socket.io-Real--Time-010101?style=for-the-badge&logo=socket.io)](https://socket.io)
[![Express](https://img.shields.io/badge/Express-4-000000?style=for-the-badge&logo=express)](https://expressjs.com)

<br/>

> **⚡ Live slots · 🔒 Race-condition proof · 🎨 Premium dark UI · 📡 WebSocket powered**

<br/>

</div>

---

## 🚀 What Is This?

**ExpertConnect** is a production-grade, full-stack booking platform that lets users discover experts across **Technology, Finance, Design, Health, Legal, and Marketing** — and book 1-on-1 sessions with real-time slot availability.

Built around one hard engineering problem: **preventing double-bookings under concurrent load** — solved using MongoDB atomic `findOneAndUpdate` with array filters and Socket.io for live UI sync across all connected clients.

---

## ✨ Feature Highlights

| Area | What's Built |
|------|-------------|
| 🔍 **Expert Discovery** | Search by name/tag, filter by category, sort by rating/experience/rate, paginated results |
| 📅 **Slot Selection** | Date-grouped availability grid, live slot counts, instant visual feedback |
| ⚡ **Real-Time Sync** | Socket.io rooms per expert — slots update across all browsers without refresh |
| 🔒 **Race Condition Lock** | Atomic MongoDB `findOneAndUpdate` prevents any double-booking |
| 📋 **Booking Management** | Email-based lookup, status transitions (Pending → Confirmed → Completed → Cancelled) |
| ✅ **Confirmation Flow** | Animated success screen with unique booking reference on every session |
| 🎨 **Premium UI** | Dark theme, Syne + DM Sans typography, smooth page transitions, skeleton loaders |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                        CLIENT                           │
│  React 18 · React Router · Axios · Socket.io-client     │
└───────────────────────┬─────────────────────────────────┘
                        │ HTTP + WebSocket
┌───────────────────────▼─────────────────────────────────┐
│                       SERVER                            │
│  Express 4 · Socket.io · express-validator              │
│                                                         │
│  ┌─────────────────┐    ┌──────────────────────────┐   │
│  │  REST API        │    │  Socket.io Rooms          │   │
│  │  /api/experts    │    │  expert:{id}              │   │
│  │  /api/bookings   │    │  slot:booked              │   │
│  └────────┬────────┘    │  slot:released             │   │
│           │              └──────────────────────────┘   │
└───────────┼─────────────────────────────────────────────┘
            │
┌───────────▼─────────────────────────────────────────────┐
│                      MONGODB ATLAS                      │
│  Experts collection · Bookings collection               │
│  Atomic operations · Compound indexes                   │
└─────────────────────────────────────────────────────────┘
```

---

## 🔒 The Hard Part — Concurrency-Safe Booking

Two users clicking "Book" on the same slot at the same millisecond. Standard read-then-write logic fails here. ExpertConnect solves it with a **single atomic operation**:

```js
// One query: find the slot AND lock it atomically — no separate read step
const expert = await Expert.findOneAndUpdate(
  {
    _id: expertId,
    availableSlots: {
      $elemMatch: { date, time, isBooked: false }  // only matches if still free
    }
  },
  { $set: { 'availableSlots.$[slot].isBooked': true } },
  {
    arrayFilters: [{ 'slot.date': date, 'slot.time': time, 'slot.isBooked': false }],
    new: true,
  }
);

if (!expert) {
  return res.status(409).json({ code: 'SLOT_UNAVAILABLE' }); // Someone else got there first
}

// Safe to create the booking now
await booking.save();

// Broadcast to all clients viewing this expert
io.to(`expert:${expertId}`).emit('slot:booked', { date, time });
```

---

## 📁 Project Structure

```
expert-booking/
├── backend/
│   ├── config/
│   │   ├── db.js                 # MongoDB connection
│   │   └── seed.js               # 12 expert profiles with slots
│   ├── controllers/
│   │   ├── expertController.js   # Listing, detail, categories
│   │   └── bookingController.js  # Create, lookup, status update
│   ├── middleware/
│   │   └── errorMiddleware.js    # Centralized error handling
│   ├── models/
│   │   ├── Expert.js             # Schema with availableSlots array
│   │   └── Booking.js            # Schema with auto-generated reference
│   ├── routes/
│   │   ├── expertRoutes.js
│   │   └── bookingRoutes.js      # express-validator rules
│   └── server.js                 # Express + Socket.io setup
│
└── frontend/
    └── src/
        ├── components/           # Navbar, Footer, ExpertCard, Skeleton
        ├── context/
        │   └── SocketContext.jsx # Global socket connection
        ├── pages/
        │   ├── ExpertsPage.jsx        # Discovery + filters
        │   ├── ExpertDetailPage.jsx   # Slots + real-time updates
        │   ├── BookingForm.jsx        # Validated booking form
        │   └── MyBookingsPage.jsx     # Email lookup + management
        └── utils/
            └── api.js            # Axios instance + interceptors
```

---

## 🔌 API Reference

### Experts

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/experts` | Paginated list with filters |
| `GET` | `/api/experts/categories` | All available categories |
| `GET` | `/api/experts/:id` | Detail + slots grouped by date |

**Query params for `GET /api/experts`:**
`page` · `limit` · `category` · `search` · `sortBy` · `order`

### Bookings

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/bookings` | Create booking (atomic lock) |
| `GET` | `/api/bookings?email=` | Fetch all bookings for an email |
| `PATCH` | `/api/bookings/:id/status` | Update status |

### System

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check |

---

## ⚙️ Getting Started

### Prerequisites
- Node.js v18+
- MongoDB ([Atlas](https://mongodb.com/atlas) free tier recommended)

### 1 — Backend

```bash
cd backend
cp .env.example .env
# Fill in your MONGODB_URI
npm install
npm run seed    # Seeds 12 expert profiles with available slots
npm run dev     # Runs on http://localhost:5000
```

### 2 — Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm start       # Runs on http://localhost:3000
```

### Environment Variables

**`backend/.env`**
```env
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/expert-booking
CLIENT_URL=http://localhost:3000
NODE_ENV=development
```

**`frontend/.env`**
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6, Axios |
| Styling | Custom CSS, Syne + DM Sans fonts |
| Real-time | Socket.io (client + server) |
| Backend | Node.js, Express 4 |
| Validation | express-validator |
| Database | MongoDB with Mongoose |
| Dev Tools | nodemon, concurrently |

---

## 💡 Design Decisions

**Why atomic operations instead of transactions?**
MongoDB Atlas M0 (free tier) doesn't support multi-document transactions. The `findOneAndUpdate` with `$elemMatch` is fully atomic at the document level — it only matches and updates the slot if it's still free, making it race-condition proof without needing a transaction session.

**Why Socket.io rooms instead of broadcasting globally?**
Each expert page joins a room keyed by `expert:{id}`. Only clients viewing the same expert receive slot updates — no unnecessary traffic to unrelated pages.

**Why email-based booking lookup instead of auth?**
Keeps the UX frictionless for a booking tool. Users enter the email they booked with — no account creation, no password resets.

---

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=6366f1&height=100&section=footer" width="100%"/>

**Built with ❤️ using React · Node.js · Express · MongoDB · Socket.io**

</div>
