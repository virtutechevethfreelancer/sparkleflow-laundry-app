import React, { useState } from 'react';
import { Save, Store, Tag, MessageSquare, Database, Sparkles } from 'lucide-react';
import { ShopSettings, PriceList, NotificationConfig, ServiceType, SMSTemplate } from '../types';
import { GoogleGenAI } from "@google/genai";

// Initialize API for Settings component specifically for template generation
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface SettingsViewProps {
  shopSettings: ShopSettings;
  onUpdateShopSettings: (s: ShopSettings) => void;
  prices: PriceList;
  onUpdatePrices: (p: PriceList) => void;
  notificationConfig: NotificationConfig;
  onUpdateNotificationConfig: (n: NotificationConfig) => void;
  templates: SMSTemplate[];
  onUpdateTemplates: (t: SMSTemplate[]) => void;
  totalOrders: number;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  shopSettings,
  onUpdateShopSettings,
  prices,
  onUpdatePrices,
  notificationConfig,
  onUpdateNotificationConfig,
  templates,
  onUpdateTemplates,
  totalOrders,
}) => {
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);
  const [editedTemplateContent, setEditedTemplateContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handlePriceChange = (service: ServiceType, newPrice: string) => {
    const price = parseFloat(newPrice);
    if (!isNaN(price)) {
      onUpdatePrices({ ...prices, [service]: price });
    }
  };

  const handleEditTemplate = (template: SMSTemplate) => {
    setActiveTemplateId(template.id);
    setEditedTemplateContent(template.content);
  };

  const handleSaveTemplate = () => {
    if (activeTemplateId) {
      onUpdateTemplates(templates.map(t => 
        t.id === activeTemplateId ? { ...t, content: editedTemplateContent } : t
      ));
      setActiveTemplateId(null);
    }
  };

  const generateAIVariation = async () => {
    if (!editedTemplateContent) return;
    setIsGenerating(true);
    try {
        const prompt = `Rewrite this SMS template to be more ${notificationConfig.tone}: "${editedTemplateContent}". Keep placeholders like {customerName}, {orderId}, {totalAmount} intact.`;
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt
        });
        if (response.text) {
            setEditedTemplateContent(response.text.trim());
        }
    } catch (error) {
        console.error("Failed to generate", error);
    } finally {
        setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl pb-10">
      {/* Shop Details Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="bg-blue-100 p-2 rounded-lg">
            <Store className="h-5 w-5 text-blue-600" />
          </div>
          <h2 className="text-lg font-bold text-slate-800">Shop Profile</h2>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Shop Name</label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              value={shopSettings.name}
              onChange={(e) => onUpdateShopSettings({ ...shopSettings, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              value={shopSettings.phone}
              onChange={(e) => onUpdateShopSettings({ ...shopSettings, phone: e.target.value })}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              value={shopSettings.address}
              onChange={(e) => onUpdateShopSettings({ ...shopSettings, address: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Service Pricing Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
           <div className="bg-emerald-100 p-2 rounded-lg">
            <Tag className="h-5 w-5 text-emerald-600" />
          </div>
          <h2 className="text-lg font-bold text-slate-800">Service Pricing (Default per Unit)</h2>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.values(ServiceType).map((service) => (
            <div key={service} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
              <span className="font-medium text-slate-700">{service}</span>
              <div className="flex items-center">
                <span className="text-slate-500 mr-2">$</span>
                <input
                  type="number"
                  className="w-24 px-3 py-1.5 border border-slate-200 rounded-md text-right focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={prices[service]}
                  onChange={(e) => handlePriceChange(service, e.target.value)}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SMS Templates */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
         <div className="p-6 border-b border-slate-100 flex items-center gap-3">
           <div className="bg-purple-100 p-2 rounded-lg">
            <MessageSquare className="h-5 w-5 text-purple-600" />
          </div>
          <h2 className="text-lg font-bold text-slate-800">SMS Templates</h2>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Default Tone</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {['Professional', 'Friendly', 'Casual', 'Urgent'].map((tone) => (
                <button
                  key={tone}
                  onClick={() => onUpdateNotificationConfig({ ...notificationConfig, tone: tone as any })}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    notificationConfig.tone === tone
                      ? 'bg-purple-50 border-purple-200 text-purple-700'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {tone}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium text-slate-700">Templates</h3>
            <div className="grid grid-cols-1 gap-4">
                {templates.map(template => (
                    <div key={template.id} className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                        <div className="flex justify-between items-center mb-2">
                            <span className="font-semibold text-slate-700 text-sm bg-white px-2 py-1 rounded border border-slate-200 shadow-sm">{template.category}</span>
                            {activeTemplateId === template.id ? (
                                <div className="flex gap-2">
                                    <button 
                                        onClick={generateAIVariation}
                                        disabled={isGenerating}
                                        className="text-xs flex items-center text-purple-600 hover:bg-purple-50 px-2 py-1 rounded"
                                    >
                                        <Sparkles className={`h-3 w-3 mr-1 ${isGenerating ? 'animate-spin' : ''}`} />
                                        AI Rewrite
                                    </button>
                                    <button onClick={() => setActiveTemplateId(null)} className="text-xs text-slate-500 hover:text-slate-800">Cancel</button>
                                    <button onClick={handleSaveTemplate} className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">Save</button>
                                </div>
                            ) : (
                                <button onClick={() => handleEditTemplate(template)} className="text-xs text-blue-600 hover:underline">Edit</button>
                            )}
                        </div>
                        {activeTemplateId === template.id ? (
                            <textarea 
                                className="w-full p-2 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-blue-200 outline-none"
                                rows={3}
                                value={editedTemplateContent}
                                onChange={(e) => setEditedTemplateContent(e.target.value)}
                            />
                        ) : (
                            <p className="text-sm text-slate-600">{template.content}</p>
                        )}
                    </div>
                ))}
            </div>
            <p className="text-xs text-slate-500">Available placeholders: {'{customerName}'}, {'{orderId}'}, {'{totalAmount}'}, {'{shopName}'}</p>
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="bg-slate-100 p-2 rounded-lg">
            <Database className="h-5 w-5 text-slate-600" />
          </div>
          <h2 className="text-lg font-bold text-slate-800">Data Management</h2>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
               <h3 className="text-sm font-medium text-slate-500 mb-1">Total Orders</h3>
               <p className="text-2xl font-bold text-slate-800">{totalOrders}</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
               <h3 className="text-sm font-medium text-slate-500 mb-1">Database Status</h3>
               <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                  <p className="text-lg font-bold text-slate-800">Active (Local)</p>
               </div>
          </div>
        </div>
      </div>
    </div>
  );
};