require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/db');

const expertRoutes = require('./routes/expertRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: function(origin, callback) {
      const allowed = [process.env.CLIENT_URL, 'http://localhost:3000'].filter(Boolean);
      if (!origin || allowed.includes(origin) || /\.vercel\.app$/.test(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PATCH'],
  },
});

// Make io accessible to routes
app.set('io', io);

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: function(origin, callback) {
    const allowed = [
      process.env.CLIENT_URL,
      'http://localhost:3000',
    ].filter(Boolean);
    // Allow any vercel.app subdomain
    if (!origin || allowed.includes(origin) || /\.vercel\.app$/.test(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api/experts', expertRoutes);
app.use('/api/bookings', bookingRoutes);

// DEV ONLY: Reset all bookings and free up all expert slots
app.delete('/api/reset', async (req, res) => {
  try {
    const Booking = require('./models/Booking');
    const Expert = require('./models/Expert');
    await Booking.deleteMany({});
    await Expert.updateMany({}, { $set: { 'availableSlots.$[].isBooked': false, 'availableSlots.$[].bookedBy': null } });
    res.json({ success: true, message: 'All bookings cleared and slots reset.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Join expert room to receive slot updates
  socket.on('join:expert', (expertId) => {
    socket.join(`expert:${expertId}`);
    console.log(`Socket ${socket.id} joined expert:${expertId}`);
  });

  socket.on('leave:expert', (expertId) => {
    socket.leave(`expert:${expertId}`);
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Error Handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.io ready for real-time updates`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}\n`);
});