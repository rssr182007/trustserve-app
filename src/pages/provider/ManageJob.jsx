import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../api/supabaseClient';
import { useAuth } from '../../lib/AuthContext';
import { ArrowLeft, Phone, CheckCircle2, Clock, MapPin, Wrench, IndianRupee, Shield, Key } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function ManageJob() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [showOtpDialog, setShowOtpDialog] = useState(false);
  const [finalCost, setFinalCost] = useState('');
  const [showCostDialog, setShowCostDialog] = useState(false);

  const fetchBooking = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('bookings')
      .select('*, customer:customer_id (full_name, phone), provider:provider_id (hourly_rate)')
      .eq('id', id)
      .single();

    if (!error && data) {
      setBooking(data);
      
      // Check if OTP is already verified
      const { data: otpData } = await supabase
        .from('otp_verifications')
        .select('is_verified')
        .eq('booking_id', parseInt(id))
        .single();
      
      if (otpData && otpData.is_verified) {
        setOtpVerified(true);
      }
    } else {
      toast.error('Booking not found');
      navigate('/provider');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (id) fetchBooking();
  }, [id]);

  const verifyOTP = async () => {
    if (!otpCode || otpCode.length !== 6) {
      setOtpError('Please enter a valid 6-digit OTP');
      return;
    }

    setUpdating(true);
    setOtpError('');

    const { data, error } = await supabase
      .from('otp_verifications')
      .select('*')
      .eq('booking_id', parseInt(id))
      .eq('otp_code', otpCode)
      .single();

    if (error || !data) {
      setOtpError('Invalid OTP. Please try again.');
      setUpdating(false);
      return;
    }

    const expiryTime = new Date(data.expires_at);
    if (expiryTime < new Date()) {
      setOtpError('OTP has expired. Please ask customer to generate a new one.');
      setUpdating(false);
      return;
    }

    const { error: updateError } = await supabase
      .from('otp_verifications')
      .update({ is_verified: true })
      .eq('booking_id', parseInt(id));

    if (updateError) {
      setOtpError('Failed to verify OTP');
      setUpdating(false);
      return;
    }

    setOtpVerified(true);
    setShowOtpDialog(false);
    toast.success('OTP Verified! You can now start the service.');
    
    // Update booking status to in_progress
    await supabase
      .from('bookings')
      .update({ status: 'in_progress' })
      .eq('id', id);
    
    fetchBooking();
    setUpdating(false);
  };

  const handleComplete = async () => {
    const finalAmount = parseFloat(finalCost) || booking?.total_amount || 0;
    const { error } = await supabase
      .from('bookings')
      .update({ 
        status: 'completed', 
        total_amount: finalAmount,
        completed_at: new Date().toISOString()
      })
      .eq('id', id);

    if (!error) {
      toast.success('Job completed successfully!');
      navigate('/provider');
    } else {
      toast.error('Failed to complete job');
    }
    setShowCostDialog(false);
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
        <Link to="/provider" className="text-blue-600 text-sm mt-2 inline-block">Go back</Link>
      </div>
    );
  }

  const customerName = booking.customer?.full_name || 'Customer';
  const isActive = ['confirmed', 'in_progress'].includes(booking.status);
  const isCompleted = booking.status === 'completed';
  const showOtpInput = booking.status === 'confirmed' && !otpVerified;

  return (
    <div className="px-5 pt-6 space-y-5 pb-20">
      <div className="flex items-center gap-3">
        <Link to="/provider" className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center shadow-sm">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="font-heading text-lg font-bold">Manage Job</h1>
      </div>

      {/* Status Banner */}
      <div className={`rounded-2xl p-4 ${booking.status === 'confirmed' ? 'bg-blue-100 text-blue-700' : booking.status === 'in_progress' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100'}`}>
        <p className="font-heading font-bold text-lg capitalize">{booking.status}</p>
        <p className="text-xs opacity-80 mt-0.5">Current job status</p>
      </div>

      {/* OTP Required Banner */}
      {showOtpInput && (
        <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200">
          <div className="flex items-center gap-2 mb-2">
            <Key className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-semibold text-amber-700">OTP Required</span>
          </div>
          <p className="text-xs text-amber-600 mb-3">
            Ask the customer for the 6-digit OTP to verify identity before starting work.
          </p>
          <button
            onClick={() => setShowOtpDialog(true)}
            className="w-full py-2 bg-amber-600 text-white text-sm rounded-xl hover:bg-amber-700"
          >
            Enter OTP
          </button>
        </div>
      )}

      {/* OTP Verified Banner */}
      {otpVerified && (
        <div className="bg-green-50 rounded-2xl p-4 border border-green-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span className="text-sm font-semibold text-green-700">OTP Verified ✓</span>
          </div>
          <p className="text-xs text-green-600 mt-1">Identity verified. You can now start the service.</p>
        </div>
      )}

      {/* Customer Details */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-heading font-semibold text-sm">Customer Details</h3>
          <button className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
            <Phone className="w-3 h-3" /> Call
          </button>
        </div>
        <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
            <span className="font-bold text-blue-600">{customerName.charAt(0)}</span>
          </div>
          <div>
            <p className="font-semibold text-sm">{customerName}</p>
            <p className="text-xs text-gray-500">Customer</p>
          </div>
        </div>
        <div className="mt-3 space-y-2">
          <div className="flex justify-between text-sm"><span className="text-gray-500">Service Date</span><span className="font-medium">{booking.service_date}</span></div>
          <div className="flex justify-between text-sm"><span className="text-gray-500">Service Time</span><span className="font-medium">{booking.service_time}</span></div>
          <div className="flex justify-between text-sm"><span className="text-gray-500">Location</span><span className="font-medium">{booking.location}</span></div>
          {booking.notes && <div className="flex justify-between text-sm"><span className="text-gray-500">Notes</span><span className="font-medium">{booking.notes}</span></div>}
          <div className="flex justify-between text-sm"><span className="text-gray-500">Amount</span><span className="font-bold text-blue-600">₹{booking.total_amount}</span></div>
        </div>
      </div>

      {/* Start Work Button - Only after OTP verified */}
      {otpVerified && booking.status !== 'completed' && (
        <button
          onClick={() => setShowCostDialog(true)}
          className="w-full h-12 rounded-xl bg-green-600 text-white font-semibold"
        >
          Complete Job
        </button>
      )}

      {/* Completed State */}
      {isCompleted && (
        <div className="bg-green-50 rounded-2xl p-4 border border-green-200 text-center">
          <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
          <p className="font-heading font-bold text-green-700">Job Completed!</p>
          <p className="text-sm text-green-600 mt-1">Final amount: ₹{booking.total_amount}</p>
        </div>
      )}

      {/* OTP Dialog */}
      {showOtpDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5">
            <div className="text-center mb-4">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
                <Key className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-heading font-bold text-lg">Enter OTP</h3>
              <p className="text-sm text-gray-500 mt-1">Ask customer for the 6-digit code</p>
            </div>
            <input
              type="text"
              maxLength={6}
              placeholder="Enter 6-digit OTP"
              value={otpCode}
              onChange={(e) => {
                setOtpCode(e.target.value.replace(/[^0-9]/g, ''));
                setOtpError('');
              }}
              className="w-full px-4 py-3 text-center text-2xl tracking-widest rounded-xl border-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {otpError && <p className="text-xs text-red-500 mt-2">{otpError}</p>}
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowOtpDialog(false)} className="flex-1 py-3 rounded-xl border border-gray-200 bg-white">Cancel</button>
              <button onClick={verifyOTP} disabled={updating || otpCode.length !== 6} className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-semibold disabled:opacity-50">
                {updating ? 'Verifying...' : 'Verify OTP'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cost Dialog */}
      {showCostDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5">
            <h3 className="font-heading font-bold text-lg mb-2">Enter Final Cost</h3>
            <p className="text-sm text-gray-500 mb-4">Update the final amount for this job</p>
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 mb-4">
              <IndianRupee className="w-4 h-4 text-gray-500" />
              <input
                type="number"
                placeholder={`Estimated: ₹${booking.total_amount || 0}`}
                value={finalCost}
                onChange={(e) => setFinalCost(e.target.value)}
                className="flex-1 bg-transparent outline-none text-lg font-bold"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowCostDialog(false)} className="flex-1 h-11 rounded-xl border border-gray-200 bg-white">Cancel</button>
              <button onClick={handleComplete} className="flex-1 h-11 rounded-xl bg-green-600 text-white font-semibold">Complete Job</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}