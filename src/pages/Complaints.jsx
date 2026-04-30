import React, { useState, useEffect } from 'react';
import { supabase } from '../api/supabaseClient';
import { useAuth } from '../lib/AuthContext';
import { MessageSquareWarning, Plus, X } from 'lucide-react';
import VoiceRecorder from '../components/shared/VoiceRecorder';
import PhotoUploader from '../components/shared/PhotoUploader';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { toast } from 'sonner';

const statusColors = {
  pending: 'bg-amber-100 text-amber-700',
  in_review: 'bg-blue-100 text-blue-700',
  resolved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

const categoryLabels = {
  service_quality: 'Service Quality',
  pricing: 'Pricing Issue',
  behavior: 'Behavior',
  delay: 'Delay',
  damage: 'Damage',
  other: 'Other',
};

export default function Complaints() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    voice_url: '',
    photo_urls: [],
    priority: 'medium',
  });

  const fetchComplaints = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('complaints')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setComplaints(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      fetchComplaints();
    }
  }, [user]);

  const handleSubmit = async () => {
    if (!form.title) {
      toast.error('Please enter a title');
      return;
    }

    setSubmitting(true);
    
    const complaintData = {
      user_id: user.id,
      title: form.title,
      description: form.description,
      category: form.category,
      voice_url: form.voice_url,
      photo_urls: form.photo_urls,
      priority: form.priority,
      status: 'pending'
    };

    const { error } = await supabase
      .from('complaints')
      .insert([complaintData]);

    if (!error) {
      toast.success('Complaint submitted successfully');
      setOpen(false);
      setForm({ title: '', description: '', category: '', voice_url: '', photo_urls: [], priority: 'medium' });
      fetchComplaints();
    } else {
      toast.error('Failed to submit complaint');
    }
    setSubmitting(false);
  };

  return (
    <div className="px-5 pt-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
            <MessageSquareWarning className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h1 className="font-heading text-xl font-bold">Complaints</h1>
            <p className="text-xs text-gray-500">{complaints.length} complaint(s)</p>
          </div>
        </div>

        <button onClick={() => setOpen(true)} className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-xl flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> New
        </button>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
        </div>
      )}

      {!loading && complaints.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
          <MessageSquareWarning className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No complaints filed</p>
        </motion.div>
      )}

      <div className="space-y-3">
        {complaints.map((c, i) => (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm"
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-heading font-semibold text-sm">{c.title}</h3>
              <span className={`px-2 py-0.5 rounded-full text-[10px] ${statusColors[c.status] || statusColors.pending}`}>
                {c.status?.replace('_', ' ')}
              </span>
            </div>
            {c.category && (
              <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-[10px] mb-2">
                {categoryLabels[c.category] || c.category}
              </span>
            )}
            {c.description && (
              <p className="text-xs text-gray-500 line-clamp-2">{c.description}</p>
            )}
            {c.voice_url && (
              <div className="mt-2 flex items-center gap-2 text-xs text-blue-600">
                <span className="w-2 h-2 bg-blue-600 rounded-full" /> Voice recording attached
              </div>
            )}
            {c.photo_urls?.length > 0 && (
              <div className="flex gap-1.5 mt-2">
                {c.photo_urls.slice(0, 3).map((url, j) => (
                  <div key={j} className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
                {c.photo_urls.length > 3 && (
                  <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-500">
                    +{c.photo_urls.length - 3}
                  </div>
                )}
              </div>
            )}
            <p className="text-[10px] text-gray-400 mt-2">
              {c.created_at && format(new Date(c.created_at), 'MMM d, yyyy h:mm a')}
            </p>
          </motion.div>
        ))}
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[85vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between">
              <h3 className="font-heading font-bold text-lg">File a Complaint</h3>
              <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Title</label>
                <input
                  type="text"
                  placeholder="Brief complaint title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select category</option>
                  {Object.entries(categoryLabels).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Priority</label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Description</label>
                <textarea
                  placeholder="Describe your complaint in detail..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                  rows={3}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Voice Recording</label>
                <VoiceRecorder voiceUrl={form.voice_url} onVoiceChange={(url) => setForm({ ...form, voice_url: url })} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Photos</label>
                <PhotoUploader photos={form.photo_urls} onPhotosChange={(urls) => setForm({ ...form, photo_urls: urls })} />
              </div>
              <button
                className="w-full h-11 rounded-xl bg-blue-600 text-white font-semibold disabled:opacity-50"
                onClick={handleSubmit}
                disabled={!form.title || submitting}
              >
                {submitting ? 'Submitting...' : 'Submit Complaint'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="h-4" />
    </div>
  );
}