import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../api/supabaseClient';
import { useAuth } from '../lib/AuthContext';
import { ArrowLeft, Briefcase, Clock, MapPin, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function MyRequests() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchRequests();
    }
  }, [user]);

  const fetchRequests = async () => {
    const { data, error } = await supabase
      .from('service_requests')
      .select('*')
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setRequests(data);
    }
    setLoading(false);
  };

  const statusColors = {
    open: 'bg-green-100 text-green-700',
    assigned: 'bg-blue-100 text-blue-700',
    completed: 'bg-gray-100 text-gray-700',
    cancelled: 'bg-red-100 text-red-700',
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white shadow-sm px-5 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-800">My Requests</h1>
            <p className="text-xs text-gray-500">Track your posted jobs</p>
          </div>
        </div>
      </div>

      <div className="px-5 pt-5">
        {loading && (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
          </div>
        )}

        {!loading && requests.length === 0 && (
          <div className="text-center py-12">
            <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No requests posted yet</p>
            <button
              onClick={() => navigate('/post-job')}
              className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm"
            >
              Post Your First Request
            </button>
          </div>
        )}

        <div className="space-y-3">
          {requests.map((req) => (
            <div
              key={req.id}
              onClick={() => navigate(`/job/${req.id}/offers`)}
              className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm cursor-pointer hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-gray-800">{req.title}</h3>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusColors[req.status] || statusColors.open}`}>
                  {req.status}
                </span>
              </div>
              <p className="text-xs text-gray-500 mb-2 line-clamp-2">{req.description}</p>
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {req.city}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {format(new Date(req.created_at), 'MMM d')}
                </span>
              </div>
              <div className="mt-2 pt-2 border-t border-gray-100 flex justify-between items-center">
                <span className="text-sm font-bold text-blue-600">₹{req.budget || 'Negotiable'}</span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}