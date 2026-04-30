import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { Search, Bell, MapPin, ChevronRight, Shield, Briefcase, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();
  const { profile } = useAuth();

  return (
    <div className="px-5 pt-6 space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <MapPin className="w-3 h-3" /> Current Location
          </p>
          <h1 className="font-heading text-xl font-bold mt-0.5">
            Hi, {profile?.full_name?.split(' ')[0] || 'there'} 👋
          </h1>
        </div>
        <Link to="/profile" className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
          <Bell className="w-5 h-5 text-blue-600" />
        </Link>
      </div>

      {/* Main Action Buttons */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => navigate('/post-job')}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-4 text-white shadow-lg hover:shadow-xl transition-all"
        >
          <Briefcase className="w-8 h-8 mb-2" />
          <p className="font-bold text-lg">Post a Job</p>
          <p className="text-xs opacity-90">Get quotes from providers</p>
        </button>
        
        <button
          onClick={() => navigate('/my-requests')}
          className="bg-white border-2 border-blue-200 rounded-2xl p-4 text-blue-600 shadow-sm hover:shadow-md transition-all"
        >
          <FileText className="w-8 h-8 mb-2" />
          <p className="font-bold text-lg">My Requests</p>
          <p className="text-xs text-gray-500">Track your jobs</p>
        </button>
      </div>

      {/* Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 p-5 text-white"
      >
        <div className="relative z-10">
          <div className="flex items-center gap-1.5 mb-1">
            <Shield className="w-4 h-4" />
            <span className="text-xs font-medium opacity-90">Verified Professionals</span>
          </div>
          <h2 className="font-heading text-lg font-bold">Get 20% off on first booking</h2>
          <p className="text-xs opacity-80 mt-1">Book any service and get instant discount</p>
          <button
            onClick={() => navigate('/post-job')}
            className="inline-flex items-center gap-1 mt-3 text-xs font-semibold bg-white/20 backdrop-blur rounded-full px-3 py-1.5"
          >
            Post a Job Now <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
        <div className="absolute right-8 bottom-0 w-20 h-20 bg-white/5 rounded-full translate-y-6" />
      </motion.div>

      {/* Quick Service Categories */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-heading font-semibold text-base">Quick Services</h2>
          <span className="text-xs text-blue-600 font-medium">See all</span>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {['plumbing', 'electrical', 'carpentry'].map((cat, i) => (
            <button
              key={cat}
              onClick={() => navigate('/post-job')}
              className="flex flex-col items-center gap-2 group"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200">
                <span className="text-2xl">
                  {cat === 'plumbing' && '🔧'}
                  {cat === 'electrical' && '⚡'}
                  {cat === 'carpentry' && '🪚'}
                </span>
              </div>
              <span className="text-xs font-medium text-gray-800 capitalize">{cat}</span>
            </button>
          ))}
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <h3 className="font-heading font-semibold text-sm mb-3">How It Works</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">1</div>
            <p className="text-sm">Post your service request</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">2</div>
            <p className="text-sm">Nearby providers send you quotes</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">3</div>
            <p className="text-sm">Choose the best offer and pay 20%</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">4</div>
            <p className="text-sm">Provider arrives, verify, pay balance</p>
          </div>
        </div>
      </div>

      <div className="h-4" />
    </div>
  );
}