import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../api/supabaseClient';
import { useAuth } from '../lib/AuthContext';
import { getActiveCities } from '../api/activeCities';
import { ArrowLeft, MapPin, Calendar, Clock, IndianRupee, Briefcase } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function PostJob() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [cities, setCities] = useState([]);
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    city: '',
    district: '',
    address: '',
    preferred_date: '',
    preferred_time: '',
    budget: '',
  });

  const categories = [
    { id: 'plumbing', name: 'Plumbing', icon: '🔧' },
    { id: 'electrical', name: 'Electrical', icon: '⚡' },
    { id: 'carpentry', name: 'Carpentry', icon: '🪚' },
    { id: 'painting', name: 'Painting', icon: '🎨' },
    { id: 'cleaning', name: 'Cleaning', icon: '🧹' },
    { id: 'appliance_repair', name: 'Appliance Repair', icon: '🔌' },
  ];

  useEffect(() => {
    fetchActiveCities();
  }, []);

  const fetchActiveCities = async () => {
    const activeCities = await getActiveCities();
    setCities(activeCities);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please login to post a job');
      navigate('/role-select');
      return;
    }

    if (!form.title || !form.category || !form.city || !form.preferred_date) {
      toast.error('Please fill all required fields');
      return;
    }

    setLoading(true);

    const jobData = {
      customer_id: user.id,
      customer_name: profile?.full_name || 'Customer',
      title: form.title,
      description: form.description,
      category: form.category,
      city: form.city,
      district: form.district,
      address: form.address,
      preferred_date: form.preferred_date,
      preferred_time: form.preferred_time,
      budget: parseFloat(form.budget) || 0,
      status: 'open',
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('service_requests')
      .insert([jobData])
      .select()
      .single();

    if (error) {
      console.error('Error posting job:', error);
      toast.error('Failed to post job. Please try again.');
    } else {
      toast.success('Job posted successfully! Providers will see your request.');
      navigate(`/job/${data.id}/offers`);
    }
    setLoading(false);
  };

  const citiesByDistrict = cities.reduce((acc, city) => {
    if (!acc[city.district]) acc[city.district] = [];
    acc[city.district].push(city);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white shadow-sm px-5 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Post a Service Request</h1>
            <p className="text-xs text-gray-500">Describe what you need</p>
          </div>
        </div>
      </div>

      <div className="px-5 pt-5">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
              <Briefcase className="w-4 h-4 text-blue-600" /> Service Title
            </label>
            <input
              type="text"
              placeholder="e.g., Need plumber for leaking pipe"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-all"
              required
            />
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
              <Briefcase className="w-4 h-4 text-blue-600" /> Service Category
            </label>
            <div className="grid grid-cols-2 gap-3">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setForm({ ...form, category: cat.id })}
                  className={`p-3 rounded-xl border-2 transition-all flex items-center gap-2 ${
                    form.category === cat.id
                      ? 'border-blue-600 bg-blue-50 text-blue-600'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <span className="text-xl">{cat.icon}</span>
                  <span className="text-sm font-medium">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-blue-600" /> Select City
            </label>
            <select
              value={form.city}
              onChange={(e) => {
                const selectedCity = cities.find(c => c.city_name === e.target.value);
                setForm({ 
                  ...form, 
                  city: e.target.value,
                  district: selectedCity?.district || ''
                });
              }}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-all"
              required
            >
              <option value="">Select your city</option>
              {Object.keys(citiesByDistrict).map(district => (
                <optgroup key={district} label={`📍 ${district} District`}>
                  {citiesByDistrict[district].map(city => (
                    <option key={city.id} value={city.city_name}>
                      {city.city_name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            {cities.length === 0 && (
              <p className="text-xs text-amber-600 mt-2">
                Loading active cities... If none appear, please contact admin.
              </p>
            )}
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-blue-600" /> Complete Address
            </label>
            <textarea
              placeholder="Street, landmark, pincode"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-all min-h-[80px]"
              required
            />
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-blue-600" /> Preferred Date
            </label>
            <input
              type="date"
              value={form.preferred_date}
              onChange={(e) => setForm({ ...form, preferred_date: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-all"
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-blue-600" /> Preferred Time
            </label>
            <select
              value={form.preferred_time}
              onChange={(e) => setForm({ ...form, preferred_time: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-all"
            >
              <option value="">Select time slot</option>
              <option value="09:00 AM - 11:00 AM">09:00 AM - 11:00 AM</option>
              <option value="11:00 AM - 01:00 PM">11:00 AM - 01:00 PM</option>
              <option value="02:00 PM - 04:00 PM">02:00 PM - 04:00 PM</option>
              <option value="04:00 PM - 06:00 PM">04:00 PM - 06:00 PM</option>
              <option value="06:00 PM - 08:00 PM">06:00 PM - 08:00 PM</option>
            </select>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
              <IndianRupee className="w-4 h-4 text-blue-600" /> Budget (Optional)
            </label>
            <input
              type="number"
              placeholder="Enter your expected budget"
              value={form.budget}
              onChange={(e) => setForm({ ...form, budget: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-all"
            />
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
              <Briefcase className="w-4 h-4 text-blue-600" /> Problem Description
            </label>
            <textarea
              placeholder="Describe your problem in detail..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-all min-h-[120px]"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Posting...' : 'Post Job Request →'}
          </button>
        </form>
      </div>
    </div>
  );
}