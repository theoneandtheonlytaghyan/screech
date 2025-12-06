/**
 * Main App Component
 * Handles routing and layout
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import LoadingSpinner from './components/common/LoadingSpinner';

// Pages
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import NotificationsPage from './pages/NotificationsPage';
import MessagesPage from './pages/MessagesPage';
import ProfilePage from './pages/ProfilePage';
import HashtagPage from './pages/HashtagPage';
import AuthPage from './pages/AuthPage';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-screech-darker flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/auth"
        element={user ? <Navigate to="/" replace /> : <AuthPage />}
      />

      {/* Protected Routes */}
      <Route
        path="/"
        element={user ? <Layout><HomePage /></Layout> : <Navigate to="/auth" replace />}
      />
      <Route
        path="/search"
        element={user ? <Layout><SearchPage /></Layout> : <Navigate to="/auth" replace />}
      />
      <Route
        path="/notifications"
        element={user ? <Layout><NotificationsPage /></Layout> : <Navigate to="/auth" replace />}
      />
      <Route
        path="/messages"
        element={user ? <Layout><MessagesPage /></Layout> : <Navigate to="/auth" replace />}
      />
      <Route
        path="/messages/:conversationId"
        element={user ? <Layout><MessagesPage /></Layout> : <Navigate to="/auth" replace />}
      />
      <Route
        path="/profile/:userId"
        element={user ? <Layout><ProfilePage /></Layout> : <Navigate to="/auth" replace />}
      />
      <Route
        path="/hashtag/:hashtag"
        element={user ? <Layout><HashtagPage /></Layout> : <Navigate to="/auth" replace />}
      />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;