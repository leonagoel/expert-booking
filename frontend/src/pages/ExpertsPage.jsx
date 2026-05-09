import React, { useState, useEffect, useCallback } from 'react';
import { expertAPI } from '../utils/api';
import ExpertCard from '../components/ExpertCard';
import { ExpertCardSkeleton } from '../components/Skeleton';
import './ExpertsPage.css';

const CATEGORIES = ['All', 'Technology', 'Finance', 'Design', 'Health', 'Legal', 'Marketing'];
const SORT_OPTIONS = [
  { value: 'rating', label: 'Top Rated' },
  { value: 'experience', label: 'Most Experienced' },
  { value: 'hourlyRate', label: 'Price: Low to High', order: 'asc' },
  { value: 'reviewCount', label: 'Most Reviewed' },
];

const ExpertsPage = () => {
  const [experts, setExperts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [category, setCategory] = useState('All');
  const [sortBy, setSortBy] = useState('rating');
  const [pagination, setPagination] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchExperts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const sortOption = SORT_OPTIONS.find((o) => o.value === sortBy);
      const res = await expertAPI.getAll({
        page: currentPage,
        limit: 6,
        category: category !== 'All' ? category : undefined,
        search: search || undefined,
        sortBy,
        order: sortOption?.order || 'desc',
      });
      setExperts(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      setError(err.friendlyMessage || 'Failed to load experts');
    } finally {
      setLoading(false);
    }
  }, [currentPage, category, search, sortBy]);

  useEffect(() => {
    fetchExperts();
  }, [fetchExperts]);

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [category, search, sortBy]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleCategoryChange = (cat) => {
    setCategory(cat);
    setCurrentPage(1);
  };

  return (
    <div className="experts-page page-enter">
      {/* Hero Section */}
      <div className="experts-hero">
        <div className="hero-bg">
          <div className="hero-orb hero-orb-1" />
          <div className="hero-orb hero-orb-2" />
          <div className="hero-grid" />
        </div>
        <div className="container">
          <div className="hero-badge">
            <span className="live-dot" />
            <span>Live Booking Available</span>
          </div>
          <h1 className="hero-title">
            Connect with the<br />
            <span className="hero-accent">World's Best Experts</span>
          </h1>
          <p className="hero-subtitle">
            Book 1:1 sessions with vetted professionals across tech, finance, design, health, law & marketing.
            Real-time availability. Zero back-and-forth.
          </p>

          {/* Search Bar */}
          <div className="search-bar">
            <svg className="search-icon" width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M13 13l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <input
              type="text"
              placeholder="Search by name, skill, or specialization..."
              className="search-input"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            {searchInput && (
              <button className="search-clear" onClick={() => { setSearchInput(''); setSearch(''); }}>
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="container experts-body">
        {/* Filters */}
        <div className="filters-bar">
          <div className="category-filters">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className={`filter-chip ${category === cat ? 'active' : ''}`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="sort-wrapper">
            <select
              className="sort-select form-input"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Results Count */}
        {!loading && pagination && (
          <div className="results-count">
            <span>{pagination.totalExperts} expert{pagination.totalExperts !== 1 ? 's' : ''} found</span>
            {(search || category !== 'All') && (
              <button
                className="clear-filters"
                onClick={() => { setSearchInput(''); setSearch(''); setCategory('All'); }}
              >
                Clear filters ✕
              </button>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="error-state">
            <div className="error-icon">⚠</div>
            <h3>Something went wrong</h3>
            <p>{error}</p>
            <button className="btn btn-ghost" onClick={fetchExperts}>Try Again</button>
          </div>
        )}

        {/* Grid */}
        <div className="experts-grid">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <ExpertCardSkeleton key={i} />)
            : experts.map((expert, i) => <ExpertCard key={expert._id} expert={expert} index={i} />)
          }
        </div>

        {/* Empty State */}
        {!loading && !error && experts.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">◎</div>
            <h3>No experts found</h3>
            <p>Try adjusting your search or filters</p>
            <button
              className="btn btn-ghost"
              onClick={() => { setSearchInput(''); setSearch(''); setCategory('All'); }}
            >
              Clear all filters
            </button>
          </div>
        )}

        {/* Pagination */}
        {!loading && pagination && pagination.totalPages > 1 && (
          <div className="pagination">
            <button
              className="btn btn-ghost"
              disabled={!pagination.hasPrevPage}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              ← Previous
            </button>
            <div className="page-numbers">
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  className={`page-num ${currentPage === page ? 'active' : ''}`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}
            </div>
            <button
              className="btn btn-ghost"
              disabled={!pagination.hasNextPage}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpertsPage;
