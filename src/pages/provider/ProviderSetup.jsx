import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../api/supabaseClient';
import { useAuth } from '../../lib/AuthContext';
import { ArrowLeft, Camera } from 'lucide-react';
import { toast } from 'sonner';

export default function ProviderSetup() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadingSelfie, setUploadingSelfie] = useState(false);
  const [selfieUrl, setSelfieUrl] = useState('');
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    location: '',
    experience_years: '',
    hourly_rate: ''
  });

  const handleSelfieUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingSelfie(true);
    try {
      const fileName = `selfie_${user.id}_${Date.now()}.${file.name.split('.').pop()}`;
      const { error: uploadError } = await supabase.storage
        .from('service-app-files')
        .upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('service-app-files').getPublicUrl(fileName);
      setSelfieUrl(publicUrl);
      toast.success('Selfie uploaded!');
    } catch (error) {
      toast.error('Failed to upload selfie');
    } finally {
      setUploadingSelfie(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.full_name || !form.location) {
      toast.error('Please fill all required fields');
      return;
    }

    if (!selfieUrl) {
      toast.error('Please upload your selfie');
      return;
    }

    setLoading(true);

    try {
      // Update user_profiles
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          full_name: form.full_name,
          phone: form.phone,
          selfie_url: selfieUrl,
          role: 'provider'
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // First check if provider already exists
      const { data: existingProvider } = await supabase
        .from('providers')
        .select('id')
        .eq('id', user.id)
        .single();

      let providerError;
      
      if (existingProvider) {
        // Update existing
        const { error } = await supabase
          .from('providers')
          .update({
            location: form.location,
            is_available: true,
            experience_years: parseInt(form.experience_years) || 0,
            hourly_rate: parseFloat(form.hourly_rate) || 0
          })
          .eq('id', user.id);
        providerError = error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('providers')
          .insert({
            id: user.id,
            location: form.location,
            is_available: true,
            experience_years: parseInt(form.experience_years) || 0,
            hourly_rate: parseFloat(form.hourly_rate) || 0
          });
        providerError = error;
      }

      if (providerError) throw providerError;

      toast.success('Profile setup complete!');
      
      // Force hard redirect
      navigate('/provider/home',{ replace: true});
      window.location.reload();
      
    } catch (error) {
      console.error('Setup error:', error);
      toast.error('Failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-5">
      <button onClick={() => navigate(-1)} className="mb-4 text-blue-600">← Back</button>
      
      <div className="bg-white rounded-2xl p-5">
        <h1 className="text-xl font-bold mb-4">Provider Setup</h1>
        <p className="text-sm text-gray-500 mb-4">Complete your profile to start working</p>

        <div className="space-y-3">
          <input 
            type="text" 
            placeholder="Full Name *" 
            value={form.full_name} 
            onChange={(e) => setForm({...form, full_name: e.target.value})} 
            className="w-full p-3 border rounded-xl" 
          />
          
          <input 
            type="tel" 
            placeholder="Phone Number" 
            value={form.phone} 
            onChange={(e) => setForm({...form, phone: e.target.value})} 
            className="w-full p-3 border rounded-xl" 
          />
          
          <input 
            type="text" 
            placeholder="Service Location * (e.g., Anna Nagar, Chennai)" 
            value={form.location} 
            onChange={(e) => setForm({...form, location: e.target.value})} 
            className="w-full p-3 border rounded-xl" 
          />

          <input 
            type="number" 
            placeholder="Years of Experience" 
            value={form.experience_years} 
            onChange={(e) => setForm({...form, experience_years: e.target.value})} 
            className="w-full p-3 border rounded-xl" 
          />

          <input 
            type="number" 
            placeholder="Hourly Rate (₹)" 
            value={form.hourly_rate} 
            onChange={(e) => setForm({...form, hourly_rate: e.target.value})} 
            className="w-full p-3 border rounded-xl" 
          />

          <div className="text-center">
            <div className="w-32 h-32 rounded-full bg-gray-200 mx-auto flex items-center justify-center overflow-hidden">
              {selfieUrl ? <img src={selfieUrl} className="w-full h-full object-cover" /> : <Camera className="w-10 h-10" />}
            </div>
            <label className="cursor-pointer inline-block mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg">
              {selfieUrl ? 'Change Photo' : 'Upload Selfie'}
              <input type="file" accept="image/*" className="hidden" onChange={handleSelfieUpload} disabled={uploadingSelfie} />
            </label>
            <p className="text-xs text-gray-500 mt-1">This photo will be shown to customers for verification</p>
          </div>

          <button 
            onClick={handleSubmit} 
            disabled={loading || !selfieUrl} 
            className="w-full p-3 bg-green-600 text-white rounded-xl disabled:opacity-50 mt-4"
          >
            {loading ? 'Submitting...' : 'Complete Setup'}
          </button>
        </div>
      </div>
    </div>
  );
}