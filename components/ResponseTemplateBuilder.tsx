'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ResponseTemplate } from '@/types';
import { saveTemplate, getTemplates, getDefaultTemplate } from '@/lib/storage';
import { FileText, X, Check } from 'lucide-react';

interface ResponseTemplateBuilderProps {
  onSelectTemplate: (template: ResponseTemplate) => void;
  onClose: () => void;
}

export default function ResponseTemplateBuilder({ onSelectTemplate, onClose }: ResponseTemplateBuilderProps) {
  const [showBuilder, setShowBuilder] = useState(false);
  const [templates, setTemplates] = useState<ResponseTemplate[]>(getTemplates());
  const [currentTemplate, setCurrentTemplate] = useState<ResponseTemplate>(getDefaultTemplate());
  const [templateName, setTemplateName] = useState('');

  const handleSaveTemplate = () => {
    if (!templateName.trim()) {
      alert('Please enter a template name');
      return;
    }

    const newTemplate: ResponseTemplate = {
      ...currentTemplate,
      id: `template-${Date.now()}`,
      name: templateName.trim(),
      createdAt: new Date().toISOString(),
    };

    saveTemplate(newTemplate);
    setTemplates(getTemplates());
    setShowBuilder(false);
    setTemplateName('');
    setCurrentTemplate(getDefaultTemplate());
  };

  const handleUseTemplate = (template: ResponseTemplate) => {
    onSelectTemplate(template);
    onClose();
  };

  const buildResponseFromTemplate = (template: ResponseTemplate): string => {
    return `${template.acknowledge}\n\n${template.reframe}\n\n${template.value}\n\n${template.nextStep}`;
  };

  return (
    <div className="space-y-4">
      {/* Template List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">Saved Templates</h3>
          <Button
            onClick={() => setShowBuilder(!showBuilder)}
            size="sm"
            variant="outline"
          >
            {showBuilder ? 'Cancel' : '+ New Template'}
          </Button>
        </div>

        {/* Default Template */}
        <Card className="cursor-pointer hover:bg-blue-50 transition-colors" onClick={() => handleUseTemplate(getDefaultTemplate())}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Default Framework</h4>
                <p className="text-xs text-gray-600 mt-1">Use the standard response framework</p>
              </div>
              <Button size="sm" variant="outline">Use</Button>
            </div>
          </CardContent>
        </Card>

        {/* Saved Templates */}
        {templates.length === 0 && !showBuilder && (
          <p className="text-sm text-gray-500 text-center py-4">
            No saved templates. Create one to get started!
          </p>
        )}

        {templates.map((template) => (
          <Card key={template.id} className="cursor-pointer hover:bg-blue-50 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{template.name}</h4>
                  <p className="text-xs text-gray-600 mt-1">
                    Created {new Date(template.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleUseTemplate(template)}
                  >
                    Use
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Template Builder */}
      {showBuilder && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <Card className="border-2 border-blue-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Create Response Template
              </CardTitle>
              <CardDescription>
                Build a response using the proven framework: Acknowledge, Reframe, Value, Next Step
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Template Name
                </label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="e.g., Price Objection Template"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    1. Acknowledge (Empathy)
                  </label>
                  <textarea
                    value={currentTemplate.acknowledge}
                    onChange={(e) => setCurrentTemplate({ ...currentTemplate, acknowledge: e.target.value })}
                    placeholder="Acknowledge the buyer's concern with empathy..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    2. Reframe (Perspective Shift)
                  </label>
                  <textarea
                    value={currentTemplate.reframe}
                    onChange={(e) => setCurrentTemplate({ ...currentTemplate, reframe: e.target.value })}
                    placeholder="Reframe the objection to show a different perspective..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    3. Value (Benefit)
                  </label>
                  <textarea
                    value={currentTemplate.value}
                    onChange={(e) => setCurrentTemplate({ ...currentTemplate, value: e.target.value })}
                    placeholder="Highlight the value or benefit to the buyer..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    4. Next Step (Call to Action)
                  </label>
                  <textarea
                    value={currentTemplate.nextStep}
                    onChange={(e) => setCurrentTemplate({ ...currentTemplate, nextStep: e.target.value })}
                    placeholder="End with a clear next step or call to action..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={2}
                  />
                </div>
              </div>

              {/* Preview */}
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Preview:</h4>
                <p className="text-sm text-gray-600 whitespace-pre-line">
                  {buildResponseFromTemplate(currentTemplate)}
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleSaveTemplate}
                  className="bg-blue-600 hover:bg-blue-700 flex-1"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Save Template
                </Button>
                <Button
                  onClick={() => {
                    setShowBuilder(false);
                    setTemplateName('');
                    setCurrentTemplate(getDefaultTemplate());
                  }}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

