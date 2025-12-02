'use client';

import { useState, useEffect, useCallback } from 'react';
import { useElevenLabsAgent } from '@/hooks/useElevenLabsAgent';
import { ElevenLabsAgentConfig, VoiceSession } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ConversationTranscript from './ConversationTranscript';
import AudioControls from './AudioControls';
import AgentConfigurationManager from './AgentConfigurationManager';
import { checkAudioSupport } from '@/lib/audioUtils';
import { getAgentConfig, saveAgentConfig } from '@/lib/agentConfigStorage';
import { AlertCircle, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VoicePracticeModeProps {
  onSessionEnd?: (session: VoiceSession) => void;
}

export default function VoicePracticeMode({ onSessionEnd }: VoicePracticeModeProps) {
  const [agentConfig, setAgentConfig] = useState<ElevenLabsAgentConfig>(() => {
    // Load from storage or fallback to env
    if (typeof window !== 'undefined') {
      return getAgentConfig();
    }
    return {
      agentId: process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID || '',
    };
  });
  const [showSettings, setShowSettings] = useState(false);
  const [showConfigManager, setShowConfigManager] = useState(false);
  const [audioSupport, setAudioSupport] = useState(checkAudioSupport());

  const {
    state,
    messages,
    currentSession,
    connect,
    disconnect,
    startSession,
    endSession,
    startListening,
    stopListening,
    pause,
    resume,
    sendText,
    isReady,
  } = useElevenLabsAgent({
    config: agentConfig,
    onSessionStart: (session) => {
      console.log('Session started:', session);
    },
    onSessionEnd: (session) => {
      console.log('Session ended:', session);
      onSessionEnd?.(session);
    },
    autoConnect: false,
  });

  // Check if agent ID is configured
  const isConfigured = !!agentConfig.agentId;

  // Handle config changes
  const handleConfigChange = useCallback((newConfig: ElevenLabsAgentConfig) => {
    setAgentConfig(newConfig);
    saveAgentConfig(newConfig);
  }, []);

  // Handle start session
  const handleStart = useCallback(async () => {
    if (!isConfigured) {
      alert('Please configure your ElevenLabs Agent ID in settings');
      return;
    }

    if (!state.isConnected) {
      await connect();
    }

    if (!currentSession) {
      startSession();
    }

    await startListening();
  }, [isConfigured, state.isConnected, connect, currentSession, startSession, startListening]);

  // Handle stop
  const handleStop = useCallback(() => {
    stopListening();
  }, [stopListening]);

  // Handle pause
  const handlePause = useCallback(() => {
    pause();
  }, [pause]);

  // Handle resume
  const handleResume = useCallback(() => {
    resume();
  }, [resume]);

  // Handle disconnect
  const handleDisconnect = useCallback(() => {
    if (currentSession) {
      endSession();
    }
    disconnect();
  }, [currentSession, endSession, disconnect]);

  // Check audio support on mount
  useEffect(() => {
    const support = checkAudioSupport();
    setAudioSupport(support);

    if (!support.microphone || !support.audioContext || !support.mediaRecorder) {
      console.warn('Audio features not fully supported in this browser');
    }
  }, []);

  if (!isConfigured) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Voice Practice Mode</CardTitle>
          <CardDescription>
            Practice objections with an AI voice agent
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-900 dark:text-yellow-100">
                  Configuration Required
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  To use Voice Practice Mode, you need to configure your ElevenLabs Agent ID.
                </p>
                <Button
                  onClick={() => setShowSettings(true)}
                  variant="outline"
                  size="sm"
                  className="mt-2"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Configure Settings
                </Button>
              </div>
            </div>
          </div>

          {showSettings && (
            <div className="border rounded-lg p-4 space-y-2">
              <label className="block text-sm font-medium">
                ElevenLabs Agent ID
                <input
                  type="text"
                  value={agentConfig.agentId}
                  onChange={(e) =>
                    setAgentConfig({ ...agentConfig, agentId: e.target.value })
                  }
                  placeholder="Enter your agent ID"
                  className="mt-1 w-full px-3 py-2 border rounded-lg"
                />
              </label>
              <p className="text-xs text-gray-500">
                Get your Agent ID from the ElevenLabs dashboard after creating an agent.
              </p>
              <Button
                onClick={() => {
                  if (agentConfig.agentId) {
                    setShowSettings(false);
                  }
                }}
                size="sm"
              >
                Save
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (!audioSupport.microphone || !audioSupport.audioContext) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Voice Practice Mode</CardTitle>
          <CardDescription>
            Practice objections with an AI voice agent
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
              <div>
                <p className="font-medium text-red-900 dark:text-red-100">
                  Audio Not Supported
                </p>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  Your browser doesn't support the required audio features for voice practice.
                  Please use a modern browser with microphone support (Chrome, Firefox, Safari, Edge).
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Voice Practice Mode</CardTitle>
            <CardDescription>
              Practice objections with an AI voice agent in real-time
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showSettings && (
          <div className="border rounded-lg p-4 space-y-2 bg-gray-50 dark:bg-gray-900">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Agent Configuration</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowConfigManager(!showConfigManager)}
              >
                <Settings className="w-4 h-4 mr-2" />
                {showConfigManager ? 'Hide' : 'Advanced'} Settings
              </Button>
            </div>
            
            {showConfigManager ? (
              <AgentConfigurationManager
                currentConfig={agentConfig}
                onConfigChange={handleConfigChange}
                onClose={() => setShowConfigManager(false)}
              />
            ) : (
              <>
                <label className="block text-sm font-medium">
                  ElevenLabs Agent ID
                  <input
                    type="text"
                    value={agentConfig.agentId}
                    onChange={(e) =>
                      handleConfigChange({ ...agentConfig, agentId: e.target.value })
                    }
                    placeholder="Enter your agent ID"
                    className="mt-1 w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800"
                  />
                </label>
                <p className="text-xs text-gray-500">
                  Get your Agent ID from the ElevenLabs dashboard. Click "Advanced Settings" for more options.
                </p>
              </>
            )}
          </div>
        )}

        {/* Audio Controls */}
        <AudioControls
          state={state}
          onStart={handleStart}
          onStop={handleStop}
          onPause={handlePause}
          onResume={handleResume}
          onDisconnect={handleDisconnect}
        />

        {/* Conversation Transcript */}
        <div>
          <h3 className="text-sm font-medium mb-2">Conversation</h3>
          <ConversationTranscript messages={messages} />
        </div>

        {/* Session Info */}
        {currentSession && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Session started at{' '}
            {new Date(currentSession.startTime).toLocaleTimeString()}
            {currentSession.messages.length > 0 && (
              <> • {currentSession.messages.length} messages</>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            <strong>How to use:</strong> Click "Connect & Start" to begin. The AI agent will
            present objections, and you can respond naturally. Your speech will be transcribed
            in real-time.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

