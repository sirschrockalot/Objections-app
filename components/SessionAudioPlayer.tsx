'use client';

import { useState, useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';
import { VoiceSession, ConversationMessage } from '@/types';
import { getAudioRecording } from '@/lib/audioStorage';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Download,
  Loader2,
} from 'lucide-react';

interface SessionAudioPlayerProps {
  session: VoiceSession;
  messages: ConversationMessage[];
  onTimeUpdate?: (currentTime: number) => void;
  onSeek?: (timestamp: number) => void; // Callback for seeking
}

export interface SessionAudioPlayerRef {
  seek: (timestamp: number) => void;
}

const SessionAudioPlayer = forwardRef<SessionAudioPlayerRef, SessionAudioPlayerProps>(
  function SessionAudioPlayer(
    {
      session,
      messages,
      onTimeUpdate,
      onSeek,
    },
    ref
  ) {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [hasRecording, setHasRecording] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  // Load audio recording
  useEffect(() => {
    let objectUrl: string | null = null;

    const loadAudio = async () => {
      setIsLoading(true);
      try {
        const recording = await getAudioRecording(session.id);
        if (recording && recording.audioBlob) {
          objectUrl = URL.createObjectURL(recording.audioBlob);
          setAudioUrl(objectUrl);
          setDuration(recording.duration);
          setHasRecording(true);
        } else {
          setHasRecording(false);
        }
      } catch (error) {
        console.error('Error loading audio recording:', error);
        setHasRecording(false);
      } finally {
        setIsLoading(false);
      }
    };

    loadAudio();

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [session.id]);

  // Setup audio element
  useEffect(() => {
    if (!audioUrl) return;

    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    // Also store in a ref that can be accessed via DOM query
    audioElementRef.current = audio;

    const updateTime = () => {
      setCurrentTime(audio.currentTime);
      onTimeUpdate?.(audio.currentTime);
    };

    const updateDuration = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    audio.volume = isMuted ? 0 : volume;
    audio.playbackRate = playbackRate;

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
      audio.pause();
      audio.src = '';
    };
  }, [audioUrl, volume, isMuted, playbackRate, onTimeUpdate]);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const seek = useCallback((seconds: number) => {
    if (!audioRef.current) return;
    const newTime = Math.max(0, Math.min(seconds, duration));
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
    onSeek?.(newTime);
  }, [duration, onSeek]);

  const skipBackward = () => {
    seek(currentTime - 10);
  };

  const skipForward = () => {
    seek(currentTime + 10);
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      if (audioRef.current) {
        audioRef.current.volume = volume;
      }
    } else {
      setIsMuted(true);
      if (audioRef.current) {
        audioRef.current.volume = 0;
      }
    }
  };

  const handlePlaybackRateChange = (rate: number) => {
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  };

  const downloadAudio = () => {
    if (!audioUrl) return;
    const link = document.createElement('a');
    link.href = audioUrl;
    link.download = `session-${session.id}-${new Date(session.startTime).toISOString().split('T')[0]}.webm`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
          Loading audio recording...
        </span>
      </div>
    );
  }

  if (!hasRecording) {
    return (
      <div className="p-6 text-center bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          No audio recording available for this session.
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
          Audio recording is only available for sessions recorded after this feature was enabled.
        </p>
      </div>
    );
  }

  // Expose seek method via ref
  useImperativeHandle(ref, () => ({
    seek: (timestamp: number) => {
      if (!audioRef.current) return;
      const newTime = Math.max(0, Math.min(timestamp, duration));
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      onSeek?.(newTime);
    },
  }), [duration, onSeek]);

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
        <div
          className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full cursor-pointer relative"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const percentage = clickX / rect.width;
            seek(percentage * duration);
          }}
        >
          <motion.div
            className="h-full bg-blue-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(currentTime / duration) * 100}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={skipBackward}
            disabled={!audioUrl}
          >
            <SkipBack className="w-4 h-4" />
          </Button>
          <Button
            variant="default"
            size="icon"
            onClick={togglePlay}
            disabled={!audioUrl}
            className="w-12 h-12"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={skipForward}
            disabled={!audioUrl}
          >
            <SkipForward className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {/* Volume Control */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMute}
              disabled={!audioUrl}
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </Button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={isMuted ? 0 : volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-20"
              disabled={!audioUrl}
            />
          </div>

          {/* Playback Rate */}
          <select
            value={playbackRate}
            onChange={(e) => handlePlaybackRateChange(parseFloat(e.target.value))}
            className="px-2 py-1 text-sm border rounded-lg bg-white dark:bg-gray-800"
            disabled={!audioUrl}
          >
            <option value="0.5">0.5x</option>
            <option value="0.75">0.75x</option>
            <option value="1">1x</option>
            <option value="1.25">1.25x</option>
            <option value="1.5">1.5x</option>
            <option value="2">2x</option>
          </select>

          {/* Download */}
          <Button
            variant="ghost"
            size="icon"
            onClick={downloadAudio}
            disabled={!audioUrl}
            title="Download audio"
          >
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
});

export default SessionAudioPlayer;

