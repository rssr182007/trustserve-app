import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, loading, role } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-6 h-6 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/role-select" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    // User role not authorized
    if (role === 'provider') {
      return <Navigate to="/provider/home" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return children;
}
