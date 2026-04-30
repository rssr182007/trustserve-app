import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export default function PageNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-5">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Page Not Found</h2>
        <p className="text-gray-500 text-sm mb-6">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg"
        >
          <Home className="w-4 h-4" /> Go Home
        </Link>
      </div>
    </div>
  );
}
