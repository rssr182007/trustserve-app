import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Wrench, Zap, Hammer, Paintbrush, Sparkles, Settings } from 'lucide-react';

const categoryConfig = {
  plumbing: { icon: Wrench, gradient: 'from-blue-500 to-cyan-400', label: 'Plumbing' },
  electrical: { icon: Zap, gradient: 'from-amber-400 to-orange-500', label: 'Electrical' },
  carpentry: { icon: Hammer, gradient: 'from-emerald-500 to-green-400', label: 'Carpentry' },
  painting: { icon: Paintbrush, gradient: 'from-purple-500 to-pink-400', label: 'Painting' },
  cleaning: { icon: Sparkles, gradient: 'from-sky-400 to-blue-500', label: 'Cleaning' },
  appliance_repair: { icon: Settings, gradient: 'from-red-400 to-rose-500', label: 'Appliance' },
};

export default function ServiceCategoryCard({ category, index }) {
  const config = categoryConfig[category] || categoryConfig.plumbing;
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
    >
      <Link
        to={`/services/${category}`}
        className="flex flex-col items-center gap-2 group"
      >
        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200`}>
          <Icon className="w-7 h-7 text-white" />
        </div>
        <span className="text-xs font-medium text-gray-800">{config.label}</span>
      </Link>
    </motion.div>
  );
}