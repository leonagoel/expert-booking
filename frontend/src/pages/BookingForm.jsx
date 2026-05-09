import React, { useState } from 'react';
import { bookingAPI } from '../utils/api';
import './BookingForm.css';

const formatDate = (dateStr) => {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
};

const validate = (values) => {
  const errors = {};
  if (!values.clientName.trim() || values.clientName.trim().length < 2) {
    errors.clientName = 'Name must be at least 2 characters';
  }
  if (!values.clientEmail.trim() || !/^\S+@\S+\.\S+$/.test(values.clientEmail)) {
    errors.clientEmail = 'Valid email address is required';
  }
  if (!values.clientPhone.trim() || !/^[\+]?[\d\s\-\(\)]{8,20}$/.test(values.clientPhone.trim())) {
    errors.clientPhone = 'Valid phone number is required';
  }
  if (values.notes && values.notes.length > 500) {
    errors.notes = 'Notes cannot exceed 500 characters';
  }
  return errors;
};

const BookingForm = ({ expert, selectedDate, selectedSlot, onSuccess, onCancel }) => {
  const [values, setValues] = useState({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    notes: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate(values);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setSubmitError(null);

    try {
      const res = await bookingAPI.create({
        expertId: expert._id,
        clientName: values.clientName.trim(),
        clientEmail: values.clientEmail.trim(),
        clientPhone: values.clientPhone.trim(),
        date: selectedDate,
        time: selectedSlot.time,
        notes: values.notes.trim(),
      });
      setSuccess(res.data.data);
      onSuccess(res.data.data);
    } catch (err) {
      const errData = err.response?.data;
      if (errData?.code === 'SLOT_UNAVAILABLE') {
        setSubmitError('This slot was just taken by another user. Please go back and select a different time.');
      } else if (errData?.errors) {
        const fieldErrors = {};
        errData.errors.forEach(({ field, message }) => {
          fieldErrors[field] = message;
        });
        setErrors(fieldErrors);
      } else {
        setSubmitError(errData?.message || err.friendlyMessage || 'Booking failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="booking-form-wrapper card">
      <div className="booking-form-header">
        <h2 className="booking-form-title">Complete Your Booking</h2>
        <div className="booking-summary">
          <div className="summary-item">
            <span className="summary-label">Expert</span>
            <span className="summary-value">{expert.name}</span>
          </div>
          <div className="summary-divider" />
          <div className="summary-item">
            <span className="summary-label">Date</span>
            <span className="summary-value">{formatDate(selectedDate)}</span>
          </div>
          <div className="summary-divider" />
          <div className="summary-item">
            <span className="summary-label">Time</span>
            <span className="summary-value">{selectedSlot.time}</span>
          </div>
          <div className="summary-divider" />
          <div className="summary-item">
            <span className="summary-label">Rate</span>
            <span className="summary-value">${expert.hourlyRate}/hr</span>
          </div>
        </div>
      </div>

      {submitError && (
        <div className="submit-error">
          <span>⚠</span>
          <span>{submitError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="booking-form" noValidate>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input
              type="text"
              name="clientName"
              className={`form-input ${errors.clientName ? 'error' : ''}`}
              placeholder="Your full name"
              value={values.clientName}
              onChange={handleChange}
              autoComplete="name"
            />
            {errors.clientName && <span className="form-error">{errors.clientName}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Email Address *</label>
            <input
              type="email"
              name="clientEmail"
              className={`form-input ${errors.clientEmail ? 'error' : ''}`}
              placeholder="your@email.com"
              value={values.clientEmail}
              onChange={handleChange}
              autoComplete="email"
            />
            {errors.clientEmail && <span className="form-error">{errors.clientEmail}</span>}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Phone Number *</label>
          <input
            type="tel"
            name="clientPhone"
            className={`form-input ${errors.clientPhone ? 'error' : ''}`}
            placeholder="+1 (555) 000-0000"
            value={values.clientPhone}
            onChange={handleChange}
            autoComplete="tel"
          />
          {errors.clientPhone && <span className="form-error">{errors.clientPhone}</span>}
        </div>

        <div className="form-group">
          <label className="form-label">
            Session Notes
            <span className="label-optional">(optional)</span>
          </label>
          <textarea
            name="notes"
            className={`form-input form-textarea ${errors.notes ? 'error' : ''}`}
            placeholder="What would you like to discuss? Any specific goals or topics..."
            value={values.notes}
            onChange={handleChange}
            rows={4}
          />
          <div className="textarea-footer">
            {errors.notes && <span className="form-error">{errors.notes}</span>}
            <span className={`char-count ${values.notes.length > 450 ? 'warning' : ''}`}>
              {values.notes.length}/500
            </span>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={loading}>
            ← Change Slot
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? (
              <>
                <div className="spinner" style={{ width: 16, height: 16 }} />
                Confirming...
              </>
            ) : (
              <>
                Confirm Booking · ${expert.hourlyRate}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BookingForm;