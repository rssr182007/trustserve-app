import React, { useState, useRef } from 'react';
import { Mic, Square, Play, Pause, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/api/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export default function VoiceRecorder({ voiceUrl, onVoiceChange }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const audioRef = useRef(null);
  const timerRef = useRef(null);

  const uploadToSupabase = async (file) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `voice-recordings/${fileName}`;

    const { error } = await supabase.storage
      .from('service-app-files')
      .upload(filePath, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('service-app-files')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      setDuration(0);

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        clearInterval(timerRef.current);

        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const file = new File([blob], `voice_${Date.now()}.webm`, { type: 'audio/webm' });

        setUploading(true);
        try {
          const fileUrl = await uploadToSupabase(file);
          onVoiceChange(fileUrl);
          toast.success('Recording uploaded successfully');
        } catch (error) {
          console.error('Upload error:', error);
          toast.error('Failed to upload recording');
        }
        setUploading(false);
      };

      mediaRecorder.start();
      setIsRecording(true);
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    } catch (error) {
      console.error('Microphone error:', error);
      toast.error('Microphone access denied. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const togglePlay = () => {
    if (!voiceUrl) return;
    
    if (!audioRef.current) {
      audioRef.current = new Audio(voiceUrl);
      audioRef.current.onended = () => setIsPlaying(false);
      audioRef.current.onerror = () => {
        toast.error('Failed to play audio');
        setIsPlaying(false);
      };
    }
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {
        toast.error('Failed to play audio');
      });
    }
    setIsPlaying(!isPlaying);
  };

  const deleteRecording = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    onVoiceChange('');
    setIsPlaying(false);
    setDuration(0);
    toast.info('Recording removed');
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="space-y-2">
      <AnimatePresence mode="wait">
        {voiceUrl ? (
          <motion.div
            key="playback"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex items-center gap-3 bg-primary/5 rounded-xl px-4 py-3"
          >
            <Button size="icon" variant="ghost" className="h-10 w-10 rounded-full bg-primary text-primary-foreground" onClick={togglePlay}>
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </Button>
            <div className="flex-1">
              <div className="h-1 bg-primary/20 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary rounded-full"
                  animate={{ width: isPlaying ? '100%' : '0%' }}
                  transition={{ duration: duration || 5, ease: 'linear' }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">Voice recording attached</p>
            </div>
            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={deleteRecording}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </motion.div>
        ) : uploading ? (
          <motion.div
            key="uploading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3 bg-muted rounded-xl px-4 py-3"
          >
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
            <span className="text-sm text-muted-foreground">Uploading recording...</span>
          </motion.div>
        ) : (
          <motion.div
            key="recorder"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {isRecording ? (
              <div className="flex items-center gap-3 bg-destructive/5 rounded-xl px-4 py-3">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="w-3 h-3 bg-destructive rounded-full"
                />
                <span className="text-sm font-medium flex-1">Recording... {formatTime(duration)}</span>
                <Button size="sm" variant="destructive" className="rounded-full h-9 px-4" onClick={stopRecording}>
                  <Square className="w-3 h-3 mr-1.5" /> Stop
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full rounded-xl h-12 border-dashed gap-2"
                onClick={startRecording}
              >
                <Mic className="w-4 h-4 text-primary" />
                <span>Tap to Record Voice Complaint</span>
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}