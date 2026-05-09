import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookingAPI } from '../utils/api';
import toast from 'react-hot-toast';
import './MyBookingsPage.css';

const STATUS_ORDER = ['Pending', 'Confirmed', 'Completed', 'Cancelled'];

const formatDate = (dateStr) => {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
};

const formatCreated = (isoStr) => {
  return new Date(isoStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const CATEGORY_CLASS = {
  Technology: 'tech', Finance: 'finance', Design: 'design',
  Health: 'health', Legal: 'legal', Marketing: 'marketing',
};

const BookingCard = ({ booking, onStatusChange }) => {
  const [updating, setUpdating] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();
  const statusClass = booking.status.toLowerCase();
  const categoryClass = CATEGORY_CLASS[booking.expertCategory] || 'tech';

  const handleStatusUpdate = async (newStatus) => {
    setUpdating(true);
    try {
      await bookingAPI.updateStatus(booking._id, newStatus);
      onStatusChange(booking._id, newStatus);
      toast.success(`Status updated to ${newStatus}`);
    } catch (err) {
      toast.error(err.friendlyMessage || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="booking-card card">
      <div className="booking-card-header" onClick={() => setExpanded(!expanded)}>
        <div className="booking-expert-info">
          <img
            src={booking.expert?.avatar || `https://i.pravatar.cc/80?u=${booking.expert?._id}`}
            alt={booking.expertName}
            className="booking-avatar"
            onError={(e) => { e.target.src = `https://i.pravatar.cc/80?u=${booking._id}`; }}
          />
          <div>
            <h3 className="booking-expert-name">{booking.expertName}</h3>
            <span className={`badge badge-${categoryClass}`}>{booking.expertCategory}</span>
          </div>
        </div>
        <div className="booking-header-right">
          <span className={`badge status-${statusClass}`}>{booking.status}</span>
          <span className="booking-chevron">{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      <div className="booking-card-summary">
        <div className="booking-meta-item">
          <span className="meta-icon">📅</span>
          <span>{formatDate(booking.date)}</span>
        </div>
        <div className="booking-meta-item">
          <span className="meta-icon">🕐</span>
          <span>{booking.time}</span>
        </div>
        <div className="booking-meta-item">
          <span className="meta-icon">🔖</span>
          <span className="booking-ref-small">{booking.bookingReference}</span>
        </div>
      </div>

      {expanded && (
        <div className="booking-expanded">
          <div className="divider" style={{ margin: '0 0 16px' }} />
          
          <div className="booking-details">
            <div className="booking-detail-item">
              <span className="detail-key">Client Name</span>
              <span className="detail-val">{booking.clientName}</span>
            </div>
            <div className="booking-detail-item">
              <span className="detail-key">Email</span>
              <span className="detail-val">{booking.clientEmail}</span>
            </div>
            <div className="booking-detail-item">
              <span className="detail-key">Phone</span>
              <span className="detail-val">{booking.clientPhone}</span>
            </div>
            <div className="booking-detail-item">
              <span className="detail-key">Booked On</span>
              <span className="detail-val">{formatCreated(booking.createdAt)}</span>
            </div>
            {booking.notes && (
              <div className="booking-detail-item full">
                <span className="detail-key">Notes</span>
                <span className="detail-val notes-text">{booking.notes}</span>
              </div>
            )}
          </div>

          <div className="booking-actions">
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => navigate(`/experts/${booking.expert?._id || booking.expert}`)}
            >
              View Expert
            </button>
            <div className="status-actions">
              {STATUS_ORDER.filter((s) => s !== booking.status).map((status) => (
                <button
                  key={status}
                  className={`btn btn-sm ${status === 'Cancelled' ? 'btn-danger' : 'btn-ghost'}`}
                  onClick={() => handleStatusUpdate(status)}
                  disabled={updating}
                >
                  {updating ? '...' : `Mark ${status}`}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const MyBookingsPage = () => {
  const [email, setEmail] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);
  const [filterStatus, setFilterStatus] = useState('All');

  const handleSearch = useCallback(async (e) => {
    e.preventDefault();
    const trimmed = emailInput.trim();
    if (!trimmed || !/^\S+@\S+\.\S+$/.test(trimmed)) {
      setError('Please enter a valid email address');
      return;
    }
    setEmail(trimmed);
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const res = await bookingAPI.getByEmail(trimmed);
      setBookings(res.data.data);
    } catch (err) {
      setError(err.friendlyMessage || 'Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  }, [emailInput]);

  const handleStatusChange = (bookingId, newStatus) => {
    setBookings((prev) =>
      prev.map((b) => (b._id === bookingId ? { ...b, status: newStatus } : b))
    );
  };

  const filteredBookings = filterStatus === 'All'
    ? bookings
    : bookings.filter((b) => b.status === filterStatus);

  const statusCounts = bookings.reduce((acc, b) => {
    acc[b.status] = (acc[b.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="bookings-page page-enter">
      <div className="bookings-hero">
        <div className="hero-orb hero-orb-1" />
        <div className="container">
          <div className="bookings-hero-content">
            <h1 className="bookings-title">
              My <span className="hero-accent">Sessions</span>
            </h1>
            <p className="bookings-subtitle">
              Track and manage all your expert sessions in one place
            </p>
          </div>
        </div>
      </div>

      <div className="container bookings-body">
        {/* Email Lookup */}
        <div className="email-lookup card">
          <div className="lookup-icon">✉</div>
          <h2 className="lookup-title">Find Your Bookings</h2>
          <p className="lookup-subtitle">Enter the email address you used when booking</p>

          <form onSubmit={handleSearch} className="lookup-form">
            <div className="lookup-input-wrapper">
              <input
                type="email"
                className="form-input lookup-input"
                placeholder="your@email.com"
                value={emailInput}
                onChange={(e) => { setEmailInput(e.target.value); setError(null); }}
                autoComplete="email"
              />
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Searching...</> : 'Find Bookings'}
              </button>
            </div>
            {error && <span className="form-error lookup-error">{error}</span>}
          </form>
        </div>

        {/* Results */}
        {searched && !loading && (
          <div className="bookings-results">
            {bookings.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📭</div>
                <h3>No bookings found</h3>
                <p>No sessions found for <strong>{email}</strong></p>
                <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                  Double-check your email or book a new session
                </p>
              </div>
            ) : (
              <>
                {/* Stats */}
                <div className="bookings-stats">
                  <div className="stat-overview">
                    <span className="stat-total">{bookings.length}</span>
                    <span className="stat-total-label">Total Sessions</span>
                  </div>
                  {Object.entries(statusCounts).map(([status, count]) => (
                    <div key={status} className="stat-pill">
                      <span className={`badge status-${status.toLowerCase()}`}>{status}</span>
                      <span className="stat-pill-count">{count}</span>
                    </div>
                  ))}
                </div>

                {/* Filter */}
                <div className="booking-filters">
                  {['All', ...STATUS_ORDER].map((status) => (
                    <button
                      key={status}
                      className={`filter-chip ${filterStatus === status ? 'active' : ''}`}
                      onClick={() => setFilterStatus(status)}
                    >
                      {status}
                      {status !== 'All' && statusCounts[status] && (
                        <span className="filter-count">{statusCounts[status]}</span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Cards */}
                <div className="bookings-list">
                  {filteredBookings.length === 0 ? (
                    <div className="empty-state" style={{ padding: '40px' }}>
                      <p>No {filterStatus} bookings</p>
                    </div>
                  ) : (
                    filteredBookings.map((booking) => (
                      <BookingCard
                        key={booking._id}
                        booking={booking}
                        onStatusChange={handleStatusChange}
                      />
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBookingsPage;