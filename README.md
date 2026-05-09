```
 ███████╗██╗  ██╗██████╗ ███████╗██████╗ ████████╗
 ██╔════╝╚██╗██╔╝██╔══██╗██╔════╝██╔══██╗╚══██╔══╝
 █████╗   ╚███╔╝ ██████╔╝█████╗  ██████╔╝   ██║   
 ██╔══╝   ██╔██╗ ██╔═══╝ ██╔══╝  ██╔══██╗   ██║   
 ███████╗██╔╝ ██╗██║     ███████╗██║  ██║   ██║   
 ╚══════╝╚═╝  ╚═╝╚═╝     ╚══════╝╚═╝  ╚═╝   ╚═╝   
  ██████╗ ██████╗ ███╗   ██╗███╗   ██╗███████╗ ██████╗████████╗
 ██╔════╝██╔═══██╗████╗  ██║████╗  ██║██╔════╝██╔════╝╚══██╔══╝
 ██║     ██║   ██║██╔██╗ ██║██╔██╗ ██║█████╗  ██║        ██║   
 ██║     ██║   ██║██║╚██╗██║██║╚██╗██║██╔══╝  ██║        ██║   
 ╚██████╗╚██████╔╝██║ ╚████║██║ ╚████║███████╗╚██████╗   ██║   
  ╚═════╝ ╚═════╝ ╚═╝  ╚═══╝╚═╝  ╚═══╝╚══════╝ ╚═════╝   ╚═╝   
```

<div align="center">

### `v1.0.0` &nbsp;·&nbsp; Real-Time Expert Session Booking &nbsp;·&nbsp; Full-Stack

<br/>

![](https://img.shields.io/badge/-%E2%96%A0%20REACT%2018-61DAFB?style=flat-square&logoColor=black)
![](https://img.shields.io/badge/-%E2%96%A0%20NODE.JS-339933?style=flat-square&logoColor=white)
![](https://img.shields.io/badge/-%E2%96%A0%20MONGODB-47A248?style=flat-square&logoColor=white)
![](https://img.shields.io/badge/-%E2%96%A0%20SOCKET.IO-010101?style=flat-square&logoColor=white)
![](https://img.shields.io/badge/-%E2%96%A0%20EXPRESS-FF6C37?style=flat-square&logoColor=white)

</div>

---

<div align="center">

```
┌──────────────┬──────────────┬──────────────┬──────────────┐
│   12 experts │  6 categories│  Real-time   │  0 double    │
│   seeded     │  supported   │  via WS      │  bookings    │
└──────────────┴──────────────┴──────────────┴──────────────┘
```

</div>

---

## &nbsp;◈ &nbsp;Overview

**ExpertConnect** is a production-grade booking platform — built as a technical assessment — that solves the hardest problem in scheduling systems: **concurrent slot reservation without double-booking**.

The system connects clients with experts across 6 domains and handles real-time availability through a Socket.io pub/sub layer, with MongoDB atomic operations at the persistence level ensuring correctness even under race conditions.

---

## &nbsp;◈ &nbsp;System Design

```
  CLIENT LAYER                    SERVER LAYER                  DATA LAYER
  ┌─────────────┐   REST/WS      ┌─────────────────────────┐   ┌──────────────┐
  │             │ ─────────────► │  Express 4 API           │   │              │
  │  React 18   │                │  ├─ /api/experts         │◄─►│  MongoDB     │
  │  Axios      │ ◄───────────── │  └─ /api/bookings        │   │  Atlas       │
  │  Socket.io  │                │                          │   │              │
  │  client     │ ◄── WS emit ── │  Socket.io Server        │   │  Experts     │
  │             │                │  rooms: expert:{id}      │   │  Bookings    │
  └─────────────┘                └─────────────────────────┘   └──────────────┘
```

---

## &nbsp;◈ &nbsp;Features

```
  SCREEN 1 — EXPERT LISTING          SCREEN 2 — EXPERT DETAIL
  ┌────────────────────────────┐     ┌────────────────────────────┐
  │ ● Search by name / tag     │     │ ● Expert profile card       │
  │ ● Filter by category       │     │ ● Slots grouped by date     │
  │ ● Sort: rating / exp / $   │     │ ● Live "X open" counters    │
  │ ● Pagination (6 per page)  │     │ ● Booked slots go grey      │
  │ ● Skeleton loading states  │     │   instantly via Socket.io   │
  └────────────────────────────┘     └────────────────────────────┘

  SCREEN 3 — BOOKING FORM            SCREEN 4 — MY BOOKINGS
  ┌────────────────────────────┐     ┌────────────────────────────┐
  │ ● Name / Email / Phone     │     │ ● Lookup by email           │
  │ ● Date + time pre-filled   │     │ ● Filter by status          │
  │ ● Client-side validation   │     │ ● Pending / Confirmed /     │
  │ ● 409 on slot conflict     │     │   Completed / Cancelled     │
  │ ● Success + booking ref    │     │ ● Update status inline      │
  └────────────────────────────┘     └────────────────────────────┘
```

---

## &nbsp;◈ &nbsp;The Concurrency Problem — Solved

Two users. Same slot. Same millisecond. **Standard logic fails.**

```js
// ✗ WRONG — read then write creates a race window
const slot = await Expert.findOne({ ... });  // both users see isBooked: false
if (!slot.isBooked) {
  slot.isBooked = true;                      // both users write true
  await slot.save();                         // double booked ✗
}

// ✓ RIGHT — one atomic operation, no race window
const expert = await Expert.findOneAndUpdate(
  {
    _id: expertId,
    availableSlots: {
      $elemMatch: { date, time, isBooked: false }  // condition + update = atomic
    }
  },
  { $set: { 'availableSlots.$[slot].isBooked': true } },
  { arrayFilters: [{ 'slot.date': date, 'slot.time': time, 'slot.isBooked': false }] }
);

// if expert === null → someone else got it first → 409 Conflict
// if expert !== null → this request won the lock → proceed to save booking
```

After the lock is acquired, the server emits to all clients in the expert's Socket.io room:

```js
io.to(`expert:${expertId}`).emit('slot:booked', { date, time });
// → every open browser tab greys out the slot without a refresh
```

---

## &nbsp;◈ &nbsp;API Reference

```
  METHOD   ENDPOINT                    DESCRIPTION
  ───────────────────────────────────────────────────────────
  GET      /api/experts                List with pagination + filters
  GET      /api/experts/categories     All available categories
  GET      /api/experts/:id            Detail + slots grouped by date
  ───────────────────────────────────────────────────────────
  POST     /api/bookings               Create booking (atomic lock)
  GET      /api/bookings?email=        All bookings for an email
  PATCH    /api/bookings/:id/status    Update booking status
  ───────────────────────────────────────────────────────────
  GET      /health                     Server health check
```

**Pagination params:** `page` · `limit` · `category` · `search` · `sortBy` · `order`

---

## &nbsp;◈ &nbsp;Project Structure

```
expert-booking/
│
├── backend/
│   ├── config/
│   │   ├── db.js                # MongoDB connection
│   │   └── seed.js              # 12 expert profiles + time slots
│   │
│   ├── controllers/
│   │   ├── expertController.js  # GET experts, GET expert/:id
│   │   └── bookingController.js # POST booking, GET by email, PATCH status
│   │
│   ├── middleware/
│   │   └── errorMiddleware.js   # Global error handler + 404
│   │
│   ├── models/
│   │   ├── Expert.js            # availableSlots subdocument array
│   │   └── Booking.js           # Auto-generated booking reference
│   │
│   ├── routes/
│   │   ├── expertRoutes.js
│   │   └── bookingRoutes.js     # express-validator middleware chains
│   │
│   └── server.js                # Express + Socket.io + MongoDB init
│
└── frontend/
    └── src/
        ├── components/          # Navbar · Footer · ExpertCard · Skeleton
        ├── context/
        │   └── SocketContext.jsx
        ├── pages/
        │   ├── ExpertsPage.jsx
        │   ├── ExpertDetailPage.jsx
        │   ├── BookingForm.jsx
        │   └── MyBookingsPage.jsx
        └── utils/
            └── api.js           # Axios instance + error interceptors
```

---

## &nbsp;◈ &nbsp;Getting Started

**1 — Clone and install**
```bash
git clone https://github.com/leonagoel/expert-booking.git
cd expert-booking
npm install --prefix backend
npm install --prefix frontend
```

**2 — Configure environment**
```bash
# backend/.env
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/expert-booking
CLIENT_URL=http://localhost:3000
NODE_ENV=development

# frontend/.env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```

**3 — Seed and run**
```bash
# Seed 12 experts with available slots
node backend/config/seed.js

# Terminal 1 — backend
cd backend && npm run dev

# Terminal 2 — frontend
cd frontend && npm start
```

App runs at **`http://localhost:3000`**

---

## &nbsp;◈ &nbsp;Tech Stack

```
  LAYER        TECHNOLOGY              PURPOSE
  ──────────────────────────────────────────────────────
  UI           React 18               Component rendering
  Routing      React Router v6        Client-side navigation
  HTTP         Axios                  API requests + interceptors
  Real-time    Socket.io client       Live slot updates
  Styling      Custom CSS             Dark theme design system
  Typography   Syne + DM Sans         Display + body fonts
  ──────────────────────────────────────────────────────
  Runtime      Node.js 18+            Server environment
  Framework    Express 4              REST API
  WebSocket    Socket.io server       Pub/sub slot events
  Validation   express-validator      Input sanitization
  ODM          Mongoose               MongoDB schema + queries
  Database     MongoDB Atlas          Cloud persistence
  ──────────────────────────────────────────────────────
  Dev          nodemon                Auto-restart on change
               concurrently           Run both servers at once
```

---

<div align="center">

```
  built by leonagoel  ·  react + node + mongo + socket.io  ·  2026
```

</div>
