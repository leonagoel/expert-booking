<div align="center">

<div align="center">

<svg width="600" height="120" viewBox="0 0 600 120" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="tg" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#6366f1"/>
      <stop offset="50%" style="stop-color:#a855f7"/>
      <stop offset="100%" style="stop-color:#ec4899"/>
    </linearGradient>
  </defs>
  <text x="300" y="72" font-family="Arial Black, sans-serif" font-size="54" font-weight="900"
    fill="url(#tg)" text-anchor="middle" letter-spacing="-1">
    ⚡ ExpertConnect
  </text>
  <text x="300" y="105" font-family="Arial, sans-serif" font-size="15"
    fill="#94a3b8" text-anchor="middle" letter-spacing="3">
    REAL-TIME EXPERT BOOKING PLATFORM
  </text>
</svg>

<br/>

```
  ╔══════════════════════════════════════════════════════╗
  ║   Discover experts  →  Pick a slot  →  Book instantly ║
  ║          with zero double-bookings. Ever.             ║
  ╚══════════════════════════════════════════════════════╝
```

<br/>

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://mongodb.com)
[![Socket.io](https://img.shields.io/badge/Socket.io-Real--Time-010101?style=flat-square&logo=socket.io)](https://socket.io)
[![Express](https://img.shields.io/badge/Express-4-000000?style=flat-square&logo=express)](https://expressjs.com)

<br/>

> ⚡ **Live slots.** 🔒 **Race-condition proof.** 🎨 **Premium dark UI.**

</div>

---

## What Is This?

**ExpertConnect** is a production-grade, full-stack booking platform that lets users discover experts across categories — Technology, Finance, Design, Health, Legal, Marketing — and book 1-on-1 sessions with real-time slot availability.

The system is built around one hard problem: **preventing double-bookings under concurrent load** — solved using MongoDB atomic transactions with array filters and Socket.io for live UI sync across all connected clients.

---

## Feature Highlights

| Area | What's Built |
|------|-------------|
| 🔍 **Expert Discovery** | Search by name/tag, filter by category, sort by rating/experience/rate, paginated results |
| 📅 **Slot Selection** | Date-grouped availability grid, live slot counts, instant visual feedback |
| ⚡ **Real-Time Sync** | Socket.io rooms per expert — slots update across all browsers without refresh |
| 🔒 **Race Condition Lock** | Atomic MongoDB `findOneAndUpdate` inside a session transaction prevents any double-booking |
| 📋 **Booking Management** | Email-based lookup, status transitions (Pending → Confirmed → Completed → Cancelled) |
| ✅ **Confirmation Flow** | Animated success popup with booking reference on every confirmed session |
| 🎨 **Premium UI** | Dark theme, Syne + DM Sans typography, smooth page transitions, skeleton loaders |

---

## Architecture

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
│                      MONGODB                            │
│  Experts collection · Bookings collection               │
│  Atomic transactions · Compound indexes                 │
└─────────────────────────────────────────────────────────┘
```

---

## The Hard Part — Concurrency-Safe Booking

The most interesting engineering problem here: **two users clicking "Book" on the same slot at the same millisecond.**

Standard read-then-write logic fails here. ExpertConnect solves it with a single atomic operation:

```js
// One query: find the slot AND lock it — no separate read step
const expert = await Expert.findOneAndUpdate(
  {
    _id: expertId,
    availableSlots: {
      $elemMatch: { date, time, isBooked: false }  // only matches if still free
    }
  },
  {
    $set: { 'availableSlots.$[slot].isBooked': true }
  },
  {
    arrayFilters: [{ 'slot.date': date, 'slot.time': time, 'slot.isBooked': false }],
    session,   // wrapped in a MongoDB transaction
    new: true,
  }
);

if (!expert) {
  // Someone else got there first — return 409 Conflict
  return res.status(409).json({ code: 'SLOT_UNAVAILABLE' });
}

// Safe to create the booking now
await booking.save({ session });
await session.commitTransaction();
```

MongoDB evaluates the filter and the update atomically. The `session` wraps both writes in a transaction so a crash mid-way leaves no orphaned state.

After a successful booking, the server broadcasts to every client viewing that expert's page:

```js
io.to(`expert:${expertId}`).emit('slot:booked', { date, time });
// → All connected clients grey out that slot instantly
```

---

## Project Structure

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
        ├── components/           # Navbar, ExpertCard, Skeleton
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

## API Reference

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

## Getting Started

### Prerequisites
- Node.js v18+
- MongoDB (local or [Atlas](https://mongodb.com/atlas) free tier)

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
MONGODB_URI=mongodb://localhost:27017/expert-booking
CLIENT_URL=http://localhost:3000
NODE_ENV=development
```

**`frontend/.env`**
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```

---

## Design Decisions Worth Noting

**Why MongoDB transactions for bookings?**
Multi-document operations (updating the expert's slot + creating the booking record) need to be atomic. If the server crashes between the two writes, the transaction rolls back and the slot is freed automatically.

**Why Socket.io rooms instead of broadcasting globally?**
Each expert page joins a room keyed by `expert:{id}`. Only clients viewing the same expert receive slot updates — no unnecessary traffic to unrelated pages.

**Why email-based booking lookup instead of auth?**
Keeps the UX frictionless for a booking tool. Users enter the email they booked with — no account creation, no password resets.

---

## Tech Stack

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

<div align="center">

Built with React · Node.js · Express · MongoDB · Socket.io

</div>
