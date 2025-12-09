/**
 * React hook for managing ElevenLabs voice agent
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { error as logError } from '@/lib/logger';
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
  scenarioContext?: string; // Optional scenario context to inject
  onSessionStart?: (session: VoiceSession) => void;
  onSessionEnd?: (session: VoiceSession) => void;
  autoConnect?: boolean;
  recoverSession?: VoiceSession; // Optional session to recover
}

export function useElevenLabsAgent(options: UseElevenLabsAgentOptions) {
  const { config, scenarioContext, onSessionStart, onSessionEnd, autoConnect = false, recoverSession } = options;

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
  const autoSaveIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Refs
  const clientRef = useRef<ElevenLabsClient | null>(null);
  const audioCaptureRef = useRef<AudioCapture | null>(null);
  const audioPlaybackRef = useRef<AudioPlayback | null>(null);
  const sessionStartTimeRef = useRef<number | null>(null);

  // Initialize client
  useEffect(() => {
    if (!clientRef.current) {
      // Include scenario context in config if provided
      const configWithContext = scenarioContext
        ? { ...config, scenarioContext }
        : config;
      clientRef.current = createElevenLabsClient(configWithContext);

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
          logError('Failed to play audio', error);
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

    // Update scenario context if client exists and context changed
    if (clientRef.current) {
      if (scenarioContext) {
        clientRef.current.setScenarioContext(scenarioContext);
      } else {
        // Clear context if scenario is removed
        clientRef.current.setScenarioContext(null);
      }
    }

    // Auto-connect if enabled or recovering session
    if ((autoConnect || recoverSession) && !state.isConnected) {
      connect();
    }

    // Recover session if provided
    if (recoverSession && !currentSession) {
      startSession(recoverSession);
    }

    return () => {
      disconnect();
      audioCaptureRef.current?.cleanup();
      audioPlaybackRef.current?.cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.agentId, scenarioContext, autoConnect]);

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
  const startSession = useCallback((recoveredSession?: VoiceSession) => {
    const session: VoiceSession = recoveredSession || {
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

    // If recovering, restore messages and adjust start time
    if (recoveredSession) {
      setMessages(recoveredSession.messages);
      sessionStartTimeRef.current = new Date(recoveredSession.startTime).getTime();
      session.status = 'active';
      session.recoveryData = {
        disconnectedAt: recoveredSession.recoveryData?.disconnectedAt || new Date().toISOString(),
        reconnectedAt: new Date().toISOString(),
        messagesBeforeDisconnect: recoveredSession.messages.length,
      };
    } else {
      setMessages([]);
      sessionStartTimeRef.current = Date.now();
    }

    setCurrentSession(session);
    onSessionStart?.(session);
  }, [onSessionStart]);

  // Auto-save session state periodically
  useEffect(() => {
    if (!currentSession || currentSession.status !== 'active') {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
        autoSaveIntervalRef.current = null;
      }
      return;
    }

    // Auto-save every 10 seconds
    autoSaveIntervalRef.current = setInterval(() => {
      if (currentSession) {
        const duration = sessionStartTimeRef.current
          ? Math.floor((Date.now() - sessionStartTimeRef.current) / 1000)
          : 0;

        const sessionToSave: VoiceSession = {
          ...currentSession,
          messages,
          metrics: {
            ...currentSession.metrics,
            totalDuration: duration,
            messagesExchanged: messages.length,
          },
          lastSavedAt: new Date().toISOString(),
        };

        // Save to active session storage for recovery
        import('@/lib/voiceSessionStorage').then(({ saveActiveSession }) => {
          saveActiveSession(sessionToSave);
        });
      }
    }, 10000); // Every 10 seconds

    return () => {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
        autoSaveIntervalRef.current = null;
      }
    };
  }, [currentSession, messages]);

  // End current session
  const endSession = useCallback(() => {
    if (!currentSession || !sessionStartTimeRef.current) return;

    const duration = Math.floor(
      (Date.now() - sessionStartTimeRef.current) / 1000
    );

    // Get full audio recording if available
    const audioRecording = audioCaptureRef.current?.getFullRecording() || null;

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
    
    // Clear active session from recovery storage
    import('@/lib/voiceSessionStorage').then(({ clearActiveSession }) => {
      clearActiveSession();
    });
    
    // Store audio recording if available
    if (audioRecording) {
      import('@/lib/audioStorage').then(({ saveAudioRecording }) => {
        const recording = {
          sessionId: finalSession.id,
          audioBlob: audioRecording,
          duration: duration,
          recordedAt: new Date().toISOString(),
          format: audioRecording.type,
        };
        saveAudioRecording(recording).catch((error) => {
          logError('Failed to save audio recording', error);
        });
      });
    }
    
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

  // Expose WebSocket for quality monitoring
  const getWebSocket = useCallback(() => {
    return clientRef.current?.getWebSocket() || null;
  }, []);

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
    getWebSocket,
  };
}

