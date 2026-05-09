import React from 'react';
import { useNavigate } from 'react-router-dom';
import './ExpertCard.css';

const CATEGORY_CLASS = {
  Technology: 'tech',
  Finance: 'finance',
  Design: 'design',
  Health: 'health',
  Legal: 'legal',
  Marketing: 'marketing',
};

const renderStars = (rating) => {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  return (
    <div className="stars">
      {Array.from({ length: 5 }, (_, i) => {
        if (i < full) return <span key={i}>★</span>;
        if (i === full && half) return <span key={i} style={{ opacity: 0.5 }}>★</span>;
        return <span key={i} style={{ opacity: 0.2 }}>★</span>;
      })}
    </div>
  );
};

const ExpertCard = ({ expert, index }) => {
  const navigate = useNavigate();
  const categoryClass = CATEGORY_CLASS[expert.category] || 'tech';

  return (
    <article
      className="expert-card card"
      onClick={() => navigate(`/experts/${expert._id}`)}
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <div className="expert-card-top">
        <div className="expert-avatar-wrapper">
          <img
            src={expert.avatar || `https://i.pravatar.cc/300?u=${expert._id}`}
            alt={expert.name}
            className="expert-avatar"
            onError={(e) => { e.target.src = `https://i.pravatar.cc/300?u=${expert._id}`; }}
          />
          <div className="avatar-glow" />
        </div>
        <div className="expert-meta">
          <span className={`badge badge-${categoryClass}`}>{expert.category}</span>
          <div className="expert-rate">${expert.hourlyRate}<span>/hr</span></div>
        </div>
      </div>

      <div className="expert-card-body">
        <h3 className="expert-name">{expert.name}</h3>
        <p className="expert-specialization">{expert.specialization}</p>

        <div className="expert-stats">
          <div className="stat">
            {renderStars(expert.rating)}
            <span className="stat-value">{expert.rating.toFixed(1)}</span>
            <span className="stat-label">({expert.reviewCount})</span>
          </div>
          <div className="stat">
            <span className="stat-icon">◈</span>
            <span className="stat-value">{expert.experience}y</span>
            <span className="stat-label">exp</span>
          </div>
        </div>

        {expert.tags && expert.tags.length > 0 && (
          <div className="expert-tags">
            {expert.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="tag">{tag}</span>
            ))}
            {expert.tags.length > 3 && (
              <span className="tag">+{expert.tags.length - 3}</span>
            )}
          </div>
        )}
      </div>

      <div className="expert-card-footer">
        <button className="btn btn-primary book-btn">
          Book Session
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </article>
  );
};

export default ExpertCard;
