import React, { useState, useEffect } from 'react';
import { supabase } from '../api/supabaseClient';
import { useAuth } from '../lib/AuthContext';
import { User, Mail, CalendarCheck, MessageSquareWarning, LogOut, ChevronRight, Shield, HelpCircle, Settings, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function Profile() {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async () => {
    setLoading(true);
    const { data: bookingsData } = await supabase
      .from('bookings')
      .select('*')
      .eq('customer_id', user.id);
    
    if (bookingsData) setBookings(bookingsData);

    const { data: complaintsData } = await supabase
      .from('complaints')
      .select('*')
      .eq('user_id', user.id);
    
    if (complaintsData) setComplaints(complaintsData);
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/role-select');
  };

  const completedBookings = bookings.filter((b) => b.status === 'completed').length;
  const userRole = profile?.role || 'customer';
  const userName = profile?.full_name || user?.email?.split('@')[0] || 'User';
  const userEmail = user?.email || 'Not set';

  const menuItems = [
    { icon: CalendarCheck, label: 'My Bookings', path: '/bookings', count: bookings.length },
    { icon: MessageSquareWarning, label: 'Complaints', path: '/complaints', count: complaints.length },
    { icon: Star, label: 'My Reviews', path: '/reviews', count: 0 },
    { icon: HelpCircle, label: 'Help & Support', path: '/support', count: null },
    { icon: Settings, label: 'Settings', path: '/settings', count: null },
  ];

  if (userRole === 'provider') {
    menuItems.unshift(
      { icon: CalendarCheck, label: 'Provider Dashboard', path: '/provider/home', count: null },
      { icon: Star, label: 'My Earnings', path: '/provider/earnings', count: null }
    );
  }

  return (
    <div className="px-5 pt-6 space-y-5">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center"
      >
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center mx-auto mb-3">
          <span className="text-2xl font-bold text-white">{userName.charAt(0).toUpperCase()}</span>
        </div>
        <h1 className="font-heading text-lg font-bold">{userName}</h1>
        <div className="flex items-center justify-center gap-1.5 mt-1 text-sm text-gray-500">
          <Mail className="w-3.5 h-3.5" />
          <span>{userEmail}</span>
        </div>
        <div className="flex items-center justify-center gap-1 mt-2">
          <Shield className="w-3.5 h-3.5 text-green-600" />
          <span className="text-xs text-green-600 font-medium capitalize">{userRole}</span>
        </div>
      </motion.div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl p-3 text-center border border-gray-100 shadow-sm">
          <p className="text-xl font-bold text-blue-600">{bookings.length}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">Total Bookings</p>
        </div>
        <div className="bg-white rounded-xl p-3 text-center border border-gray-100 shadow-sm">
          <p className="text-xl font-bold text-blue-600">{completedBookings}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">Completed</p>
        </div>
        <div className="bg-white rounded-xl p-3 text-center border border-gray-100 shadow-sm">
          <p className="text-xl font-bold text-blue-600">{complaints.length}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">Complaints</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {menuItems.map((item, i, arr) => (
          <Link
            key={item.label}
            to={item.path}
            className={`flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors ${
              i !== arr.length - 1 ? 'border-b border-gray-100' : ''
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <item.icon className="w-4 h-4 text-blue-600" />
            </div>
            <span className="flex-1 text-sm font-medium text-gray-800">{item.label}</span>
            {item.count !== null && item.count !== undefined && (
              <span className="text-xs text-gray-500">{item.count}</span>
            )}
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </Link>
        ))}
      </div>

      <button
        className="w-full h-11 rounded-xl gap-2 border border-red-200 text-red-600 hover:bg-red-50 transition-colors flex items-center justify-center"
        onClick={handleLogout}
      >
        <LogOut className="w-4 h-4" /> Sign Out
      </button>

      <div className="h-4" />
    </div>
  );
}