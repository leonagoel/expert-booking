import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="footer-left">
          <Link to="/" className="footer-logo">
            <div className="footer-logo-icon">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="9" stroke="#6366f1" strokeWidth="1.5"/>
                <path d="M6 10l3 3 5-5" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span>ExpertConnect</span>
          </Link>
          <p className="footer-tagline">
            Book sessions with world-class experts. Real-time availability.
          </p>
        </div>

        <div className="footer-links">
          <div className="footer-col">
            <div className="footer-col-title">Platform</div>
            <Link to="/" className="footer-link">Browse Experts</Link>
            <Link to="/my-bookings" className="footer-link">My Bookings</Link>
          </div>
          <div className="footer-col">
            <div className="footer-col-title">Categories</div>
            <span className="footer-link-text">Technology</span>
            <span className="footer-link-text">Finance</span>
            <span className="footer-link-text">Design</span>
            <span className="footer-link-text">Health</span>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container footer-bottom-inner">
          <span>© {year} ExpertConnect. Built with React, Node.js &amp; MongoDB.</span>
          <div className="footer-tech-badges">
            <span className="tech-badge">Socket.io</span>
            <span className="tech-badge">Express</span>
            <span className="tech-badge">MongoDB</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
