import React from 'react';
import { Calendar, Clock, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

const statusConfig = {
  pending: { label: 'Pending', className: 'bg-amber-100 text-amber-700' },
  confirmed: { label: 'Confirmed', className: 'bg-green-100 text-green-700' },
  in_progress: { label: 'In Progress', className: 'bg-blue-100 text-blue-700' },
  completed: { label: 'Completed', className: 'bg-gray-100 text-gray-700' },
  cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-700' },
};

export default function BookingCard({ booking, index }) {
  const status = statusConfig[booking.status] || statusConfig.pending;
  const providerName = booking.provider?.user_profiles?.full_name || booking.provider_name || 'Service Provider';
  const providerInitial = providerName.charAt(0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg bg-blue-100 flex items-center justify-center">
            <span className="text-lg font-bold text-blue-600">{providerInitial}</span>
          </div>
          <div>
            <h3 className="font-heading font-semibold text-sm">{providerName}</h3>
            <p className="text-xs text-gray-500 capitalize">Service</p>
          </div>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full ${status.className}`}>
          {status.label}
        </span>
      </div>

      <div className="space-y-1.5 text-xs text-gray-500">
        {booking.service_date && (
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5" />
            <span>{format(new Date(booking.service_date), 'MMM d, yyyy')}</span>
          </div>
        )}
        {booking.service_time && (
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5" />
            <span>{booking.service_time}</span>
          </div>
        )}
        {booking.location && (
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5" />
            <span className="truncate">{booking.location}</span>
          </div>
        )}
      </div>

      {booking.total_amount && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
          <span className="text-xs text-gray-500">Total Amount</span>
          <span className="text-sm font-bold text-blue-600">₹{booking.total_amount}</span>
        </div>
      )}
    </motion.div>
  );
}