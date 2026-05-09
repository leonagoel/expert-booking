import React from 'react';
import './Skeleton.css';

export const ExpertCardSkeleton = () => (
  <div className="expert-card-skeleton card">
    <div className="skeleton-top">
      <div className="skeleton skeleton-avatar" />
      <div className="skeleton-meta">
        <div className="skeleton skeleton-badge" />
        <div className="skeleton skeleton-rate" />
      </div>
    </div>
    <div className="skeleton-body">
      <div className="skeleton skeleton-name" />
      <div className="skeleton skeleton-spec" />
      <div className="skeleton skeleton-stats" />
      <div className="skeleton-tags">
        <div className="skeleton skeleton-tag" />
        <div className="skeleton skeleton-tag" />
        <div className="skeleton skeleton-tag" />
      </div>
    </div>
    <div className="skeleton-footer">
      <div className="skeleton skeleton-btn" />
    </div>
  </div>
);

export default ExpertCardSkeleton;
