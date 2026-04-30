import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../api/supabaseClient';
import { useAuth } from '../../lib/AuthContext';
import { ArrowLeft, Phone, Star, CheckCircle2, Clock, MapPin, Wrench, X, Shield, CreditCard } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { toast } from 'sonner';

const statusSteps = [
  { key: 'pending', label: 'Booking Sent', icon: Clock, desc: 'Waiting for provider to accept' },
  { key: 'confirmed', label: 'Confirmed', icon: CheckCircle2, desc: 'Provider has accepted your booking' },
  { key: 'in_progress', label: 'Work in Progress', icon: Wrench, desc: 'Service is being performed' },
  { key: 'completed', label: 'Completed', icon: CheckCircle2, desc: 'Service completed successfully' },
];

const statusOrder = statusSteps.map((s) => s.key);

export default function TrackBooking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [booking, setBooking] = useState(null);
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [updating, setUpdating] = useState(false);
  const [verified, setVerified] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [showBalancePayment, setShowBalancePayment] = useState(false);
  const [balancePaid, setBalancePaid] = useState(false);
  const [showOtpDialog, setShowOtpDialog] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('');

  const fetchBooking = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single();

    if (!error && data) {
      setBooking(data);
      setBalancePaid(data.balance_paid || false);
      if (data.provider_id) {
        await fetchProvider(data.provider_id);
      }
    } else {
      toast.error('Booking not found');
      navigate('/bookings');
    }
    setLoading(false);
  };

  const fetchProvider = async (providerId) => {
    const { data, error } = await supabase
      .from('providers')
      .select('*, user_profiles (id, full_name, phone, selfie_url), service_categories (name)')
      .eq('id', providerId)
      .single();

    if (!error && data) {
      setProvider(data);
      const verifiedStatus = localStorage.getItem(`verified_${id}`);
      if (verifiedStatus === 'true') {
        setVerified(true);
      }
    }
  };

  useEffect(() => {
    if (id) {
      fetchBooking();
    }
  }, [id]);

  const cancelBooking = async () => {
    setUpdating(true);
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', id);

    if (!error) {
      toast.success('Booking cancelled successfully');
      fetchBooking();
    } else {
      toast.error('Failed to cancel booking');
    }
    setUpdating(false);
  };

  const submitRating = async () => {
    setUpdating(true);
    const { error } = await supabase
      .from('bookings')
      .update({ rating, review, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (!error) {
      if (provider) {
        const { data: allRatings } = await supabase
          .from('bookings')
          .select('rating')
          .eq('provider_id', booking.provider_id)
          .not('rating', 'is', null);

        if (allRatings && allRatings.length > 0) {
          const avgRating = allRatings.reduce((sum, b) => sum + (b.rating || 0), 0) / allRatings.length;
          await supabase
            .from('providers')
            .update({ total_rating: avgRating, total_reviews: allRatings.length })
            .eq('id', booking.provider_id);
        }
      }
      toast.success('Thank you for your rating!');
      setShowRating(false);
      fetchBooking();
    } else {
      toast.error('Failed to submit rating');
    }
    setUpdating(false);
  };

  const generateAndSendOTP = async () => {
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60000).toISOString();

    console.log('Generating OTP:', otpCode, 'for booking:', id);

    const { data, error: otpError } = await supabase
      .from('otp_verifications')
      .insert({
        booking_id: parseInt(id),
        otp_code: otpCode,
        expires_at: expiresAt,
        is_verified: false
      })
      .select();

    if (otpError) {
      console.error('OTP save error:', otpError);
      toast.error('Failed to generate OTP: ' + otpError.message);
      return false;
    }

    console.log('OTP saved successfully:', data);
    localStorage.setItem(`otp_${id}`, otpCode);
    localStorage.setItem(`otp_expiry_${id}`, expiresAt);
    
    setGeneratedOtp(otpCode);
    setShowOtpDialog(true);
    
    return true;
  };

  const handleBalancePayment = async () => {
    setUpdating(true);
    
    const { error } = await supabase
      .from('bookings')
      .update({ 
        balance_paid: true, 
        balance_amount: booking?.total_amount * 0.8,
        total_paid: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      toast.error('Payment failed. Please try again.');
      setUpdating(false);
      return;
    }

    setBalancePaid(true);
    setShowBalancePayment(false);
    toast.success('Balance payment successful!');
    
    await generateAndSendOTP();
    
    setUpdating(false);
  };

  const handleConfirmMatch = async () => {
    setVerified(true);
    localStorage.setItem(`verified_${id}`, 'true');
    setShowVerification(false);
    setShowBalancePayment(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-6 h-6 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="px-5 pt-6 text-center py-20">
        <p className="text-gray-500">Booking not found</p>
        <Link to="/bookings" className="text-blue-600 text-sm mt-2 inline-block">Go back</Link>
      </div>
    );
  }

  const currentIndex = statusOrder.indexOf(booking.status);
  const isCancelled = booking.status === 'cancelled';
  const isCompleted = booking.status === 'completed';
  const hasRated = booking.rating && booking.rating > 0;
  const providerName = provider?.user_profiles?.full_name || 'Service Provider';
  const providerPhoto = provider?.user_profiles?.selfie_url;
  const providerRating = provider?.total_rating || 0;
  const isActive = ['confirmed', 'in_progress'].includes(booking.status);
  const advanceAmount = booking.total_amount ? booking.total_amount * 0.2 : 0;
  const balanceAmount = booking.total_amount ? booking.total_amount * 0.8 : 0;

  return (
    <div className="px-5 pt-6 space-y-5 pb-20">
      <div className="flex items-center gap-3">
        <Link to="/bookings" className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center shadow-sm">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="font-heading text-lg font-bold">Track Booking</h1>
      </div>

      {provider && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center overflow-hidden">
                {providerPhoto ? (
                  <img src={providerPhoto} alt={providerName} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-blue-600">{providerName.charAt(0)}</span>
                )}
              </div>
              {providerPhoto && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-heading font-semibold">{providerName}</h3>
              <p className="text-xs text-gray-500 capitalize">Service Provider</p>
              <div className="flex items-center gap-1 mt-1">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span className="text-xs font-medium">{providerRating.toFixed(1)}</span>
              </div>
            </div>
            <button className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50">
              <Phone className="w-4 h-4 text-blue-600" />
            </button>
          </div>

          <div className="mt-3 p-2 bg-gray-50 rounded-lg">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Advance Paid (20%):</span>
              <span className="font-semibold text-green-600">₹{advanceAmount}</span>
            </div>
            <div className="flex justify-between text-xs mt-1">
              <span className="text-gray-500">Balance Due (80%):</span>
              <span className={`font-semibold ${balancePaid ? 'text-green-600' : 'text-amber-600'}`}>
                {balancePaid ? '₹' + balanceAmount + ' Paid' : '₹' + balanceAmount + ' Pending'}
              </span>
            </div>
          </div>

          {isActive && providerPhoto && !verified && !balancePaid && (
            <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-200">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-semibold text-amber-700">Identity & Payment Required</span>
              </div>
              <p className="text-xs text-amber-600 mb-3">
                Verify provider identity first, then pay balance to start service.
              </p>
              <button
                onClick={() => setShowVerification(true)}
                className="w-full py-2 bg-amber-600 text-white text-sm rounded-xl hover:bg-amber-700 transition-colors"
              >
                Verify Provider Identity
              </button>
            </div>
          )}

          {isActive && verified && !balancePaid && (
            <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-semibold text-blue-700">Balance Payment Required</span>
              </div>
              <p className="text-xs text-blue-600 mb-3">
                Pay ₹{balanceAmount} to generate OTP and start the service.
              </p>
              <button
                onClick={() => setShowBalancePayment(true)}
                className="w-full py-2 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700 transition-colors"
              >
                Pay Balance ₹{balanceAmount}
              </button>
            </div>
          )}

          {isActive && balancePaid && (
            <div className="mt-4 p-3 bg-green-50 rounded-xl border border-green-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-xs font-semibold text-green-700">Payment Complete ✓</span>
              </div>
              <p className="text-xs text-green-600 mt-1">OTP sent. Share with provider to start work.</p>
            </div>
          )}
        </motion.div>
      )}

      {/* Verification Modal */}
      {showVerification && providerPhoto && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          <div className="flex-1 flex items-center justify-center bg-black p-4">
            <img 
              src={providerPhoto} 
              alt={providerName} 
              className="max-w-full max-h-full object-contain"
            />
            
            <button
              onClick={() => setShowVerification(false)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent p-6 pb-8">
              <h3 className="text-white text-2xl font-bold">{providerName}</h3>
              <p className="text-white/70 text-sm mb-4">Service Provider</p>
              
              <div className="bg-white/10 backdrop-blur rounded-xl p-3 mb-4">
                <p className="text-white text-center text-sm">
                  Is this the person who arrived at your location?
                </p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowVerification(false)}
                  className="flex-1 py-3 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors"
                >
                  ✗ No
                </button>
                <button
                  onClick={handleConfirmMatch}
                  className="flex-1 py-3 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors shadow-lg"
                >
                  ✓ Yes, Match
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Balance Payment Modal */}
      {showBalancePayment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl max-w-md w-full p-5"
          >
            <div className="text-center mb-4">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
                <CreditCard className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-heading font-bold text-lg">Pay Balance Amount</h3>
              <p className="text-sm text-gray-500 mt-1">
                Complete payment to start the service
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Total Amount</span>
                <span className="font-bold">₹{booking.total_amount}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Advance Paid (20%)</span>
                <span className="text-green-600">- ₹{advanceAmount}</span>
              </div>
              <div className="border-t border-gray-200 pt-2 mt-2">
                <div className="flex justify-between">
                  <span className="text-gray-800 font-semibold">Balance to Pay</span>
                  <span className="text-xl font-bold text-blue-600">₹{balanceAmount}</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-gray-500 text-center mb-4">
              ⚠️ Demo Mode: Click "Pay Now" to simulate payment
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowBalancePayment(false)}
                className="flex-1 py-3 rounded-xl border border-gray-200 bg-white font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleBalancePayment}
                disabled={updating}
                className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-semibold disabled:opacity-50"
              >
                {updating ? 'Processing...' : 'Pay Now ₹' + balanceAmount}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* OTP Dialog */}
      {showOtpDialog && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl max-w-sm w-full p-6 text-center"
          >
            <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🔐</span>
            </div>
            <h3 className="font-bold text-xl mb-2">Your OTP Code</h3>
            <p className="text-4xl font-bold tracking-widest text-blue-600 my-4">{generatedOtp}</p>
            <p className="text-sm text-gray-500 mb-4">
              Share this code with the provider to start the service.<br/>
              Valid for 5 minutes.
            </p>
            <button
              onClick={() => setShowOtpDialog(false)}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold"
            >
              OK, Got it
            </button>
          </motion.div>
        </div>
      )}

      {!isCancelled ? (
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <h3 className="font-heading font-semibold text-sm mb-4">Live Status</h3>
          <div className="space-y-0">
            {statusSteps.map((step, i) => {
              const Icon = step.icon;
              const isDone = i < currentIndex;
              const isCurrent = i === currentIndex;
              const isFuture = i > currentIndex;
              return (
                <div key={step.key} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <motion.div
                      animate={isCurrent ? { scale: [1, 1.2, 1] } : {}}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 ${
                        isDone ? 'bg-green-600 text-white' :
                        isCurrent ? 'bg-blue-600 text-white shadow-md shadow-blue-300' :
                        'bg-gray-200 text-gray-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </motion.div>
                    {i < statusSteps.length - 1 && (
                      <div className={`w-0.5 h-8 ${isDone ? 'bg-green-600' : 'bg-gray-200'}`} />
                    )}
                  </div>
                  <div className="pb-4 pt-1">
                    <p className={`text-sm font-semibold ${isFuture ? 'text-gray-400' : 'text-gray-800'}`}>
                      {step.label}
                    </p>
                    {isCurrent && (
                      <p className="text-xs text-gray-500 mt-0.5">{step.desc}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-red-50 rounded-2xl p-4 border border-red-200 flex items-center gap-3">
          <X className="w-6 h-6 text-red-600" />
          <div>
            <p className="font-semibold text-red-600">Booking Cancelled</p>
            <p className="text-xs text-red-500 mt-0.5">This booking was cancelled</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-2">
        <h3 className="font-heading font-semibold text-sm">Booking Details</h3>
        {[
          { label: 'Booking ID', value: '#' + booking.id },
          { label: 'Date', value: booking.service_date ? format(new Date(booking.service_date), 'MMM d, yyyy') : '-' },
          { label: 'Time', value: booking.service_time || '-' },
          { label: 'Location', value: booking.location || '-' },
          { label: 'Total Amount', value: booking.total_amount ? '₹' + booking.total_amount : '-' },
        ].map(({ label, value }) => (
          <div key={label} className="flex justify-between text-sm">
            <span className="text-gray-500">{label}</span>
            <span className="font-medium text-right max-w-[55%] text-gray-800">{value}</span>
          </div>
        ))}
      </div>

      {!isCancelled && !isCompleted && booking.status === 'pending' && (
        <button
          className="w-full h-11 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
          onClick={cancelBooking}
          disabled={updating}
        >
          {updating ? 'Cancelling...' : 'Cancel Booking'}
        </button>
      )}

      {isCompleted && !hasRated && (
        <button className="w-full h-11 rounded-xl bg-blue-600 text-white font-semibold gap-2 flex items-center justify-center" onClick={() => setShowRating(true)}>
          <Star className="w-4 h-4" /> Rate Service
        </button>
      )}

      {isCompleted && hasRated && (
        <div className="bg-green-50 rounded-2xl p-4 border border-green-200 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} className={`w-5 h-5 ${s <= booking.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
            ))}
          </div>
          <p className="text-xs text-gray-600">Your review: {booking.review || 'No comment'}</p>
        </div>
      )}

      {showRating && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5">
            <h3 className="font-heading font-bold text-lg mb-2">Rate the Service</h3>
            <p className="text-sm text-gray-500 mb-4">How was your experience?</p>
            <div className="flex items-center justify-center gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} onClick={() => setRating(s)}>
                  <Star className={`w-8 h-8 transition-colors ${s <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
                </button>
              ))}
            </div>
            <textarea
              placeholder="Leave a review (optional)..."
              value={review}
              onChange={(e) => setReview(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
              rows={3}
            />
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowRating(false)} className="flex-1 h-11 rounded-xl border border-gray-200 bg-white">
                Cancel
              </button>
              <button onClick={submitRating} disabled={!rating || updating} className="flex-1 h-11 rounded-xl bg-blue-600 text-white font-semibold disabled:opacity-50">
                {updating ? 'Submitting...' : 'Submit Rating'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="h-4" />
    </div>
  );
}