/**
 * Storage utilities for agent configuration
 */

import { ElevenLabsAgentConfig } from '@/types';

const AGENT_CONFIG_KEY = 'response-ready-agent-config';
const AGENT_CONFIGS_KEY = 'response-ready-agent-configs'; // Multiple profiles

export interface AgentConfigProfile {
  id: string;
  name: string;
  config: ElevenLabsAgentConfig;
  isDefault?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AgentConfigPreset {
  id: string;
  name: string;
  description: string;
  config: ElevenLabsAgentConfig;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

/**
 * Default presets for agent configuration
 */
export const DEFAULT_PRESETS: AgentConfigPreset[] = [
  {
    id: 'beginner',
    name: 'Beginner Friendly',
    description: 'Supportive and encouraging. Great for learning the basics.',
    difficulty: 'beginner',
    config: {
      agentId: '',
      voiceId: undefined,
      language: 'en',
      conversationConfig: {
        temperature: 0.7, // More predictable, friendly
        maxResponseLength: 150,
      },
    },
  },
  {
    id: 'intermediate',
    name: 'Realistic Buyer',
    description: 'Natural objections with moderate pushback. Real-world practice.',
    difficulty: 'intermediate',
    config: {
      agentId: '',
      voiceId: undefined,
      language: 'en',
      conversationConfig: {
        temperature: 0.8, // More varied responses
        maxResponseLength: 200,
      },
    },
  },
  {
    id: 'advanced',
    name: 'Tough Negotiator',
    description: 'Challenging objections and persistent pushback. For experienced agents.',
    difficulty: 'advanced',
    config: {
      agentId: '',
      voiceId: undefined,
      language: 'en',
      conversationConfig: {
        temperature: 0.9, // More creative, challenging
        maxResponseLength: 250,
      },
    },
  },
];

/**
 * Get the current/default agent configuration
 */
export function getAgentConfig(): ElevenLabsAgentConfig {
  if (typeof window === 'undefined') {
    return { agentId: '' };
  }

  try {
    const stored = localStorage.getItem(AGENT_CONFIG_KEY);
    if (stored) {
      return JSON.parse(stored) as ElevenLabsAgentConfig;
    }
  } catch (error) {
    console.error('Error loading agent config:', error);
  }

  // Fallback to environment variable
  return {
    agentId: process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID || '',
  };
}

/**
 * Save agent configuration
 */
export function saveAgentConfig(config: ElevenLabsAgentConfig): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(AGENT_CONFIG_KEY, JSON.stringify(config));
  } catch (error) {
    console.error('Error saving agent config:', error);
  }
}

/**
 * Get all saved agent configuration profiles
 */
export function getAgentConfigProfiles(): AgentConfigProfile[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(AGENT_CONFIGS_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as AgentConfigProfile[];
  } catch (error) {
    console.error('Error loading agent config profiles:', error);
    return [];
  }
}

/**
 * Save an agent configuration profile
 */
export function saveAgentConfigProfile(profile: Omit<AgentConfigProfile, 'createdAt' | 'updatedAt'>): void {
  if (typeof window === 'undefined') return;

  try {
    const profiles = getAgentConfigProfiles();
    const now = new Date().toISOString();
    
    const existingIndex = profiles.findIndex(p => p.id === profile.id);
    
    if (existingIndex >= 0) {
      profiles[existingIndex] = {
        ...profiles[existingIndex],
        ...profile,
        updatedAt: now,
      };
    } else {
      profiles.push({
        ...profile,
        createdAt: now,
        updatedAt: now,
      });
    }

    // If this is set as default, unset others
    if (profile.isDefault) {
      profiles.forEach(p => {
        if (p.id !== profile.id) {
          p.isDefault = false;
        }
      });
    }

    localStorage.setItem(AGENT_CONFIGS_KEY, JSON.stringify(profiles));
  } catch (error) {
    console.error('Error saving agent config profile:', error);
  }
}

/**
 * Delete an agent configuration profile
 */
export function deleteAgentConfigProfile(profileId: string): void {
  if (typeof window === 'undefined') return;

  try {
    const profiles = getAgentConfigProfiles();
    const filtered = profiles.filter(p => p.id !== profileId);
    localStorage.setItem(AGENT_CONFIGS_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting agent config profile:', error);
  }
}

/**
 * Get default agent configuration profile
 */
export function getDefaultAgentConfigProfile(): AgentConfigProfile | null {
  const profiles = getAgentConfigProfiles();
  return profiles.find(p => p.isDefault) || profiles[0] || null;
}

