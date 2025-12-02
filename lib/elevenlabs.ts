/**
 * ElevenLabs Conversational AI Integration
 * Handles WebSocket connection and communication with ElevenLabs agents
 */

import {
  ElevenLabsAgentConfig,
  ConversationMessage,
  VoiceSession,
} from '@/types';

export interface ElevenLabsEvent {
  type: string;
  data?: any;
}

export class ElevenLabsClient {
  private ws: WebSocket | null = null;
  private agentId: string;
  private apiKey: string;
  private config: ElevenLabsAgentConfig;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isIntentionallyClosed = false;
  private scenarioContext: string | null = null;

  // Event handlers
  private onMessage?: (message: ConversationMessage) => void;
  private onAudio?: (audioBlob: Blob) => void;
  private onError?: (error: Error) => void;
  private onStatusChange?: (status: 'connecting' | 'connected' | 'disconnected' | 'error') => void;
  private onTranscript?: (text: string, isInterim: boolean) => void;

  constructor(config: ElevenLabsAgentConfig) {
    this.config = config;
    this.agentId = config.agentId;
    // Get API key from environment variable
    this.apiKey =
      process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || '';
    
    if (!this.apiKey) {
      console.warn('ElevenLabs API key not found. Voice agent will not work.');
    }

    // Store scenario context if provided
    if (config.scenarioContext) {
      this.scenarioContext = config.scenarioContext;
    }
  }

  /**
   * Connect to ElevenLabs agent via WebSocket
   */
  async connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    this.isIntentionallyClosed = false;
    this.onStatusChange?.('connecting');

    return new Promise((resolve, reject) => {
      try {
        // For public agents, use agent_id directly
        // For private agents, you'd need to generate a signed URL
        const wsUrl = `wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${this.agentId}`;

        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('ElevenLabs WebSocket connected');
          this.reconnectAttempts = 0;
          this.onStatusChange?.('connected');

          // Send conversation initialization
          const initMessage: any = {
            type: 'conversation_initiation_settings',
            conversation_config: {
              agent: {
                agent_id: this.agentId,
              },
            },
          };

          // Include scenario context if provided
          if (this.config.scenarioContext) {
            // Send scenario context as a system message or in conversation config
            // ElevenLabs may support custom instructions in the conversation config
            // For now, we'll send it as an initial message after connection
            this.scenarioContext = this.config.scenarioContext;
          }

          this.send(initMessage);

          // If we have scenario context, send it as an initial system message
          if (this.scenarioContext) {
            // Wait a moment for connection to stabilize, then send context
            setTimeout(() => {
              this.sendContextMessage(this.scenarioContext!);
            }, 500);
          }

          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event);
        };

        this.ws.onerror = (error) => {
          console.error('ElevenLabs WebSocket error:', error);
          this.onStatusChange?.('error');
          this.onError?.(new Error('WebSocket connection error'));
          reject(error);
        };

        this.ws.onclose = (event) => {
          console.log('ElevenLabs WebSocket closed', event.code, event.reason);
          this.onStatusChange?.('disconnected');

          // Attempt to reconnect if not intentionally closed
          if (!this.isIntentionallyClosed && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
            console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})...`);
            setTimeout(() => {
              this.connect().catch(console.error);
            }, delay);
          }
        };
      } catch (error) {
        this.onStatusChange?.('error');
        reject(error);
      }
    });
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(event: MessageEvent): void {
    // Check if it's binary (audio) or text (events)
    if (event.data instanceof Blob) {
      // Audio response from agent
      this.onAudio?.(event.data);
    } else if (typeof event.data === 'string') {
      try {
        const data = JSON.parse(event.data);
        this.handleEvent(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    }
  }

  /**
   * Handle different event types from ElevenLabs
   */
  private handleEvent(event: ElevenLabsEvent): void {
    switch (event.type) {
      case 'conversation_initiation_metadata':
        console.log('Conversation initialized:', event.data);
        break;

      case 'agent_response':
        // Agent text response
        if (event.data?.text) {
          const message: ConversationMessage = {
            id: `msg-${Date.now()}-${Math.random()}`,
            type: 'agent',
            text: event.data.text,
            timestamp: new Date().toISOString(),
          };
          this.onMessage?.(message);
        }
        break;

      case 'user_transcript':
        // User speech-to-text transcript
        if (event.data?.text) {
          const message: ConversationMessage = {
            id: `msg-${Date.now()}-${Math.random()}`,
            type: 'user',
            text: event.data.text,
            timestamp: new Date().toISOString(),
            isInterim: event.data.is_interim || false,
          };
          this.onMessage?.(message);
          this.onTranscript?.(event.data.text, event.data.is_interim || false);
        }
        break;

      case 'audio':
        // Audio data (should be handled as Blob in handleMessage)
        break;

      case 'error':
        console.error('ElevenLabs error:', event.data);
        this.onError?.(new Error(event.data?.message || 'Unknown error'));
        break;

      default:
        console.log('Unhandled event type:', event.type, event.data);
    }
  }

  /**
   * Send audio data to the agent
   */
  sendAudio(audioBlob: Blob): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(audioBlob);
    } else {
      console.warn('WebSocket not connected. Cannot send audio.');
    }
  }

  /**
   * Send text message to the agent (if supported)
   */
  sendText(text: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.send({
        type: 'user_message',
        text,
      });
    } else {
      console.warn('WebSocket not connected. Cannot send text.');
    }
  }

  /**
   * Send scenario context message to the agent
   */
  private sendContextMessage(context: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      // Send context as an instruction message
      // ElevenLabs Conversational AI supports sending instructions via text messages
      // We'll send it as a formatted instruction that the agent can use
      this.send({
        type: 'user_message',
        text: `[SYSTEM INSTRUCTION] ${context}`,
      });
    }
  }

  /**
   * Set scenario context for the conversation
   */
  setScenarioContext(context: string | null): void {
    this.scenarioContext = context;
    // If already connected, send the context
    if (this.ws?.readyState === WebSocket.OPEN && context) {
      this.sendContextMessage(context);
    }
  }

  /**
   * Send generic event to WebSocket
   */
  private send(data: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  /**
   * Disconnect from the agent
   */
  disconnect(): void {
    this.isIntentionallyClosed = true;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Set event handlers
   */
  setOnMessage(handler: (message: ConversationMessage) => void): void {
    this.onMessage = handler;
  }

  setOnAudio(handler: (audioBlob: Blob) => void): void {
    this.onAudio = handler;
  }

  setOnError(handler: (error: Error) => void): void {
    this.onError = handler;
  }

  setOnStatusChange(
    handler: (status: 'connecting' | 'connected' | 'disconnected' | 'error') => void
  ): void {
    this.onStatusChange = handler;
  }

  setOnTranscript(handler: (text: string, isInterim: boolean) => void): void {
    this.onTranscript = handler;
  }
}

/**
 * Create an ElevenLabs client instance
 */
export function createElevenLabsClient(
  config: ElevenLabsAgentConfig
): ElevenLabsClient {
  return new ElevenLabsClient(config);
}

