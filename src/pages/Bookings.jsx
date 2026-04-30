import React, { useState, useEffect } from 'react';
import { supabase } from '../api/supabaseClient';
import { useAuth } from '../lib/AuthContext';
import { CalendarCheck } from 'lucide-react';
import BookingCard from '../components/bookings/BookingCard';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function Bookings() {
  const [tab, setTab] = useState('all');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchBookings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('bookings')
      .select('*, provider:provider_id (id, hourly_rate, user_profiles (full_name, selfie_url))')
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setBookings(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      fetchBookings();
    }
  }, [user]);

  const filtered = tab === 'all' ? bookings : bookings.filter((b) => b.status === tab);

  const getTabCount = (status) => {
    if (status === 'all') return bookings.length;
    return bookings.filter((b) => b.status === status).length;
  };

  return (
    <div className="px-5 pt-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
          <CalendarCheck className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h1 className="font-heading text-xl font-bold">My Bookings</h1>
          <p className="text-xs text-gray-500">{bookings.length} total bookings</p>
        </div>
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map((status) => (
          <button
            key={status}
            onClick={() => setTab(status)}
            className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${
              tab === status 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
            <span className="ml-1 text-[10px] opacity-70">({getTabCount(status)})</span>
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
          <CalendarCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No bookings yet</p>
          <p className="text-xs text-gray-400 mt-1">Book a service to get started</p>
        </motion.div>
      )}

      <div className="space-y-3">
        {filtered.map((b, i) => (
          <Link key={b.id} to={`/track/${b.id}`}>
            <BookingCard booking={b} index={i} />
          </Link>
        ))}
      </div>

      <div className="h-4" />
    </div>
  );
}