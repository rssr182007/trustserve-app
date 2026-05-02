import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../api/supabaseClient';
import { useAuth } from '../lib/AuthContext';
import { ArrowLeft, User, MapPin, Phone } from 'lucide-react';
import { toast } from 'sonner';

export default function SignUp() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    city: '',
    address: '',
  });

  // Get role and phone from navigation state
  const role = location.state?.role || 'customer';
  const phoneNumber = location.state?.phone || '';

  React.useEffect(() => {
    if (phoneNumber) {
      setForm(prev => ({ ...prev, phone: phoneNumber }));
    }
  }, [phoneNumber]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.full_name || !form.phone || !form.city) {
      toast.error('Please fill all required fields');
      return;
    }

    setLoading(true);

    try {
      // Generate a UUID for the new user
      const tempId = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();
      
      // Insert into user_profiles
      const { data, error } = await supabase
        .from('user_profiles')
        .insert([{
          id: tempId,
          full_name: form.full_name,
          phone: form.phone,
          city: form.city,
          address: form.address,
          role: role,
          is_verified: false
        }])
        .select()
        .single();

      if (error) throw error;

      // Login the user
      const userData = {
        id: data.id,
        phone: data.phone,
        email: `${data.phone}@example.com`,
        full_name: data.full_name,
      };
      
      login(userData, role);
      
      toast.success('Account created successfully!');
      
      // Redirect based on role
      if (role === 'customer') {
        navigate('/home');
      } else {
        navigate('/provider/setup');
      }
      
    } catch (error) {
      console.error('Signup error:', error);
      toast.error('Failed to create account: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg max-w-md w-full p-6">
        <button onClick={() => navigate(-1)} className="mb-4 text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-5 h-5" />
        </button>
        
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <User className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Create Account</h1>
          <p className="text-sm text-gray-500 mt-1">
            {role === 'customer' ? 'Sign up as a Customer' : 'Sign up as a Service Provider'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Full Name *</label>
            <input
              type="text"
              placeholder="Enter your full name"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block flex items-center gap-2">
              <Phone className="w-4 h-4" /> Phone Number *
            </label>
            <input
              type="tel"
              placeholder="10-digit mobile number"
              value={form.phone}
              readOnly
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block flex items-center gap-2">
              <MapPin className="w-4 h-4" /> City *
            </label>
            <input
              type="text"
              placeholder="Enter your city"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Full Address</label>
            <textarea
              placeholder="Enter your complete address"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 mt-4"
          >
            {loading ? 'Creating Account...' : 'Sign Up →'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-4">
          By signing up, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}