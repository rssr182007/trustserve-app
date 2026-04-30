import React, { useRef, useState } from 'react';
import { X, ImagePlus, Loader2 } from 'lucide-react';
import { supabase } from '../../api/supabaseClient';

export default function PhotoUploader({ photos, onPhotosChange, maxPhotos = 5 }) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const uploadToSupabase = async (file) => {
    const fileExt = file.name.split('.').pop();
    const fileName = Date.now() + '_' + Math.random().toString(36).substring(2, 15) + '.' + fileExt;
    const filePath = 'service-photos/' + fileName;

    const { error } = await supabase.storage.from('service-app-files').upload(filePath, file);
    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage.from('service-app-files').getPublicUrl(filePath);
    return publicUrl;
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setUploading(true);
    const newPhotos = [...photos];

    for (const file of files) {
      if (newPhotos.length >= maxPhotos) break;
      try {
        const photoUrl = await uploadToSupabase(file);
        newPhotos.push(photoUrl);
      } catch (error) {
        alert('Failed to upload photo. Please try again.');
      }
    }

    onPhotosChange(newPhotos);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removePhoto = (index) => {
    onPhotosChange(photos.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {photos.map((url, i) => (
          <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
            <img src={url} alt={'Upload ' + (i + 1)} className="w-full h-full object-cover" />
            <button onClick={() => removePhoto(i)} className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center hover:bg-black/80">
              <X className="w-3 h-3 text-white" />
            </button>
          </div>
        ))}
        {photos.length < maxPhotos && (
          <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
            className="aspect-square rounded-xl border-2 border-dashed border-gray-200 hover:border-blue-300 flex flex-col items-center justify-center gap-1 transition-colors">
            {uploading ? <Loader2 className="w-6 h-6 text-gray-400 animate-spin" /> : <><ImagePlus className="w-6 h-6 text-gray-400" /><span className="text-[10px] text-gray-400">Add Photo</span></>}
          </button>
        )}
      </div>
      <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileSelect} />
    </div>
  );
}