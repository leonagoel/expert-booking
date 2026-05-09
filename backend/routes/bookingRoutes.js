const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { createBooking, getBookingsByEmail, updateBookingStatus } = require('../controllers/bookingController');

const bookingValidation = [
  body('expertId').notEmpty().withMessage('Expert ID is required').isMongoId().withMessage('Invalid expert ID'),
  body('clientName')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('clientEmail')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email address')
    .toLowerCase(),
  body('clientPhone')
    .trim()
    .notEmpty().withMessage('Phone number is required')
    .matches(/^[\+]?[\d\s\-\(\)]{8,20}$/).withMessage('Invalid phone number'),
  body('date')
    .notEmpty().withMessage('Date is required')
    .matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Date must be in YYYY-MM-DD format')
    .custom((value) => {
      const today = new Date().toISOString().split('T')[0];
      if (value < today) throw new Error('Cannot book a slot in the past');
      return true;
    }),
  body('time')
    .notEmpty().withMessage('Time slot is required')
    .matches(/^\d{2}:\d{2}$/).withMessage('Invalid time format'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters'),
];

router.post('/', bookingValidation, createBooking);
router.get('/', getBookingsByEmail);
router.patch('/:id/status', updateBookingStatus);

module.exports = router;