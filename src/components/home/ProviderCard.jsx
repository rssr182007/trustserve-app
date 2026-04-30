import { motion } from 'framer-motion';
import { Star, MapPin, Briefcase } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ProviderCard({ provider, index }) {
  const providerName = provider.user_profiles?.full_name || provider.name || 'Service Provider';
  const providerPhoto = provider.user_profiles?.selfie_url || provider.photo_url;
  const providerRating = provider.total_rating || provider.rating || 0;
  const providerReviews = provider.total_reviews || 0;
  const providerExperience = provider.experience_years || 0;
  const providerLocation = provider.location || 'Nearby';
  const providerRate = provider.hourly_rate || 0;
  const providerId = provider.id;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
    >
      <Link to={`/provider/${providerId}`} className="block">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
          <div className="flex gap-3">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/5 flex items-center justify-center shrink-0 overflow-hidden">
              {providerPhoto ? (
                <img src={providerPhoto} alt={providerName} className="w-full h-full object-cover rounded-xl" />
              ) : (
                <span className="text-xl font-bold text-blue-600">{providerName.charAt(0)}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-heading font-semibold text-sm truncate">{providerName}</h3>
                {provider.is_available && (
                  <span className="bg-green-100 text-green-700 text-[10px] px-1.5 py-0.5 rounded-full shrink-0">
                    Available
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1">
                <div className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span className="text-xs font-medium">{providerRating.toFixed(1)}</span>
                  <span className="text-[10px] text-gray-500">({providerReviews})</span>
                </div>
                <div className="flex items-center gap-1 text-gray-500">
                  <Briefcase className="w-3 h-3" />
                  <span className="text-[10px]">{providerExperience}y exp</span>
                </div>
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-1 text-gray-500">
                  <MapPin className="w-3 h-3" />
                  <span className="text-[10px]">{providerLocation}</span>
                </div>
                <span className="text-sm font-bold text-blue-600">₹{providerRate}/hr</span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}