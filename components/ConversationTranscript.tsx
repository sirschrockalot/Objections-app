'use client';

import { ConversationMessage, VoiceSession } from '@/types';
import { motion } from 'framer-motion';
import { User, Bot } from 'lucide-react';
import { useEffect, useRef, useMemo } from 'react';

interface ConversationTranscriptProps {
  messages: ConversationMessage[];
  highlightTime?: number; // Current playback time in seconds for syncing
  session?: VoiceSession; // Optional session for calculating timestamps
  onMessageClick?: (timestamp: number) => void; // Callback when message is clicked
}

/**
 * Calculate the timestamp (in seconds from session start) for each message
 */
function calculateMessageTimestamps(
  messages: ConversationMessage[],
  sessionStartTime?: string
): Map<string, number> {
  const timestamps = new Map<string, number>();
  
  if (!sessionStartTime || messages.length === 0) {
    return timestamps;
  }

  const startTime = new Date(sessionStartTime).getTime();
  let currentTime = 0;

  messages.forEach((message) => {
    const messageTime = new Date(message.timestamp).getTime();
    const relativeTime = (messageTime - startTime) / 1000; // Convert to seconds
    
    // Use the relative time, or increment if messages are out of order
    const timestamp = relativeTime >= 0 ? relativeTime : currentTime + 2; // Default 2 seconds between messages
    timestamps.set(message.id, timestamp);
    currentTime = timestamp;
  });

  return timestamps;
}

export default function ConversationTranscript({
  messages,
  highlightTime,
  session,
  onMessageClick,
}: ConversationTranscriptProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const highlightedMessageRef = useRef<HTMLDivElement>(null);

  // Calculate message timestamps
  const messageTimestamps = useMemo(() => {
    return calculateMessageTimestamps(messages, session?.startTime);
  }, [messages, session?.startTime]);

  // Find the currently highlighted message based on playback time
  const highlightedMessageId = useMemo(() => {
    if (highlightTime === undefined || highlightTime === null) return null;

    let lastMessageId: string | null = null;
    let lastTimestamp = -1;

    for (const [messageId, timestamp] of messageTimestamps.entries()) {
      if (timestamp <= highlightTime && timestamp > lastTimestamp) {
        lastTimestamp = timestamp;
        lastMessageId = messageId;
      }
    }

    return lastMessageId;
  }, [highlightTime, messageTimestamps]);

  // Auto-scroll to highlighted message
  useEffect(() => {
    if (highlightedMessageRef.current && containerRef.current) {
      const container = containerRef.current;
      const messageElement = highlightedMessageRef.current;

      const containerRect = container.getBoundingClientRect();
      const messageRect = messageElement.getBoundingClientRect();

      // Check if message is outside visible area
      if (
        messageRect.top < containerRect.top ||
        messageRect.bottom > containerRect.bottom
      ) {
        messageElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    }
  }, [highlightedMessageId]);

  const handleMessageClick = (messageId: string) => {
    if (!onMessageClick) return;
    const timestamp = messageTimestamps.get(messageId);
    if (timestamp !== undefined) {
      onMessageClick(timestamp);
    }
  };

  return (
    <div
      ref={containerRef}
      className="space-y-4 max-h-96 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900 rounded-lg"
    >
      {messages.length === 0 ? (
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
          <p>Conversation will appear here...</p>
          <p className="text-sm mt-2">Start speaking to begin the conversation</p>
        </div>
      ) : (
        messages.map((message, index) => {
          const isHighlighted = message.id === highlightedMessageId;
          const messageTimestamp = messageTimestamps.get(message.id);
          const isClickable = !!onMessageClick && messageTimestamp !== undefined;

          return (
            <motion.div
              key={message.id}
              ref={isHighlighted ? highlightedMessageRef : null}
              initial={{ opacity: 0, y: 10 }}
              animate={{
                opacity: 1,
                y: 0,
                scale: isHighlighted ? 1.02 : 1,
              }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className={`flex gap-3 transition-all duration-300 ${
                message.type === 'user' ? 'flex-row-reverse' : 'flex-row'
              } ${isClickable ? 'cursor-pointer' : ''}`}
              onClick={() => isClickable && handleMessageClick(message.id)}
            >
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                  message.type === 'user'
                    ? isHighlighted
                      ? 'bg-blue-600 text-white ring-2 ring-blue-400 ring-offset-2'
                      : 'bg-blue-500 text-white'
                    : isHighlighted
                    ? 'bg-purple-600 text-white ring-2 ring-purple-400 ring-offset-2'
                    : 'bg-purple-500 text-white'
                }`}
              >
                {message.type === 'user' ? (
                  <User className="w-4 h-4" />
                ) : (
                  <Bot className="w-4 h-4" />
                )}
              </div>
              <div
                className={`flex-1 rounded-lg p-3 transition-all duration-300 ${
                  message.type === 'user'
                    ? isHighlighted
                      ? 'bg-blue-200 dark:bg-blue-800/50 text-blue-900 dark:text-blue-100 ring-2 ring-blue-400 ring-offset-1 shadow-lg'
                      : 'bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100'
                    : isHighlighted
                    ? 'bg-purple-50 dark:bg-purple-900/30 text-gray-900 dark:text-gray-100 border-2 border-purple-400 shadow-lg'
                    : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700'
                } ${message.isInterim ? 'opacity-60 italic' : ''} ${
                  isClickable ? 'hover:shadow-md' : ''
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs opacity-60">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </p>
                  {messageTimestamp !== undefined && (
                    <p className="text-xs opacity-50">
                      {Math.floor(messageTimestamp / 60)}:
                      {(messageTimestamp % 60).toFixed(0).padStart(2, '0')}
                    </p>
                  )}
                </div>
                {isHighlighted && (
                  <div className="mt-2 h-1 bg-blue-400 dark:bg-blue-500 rounded-full animate-pulse" />
                )}
              </div>
            </motion.div>
          );
        })
      )}
    </div>
  );
}

