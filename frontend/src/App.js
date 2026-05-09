import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import ErrorBoundary from './components/ErrorBoundary';
import { SocketProvider } from './context/SocketContext';
import './index.css';

const ExpertsPage = lazy(() => import('./pages/ExpertsPage'));
const ExpertDetailPage = lazy(() => import('./pages/ExpertDetailPage'));
const MyBookingsPage = lazy(() => import('./pages/MyBookingsPage'));

const LoadingFallback = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: 16 }}>
    <div className="spinner" />
    <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Loading...</p>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <SocketProvider>
        <ScrollToTop />
        <Navbar />
        <ErrorBoundary>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/" element={<ExpertsPage />} />
              <Route path="/experts/:id" element={<ExpertDetailPage />} />
              <Route path="/my-bookings" element={<MyBookingsPage />} />
              <Route path="*" element={
                <div style={{ textAlign: 'center', padding: '200px 24px' }}>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 48, marginBottom: 16 }}>404</h2>
                  <p style={{ color: 'var(--text-secondary)' }}>Page not found</p>
                </div>
              } />
            </Routes>
          </Suspense>
        </ErrorBoundary>
        <Footer />
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#34d399', secondary: 'white' } },
            error: { iconTheme: { primary: '#f43f5e', secondary: 'white' } },
          }}
        />
      </SocketProvider>
    </BrowserRouter>
  );
}

export default App;
