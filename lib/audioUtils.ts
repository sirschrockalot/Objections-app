/**
 * Audio utilities for microphone capture and audio playback
 */

import { error as logError } from './logger';

export interface AudioCaptureOptions {
  sampleRate?: number;
  channelCount?: number;
  echoCancellation?: boolean;
  noiseSuppression?: boolean;
  autoGainControl?: boolean;
}

export class AudioCapture {
  private mediaStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private fullRecordingChunks: Blob[] = []; // For full session recording
  private recordingStartTime: number | null = null;

  async startCapture(
    onAudioData: (audioBlob: Blob) => void,
    options: AudioCaptureOptions = {}
  ): Promise<void> {
    try {
      // Request microphone access
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: options.sampleRate || 16000,
          channelCount: options.channelCount || 1,
          echoCancellation: options.echoCancellation ?? true,
          noiseSuppression: options.noiseSuppression ?? true,
          autoGainControl: options.autoGainControl ?? true,
        },
      });

      // Create MediaRecorder for capturing audio
      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : 'audio/ogg';

      this.mediaRecorder = new MediaRecorder(this.mediaStream, {
        mimeType,
      });

      this.chunks = [];
      this.fullRecordingChunks = [];
      this.recordingStartTime = Date.now();

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.chunks.push(event.data);
          this.fullRecordingChunks.push(event.data); // Also save for full recording
          const blob = new Blob(this.chunks, { type: mimeType });
          onAudioData(blob);
        }
      };

      // Start recording in chunks (every 100ms for real-time streaming)
      this.mediaRecorder.start(100);
    } catch (error) {
      logError('Failed to start audio capture', error);
      throw new Error(
        error instanceof Error
          ? error.message
          : 'Failed to access microphone. Please check permissions.'
      );
    }
  }

  /**
   * Get the full recording as a Blob
   */
  getFullRecording(): Blob | null {
    if (this.fullRecordingChunks.length === 0) return null;
    
    const mimeType = MediaRecorder.isTypeSupported('audio/webm')
      ? 'audio/webm'
      : MediaRecorder.isTypeSupported('audio/mp4')
      ? 'audio/mp4'
      : 'audio/ogg';
    
    return new Blob(this.fullRecordingChunks, { type: mimeType });
  }

  /**
   * Get recording duration in seconds
   */
  getRecordingDuration(): number {
    if (!this.recordingStartTime) return 0;
    return (Date.now() - this.recordingStartTime) / 1000;
  }

  stopCapture(): Blob | null {
    const fullRecording = this.getFullRecording();
    
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    this.mediaRecorder = null;
    this.chunks = [];
    this.fullRecordingChunks = [];
    this.recordingStartTime = null;

    return fullRecording;
  }

  isCapturing(): boolean {
    return (
      this.mediaRecorder !== null &&
      this.mediaRecorder.state === 'recording'
    );
  }

  cleanup(): void {
    this.stopCapture();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

export class AudioPlayback {
  private audioContext: AudioContext | null = null;
  private audioQueue: ArrayBuffer[] = [];
  private isPlaying = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
    }
  }

  async playAudio(audioData: Blob | ArrayBuffer): Promise<void> {
    if (!this.audioContext) {
      throw new Error('Audio context not initialized');
    }

    try {
      const arrayBuffer =
        audioData instanceof Blob
          ? await audioData.arrayBuffer()
          : audioData;

      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);

      return new Promise((resolve, reject) => {
        try {
          source.onended = () => {
            resolve();
          };
          source.start(0);
        } catch (error) {
          reject(error);
        }
      });
    } catch (error) {
      logError('Failed to play audio', error);
      throw error;
    }
  }

  async playAudioFromUrl(url: string): Promise<void> {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return this.playAudio(blob);
    } catch (error) {
      logError('Failed to play audio from URL', error);
      throw error;
    }
  }

  stop(): void {
    // Note: Individual audio sources can't be stopped easily
    // This would require tracking all active sources
    // For now, we'll let audio finish naturally
    this.isPlaying = false;
  }

  cleanup(): void {
    this.stop();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

/**
 * Check if browser supports required audio features
 */
export function checkAudioSupport(): {
  microphone: boolean;
  audioContext: boolean;
  mediaRecorder: boolean;
} {
  return {
    microphone: !!(
      navigator.mediaDevices && navigator.mediaDevices.getUserMedia
    ),
    audioContext: !!(window.AudioContext || (window as any).webkitAudioContext),
    mediaRecorder: !!window.MediaRecorder,
  };
}

