import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';

function RoleSelect() {
  const [selectedRole, setSelectedRole] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  // Hardcoded valid users for testing
  const validUsers = {
    '9876543210': { 
      role: 'provider', 
      name: 'Rajesh Kumar',
      id: 'd15423e7-84ad-4d3e-a279-0e8e71ba65cd'
    },
    '9876543211': { 
      role: 'customer', 
      name: 'Test Customer',
      id: '5a295867-d2c2-4c37-a6e1-62ce40c45a7e'
    }
  };

  const handleContinue = () => {
    if (!selectedRole) {
      alert('Please select a role');
      return;
    }

    if (!phoneNumber || phoneNumber.length !== 10) {
      alert('Please enter a valid 10-digit phone number');
      return;
    }

    const user = validUsers[phoneNumber];
    
    if (!user) {
      alert('Phone number not found. Use:\nProvider: 9876543210\nCustomer: 9876543211');
      return;
    }

    if (user.role !== selectedRole) {
      alert(`This phone number is for a ${user.role}. Please select the ${user.role} role.`);
      return;
    }

    const userData = {
      id: user.id,
      phone: phoneNumber,
      email: `${phoneNumber}@example.com`,
      full_name: user.name,
    };
    
    login(userData, selectedRole);
    
    if (selectedRole === 'customer') {
      navigate('/home');
    } else {
      navigate('/provider/home');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-md p-6 max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-6">Welcome to Service App</h1>
        
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">I am a:</label>
          <div className="grid grid-cols-2 gap-4">
            <button
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
          className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Continue
        </button>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center mb-2">Quick Login:</p>
          <div className="flex gap-2">
            <button 
              onClick={() => {
                setSelectedRole('customer');
                setPhoneNumber('9876543211');
              }}
              className="flex-1 text-xs bg-blue-50 text-blue-600 py-2 rounded hover:bg-blue-100"
            >
              Customer (9876543211)
            </button>
            <button 
              onClick={() => {
                setSelectedRole('provider');
                setPhoneNumber('9876543210');
              }}
              className="flex-1 text-xs bg-green-50 text-green-600 py-2 rounded hover:bg-green-100"
            >
              Provider (9876543210)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RoleSelect;