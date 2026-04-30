import React, { useState, useEffect } from 'react';
import { supabase } from '../../api/supabaseClient';
import { useAuth } from '../../lib/AuthContext';
import { Link } from 'react-router-dom';
import { CalendarCheck, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

const statusConfig = {
  pending: { label: 'Pending', className: 'bg-amber-100 text-amber-700' },
  confirmed: { label: 'Confirmed', className: 'bg-blue-100 text-blue-700' },
  in_progress: { label: 'In Progress', className: 'bg-orange-100 text-orange-700' },
  completed: { label: 'Completed', className: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-700' },
};

export default function ProviderBookings() {
  const { user } = useAuth();
  const [tab, setTab] = useState('all');
  const [allJobs, setAllJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [provider, setProvider] = useState(null);

  const fetchProviderProfile = async () => {
    const { data, error } = await supabase
      .from('providers')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!error && data) {
      setProvider(data);
      fetchJobs(data.id);
    } else {
      setLoading(false);
    }
  };

  const fetchJobs = async (providerId) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('bookings')
      .select('*, customer:customer_id (full_name, phone)')
      .eq('provider_id', providerId)
      .order('created_at', { ascending: false });

    if (!error && data) setAllJobs(data);
    setLoading(false);
  };

  useEffect(() => {
    if (user) fetchProviderProfile();
  }, [user]);

  const filtered = tab === 'all' 
    ? allJobs 
    : allJobs.filter((j) => {
        if (tab === 'active') return ['confirmed', 'in_progress'].includes(j.status);
        return j.status === tab;
      });

  if (!provider) {
    return (
      <div className="px-5 pt-6 text-center py-20">
        <CalendarCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-sm text-gray-500">Provider profile not found</p>
      </div>
    );
  }

  return (
    <div className="px-5 pt-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
          <CalendarCheck className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h1 className="font-heading text-xl font-bold">My Jobs</h1>
          <p className="text-xs text-gray-500">{allJobs.length} total jobs</p>
        </div>
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {['all', 'pending', 'active', 'completed'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${
              tab === t ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'all' ? 'All' : t === 'active' ? 'Active' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-12">
          <CalendarCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No jobs here</p>
        </div>
      )}

      <div className="space-y-3">
        {filtered.map((job) => {
          const st = statusConfig[job.status] || statusConfig.pending;
          const customerName = job.customer?.full_name || 'Customer';
          return (
            <motion.div key={job.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Link to={`/provider/job/${job.id}`}>
                <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                    <span className="font-bold text-blue-600">{customerName.charAt(0)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-sm truncate">{customerName}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${st.className}`}>
                        {st.label}
                      </span>
                    </div>
                    {job.service_date && (
                      <p className="text-xs text-gray-500 mt-1">
                        {format(new Date(job.service_date), 'MMM d')} · {job.service_time}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      <div className="h-4" />
    </div>
  );
}