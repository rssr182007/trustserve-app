import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';

export default function UserNotRegisteredError() {
  return (
    <div className="min-h-screen flex items-center justify-center px-5">
      <div className="text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        <h1 className="text-xl font-bold text-gray-800 mb-2">User Not Registered</h1>
        <p className="text-gray-500 text-sm mb-6">
          We couldn't find your account. Please register or contact support.
        </p>
        <Link 
          to="/role-select" 
          className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg"
        >
          Go to Login
        </Link>
      </div>
    </div>
  );
}
