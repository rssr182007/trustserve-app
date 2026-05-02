import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../api/supabaseClient';
import { useAuth } from '../../lib/AuthContext';
import { BellRing, Briefcase, Star, IndianRupee, Clock, MapPin, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

export default function ProviderHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOnDuty, setIsOnDuty] = useState(false);
  const [updatingDuty, setUpdatingDuty] = useState(false);
  const [newJobs, setNewJobs] = useState([]);
  const [activeJobs, setActiveJobs] = useState([]);
  const [openRequests, setOpenRequests] = useState([]);
  const [showBidDialog, setShowBidDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [bidPrice, setBidPrice] = useState('');
  const [bidMessage, setBidMessage] = useState('');

  const fetchProviderProfile = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('providers')
      .select('*, user_profiles (id, full_name, phone, selfie_url)')
      .eq('id', user.id)
      .single();

    if (!error && data) {
      setProvider(data);
      setIsOnDuty(data.is_available || false);
    } else {
      setProvider(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      fetchProviderProfile();
    }
  }, [user]);

  const fetchJobs = async () => {
    if (!provider?.id) return;

    // Fetch pending bookings
    const { data: pendingJobs } = await supabase
      .from('bookings')
      .select('*, customer:customer_id (full_name, phone)')
      .eq('provider_id', provider.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (pendingJobs) setNewJobs(pendingJobs);

    // Fetch active bookings (confirmed or in_progress)
    const { data: active } = await supabase
      .from('bookings')
      .select('*, customer:customer_id (full_name, phone)')
      .eq('provider_id', provider.id)
      .in('status', ['confirmed', 'in_progress'])
      .order('created_at', { ascending: false });
    if (active) {
      console.log("Active jobs found:", active.length);
      setActiveJobs(active);
    }
  };

  const fetchOpenRequests = async () => {
    if (!provider?.id) return;
    const { data: requests } = await supabase
      .from('service_requests')
      .select('*')
      .eq('status', 'open')
      .order('created_at', { ascending: false });
    if (requests) setOpenRequests(requests);
  };

  useEffect(() => {
    if (provider?.id) {
      fetchJobs();
      fetchOpenRequests();
    }
  }, [provider?.id, isOnDuty]);

  const toggleDuty = async () => {
    setUpdatingDuty(true);
    const newStatus = !isOnDuty;
    const { error } = await supabase
      .from('providers')
      .update({ is_available: newStatus })
      .eq('id', provider.id);
    if (!error) {
      setIsOnDuty(newStatus);
      toast.success(newStatus ? 'Online' : 'Offline');
    }
    setUpdatingDuty(false);
  };

  const respondToJob = async (bookingId, action) => {
    const newStatus = action === 'accept' ? 'confirmed' : 'cancelled';
    await supabase.from('bookings').update({ status: newStatus }).eq('id', bookingId);
    toast.success(action === 'accept' ? 'Accepted!' : 'Declined');
    fetchJobs();
  };

  const handleSubmitBid = async () => {
    if (!bidPrice) return;
    await supabase.from('bids').insert([{
      job_id: selectedRequest.id,
      provider_id: provider.id,
      quoted_price: parseFloat(bidPrice),
      message: bidMessage,
      status: 'pending'
    }]);
    toast.success('Bid submitted!');
    setShowBidDialog(false);
    fetchOpenRequests();
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!provider) {
    return (
      <div className="px-5 pt-6 text-center py-20">
        <h2 className="text-xl font-semibold mb-2">Complete Your Profile</h2>
        <button onClick={() => navigate('/provider/setup')} className="px-6 py-2 bg-blue-600 text-white rounded-lg">
          Complete Setup
        </button>
      </div>
    );
  }

  const completedJobs = activeJobs.filter((j) => j.status === 'completed');
  const todayEarnings = completedJobs.reduce((sum, j) => sum + (j.total_amount || 0), 0);
  const providerName = provider?.user_profiles?.full_name || 'Provider';
  const providerRating = provider?.total_rating || 0;
  const hasSelfie = provider?.user_profiles?.selfie_url;

  return (
    <div className="px-5 pt-6 space-y-5 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500">Welcome back</p>
          <h1 className="font-heading text-xl font-bold">{providerName}</h1>
          {hasSelfie && <span className="text-xs text-green-600">✓ Verified</span>}
        </div>
        <button onClick={toggleDuty} className={`px-3 py-1 rounded-full text-xs ${isOnDuty ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
          {isOnDuty ? 'Online' : 'Offline'}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl p-3 text-center"><IndianRupee className="w-5 h-5 mx-auto text-emerald-500" /><p className="font-bold">₹{todayEarnings}</p><p className="text-[9px]">Today</p></div>
        <div className="bg-white rounded-xl p-3 text-center"><Briefcase className="w-5 h-5 mx-auto text-blue-600" /><p className="font-bold">{completedJobs.length}</p><p className="text-[9px]">Jobs Done</p></div>
        <div className="bg-white rounded-xl p-3 text-center"><Star className="w-5 h-5 mx-auto text-amber-500" /><p className="font-bold">{providerRating.toFixed(1)}</p><p className="text-[9px]">Rating</p></div>
      </div>

      {/* Open Requests */}
      {openRequests.length > 0 && (
        <div>
          <h2 className="font-semibold text-sm mb-2">Open Requests ({openRequests.length})</h2>
          {openRequests.map(req => (
            <div key={req.id} className="bg-white rounded-xl p-3 mb-2 border">
              <p className="font-semibold">{req.title}</p>
              <button onClick={() => { setSelectedRequest(req); setShowBidDialog(true); }} className="mt-2 px-3 py-1 bg-blue-600 text-white text-xs rounded-lg">Submit Bid</button>
            </div>
          ))}
        </div>
      )}

      {/* New Booking Requests */}
      {newJobs.length > 0 && (
        <div>
          <h2 className="font-semibold text-sm mb-2">New Booking Requests ({newJobs.length})</h2>
          {newJobs.map(job => (
            <div key={job.id} className="bg-white rounded-xl p-3 mb-2 border border-amber-200">
              <p className="font-semibold">{job.customer?.full_name}</p>
              <p className="text-sm text-amber-600">₹{job.total_amount}</p>
              <div className="flex gap-2 mt-2">
                <button onClick={() => respondToJob(job.id, 'decline')} className="px-3 py-1 border border-red-300 text-red-600 rounded-lg text-xs">Decline</button>
                <button onClick={() => respondToJob(job.id, 'accept')} className="px-3 py-1 bg-green-600 text-white rounded-lg text-xs">Accept</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Active Jobs - THIS IS WHERE CONFIRMED BOOKINGS SHOULD APPEAR */}
      <div>
        <h2 className="font-semibold text-sm mb-2">Active Jobs ({activeJobs.filter(j => ['confirmed', 'in_progress'].includes(j.status)).length})</h2>
        {activeJobs.filter(j => ['confirmed', 'in_progress'].includes(j.status)).length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No active jobs</p>
        ) : (
          activeJobs.filter(j => ['confirmed', 'in_progress'].includes(j.status)).map((job) => (
            <Link key={job.id} to={`/provider/job/${job.id}`}>
              <div className="bg-white rounded-xl p-3 mb-2 border border-blue-200">
                <p className="font-semibold">{job.customer?.full_name}</p>
                <p className="text-xs text-blue-600">ID: #{job.id} - Tap to manage →</p>
              </div>
            </Link>
          ))
        )}
      </div>

      {/* Bid Dialog */}
      {showBidDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-4 w-full max-w-md">
            <h3 className="font-bold mb-2">Submit Bid</h3>
            <input type="number" placeholder="Price (₹)" value={bidPrice} onChange={(e) => setBidPrice(e.target.value)} className="w-full p-2 border rounded mb-2" />
            <textarea placeholder="Message" value={bidMessage} onChange={(e) => setBidMessage(e.target.value)} className="w-full p-2 border rounded mb-2" rows={2} />
            <div className="flex gap-2">
              <button onClick={() => setShowBidDialog(false)} className="flex-1 p-2 border rounded">Cancel</button>
              <button onClick={handleSubmitBid} className="flex-1 p-2 bg-blue-600 text-white rounded">Submit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}