const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({
  date: { type: String, required: true },
  time: { type: String, required: true },
  isBooked: { type: Boolean, default: false },
  bookedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null },
});

const expertSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      required: true,
      enum: ['Technology', 'Finance', 'Design', 'Health', 'Legal', 'Marketing'],
    },
    specialization: { type: String, required: true },
    experience: { type: Number, required: true, min: 0 },
    rating: { type: Number, required: true, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    bio: { type: String, required: true },
    avatar: { type: String, default: '' },
    hourlyRate: { type: Number, required: true },
    tags: [{ type: String }],
    availableSlots: [slotSchema],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

expertSchema.index({ name: 'text', specialization: 'text' });
expertSchema.index({ category: 1 });

module.exports = mongoose.model('Expert', expertSchema);
