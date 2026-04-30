import React, { useState, useEffect } from 'react';
import { supabase } from '../../api/supabaseClient';
import { useAuth } from '../../lib/AuthContext';
import { BellRing, Briefcase, Star, IndianRupee, Clock, MapPin, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function ProviderHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [provider, setProvider] = useState(null);
  const [newJobs, setNewJobs] = useState([]);
  const [activeJobs, setActiveJobs] = useState([]);
  const [openRequests, setOpenRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOnDuty, setIsOnDuty] = useState(false);
  const [updatingDuty, setUpdatingDuty] = useState(false);
  const [uploadingSelfie, setUploadingSelfie] = useState(false);
  const [showBidDialog, setShowBidDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [bidPrice, setBidPrice] = useState('');
  const [bidMessage, setBidMessage] = useState('');

  const fetchProviderProfile = async () => {
    const { data, error } = await supabase
      .from('providers')
      .select('*, user_profiles (id, full_name, phone, selfie_url), service_categories (name)')
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

  const fetchJobs = async () => {
    if (!provider?.id) return;

    // Fetch pending bookings (new job requests from bookings)
    const { data: pendingJobs } = await supabase
      .from('bookings')
      .select('*, customer:customer_id (full_name, phone)')
      .eq('provider_id', provider.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (pendingJobs) setNewJobs(pendingJobs);

    // Fetch active bookings
    const { data: active } = await supabase
      .from('bookings')
      .select('*, customer:customer_id (full_name, phone)')
      .eq('provider_id', provider.id)
      .in('status', ['confirmed', 'in_progress'])
      .order('created_at', { ascending: false });

    if (active) setActiveJobs(active);
  };

  const fetchOpenRequests = async () => {
    if (!provider?.id) return;

    // Fetch open service requests that match provider's categories
    const providerCategories = provider.service_categories?.name || '';
    
    const { data: requests } = await supabase
      .from('service_requests')
      .select('*')
      .eq('status', 'open')
      .order('created_at', { ascending: false });

    if (requests) {
      // Filter by category match
      const filtered = requests.filter(req => 
        req.category === provider.category || 
        providerCategories.toLowerCase().includes(req.category)
      );
      setOpenRequests(filtered);
    }
  };

  useEffect(() => {
    if (user) fetchProviderProfile();
  }, [user]);

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
      toast.success(newStatus ? 'You are now online' : 'You are now offline');
    } else {
      toast.error('Failed to update status');
    }
    setUpdatingDuty(false);
  };

  const respondToJob = async (bookingId, action) => {
    const newStatus = action === 'accept' ? 'confirmed' : 'cancelled';
    const { error } = await supabase
      .from('bookings')
      .update({ status: newStatus })
      .eq('id', bookingId);

    if (!error) {
      toast.success(action === 'accept' ? 'Job accepted!' : 'Job declined');
      fetchJobs();
    } else {
      toast.error('Failed to update job status');
    }
  };

  const handleSubmitBid = async () => {
    if (!bidPrice || parseFloat(bidPrice) <= 0) {
      toast.error('Please enter a valid price');
      return;
    }

    const { error } = await supabase
      .from('bids')
      .insert([{
        job_id: selectedRequest.id,
        provider_id: provider.id,
        quoted_price: parseFloat(bidPrice),
        message: bidMessage,
        status: 'pending'
      }]);

    if (!error) {
      toast.success('Bid submitted successfully!');
      setShowBidDialog(false);
      setBidPrice('');
      setBidMessage('');
      fetchOpenRequests();
    } else {
      toast.error('Failed to submit bid');
    }
  };

  const handleSelfieUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size should be less than 2MB');
      return;
    }

    setUploadingSelfie(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `selfie_${user.id}_${Date.now()}.${fileExt}`;
      const filePath = fileName;

      const { error: uploadError } = await supabase.storage
        .from('service-app-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('service-app-files')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ selfie_url: publicUrl, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (updateError) throw updateError;

      toast.success('Selfie uploaded successfully!');
      fetchProviderProfile();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload selfie: ' + error.message);
    } finally {
      setUploadingSelfie(false);
    }
  };

  if (!provider) {
    return (
      <div className="px-5 pt-6 text-center py-20">
        <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-sm text-gray-500">Your provider profile is not set up yet.</p>
        <p className="text-xs text-gray-400 mt-1">Please complete your profile setup.</p>
        <button onClick={() => navigate('/provider/profile')} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">
          Complete Setup
        </button>
      </div>
    );
  }

  const completedJobs = activeJobs.filter((j) => j.status === 'completed');
  const todayEarnings = completedJobs.reduce((sum, j) => sum + (j.total_amount || 0), 0);
  const providerName = provider.user_profiles?.full_name || 'Provider';
  const providerRating = provider.total_rating || 0;
  const hasSelfie = provider.user_profiles?.selfie_url;

  return (
    <div className="px-5 pt-6 space-y-5 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500">Welcome back</p>
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-xl font-bold">{providerName}</h1>
            <label className="cursor-pointer">
              <input type="file" accept="image/*" className="hidden" onChange={handleSelfieUpload} disabled={uploadingSelfie} />
            </label>
            {uploadingSelfie && <span className="text-xs text-blue-600">Uploading...</span>}
            {hasSelfie && <span className="text-xs text-green-600">✓ Verified</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 bg-white rounded-xl border border-gray-200 px-3 py-2 shadow-sm">
          <span className={`text-xs font-medium ${isOnDuty ? 'text-green-600' : 'text-gray-500'}`}>
            {isOnDuty ? 'Online' : 'Offline'}
          </span>
          <button
            onClick={toggleDuty}
            disabled={updatingDuty}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${isOnDuty ? 'bg-green-600' : 'bg-gray-300'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isOnDuty ? 'translate-x-4' : 'translate-x-0.5'}`} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl p-3 text-center border border-gray-100 shadow-sm">
          <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center mx-auto mb-1">
            <IndianRupee className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-lg font-bold">₹{todayEarnings}</p>
          <p className="text-[9px] text-gray-500">Today's Earnings</p>
        </div>
        <div className="bg-white rounded-xl p-3 text-center border border-gray-100 shadow-sm">
          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center mx-auto mb-1">
            <Briefcase className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-lg font-bold">{completedJobs.length}</p>
          <p className="text-[9px] text-gray-500">Jobs Done</p>
        </div>
        <div className="bg-white rounded-xl p-3 text-center border border-gray-100 shadow-sm">
          <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center mx-auto mb-1">
            <Star className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-lg font-bold">{providerRating.toFixed(1)}</p>
          <p className="text-[9px] text-gray-500">Rating</p>
        </div>
      </div>

      {/* Open Job Requests Section - NEW */}
      {openRequests.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <BellRing className="w-4 h-4 text-blue-500" />
            <h2 className="font-heading font-semibold text-sm">Open Job Requests</h2>
            <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded-full">{openRequests.length}</span>
          </div>
          <div className="space-y-3">
            {openRequests.map((request) => (
              <div key={request.id} className="bg-white rounded-2xl p-4 border border-blue-200 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-sm">{request.title}</p>
                    <p className="text-xs text-gray-500 mt-1">{request.description?.substring(0, 80)}...</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {request.city}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {request.preferred_date}</span>
                  <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> Budget: ₹{request.budget || 'Negotiable'}</span>
                </div>
                <button
                  onClick={() => {
                    setSelectedRequest(request);
                    setShowBidDialog(true);
                  }}
                  className="w-full py-2 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700 transition-colors"
                >
                  Submit Bid
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New Job Requests */}
      {newJobs.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <BellRing className="w-4 h-4 text-amber-500" />
            <h2 className="font-heading font-semibold text-sm">New Booking Requests</h2>
            <span className="bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded-full">{newJobs.length}</span>
          </div>
          <div className="space-y-3">
            {newJobs.map((job) => (
              <div key={job.id} className="bg-white rounded-2xl p-4 border-2 border-amber-200 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-sm">{job.customer?.full_name || 'Customer'}</p>
                    <p className="text-xs text-gray-500">Service Booking</p>
                  </div>
                  <span className="bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded-full">New</span>
                </div>
                {job.notes && <p className="text-xs text-gray-500 mb-2 line-clamp-2">{job.notes}</p>}
                <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{job.service_time || 'Flexible'}</span>
                  <span>₹{job.total_amount || 0}</span>
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 rounded-xl h-9 border border-red-200 text-red-600 hover:bg-red-50 text-xs" onClick={() => respondToJob(job.id, 'decline')}>
                    Decline
                  </button>
                  <button className="flex-1 rounded-xl h-9 bg-green-600 hover:bg-green-700 text-white text-xs" onClick={() => respondToJob(job.id, 'accept')}>
                    Accept Job
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Jobs */}
      <div>
        <h2 className="font-heading font-semibold text-sm mb-3">Active Jobs</h2>
        {activeJobs.filter((j) => ['confirmed', 'in_progress'].includes(j.status)).length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-6">No active jobs right now</p>
        ) : (
          <div className="space-y-3">
            {activeJobs.filter((j) => ['confirmed', 'in_progress'].includes(j.status)).map((job) => (
              <Link key={job.id} to={`/provider/job/${job.id}`}>
                <div className="bg-white rounded-2xl p-4 border border-blue-200 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm">{job.customer?.full_name || 'Customer'}</p>
                      <p className="text-xs text-gray-500">ID: #{job.id}</p>
                    </div>
                    <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded-full capitalize">
                      {job.status?.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-blue-600 font-medium mt-2">Tap to manage →</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Bid Dialog */}
      {showBidDialog && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5">
            <h3 className="font-heading font-bold text-lg mb-2">Submit Bid</h3>
            <p className="text-sm text-gray-500 mb-4">Quote your price for: {selectedRequest.title}</p>
            
            <div className="mb-4">
              <label className="text-sm font-medium mb-1 block">Your Quote (₹)</label>
              <input
                type="number"
                placeholder="Enter your price"
                value={bidPrice}
                onChange={(e) => setBidPrice(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="mb-4">
              <label className="text-sm font-medium mb-1 block">Message (Optional)</label>
              <textarea
                placeholder="Add a message to the customer..."
                value={bidMessage}
                onChange={(e) => setBidMessage(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
              />
            </div>
            
            <div className="flex gap-3">
              <button onClick={() => setShowBidDialog(false)} className="flex-1 py-2 rounded-xl border border-gray-200 bg-white">
                Cancel
              </button>
              <button onClick={handleSubmitBid} className="flex-1 py-2 rounded-xl bg-blue-600 text-white font-semibold">
                Submit Bid
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="h-4" />
    </div>
  );
}