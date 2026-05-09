const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    expert: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Expert',
      required: true,
    },
    expertName: { type: String, required: true },
    expertCategory: { type: String, required: true },
    clientName: { type: String, required: true, trim: true },
    clientEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email address'],
    },
    clientPhone: {
      type: String,
      required: true,
      trim: true,
    },
    date: { type: String, required: true },
    time: { type: String, required: true },
    notes: { type: String, default: '', maxlength: 500 },
    status: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Completed', 'Cancelled'],
      default: 'Pending',
    },
    bookingReference: { type: String, unique: true },
  },
  { timestamps: true }
);

// Generate unique booking reference
bookingSchema.pre('save', function (next) {
  if (!this.bookingReference) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    this.bookingReference = `EXP-${timestamp}-${random}`;
  }
  next();
});

bookingSchema.index({ clientEmail: 1 });
bookingSchema.index({ expert: 1, date: 1, time: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
