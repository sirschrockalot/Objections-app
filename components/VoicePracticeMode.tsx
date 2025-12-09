'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useElevenLabsAgent } from '@/hooks/useElevenLabsAgent';
import { ElevenLabsAgentConfig, VoiceSession } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ConversationTranscript from './ConversationTranscript';
import AudioControls from './AudioControls';
import AgentConfigurationManager from './AgentConfigurationManager';
import VoiceScenarioSelector from './VoiceScenarioSelector';
import { VoiceScenario } from '@/data/voiceScenarios';
import { checkAudioSupport } from '@/lib/audioUtils';
import { getAgentConfig, saveAgentConfig } from '@/lib/agentConfigStorage';
import { saveVoiceScenarioSession, VoiceScenarioSession } from '@/lib/voiceScenarioStorage';
import { formatScenarioContext } from '@/lib/scenarioContextFormatter';
import { calculateAllGoalProgress, getActiveGoals } from '@/lib/voiceGoals';
import { getActiveSession, hasRecoverableSession, clearActiveSession } from '@/lib/voiceSessionStorage';
import { ConnectionQuality, createConnectionQualityMonitor } from '@/lib/connectionQuality';
import { recordUsage, checkRateLimits, getDefaultRateLimitConfig, RateLimitConfig } from '@/lib/rateLimiting';
import { debug, warn, error as logError } from '@/lib/logger';
import Celebration from './Celebration';
import SessionRecovery from './SessionRecovery';
import MicrophonePermissionPrompt from './MicrophonePermissionPrompt';
import RateLimitWarning from './RateLimitWarning';
import { AlertCircle, Settings, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VoicePracticeModeProps {
  onSessionEnd?: (session: VoiceSession) => void;
}

export default function VoicePracticeMode({ onSessionEnd }: VoicePracticeModeProps) {
  const [achievedGoal, setAchievedGoal] = useState<{ message: string; icon?: string } | null>(null);
  const goalsRef = useRef(getActiveGoals());
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
  const [selectedScenario, setSelectedScenario] = useState<VoiceScenario | null>(null);
  const [showScenarioSelector, setShowScenarioSelector] = useState(false);
  const [audioSupport, setAudioSupport] = useState(checkAudioSupport());
  const [recoverableSession, setRecoverableSession] = useState<VoiceSession | null>(null);
  const [showRecovery, setShowRecovery] = useState(false);
  const [microphoneError, setMicrophoneError] = useState<string | null>(null);
  const [showMicPrompt, setShowMicPrompt] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState<ConnectionQuality | null>(null);
  const [rateLimitConfig, setRateLimitConfig] = useState<RateLimitConfig>(getDefaultRateLimitConfig());

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
    getWebSocket,
  } = useElevenLabsAgent({
    config: agentConfig,
    scenarioContext: selectedScenario ? formatScenarioContext(selectedScenario) : undefined,
    onSessionStart: (session) => {
      debug('Session started', session);
      if (selectedScenario) {
        debug('Scenario context injected', { name: selectedScenario.name });
      }
    },
    onSessionEnd: (session) => {
      debug('Session ended', session);
      // Save scenario session if scenario is selected
      if (selectedScenario) {
        const scenarioSession: VoiceScenarioSession = {
          ...session,
          scenarioId: selectedScenario.id,
          scenarioName: selectedScenario.name,
          scenarioContext: selectedScenario.context,
        };
        saveVoiceScenarioSession(scenarioSession);
        onSessionEnd?.(scenarioSession);
      } else {
        onSessionEnd?.(session);
      }
    },
    autoConnect: false,
    // eslint-disable-next-line react-hooks/exhaustive-deps
  });

  // Check if agent ID is configured
  const isConfigured = !!agentConfig.agentId;

  // Handle config changes
  const handleConfigChange = useCallback((newConfig: ElevenLabsAgentConfig) => {
    setAgentConfig(newConfig);
    saveAgentConfig(newConfig);
  }, []);

  // Handle scenario selection
  const handleScenarioSelect = useCallback((scenario: VoiceScenario) => {
    setSelectedScenario(scenario);
    setShowScenarioSelector(false);
  }, []);

  // Enhanced session end handler for scenarios
  const handleSessionEnd = useCallback(async (session: VoiceSession) => {
    if (selectedScenario) {
      const scenarioSession: VoiceScenarioSession = {
        ...session,
        scenarioId: selectedScenario.id,
        scenarioName: selectedScenario.name,
        scenarioContext: selectedScenario.context,
      };
      saveVoiceScenarioSession(scenarioSession);
      onSessionEnd?.(scenarioSession);
    } else {
      onSessionEnd?.(session);
    }

    // Record usage for rate limiting
    const minutesUsed = session.metrics.totalDuration / 60; // Convert seconds to minutes
    const messagesExchanged = session.metrics.messagesExchanged;
    recordUsage(minutesUsed, messagesExchanged, 1);

    // Check for goal achievements
    try {
      const progressData = await calculateAllGoalProgress();
      const newlyCompleted = progressData.filter(
        (p) => p.isCompleted && p.completedAt
      );
      if (newlyCompleted.length > 0) {
        goalsRef.current = getActiveGoals();
      const goal = goalsRef.current.find((g) => g.id === newlyCompleted[0].goalId);
        if (goal) {
          setAchievedGoal({
            message: `Goal Achieved: ${goal.description || 'Practice Goal'}`,
            icon: '🎯',
          });
        }
      }
    } catch (error) {
      logError('Failed to check goals', error);
    }
  }, [selectedScenario, onSessionEnd]);

  // Handle recover session
  const handleRecoverSession = useCallback((session: VoiceSession) => {
    setShowRecovery(false);
    setRecoverableSession(null);
    
    // Start session with recovered data
    if (!state.isConnected) {
      connect().then(() => {
        startSession(session);
        startListening();
      });
    } else {
      startSession(session);
      startListening();
    }
  }, [state.isConnected, connect, startSession, startListening]);

  // Handle dismiss recovery
  const handleDismissRecovery = useCallback(() => {
    setShowRecovery(false);
    clearActiveSession();
    setRecoverableSession(null);
  }, []);

  // Handle microphone permission request
  const handleRequestMicrophonePermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop the stream immediately - we just needed permission
      stream.getTracks().forEach(track => track.stop());
      setMicrophoneError(null);
      setShowMicPrompt(false);
      setAudioSupport(checkAudioSupport());
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to access microphone';
      setMicrophoneError(errorMessage);
      
      if (error instanceof Error && error.name === 'NotAllowedError') {
        setMicrophoneError('Microphone permission was denied. Please enable it in your browser settings.');
      } else if (error instanceof Error && error.name === 'NotFoundError') {
        setMicrophoneError('No microphone found. Please connect a microphone and try again.');
      } else {
        setMicrophoneError(`Unable to access microphone: ${errorMessage}`);
      }
    }
  }, []);

  // Handle start session
  const handleStart = useCallback(async () => {
    if (!isConfigured) {
      alert('Please configure your ElevenLabs Agent ID in settings');
      return;
    }

    // Check rate limits before starting
    const rateLimitStatus = checkRateLimits(rateLimitConfig);
    if (rateLimitStatus.isLimitReached) {
      alert(
        `API limit reached. ${rateLimitStatus.warnings.join(' ')} Please wait or upgrade your plan.`
      );
      return;
    }

    // Check microphone permission first
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setMicrophoneError(null);
    } catch (error) {
      setMicrophoneError('Microphone access is required. Please enable it in your browser settings.');
      setShowMicPrompt(true);
      return;
    }

    if (!state.isConnected) {
      await connect();
    }

    if (!currentSession) {
      startSession();
    }

    await startListening();
  }, [isConfigured, state.isConnected, connect, currentSession, startSession, startListening, rateLimitConfig]);

  // Monitor connection quality when connected
  useEffect(() => {
    if (!state.isConnected) {
      setConnectionQuality(null);
      return;
    }

    const ws = getWebSocket();
    if (!ws) return;

    const stopMonitoring = createConnectionQualityMonitor(
      ws,
      (quality) => setConnectionQuality(quality),
      15000 // Every 15 seconds
    );

    return () => stopMonitoring();
  }, [state.isConnected, getWebSocket]);

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
      warn('Audio features not fully supported in this browser');
    }

    // Check for recoverable session
    if (hasRecoverableSession()) {
      const session = getActiveSession();
      if (session) {
        setRecoverableSession(session);
        setShowRecovery(true);
      }
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
    <>
      {achievedGoal && (
        <Celebration
          type="achievement"
          message={achievedGoal.message}
          icon={achievedGoal.icon}
          onComplete={() => setAchievedGoal(null)}
        />
      )}
      
      {/* Session Recovery Prompt */}
      {showRecovery && recoverableSession && (
        <SessionRecovery
          session={recoverableSession}
          onRecover={handleRecoverSession}
          onDismiss={handleDismissRecovery}
        />
      )}

      {/* Microphone Permission Prompt */}
      {showMicPrompt && (
        <MicrophonePermissionPrompt
          onRequestPermission={handleRequestMicrophonePermission}
          onDismiss={() => setShowMicPrompt(false)}
          error={microphoneError || undefined}
        />
      )}

      {/* Rate Limit Warning */}
      <RateLimitWarning
        config={rateLimitConfig}
        showDetails={true}
      />

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
        {/* Scenario Selector */}
        {showScenarioSelector ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Select Practice Scenario</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowScenarioSelector(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <VoiceScenarioSelector
              onSelectScenario={handleScenarioSelect}
              selectedScenarioId={selectedScenario?.id}
            />
          </div>
        ) : selectedScenario ? (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                    Active Scenario: {selectedScenario.name}
                  </h4>
                  <span className="px-2 py-0.5 bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                    Context Active
                  </span>
                </div>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  {selectedScenario.description}
                </p>
                <div className="mt-2 text-xs text-blue-600 dark:text-blue-400 space-y-1">
                  <div><strong>Property:</strong> {selectedScenario.context.property.address}</div>
                  <div><strong>Buyer:</strong> {selectedScenario.context.buyer.type.replace(/-/g, ' ')} ({selectedScenario.context.buyer.experience})</div>
                  <div><strong>Budget:</strong> ${selectedScenario.context.buyer.budget.toLocaleString()}</div>
                  <div className="mt-2 text-blue-500 dark:text-blue-400 italic">
                    ✓ Agent will receive scenario context and instructions
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedScenario(null);
                  setShowScenarioSelector(true);
                }}
              >
                Change
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            onClick={() => setShowScenarioSelector(true)}
            className="w-full"
          >
            Select Practice Scenario (Optional)
          </Button>
        )}

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
          connectionQuality={connectionQuality || undefined}
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
    </>
  );
}

