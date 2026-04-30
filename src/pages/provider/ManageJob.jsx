import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../api/supabaseClient';
import { useAuth } from '../../lib/AuthContext';
import { ArrowLeft, Navigation, MapPin, Wrench, CheckCircle2, IndianRupee, Phone, Shield, Key } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const nextStatusMap = {
  pending: { next: 'confirmed', label: 'Accept Job', icon: CheckCircle2, color: 'bg-green-600' },
  confirmed: { next: 'in_progress', label: 'Start Work', icon: Wrench, color: 'bg-blue-600' },
  in_progress: { next: 'completed', label: 'Mark as Completed', icon: CheckCircle2, color: 'bg-green-600' },
};

const statusColors = {
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-purple-100 text-purple-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function ManageJob() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showCostDialog, setShowCostDialog] = useState(false);
  const [finalCost, setFinalCost] = useState('');
  const [customer, setCustomer] = useState(null);
  const [showOtpDialog, setShowOtpDialog] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpError, setOtpError] = useState('');

  const fetchBooking = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('bookings')
      .select('*, customer:customer_id (full_name, phone), provider:provider_id (hourly_rate)')
      .eq('id', id)
      .single();

    if (!error && data) {
      setBooking(data);
      if (data.customer) setCustomer(data.customer);
      
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

  const updateBookingStatus = async (newStatus, additionalData = {}) => {
    setUpdating(true);
    const updateData = { status: newStatus, updated_at: new Date().toISOString(), ...additionalData };
    const { error } = await supabase.from('bookings').update(updateData).eq('id', id);

    if (!error) {
      toast.success(newStatus === 'completed' ? 'Job completed successfully!' : 'Job updated successfully!');
      fetchBooking();
      if (newStatus === 'completed') navigate('/provider');
    } else {
      toast.error('Failed to update status');
    }
    setUpdating(false);
  };

  const verifyOTP = async () => {
    if (!otpCode || otpCode.length !== 6) {
      setOtpError('Please enter a valid 6-digit OTP');
      return;
    }

    setUpdating(true);
    setOtpError('');

    // Check OTP in database
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

    // Check if OTP is expired
    const expiryTime = new Date(data.expires_at);
    if (expiryTime < new Date()) {
      setOtpError('OTP has expired. Please ask customer to generate a new one.');
      setUpdating(false);
      return;
    }

    // Mark OTP as verified
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
    setUpdating(false);
  };

  const handleNextStatus = () => {
    const next = nextStatusMap[booking?.status];
    if (!next) return;
    
    // For confirming job, check if OTP is verified
    if (next.next === 'in_progress' && !otpVerified) {
      setShowOtpDialog(true);
      return;
    }
    
    if (next.next === 'completed') {
      setShowCostDialog(true);
    } else {
      updateBookingStatus(next.next);
    }
  };

  const handleComplete = () => {
    const finalAmount = parseFloat(finalCost) || booking?.total_amount || 0;
    updateBookingStatus('completed', { total_amount: finalAmount });
    setShowCostDialog(false);
  };

  const handleCallCustomer = () => {
    if (customer?.phone) {
      window.location.href = 'tel:' + customer.phone;
    } else {
      toast.error('Customer phone number not available');
    }
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

  const next = nextStatusMap[booking.status];
  const NextIcon = next?.icon;
  const customerName = customer?.full_name || 'Customer';
  const customerInitial = customerName.charAt(0);

  return (
    <div className="px-5 pt-6 space-y-5 pb-20">
      <div className="flex items-center gap-3">
        <Link to="/provider" className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center shadow-sm">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="font-heading text-lg font-bold">Manage Job</h1>
      </div>

      {/* OTP Status Banner */}
      {booking.status === 'confirmed' && !otpVerified && (
        <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-semibold text-amber-700">OTP Verification Required</span>
          </div>
          <p className="text-xs text-amber-600">
            Ask the customer for the 6-digit OTP to verify identity before starting work.
          </p>
        </div>
      )}

      {booking.status === 'confirmed' && otpVerified && (
        <div className="bg-green-50 rounded-2xl p-4 border border-green-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span className="text-sm font-semibold text-green-700">OTP Verified ✓</span>
          </div>
          <p className="text-xs text-green-600 mt-1">Identity verified. You can now start the service.</p>
        </div>
      )}

      <motion.div
        key={booking.status}
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`rounded-2xl p-4 ${statusColors[booking.status] || 'bg-gray-100 text-gray-700'}`}
      >
        <p className="font-heading font-bold text-lg capitalize">{booking.status?.replace('_', ' ')}</p>
        <p className="text-xs opacity-80 mt-0.5">Current job status</p>
      </motion.div>

      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-heading font-semibold text-sm">Customer Details</h3>
          <button onClick={handleCallCustomer} className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
            <Phone className="w-3 h-3" /> Call
          </button>
        </div>
        <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
            <span className="font-bold text-blue-600">{customerInitial}</span>
          </div>
          <div>
            <p className="font-semibold text-sm">{customerName}</p>
            <p className="text-xs text-gray-500">Customer</p>
          </div>
        </div>
        <div className="flex gap-3 text-sm"><span className="text-gray-500 w-24 shrink-0">Service Date</span><span className="font-medium">{booking.service_date}</span></div>
        <div className="flex gap-3 text-sm"><span className="text-gray-500 w-24 shrink-0">Service Time</span><span className="font-medium">{booking.service_time}</span></div>
        <div className="flex gap-3 text-sm"><span className="text-gray-500 w-24 shrink-0">Location</span><span className="font-medium">{booking.location}</span></div>
        {booking.notes && <div className="flex gap-3 text-sm"><span className="text-gray-500 w-24 shrink-0">Notes</span><span className="font-medium">{booking.notes}</span></div>}
        <div className="flex gap-3 text-sm"><span className="text-gray-500 w-24 shrink-0">Amount</span><span className="font-bold text-blue-600">₹{booking.total_amount || 0}</span></div>
      </div>

      {booking.photo_urls?.length > 0 && (
        <div>
          <h3 className="font-heading font-semibold text-sm mb-2">Problem Photos</h3>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {booking.photo_urls.map((url, i) => (
              <div key={i} className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                <img src={url} alt="Problem" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      )}

      {next && booking.status !== 'completed' && (
        <button
          className={`w-full h-12 rounded-xl font-semibold gap-2 flex items-center justify-center ${next.color} text-white`}
          onClick={handleNextStatus}
          disabled={updating}
        >
          {NextIcon && <NextIcon className="w-5 h-5" />}
          {updating ? 'Updating...' : next.label}
        </button>
      )}

      {booking.status === 'completed' && (
        <div className="bg-green-50 rounded-2xl p-4 border border-green-200 text-center">
          <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
          <p className="font-heading font-bold text-green-700">Job Completed!</p>
          <p className="text-sm text-green-600 mt-1">Final amount: ₹{booking.total_amount || 0}</p>
        </div>
      )}

      {/* OTP Verification Dialog */}
      {showOtpDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl max-w-md w-full p-5"
          >
            <div className="text-center mb-4">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
                <Key className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-heading font-bold text-lg">Enter OTP</h3>
              <p className="text-sm text-gray-500 mt-1">
                Ask the customer for the 6-digit OTP to verify identity
              </p>
            </div>

            <div className="mb-4">
              <label className="text-sm font-medium mb-2 block">6-Digit OTP</label>
              <input
                type="text"
                maxLength={6}
                placeholder="Enter 6-digit code"
                value={otpCode}
                onChange={(e) => {
                  setOtpCode(e.target.value.replace(/[^0-9]/g, ''));
                  setOtpError('');
                }}
                className="w-full px-4 py-3 text-center text-2xl tracking-widest rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {otpError && (
                <p className="text-xs text-red-500 mt-1">{otpError}</p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowOtpDialog(false)}
                className="flex-1 py-3 rounded-xl border border-gray-200 bg-white font-medium"
              >
                Cancel
              </button>
              <button
                onClick={verifyOTP}
                disabled={updating || !otpCode}
                className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-semibold disabled:opacity-50"
              >
                {updating ? 'Verifying...' : 'Verify OTP'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Cost Dialog */}
      {showCostDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl max-w-md w-full p-5"
          >
            <h3 className="font-heading font-bold text-lg mb-2">Enter Final Cost</h3>
            <p className="text-sm text-gray-500 mb-4">Update the final amount for this job</p>
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 mb-4">
              <IndianRupee className="w-4 h-4 text-gray-500" />
              <input
                type="number"
                placeholder={'Estimated: ₹' + (booking.total_amount || 0)}
                value={finalCost}
                onChange={(e) => setFinalCost(e.target.value)}
                className="flex-1 bg-transparent outline-none text-lg font-bold"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowCostDialog(false)} className="flex-1 h-11 rounded-xl border border-gray-200 bg-white">
                Cancel
              </button>
              <button onClick={handleComplete} className="flex-1 h-11 rounded-xl bg-green-600 text-white font-semibold">
                Complete Job
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <div className="h-4" />
    </div>
  );
}