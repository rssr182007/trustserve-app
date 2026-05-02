import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../api/supabaseClient';
import { useAuth } from '../lib/AuthContext';

function RoleSelect() {
  const [selectedRole, setSelectedRole] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleContinue = async () => {
    if (!selectedRole || !phoneNumber || phoneNumber.length < 10) {
      alert('Please select role and enter valid phone number');
      return;
    }

    setLoading(true);

    try {
      // Search for user by phone number
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('phone', phoneNumber)
        .maybeSingle();

      if (error) {
        console.error('Database error:', error);
        alert('Database error. Please try again.');
        setLoading(false);
        return;
      }

      if (!profile) {
        // NEW USER - Redirect to Sign Up page
        navigate('/signup', { state: { role: selectedRole, phone: phoneNumber } });
        setLoading(false);
        return;
      }

      // Check role matches
      if (profile.role !== selectedRole) {
        alert(`This phone number is registered as a ${profile.role}. Please select the correct role.`);
        setLoading(false);
        return;
      }

      // EXISTING USER - Direct login
      const userData = {
        id: profile.id,
        phone: profile.phone,
        email: profile.email || `${profile.phone}@example.com`,
        full_name: profile.full_name,
      };
      
      login(userData, selectedRole);
      
      if (selectedRole === 'customer') {
        navigate('/home');
      } else {
        navigate('/provider/home');
      }
    } catch (err) {
      console.error('Login error:', err);
      alert('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-md p-6 max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-6">Welcome to TrustServe</h1>
        
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">I am a:</label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setSelectedRole('customer')}
              className={`p-4 border-2 rounded-lg text-center transition-all ${
                selectedRole === 'customer' 
                  ? 'border-blue-600 bg-blue-50 text-blue-600' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <span className="text-xl mb-1 block">👤</span>
              <span className="font-medium">Customer</span>
              <span className="text-xs block text-gray-500">Need service</span>
            </button>
            
            <button
              type="button"
              onClick={() => setSelectedRole('provider')}
              className={`p-4 border-2 rounded-lg text-center transition-all ${
                selectedRole === 'provider' 
                  ? 'border-blue-600 bg-blue-50 text-blue-600' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <span className="text-xl mb-1 block">🔧</span>
              <span className="font-medium">Provider</span>
              <span className="text-xs block text-gray-500">Offer service</span>
            </button>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Phone Number</label>
          <input
            type="tel"
            placeholder="Enter 10-digit mobile number"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            maxLength={10}
          />
        </div>

        <button 
          onClick={handleContinue} 
          disabled={loading}
          className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
        >
          {loading ? 'Checking...' : 'Continue'}
        </button>
      </div>
    </div>
  );
}

export default RoleSelect;