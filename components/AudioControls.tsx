'use client';

import { Button } from '@/components/ui/button';
import { Mic, MicOff, Pause, Play, Square, Volume2 } from 'lucide-react';
import { VoiceAgentState } from '@/types';

interface AudioControlsProps {
  state: VoiceAgentState;
  onStart: () => void;
  onStop: () => void;
  onPause: () => void;
  onResume: () => void;
  onDisconnect: () => void;
}

export default function AudioControls({
  state,
  onStart,
  onStop,
  onPause,
  onResume,
  onDisconnect,
}: AudioControlsProps) {
  const getConnectionStatusColor = () => {
    switch (state.connectionStatus) {
      case 'connected':
        return 'bg-green-500';
      case 'connecting':
        return 'bg-yellow-500 animate-pulse';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      <div className="flex items-center gap-2">
        <div
          className={`w-3 h-3 rounded-full ${getConnectionStatusColor()}`}
          title={state.connectionStatus}
        />
        <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
          {state.connectionStatus === 'connected'
            ? 'Connected'
            : state.connectionStatus === 'connecting'
            ? 'Connecting...'
            : state.connectionStatus === 'error'
            ? 'Connection Error'
            : 'Disconnected'}
        </span>
        {state.error && (
          <span className="text-sm text-red-600 dark:text-red-400 ml-2">
            {state.error}
          </span>
        )}
      </div>

      {/* Controls */}
      <div className="flex gap-2 flex-wrap">
        {!state.isConnected ? (
          <Button onClick={onStart} className="flex items-center gap-2">
            <Play className="w-4 h-4" />
            Connect & Start
          </Button>
        ) : (
          <>
            {state.isPaused ? (
              <Button
                onClick={onResume}
                variant="default"
                className="flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                Resume
              </Button>
            ) : (
              <>
                {state.isListening ? (
                  <Button
                    onClick={onStop}
                    variant="destructive"
                    className="flex items-center gap-2"
                  >
                    <MicOff className="w-4 h-4" />
                    Stop Listening
                  </Button>
                ) : (
                  <Button
                    onClick={onStart}
                    variant="default"
                    className="flex items-center gap-2"
                  >
                    <Mic className="w-4 h-4" />
                    Start Listening
                  </Button>
                )}
                <Button
                  onClick={onPause}
                  variant="outline"
                  className="flex items-center gap-2"
                  disabled={!state.isListening}
                >
                  <Pause className="w-4 h-4" />
                  Pause
                </Button>
              </>
            )}
            <Button
              onClick={onDisconnect}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Square className="w-4 h-4" />
              End Session
            </Button>
          </>
        )}
      </div>

      {/* Status Indicators */}
      <div className="flex gap-4 text-sm">
        {state.isListening && (
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
            Listening...
          </div>
        )}
        {state.isSpeaking && (
          <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
            <Volume2 className="w-4 h-4" />
            Agent Speaking...
          </div>
        )}
      </div>
    </div>
  );
}

