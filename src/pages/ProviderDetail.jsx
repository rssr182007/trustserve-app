import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../api/supabaseClient';
import { ArrowLeft, Star, MapPin, Briefcase, Clock, CheckCircle2, Phone } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function ProviderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completedJobs, setCompletedJobs] = useState(0);

  // Declare fetch functions first
  const fetchProvider = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('providers')
      .select('*, user_profiles (full_name, phone, selfie_url), service_categories (name)')
      .eq('id', id)
      .single();

    if (!error && data) {
      setProvider(data);
    } else {
      toast.error('Provider not found');
      navigate('/');
    }
    setLoading(false);
  };

  const fetchCompletedJobs = async () => {
    const { count, error } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('provider_id', id)
      .eq('status', 'completed');

    if (!error && count !== null) {
      setCompletedJobs(count);
    }
  };

  // Then use them in useEffect
  useEffect(() => {
    if (id) {
      fetchProvider();
      fetchCompletedJobs();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-6 h-6 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="px-5 pt-6 text-center">
        <p className="text-gray-500">Provider not found</p>
        <Link to="/" className="text-blue-600 text-sm mt-2 inline-block">Go back</Link>
      </div>
    );
  }

  const providerName = provider.user_profiles?.full_name || 'Service Provider';
  const providerPhoto = provider.user_profiles?.selfie_url;
  const providerRating = provider.total_rating || 0;
  const providerExperience = provider.experience_years || 0;
  const providerLocation = provider.location || 'Location not specified';
  const providerRate = provider.hourly_rate || 0;
  const categoryName = provider.service_categories?.name || 'Service';

  return (
    <div className="space-y-0">
      <div className="relative h-52 bg-gradient-to-br from-blue-500/20 to-blue-500/5">
        <Link to="/" className="absolute top-5 left-5 w-9 h-9 rounded-xl bg-white/80 backdrop-blur flex items-center justify-center shadow-sm z-10">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
          <div className="w-24 h-24 rounded-2xl bg-white border-4 border-gray-100 shadow-lg flex items-center justify-center overflow-hidden">
            {providerPhoto ? (
              <img src={providerPhoto} alt={providerName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl font-bold text-blue-600">{providerName.charAt(0)}</span>
            )}
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-5 pt-16 space-y-5"
      >
        <div className="text-center">
          <h1 className="font-heading text-xl font-bold">{providerName}</h1>
          <p className="text-sm text-gray-500 capitalize mt-0.5">{categoryName} Specialist</p>
          {provider.is_available && (
            <span className="inline-block mt-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
              Available Now
            </span>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl p-3 text-center border border-gray-100 shadow-sm">
            <Star className="w-5 h-5 text-amber-500 mx-auto" />
            <p className="text-lg font-bold mt-1">{providerRating.toFixed(1)}</p>
            <p className="text-[10px] text-gray-500">Rating</p>
          </div>
          <div className="bg-white rounded-xl p-3 text-center border border-gray-100 shadow-sm">
            <Briefcase className="w-5 h-5 text-blue-600 mx-auto" />
            <p className="text-lg font-bold mt-1">{completedJobs}</p>
            <p className="text-[10px] text-gray-500">Jobs Done</p>
          </div>
          <div className="bg-white rounded-xl p-3 text-center border border-gray-100 shadow-sm">
            <Clock className="w-5 h-5 text-emerald-500 mx-auto" />
            <p className="text-lg font-bold mt-1">{providerExperience}yr</p>
            <p className="text-[10px] text-gray-500">Experience</p>
          </div>
        </div>

        {provider.skills?.length > 0 && (
          <div>
            <h3 className="font-heading font-semibold text-sm mb-2">Skills</h3>
            <div className="flex flex-wrap gap-2">
              {provider.skills.map((skill) => (
                <span key={skill} className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                  <CheckCircle2 className="w-3 h-3 inline mr-1 text-green-500" />
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 text-sm text-gray-500 bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
          <MapPin className="w-4 h-4 text-blue-600" />
          <span>{providerLocation}</span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Hourly Rate</p>
              <p className="text-2xl font-bold text-blue-600">₹{providerRate}</p>
            </div>
            <p className="text-xs text-gray-500">per hour</p>
          </div>
        </div>

        <div className="flex gap-3 pb-6">
          <button className="flex-1 h-12 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 gap-2 flex items-center justify-center">
            <Phone className="w-4 h-4" /> Call
          </button>
          <button
            className="flex-[2] h-12 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700"
            onClick={() => navigate(`/book/${provider.id}`)}
          >
            Book Now
          </button>
        </div>
      </motion.div>
    </div>
  );
}