import React, { useState, useEffect } from 'react';
import { supabase } from '../../api/supabaseClient';
import { useAuth } from '../../lib/AuthContext';
import { Star, Briefcase, IndianRupee, LogOut, ChevronRight, HelpCircle, Settings, Edit2, Camera } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function ProviderProfile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [provider, setProvider] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [uploadingSelfie, setUploadingSelfie] = useState(false);
  const [editForm, setEditForm] = useState({ hourly_rate: '', location: '', skills: '' });

  const fetchProviderProfile = async () => {
    const { data, error } = await supabase
      .from('providers')
      .select('*, user_profiles (id, full_name, phone, selfie_url), service_categories (name)')
      .eq('id', user.id)
      .single();

    if (!error && data) {
      setProvider(data);
      setEditForm({ hourly_rate: data.hourly_rate || '', location: data.location || '', skills: data.skills?.join(', ') || '' });
    }
    setLoading(false);
  };

  const fetchJobs = async () => {
    const { data } = await supabase.from('bookings').select('*').eq('provider_id', user.id);
    if (data) setJobs(data);
  };

  useEffect(() => {
    if (user) {
      fetchProviderProfile();
      fetchJobs();
    }
  }, [user]);

  const handleUpdateProfile = async () => {
    const skillsArray = editForm.skills.split(',').map(s => s.trim()).filter(s => s);
    const { error } = await supabase
      .from('providers')
      .update({
        hourly_rate: parseFloat(editForm.hourly_rate) || provider?.hourly_rate,
        location: editForm.location || provider?.location,
        skills: skillsArray,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (!error) {
      toast.success('Profile updated successfully');
      setEditing(false);
      fetchProviderProfile();
    } else {
      toast.error('Failed to update profile');
    }
  };

  const handleSelfieUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size should be less than 2MB');
      return;
    }

    setUploadingSelfie(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `selfie_${user.id}_${Date.now()}.${fileExt}`;
      const filePath = `provider-selfies/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('service-app-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('service-app-files')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ selfie_url: publicUrl, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (updateError) throw updateError;

      toast.success('Selfie uploaded successfully!');
      fetchProviderProfile();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload selfie');
    } finally {
      setUploadingSelfie(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/role-select');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-6 h-6 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="px-5 pt-6 text-center py-20">
        <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-sm text-gray-500">Provider profile not found</p>
      </div>
    );
  }

  const completed = jobs.filter((j) => j.status === 'completed');
  const totalEarnings = completed.reduce((s, j) => s + (j.total_amount || 0), 0);
  const providerName = provider.user_profiles?.full_name || 'Provider';
  const providerPhoto = provider.user_profiles?.selfie_url;
  const providerRating = provider.total_rating || 0;

  return (
    <div className="px-5 pt-6 space-y-5 pb-20">
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center relative">
        <button onClick={() => setEditing(!editing)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200">
          <Edit2 className="w-4 h-4 text-gray-600" />
        </button>
        
        {/* Profile Photo with Camera Icon */}
        <div className="relative inline-block">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center mx-auto mb-3 overflow-hidden">
            {providerPhoto ? (
              <img src={providerPhoto} alt={providerName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl font-bold text-white">{providerName.charAt(0)}</span>
            )}
          </div>
          <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors shadow-md">
            <Camera className="w-4 h-4 text-white" />
            <input type="file" accept="image/*" className="hidden" onChange={handleSelfieUpload} disabled={uploadingSelfie} />
          </label>
        </div>
        
        {uploadingSelfie && (
          <p className="text-xs text-blue-600 mt-1">Uploading...</p>
        )}
        
        <h1 className="font-heading text-lg font-bold mt-2">{providerName}</h1>
        <div className="flex items-center justify-center gap-2 mt-2">
          <span className={`px-2 py-0.5 rounded-full text-xs ${provider.is_available ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
            {provider.is_available ? '🟢 Online' : '⚫ Offline'}
          </span>
          {providerPhoto && (
            <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">
              ✓ Verified
            </span>
          )}
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5">
            <h3 className="font-heading font-bold text-lg mb-4">Edit Profile</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Hourly Rate (₹)</label>
                <input type="number" value={editForm.hourly_rate} onChange={(e) => setEditForm({...editForm, hourly_rate: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-gray-200" placeholder="Hourly rate" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Location</label>
                <input type="text" value={editForm.location} onChange={(e) => setEditForm({...editForm, location: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-gray-200" placeholder="Your service area" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Skills (comma separated)</label>
                <input type="text" value={editForm.skills} onChange={(e) => setEditForm({...editForm, skills: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-gray-200" placeholder="Plumbing, Pipe fitting, Leak repair" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setEditing(false)} className="flex-1 h-11 rounded-xl border border-gray-200 bg-white">Cancel</button>
              <button onClick={handleUpdateProfile} className="flex-1 h-11 rounded-xl bg-blue-600 text-white font-semibold">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl p-3 text-center border border-gray-100 shadow-sm">
          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center mx-auto mb-1"><Briefcase className="w-4 h-4 text-blue-600" /></div>
          <p className="text-lg font-bold">{completed.length}</p>
          <p className="text-[9px] text-gray-500">Jobs Done</p>
        </div>
        <div className="bg-white rounded-xl p-3 text-center border border-gray-100 shadow-sm">
          <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center mx-auto mb-1"><Star className="w-4 h-4 text-amber-500" /></div>
          <p className="text-lg font-bold">{providerRating.toFixed(1)}</p>
          <p className="text-[9px] text-gray-500">Rating</p>
        </div>
        <div className="bg-white rounded-xl p-3 text-center border border-gray-100 shadow-sm">
          <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center mx-auto mb-1"><IndianRupee className="w-4 h-4 text-emerald-500" /></div>
          <p className="text-lg font-bold">₹{totalEarnings}</p>
          <p className="text-[9px] text-gray-500">Earnings</p>
        </div>
      </div>

      {provider.skills?.length > 0 && (
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <h3 className="font-heading font-semibold text-sm mb-2">Skills</h3>
          <div className="flex flex-wrap gap-2">
            {provider.skills.map((s) => (
              <span key={s} className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">{s}</span>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <Link to="/settings" className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors border-b border-gray-100">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center"><Settings className="w-4 h-4 text-blue-600" /></div>
          <span className="flex-1 text-sm font-medium text-gray-800">Account Settings</span>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </Link>
        <Link to="/support" className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center"><HelpCircle className="w-4 h-4 text-blue-600" /></div>
          <span className="flex-1 text-sm font-medium text-gray-800">Help & Support</span>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </Link>
      </div>

      <button className="w-full h-11 rounded-xl gap-2 border border-red-200 text-red-600 hover:bg-red-50 transition-colors flex items-center justify-center" onClick={handleLogout}>
        <LogOut className="w-4 h-4" /> Sign Out
      </button>
    </div>
  );
}