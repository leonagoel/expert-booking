const { validationResult } = require('express-validator');
const Booking = require('../models/Booking');
const Expert = require('../models/Expert');

// POST /api/bookings
const createBooking = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
      });
    }

    const { expertId, clientName, clientEmail, clientPhone, date, time, notes } = req.body;

    const expert = await Expert.findOneAndUpdate(
      {
        _id: expertId,
        isActive: true,
        availableSlots: {
          $elemMatch: { date, time, isBooked: false },
        },
      },
      {
        $set: { 'availableSlots.$[slot].isBooked': true },
      },
      {
        arrayFilters: [{ 'slot.date': date, 'slot.time': time, 'slot.isBooked': false }],
        new: true,
      }
    );

    if (!expert) {
      const expertExists = await Expert.findById(expertId);
      if (!expertExists) {
        return res.status(404).json({ success: false, message: 'Expert not found' });
      }
      return res.status(409).json({
        success: false,
        message: 'This slot has just been booked by someone else. Please select a different time.',
        code: 'SLOT_UNAVAILABLE',
      });
    }

    const booking = new Booking({
      expert: expertId,
      expertName: expert.name,
      expertCategory: expert.category,
      clientName: clientName.trim(),
      clientEmail: clientEmail.trim().toLowerCase(),
      clientPhone: clientPhone.trim(),
      date,
      time,
      notes: notes ? notes.trim() : '',
      status: 'Pending',
    });

    await booking.save();

    const io = req.app.get('io');
    if (io) {
      io.to(`expert:${expertId}`).emit('slot:booked', { expertId, date, time, bookingId: booking._id });
    }

    res.status(201).json({
      success: true,
      message: 'Booking confirmed successfully!',
      data: booking,
    });
  } catch (error) {
    console.error('Booking error:', error);
    next(error);
  }
};

// GET /api/bookings?email=
const getBookingsByEmail = async (req, res, next) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email query parameter is required' });
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email format' });
    }

    const bookings = await Booking.find({ clientEmail: email.toLowerCase().trim() })
      .populate('expert', 'name category avatar specialization')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: bookings, count: bookings.length });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/bookings/:id/status
const updateBookingStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Pending', 'Confirmed', 'Completed', 'Cancelled'];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).populate('expert', 'name category avatar');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (status === 'Cancelled') {
      const expertId = booking.expert._id || booking.expert;
      await Expert.updateOne(
        { _id: expertId, 'availableSlots.date': booking.date, 'availableSlots.time': booking.time },
        { $set: { 'availableSlots.$.isBooked': false, 'availableSlots.$.bookedBy': null } }
      );

      const io = req.app.get('io');
      if (io) {
        io.to(`expert:${expertId}`).emit('slot:released', {
          expertId: expertId.toString(),
          date: booking.date,
          time: booking.time,
        });
      }
    }

    res.json({ success: true, message: `Booking status updated to ${status}`, data: booking });
  } catch (error) {
    next(error);
  }
};

module.exports = { createBooking, getBookingsByEmail, updateBookingStatus };