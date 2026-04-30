import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../api/supabaseClient';
import { ArrowLeft, SlidersHorizontal } from 'lucide-react';
import ProviderCard from '../components/home/ProviderCard';
import { motion } from 'framer-motion';

const categoryLabels = {
  plumbing: 'Plumbing',
  electrical: 'Electrical',
  carpentry: 'Carpentry',
  painting: 'Painting',
  cleaning: 'Cleaning',
  appliance_repair: 'Appliance Repair',
};

export default function ServiceList() {
  const { category } = useParams();
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('rating');
  const [showFilters, setShowFilters] = useState(false);

  // Declare fetchProviders first
  const fetchProviders = async () => {
    setLoading(true);
    let query = supabase
      .from('providers')
      .select('*, user_profiles (full_name, phone, selfie_url), service_categories (name)')
      .eq('is_available', true);

    const categoryName = categoryLabels[category] || category;
    query = query.eq('service_categories.name', categoryName);

    if (sortBy === 'rating') {
      query = query.order('total_rating', { ascending: false });
    } else if (sortBy === 'price_low') {
      query = query.order('hourly_rate', { ascending: true });
    } else if (sortBy === 'price_high') {
      query = query.order('hourly_rate', { ascending: false });
    }

    const { data, error } = await query.limit(50);
    if (!error && data) setProviders(data);
    setLoading(false);
  };

  // Then use it in useEffect
  useEffect(() => {
    if (category) fetchProviders();
  }, [category, sortBy]);

  return (
    <div className="px-5 pt-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center shadow-sm">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="font-heading text-lg font-bold">{categoryLabels[category] || 'Services'}</h1>
        </div>
        <button onClick={() => setShowFilters(!showFilters)} className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center shadow-sm">
          <SlidersHorizontal className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {showFilters && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm"
        >
          <p className="text-xs font-medium mb-2">Sort by</p>
          <div className="flex gap-2">
            <button
              onClick={() => setSortBy('rating')}
              className={`px-3 py-1.5 text-xs rounded-full transition-colors ${
                sortBy === 'rating' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              Top Rated
            </button>
            <button
              onClick={() => setSortBy('price_low')}
              className={`px-3 py-1.5 text-xs rounded-full transition-colors ${
                sortBy === 'price_low' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              Price: Low to High
            </button>
            <button
              onClick={() => setSortBy('price_high')}
              className={`px-3 py-1.5 text-xs rounded-full transition-colors ${
                sortBy === 'price_high' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              Price: High to Low
            </button>
          </div>
        </motion.div>
      )}

      <p className="text-sm text-gray-500">{providers.length} professional(s) available</p>

      <div className="space-y-3">
        {loading && (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
          </div>
        )}
        {!loading && providers.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
            <p className="text-gray-500 text-sm">No providers available in this category yet.</p>
          </motion.div>
        )}
        {!loading && providers.map((p, i) => (
          <ProviderCard key={p.id} provider={p} index={i} />
        ))}
      </div>

      <div className="h-4" />
    </div>
  );
}