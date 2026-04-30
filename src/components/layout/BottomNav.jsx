import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, CalendarCheck, MessageSquareWarning, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../lib/AuthContext';

export default function BottomNav() {
  const location = useLocation();
  const { role } = useAuth();

  const customerNavItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/bookings', icon: CalendarCheck, label: 'Bookings' },
    { path: '/complaints', icon: MessageSquareWarning, label: 'Complaints' },
    { path: '/profile', icon: User, label: 'Profile' },
  ];

  const providerNavItems = [
    { path: '/provider/home', icon: Home, label: 'Home' },
    { path: '/provider/bookings', icon: CalendarCheck, label: 'Jobs' },
    { path: '/profile', icon: User, label: 'Profile' },
  ];

  const navItems = role === 'provider' ? providerNavItems : customerNavItems;
  const hideNavPaths = ['/role-select', '/provider/job/', '/track/'];
  const shouldHide = hideNavPaths.some(path => location.pathname.includes(path));
  
  if (shouldHide) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-t border-gray-100 pb-2">
      <div className="max-w-lg mx-auto flex items-center justify-around py-2 px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link key={item.path} to={item.path} className="relative flex flex-col items-center gap-0.5 py-1 px-4">
              {isActive && <motion.div layoutId="nav-indicator" className="absolute -top-2 w-8 h-1 bg-blue-600 rounded-full" transition={{ type: 'spring', stiffness: 400, damping: 30 }} />}
              <Icon className={'w-5 h-5 transition-colors ' + (isActive ? 'text-blue-600' : 'text-gray-400')} />
              <span className={'text-[10px] font-medium transition-colors ' + (isActive ? 'text-blue-600' : 'text-gray-400')}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}