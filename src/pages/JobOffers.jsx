import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../api/supabaseClient';
import { useAuth } from '../lib/AuthContext';
import { ArrowLeft, Star, MapPin, Clock, IndianRupee, CheckCircle, XCircle, User, Briefcase } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function JobOffers() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [job, setJob] = useState(null);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  useEffect(() => {
    fetchJobAndBids();
  }, [id]);

  const fetchJobAndBids = async () => {
    setLoading(true);
    
    // Fetch job details
    const { data: jobData, error: jobError } = await supabase
      .from('service_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (jobError) {
      console.error('Job fetch error:', jobError);
      toast.error('Job not found');
      navigate('/my-requests');
      return;
    }
    setJob(jobData);

    // Fetch bids with provider details
    const { data: bidsData, error: bidsError } = await supabase
      .from('bids')
      .select(`
        *,
        provider:provider_id (
          id,
          hourly_rate,
          total_rating,
          total_reviews,
          experience_years,
          location,
          user_profiles (full_name, phone, selfie_url)
        )
      `)
      .eq('job_id', id)
      .order('quoted_price', { ascending: true });

    if (bidsError) {
      console.error('Bids fetch error:', bidsError);
    }
    if (!bidsError && bidsData) {
      setBids(bidsData);
    }
    setLoading(false);
  };

  const handleSelectProvider = (bid) => {
    setSelectedProvider(bid);
    setShowConfirmDialog(true);
  };

  const confirmSelection = async () => {
    if (!selectedProvider) return;

    setLoading(true);

    try {
      // First, update the job status
      const { error: jobUpdateError } = await supabase
        .from('service_requests')
        .update({ 
          status: 'assigned', 
          assigned_provider: selectedProvider.provider_id 
        })
        .eq('id', id);

      if (jobUpdateError) {
        console.error('Job update error:', jobUpdateError);
        toast.error('Failed to update job: ' + jobUpdateError.message);
        setLoading(false);
        return;
      }

      // Create booking
      const bookingData = {
        customer_id: user.id,
        provider_id: selectedProvider.provider_id,
        service_date: job.preferred_date || new Date().toISOString().split('T')[0],
        service_time: job.preferred_time || '09:00 AM',
        location: job.address || job.city,
        notes: job.description,
        total_amount: selectedProvider.quoted_price,
        status: 'pending',
        created_at: new Date().toISOString()
      };

      console.log('Creating booking with data:', bookingData);

      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert([bookingData])
        .select()
        .single();

      if (bookingError) {
        console.error('Booking creation error:', bookingError);
        toast.error('Failed to create booking: ' + bookingError.message);
        setLoading(false);
        return;
      }

      // Update bid status
      const { error: bidUpdateError } = await supabase
        .from('bids')
        .update({ status: 'accepted' })
        .eq('id', selectedProvider.id);

      if (bidUpdateError) {
        console.error('Bid update error:', bidUpdateError);
      }

      toast.success('Provider selected! Please complete advance payment.');
      navigate(`/track/${booking.id}`);
      
    } catch (err) {
      console.error('Unexpected error:', err);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setShowConfirmDialog(false);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-6 h-6 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white shadow-sm px-5 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Job Offers</h1>
            <p className="text-xs text-gray-500">Choose a provider for your job</p>
          </div>
        </div>
      </div>

      <div className="px-5 pt-5">
        {job && (
          <div className="bg-blue-50 rounded-2xl p-4 mb-5 border border-blue-100">
            <h3 className="font-semibold text-gray-800 mb-2">{job.title}</h3>
            <p className="text-sm text-gray-600 mb-2">{job.description}</p>
            <div className="flex flex-wrap gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {job.city}</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {job.preferred_date}</span>
              <span className="flex items-center gap-1"><IndianRupee className="w-3 h-3" /> Budget: ₹{job.budget || 'Negotiable'}</span>
            </div>
          </div>
        )}

        <h2 className="font-semibold text-gray-800 mb-3">{bids.length} Provider{bids.length !== 1 ? 's' : ''} Quoted</h2>

        {bids.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl">
            <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No offers received yet</p>
            <p className="text-xs text-gray-400 mt-1">Providers will send quotes shortly</p>
          </div>
        )}

        <div className="space-y-3">
          {bids.map((bid, index) => {
            const providerName = bid.provider?.user_profiles?.full_name || 'Service Provider';
            const providerRating = bid.provider?.total_rating || 0;
            const providerReviews = bid.provider?.total_reviews || 0;
            const providerExp = bid.provider?.experience_years || 0;
            const providerLocation = bid.provider?.location || 'Location not specified';
            const providerPhoto = bid.provider?.user_profiles?.selfie_url;

            return (
              <motion.div
                key={bid.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm"
              >
                <div className="flex gap-3">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center overflow-hidden shrink-0">
                    {providerPhoto ? (
                      <img src={providerPhoto} alt={providerName} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xl font-bold text-white">{providerName.charAt(0)}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-800">{providerName}</h3>
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span className="text-sm font-semibold">{providerRating.toFixed(1)}</span>
                        <span className="text-xs text-gray-400">({providerReviews})</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{bid.message || 'Ready to serve you'}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                      <span>📅 {providerExp} yrs exp</span>
                      <span>📍 {providerLocation}</span>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
                      <div>
                        <span className="text-xs text-gray-500">Quote Price</span>
                        <p className="text-xl font-bold text-blue-600">₹{bid.quoted_price}</p>
                      </div>
                      <button
                        onClick={() => handleSelectProvider(bid)}
                        className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 transition-colors"
                      >
                        Choose Provider
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {showConfirmDialog && selectedProvider && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl max-w-md w-full p-5"
          >
            <div className="text-center mb-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-heading font-bold text-lg">Confirm Selection</h3>
              <p className="text-sm text-gray-500 mt-1">
                Are you sure you want to select this provider?
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-3 mb-4">
              <p className="text-sm font-medium">Quote: ₹{selectedProvider.quoted_price}</p>
              <p className="text-xs text-gray-500 mt-1">You will need to pay 20% advance to confirm booking.</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="flex-1 py-3 rounded-xl border border-gray-200 bg-white font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmSelection}
                className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-semibold"
              >
                Confirm & Proceed
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}