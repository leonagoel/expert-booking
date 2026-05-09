import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { expertAPI } from '../utils/api';
import { useSocket } from '../context/SocketContext';
import BookingForm from './BookingForm';
import './ExpertDetailPage.css';

const formatDateLong = (dateStr) => {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
};

const CATEGORY_CLASS = {
  Technology: 'tech', Finance: 'finance', Design: 'design',
  Health: 'health', Legal: 'legal', Marketing: 'marketing',
};

const formatDate = (dateStr) => {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};

const renderStars = (rating) => {
  return Array.from({ length: 5 }, (_, i) => (
    <span key={i} style={{ opacity: i < Math.floor(rating) ? 1 : 0.25 }}>★</span>
  ));
};

const ExpertDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const socket = useSocket();

  const [expert, setExpert] = useState(null);
  const [slots, setSlots] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showBooking, setShowBooking] = useState(false);
  const [realtimeUpdates, setRealtimeUpdates] = useState([]);

  const fetchExpert = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await expertAPI.getById(id);
      setExpert(res.data.data);
      setSlots(res.data.data.slotsByDate || {});
      const dates = Object.keys(res.data.data.slotsByDate || {}).sort();
      if (dates.length) setSelectedDate(dates[0]);
    } catch (err) {
      setError(err.friendlyMessage || 'Failed to load expert');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchExpert();
  }, [fetchExpert]);

  // Real-time socket updates
  useEffect(() => {
    if (!socket || !id) return;

    socket.emit('join:expert', id);

    const handleSlotBooked = ({ expertId, date, time }) => {
      if (expertId !== id) return;
      setSlots((prev) => {
        const updated = { ...prev };
        if (updated[date]) {
          updated[date] = updated[date].map((s) =>
            s.time === time ? { ...s, isBooked: true } : s
          );
        }
        return updated;
      });
      setRealtimeUpdates((prev) => [
        { type: 'booked', date, time, at: Date.now() },
        ...prev.slice(0, 4),
      ]);
      // Deselect if this slot was selected
      setSelectedSlot((prev) => {
        if (prev?.time === time && selectedDate === date) return null;
        return prev;
      });
    };

    const handleSlotReleased = ({ expertId, date, time }) => {
      if (expertId !== id) return;
      setSlots((prev) => {
        const updated = { ...prev };
        if (updated[date]) {
          updated[date] = updated[date].map((s) =>
            s.time === time ? { ...s, isBooked: false } : s
          );
        }
        return updated;
      });
    };

    socket.on('slot:booked', handleSlotBooked);
    socket.on('slot:released', handleSlotReleased);

    return () => {
      socket.emit('leave:expert', id);
      socket.off('slot:booked', handleSlotBooked);
      socket.off('slot:released', handleSlotReleased);
    };
  }, [socket, id, selectedDate]);

  const [bookingResult, setBookingResult] = useState(null);

  const handleBookingSuccess = (result) => {
    setBookingResult(result);
  };

  const sortedDates = Object.keys(slots).sort();
  const currentSlots = selectedDate ? (slots[selectedDate] || []) : [];

  if (loading) return (
    <div className="detail-loading">
      <div className="spinner" />
      <p>Loading expert profile...</p>
    </div>
  );

  if (error) return (
    <div className="detail-error">
      <div className="error-icon">⚠</div>
      <h2>Failed to load</h2>
      <p>{error}</p>
      <button className="btn btn-ghost" onClick={() => navigate('/')}>← Back to Experts</button>
    </div>
  );

  if (!expert) return null;

  const categoryClass = CATEGORY_CLASS[expert.category] || 'tech';

  return (
    <div className="detail-page page-enter">
      {/* ===== BOOKING CONFIRMED POPUP ===== */}
      {bookingResult && (
        <>
          <style>{`
            @keyframes bdIn { from { opacity:0 } to { opacity:1 } }
            @keyframes cardIn { from { opacity:0; transform:translate(-50%,-50%) scale(0.82) } to { opacity:1; transform:translate(-50%,-50%) scale(1) } }
            @keyframes checkIn { from { opacity:0; transform:scale(0.2) } to { opacity:1; transform:scale(1) } }
            @keyframes pulse { 0%,100% { transform:scale(1); opacity:0.5 } 50% { transform:scale(1.8); opacity:0 } }
          `}</style>
          {/* Backdrop */}
          <div onClick={() => navigate('/my-bookings')} style={{
            position:'fixed', inset:0, background:'rgba(0,0,0,0.8)',
            backdropFilter:'blur(8px)', zIndex:9990,
            animation:'bdIn 0.3s ease',
          }} />
          {/* Card */}
          <div style={{
            position:'fixed', top:'50%', left:'50%',
            transform:'translate(-50%,-50%)',
            zIndex:9991, width:'100%', maxWidth:460, padding:'0 16px',
            animation:'cardIn 0.4s cubic-bezier(0.175,0.885,0.32,1.275)',
          }}>
            <div style={{
              background:'linear-gradient(160deg,#064e3b 0%,#065f46 55%,#047857 100%)',
              borderRadius:20, padding:'36px 28px 28px',
              boxShadow:'0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.1)',
              display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center',
            }}>
              {/* Check icon */}
              <div style={{ position:'relative', width:76, height:76, marginBottom:20 }}>
                <div style={{
                  position:'absolute', inset:0, borderRadius:'50%',
                  background:'rgba(255,255,255,0.3)',
                  animation:'pulse 1.8s ease-out infinite',
                }} />
                <div style={{
                  width:76, height:76, borderRadius:'50%',
                  background:'rgba(255,255,255,0.15)',
                  border:'2.5px solid rgba(255,255,255,0.8)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  animation:'checkIn 0.45s cubic-bezier(0.175,0.885,0.32,1.275) 0.15s both',
                }}>
                  <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
                    <path d="M7 17l7 7 13-13" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>

              <h2 style={{ color:'white', fontSize:24, fontWeight:800, marginBottom:6 }}>Booking Confirmed! 🎉</h2>
              <p style={{ color:'rgba(255,255,255,0.7)', fontSize:14, marginBottom:24 }}>Your session has been scheduled successfully</p>

              {/* Details */}
              <div style={{
                width:'100%', background:'rgba(0,0,0,0.2)',
                border:'1px solid rgba(255,255,255,0.12)', borderRadius:12,
                overflow:'hidden', marginBottom:20,
              }}>
                <div style={{
                  padding:'10px 18px', background:'rgba(0,0,0,0.15)',
                  borderBottom:'1px solid rgba(255,255,255,0.1)',
                  display:'flex', justifyContent:'space-between', alignItems:'center',
                }}>
                  <span style={{ color:'rgba(255,255,255,0.5)', fontSize:11, textTransform:'uppercase', letterSpacing:'0.08em' }}>Reference</span>
                  <span style={{ color:'white', fontFamily:'monospace', fontSize:13, fontWeight:700 }}>{bookingResult.bookingReference}</span>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr' }}>
                  {[
                    { label:'Expert', value: expert?.name },
                    { label:'Date', value: formatDateLong(bookingResult.date) },
                    { label:'Time', value: bookingResult.time },
                    { label:'Status', value: bookingResult.status },
                  ].map(({ label, value }, i) => (
                    <div key={label} style={{
                      padding:'12px 18px',
                      borderRight: i % 2 === 0 ? '1px solid rgba(255,255,255,0.1)' : 'none',
                      borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.1)' : 'none',
                    }}>
                      <div style={{ color:'rgba(255,255,255,0.45)', fontSize:10, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:3 }}>{label}</div>
                      <div style={{ color:'white', fontWeight:600, fontSize:13 }}>{value}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display:'flex', gap:10, width:'100%' }}>
                <button onClick={() => navigate('/my-bookings')} style={{
                  flex:1, background:'white', color:'#065f46', border:'none',
                  padding:'12px', borderRadius:10, fontWeight:700, fontSize:14, cursor:'pointer',
                }}>View My Bookings</button>
                <button onClick={() => { setBookingResult(null); setShowBooking(false); setSelectedSlot(null); }} style={{
                  flex:1, background:'rgba(255,255,255,0.12)', color:'white',
                  border:'1px solid rgba(255,255,255,0.25)', padding:'12px',
                  borderRadius:10, fontWeight:600, fontSize:14, cursor:'pointer',
                }}>Book Another</button>
              </div>
            </div>
          </div>
        </>
      )}
      <div className="container">
        {/* Back */}
        <button className="back-btn" onClick={() => navigate('/')}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          All Experts
        </button>

        <div className="detail-layout">
          {/* Left: Profile */}
          <aside className="detail-sidebar">
            <div className="card profile-card">
              <div className="profile-banner" />
              <div className="profile-content">
                <img
                  src={expert.avatar || `https://i.pravatar.cc/300?u=${expert._id}`}
                  alt={expert.name}
                  className="profile-avatar"
                  onError={(e) => { e.target.src = `https://i.pravatar.cc/300?u=${expert._id}`; }}
                />
                <span className={`badge badge-${categoryClass}`}>{expert.category}</span>
                <h1 className="profile-name">{expert.name}</h1>
                <p className="profile-spec">{expert.specialization}</p>

                <div className="profile-stats">
                  <div className="pstat">
                    <div className="pstat-value">{expert.rating.toFixed(1)}</div>
                    <div className="stars">{renderStars(expert.rating)}</div>
                    <div className="pstat-label">{expert.reviewCount} reviews</div>
                  </div>
                  <div className="pstat-divider" />
                  <div className="pstat">
                    <div className="pstat-value">{expert.experience}</div>
                    <div className="pstat-label">years exp</div>
                  </div>
                  <div className="pstat-divider" />
                  <div className="pstat">
                    <div className="pstat-value">${expert.hourlyRate}</div>
                    <div className="pstat-label">per hour</div>
                  </div>
                </div>

                <div className="divider" />
                <p className="profile-bio">{expert.bio}</p>

                {expert.tags && (
                  <div className="profile-tags">
                    {expert.tags.map((tag) => (
                      <span key={tag} className="tag">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </aside>

          {/* Right: Booking */}
          <main className="detail-main">
            {/* Real-time indicator */}
            <div className="realtime-bar">
              <div className="realtime-indicator">
                <span className="live-dot" style={{ background: '#34d399' }} />
                <span>Live availability</span>
              </div>
              {realtimeUpdates.length > 0 && (
                <div className="realtime-alert">
                  <span>⚡</span>
                  <span>Slot {realtimeUpdates[0].time} on {formatDate(realtimeUpdates[0].date)} was just booked</span>
                </div>
              )}
            </div>

            {/* Date Selector */}
            <div className="section-header">
              <h2 className="section-title">Available Sessions</h2>
              <p className="section-subtitle">Select a date and time to book your session</p>
            </div>

            {sortedDates.length === 0 ? (
              <div className="no-slots">
                <p>No available slots at the moment. Please check back later.</p>
              </div>
            ) : (
              <>
                <div className="date-tabs">
                  {sortedDates.map((date) => {
                    const dateSlots = slots[date] || [];
                    const availableCount = dateSlots.filter((s) => !s.isBooked).length;
                    return (
                      <button
                        key={date}
                        className={`date-tab ${selectedDate === date ? 'active' : ''}`}
                        onClick={() => { setSelectedDate(date); setSelectedSlot(null); }}
                      >
                        <span className="date-tab-label">{formatDate(date)}</span>
                        <span className={`date-tab-count ${availableCount === 0 ? 'full' : ''}`}>
                          {availableCount} open
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Time Slots */}
                {selectedDate && (
                  <div className="slots-container">
                    <div className="slots-grid">
                      {currentSlots.map((slot) => (
                        <button
                          key={slot._id}
                          className={`slot-btn 
                            ${slot.isBooked ? 'booked' : 'available'}
                            ${selectedSlot?._id === slot._id ? 'selected' : ''}
                          `}
                          disabled={slot.isBooked}
                          onClick={() => setSelectedSlot(slot.isBooked ? null : slot)}
                        >
                          <span className="slot-time">{slot.time}</span>
                          <span className="slot-status">
                            {slot.isBooked ? 'Booked' : '1 hr'}
                          </span>
                        </button>
                      ))}
                    </div>

                    <div className="slot-legend">
                      <div className="legend-item">
                        <div className="legend-dot available-dot" />
                        <span>Available</span>
                      </div>
                      <div className="legend-item">
                        <div className="legend-dot selected-dot" />
                        <span>Selected</span>
                      </div>
                      <div className="legend-item">
                        <div className="legend-dot booked-dot" />
                        <span>Booked</span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* CTA */}
            {selectedSlot && !showBooking && (
              <div className="selected-slot-cta">
                <div className="selected-info">
                  <div className="selected-icon">📅</div>
                  <div>
                    <div className="selected-title">Session Selected</div>
                    <div className="selected-detail">
                      {formatDate(selectedDate)} at {selectedSlot.time} · 1 hour · ${expert.hourlyRate}
                    </div>
                  </div>
                </div>
                <button className="btn btn-primary" onClick={() => setShowBooking(true)}>
                  Continue to Book →
                </button>
              </div>
            )}

            {/* Booking Form */}
            {showBooking && selectedSlot && (
              <BookingForm
                expert={expert}
                selectedDate={selectedDate}
                selectedSlot={selectedSlot}
                onSuccess={handleBookingSuccess}
                onCancel={() => setShowBooking(false)}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default ExpertDetailPage;