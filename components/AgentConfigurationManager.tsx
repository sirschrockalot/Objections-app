'use client';

import { useState, useEffect } from 'react';
import { ElevenLabsAgentConfig } from '@/types';
import {
  getAgentConfig,
  saveAgentConfig,
  getAgentConfigProfiles,
  saveAgentConfigProfile,
  deleteAgentConfigProfile,
  DEFAULT_PRESETS,
  AgentConfigProfile,
} from '@/lib/agentConfigStorage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, Save, Trash2, Star, StarOff, Plus } from 'lucide-react';

interface AgentConfigurationManagerProps {
  currentConfig: ElevenLabsAgentConfig;
  onConfigChange: (config: ElevenLabsAgentConfig) => void;
  onClose?: () => void;
}

export default function AgentConfigurationManager({
  currentConfig,
  onConfigChange,
  onClose,
}: AgentConfigurationManagerProps) {
  const [config, setConfig] = useState<ElevenLabsAgentConfig>(currentConfig);
  const [profiles, setProfiles] = useState<AgentConfigProfile[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [showSaveProfile, setShowSaveProfile] = useState(false);
  const [profileName, setProfileName] = useState('');

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = () => {
    setProfiles(getAgentConfigProfiles());
  };

  const handleConfigChange = (updates: Partial<ElevenLabsAgentConfig>) => {
    const newConfig = {
      ...config,
      ...updates,
      conversationConfig: {
        ...config.conversationConfig,
        ...updates.conversationConfig,
      },
    };
    setConfig(newConfig);
    onConfigChange(newConfig);
  };

  const handleApplyPreset = (presetId: string) => {
    const preset = DEFAULT_PRESETS.find(p => p.id === presetId);
    if (preset) {
      const newConfig = {
        ...preset.config,
        agentId: config.agentId || '', // Preserve agent ID
      };
      setConfig(newConfig);
      setSelectedPreset(presetId);
      onConfigChange(newConfig);
    }
  };

  const handleSave = () => {
    saveAgentConfig(config);
    if (onClose) {
      onClose();
    }
  };

  const handleSaveAsProfile = () => {
    if (!profileName.trim()) return;

    const profile: Omit<AgentConfigProfile, 'createdAt' | 'updatedAt'> = {
      id: `profile-${Date.now()}`,
      name: profileName,
      config,
      isDefault: false,
    };

    saveAgentConfigProfile(profile);
    loadProfiles();
    setProfileName('');
    setShowSaveProfile(false);
  };

  const handleLoadProfile = (profile: AgentConfigProfile) => {
    setConfig(profile.config);
    onConfigChange(profile.config);
  };

  const handleDeleteProfile = (profileId: string) => {
    if (confirm('Are you sure you want to delete this profile?')) {
      deleteAgentConfigProfile(profileId);
      loadProfiles();
    }
  };

  const handleSetDefault = (profileId: string) => {
    const profile = profiles.find(p => p.id === profileId);
    if (profile) {
      saveAgentConfigProfile({
        ...profile,
        isDefault: true,
      });
      loadProfiles();
    }
  };

  return (
    <div className="space-y-6">
      {/* Presets */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Quick Presets</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {DEFAULT_PRESETS.map((preset) => (
            <Card
              key={preset.id}
              className={`cursor-pointer transition-all ${
                selectedPreset === preset.id
                  ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'hover:shadow-md'
              }`}
              onClick={() => handleApplyPreset(preset.id)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{preset.name}</CardTitle>
                <CardDescription className="text-xs">
                  {preset.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  <div>Difficulty: {preset.difficulty}</div>
                  <div>Temperature: {preset.config.conversationConfig?.temperature || 0.8}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Agent ID */}
      <div>
        <label className="block text-sm font-medium mb-2">
          ElevenLabs Agent ID <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={config.agentId}
          onChange={(e) => handleConfigChange({ agentId: e.target.value })}
          placeholder="Enter your agent ID"
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
        />
        <p className="text-xs text-gray-500 mt-1">
          Get your Agent ID from the ElevenLabs dashboard
        </p>
      </div>

      {/* Voice Selection */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Voice ID (Optional)
        </label>
        <input
          type="text"
          value={config.voiceId || ''}
          onChange={(e) => handleConfigChange({ voiceId: e.target.value || undefined })}
          placeholder="Leave empty to use agent default"
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
        />
        <p className="text-xs text-gray-500 mt-1">
          Optional: Override the agent's default voice
        </p>
      </div>

      {/* Language */}
      <div>
        <label className="block text-sm font-medium mb-2">Language</label>
        <select
          value={config.language || 'en'}
          onChange={(e) => handleConfigChange({ language: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
        >
          <option value="en">English</option>
          <option value="es">Spanish</option>
          <option value="fr">French</option>
          <option value="de">German</option>
          <option value="it">Italian</option>
          <option value="pt">Portuguese</option>
        </select>
      </div>

      {/* Conversation Settings */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Conversation Settings</h3>

        {/* Temperature */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Temperature: {config.conversationConfig?.temperature || 0.8}
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={config.conversationConfig?.temperature || 0.8}
            onChange={(e) =>
              handleConfigChange({
                conversationConfig: {
                  ...config.conversationConfig,
                  temperature: parseFloat(e.target.value),
                },
              })
            }
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Predictable</span>
            <span>Creative</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Lower = more consistent, Higher = more varied responses
          </p>
        </div>

        {/* Max Response Length */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Max Response Length: {config.conversationConfig?.maxResponseLength || 200} characters
          </label>
          <input
            type="range"
            min="50"
            max="500"
            step="50"
            value={config.conversationConfig?.maxResponseLength || 200}
            onChange={(e) =>
              handleConfigChange({
                conversationConfig: {
                  ...config.conversationConfig,
                  maxResponseLength: parseInt(e.target.value),
                },
              })
            }
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Short</span>
            <span>Long</span>
          </div>
        </div>
      </div>

      {/* Saved Profiles */}
      {profiles.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Saved Profiles</h3>
          <div className="space-y-2">
            {profiles.map((profile) => (
              <div
                key={profile.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900"
              >
                <div className="flex items-center gap-2">
                  {profile.isDefault && (
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  )}
                  <div>
                    <div className="font-medium">{profile.name}</div>
                    <div className="text-xs text-gray-500">
                      {profile.config.agentId ? 'Configured' : 'No Agent ID'}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleLoadProfile(profile)}
                  >
                    Load
                  </Button>
                  {!profile.isDefault && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSetDefault(profile.id)}
                    >
                      <StarOff className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteProfile(profile.id)}
                    className="text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Save as Profile */}
      <div>
        {!showSaveProfile ? (
          <Button
            variant="outline"
            onClick={() => setShowSaveProfile(true)}
            className="w-full flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Save as Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              placeholder="Profile name"
              className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSaveAsProfile();
                }
              }}
            />
            <Button onClick={handleSaveAsProfile} disabled={!profileName.trim()}>
              Save
            </Button>
            <Button variant="outline" onClick={() => {
              setShowSaveProfile(false);
              setProfileName('');
            }}>
              Cancel
            </Button>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-4 border-t">
        <Button onClick={handleSave} className="flex-1 flex items-center gap-2">
          <Save className="w-4 h-4" />
          Save Configuration
        </Button>
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        )}
      </div>
    </div>
  );
}

