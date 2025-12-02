/**
 * React hook for managing ElevenLabs voice agent
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { ElevenLabsClient, createElevenLabsClient } from '@/lib/elevenlabs';
import { AudioCapture, AudioPlayback } from '@/lib/audioUtils';
import {
  ElevenLabsAgentConfig,
  ConversationMessage,
  VoiceAgentState,
  VoiceSession,
} from '@/types';

interface UseElevenLabsAgentOptions {
  config: ElevenLabsAgentConfig;
  onSessionStart?: (session: VoiceSession) => void;
  onSessionEnd?: (session: VoiceSession) => void;
  autoConnect?: boolean;
}

export function useElevenLabsAgent(options: UseElevenLabsAgentOptions) {
  const { config, onSessionStart, onSessionEnd, autoConnect = false } = options;

  // State
  const [state, setState] = useState<VoiceAgentState>({
    isConnected: false,
    isListening: false,
    isSpeaking: false,
    isPaused: false,
    error: null,
    connectionStatus: 'disconnected',
  });

  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [currentSession, setCurrentSession] = useState<VoiceSession | null>(null);

  // Refs
  const clientRef = useRef<ElevenLabsClient | null>(null);
  const audioCaptureRef = useRef<AudioCapture | null>(null);
  const audioPlaybackRef = useRef<AudioPlayback | null>(null);
  const sessionStartTimeRef = useRef<number | null>(null);

  // Initialize client
  useEffect(() => {
    if (!clientRef.current) {
      clientRef.current = createElevenLabsClient(config);

      // Set up event handlers
      clientRef.current.setOnMessage((message) => {
        setMessages((prev) => {
          // Replace interim messages with final ones
          if (message.isInterim) {
            return prev.map((msg) =>
              msg.id === message.id ? message : msg
            );
          }
          // Add new message if not already present
          const exists = prev.some((msg) => msg.id === message.id);
          return exists ? prev : [...prev, message];
        });
      });

      clientRef.current.setOnAudio(async (audioBlob) => {
        setState((prev) => ({ ...prev, isSpeaking: true }));
        try {
          if (audioPlaybackRef.current) {
            await audioPlaybackRef.current.playAudio(audioBlob);
          }
        } catch (error) {
          console.error('Error playing audio:', error);
        } finally {
          setState((prev) => ({ ...prev, isSpeaking: false }));
        }
      });

      clientRef.current.setOnError((error) => {
        setState((prev) => ({
          ...prev,
          error: error.message,
          connectionStatus: 'error',
        }));
      });

      clientRef.current.setOnStatusChange((status) => {
        setState((prev) => ({
          ...prev,
          isConnected: status === 'connected',
          connectionStatus: status,
        }));
      });
    }

    // Initialize audio utilities
    if (!audioCaptureRef.current) {
      audioCaptureRef.current = new AudioCapture();
    }
    if (!audioPlaybackRef.current) {
      audioPlaybackRef.current = new AudioPlayback();
    }

    // Auto-connect if enabled
    if (autoConnect && !state.isConnected) {
      connect();
    }

    return () => {
      disconnect();
      audioCaptureRef.current?.cleanup();
      audioPlaybackRef.current?.cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.agentId, autoConnect]);

  // Connect to agent
  const connect = useCallback(async () => {
    if (!clientRef.current) return;

    try {
      setState((prev) => ({ ...prev, error: null }));
      await clientRef.current.connect();
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to connect',
        connectionStatus: 'error',
      }));
    }
  }, []);

  // Disconnect from agent
  const disconnect = useCallback(() => {
    stopListening();
    if (clientRef.current) {
      clientRef.current.disconnect();
    }
    if (currentSession) {
      endSession();
    }
  }, [currentSession]);

  // Start a new voice session
  const startSession = useCallback(() => {
    const session: VoiceSession = {
      id: `session-${Date.now()}`,
      startTime: new Date().toISOString(),
      messages: [],
      objectionsPresented: [],
      userResponses: [],
      metrics: {
        totalDuration: 0,
        objectionsHandled: 0,
        averageResponseTime: 0,
        messagesExchanged: 0,
      },
      status: 'active',
    };

    setCurrentSession(session);
    sessionStartTimeRef.current = Date.now();
    setMessages([]);
    onSessionStart?.(session);
  }, [onSessionStart]);

  // End current session
  const endSession = useCallback(() => {
    if (!currentSession || !sessionStartTimeRef.current) return;

    const duration = Math.floor(
      (Date.now() - sessionStartTimeRef.current) / 1000
    );

    const finalSession: VoiceSession = {
      ...currentSession,
      endTime: new Date().toISOString(),
      messages,
      metrics: {
        ...currentSession.metrics,
        totalDuration: duration,
        messagesExchanged: messages.length,
      },
      status: 'completed',
    };

    setCurrentSession(null);
    sessionStartTimeRef.current = null;
    onSessionEnd?.(finalSession);
  }, [currentSession, messages, onSessionEnd]);

  // Start listening (capture audio and send to agent)
  const startListening = useCallback(async () => {
    if (!clientRef.current?.isConnected()) {
      await connect();
    }

    if (!audioCaptureRef.current) {
      setState((prev) => ({
        ...prev,
        error: 'Audio capture not initialized',
      }));
      return;
    }

    try {
      await audioCaptureRef.current.startCapture((audioBlob) => {
        // Send audio chunks to ElevenLabs
        if (clientRef.current?.isConnected()) {
          clientRef.current.sendAudio(audioBlob);
        }
      });

      setState((prev) => ({ ...prev, isListening: true }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to start audio capture',
      }));
    }
  }, [connect]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (audioCaptureRef.current) {
      audioCaptureRef.current.stopCapture();
    }
    setState((prev) => ({ ...prev, isListening: false }));
  }, []);

  // Pause session
  const pause = useCallback(() => {
    stopListening();
    setState((prev) => ({ ...prev, isPaused: true }));
    if (currentSession) {
      setCurrentSession((prev) =>
        prev ? { ...prev, status: 'paused' } : null
      );
    }
  }, [stopListening, currentSession]);

  // Resume session
  const resume = useCallback(() => {
    setState((prev) => ({ ...prev, isPaused: false }));
    if (currentSession) {
      setCurrentSession((prev) =>
        prev ? { ...prev, status: 'active' } : null
      );
    }
    startListening();
  }, [startListening, currentSession]);

  // Send text message (alternative to voice)
  const sendText = useCallback(
    (text: string) => {
      if (clientRef.current?.isConnected()) {
        clientRef.current.sendText(text);
        // Add user message to local state
        const message: ConversationMessage = {
          id: `msg-${Date.now()}-${Math.random()}`,
          type: 'user',
          text,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, message]);
      }
    },
    []
  );

  return {
    // State
    state,
    messages,
    currentSession,

    // Actions
    connect,
    disconnect,
    startSession,
    endSession,
    startListening,
    stopListening,
    pause,
    resume,
    sendText,

    // Utilities
    isReady: state.isConnected && !state.error,
  };
}

