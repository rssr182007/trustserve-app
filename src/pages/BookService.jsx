import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../api/supabaseClient';
import { useAuth } from '../lib/AuthContext';
import { ArrowLeft, CalendarDays, Clock, MapPin, FileText, CheckCircle } from 'lucide-react';
import PhotoUploader from '../components/shared/PhotoUploader';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const timeSlots = ['09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'];

export default function BookService() {
  const { providerId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [booked, setBooked] = useState(false);
  const [form, setForm] = useState({
    service_date: '',
    service_time: '',
    location: '',
    notes: '',
    photo_urls: [],
  });

  const fetchProvider = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('providers')
      .select('*, user_profiles (full_name, phone, selfie_url), service_categories (name)')
      .eq('id', providerId)
      .single();

    if (!error && data) {
      setProvider(data);
    } else {
      toast.error('Provider not found');
      navigate('/');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (providerId) {
      fetchProvider();
    }
  }, [providerId]);

  const handleBooking = async () => {
    if (!user) {
      toast.error('Please login to book service');
      navigate('/role-select');
      return;
    }

    const bookingData = {
      customer_id: user.id,
      provider_id: providerId,
      service_date: form.service_date,
      service_time: form.service_time,
      location: form.location,
      notes: form.notes,
      total_amount: provider?.hourly_rate || 0,
      status: 'pending'
    };

    const { error } = await supabase
      .from('bookings')
      .insert([bookingData]);

    if (error) {
      toast.error('Failed to book service: ' + error.message);
    } else {
      setBooked(true);
      toast.success('Booking confirmed successfully!');
    }
  };

  if (booked) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="min-h-screen flex flex-col items-center justify-center px-8 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6"
        >
          <CheckCircle className="w-10 h-10 text-green-600" />
        </motion.div>
        <h1 className="font-heading text-2xl font-bold">Booking Confirmed!</h1>
        <p className="text-sm text-gray-500 mt-2 max-w-xs">
          Your service has been booked. You'll receive a confirmation shortly.
        </p>
        <div className="flex gap-3 mt-8 w-full">
          <button className="flex-1 h-11 rounded-xl border border-gray-200 bg-white" onClick={() => navigate('/bookings')}>
            My Bookings
          </button>
          <button className="flex-1 h-11 rounded-xl bg-blue-600 text-white" onClick={() => navigate('/')}>
            Home
          </button>
        </div>
      </motion.div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-6 h-6 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  const providerName = provider?.user_profiles?.full_name || 'Service Provider';
  const categoryName = provider?.service_categories?.name || 'Service';

  return (
    <div className="px-5 pt-6 space-y-5">
      <div className="flex items-center gap-3">
        <Link to="/" className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center shadow-sm">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="font-heading text-lg font-bold">Book Service</h1>
      </div>

      <div className="flex items-center gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className={`flex-1 h-1 rounded-full transition-colors ${step >= s ? 'bg-blue-600' : 'bg-gray-200'}`} />
        ))}
      </div>

      {provider && (
        <div className="bg-white rounded-xl p-3 border border-gray-100 flex items-center gap-3 shadow-sm">
          <div className="w-11 h-11 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
            <span className="text-lg font-bold text-blue-600">{providerName.charAt(0)}</span>
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">{providerName}</p>
            <p className="text-xs text-gray-500 capitalize">{categoryName}</p>
          </div>
          <p className="text-sm font-bold text-blue-600">₹{provider.hourly_rate}/hr</p>
        </div>
      )}

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
            <div>
              <label className="text-sm font-medium flex items-center gap-1.5 mb-2">
                <CalendarDays className="w-4 h-4 text-blue-600" /> Select Date
              </label>
              <input
                type="date"
                value={form.service_date}
                onChange={(e) => setForm({ ...form, service_date: e.target.value })}
                className="w-full h-11 px-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium flex items-center gap-1.5 mb-2">
                <Clock className="w-4 h-4 text-blue-600" /> Select Time
              </label>
              <div className="grid grid-cols-4 gap-2">
                {timeSlots.map((slot) => (
                  <button
                    key={slot}
                    onClick={() => setForm({ ...form, service_time: slot })}
                    className={`py-2 px-2 rounded-lg text-xs font-medium transition-all ${
                      form.service_time === slot
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-white border border-gray-200 text-gray-700 hover:border-blue-300'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>
            <button
              className="w-full h-11 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 mt-4"
              disabled={!form.service_date || !form.service_time}
              onClick={() => setStep(2)}
            >
              Continue
            </button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
            <div>
              <label className="text-sm font-medium flex items-center gap-1.5 mb-2">
                <MapPin className="w-4 h-4 text-blue-600" /> Service Address
              </label>
              <textarea
                placeholder="Enter your full address..."
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
              />
            </div>
            <div>
              <label className="text-sm font-medium flex items-center gap-1.5 mb-2">
                <FileText className="w-4 h-4 text-blue-600" /> Describe the Problem
              </label>
              <textarea
                placeholder="What needs to be fixed or serviced?"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
              />
            </div>
            <div className="flex gap-3">
              <button className="flex-1 h-11 rounded-xl border border-gray-200 bg-white hover:bg-gray-50" onClick={() => setStep(1)}>
                Back
              </button>
              <button className="flex-1 h-11 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700" disabled={!form.location} onClick={() => setStep(3)}>
                Continue
              </button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Upload Photos of the Problem</label>
              <PhotoUploader photos={form.photo_urls} onPhotosChange={(urls) => setForm({ ...form, photo_urls: urls })} />
            </div>

            <div className="bg-white rounded-xl p-4 border border-gray-100 space-y-2">
              <h3 className="font-heading font-semibold text-sm">Booking Summary</h3>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Date</span><span className="font-medium">{form.service_date}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Time</span><span className="font-medium">{form.service_time}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Est. Cost</span><span className="font-bold text-blue-600">₹{provider?.hourly_rate || 0}</span></div>
              </div>
            </div>

            <div className="flex gap-3">
              <button className="flex-1 h-11 rounded-xl border border-gray-200 bg-white hover:bg-gray-50" onClick={() => setStep(2)}>
                Back
              </button>
              <button className="flex-1 h-11 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700" onClick={handleBooking}>
                Confirm Booking
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="h-4" />
    </div>
  );
}